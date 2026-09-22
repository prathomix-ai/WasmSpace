/**
 * Configurable Tiered Rate Limiter with Exponential Backoff
 *
 * Tiers:
 * 1. Auth routes (login, signup, password reset): Stricter limits, per-IP + per-account
 *    tracking, with exponential backoff rather than a hard permanent lockout.
 * 2. Public endpoints: Moderate sliding window limit per IP.
 * 3. Authenticated routes: Looser limit per authenticated user/session.
 *
 * All thresholds are configurable via environment variables with production defaults.
 */

export interface RateLimitConfig {
  authMaxAttempts: number;
  authWindowSec: number;
  authBaseBackoffSec: number;
  authMaxBackoffSec: number;
  publicMaxRequests: number;
  publicWindowSec: number;
  authenticatedMaxRequests: number;
  authenticatedWindowSec: number;
}

export function getRateLimitConfig(): RateLimitConfig {
  return {
    authMaxAttempts: Number(process.env.RATE_LIMIT_AUTH_MAX_ATTEMPTS) || 5,
    authWindowSec: Number(process.env.RATE_LIMIT_AUTH_WINDOW_SEC) || 60,
    authBaseBackoffSec: Number(process.env.RATE_LIMIT_AUTH_BASE_BACKOFF_SEC) || 2,
    authMaxBackoffSec: Number(process.env.RATE_LIMIT_AUTH_MAX_BACKOFF_SEC) || 60,
    publicMaxRequests: Number(process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS) || 60,
    publicWindowSec: Number(process.env.RATE_LIMIT_PUBLIC_WINDOW_SEC) || 60,
    authenticatedMaxRequests: Number(process.env.RATE_LIMIT_AUTHENTICATED_MAX_REQUESTS) || 180,
    authenticatedWindowSec: Number(process.env.RATE_LIMIT_AUTHENTICATED_WINDOW_SEC) || 60,
  };
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds to wait before retrying (when rejected)
  tier: "auth" | "public" | "authenticated";
  message?: string;
}

interface AuthAttemptState {
  count: number;
  windowStartTime: number;
  lastAttemptTime: number;
  excessFailures: number;
}

interface StandardWindowRecord {
  timestamps: number[];
}

// Bounded in-memory stores with LRU / eviction safety
const authStateStore = new Map<string, AuthAttemptState>();
const standardWindowStore = new Map<string, StandardWindowRecord>();
const MAX_STORE_ENTRIES = 10000;

function cleanupStores() {
  const now = Date.now();
  if (authStateStore.size > MAX_STORE_ENTRIES) {
    authStateStore.forEach((state, key) => {
      if (now - state.windowStartTime > 300000) {
        authStateStore.delete(key);
      }
    });
  }

  if (standardWindowStore.size > MAX_STORE_ENTRIES) {
    standardWindowStore.forEach((record, key) => {
      if (record.timestamps.length === 0 || now - record.timestamps[record.timestamps.length - 1] > 300000) {
        standardWindowStore.delete(key);
      }
    });
  }
}

/**
 * Check Rate Limit for Auth Routes using Exponential Backoff
 * Tracks both IP and Account identifier (e.g. email or username).
 *
 * Rather than a hard permanent lockout, once max attempts are exceeded,
 * requests are subject to an exponentially increasing delay:
 * baseBackoff * 2^(excess - 1) up to maxBackoff.
 */
export function checkAuthRateLimit(
  clientIp: string,
  accountIdentifier?: string | null
): RateLimitResult {
  cleanupStores();
  const config = getRateLimitConfig();
  const now = Date.now();

  // Keys for per-IP and per-account tracking
  const keys = [`auth:ip:${clientIp}`];
  if (accountIdentifier && accountIdentifier.trim()) {
    const cleanAccount = accountIdentifier.trim().toLowerCase().slice(0, 100);
    keys.push(`auth:account:${cleanAccount}`);
  }

  let worstRemaining = config.authMaxAttempts;
  let worstReset = Math.ceil((now + config.authWindowSec * 1000) / 1000);
  let maxRequiredDelay = 0;

  for (const key of keys) {
    let state = authStateStore.get(key);

    if (!state || now - state.windowStartTime > config.authWindowSec * 1000) {
      // Start a fresh window
      state = {
        count: 1,
        windowStartTime: now,
        lastAttemptTime: now,
        excessFailures: 0,
      };
      authStateStore.set(key, state);
      worstRemaining = Math.min(worstRemaining, config.authMaxAttempts - 1);
      continue;
    }

    // Within window
    const windowElapsedMs = now - state.windowStartTime;
    const windowRemainingSec = Math.max(1, Math.ceil((config.authWindowSec * 1000 - windowElapsedMs) / 1000));
    worstReset = Math.min(worstReset, Math.ceil(now / 1000) + windowRemainingSec);

    if (state.count < config.authMaxAttempts) {
      state.count += 1;
      state.lastAttemptTime = now;
      worstRemaining = Math.min(worstRemaining, config.authMaxAttempts - state.count);
      continue;
    }

    // Exceeded max attempts: Apply exponential backoff cooldown
    const delaySec = Math.min(
      config.authMaxBackoffSec,
      config.authBaseBackoffSec * Math.pow(2, state.excessFailures)
    );
    const elapsedSinceLastAttemptSec = (now - state.lastAttemptTime) / 1000;

    if (elapsedSinceLastAttemptSec < delaySec) {
      // Still in cooldown period - reject with remaining retry-after
      const waitTimeSec = Math.max(1, Math.ceil(delaySec - elapsedSinceLastAttemptSec));
      if (waitTimeSec > maxRequiredDelay) {
        maxRequiredDelay = waitTimeSec;
      }
    } else {
      // Cooldown satisfied: allow next attempt and increase backoff for subsequent attempt
      state.excessFailures += 1;
      state.lastAttemptTime = now;
      state.count += 1;
    }
  }

  if (maxRequiredDelay > 0) {
    return {
      allowed: false,
      limit: config.authMaxAttempts,
      remaining: 0,
      reset: worstReset,
      retryAfter: maxRequiredDelay,
      tier: "auth",
      message: `Too many authentication attempts. Please wait ${maxRequiredDelay} seconds before trying again.`,
    };
  }

  return {
    allowed: true,
    limit: config.authMaxAttempts,
    remaining: Math.max(0, worstRemaining),
    reset: worstReset,
    tier: "auth",
  };
}

/**
 * Check Rate Limit for Standard (Public or Authenticated) Endpoints
 * Uses a sliding window algorithm.
 */
export function checkStandardRateLimit(
  identifier: string,
  tier: "public" | "authenticated"
): RateLimitResult {
  cleanupStores();
  const config = getRateLimitConfig();
  const now = Date.now();

  const isAuth = tier === "authenticated";
  const limit = isAuth ? config.authenticatedMaxRequests : config.publicMaxRequests;
  const windowSec = isAuth ? config.authenticatedWindowSec : config.publicWindowSec;
  const windowMs = windowSec * 1000;

  const key = `${tier}:${identifier}`;
  let record = standardWindowStore.get(key);

  if (!record) {
    record = { timestamps: [now] };
    standardWindowStore.set(key, record);
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
      tier,
    };
  }

  // Filter timestamps within current sliding window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      reset: Math.ceil((now + retryAfter * 1000) / 1000),
      retryAfter,
      tier,
      message: `Request rate limit reached for ${tier} tier. Please slow down.`,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  const reset = Math.ceil((now + windowMs) / 1000);

  return {
    allowed: true,
    limit,
    remaining,
    reset,
    tier,
  };
}

/**
 * Unified User Subscription & PRO Status Helper
 * Provides a single source of truth for PRO vs FREE status across all UI components.
 */

export interface SubscriptionCheckOptions {
  tier?: string | null;
  isPro?: boolean | null;
}

/**
 * Synchronously checks whether the current user is on PRO tier.
 * Checks props, localStorage flags, cached user profiles, and development localhost defaults.
 */
export function checkIsProUser(options?: SubscriptionCheckOptions): boolean {
  // 1. Explicit prop overrides
  if (options?.isPro === true) return true;
  if (
    options?.tier &&
    (options.tier.toLowerCase() === "pro" ||
      options.tier.toLowerCase() === "enterprise" ||
      options.tier.toLowerCase() === "admin")
  ) {
    return true;
  }

  // If running in SSR environment, return false
  if (typeof window === "undefined") return false;

  // 2. Explicit developer override to force Free mode (for testing)
  if (
    localStorage.getItem("Prathomix_force_free") === "true" ||
    localStorage.getItem("Prathomix_tier") === "free"
  ) {
    return false;
  }

  // 3. Fast flag in localStorage
  if (localStorage.getItem("Prathomix_pro_status") === "true") {
    return true;
  }

  // 4. Cached user profiles in localStorage (from Supabase login or payment checkout)
  try {
    const stored =
      localStorage.getItem("prathomix_current_user") ||
      localStorage.getItem("prathomix_current_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const email = parsed?.email?.toLowerCase();
      const role = parsed?.role?.toLowerCase();
      const sub = parsed?.subscription_status?.toLowerCase();
      const t = parsed?.tier?.toLowerCase();
      const isProFlag = parsed?.is_pro;

      if (
        email === "admin@prathomix.tech" ||
        role === "admin" ||
        role === "pro" ||
        sub === "pro" ||
        sub === "active" ||
        t === "pro" ||
        t === "enterprise" ||
        isProFlag === true
      ) {
        return true;
      }
    }
  } catch {}

  // 5. Localhost / Local Development mode (matches LeftSidebar development convenience)
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return true;
  }

  return false;
}

/**
 * Returns effective tier string ('pro' or 'free')
 */
export function getEffectiveUserTier(options?: SubscriptionCheckOptions): "pro" | "free" {
  return checkIsProUser(options) ? "pro" : "free";
}

/**
 * Returns effective generation limit (300 for Pro, 15 for Free)
 */
export function getEffectiveQuotaLimit(
  options?: SubscriptionCheckOptions & { customLimit?: number }
): number {
  if (checkIsProUser(options)) return 300;
  return options?.customLimit && options.customLimit > 0 ? options.customLimit : 15;
}

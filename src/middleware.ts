import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkAuthRateLimit,
  checkStandardRateLimit,
  RateLimitResult,
} from "@/lib/rate-limiter";

/**
 * Extracts the real client IP address from standard CDN / reverse proxy headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Formats a 429 Too Many Requests response according to endpoint type.
 */
function createRateLimitResponse(
  request: NextRequest,
  rateResult: RateLimitResult
): NextResponse {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const retryAfterSec = String(rateResult.retryAfter || 60);

  const rateHeaders: Record<string, string> = {
    "Retry-After": retryAfterSec,
    "X-RateLimit-Limit": String(rateResult.limit),
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(rateResult.reset),
  };

  if (isApi) {
    return NextResponse.json(
      {
        success: false,
        error: rateResult.message || "Too many requests. Please slow down.",
        retryAfter: rateResult.retryAfter,
      },
      {
        status: 429,
        headers: rateHeaders,
      }
    );
  }

  // HTML response for page requests
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rate Limit Exceeded - MasmSpace (Powered by Prathomix)</title>
</head>
<body style="background:#09090b;color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:1.5rem;box-sizing:border-box;">
  <div style="text-align:center;padding:2.5rem;border:1px solid #27272a;border-radius:1.25rem;background:#111215;max-width:440px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);">
    <div style="font-size:2.5rem;margin-bottom:1rem;">⏳</div>
    <h2 style="color:#00f5ff;font-size:1.25rem;margin:0 0 0.75rem 0;font-weight:700;">Rate Limit Exceeded</h2>
    <p style="color:#a1a1aa;font-size:0.875rem;line-height:1.5;margin:0 0 1.25rem 0;">${rateResult.message || "Too many requests received."}</p>
    <div style="background:#18181b;padding:0.75rem 1rem;border-radius:0.75rem;border:1px solid #27272a;color:#71717a;font-size:0.8rem;font-family:monospace;">
      Retry allowed in: <span style="color:#e4e4e7;font-weight:600;">${rateResult.retryAfter || 60} seconds</span>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 429,
    headers: {
      ...rateHeaders,
      "Content-Type": "text/html",
    },
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const clientIp = getClientIp(request);

  // ─────────────────────────────────────────────────────────────────────────────
  // 0. WEBHOOK ROUTES EXEMPTION (Razorpay / Third-party secure webhooks)
  // Webhooks are verified cryptographically via HMAC-SHA256 signatures, not cookies.
  // ─────────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TIER 1: AUTHENTICATION ROUTES RATE LIMITING (Per-IP & Per-Account with Backoff)
  // ─────────────────────────────────────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/api/auth");

  if (isAuthRoute) {
    // Extract account identifier from query params or custom headers if available
    const accountId =
      request.nextUrl.searchParams.get("email") ||
      request.headers.get("x-auth-account") ||
      null;

    const authRateResult = checkAuthRateLimit(clientIp, accountId);
    if (!authRateResult.allowed) {
      return createRateLimitResponse(request, authRateResult);
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials are not configured or are placeholders, permit navigation
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("placeholder") ||
    supabaseUrl.includes("your-project-id")
  ) {
    return response;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Persistent Auth Session via @supabase/ssr
  // Must use cookies.getAll and cookies.setAll so tokens are not wiped across requests.
  // ─────────────────────────────────────────────────────────────────────────────
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. TIER 2 & TIER 3 RATE LIMITING: Authenticated vs Public Routes
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isAuthRoute) {
    const rateResult = user
      ? checkStandardRateLimit(user.id, "authenticated")
      : checkStandardRateLimit(clientIp, "public");

    if (!rateResult.allowed) {
      return createRateLimitResponse(request, rateResult);
    }

    // Attach RFC Rate Limit telemetry headers to successful response
    response.headers.set("X-RateLimit-Limit", String(rateResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateResult.remaining));
    response.headers.set("X-RateLimit-Reset", String(rateResult.reset));
  }

  // ── 1.1 Automatic Subscription Expiry Check ──────────────────────────────
  if (user) {
    const metaExpiry = user.user_metadata?.pro_expiry_date;
    if (metaExpiry && new Date(metaExpiry) < new Date()) {
      // Expired: demote to free tier in profiles
      Promise.resolve(
        supabase
          .from("profiles")
          .update({
            tier: "free",
            subscription_status: "free",
            is_pro: false,
            pro_expiry_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
      ).catch(() => {});
    }
  }

  // ── 2. Maintenance Mode Interceptor ─────────────────────────────────────
  const isMaintenanceExempt =
    pathname === "/maintenance" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/feature-flags");

  if (!isMaintenanceExempt) {
    try {
      const { data: flagRow } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("id", "maintenance_mode")
        .maybeSingle();

      const isMaintenanceActive = Boolean(flagRow?.enabled);

      if (isMaintenanceActive) {
        const cleanEmail = user?.email?.toLowerCase();
        let isSuperAdmin = cleanEmail === "admin@prathomix.tech";

        if (!isSuperAdmin && user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.role === "superadmin") {
            isSuperAdmin = true;
          }
        }

        if (!isSuperAdmin) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "MasmSpace is undergoing scheduled maintenance. Systems will resume shortly.",
                code: "MAINTENANCE_ACTIVE",
              },
              { status: 503 }
            );
          }

          const maintenanceUrl = new URL("/maintenance", request.url);
          const redirectResponse = NextResponse.redirect(maintenanceUrl);
          response.cookies.getAll().forEach((c) => {
            redirectResponse.cookies.set(c.name, c.value, c);
          });
          return redirectResponse;
        }
      }
    } catch {
      // If feature flag check fails, permit normal navigation
    }
  }

  // ── 3. Protected Route Check: /canvas/live-session (Live Collaboration) ──
  if (request.nextUrl.pathname.startsWith("/canvas/live-session")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      const targetPath = request.nextUrl.pathname + request.nextUrl.search;
      loginUrl.searchParams.set("next", targetPath);
      const redirectResponse = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  // ── 4. Protected Route Check: /admin (Strict Superadmin Only) ────────────
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Preserve refreshed cookies on redirect
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }

    const cleanEmail = user.email?.toLowerCase();

    // Direct Superadmin email fast-path
    if (cleanEmail === "admin@prathomix.tech") {
      return response;
    }

    // Role check in public.profiles table: strictly requires 'superadmin'
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || (profile.role !== "superadmin" && profile.role !== "admin")) {
      const unauthorizedUrl = new URL("/", request.url);
      unauthorizedUrl.searchParams.set("error", "forbidden_superadmin_required");
      const redirectResponse = NextResponse.redirect(unauthorizedUrl);
      response.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - pyodide worker & public static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|pyodide\\.worker\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|wasm)$).*)",
  ],
};

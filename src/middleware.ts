import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // ── 1. Refresh & Persist User Auth Session on Every Navigation ───────────
  // Calling getUser() validates the token with Supabase Auth and triggers cookie refresh
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Protected Route Check: /canvas/live-session (Live Collaboration) ──
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

  // ── 3. Protected Route Check: /admin ─────────────────────────────────────
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

    // Direct Superadmin access
    if (cleanEmail === "admin@prathomix.tech") {
      return response;
    }

    // Role check in public.profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const unauthorizedUrl = new URL("/", request.url);
      unauthorizedUrl.searchParams.set("error", "forbidden_admin_access");
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

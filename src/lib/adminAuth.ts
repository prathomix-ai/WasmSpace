import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SuperAdminAuthResult {
  authorized: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  errorResponse?: NextResponse;
}

const SUPERADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.SUPERADMIN_EMAILS
    ? process.env.SUPERADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

/**
 * Server-side guard strictly verifying that the caller possesses 'superadmin' privileges.
 * Validates Supabase authentication session tokens from cookies or Authorization header.
 *
 * Requirements:
 * - User must be authenticated in Supabase
 * - User must either have role === 'superadmin' in public.profiles OR email === 'admin@prathomix.tech'
 */
export async function verifySuperAdmin(
  req: NextRequest
): Promise<SuperAdminAuthResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let authenticatedUser: any = null;

  // 1. Check Bearer Token (if sent via Authorization header)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const adminClient = createAdminClient();
      const {
        data: { user },
        error: tokenErr,
      } = await adminClient.auth.getUser(token);

      if (!tokenErr && user) {
        authenticatedUser = user;
      }
    }
  }

  // 2. Fallback to SSR Cookie Session
  if (!authenticatedUser && supabaseUrl && supabaseAnonKey) {
    try {
      const ssrSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Read-only in API verification
          },
        },
      });

      const {
        data: { user },
      } = await ssrSupabase.auth.getUser();

      if (user) {
        authenticatedUser = user;
      }
    } catch {
      // Supabase SSR session parse failed
    }
  }

  // 3. If no session found in cookies or header, check query param in local dev mode only
  if (!authenticatedUser && process.env.NODE_ENV !== "production") {
    const { searchParams } = new URL(req.url);
    const paramEmail = searchParams.get("admin_email")?.trim().toLowerCase();
    if (paramEmail && SUPERADMIN_EMAILS.includes(paramEmail)) {
      authenticatedUser = {
        id: "dev-root-admin",
        email: paramEmail,
        user_metadata: { role: "superadmin" },
      };
    }
  }

  if (!authenticatedUser || !authenticatedUser.email) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Active Super Admin session required.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      ),
    };
  }

  const cleanEmail = authenticatedUser.email.toLowerCase();

  // 4. Root Super Admin Email Fast-Path
  if (SUPERADMIN_EMAILS.includes(cleanEmail) || cleanEmail === "admin@prathomix.tech") {
    return {
      authorized: true,
      user: {
        id: authenticatedUser.id,
        email: cleanEmail,
        role: "superadmin",
      },
    };
  }

  // 5. Query public.profiles to verify role === 'superadmin'
  try {
    const adminClient = createAdminClient();
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("id, email, role")
      .eq("id", authenticatedUser.id)
      .maybeSingle();

    if (!error && profile && profile.role === "superadmin") {
      return {
        authorized: true,
        user: {
          id: profile.id,
          email: profile.email || cleanEmail,
          role: "superadmin",
        },
      };
    }
  } catch (dbErr) {
    console.error("[verifySuperAdmin] Database verification notice:", dbErr);
  }

  // Explicit Forbidden response for non-superadmins
  return {
    authorized: false,
    errorResponse: NextResponse.json(
      {
        success: false,
        error: "Forbidden: Super Admin privileges ('role === superadmin') required.",
        code: "INSUFFICIENT_PRIVILEGES",
      },
      { status: 403 }
    ),
  };
}

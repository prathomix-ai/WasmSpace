import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";
import { verifySuperAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Super Admin Verification ──────────────────────────────────────
    const authCheck = await verifySuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const admin_email = authCheck.user?.email || "admin@prathomix.tech";
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid target user email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = createAdminClient();

    let updatedUser: any = null;
    let authUserId: string | null = null;

    // ── 2. Update Supabase Auth User Metadata ───────────────────────────────
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const authUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (authUser) {
        authUserId = authUser.id;
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata || {}),
            subscription_status: "free",
            is_pro: false,
            tier: "free",
          },
        });
      }
    } catch (authErr: any) {
      console.warn("[revoke-access] Auth admin warning:", authErr?.message);
    }

    // ── 3. Update public.profiles Table ────────────────────────────────────
    // NOTE: Role in public.profiles must be 'user' or 'admin', NEVER 'free'!
    try {
      let query = supabase.from("profiles").select("*");
      if (authUserId) {
        query = query.or(`id.eq.${authUserId},email.ilike.${cleanEmail}`);
      } else {
        query = query.ilike("email", cleanEmail);
      }
      const { data: existingProfile } = await query.maybeSingle();

      if (existingProfile) {
        const targetRole = existingProfile.role === "admin" ? "admin" : "user";
        const { data, error } = await supabase
          .from("profiles")
          .update({
            role: targetRole,
            subscription_status: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id)
          .select();

        if (error) {
          console.error("[revoke-access] Supabase update error:", error.message);
          throw error;
        } else if (data && data.length > 0) {
          updatedUser = data[0];
        }
      }
    } catch (dbErr: any) {
      console.error("[revoke-access] Supabase error:", dbErr?.message);
      return NextResponse.json(
        {
          success: false,
          error: `Database update failed: ${dbErr?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // ── 4. Update ai_usage_limits Table ────────────────────────────────────
    try {
      let limitQuery = supabase.from("ai_usage_limits").select("id");
      if (authUserId) {
        limitQuery = limitQuery.or(`user_email.ilike.${cleanEmail},user_id.eq.${authUserId}`);
      } else {
        limitQuery = limitQuery.ilike("user_email", cleanEmail);
      }
      const { data: existingLimit } = await limitQuery.maybeSingle();

      if (existingLimit?.id) {
        await supabase
          .from("ai_usage_limits")
          .update({
            tier: "free",
            action_limit: 15,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLimit.id);
      }
    } catch (limitErr: any) {
      console.warn("[revoke-access] AI usage limits warning:", limitErr?.message);
    }

    // ── 5. Sync with FastAPI Backend if Available ──────────────────────────
    try {
      fetch(`${AI_BACKEND_URL}/admin/revoke-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          admin_email,
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revoked access for ${cleanEmail}. Tier reset to 'free'.`,
      user: updatedUser || {
        email: cleanEmail,
        subscription_status: "free",
        role: "user",
      },
    });
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/admin/revoke-access]",
      "Failed to revoke access. Please check parameters and try again."
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

const ALLOWED_ADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, plan = "pro", admin_email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid target user email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanAdminEmail = admin_email ? admin_email.trim().toLowerCase() : "";

    const supabase = createAdminClient();

    // ── 1. Admin Verification ──────────────────────────────────────────────
    if (cleanAdminEmail) {
      let isAuthorized =
        ALLOWED_ADMIN_EMAILS.includes(cleanAdminEmail) ||
        cleanAdminEmail.endsWith("@prathomix.tech");

      if (!isAuthorized) {
        // Check if admin_email has role = 'admin' in profiles table
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("role")
          .ilike("email", cleanAdminEmail)
          .maybeSingle();

        if (adminProf?.role === "admin") {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admin privileges required." },
          { status: 403 }
        );
      }
    }

    const isFree = plan.toLowerCase() === "free";
    const status = isFree
      ? "free"
      : plan.toLowerCase() === "enterprise"
      ? "enterprise"
      : "pro";

    let updatedUser: any = null;

    // ── 2. Find or Provision User in Supabase Auth ─────────────────────────
    let authUserId: string | null = null;
    try {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      let authUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      // If user doesn't exist yet in auth.users, provision an invited/pre-confirmed user
      if (!authUser) {
        const { data: newAuthUser, error: createAuthErr } =
          await supabase.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              subscription_status: status,
              is_pro: !isFree,
              tier: status,
              role: "user",
            },
          });

        if (!createAuthErr && newAuthUser?.user) {
          authUser = newAuthUser.user;
        }
      }

      if (authUser) {
        authUserId = authUser.id;
        // Update auth metadata so client gets Pro instantly on session load
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...(authUser.user_metadata || {}),
            subscription_status: status,
            is_pro: !isFree,
            tier: status,
          },
        });
      }
    } catch (authErr: any) {
      console.warn("[grant-subscription] Auth admin warning:", authErr?.message);
    }

    // ── 3. Update public.profiles Table ────────────────────────────────────
    // NOTE: 'role' has constraint: check (role in ('user', 'admin')).
    // NEVER pass 'pro' or 'free' as 'role'! Subscription tier is 'subscription_status'.
    try {
      // Look up existing profile
      let query = supabase.from("profiles").select("*");
      if (authUserId) {
        query = query.or(`id.eq.${authUserId},email.ilike.${cleanEmail}`);
      } else {
        query = query.ilike("email", cleanEmail);
      }
      const { data: existingProfile } = await query.maybeSingle();

      if (existingProfile) {
        const preserveAdminRole = existingProfile.role === "admin" ? "admin" : "user";
        const { data: updatedRows, error: updateErr } = await supabase
          .from("profiles")
          .update({
            subscription_status: status,
            role: preserveAdminRole,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id)
          .select();

        if (updateErr) {
          console.error("[grant-subscription] Supabase profile update error:", updateErr);
          throw updateErr;
        }
        if (updatedRows && updatedRows.length > 0) {
          updatedUser = updatedRows[0];
        }
      } else if (authUserId) {
        // User profile doesn't exist yet, insert row linked to authUserId
        const { data: insertedRows, error: insertErr } = await supabase
          .from("profiles")
          .upsert({
            id: authUserId,
            email: cleanEmail,
            role: "user",
            subscription_status: status,
            updated_at: new Date().toISOString(),
          })
          .select();

        if (insertErr) {
          console.error("[grant-subscription] Supabase profile insert error:", insertErr);
          throw insertErr;
        }
        if (insertedRows && insertedRows.length > 0) {
          updatedUser = insertedRows[0];
        }
      }
    } catch (dbErr: any) {
      console.error("[grant-subscription] Database error:", dbErr);
      return NextResponse.json(
        {
          success: false,
          error: `Database update failed: ${dbErr?.message || "Unknown error"}`,
        },
        { status: 500 }
      );
    }

    // ── 4. Update or Insert ai_usage_limits Table ──────────────────────────
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
            tier: status,
            action_limit: isFree ? 15 : 99999,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLimit.id);
      } else {
        await supabase.from("ai_usage_limits").insert({
          user_email: cleanEmail,
          user_id: authUserId,
          tier: status,
          action_limit: isFree ? 15 : 99999,
          actions_used: 0,
          reset_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (limitErr: any) {
      console.warn("[grant-subscription] AI usage limits warning:", limitErr?.message);
    }

    // ── 5. Notify FastAPI Backend If Available (Non-blocking) ──────────────
    try {
      fetch(`${AI_BACKEND_URL}/admin/grant-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          plan,
          role: "pro",
          admin_email,
        }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${plan.toUpperCase()} subscription to ${cleanEmail}. Pro features are now active!`,
      user: updatedUser || {
        email: cleanEmail,
        subscription_status: status,
        role: "user",
      },
    });
  } catch (error: any) {
    console.error("Admin grant subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to grant subscription",
      },
      { status: 500 }
    );
  }
}

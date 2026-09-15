import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let currentUserId: string | null = null;

    // 1. Resolve user from cookies
    try {
      const serverSupabase = createServerSupabaseClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      if (user) currentUserId = user.id;
    } catch {}

    // Fallback to Bearer token
    if (!currentUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const adminSupabase = createAdminClient();
        const {
          data: { user: tokenUser },
        } = await adminSupabase.auth.getUser(token);
        if (tokenUser) currentUserId = tokenUser.id;
      }
    }

    if (!currentUserId) {
      return NextResponse.json({ authenticated: false, active: false });
    }

    const adminClient = createAdminClient();

    // 2. Fetch profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, tier, is_pro, subscription_status, pro_expiry_date")
      .eq("id", currentUserId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ authenticated: true, active: false });
    }

    // Admins never expire
    if (profile.role === "admin") {
      return NextResponse.json({
        authenticated: true,
        active: true,
        tier: "admin",
        is_pro: true,
        expired: false,
      });
    }

    // 3. Check for expired PRO access
    if (profile.pro_expiry_date) {
      const expiry = new Date(profile.pro_expiry_date);
      const now = new Date();

      if (expiry < now) {
        // Automatically demote to FREE tier and clear expiry date
        await adminClient
          .from("profiles")
          .update({
            tier: "free",
            subscription_status: "free",
            is_pro: false,
            pro_expiry_date: null,
            updated_at: now.toISOString(),
          })
          .eq("id", currentUserId);

        // Also clean up Auth metadata
        try {
          await adminClient.auth.admin.updateUserById(currentUserId, {
            user_metadata: {
              tier: "free",
              role: "user",
              subscription_status: "free",
              is_pro: false,
              pro_expiry_date: null,
            },
          });
        } catch {}

        return NextResponse.json({
          authenticated: true,
          active: false,
          expired: true,
          tier: "free",
          is_pro: false,
          message: "PRO subscription has expired. Reset to Free tier.",
        });
      }
    }

    const isPro = Boolean(
      profile.is_pro ||
      profile.tier === "pro" ||
      profile.tier === "enterprise" ||
      profile.subscription_status === "pro" ||
      profile.subscription_status === "active"
    );

    return NextResponse.json({
      authenticated: true,
      active: isPro,
      tier: profile.tier || (isPro ? "pro" : "free"),
      is_pro: isPro,
      expired: false,
      pro_expiry_date: profile.pro_expiry_date,
    });
  } catch (err: any) {
    console.error("[CheckSubscription] Error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}

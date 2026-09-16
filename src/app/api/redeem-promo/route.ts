import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const PROMO_CODE = "SaNdAk";
const PROMO_DURATION_MONTHS = 2;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, user_id, user_email } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Promo code is required." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    if (cleanCode !== PROMO_CODE) {
      return NextResponse.json(
        { success: false, error: "Invalid promo code. Please check and try again." },
        { status: 400 }
      );
    }

    // ── 1. Resolve Authenticated User ───────────────────────────────────────
    let currentUserId = user_id;
    let currentUserEmail = user_email;

    // Try extracting from server cookies
    try {
      const serverSupabase = createServerSupabaseClient();
      const {
        data: { user: cookieUser },
      } = await serverSupabase.auth.getUser();

      if (cookieUser) {
        currentUserId = cookieUser.id;
        currentUserEmail = cookieUser.email;
      }
    } catch {}

    // Fallback: Try Bearer token from headers
    if (!currentUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const adminSupabase = createAdminClient();
        const {
          data: { user: tokenUser },
        } = await adminSupabase.auth.getUser(token);
        if (tokenUser) {
          currentUserId = tokenUser.id;
          currentUserEmail = tokenUser.email;
        }
      }
    }

    if (!currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be signed in to redeem a promo code.",
        },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // ── 2. Fetch User Profile ───────────────────────────────────────────────
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", currentUserId)
      .maybeSingle();

    if (profileErr) {
      console.error("[RedeemPromo] Profile query error:", profileErr.message);
    }

    // ── 3. Single-Use Restriction Check ─────────────────────────────────────
    const existingUsedCodes: string[] = Array.isArray(profile?.used_promo_codes)
      ? profile.used_promo_codes
      : [];

    if (existingUsedCodes.includes(cleanCode)) {
      return NextResponse.json(
        {
          success: false,
          error: "This promo code has already been used.",
        },
        { status: 400 }
      );
    }

    // ── 4. Calculate Expiry Date (Exactly 2 Months from Now) ─────────────────
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + PROMO_DURATION_MONTHS);
    const expiryIso = expiryDate.toISOString();

    const updatedUsedCodes = Array.from(new Set([...existingUsedCodes, cleanCode]));

    // ── 5. Atomically Activate PRO on profiles table ─────────────────────────
    const currentRole = profile?.role === "admin" ? "admin" : "user";
    const { error: updateErr } = await adminClient.from("profiles").upsert(
      {
        id: currentUserId,
        email: currentUserEmail || profile?.email || "user@masmspace.online",
        role: currentRole,
        tier: "pro",
        subscription_status: "pro",
        is_pro: true,
        used_promo_codes: updatedUsedCodes,
        pro_expiry_date: expiryIso,
        updated_at: now.toISOString(),
      },
      { onConflict: "id" }
    );

    if (updateErr) {
      console.error("[RedeemPromo] Profile update failed:", updateErr.message);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to activate promo code. Please try again.",
        },
        { status: 500 }
      );
    }

    // ── 6. Sync Supabase Auth Metadata for immediate session propagation ────
    try {
      await adminClient.auth.admin.updateUserById(currentUserId, {
        user_metadata: {
          tier: "pro",
          role: currentRole === "admin" ? "admin" : "pro",
          subscription_status: "pro",
          is_pro: true,
          pro_expiry_date: expiryIso,
        },
      });
    } catch (authErr) {
      console.warn("[RedeemPromo] Auth metadata sync notice:", authErr);
    }

    return NextResponse.json({
      success: true,
      message: "PRO activated for 2 months!",
      tier: "pro",
      is_pro: true,
      pro_expiry_date: expiryIso,
    });
  } catch (err: any) {
    console.error("[RedeemPromo] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error during promo redemption.",
      },
      { status: 500 }
    );
  }
}

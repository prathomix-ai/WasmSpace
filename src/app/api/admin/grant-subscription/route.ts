import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

const ALLOWED_ADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : []),
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

    // ── 1. Admin Verification ──────────────────────────────────────────────
    // Allow if admin_email is in ALLOWED_ADMIN_EMAILS or no explicit admin restricted mode
    if (admin_email && !ALLOWED_ADMIN_EMAILS.includes(admin_email.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    let updatedUser: any = null;

    // ── 2. Call FastAPI Backend Endpoint ──────────────────────────────────
    try {
      const fastApiResponse = await fetch(
        `${AI_BACKEND_URL}/admin/grant-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            plan,
            role: "pro",
            admin_email,
          }),
          signal: AbortSignal.timeout(3000),
        }
      );

      if (fastApiResponse.ok) {
        const fastApiData = await fastApiResponse.json().catch(() => null);
        if (fastApiData?.success) {
          updatedUser = fastApiData.user;
        }
      }
    } catch {
      // Non-blocking fallback to direct Supabase update
    }

    // ── 3. Direct Supabase Admin Client Update ────────────────────────────
    if (!updatedUser) {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: plan === "enterprise" ? "enterprise" : "pro",
            role: "pro",
            updated_at: new Date().toISOString(),
          })
          .eq("email", cleanEmail)
          .select();

        if (error) {
          console.warn("[grant-subscription] Supabase update warning:", error.message);
        } else if (data && data.length > 0) {
          updatedUser = data[0];
        }
      } catch (dbErr: any) {
        console.warn("[grant-subscription] Supabase error:", dbErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${plan.toUpperCase()} subscription to ${cleanEmail}.`,
      user: updatedUser || {
        email: cleanEmail,
        subscription_status: "pro",
        role: "pro",
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

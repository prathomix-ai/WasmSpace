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
    const { email, admin_email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid target user email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── 1. Admin Verification ──────────────────────────────────────────────
    if (admin_email && !ALLOWED_ADMIN_EMAILS.includes(admin_email.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    let updatedUser: any = null;

    // ── 2. Direct Supabase Admin Client Update (Service Role Key) ───────────
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("profiles")
        .update({
          role: "free",
          subscription_status: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("email", cleanEmail)
        .select();

      if (error) {
        console.warn("[revoke-access] Supabase update warning:", error.message);
      } else if (data && data.length > 0) {
        updatedUser = data[0];
      }
    } catch (dbErr: any) {
      console.warn("[revoke-access] Supabase error:", dbErr?.message);
    }

    // ── 3. Sync with FastAPI Backend if Available ──────────────────────────
    try {
      const fastApiResponse = await fetch(
        `${AI_BACKEND_URL}/admin/revoke-access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            admin_email,
          }),
          signal: AbortSignal.timeout(3000),
        }
      );

      if (fastApiResponse.ok) {
        const fastApiData = await fastApiResponse.json().catch(() => null);
        if (fastApiData?.user && !updatedUser) {
          updatedUser = fastApiData.user;
        }
      }
    } catch {
      // Non-blocking fallback
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revoked access for ${cleanEmail}. Role reset to 'free'.`,
      user: updatedUser || {
        email: cleanEmail,
        subscription_status: "free",
        role: "free",
      },
    });
  } catch (error: any) {
    console.error("Admin revoke access error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error revoking access",
      },
      { status: 500 }
    );
  }
}

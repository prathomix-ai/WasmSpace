import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_ADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const admin_email = searchParams.get("admin_email")?.trim().toLowerCase();

    const supabase = createAdminClient();

    if (admin_email) {
      let isAuthorized =
        ALLOWED_ADMIN_EMAILS.includes(admin_email) ||
        admin_email.endsWith("@prathomix.tech");

      if (!isAuthorized) {
        const { data: adminProf } = await supabase
          .from("profiles")
          .select("role")
          .ilike("email", admin_email)
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

    // Fetch all profiles from Supabase using Service Role key
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profErr) {
      throw profErr;
    }

    return NextResponse.json({
      success: true,
      users: profiles || [],
    });
  } catch (error: any) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

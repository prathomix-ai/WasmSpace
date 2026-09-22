import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";
import { verifySuperAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const ALLOWED_ADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export async function GET(req: NextRequest) {
  try {
    // Strict Super Admin Verification
    const authCheck = await verifySuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();

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
    return handleApiError(
      error,
      "[GET /api/admin/users]",
      "Failed to fetch users. Please try again."
    );
  }
}

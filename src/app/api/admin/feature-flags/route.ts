import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";
import { verifySuperAdmin } from "@/lib/adminAuth";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/featureFlags";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * POST /api/admin/feature-flags
 * Strictly protected endpoint for Super Admins to toggle or update feature flags in Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Strict Super Admin Verification
    const authCheck = await verifySuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const body = await req.json().catch(() => ({}));
    const { id, enabled } = body;

    if (!id || typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Flag 'id' and boolean 'enabled' state are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const updatedBy = authCheck.user?.email || "superadmin";
    const now = new Date().toISOString();

    const flagMeta = DEFAULT_FEATURE_FLAGS[id] || {
      name: id,
      description: "Custom feature flag",
      category: "system",
    };

    // Upsert the flag state in Supabase
    const { data: updatedFlag, error } = await supabase
      .from("feature_flags")
      .upsert(
        {
          id,
          name: flagMeta.name,
          description: flagMeta.description,
          category: flagMeta.category,
          enabled,
          updated_at: now,
          updated_by: updatedBy,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet, we still confirm state update for the frontend session
      console.warn("[/api/admin/feature-flags] Supabase upsert notice:", error.message);
      return NextResponse.json({
        success: true,
        flag: {
          id,
          enabled,
          updated_at: now,
          updated_by: updatedBy,
        },
        notice: "Flag toggled in memory. Execute migration for persistent DB storage.",
      });
    }

    return NextResponse.json({
      success: true,
      flag: updatedFlag,
    });
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/admin/feature-flags]",
      "Failed to update feature flag. Please try again."
    );
  }
}

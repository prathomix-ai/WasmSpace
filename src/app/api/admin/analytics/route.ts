import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";
import { verifySuperAdmin } from "@/lib/adminAuth";
import { AnalyticsOverview } from "@/types/admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Super Admin Verification
    const authCheck = await verifySuperAdmin(req);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const supabase = createAdminClient();

    // 2. Query Profiles from Supabase
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, role, tier, subscription_status, is_pro, created_at, updated_at, last_sign_in_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const userList = profiles || [];
    const totalUsers = userList.length;

    // 3. Calculate Active PRO Members
    const activeProUsers = userList.filter((u) => {
      const isPro = Boolean(
        u.is_pro ||
        u.tier === "pro" ||
        u.tier === "enterprise" ||
        u.subscription_status === "active" ||
        u.subscription_status === "pro"
      );
      return isPro;
    });
    const activeProMembers = activeProUsers.length;
    const freeTierUsers = Math.max(0, totalUsers - activeProMembers);

    // 4. Calculate Daily Active Users (DAU) - active within the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const dailyActiveUsers = userList.filter((u) => {
      const lastActive = u.last_sign_in_at || u.updated_at || u.created_at;
      return lastActive && new Date(lastActive).toISOString() >= oneDayAgo;
    }).length;

    // 5. Calculate Metrics (MRR @ $19/mo base Pro, Conversion Rate, Growth)
    const mrr = activeProMembers * 19;
    const proConversionRate = totalUsers > 0 ? Number(((activeProMembers / totalUsers) * 100).toFixed(1)) : 0;

    // Calculate 7-day user signup growth rate
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newSignupsThisWeek = userList.filter((u) => u.created_at && u.created_at >= sevenDaysAgo).length;
    const previousSignups = Math.max(1, totalUsers - newSignupsThisWeek);
    const growthRatePercentage = Number(((newSignupsThisWeek / previousSignups) * 100).toFixed(1));

    // 6. Recent Registrations Telemetry
    const recentUsers = userList.slice(0, 8).map((u) => ({
      id: u.id,
      email: u.email || "anonymous@prathomix.user",
      role: u.role || "user",
      tier: u.tier || (u.is_pro ? "pro" : "free"),
      created_at: u.created_at || new Date().toISOString(),
    }));

    const overview: AnalyticsOverview = {
      totalUsers,
      activeProMembers,
      freeTierUsers,
      dailyActiveUsers: Math.max(dailyActiveUsers, 1), // At least current superadmin
      mrr,
      growthRatePercentage,
      proConversionRate,
      recentUsers,
    };

    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return handleApiError(
      error,
      "[GET /api/admin/analytics]",
      "Failed to load analytics overview. Please try again."
    );
  }
}

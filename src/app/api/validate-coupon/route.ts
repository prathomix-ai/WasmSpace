import { NextRequest, NextResponse } from "next/server";
import { validateAndApplyCoupon } from "@/lib/coupon";
import { CurrencyCode, BillingPlan } from "@/lib/currency";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, plan = "monthly", currency = "USD" } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Coupon code is required." },
        { status: 400 }
      );
    }

    const normalizedCurrency: CurrencyCode =
      String(currency).toUpperCase() === "INR" ? "INR" : "USD";
    const normalizedPlan: BillingPlan = plan === "yearly" ? "yearly" : "monthly";

    const result = validateAndApplyCoupon(code, normalizedPlan, normalizedCurrency);

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: result.error || "Invalid coupon code.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return handleApiError(
      err,
      "[POST /api/validate-coupon]",
      "Failed to validate coupon code. Please try again."
    );
  }
}

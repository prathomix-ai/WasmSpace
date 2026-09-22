import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";
import { validateAndApplyCoupon } from "@/lib/coupon";
import { getPlanPrice, CurrencyCode, BillingPlan } from "@/lib/currency";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    // ── 0. Strict Authentication Verification ────────────────────────────────
    let authenticatedUserId: string | null = null;
    let authenticatedUserEmail: string | null = null;

    try {
      const serverSupabase = createServerSupabaseClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        authenticatedUserId = user.id;
        authenticatedUserEmail = user.email || null;
      }
    } catch { }

    if (!authenticatedUserId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const adminSupabase = createAdminClient();
          const token = authHeader.replace("Bearer ", "").trim();
          const { data: { user: tokenUser } } = await adminSupabase.auth.getUser(token);
          if (tokenUser) {
            authenticatedUserId = tokenUser.id;
            authenticatedUserEmail = tokenUser.email || null;
          }
        } catch { }
      }
    }

    if (!authenticatedUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You must be logged in to create an upgrade checkout order.",
        },
        { status: 401 }
      );
    }

    const key_id =
      process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const body = await req.json().catch(() => ({}));
    const { plan = "monthly", currency = "USD", receipt, user_email, coupon_code } = body;
    const effectiveEmail = authenticatedUserEmail || user_email || "user@masmspace.tech";

    // ── 1. Normalize Multi-Currency & Plan ───────────────────────────────────
    const normalizedCurrency: CurrencyCode =
      String(currency).toUpperCase() === "INR" ? "INR" : "USD";
    const normalizedPlan: BillingPlan = plan === "yearly" ? "yearly" : "monthly";

    // ── 2. Calculate Subunits with Strict Backend Coupon Validation ─────────
    const basePlanPrice = getPlanPrice(normalizedPlan, normalizedCurrency);
    let amountInSubunits = basePlanPrice.subunits;
    let appliedCoupon: string | null = null;
    let discountPercent = 0;

    if (coupon_code && typeof coupon_code === "string" && coupon_code.trim()) {
      const couponResult = validateAndApplyCoupon(
        coupon_code,
        normalizedPlan,
        normalizedCurrency
      );

      if (!couponResult.valid) {
        return NextResponse.json(
          {
            success: false,
            error: couponResult.error || "Invalid coupon code.",
          },
          { status: 400 }
        );
      }

      amountInSubunits = couponResult.discountedSubunits || amountInSubunits;
      appliedCoupon = couponResult.code || null;
      discountPercent = couponResult.discountPercent || 0;
    }

    // ── 3. Attempt Order Creation via FastAPI Backend (Primary) ─────────────
    try {
      const fastApiResponse = await fetch(
        `${AI_BACKEND_URL}/create-razorpay-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: normalizedPlan,
            amount: amountInSubunits,
            currency: normalizedCurrency,
            receipt,
            user_email: effectiveEmail,
            user_id: authenticatedUserId,
            coupon_code: appliedCoupon,
            discount_percent: discountPercent,
          }),
          signal: AbortSignal.timeout(4000),
        }
      );

      if (fastApiResponse.ok) {
        const fastApiData = await fastApiResponse.json().catch(() => null);
        if (fastApiData && fastApiData.order_id) {
          return NextResponse.json({
            success: true,
            order_id: fastApiData.order_id,
            amount: fastApiData.amount,
            currency: fastApiData.currency,
            key_id: fastApiData.key_id || key_id,
            coupon_applied: appliedCoupon,
            discount_percent: discountPercent,
          });
        }
      }
    } catch {
      // FastAPI unreachable or timed out; fall through to direct Node Razorpay SDK
    }

    // ── 4. Node SDK Direct Integration ──────────────────────────────────────
    if (!key_id || !key_secret) {
      console.error("[create-order] Razorpay credentials missing on server.");
      return NextResponse.json(
        {
          success: false,
          error: "Payment service is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const receiptId =
      receipt ||
      `rcpt_${normalizedPlan}_${normalizedCurrency.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const options = {
      amount: amountInSubunits,
      currency: normalizedCurrency,
      receipt: receiptId,
      notes: {
        plan: normalizedPlan,
        currency: normalizedCurrency,
        base_price: basePlanPrice.amount,
        final_amount: amountInSubunits / 100,
        coupon_code: appliedCoupon || "NONE",
        discount_percent: discountPercent,
        user_email: effectiveEmail,
        user_id: authenticatedUserId,
        service: "MasmSpace Pro (Powered by PRATHOMIX)",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
      coupon_applied: appliedCoupon,
      discount_percent: discountPercent,
    });
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/create-order]",
      "Failed to create payment order. Please try again later.",
      error?.statusCode || 500
    );
  }
}

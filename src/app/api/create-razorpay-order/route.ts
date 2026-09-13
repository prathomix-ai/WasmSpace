import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const key_id =
      process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const body = await req.json().catch(() => ({}));
    const { plan = "monthly", currency: _currency = "INR", receipt, user_email } = body;
    const isYearly = plan === "yearly";

    // ── 1. Calculate Amount in Currency Lowest Subunits (* 100) ─────────────
    // TODO: REVERT TO $5 PRICING AFTER TESTING
    // Temporarily hardcoded for live verification testing: 1 INR = 100 paise
    const amountInSubunits = 100;
    const rawCurrency = "INR";

    // ── 2. Attempt Order Creation via FastAPI Backend (Primary) ─────────────
    try {
      const fastApiResponse = await fetch(
        `${AI_BACKEND_URL}/create-razorpay-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            amount: amountInSubunits,
            currency: rawCurrency,
            receipt,
            user_email,
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
          });
        }
      }
    } catch {
      // FastAPI unreachable or timed out; fall through to direct Node Razorpay SDK
    }

    // ── 3. Node SDK Fallback ───────────────────────────────────────────────
    if (!key_id || !key_secret) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay credentials not configured in environment (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)",
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const receiptId =
      receipt ||
      `rcpt_${plan}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const options = {
      amount: amountInSubunits,
      currency: rawCurrency,
      receipt: receiptId,
      notes: {
        plan,
        base_price: isYearly ? 49 : 5,
        user_email: user_email || "",
        service: "PRATHOMIX MasmSpace Pro",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during order creation",
        detail: error?.description || null,
      },
      { status: error?.statusCode || 500 }
    );
  }
}

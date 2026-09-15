import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    const { plan = "monthly", currency = "USD", amount, receipt, user_email } = body;
    const isYearly = plan === "yearly";
    const effectiveEmail = authenticatedUserEmail || user_email || "user@masmspace.online";

    // ── 1. Normalize Multi-Currency & Subunit Amounts (* 100) ───────────────
    const normalizedCurrency: "USD" | "INR" =
      String(currency).toUpperCase() === "INR" ? "INR" : "USD";

    let amountInSubunits: number;
    if (amount && Number(amount) > 0) {
      amountInSubunits = Math.round(Number(amount));
    } else {
      // USD: $5/mo -> 500 cents, $49/yr -> 4900 cents
      // INR: ₹149/mo -> 14900 paise, ₹1499/yr -> 149900 paise
      if (normalizedCurrency === "INR") {
        amountInSubunits = isYearly ? 149900 : 14900;
      } else {
        amountInSubunits = isYearly ? 4900 : 500;
      }
    }

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
            currency: normalizedCurrency,
            receipt,
            user_email: effectiveEmail,
            user_id: authenticatedUserId,
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
      `rcpt_${plan}_${normalizedCurrency.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const options = {
      amount: amountInSubunits,
      currency: normalizedCurrency,
      receipt: receiptId,
      notes: {
        plan,
        currency: normalizedCurrency,
        base_price: normalizedCurrency === "INR" ? (isYearly ? 1499 : 149) : (isYearly ? 49 : 5),
        user_email: effectiveEmail,
        user_id: authenticatedUserId,
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

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured in environment" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { plan = "monthly", currency = "USD", receipt } = body;
    const isYearly = plan === "yearly";

    // ── Razorpay Subunit (Smallest Unit) Amount Calculation ─────────────────
    // Razorpay strictly requires amounts in lowest currency subunit (cents for USD, paise for INR)
    // Monthly: $5.00  -> 500 cents (or 42,000 paise)
    // Yearly:  $49.00 -> 4900 cents (or 410,000 paise)
    const rawCurrency = (currency || "USD").toUpperCase();
    let amountInSubunits: number;

    if (rawCurrency === "INR") {
      // INR: ₹420 (≈ $5) = 42,000 paise, ₹4,100 (≈ $49) = 410,000 paise
      if (body.amount !== undefined && Number(body.amount) >= 100) {
        amountInSubunits = Math.round(Number(body.amount));
      } else {
        const inrRupees = isYearly ? 4100 : 420;
        amountInSubunits = inrRupees * 100;
      }
    } else {
      // USD / International:
      // Critical Fix: prevent $5 from being treated as 5 cents/paise
      if (body.amount !== undefined && Number(body.amount) >= 100) {
        amountInSubunits = Math.round(Number(body.amount));
      } else if (body.amount !== undefined && Number(body.amount) > 0 && Number(body.amount) < 100) {
        amountInSubunits = Math.round(Number(body.amount) * 100);
      } else {
        amountInSubunits = isYearly ? 4900 : 500;
      }
    }

    // Minimum 100 subunits validation (Razorpay requirement)
    if (isNaN(amountInSubunits) || amountInSubunits < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 subunits (100 cents / 100 paise)" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const receiptId =
      receipt || `rcpt_${plan}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const options = {
      amount: amountInSubunits,
      currency: currency.toUpperCase(),
      receipt: receiptId,
      notes: {
        plan,
        base_price: isYearly ? 49 : 5,
        service: "PRATHOMIX MasmSpace Pro",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id,
    });
  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);

    // Specific currency unsupported warning
    if (error?.statusCode === 400 && error?.error?.description?.includes("currency")) {
      return NextResponse.json(
        {
          error: `${error.error.description}. Try fallback currency: 'INR'.`,
          code: "CURRENCY_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR") {
      return NextResponse.json(
        { error: error?.error?.description || "Razorpay authentication or validation failure" },
        { status: error?.statusCode || 401 }
      );
    }

    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}

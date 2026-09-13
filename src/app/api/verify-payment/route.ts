import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json(
        { success: false, error: "Razorpay key secret not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_email,
      plan = "pro",
    } = body;

    // Missing fields validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required",
        },
        { status: 400 }
      );
    }

    // ── 1. Cryptographic HMAC-SHA256 Signature Verification ────────────────
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(payload)
      .digest("hex");

    const isMatch =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, "utf-8"),
        Buffer.from(razorpay_signature, "utf-8")
      );

    if (!isMatch) {
      console.warn("Razorpay Signature Mismatch:", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Signature mismatch. Verification failed.",
        },
        { status: 400 }
      );
    }

    // ── 2. Sync with FastAPI Backend if Available ─────────────────────────
    try {
      await fetch(`${AI_BACKEND_URL}/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          user_email,
          plan,
        }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => null);
    } catch {
      // Non-blocking
    }

    // ── 3. Update Supabase Profile: set subscription_status = 'active' ─────
    let dbUpdated = false;
    if (user_email) {
      try {
        const supabase = createAdminClient();
        const cleanEmail = user_email.trim().toLowerCase();

        // Attempt update in profiles
        const { data, error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "pro", // or 'active'
            role: "pro",
            updated_at: new Date().toISOString(),
          })
          .eq("email", cleanEmail)
          .select();

        if (error) {
          console.warn("[verify-payment] Supabase update warning:", error.message);
        } else if (data && data.length > 0) {
          dbUpdated = true;
        }
      } catch (dbErr) {
        console.error("[verify-payment] Supabase exception:", dbErr);
      }
    }

    // ── 4. Return Successful Response ─────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully and subscription activated",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      subscription_status: "active",
      db_updated: dbUpdated,
    });
  } catch (error: any) {
    console.error("Razorpay Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during verification",
      },
      { status: 500 }
    );
  }
}

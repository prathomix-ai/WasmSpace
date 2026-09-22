import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      console.error("[verify-payment] RAZORPAY_KEY_SECRET is not configured on server.");
      return NextResponse.json(
        { success: false, error: "Payment verification service is temporarily unavailable." },
        { status: 503 }
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

    // ── 3. Check Webhook Activation / Fallback Sync ─────────────────────────
    const supabase = createAdminClient();
    let alreadyActivatedByWebhook = false;

    if (user_email) {
      try {
        const cleanEmail = user_email.trim().toLowerCase();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, is_pro, subscription_status, role, pro_expiry_date")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (profile && (profile.is_pro || profile.subscription_status === "pro")) {
          alreadyActivatedByWebhook = true;
        } else if (profile) {
          // Fallback sync (primarily for localhost development where webhooks cannot reach local server)
          console.log(
            `[verify-payment] Webhook has not activated user yet or in local dev. Applying fallback sync for ${cleanEmail}.`
          );

          const now = new Date();
          const expiryDate = new Date(now);
          if (plan === "yearly") {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          } else {
            expiryDate.setDate(expiryDate.getDate() + 30);
          }
          const expiryIso = expiryDate.toISOString();

          await supabase
            .from("profiles")
            .update({
              subscription_status: "pro",
              role: profile.role === "admin" ? "admin" : "pro",
              tier: "pro",
              is_pro: true,
              pro_expiry_date: expiryIso,
              updated_at: now.toISOString(),
            })
            .eq("id", profile.id);

          try {
            await supabase.auth.admin.updateUserById(profile.id, {
              user_metadata: {
                tier: "pro",
                role: profile.role === "admin" ? "admin" : "pro",
                subscription_status: "pro",
                is_pro: true,
                pro_expiry_date: expiryIso,
              },
            });
          } catch {}
        }
      } catch (dbErr) {
        console.error("[verify-payment] Database verification error:", dbErr);
      }
    }

    // ── 4. Return Successful Response ─────────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      subscription_status: "active",
      webhook_confirmed: alreadyActivatedByWebhook,
    });
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/verify-payment]",
      "Payment verification failed. Please contact support if payment was deducted."
    );
  }
}

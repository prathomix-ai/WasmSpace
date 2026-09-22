import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * Enterprise Razorpay Webhook Handler
 * Single Source of Truth for Granting & Extending PRO Subscriptions.
 * Listens for payment.captured, order.paid, and subscription.charged.
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      console.error(
        "[Razorpay Webhook] CRITICAL: Neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_KEY_SECRET is set."
      );
      return NextResponse.json(
        { error: "Webhook secret is not configured on server." },
        { status: 500 }
      );
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      console.warn("[Razorpay Webhook] Rejected: Missing x-razorpay-signature header.");
      return NextResponse.json(
        { error: "Missing signature header." },
        { status: 400 }
      );
    }

    // ── 1. Read Raw Body for Exact Cryptographic HMAC Verification ─────────
    const rawBody = await req.text();

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const isMatch =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8")
      );

    if (!isMatch) {
      console.warn("[Razorpay Webhook] Cryptographic signature mismatch!");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // ── 2. Parse Validated JSON Payload ────────────────────────────────────
    let eventPayload: any;
    try {
      eventPayload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const event = eventPayload.event;
    console.log(`[Razorpay Webhook] Received validated event: ${event}`);

    const supabase = createAdminClient();

    // ── 3. Handle Payment Captured & Subscription Charged ──────────────────
    if (
      event === "payment.captured" ||
      event === "order.paid" ||
      event === "subscription.charged"
    ) {
      const paymentEntity =
        eventPayload?.payload?.payment?.entity ||
        eventPayload?.payload?.order?.entity ||
        {};

      const paymentId = paymentEntity.id || null;
      const orderId = paymentEntity.order_id || paymentEntity.id || null;
      const amount = paymentEntity.amount ? paymentEntity.amount / 100 : 0;
      const currency = paymentEntity.currency || "USD";
      const notes = paymentEntity.notes || {};

      const userIdFromNotes = notes.user_id || null;
      const userEmailFromNotes = notes.user_email || paymentEntity.email || null;
      const plan = (notes.plan || "monthly").toLowerCase();
      const couponCode = notes.coupon_code && notes.coupon_code !== "NONE" ? notes.coupon_code : null;
      const discountPercent = Number(notes.discount_percent) || 0;

      // Deduplication: Check if payment already processed in public.payments
      if (paymentId) {
        try {
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id, status")
            .eq("razorpay_payment_id", paymentId)
            .maybeSingle();

          if (existingPayment && existingPayment.status === "captured") {
            console.log(
              `[Razorpay Webhook] Payment ${paymentId} already processed idempotently. Skipping activation.`
            );
            return NextResponse.json({ status: "ok", note: "already_processed" }, { status: 200 });
          }
        } catch {
          // Table might not exist yet or connection issue, proceed safely
        }
      }

      // Find user in profiles
      let targetProfile: any = null;
      if (userIdFromNotes) {
        const { data: pById } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userIdFromNotes)
          .maybeSingle();
        targetProfile = pById;
      }

      if (!targetProfile && userEmailFromNotes) {
        const cleanEmail = userEmailFromNotes.trim().toLowerCase();
        const { data: pByEmail } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", cleanEmail)
          .maybeSingle();
        targetProfile = pByEmail;
      }

      const targetUserId = targetProfile?.id || userIdFromNotes;
      const targetUserEmail = targetProfile?.email || userEmailFromNotes;

      // ── 4. Calculate Expiry Date ─────────────────────────────────────────
      const now = new Date();
      let baseDate = now;

      // If user already has an active PRO expiry in the future, extend it
      if (targetProfile?.pro_expiry_date) {
        const existingExpiry = new Date(targetProfile.pro_expiry_date);
        if (existingExpiry > now) {
          baseDate = existingExpiry;
        }
      }

      const expiryDate = new Date(baseDate);
      if (plan === "yearly") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        expiryDate.setDate(expiryDate.getDate() + 30);
      }
      const expiryIso = expiryDate.toISOString();

      // ── 5. Atomically Activate PRO in Supabase profiles ──────────────────
      if (targetUserId) {
        const currentRole = targetProfile?.role === "admin" ? "admin" : "pro";

        const updatePayload: Record<string, any> = {
          tier: "pro",
          subscription_status: "pro",
          is_pro: true,
          role: currentRole,
          pro_expiry_date: expiryIso,
          updated_at: now.toISOString(),
        };

        if (targetUserEmail && !targetProfile?.email) {
          updatePayload.email = targetUserEmail;
        }

        const { error: updateErr } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", targetUserId);

        if (updateErr) {
          console.error("[Razorpay Webhook] Failed to update profile:", updateErr.message);
        } else {
          console.log(
            `[Razorpay Webhook] SUCCESS: User ${targetUserId} upgraded to PRO until ${expiryIso}`
          );
        }

        // Sync Supabase Auth user metadata
        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: {
              tier: "pro",
              role: currentRole,
              subscription_status: "pro",
              is_pro: true,
              pro_expiry_date: expiryIso,
            },
          });
        } catch (authErr) {
          console.warn("[Razorpay Webhook] Auth metadata sync notice:", authErr);
        }
      } else {
        console.warn(
          "[Razorpay Webhook] Warning: Could not locate user ID or email to activate PRO.",
          { userIdFromNotes, userEmailFromNotes }
        );
      }

      // ── 6. Log Transaction in payments Table (Audit & Idempotency) ────────
      try {
        await supabase.from("payments").insert({
          user_id: targetUserId,
          user_email: targetUserEmail || "unknown@masmspace.tech",
          razorpay_order_id: orderId || "none",
          razorpay_payment_id: paymentId,
          amount,
          currency,
          plan,
          coupon_code: couponCode,
          discount_percent: discountPercent,
          status: "captured",
          event_type: event,
          raw_payload: eventPayload,
        });
      } catch (logErr) {
        console.warn("[Razorpay Webhook] Audit log notice:", logErr);
      }

      return NextResponse.json({
        status: "ok",
        processed: true,
        event,
        payment_id: paymentId,
      });
    }

    // ── 7. Handle Payment Failed ───────────────────────────────────────────
    if (event === "payment.failed") {
      const paymentEntity = eventPayload?.payload?.payment?.entity || {};
      const paymentId = paymentEntity.id || null;
      const orderId = paymentEntity.order_id || null;
      const notes = paymentEntity.notes || {};

      console.warn(`[Razorpay Webhook] Payment failed: ${paymentId}`, {
        errorCode: paymentEntity.error_code,
        errorDesc: paymentEntity.error_description,
      });

      try {
        await supabase.from("payments").insert({
          user_id: notes.user_id || null,
          user_email: notes.user_email || paymentEntity.email || "unknown@masmspace.tech",
          razorpay_order_id: orderId || "none",
          razorpay_payment_id: paymentId,
          amount: paymentEntity.amount ? paymentEntity.amount / 100 : 0,
          currency: paymentEntity.currency || "USD",
          plan: notes.plan || "monthly",
          status: "failed",
          event_type: event,
          raw_payload: eventPayload,
        });
      } catch {}

      return NextResponse.json({ status: "ok", received: true, event });
    }

    // Default acknowledge for other events
    return NextResponse.json({ status: "ok", received: true, event });
  } catch (err: any) {
    console.error("[Razorpay Webhook] Unhandled exception:", err);
    // Return 500 so Razorpay knows to retry if an unexpected infrastructure crash occurs
    return NextResponse.json(
      { error: "Internal webhook processing error." },
      { status: 500 }
    );
  }
}

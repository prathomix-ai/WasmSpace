"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode, getPlanPrice, PRICING_CONFIG } from "@/lib/currency";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface CheckoutProps {
  plan?: "monthly" | "yearly";
  amount?: number;
  currency?: CurrencyCode;
  userEmail?: string;
  userName?: string;
  buttonText?: string;
  className?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

export function Checkout({
  plan = "monthly",
  amount,
  currency = "USD",
  userEmail,
  userName = "MasmSpace Creator",
  buttonText,
  className = "",
  onSuccess,
  onError,
}: CheckoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);

  // 1. Dynamic Razorpay Script Loader
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 2. Main Checkout Trigger with Strict Session Check
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // ── STRICT AUTHENTICATION GUARD ──────────────────────────────────────────
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const { data: userData } = await supabase.auth.getUser();
      const authenticatedUser = userData?.user || session?.user;

      if (!authenticatedUser) {
        setIsLoading(false);
        const authMsg = "Authentication required. Please log in before upgrading to PRO.";
        setErrorMessage(authMsg);
        onError?.(authMsg);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-auth-modal"));
          const target = window.location.pathname.startsWith("/pricing")
            ? "/pricing"
            : window.location.pathname + window.location.search;
          router.push(`/login?next=${encodeURIComponent(target || "/pricing")}`);
        }
        return;
      }

      const activeEmail = userEmail || authenticatedUser.email || "";
      const activeName = userName || authenticatedUser.user_metadata?.name || "MasmSpace Creator";

      // Dynamically load Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg = "Unable to load Razorpay Checkout SDK. Please check your internet connection.";
        setErrorMessage(msg);
        onError?.(msg);
        setIsLoading(false);
        return;
      }

      // Step 1: Create Order via Backend API (/api/create-razorpay-order or fallback /api/create-order)
      const planDetails = getPlanPrice(plan, currency);
      const orderAmount = amount || planDetails.subunits;
      const orderCurrency = currency;

      let orderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          amount: orderAmount,
          currency: orderCurrency,
          user_email: activeEmail,
        }),
      });

      if (!orderRes.ok) {
        orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            amount: orderAmount,
            currency: orderCurrency,
            user_email: activeEmail,
          }),
        });
      }

      const orderData = await orderRes.json().catch(() => null);

      if (!orderRes.ok || !orderData?.order_id) {
        const errorDetail =
          orderData?.error || orderData?.detail || "Failed to initialize order with server.";
        setErrorMessage(errorDetail);
        onError?.(errorDetail);
        setIsLoading(false);
        return;
      }

      // Step 2: Open Razorpay Overlay Modal
      const activeCurrency = orderData.currency || orderCurrency;
      const descriptionText =
        activeCurrency === "INR"
          ? (plan === "yearly"
              ? "MasmSpace Pro Annual Membership (₹4,100/yr)"
              : "MasmSpace Pro Monthly Membership (₹420/mo)")
          : (plan === "yearly"
              ? "MasmSpace Pro Annual Membership ($49/yr)"
              : "MasmSpace Pro Monthly Membership ($5/mo)");

      const options = {
        key:
          orderData.key_id ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_Ta2kWl9IX7CgkT",
        amount: orderData.amount || orderAmount,
        currency: activeCurrency,
        name: "MasmSpace PRO",
        description: descriptionText,
        order_id: orderData.order_id,
        theme: {
          color: "#00f5ff",
        },
        prefill: {
          name: activeName,
          email: activeEmail,
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
        // Step 3: Signature Verification Callback
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_email: userEmail,
                plan,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => null);

            // ONLY update and show success when signature is cryptographically verified
            if (verifyRes.ok && verifyData?.success) {
              setSuccessPaymentId(response.razorpay_payment_id);

              // Update local state and refresh Supabase auth session
              try {
                const stored =
                  localStorage.getItem("masmspace_current_user") ||
                  localStorage.getItem("wasmspace_current_user");
                if (stored) {
                  const user = JSON.parse(stored);
                  user.role = "pro";
                  user.subscription_status = "active";
                  localStorage.setItem("masmspace_current_user", JSON.stringify(user));
                }

                const supabase = createClient();
                await supabase.auth.getUser();
              } catch {}

              onSuccess?.(response.razorpay_payment_id);

              // Refresh user session after brief acknowledgment
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } else {
              const errMsg =
                verifyData?.error || "Payment signature verification failed.";
              setErrorMessage(errMsg);
              onError?.(errMsg);
            }
          } catch (verifyErr: any) {
            const errMsg = verifyErr?.message || "Error verifying payment signature.";
            setErrorMessage(errMsg);
            onError?.(errMsg);
          } finally {
            setIsLoading(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (failResponse: any) {
        const failMsg =
          failResponse?.error?.description || "Payment failed or was canceled.";
        setErrorMessage(failMsg);
        onError?.(failMsg);
        setIsLoading(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Checkout process error:", err);
      const msg = err?.message || "An unexpected error occurred during checkout.";
      setErrorMessage(msg);
      onError?.(msg);
      setIsLoading(false);
    }
  };

  const planInfo = getPlanPrice(plan, currency);
  const defaultButtonLabel = `Upgrade to Pro — ${planInfo.label}`;

  if (successPaymentId) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-xs font-mono">
          <div className="font-bold text-white">Payment Verified! Welcome to PRO.</div>
          <div className="text-emerald-400/80 text-[10px]">Payment ID: {successPaymentId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={
          className ||
          `w-full py-3.5 px-6 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black border-cyan-400/40 shadow-[0_0_20px_rgba(0,245,255,0.25)] hover:shadow-[0_0_30px_rgba(0,245,255,0.45)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-black text-black" />
            <span>{buttonText || defaultButtonLabel}</span>
          </>
        )}
      </button>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>256-Bit Encrypted Razorpay Checkout</span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Checkout;

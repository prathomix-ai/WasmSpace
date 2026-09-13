"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface CheckoutProps {
  plan?: "monthly" | "yearly";
  amount?: number;
  currency?: "USD" | "INR";
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // 2. Main Checkout Trigger
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg = "Unable to load Razorpay Checkout SDK. Please check your internet connection.";
        setErrorMessage(msg);
        onError?.(msg);
        setIsLoading(false);
        return;
      }

      // Step 1: Create Order via Backend API
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          amount,
          currency,
          user_email: userEmail,
        }),
      });

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
      const options = {
        key:
          orderData.key_id ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_Ta2kWl9IX7CgkT",
        amount: orderData.amount,
        currency: orderData.currency || currency,
        name: "MasmSpace Pro",
        description:
          plan === "yearly"
            ? "MasmSpace Pro Annual Membership ($49/yr)"
            : "MasmSpace Pro Monthly Membership ($5/mo)",
        order_id: orderData.order_id,
        theme: {
          color: "#00f5ff",
        },
        prefill: {
          name: userName,
          email: userEmail || "creator@masmspace.ai",
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

            if (verifyRes.ok && verifyData?.success) {
              // Update local state for immediate UI activation
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
              } catch {}

              onSuccess?.(response.razorpay_payment_id);
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

  const defaultButtonLabel =
    plan === "yearly" ? "Upgrade to Pro — $49/yr" : "Upgrade to Pro — $5/mo";

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={
          className ||
          `w-full py-3.5 px-6 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border bg-gradient-to-r from-neon-cyan/20 via-cyan-500/10 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 text-neon-cyan border-neon-cyan/40 shadow-[0_0_20px_rgba(0,245,255,0.15)] hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed`
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
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

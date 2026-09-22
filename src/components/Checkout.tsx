"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Tag,
  X,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CurrencyCode, getPlanPrice } from "@/lib/currency";
import { CouponValidationResult } from "@/lib/coupon";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export type CheckoutStep =
  | "idle"
  | "authenticating"
  | "creating_order"
  | "awaiting_payment"
  | "verifying_webhook"
  | "success"
  | "failed";

export interface CheckoutProps {
  plan?: "monthly" | "yearly";
  currency?: CurrencyCode;
  userEmail?: string;
  userName?: string;
  buttonText?: string;
  className?: string;
  initialCoupon?: string;
  showCouponInput?: boolean;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
}

interface ToastState {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

export function Checkout({
  plan = "monthly",
  currency = "USD",
  userEmail,
  userName = "MasmSpace Creator",
  buttonText,
  className = "",
  initialCoupon = "",
  showCouponInput = true,
  onSuccess,
  onError,
}: CheckoutProps) {
  const router = useRouter();

  // 1. Core State
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [successPaymentId, setSuccessPaymentId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // 2. Coupon State
  const [couponInput, setCouponInput] = useState<string>(initialCoupon);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [showCouponField, setShowCouponField] = useState<boolean>(Boolean(initialCoupon));

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss toasts after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Network Online/Offline Monitoring
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setToast({ type: "info", message: "🟢 Network connection restored." });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToast({
        type: "warning",
        message: "⚠️ Network connection lost. Please verify your internet connection.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Compute Base and Discounted Pricing
  const basePlanInfo = getPlanPrice(plan, currency);
  const effectiveSubunits = appliedCoupon?.discountedSubunits || basePlanInfo.subunits;
  const effectiveFormattedPrice = appliedCoupon?.formattedDiscounted || basePlanInfo.formatted;

  // Dynamic Razorpay Script Loader
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

  // 3. Server-Side Coupon Validation
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setToast({ type: "error", message: "Please enter a valid coupon code." });
      return;
    }

    try {
      setIsValidatingCoupon(true);
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          plan,
          currency,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setToast({
          type: "success",
          message: `🎉 Coupon applied: ${data.discountPercent}% off! Saved ${data.formattedSavings}.`,
        });
      } else {
        setAppliedCoupon(null);
        const errMsg = data.error || "Invalid or expired coupon code.";
        setToast({ type: "error", message: errMsg });
      }
    } catch {
      setToast({
        type: "error",
        message: "Failed to validate coupon with server. Check connection.",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setToast({ type: "info", message: "Coupon removed." });
  };

  // 4. Polling Routine to Verify Webhook Database Activation
  const pollSubscriptionActivation = useCallback(
    async (paymentId: string, maxAttempts = 6): Promise<boolean> => {
      let attempts = 0;
      return new Promise((resolve) => {
        pollIntervalRef.current = setInterval(async () => {
          attempts++;
          try {
            const res = await fetch("/api/check-subscription", {
              method: "GET",
              cache: "no-store",
            });
            const data = await res.json().catch(() => ({}));

            if (data?.active && data?.is_pro) {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              resolve(true);
              return;
            }
          } catch {
            // Non-blocking retry
          }

          if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            // Even if polling timed out, payment was captured on Razorpay
            resolve(true);
          }
        }, 1500);
      });
    },
    []
  );

  // 5. Main Checkout Trigger
  const handleCheckout = async () => {
    if (!isOnline) {
      setToast({
        type: "error",
        message: "You are offline. Please reconnect before initiating checkout.",
      });
      return;
    }

    try {
      setStep("authenticating");

      // ── STRICT AUTHENTICATION GUARD ──────────────────────────────────────────
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const { data: userData } = await supabase.auth.getUser();
      const authenticatedUser = userData?.user || session?.user;

      if (!authenticatedUser) {
        setStep("idle");
        const authMsg = "Authentication required. Please log in before upgrading to PRO.";
        setToast({ type: "warning", message: authMsg });
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
      const activeName =
        userName ||
        authenticatedUser.user_metadata?.name ||
        authenticatedUser.user_metadata?.full_name ||
        "MasmSpace Creator";

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setStep("idle");
        const msg = "Unable to load Razorpay Checkout SDK. Please check your internet connection.";
        setToast({ type: "error", message: msg });
        onError?.(msg);
        return;
      }

      // Step 2: Create Order via Backend with Server-Side Coupon Validation
      setStep("creating_order");

      const orderPayload = {
        plan,
        currency,
        user_email: activeEmail,
        coupon_code: appliedCoupon?.code || undefined,
      };

      let orderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        orderRes = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
      }

      const orderData = await orderRes.json().catch(() => null);

      if (!orderRes.ok || !orderData?.order_id) {
        setStep("idle");
        const errorDetail =
          orderData?.error || orderData?.detail || "Failed to initialize order with server.";
        setToast({ type: "error", message: errorDetail });
        onError?.(errorDetail);
        return;
      }

      // Save checkout recovery intent to sessionStorage for network drop resilience
      try {
        sessionStorage.setItem(
          "masmspace_pending_checkout",
          JSON.stringify({
            order_id: orderData.order_id,
            plan,
            currency,
            email: activeEmail,
            timestamp: Date.now(),
          })
        );
      } catch {}

      // Step 3: Open Razorpay Overlay Modal
      setStep("awaiting_payment");
      const activeCurrency = orderData.currency || currency;

      const modalDescription =
        activeCurrency === "INR"
          ? plan === "yearly"
            ? `MasmSpace Pro Annual Membership (${effectiveFormattedPrice}/yr)`
            : `MasmSpace Pro Monthly Membership (${effectiveFormattedPrice}/mo)`
          : plan === "yearly"
          ? `MasmSpace Pro Annual Membership (${effectiveFormattedPrice}/yr)`
          : `MasmSpace Pro Monthly Membership (${effectiveFormattedPrice}/mo)`;

      const options = {
        key:
          orderData.key_id ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "rzp_test_Ta2kWl9IX7CgkT",
        amount: orderData.amount || effectiveSubunits,
        currency: activeCurrency,
        name: "MasmSpace PRO (Powered by Prathomix)",
        description: modalDescription,
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
            setStep("idle");
            setToast({
              type: "info",
              message: "Checkout window closed. You can resume upgrade anytime.",
            });
          },
        },
        // Step 4: Signature Verification & Polling Server Webhook
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            setStep("verifying_webhook");

            // Initiate cryptographic check with server
            const verifyPromise = fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_email: activeEmail,
                plan,
              }),
            });

            // Concurrently poll for webhook activation
            const pollPromise = pollSubscriptionActivation(response.razorpay_payment_id);

            const [verifyRes] = await Promise.all([verifyPromise, pollPromise]);
            const verifyData = await verifyRes.json().catch(() => null);

            if (verifyRes.ok && verifyData?.success) {
              setStep("success");
              setSuccessPaymentId(response.razorpay_payment_id);
              sessionStorage.removeItem("masmspace_pending_checkout");

              // Update local state and refresh Supabase auth session
              try {
                const stored = localStorage.getItem("prathomix_current_user");
                if (stored) {
                  const u = JSON.parse(stored);
                  u.role = "pro";
                  u.tier = "pro";
                  u.is_pro = true;
                  u.subscription_status = "pro";
                  localStorage.setItem("prathomix_current_user", JSON.stringify(u));
                }
                localStorage.setItem("Prathomix_pro_status", "true");
              } catch {}

              setToast({
                type: "success",
                message: "🎉 Payment Verified! Welcome to MasmSpace PRO!",
              });

              onSuccess?.(response.razorpay_payment_id);

              setTimeout(() => {
                window.location.reload();
              }, 1800);
            } else {
              setStep("failed");
              const errMsg = verifyData?.error || "Payment signature verification failed.";
              setToast({ type: "error", message: errMsg });
              onError?.(errMsg);
            }
          } catch (err: any) {
            setStep("failed");
            const errMsg = err?.message || "Error verifying payment signature.";
            setToast({ type: "error", message: errMsg });
            onError?.(errMsg);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (failResponse: any) {
        setStep("idle");
        const failMsg = failResponse?.error?.description || "Payment failed or was canceled.";
        setToast({ type: "error", message: failMsg });
        onError?.(failMsg);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error("Checkout process error:", err);
      setStep("idle");
      const msg = err?.message || "An unexpected error occurred during checkout.";
      setToast({ type: "error", message: msg });
      onError?.(msg);
    }
  };

  // Button Label State Map
  const getButtonContent = () => {
    switch (step) {
      case "authenticating":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Verifying Session...</span>
          </>
        );
      case "creating_order":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Securing Order...</span>
          </>
        );
      case "awaiting_payment":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Awaiting Razorpay...</span>
          </>
        );
      case "verifying_webhook":
        return (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-black" />
            <span>Confirming Activation...</span>
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>PRO Activated!</span>
          </>
        );
      default:
        return (
          <>
            <Sparkles className="w-4 h-4 fill-black text-black" />
            <span>
              {buttonText || `Upgrade to Pro — ${effectiveFormattedPrice}/${plan === "yearly" ? "yr" : "mo"}`}
            </span>
          </>
        );
    }
  };

  if (successPaymentId) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/60 text-emerald-300 flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-fadeIn">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="text-xs font-mono">
          <div className="font-bold text-white">Payment Verified! Welcome to MasmSpace PRO.</div>
          <div className="text-emerald-400/80 text-[10px]">Payment ID: {successPaymentId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 relative">
      {/* ── Floating Animated Toast Notification ── */}
      {toast && (
        <div
          className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-2.5 transition-all shadow-lg backdrop-blur-xl border ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : toast.type === "error"
              ? "bg-red-950/90 text-red-300 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              : toast.type === "warning"
              ? "bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : toast.type === "warning" ? (
              <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Coupon Code Section ── */}
      {showCouponInput && (
        <div className="p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md space-y-2">
          {!appliedCoupon ? (
            <div>
              {!showCouponField ? (
                <button
                  type="button"
                  onClick={() => setShowCouponField(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  <span>Have a promo or coupon code?</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. MASM20"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/15 text-white placeholder-zinc-500 text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCouponField(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">{appliedCoupon.code}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  -{appliedCoupon.discountPercent}%
                </span>
                <span className="text-[10px] text-zinc-400 line-through">
                  {appliedCoupon.formattedOriginal}
                </span>
                <span className="text-white font-bold">
                  {appliedCoupon.formattedDiscounted}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-zinc-400 hover:text-red-400 p-1 cursor-pointer"
                title="Remove coupon"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Main Interactive Razorpay Upgrade Button ── */}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={step !== "idle" || !isOnline}
        className={
          className ||
          `w-full py-3.5 px-6 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black border-cyan-400/40 shadow-[0_0_20px_rgba(0,245,255,0.25)] hover:shadow-[0_0_30px_rgba(0,245,255,0.45)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`
        }
      >
        {getButtonContent()}
      </button>

      {/* ── Offline Network Alert Indicator ── */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline mode — Internet connection needed for checkout</span>
        </div>
      )}

      {/* ── Trust Badge ── */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>256-Bit Encrypted Razorpay Checkout &bull; Webhook Guaranteed</span>
      </div>
    </div>
  );
}

export default Checkout;

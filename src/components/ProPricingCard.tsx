"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  Zap,
  Crown,
  Sparkles,
  Lock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Tag,
  X,
  WifiOff,
  CheckCircle2,
} from "lucide-react";
import { ProBadge } from "@/components/ProBadge";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/currency";
import { CouponValidationResult } from "@/lib/coupon";

interface ProPricingCardProps {
  onUpgradeClick?: () => void;
  onOpenAuth?: () => void;
  ctaHref?: string;
  className?: string;
}

// Dynamically load Razorpay standard checkout script if not already on page
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const features = [
  { text: "Everything in Starter (Forever Free)", isHighlight: true },
  { text: "AI Meeting Summaries & Action Items", hasProBadge: true },
  { text: "Never Lose an Idea (Instant Canvas Memory)", hasProBadge: true },
  { text: "Real-time Multiplayer Collaboration Sync", hasProBadge: true },
  { text: "Laser Pointer & Interactive Presentation Mode", hasProBadge: true },
  { text: "Watermark-Free Clean 4K Ultra-HD Exports", hasProBadge: true },
  { text: "Priority Cloud AI Compute (Qwen2.5 / Llama 3.3)", hasProBadge: true },
  { text: "Unlimited Infinite Canvases & Cloud Backup", hasProBadge: true },
];

export function ProPricingCard({
  onUpgradeClick,
  onOpenAuth,
  className = "",
}: ProPricingCardProps) {
  const router = useRouter();

  // 1. State management
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type?: "error" | "success" | "warning" | "info";
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // 2. Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Multi-Currency Detection and Pricing Configuration
  const { currency, setCurrency, detectedCountry, getPlanDetails } = useCurrency();
  const currentPlan = isYearly ? "yearly" : "monthly";
  const planDetails = getPlanDetails(currentPlan);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Network Online/Offline Monitoring
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      setToastMessage({ text: "🟢 Network connection restored.", type: "info" });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage({
        text: "⚠️ Network connection lost. Checkout requires internet.",
        type: "warning",
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

  // Coupon Validation
  const handleApplyCoupon = useCallback(
    async (codeToApply?: string, planOverride?: "monthly" | "yearly") => {
      const code = (codeToApply || couponInput).trim();
      if (!code) {
        setToastMessage({ text: "Please enter a promo code.", type: "error" });
        return;
      }

      try {
        setIsValidatingCoupon(true);
        const res = await fetch("/api/validate-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            plan: planOverride || currentPlan,
            currency,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.valid) {
          setAppliedCoupon(data);
          setToastMessage({
            text: `🎉 Coupon applied: ${data.discountPercent}% off! Saved ${data.formattedSavings}.`,
            type: "success",
          });
        } else {
          setAppliedCoupon(null);
          setToastMessage({
            text: data.error || "Invalid or expired coupon code.",
            type: "error",
          });
        }
      } catch {
        setToastMessage({
          text: "Failed to validate coupon with server.",
          type: "error",
        });
      } finally {
        setIsValidatingCoupon(false);
      }
    },
    [couponInput, currentPlan, currency]
  );

  // When plan changes, re-validate applied coupon if plan-restricted
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.code) {
      handleApplyCoupon(appliedCoupon.code, currentPlan);
    }
  }, [currentPlan, handleApplyCoupon, appliedCoupon]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setToastMessage({ text: "Coupon removed.", type: "info" });
  };

  // Polling routine for webhook database activation
  const pollSubscriptionActivation = useCallback(
    async (maxAttempts = 6): Promise<boolean> => {
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
          } catch {}

          if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            resolve(true);
          }
        }, 1500);
      });
    },
    []
  );

  // Helper: Check if user is logged in via Supabase session
  const checkUserAuthentication = async (): Promise<{
    authenticated: boolean;
    user?: { id: string; email?: string; name?: string };
  }> => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && session.user) {
        return {
          authenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              "MasmSpace Creator",
          },
        };
      }

      return { authenticated: false };
    } catch {
      return { authenticated: false };
    }
  };

  // Smart Razorpay Standard Checkout Flow with Auth Enforcement
  const handleRazorpayPayment = async () => {
    if (!isOnline) {
      setToastMessage({
        text: "You are currently offline. Please reconnect to upgrade.",
        type: "warning",
      });
      return;
    }

    try {
      setToastMessage(null);
      setIsLoading(true);
      setLoadingStage("Verifying session...");

      // STEP 1: STRICT AUTHENTICATION GUARD
      const authResult = await checkUserAuthentication();

      if (!authResult.authenticated || !authResult.user) {
        setIsLoading(false);
        setLoadingStage(null);
        if (onOpenAuth) {
          onOpenAuth();
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-auth-modal"));
          router.push("/login?next=/pricing");
        }
        return;
      }

      // STEP 2: SESSION EXISTS (LOGGED IN)
      setLoadingStage("Loading Razorpay SDK...");
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setToastMessage({
          text: "Razorpay checkout failed to load. Check your connection.",
          type: "error",
        });
        setIsLoading(false);
        setLoadingStage(null);
        return;
      }

      setLoadingStage("Creating secure order...");
      const activeUser = authResult.user;

      const orderPayload = {
        plan: currentPlan,
        currency,
        user_email: activeUser.email,
        coupon_code: appliedCoupon?.code || undefined,
      };

      // STEP 3: Call backend to create Razorpay Order
      let res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Unable to create payment order. Please try again.");
      }

      const orderData = await res.json();
      setLoadingStage("Opening checkout...");
      openRazorpayModal(orderData, activeUser);
    } catch (error: any) {
      console.error("Razorpay payment error:", error);
      setToastMessage({
        text: error?.message || "Failed to initiate payment. Please try again.",
        type: "error",
      });
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  // Open Razorpay Modal & Verify Signature on Success
  const openRazorpayModal = (
    orderData: {
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
    },
    user?: { id: string; email?: string; name?: string }
  ) => {
    const activeCurrency = orderData.currency || currency;
    const effectivePrice = appliedCoupon?.formattedDiscounted || planDetails.formatted;

    const modalDescription =
      activeCurrency === "INR"
        ? isYearly
          ? `MasmSpace Pro Yearly Membership (${effectivePrice}/year)`
          : `MasmSpace Pro Monthly Membership (${effectivePrice}/month)`
        : isYearly
        ? `MasmSpace Pro Yearly Membership (${effectivePrice}/year)`
        : `MasmSpace Pro Monthly Membership (${effectivePrice}/month)`;

    const options = {
      key:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        orderData.key_id ||
        "rzp_test_Ta2kWl9IX7CgkT",
      amount: orderData.amount,
      currency: activeCurrency,
      name: "MasmSpace Pro (Powered by Prathomix)",
      description: modalDescription,
      order_id: orderData.order_id,
      theme: {
        color: "#00f5ff",
      },
      prefill: {
        name: user?.name || "MasmSpace Creator",
        email: user?.email || "creator@masmspace.tech",
      },
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          setIsLoading(true);
          setLoadingStage("Confirming payment with secure webhook...");

          const verifyPromise = fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_email: user?.email,
              plan: currentPlan,
            }),
          });

          const pollPromise = pollSubscriptionActivation();

          const [verifyRes] = await Promise.all([verifyPromise, pollPromise]);
          const verifyData = await verifyRes.json().catch(() => null);

          if (verifyRes.ok && verifyData?.success) {
            setPaymentSuccess(response.razorpay_payment_id);
            setToastMessage({
              text: `🎉 Payment Verified! Welcome to MasmSpace PRO!`,
              type: "success",
            });

            // Activate local Pro status
            try {
              const currentUser = localStorage.getItem("prathomix_current_user");
              if (currentUser) {
                const parsed = JSON.parse(currentUser);
                parsed.role = "pro";
                parsed.tier = "pro";
                parsed.is_pro = true;
                parsed.subscription_status = "pro";
                localStorage.setItem("prathomix_current_user", JSON.stringify(parsed));
              }
              localStorage.setItem("Prathomix_pro_status", "true");
            } catch (e) {
              console.error("Failed to store pro role:", e);
            }

            if (onUpgradeClick) onUpgradeClick();

            setTimeout(() => {
              window.location.reload();
            }, 1800);
          } else {
            setToastMessage({
              text: `Payment verification failed: ${verifyData?.error || "Signature mismatch."}`,
              type: "error",
            });
          }
        } catch (verifyErr: any) {
          console.error("Signature verification error:", verifyErr);
          setToastMessage({
            text: "Error verifying payment signature with server.",
            type: "error",
          });
        } finally {
          setIsLoading(false);
          setLoadingStage(null);
        }
      },
      modal: {
        ondismiss: function () {
          setIsLoading(false);
          setLoadingStage(null);
          setToastMessage({
            text: "Checkout window closed. You can resume upgrade anytime.",
            type: "info",
          });
        },
      },
    };

    const rzpInstance = new (window as any).Razorpay(options);

    rzpInstance.on("payment.failed", function (response: any) {
      console.error("Razorpay Payment Failed:", response.error);
      setToastMessage({
        text: `Payment Failed: ${response.error.description || "Transaction declined"}`,
        type: "error",
      });
      setIsLoading(false);
      setLoadingStage(null);
    });

    rzpInstance.open();
  };

  const effectiveDisplayPrice = appliedCoupon?.formattedDiscounted || planDetails.formatted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -6,
        boxShadow: "0 0 45px rgba(0, 245, 255, 0.35), 0 20px 40px -15px rgba(0, 0, 0, 0.8)",
      }}
      className={`relative p-6 sm:p-7 rounded-3xl bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_35px_rgba(0,245,255,0.22)] flex flex-col justify-between space-y-5 z-10 transition-all duration-300 text-white overflow-hidden group ${className}`}
    >
      {/* ── Background Ambient Neon Glows ── */}
      <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none group-hover:bg-cyan-500/25 transition-all duration-500" />
      <div className="absolute -bottom-24 -left-24 w-52 h-52 rounded-full bg-blue-600/15 blur-3xl pointer-events-none group-hover:bg-blue-600/25 transition-all duration-500" />

      {/* ── Floating Toast: Network / Auth / Coupon Notifications ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            className={`absolute top-4 left-4 right-4 z-50 p-3 rounded-2xl backdrop-blur-2xl flex items-center justify-between gap-3 shadow-xl border ${
              toastMessage.type === "success"
                ? "bg-emerald-950/95 border-emerald-400 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                : toastMessage.type === "error"
                ? "bg-red-950/95 border-red-400 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                : toastMessage.type === "warning"
                ? "bg-amber-950/95 border-amber-400 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
                : "bg-zinc-950/95 border-cyan-400 text-white shadow-[0_0_30px_rgba(0,245,255,0.4)]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                {toastMessage.type === "error" ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : toastMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-mono font-bold leading-tight">
                  {toastMessage.text}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Glowing Softly-Pulsing "Most Popular" Badge ── */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 14px rgba(0, 245, 255, 0.5)",
            "0 0 24px rgba(0, 245, 255, 0.85)",
            "0 0 14px rgba(0, 245, 255, 0.5)",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: "easeInOut",
        }}
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-cyan-300 text-black uppercase flex items-center gap-1 z-20 border border-cyan-200/40"
      >
        <Zap className="w-3 h-3 fill-black" />
        <span>Most Popular</span>
      </motion.div>

      <div className="space-y-4 relative z-10">
        {/* ── Plan Header & Category ── */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,245,255,0.3)]">
              <Crown className="w-3.5 h-3.5 fill-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                PRO PLAN
              </span>
              <p className="text-[10px] text-zinc-400 font-mono">Creators &amp; Builders</p>
            </div>
          </div>

          {/* Currency Switcher Pill */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              $ USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency("INR")}
              className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                currency === "INR"
                  ? "bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ₹ INR {detectedCountry === "IN" ? "🇮🇳" : ""}
            </button>
          </div>
        </div>

        {/* ── Interactive Monthly / Yearly Toggle Switch ── */}
        <div className="p-1 rounded-xl bg-zinc-900/70 border border-white/10 backdrop-blur-md relative flex items-center">
          {/* Monthly Button */}
          <button
            type="button"
            onClick={() => setIsYearly(false)}
            className={`relative flex-1 py-1.5 px-3 text-xs font-mono font-bold rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer ${
              !isYearly ? "text-black" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {!isYearly && (
              <motion.div
                layoutId="billingTogglePill"
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-lg shadow-[0_0_15px_rgba(0,245,255,0.4)]"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">Monthly</span>
          </button>

          {/* Yearly Button with "Save 18%" Badge */}
          <button
            type="button"
            onClick={() => setIsYearly(true)}
            className={`relative flex-1 py-1.5 px-3 text-xs font-mono font-bold rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              isYearly ? "text-black" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {isYearly && (
              <motion.div
                layoutId="billingTogglePill"
                className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-lg shadow-[0_0_15px_rgba(0,245,255,0.4)]"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">Yearly</span>

            {/* Glowing Clean Savings Badge */}
            <motion.span
              animate={isYearly ? { scale: [1, 1.08, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`relative z-10 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase border transition-all ${
                isYearly
                  ? "bg-black/90 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(0,245,255,0.5)]"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              }`}
            >
              Save 18%
            </motion.span>
          </button>
        </div>

        {/* ── Price Display with Smooth Animation ── */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <div className="overflow-hidden min-w-[95px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${currency}-${isYearly ? "yearly" : "monthly"}-${effectiveDisplayPrice}`}
                  initial={{ opacity: 0, y: -12, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 12, filter: "blur(3px)" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="inline-block text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_0_16px_rgba(0,245,255,0.3)]"
                >
                  {effectiveDisplayPrice}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isYearly ? "yearly-sub" : "monthly-sub"}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs sm:text-sm font-mono text-cyan-300 font-semibold"
                >
                  {isYearly ? "/ year" : "/ month"}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] font-mono text-zinc-400">
                {isYearly ? `(≈ ${planDetails.monthlyEquivalent} billed annually)` : "billed monthly"}
              </span>
            </div>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <Tag className="w-3 h-3" />
              <span>Coupon {appliedCoupon.code} applied (-{appliedCoupon.discountPercent}%)</span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-zinc-400 hover:text-red-400 text-[10px] underline ml-1 cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-400 leading-snug">
              {isYearly
                ? `All-access for 1 full year (~${planDetails.monthlyEquivalent}). Clean savings for builders.`
                : "Flexible month-to-month access. Cancel anytime."}
            </p>
          )}
        </div>

        {/* ── Coupon Code Bar on Card ── */}
        <div className="pt-1">
          {!appliedCoupon ? (
            !showCouponInput ? (
              <button
                type="button"
                onClick={() => setShowCouponInput(true)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Tag className="w-3 h-3" />
                <span>Have a coupon code? (e.g. MASM20)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="COUPON (e.g. MASM20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                  className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-white/15 text-white placeholder-zinc-500 text-[11px] font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={isValidatingCoupon || !couponInput.trim()}
                  className="px-2.5 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-[11px] cursor-pointer disabled:opacity-50"
                >
                  {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCouponInput(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          ) : null}
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* ── Fixed-Height Scrollable Features Container ── */}
        <div className="max-h-44 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2.5">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-start gap-2 text-zinc-200 text-xs"
            >
              <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(0,245,255,0.2)]">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap leading-snug">
                {feature.hasProBadge && <ProBadge size="sm" />}
                <span
                  className={
                    feature.isHighlight
                      ? "font-semibold text-white tracking-wide"
                      : "text-zinc-300"
                  }
                >
                  {feature.text}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Exclusivity / Guarantee Note ── */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-inner">
          <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Instant activation &bull; 14-day money-back guarantee</span>
        </div>
      </div>

      {/* ── Bottom Interactive Razorpay CTA Button ── */}
      <div className="relative z-10 pt-1">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <button
            type="button"
            id="upgrade-to-pro-btn"
            onClick={handleRazorpayPayment}
            disabled={isLoading || !isOnline}
            className="w-full py-3.5 rounded-2xl font-mono text-xs sm:text-sm font-extrabold text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_26px_rgba(0,245,255,0.45)] hover:shadow-[0_0_36px_rgba(0,245,255,0.7)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{loadingStage || "Preparing Order..."}</span>
              </>
            ) : paymentSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>PRO Activated!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Upgrade to Pro — {effectiveDisplayPrice}</span>
                <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.div>

        {!isOnline && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-amber-400 mt-2">
            <WifiOff className="w-3 h-3" />
            <span>Offline — Reconnect to complete upgrade</span>
          </div>
        )}

        <p className="text-center text-[10px] font-mono text-zinc-500 mt-2">
          Secure Razorpay checkout &bull; Webhook Guaranteed &bull; Cancel anytime
        </p>
      </div>
    </motion.div>
  );
}

export default ProPricingCard;

"use client";

import React, { useState, useEffect } from "react";
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
  LogIn,
} from "lucide-react";
import { ProBadge } from "@/components/ProBadge";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/currency";

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

export function ProPricingCard({
  onUpgradeClick,
  onOpenAuth,
  className = "",
}: ProPricingCardProps) {
  const router = useRouter();

  // 1. State management
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // 2. Multi-Currency Detection and Pricing Configuration
  const { currency, setCurrency, detectedCountry, getPlanDetails } = useCurrency();
  const currentPlan = isYearly ? "yearly" : "monthly";
  const planDetails = getPlanDetails(currentPlan);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

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

  // 3. Helper: Check if user is logged in via Supabase session
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

  // 4. Smart Razorpay Standard Checkout Flow with Auth Enforcement
  const handleRazorpayPayment = async () => {
    try {
      setToastMessage(null);

      // ── STEP 1: STRICT AUTHENTICATION GUARD ───────────────────────────────
      const authResult = await checkUserAuthentication();

      if (!authResult.authenticated || !authResult.user) {
        // Logged out: Instantly redirect to login or trigger modal, aborting checkout
        if (onOpenAuth) {
          onOpenAuth();
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("open-auth-modal"));
          router.push("/login?next=/pricing");
        }
        return;
      }

      // ── STEP 2: SESSION EXISTS (LOGGED IN) ──────────────────────────────────
      // Immediately proceed without asking for login
      setIsLoading(true);

      // Ensure Razorpay SDK script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay checkout failed to load. Please verify your internet connection.");
        setIsLoading(false);
        return;
      }

      // Dynamic: Uses user-detected currency (INR in India, USD internationally)
      const amountInSubunits = planDetails.subunits;
      const orderCurrency = currency;
      const activeUser = authResult.user;

      // STEP 3: Call backend to create Razorpay Order
      let res = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: currentPlan,
          amount: amountInSubunits,
          currency: orderCurrency,
          user_email: activeUser.email,
        }),
      });

      if (!res.ok) {
        res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan: currentPlan,
            amount: amountInSubunits,
            currency: orderCurrency,
            user_email: activeUser.email,
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Unable to create payment order. Please try again.");
      }

      const orderData = await res.json();
      openRazorpayModal(orderData, activeUser);
    } catch (error: any) {
      console.error("Razorpay payment error:", error);
      alert(error?.message || "Failed to initiate payment. Please try again.");
      setIsLoading(false);
    }
  };

  // 5. Open Razorpay Modal & Verify Signature on Success
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
    const modalDescription =
      activeCurrency === "INR"
        ? (isYearly
            ? "MasmSpace Pro Yearly Membership (₹1,499/year)"
            : "MasmSpace Pro Monthly Membership (₹149/month)")
        : (isYearly
            ? "MasmSpace Pro Yearly Membership ($49/year)"
            : "MasmSpace Pro Monthly Membership ($5/month)");

    const options = {
      key:
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        orderData.key_id ||
        "rzp_test_Ta2kWl9IX7CgkT",
      amount: orderData.amount, // in subunits (* 100)
      currency: activeCurrency,
      name: "MasmSpace Pro",
      description: modalDescription,
      order_id: orderData.order_id,
      theme: {
        color: "#00f5ff",
      },
      prefill: {
        name: user?.name || "MasmSpace Creator",
        email: user?.email || "creator@masmspace.online",
      },
      // Payment Success Callback: verify HMAC-SHA256 signature with backend
      handler: async function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          setIsLoading(true);

          const verifyRes = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyRes.ok && verifyData.success) {
            setPaymentSuccess(response.razorpay_payment_id);
            alert(
              `🎉 Payment Verified Successfully!\nPayment ID: ${response.razorpay_payment_id}\nWelcome to MasmSpace PRO!`
            );

            // Activate local Pro status
            try {
              const currentUser = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
              if (currentUser) {
                const parsed = JSON.parse(currentUser);
                parsed.role = "pro";
                localStorage.setItem("masmspace_current_user", JSON.stringify(parsed));
              }
            } catch (e) {
              console.error("Failed to store pro role:", e);
            }

            if (onUpgradeClick) onUpgradeClick();
          } else {
            alert(
              `❌ Payment Verification Failed: ${
                verifyData.error || "Signature mismatch. Order not confirmed."
              }`
            );
          }
        } catch (verifyErr: any) {
          console.error("Signature verification error:", verifyErr);
          alert("Error verifying payment signature with server.");
        } finally {
          setIsLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          console.log("Razorpay checkout popup closed by user.");
          setIsLoading(false);
        },
      },
    };

    const rzpInstance = new (window as any).Razorpay(options);

    rzpInstance.on("payment.failed", function (response: any) {
      console.error("Razorpay Payment Failed:", response.error);
      alert(
        `Payment Failed!\nReason: ${response.error.description || "Transaction declined"}`
      );
      setIsLoading(false);
    });

    rzpInstance.open();
  };

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

      {/* ── Floating Toast: "Please login to upgrade" ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 26 }}
            className="absolute top-4 left-4 right-4 z-50 p-3 rounded-2xl bg-zinc-950/95 border border-cyan-400 text-white shadow-[0_0_30px_rgba(0,245,255,0.5)] backdrop-blur-2xl flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold text-white leading-tight">
                  {toastMessage}
                </p>
                <p className="text-[10px] font-sans text-zinc-400">
                  Authentication required for Pro checkout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setToastMessage(null);
                if (onOpenAuth) onOpenAuth();
                else window.dispatchEvent(new CustomEvent("open-auth-modal"));
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-400 text-black font-mono font-bold text-xs hover:bg-cyan-300 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
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
                  key={`${currency}-${isYearly ? "yearly-price" : "monthly-price"}`}
                  initial={{ opacity: 0, y: -12, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 12, filter: "blur(3px)" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="inline-block text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight drop-shadow-[0_0_16px_rgba(0,245,255,0.3)]"
                >
                  {planDetails.formatted}
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

          <p className="text-[11px] text-zinc-400 leading-snug">
            {isYearly
              ? `All-access for 1 full year (~${planDetails.monthlyEquivalent}). Clean savings for builders.`
              : "Flexible month-to-month access. Cancel anytime."}
          </p>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* ── Fixed-Height Scrollable Features Container ── */}
        <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-start gap-2.5 text-zinc-200 text-xs"
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
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl font-mono text-xs sm:text-sm font-extrabold text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_26px_rgba(0,245,255,0.45)] hover:shadow-[0_0_36px_rgba(0,245,255,0.7)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Preparing Order...</span>
              </>
            ) : paymentSuccess ? (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>PRO Activated!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Upgrade to Pro — {planDetails.label}</span>
                <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.div>

        <p className="text-center text-[10px] font-mono text-zinc-500 mt-2">
          Secure Razorpay checkout &bull; Cancel anytime with 1-click
        </p>
      </div>
    </motion.div>
  );
}

export default ProPricingCard;

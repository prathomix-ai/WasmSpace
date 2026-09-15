"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, X, Sparkles, Zap, Shield, ArrowRight, Globe } from "lucide-react";
import { Checkout } from "@/components/Checkout";
import { useCurrency } from "@/lib/currency";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reason?: string;
  onUpgradeSuccess?: () => void;
}

export function PricingModal({
  isOpen,
  onClose,
  title = "Unlock PRATHOMIX PRO",
  reason = "You have reached your free daily quota of AI actions.",
  onUpgradeSuccess,
}: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const { currency, setCurrency, detectedCountry, getPlanDetails } = useCurrency();

  const monthlyDetails = getPlanDetails("monthly");
  const yearlyDetails = getPlanDetails("yearly");
  const activePlanDetails = getPlanDetails(billingCycle);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-[95%] md:max-w-2xl mx-auto rounded-3xl bg-zinc-950/85 backdrop-blur-2xl border-2 border-cyan-500/40 shadow-[0_0_60px_rgba(0,245,255,0.25)] p-5 sm:p-8 text-white overflow-y-auto max-h-[92vh] custom-scrollbar"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

          {/* Close ('X') Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top Badge & Header with Currency Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
                <Crown className="w-6 h-6 fill-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                    PRATHOMIX ENTERPRISE
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                    PRO SUITE
                  </span>
                </div>
                <h3 className="text-xl font-bold font-sans text-white tracking-tight">
                  {title}
                </h3>
              </div>
            </div>

            {/* Currency Selector Pill */}
            <div className="self-start sm:self-center flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <span className="px-2 py-0.5 text-[10px] text-zinc-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Region:</span>
              </span>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currency === "INR"
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ₹ INR {detectedCountry === "IN" ? "🇮🇳" : ""}
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-5">
            {reason} Upgrade to continue generating unlimited Kanban boards, architecture diagrams, and high-velocity canvases.
          </p>

          {/* ── Billing Cycle Selector (Monthly vs Yearly) ── */}
          <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-5">
            {/* Monthly Option */}
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
              }`}
            >
              <div className="text-xs font-semibold text-zinc-300">Monthly Plan</div>
              <div className="text-lg font-bold text-white font-mono">{monthlyDetails.formatted} / month</div>
              <div className="text-[10px] text-zinc-400">Billed monthly</div>
            </button>

            {/* Yearly Option with Save 18% Badge */}
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left cursor-pointer ${
                billingCycle === "yearly"
                  ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                  : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
              }`}
            >
              {/* Glowing Save 18% Badge */}
              <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                Save 18%
              </span>
              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                <span>Yearly Plan</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">
                {yearlyDetails.formatted}{" "}
                <span className="text-xs font-normal text-cyan-300">
                  / year (≈{yearlyDetails.monthlyEquivalent})
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">Billed annually ({yearlyDetails.formatted})</div>
            </button>
          </div>

          {/* ── High-Impact PRO Features List ── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#09090b]/60 backdrop-blur-xl border border-white/10 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 pb-3 mb-4 border-b border-white/5">
              <Zap className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] shrink-0" />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent font-extrabold tracking-wider">
                EVERYTHING INCLUDED IN PRATHOMIX PRO:
              </span>
            </div>

            <ul className="space-y-5">
              {/* Feature 1 */}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="leading-snug">
                  <span className="font-semibold text-white">🧠 Unlimited &apos;Board Brain&apos; Intelligence</span>{" "}
                  <span className="text-sm text-gray-400 font-normal block sm:inline sm:ml-1">
                    (Instant canvas summaries powered by Gemini 1.5 Pro &amp; Groq Llama-3.3)
                  </span>
                </div>
              </li>

              {/* Feature 2 */}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="leading-snug">
                  <span className="font-semibold text-white">⚡ Massive AI Action Limits</span>{" "}
                  <span className="text-sm text-gray-400 font-normal block sm:inline sm:ml-1">
                    (Up to 500 daily requests for vector search, coding, and voice AI)
                  </span>
                </div>
              </li>

              {/* Feature 3 */}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="leading-snug">
                  <span className="font-semibold text-white">🎨 Pristine 4K Exports</span>{" "}
                  <span className="text-sm text-gray-400 font-normal block sm:inline sm:ml-1">
                    (Crystal-clear, watermark-free downloads for professional presentations)
                  </span>
                </div>
              </li>

              {/* Feature 4 */}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="leading-snug">
                  <span className="font-semibold text-white">🌐 Elite Multiplayer &amp; Presenter Tools</span>{" "}
                  <span className="text-sm text-gray-400 font-normal block sm:inline sm:ml-1">
                    (Unlock live laser pointers, admin controls, and seamless sync)
                  </span>
                </div>
              </li>

              {/* Feature 5 */}
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="leading-snug">
                  <span className="font-semibold text-white">🛡️ Priority 24/7 VIP Support</span>{" "}
                  <span className="text-sm text-gray-400 font-normal block sm:inline sm:ml-1">
                    (Direct access to the PRATHOMIX engineering team)
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* ── High-Contrast Glowing Razorpay Checkout CTA ── */}
          <Checkout
            plan={billingCycle}
            amount={activePlanDetails.subunits}
            currency={currency}
            buttonText={`Upgrade to PRO — ${activePlanDetails.label}`}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-extrabold font-mono text-sm tracking-tight transition-all duration-200 shadow-[0_0_30px_rgba(0,245,255,0.45)] hover:shadow-[0_0_40px_rgba(0,245,255,0.65)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            onSuccess={() => {
              onUpgradeSuccess?.();
              setTimeout(() => {
                onClose();
              }, 1200);
            }}
          />

          <p className="text-[10px] text-center text-zinc-500 mt-3 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-zinc-400" />
            <span>Encrypted SSL Checkout • Cancel anytime in 1-click</span>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PricingModal;

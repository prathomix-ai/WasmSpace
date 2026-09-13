"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, X, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import { Checkout } from "@/components/Checkout";

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
          className="relative w-[95%] md:max-w-2xl mx-auto rounded-3xl bg-zinc-950/85 backdrop-blur-2xl border-2 border-cyan-500/40 shadow-[0_0_60px_rgba(0,245,255,0.25)] p-5 sm:p-8 text-white overflow-hidden"
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

          {/* Top Badge & Header */}
          <div className="flex items-center gap-3.5 mb-3">
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
              <div className="text-lg font-bold text-white font-mono">$5 / month</div>
              <div className="text-[10px] text-zinc-400">Billed monthly</div>
            </button>

            {/* Yearly Option with Save 50% Badge */}
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
                $49 <span className="text-xs font-normal text-cyan-300">/ year (≈$4.08/mo)</span>
              </div>
              <div className="text-[10px] text-zinc-400">Billed annually ($49)</div>
            </button>
          </div>

          {/* ── Highlighted Features List ── */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 mb-6">
            <div className="text-[11px] font-mono font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Everything Included in PRATHOMIX PRO:</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-200">
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium text-white">250 Daily AI Actions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium text-white">Gemini 1.5 Pro Access &amp; Groq Llama-3.3</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium text-white">Watermark-free Clean 4K Exports</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium text-white">Priority 24/7 Enterprise Support</span>
              </li>
            </ul>
          </div>

          {/* ── High-Contrast Glowing Razorpay Checkout CTA ── */}
          <Checkout
            plan={billingCycle}
            amount={100} // 100 paise = 1 INR testing
            currency="INR"
            buttonText={
              billingCycle === "yearly"
                ? "Upgrade to PRO — $49/yr"
                : "Upgrade to PRO — $5/mo"
            }
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

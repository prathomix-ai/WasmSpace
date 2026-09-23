"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  X,
  Check,
  Zap,
  Shield,
  Layers,
  Infinity as InfinityIcon,
} from "lucide-react";
import Link from "next/link";

export interface ProUpgradeModalProps {
  isOpen?: boolean;
  onClose: () => void;
  featureName?: string;
}

export function ProUpgradeModal({
  isOpen = true,
  onClose,
  featureName,
}: ProUpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-[0_16px_50px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.04)] relative text-zinc-900 font-sans"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#635BFF] uppercase tracking-wider mb-0.5">
                <span>MasmSpace Pro</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                {featureName ? `Unlock ${featureName}` : "Upgrade to Pro"}
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed mb-4">
            {featureName
              ? `${featureName} is a Pro feature designed for advanced visual architecture and high-velocity teams.`
              : "Supercharge your visual workspace with expanded AI Board Brain intelligence and collaborative powers."}
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-2 p-1 bg-zinc-100 rounded-xl max-w-xs mx-auto mb-5 text-xs">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              $5 / month
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`flex-1 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                billingPeriod === "yearly"
                  ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <span>$49 / year</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                Save 18%
              </span>
            </button>
          </div>

          {/* Comparison Cards: Free vs Pro */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Free Plan */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">
                Current Plan
              </span>
              <div className="text-sm font-bold text-zinc-800 mb-2">Free</div>
              <ul className="space-y-1.5 text-[11px] text-zinc-600">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>15 AI actions / 12h</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>3 active boards</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span>Standard export</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="p-3.5 rounded-xl border-2 border-[#635BFF] bg-[#635BFF]/[0.02] text-xs relative">
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#635BFF] text-white text-[9px] font-bold uppercase tracking-wider">
                Recommended
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#635BFF] block mb-1">
                Pro
              </span>
              <div className="text-sm font-bold text-zinc-900 mb-2">
                {billingPeriod === "monthly" ? "$5" : "$49"}
                <span className="text-xs font-normal text-zinc-500">
                  {billingPeriod === "monthly" ? " / mo" : " / yr"}
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-zinc-700 font-medium">
                <li className="flex items-center gap-1.5 text-zinc-900">
                  <Check className="w-3 h-3 text-[#635BFF] shrink-0" />
                  <span>150 AI actions / 12h</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#635BFF] shrink-0" />
                  <span>Unlimited boards</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#635BFF] shrink-0" />
                  <span>Advanced diagramming</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#635BFF] shrink-0" />
                  <span>Multiplayer sync</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/billing?plan=${billingPeriod}`}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#635BFF] hover:bg-[#5248E2] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              onClick={onClose}
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProUpgradeModal;

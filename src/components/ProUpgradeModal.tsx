"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  ArrowRight,
  X,
  Sparkles,
  FileText,
  Brain,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

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
  const { currency } = useCurrency();

  // Handle ESC key press to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-upgrade-title"
      >
        {/* Modal Card - Clean Professional Enterprise UI */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-[#121316] border border-zinc-800 rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-zinc-100 font-sans"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header & Crown Badge */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  MasmSpace Pro
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                  Tier Upgrade
                </span>
              </div>
              <h2
                id="pro-upgrade-title"
                className="text-lg font-semibold text-white tracking-tight"
              >
                Upgrade to Professional
              </h2>
            </div>
          </div>

          {/* Value Prop Subtext */}
          <p className="text-xs text-zinc-400 leading-relaxed mb-5">
            {featureName ? (
              <>
                Unlock <strong className="text-zinc-200 font-medium">{featureName}</strong> and eliminate daily AI quota limitations.
              </>
            ) : (
              "Get 300 daily AI generations, multi-page document imports, and priority collaboration."
            )}
          </p>

          {/* Clean Feature List */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-3.5 mb-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">300 AI Generations / day</p>
                <p className="text-[11px] text-zinc-400">Gemini 1.5 Pro & Groq Llama-3.3 full architecture intelligence</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">PDF & Document Extraction</p>
                <p className="text-[11px] text-zinc-400">Convert PDFs, DOCX, and architecture diagrams to canvas nodes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">High-Resolution 4K Export</p>
                <p className="text-[11px] text-zinc-400">Watermark-free ultra-high resolution PNG export for presentations</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">Real-Time Team Multiplayer</p>
                <p className="text-[11px] text-zinc-400">Live multi-user cursor tracking, laser pointer, and cloud sync</p>
              </div>
            </div>
          </div>

          {/* Action Button & Pricing */}
          <div className="space-y-2.5">
            <Link
              href="/pricing"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Upgrade to Pro</span>
              <span className="text-blue-200 font-normal">
                &bull; {currency === "INR" ? "₹149/month" : "$5/month"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <p className="text-center text-[11px] text-zinc-500">
              Cancel anytime &bull; Instant secure activation
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProUpgradeModal;

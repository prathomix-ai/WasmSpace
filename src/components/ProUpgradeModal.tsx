"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Check,
  ArrowRight,
  X,
  Zap,
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
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-upgrade-title"
      >
        {/* Modal Card (Premium Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#09090b] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(139,92,246,0.15)] relative overflow-hidden"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          {/* Close Button (X icon) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Crown Badge */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.3)] shrink-0">
              <Crown className="w-6 h-6 fill-violet-400 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  MASMSPACE PRO
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold uppercase">
                  ELITE
                </span>
              </div>
              <h2
                id="pro-upgrade-title"
                className="text-xl font-bold font-sans text-white tracking-tight leading-none"
              >
                Upgrade to MasmSpace PRO
              </h2>
            </div>
          </div>

          {/* Value Prop Subtext */}
          <p className="text-sm text-zinc-300 leading-relaxed mb-6 font-normal">
            {featureName ? (
              <>
                Unlock <strong className="text-white font-medium">{featureName}</strong> and take your architecture canvas to elite levels.
              </>
            ) : (
              "Unlock 300 AI Prompts/day, PDF Imports, and more."
            )}
          </p>

          {/* Engaging Feature Highlights */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">300 AI Prompts / day</p>
                <p className="text-[11px] text-zinc-400">Gemini 1.5 Pro & Groq Llama-3.3 architecture generation</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">PDF & Universal Document Imports</p>
                <p className="text-[11px] text-zinc-400">Convert specs and system diagrams instantly to graph nodes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Full Board Brain RAG & 4K Exports</p>
                <p className="text-[11px] text-zinc-400">Semantic vector indexing and watermark-free presentation exports</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Live Multiplayer & VIP Priority</p>
                <p className="text-[11px] text-zinc-400">Real-time laser pointers, session sync & priority cloud backup</p>
              </div>
            </div>
          </div>

          {/* Action Button & Pricing */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              onClick={onClose}
              className="w-full py-3.5 px-5 rounded-xl font-sans text-sm font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 shadow-[0_0_25px_rgba(139,92,246,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Upgrade Now</span>
              <span className="text-white/80 font-normal text-xs">
                &bull; {currency === "INR" ? "₹149/mo" : "$5/mo"}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="text-center text-[11px] font-mono text-zinc-500">
              Cancel anytime &bull; Instant activation &bull; 100% money-back guarantee
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProUpgradeModal;

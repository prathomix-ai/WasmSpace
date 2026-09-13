"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, ArrowRight, X, Zap } from "lucide-react";
import Link from "next/link";

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function ProUpgradeModal({
  isOpen,
  onClose,
  featureName = "Advanced AI Tools",
}: ProUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xl bg-black/40 p-4 select-none"
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
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-[95%] md:max-w-2xl mx-auto rounded-3xl bg-zinc-950/85 backdrop-blur-2xl border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] p-5 sm:p-7 text-white overflow-hidden"
        >
          {/* Ambient Glow accents */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          {/* Close ('X') Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Badge & Crown */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.35)] shrink-0">
              <Crown className="w-5 h-5 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                  MasmSpace PRO
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  Locked
                </span>
              </div>
              <h3 className="text-lg font-bold font-sans text-white tracking-tight">
                Unlock {featureName}
              </h3>
            </div>
          </div>

          {/* Compelling Value Proposition */}
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
            Upgrade to <strong className="text-cyan-400">MasmSpace PRO</strong> to get unlimited access to advanced AI intelligence, real-time cloud sync, and clean watermark-free exports.
          </p>

          {/* Feature List */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 mb-5">
            <div className="text-[11px] font-mono font-semibold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>What&apos;s Included:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-200">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>AI Board Brain:</strong> Vector semantic canvas search</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>AI Summaries:</strong> Instant meeting action items</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Live Share:</strong> Multiplayer realtime collaboration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Presentation Mode:</strong> Interactive laser &amp; step presenter</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span><strong>Clean Exports:</strong> Remove all watermarks</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="space-y-2">
            <Link
              href="/#pricing"
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl font-sans text-xs font-bold text-zinc-950 bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_24px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Upgrade Now &bull; from $5/mo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="text-center text-[10px] font-mono text-zinc-500">
              Cancel anytime. Instant activation.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProUpgradeModal;

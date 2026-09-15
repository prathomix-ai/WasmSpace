"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

interface ProGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function ProGateModal({
  isOpen,
  onClose,
  featureName = "This feature",
}: ProGateModalProps) {
  const { currency } = useCurrency();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg rounded-3xl bg-zinc-900/95 border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(0,245,255,0.25)] p-6 sm:p-8 text-white space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neon-cyan/20 border border-neon-cyan/40 flex items-center justify-center text-neon-cyan shadow-[0_0_20px_rgba(0,245,255,0.35)] shrink-0">
              <Crown className="w-6 h-6 fill-neon-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neon-cyan">
                  MasmSpace Pro Feature
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-neon-cyan text-black uppercase">
                  Locked
                </span>
              </div>
              <h3 className="text-xl font-bold font-mono text-white mt-0.5">
                Unlock {featureName}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            <strong className="text-white">{featureName}</strong> is an exclusive superpower reserved for <strong className="text-neon-cyan">MasmSpace PRO</strong> subscribers. Upgrade now to empower your workflow with next-gen AI and team sync.
          </p>

          {/* Pro Benefits List */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
            <div className="text-xs font-mono font-semibold uppercase text-zinc-400 tracking-wider">
              Included in MasmSpace Pro ({currency === "INR" ? "₹149/mo or ₹1,499/yr" : "$5/mo or $49/yr"}):
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-200 font-sans">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-neon-cyan shrink-0 font-bold" />
                <span>AI Meeting Summaries &amp; Action Items</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-neon-cyan shrink-0 font-bold" />
                <span>Board Brain (Supabase pgvector Semantic Search)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-neon-cyan shrink-0 font-bold" />
                <span>Live Multiplayer Collaborative Canvas Sync</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-neon-cyan shrink-0 font-bold" />
                <span>Laser Presentation &amp; Explain Mode</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href="/#pricing"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl font-mono text-xs font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_24px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Upgrade to Pro Plan ({currency === "INR" ? "₹149/mo" : "$5/mo"})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProGateModal;

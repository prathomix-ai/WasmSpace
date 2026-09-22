"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/lib/currency";

export interface ProGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function ProGateModal({
  isOpen,
  onClose,
  featureName = "this feature",
}: ProGateModalProps) {
  const { currency } = useCurrency();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none font-sans"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl bg-[#121316] border border-zinc-800 shadow-2xl p-6 sm:p-7 text-zinc-100 space-y-5"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Crown className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Pro Feature
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                  Requires Upgrade
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Unlock {featureName}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">{featureName}</strong> is available for <strong className="text-zinc-200">MasmSpace Pro</strong> subscribers. Upgrade your account to unlock full AI capabilities and unlimited cloud collaboration.
          </p>

          {/* Pro Benefits List */}
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2.5">
            <div className="text-xs font-semibold text-zinc-300">
              Included in MasmSpace Pro ({currency === "INR" ? "₹149/mo" : "$5/mo"}):
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>300 Daily AI Generations &amp; Architecture Synthesis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Page Document, PDF, &amp; DOCX Canvas Extraction</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-Time Team Multiplayer &amp; Laser Pointer Presentation</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Watermark-Free Ultra High Resolution 4K Export</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <Link
              href="/pricing"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Upgrade to Pro ({currency === "INR" ? "₹149/mo" : "$5/mo"})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ProGateModal;

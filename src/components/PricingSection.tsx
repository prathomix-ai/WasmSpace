"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Check, ArrowRight, Sparkles, ShieldCheck, Mail } from "lucide-react";
import { ContactSalesModal } from "@/components/ContactSalesModal";
import { ProPricingCard } from "@/components/ProPricingCard";

// Container Variants with sequential staggered reveal
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

// Card Entrance Variants: Slide up and fade in smoothly
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Apple-like smooth cubic-bezier
    },
  },
};

export interface PricingSectionProps {
  onOpenAuth?: () => void;
}

export function PricingSection({ onOpenAuth }: PricingSectionProps = {}) {
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  return (
    <section id="pricing" className="relative py-28 px-6 overflow-hidden">
      {/* Background Ambient Neon Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-500/10 dark:bg-neon-cyan/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-cyan-500/10 dark:bg-neon-cyan/10 border border-cyan-500/30 dark:border-neon-cyan/30 text-cyan-600 dark:text-neon-cyan shadow-[0_0_16px_rgba(0,245,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Transparent Pricing</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-white leading-tight">
            Simple Plans for Every Stage
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
            Start free, explore with your team, and scale effortlessly. No hidden fees, no credit card required to begin.
          </p>
        </motion.div>

        {/* Staggered Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
        >
          {/* ── CARD 1: STARTER ─────────────────────────────────────────── */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              scale: 1.05,
              translateY: -10,
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative p-8 sm:p-9 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-xl flex flex-col justify-between space-y-8 transition-colors duration-300"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Starter
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/10">
                  Solo Thinkers
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">
                  $0
                </span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  / forever free
                </span>
              </div>

              {/* Exact Humanized Copy */}
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed min-h-[40px]">
                Everything you need to sketch out your ideas, forever free.
              </p>

              <div className="w-full h-px bg-black/5 dark:bg-white/10 my-4" />

              {/* Exact Features */}
              <ul className="space-y-3.5 text-xs sm:text-sm font-sans text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Unlimited local canvas</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Run Python directly</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Basic voice commands</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Import PDFs</span>
                </li>
              </ul>
            </div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Link
                href="/canvas"
                className="w-full py-3.5 rounded-2xl font-mono text-xs font-bold text-zinc-900 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Free Canvas</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {/* ── CARD 2: PRO (CYBERPUNK MASTERPIECE WITH MONTHLY/YEARLY TOGGLE) ────── */}
          <ProPricingCard ctaHref="/canvas" onOpenAuth={onOpenAuth} />

          {/* ── CARD 3: ENTERPRISE ─────────────────────────────────────── */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              scale: 1.05,
              translateY: -10,
              boxShadow: "0 20px 40px -15px rgba(168, 85, 247, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative p-8 sm:p-9 rounded-3xl bg-white/70 dark:bg-white/[0.04] backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-xl flex flex-col justify-between space-y-8 transition-colors duration-300"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-neon-purple">
                  Enterprise
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 dark:bg-neon-purple/15 text-purple-600 dark:text-neon-purple border border-purple-500/20">
                  Custom Scale
                </span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold font-mono text-zinc-900 dark:text-white tracking-tight">
                  Custom
                </span>
              </div>

              {/* Exact Humanized Copy */}
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed min-h-[40px]">
                Custom AI models, dedicated security, and white-glove support.
              </p>

              <div className="w-full h-px bg-black/5 dark:bg-white/10 my-4" />

              {/* Exact Features */}
              <ul className="space-y-3.5 text-xs sm:text-sm font-sans text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ENTERPRISE
                    </span>
                    <span>Dedicated secure clusters</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ENTERPRISE
                    </span>
                    <span>Custom LLM integrations</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ENTERPRISE
                    </span>
                    <span>Single Sign-On (SSO)</span>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ENTERPRISE
                    </span>
                    <span>24/7 Priority support</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <motion.div whileTap={{ scale: 0.95 }}>
                <button
                  type="button"
                  onClick={() => setIsSalesModalOpen(true)}
                  className="w-full py-3.5 rounded-2xl font-mono text-xs font-bold text-zinc-900 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/10 dark:border-white/15 hover:border-purple-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                  title="Contact Enterprise Sales via sales@prathomix.tech"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>Talk to Sales</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                </button>
              </motion.div>

              <div className="text-center">
                <a
                  href="mailto:sales@prathomix.tech?subject=MasmSpace%20Enterprise%20Plan%20Inquiry"
                  className="text-[11px] font-mono text-zinc-500 hover:text-purple-400 transition-colors"
                >
                  sales@prathomix.tech
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enterprise Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
      />
    </section>
  );
}

export default PricingSection;

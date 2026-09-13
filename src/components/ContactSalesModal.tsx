"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Building2,
  Sparkles,
} from "lucide-react";

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactSalesModal({ isOpen, onClose }: ContactSalesModalProps) {
  const [copied, setCopied] = useState(false);
  const salesEmail = "sales@prathomix.tech";

  const emailSubject = encodeURIComponent("MasmSpace Enterprise Plan Inquiry");
  const emailBody = encodeURIComponent(
    "Hi Prathomix Sales Team,\n\nI am interested in custom Enterprise licensing for MasmSpace Whiteboard OS.\n\nCompany Name:\nTeam Size:\nSpecific Requirements (e.g. Custom LLM, On-Premise/Dedicated Clusters, SSO):\n\nLooking forward to hearing from you!\n"
  );

  const mailtoUrl = `mailto:${salesEmail}?subject=${emailSubject}&body=${emailBody}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${salesEmail}&su=${emailSubject}&body=${emailBody}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${salesEmail}&subject=${emailSubject}&body=${emailBody}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(salesEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API fails
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg rounded-3xl bg-zinc-950/95 border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] p-6 sm:p-8 text-white space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
                  Prathomix Enterprise
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Direct Line
                </span>
              </div>
              <h3 className="text-xl font-bold font-mono text-white mt-0.5">
                Talk to Sales
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Need custom security clusters, dedicated LLM integrations, or custom user licensing? Contact our solutions engineering team directly.
          </p>

          {/* Email Address Highlight Card */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-purple-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                Official Sales Email
              </span>
              <span className="text-zinc-400">Response time &lt; 24h</span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded-xl border border-purple-500/20">
              <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wide break-all">
                {salesEmail}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 hover:text-white transition-all shrink-0 cursor-pointer"
                title="Copy email to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Email Action Buttons */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Choose your mail client:
            </div>

            {/* Default Mail App (mailto:) */}
            <a
              href={mailtoUrl}
              className="w-full py-3.5 rounded-xl font-mono text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Open Default Mail Client</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Webmail Alternatives */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl font-mono text-xs font-medium text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Gmail Web</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>

              <a
                href={outlookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl font-mono text-xs font-medium text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Outlook Web</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* Quick SLA Note */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              Prathomix Solutions Inc.
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <Sparkles className="w-3 h-3" />
              Enterprise SLA
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ContactSalesModal;

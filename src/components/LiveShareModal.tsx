"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  Globe,
  Shield,
  ChevronDown,
} from "lucide-react";

export type PermissionType = "view" | "edit";

export interface LiveShareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  shareUrl?: string;
  boardTitle?: string;
}

export function LiveShareModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  shareUrl = "https://masmspace.prathomix.tech/canvas/live-session?room=ws-9842f1&key=7x9ab",
  boardTitle = "Untitled Canvas",
}: LiveShareModalProps) {
  // If controlled externally via isOpen/onClose props
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof externalIsOpen === "boolean";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalIsOpen(true);
  };

  const handleClose = useCallback(() => {
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, externalOnClose]);

  // Permissions state
  const [permission, setPermission] = useState<PermissionType>("edit");
  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <>
      {/* ── Standalone Share Button (Rendered when uncontrolled) ────────── */}
      {!isControlled && (
        <button
          onClick={handleOpen}
          aria-label="Share Canvas"
          className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold text-zinc-800 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 backdrop-blur-md border border-black/10 dark:border-white/20 hover:border-cyan-500 dark:hover:border-neon-cyan shadow-sm hover:shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all duration-200 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-neon-cyan" />
          <span>Share</span>
        </button>
      )}

      {/* ── Modal Pop-up ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-share-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Glass Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Panel (Glassmorphism Card) */}
          <div className="relative w-[95%] md:max-w-2xl mx-auto rounded-3xl bg-white/85 dark:bg-[#0d111a]/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden z-10 text-zinc-900 dark:text-zinc-100 animate-scale-in">
            
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-cyan-400 dark:via-neon-cyan to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 dark:bg-neon-cyan/20 border border-cyan-500/30 dark:border-neon-cyan/40 flex items-center justify-center text-cyan-600 dark:text-neon-cyan shadow-[0_0_16px_rgba(0,245,255,0.25)]">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="live-share-modal-title" className="font-mono font-bold text-base sm:text-lg tracking-tight">
                    Share Live Canvas
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[240px] sm:max-w-xs">
                    {boardTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close share dialog"
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              
              {/* Permission & Access Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-600 dark:text-neon-cyan">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold">General Access</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Anyone with the live link can participate
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu for Permissions */}
                <div className="relative shrink-0">
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as PermissionType)}
                    aria-label="Collaboration permission level"
                    className="appearance-none font-mono text-xs font-bold px-4 py-2 pr-9 rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/15 focus:border-cyan-500 dark:focus:border-neon-cyan focus:ring-1 focus:ring-cyan-500 outline-none transition-all cursor-pointer text-zinc-800 dark:text-zinc-100 shadow-sm"
                  >
                    <option value="view">Can View</option>
                    <option value="edit">Can Edit</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Read-only URL Input with Copy Button */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  Direct Live Collaboration Link
                </label>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      aria-label="Whiteboard share link"
                      className="w-full pl-3.5 pr-4 py-2.5 rounded-xl font-mono text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 select-all outline-none focus:border-cyan-500/50"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>

                  {/* Copy Link Button with Visual Feedback */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
                      copied
                        ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] scale-105"
                        : "bg-neon-cyan hover:bg-neon-cyan/90 text-black shadow-[0_0_16px_rgba(0,245,255,0.3)] hover:shadow-[0_0_20px_rgba(0,245,255,0.5)]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-black" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active Multiplayer Preview Indicator */}
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2 overflow-hidden">
                    <div className="w-7 h-7 rounded-full bg-cyan-500 border-2 border-white dark:border-[#0d111a] flex items-center justify-center text-[10px] font-mono font-bold text-black">
                      AM
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-500 border-2 border-white dark:border-[#0d111a] flex items-center justify-center text-[10px] font-mono font-bold text-white">
                      SK
                    </div>
                    <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0d111a] flex items-center justify-center text-[10px] font-mono font-bold text-black">
                      RJ
                    </div>
                  </div>
                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">3 peers</span> ready to sync
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>WebSocket Active</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-500 dark:text-neon-cyan" /> End-to-end encrypted session
              </span>

              <button
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveShareModal;

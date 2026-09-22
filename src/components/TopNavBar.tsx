"use client";

import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Search, Brain, Share2, Code2, Bot } from "lucide-react";

export interface TopNavBarProps {
  boardTitle?: string;
  onBoardTitleChange?: (title: string) => void;
  // Feature Callbacks (handled with handleProClick)
  onPresentClick?: () => void;
  onSearchClick?: () => void;
  onBoardBrainClick?: () => void;
  onShareClick?: () => void;
  // Free / Studio features
  onCodeStudioClick?: () => void;
  isCodeOpen?: boolean;
  onVoiceClick?: () => void;
  isVoiceListening?: boolean;
  liveTranscript?: string;
  isSummarising?: boolean;
  isProUser?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable Glowing PRO Tag (Extracted outside component to prevent re-mounting)
// ─────────────────────────────────────────────────────────────────────────────
const ProTag = memo(function ProTag({ isProUser = false }: { isProUser?: boolean }) {
  return (
    <span
      className={`absolute -top-1.5 -right-1.5 text-[8.5px] rounded-full px-1.5 py-0.2 font-mono font-bold leading-none select-none pointer-events-none transition-all duration-300 ease-in-out ${
        isProUser
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
      }`}
    >
      PRO
    </span>
  );
});

export function TopNavBar({
  boardTitle = "Untitled Board",
  onBoardTitleChange,
  onPresentClick,
  onSearchClick,
  onBoardBrainClick,
  onShareClick,
  onCodeStudioClick,
  isCodeOpen = false,
  onVoiceClick,
  isVoiceListening = false,
  liveTranscript = "",
  isSummarising = false,
  isProUser = false,
}: TopNavBarProps) {
  return (
    <header className="relative w-full max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto select-none transition-all duration-300 ease-in-out">
      {/* ── 1. Minimalist Brand Logo & Board Title (Anti-Overlap Flex Container) ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 max-w-[260px] sm:max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2 group shrink-0 transition-all duration-300 ease-in-out hover:opacity-95"
          title="MasmSpace Whiteboard OS - Powered by Prathomix"
        >
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0 transition-transform duration-300 ease-in-out group-hover:scale-110">
            <Image
              src="/Prathomix-logo.png"
              alt="MasmSpace Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight text-sm sm:text-base font-sans shrink-0 leading-tight">
              MasmSpace
            </span>
            <span className="text-[8px] font-mono tracking-wider text-cyan-400 font-medium leading-none hidden sm:inline-block">
              by Prathomix
            </span>
          </div>
        </Link>

        <div className="h-4 w-[1px] bg-white/10 hidden sm:block shrink-0" />

        {/* Board Title Input (Controlled & Hydration Safe) */}
        <div className="hidden sm:flex items-center min-w-0 flex-1">
          <input
            id="top-nav-board-title"
            type="text"
            value={boardTitle ?? ""}
            onChange={(e) => onBoardTitleChange?.(e.target.value)}
            placeholder="Untitled Board"
            maxLength={50}
            className="w-full bg-transparent border-none outline-none text-xs font-mono font-medium text-gray-300 placeholder-gray-500 hover:text-white focus:text-cyan-400 truncate transition-all duration-300 ease-in-out"
            title="Rename Whiteboard"
            spellCheck={false}
          />
        </div>
      </div>

      {/* ── 2. Core Action Tools Bar (Strict Cyber-Glass Aesthetics) ── */}
      <div className="flex flex-row items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Present (PRO) */}
        <button
          type="button"
          id="btn-nav-present"
          onClick={() => onPresentClick?.()}
          className="relative flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 shadow-sm transition-all duration-300 ease-in-out cursor-pointer shrink-0 active:scale-95"
          title="Present Mode (Laser & Slide deck)"
        >
          <Tv className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline">Present</span>
          <ProTag isProUser={isProUser} />
        </button>

        {/* Search (PRO) */}
        <button
          type="button"
          id="btn-nav-search"
          onClick={() => onSearchClick?.()}
          className="relative flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 shadow-sm transition-all duration-300 ease-in-out cursor-pointer shrink-0 active:scale-95"
          title="Vector RAG Search across board sessions"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline">Search</span>
          <ProTag isProUser={isProUser} />
        </button>

        {/* Board Brain (PRO) */}
        <button
          type="button"
          id="btn-nav-board-brain"
          onClick={() => onBoardBrainClick?.()}
          disabled={isSummarising}
          className="relative flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 shadow-sm transition-all duration-300 ease-in-out cursor-pointer disabled:opacity-50 shrink-0 active:scale-95"
          title="AI Board Brain: Meeting Action Items & Summaries"
        >
          <Brain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline">
            {isSummarising ? "Analysing…" : "Board Brain"}
          </span>
          <ProTag isProUser={isProUser} />
        </button>

        {/* Share (PRO) */}
        <button
          type="button"
          id="btn-nav-share"
          onClick={() => onShareClick?.()}
          className="relative flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 shadow-sm transition-all duration-300 ease-in-out cursor-pointer shrink-0 active:scale-95"
          title="Live Multiplayer Collaboration"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden md:inline">Share</span>
          <ProTag isProUser={isProUser} />
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-0.5 shrink-0" />

        {/* Python / Multi-Language Code Studio */}
        <button
          type="button"
          id="btn-nav-code-studio"
          onClick={() => onCodeStudioClick?.()}
          className={`relative flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ease-in-out cursor-pointer shrink-0 active:scale-95 ${
            isCodeOpen
              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              : "text-gray-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40"
          }`}
          title="Python & Multi-Language Studio (C, C++, Java, JS, TS, Python, SQL)"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="hidden lg:inline">Code</span>
        </button>

        {/* Animated Robot Voice AI Button (Cyber-Glass Accents) */}
        <div className="relative flex items-center shrink-0">
          <motion.button
            type="button"
            id="btn-nav-voice-robot"
            onClick={() => onVoiceClick?.()}
            animate={{ y: [-2, 2, -2] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-row items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all duration-300 ease-in-out cursor-pointer shrink-0 ${
              isVoiceListening
                ? "bg-purple-950/50 border border-purple-500 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-gray-300 hover:text-white hover:border-cyan-400/50"
            }`}
            title={
              isVoiceListening
                ? "Listening… Click to stop"
                : "Voice AI (Speak commands to draw, create shapes, clear)"
            }
          >
            <Bot
              className={`w-3.5 h-3.5 shrink-0 ${
                isVoiceListening ? "text-purple-400 animate-pulse" : "text-cyan-400"
              }`}
            />
            <span className="hidden sm:inline font-mono text-[11px]">
              {isVoiceListening ? "Listening…" : "Voice AI"}
            </span>
          </motion.button>

          {/* Live Transcript Pill (Absolute Non-Overlapping Position) */}
          <AnimatePresence>
            {isVoiceListening && liveTranscript?.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2.5 right-0 min-w-[200px] max-w-[280px] px-3 py-1.5 rounded-xl bg-[#0a0a0a]/90 backdrop-blur-xl border border-purple-500/60 text-[11px] text-purple-200 font-mono shadow-[0_0_25px_rgba(168,85,247,0.35)] pointer-events-none z-50 truncate"
              >
                &ldquo;{liveTranscript.trim()}&rdquo;
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;

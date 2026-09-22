"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface GlobalLoaderProps {
  message?: string;
  submessage?: string;
  showProgress?: boolean;
  onLoaded?: () => void;
  fullScreen?: boolean;
}

export function GlobalLoader({
  message = "Initializing MasmSpace Whiteboard Engine",
  submessage = "Streaming WebAssembly & Neural Architecture assets…",
  showProgress = true,
  onLoaded,
  fullScreen = true,
}: GlobalLoaderProps) {
  const [progress, setProgress] = useState(15);
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);

  const phrases = [
    "Compiling WebAssembly canvas pipeline…",
    "Calibrating pgvector neural embeddings…",
    "Establishing peer-to-peer WebRTC mesh…",
    "Loading infinite multi-dimensional grid…",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          onLoaded?.();
          return 100;
        }
        const delta = Math.floor(Math.random() * 15) + 8;
        return Math.min(100, prev + delta);
      });
    }, 280);

    const phraseInterval = setInterval(() => {
      setActivePhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 1800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phraseInterval);
    };
  }, [onLoaded, phrases.length]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[#09090b] text-white select-none ${
        fullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full w-full py-16"
      }`}
    >
      {/* ── 1. Ambient Glowing Aurora Gradient Orbs ───────────────────────── */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px] animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/25 blur-[140px] animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[160px]" />

      {/* Subtle Grid Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(rgba(0, 245, 255, 0.25) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── 2. Central Glassmorphic Loader Card ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-md w-[90%] p-8 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(6,182,212,0.15)]"
      >
        {/* Modern Rotating SVG Orbit Rings around pulsing Logo */}
        <div className="relative flex items-center justify-center mb-7">
          {/* Outer SVG Drawing Ring 1 */}
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="50"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2.5"
              fill="transparent"
            />
            <motion.circle
              cx="56"
              cy="56"
              r="50"
              stroke="url(#auroraGradient)"
              strokeWidth="3"
              strokeDasharray="314"
              strokeDashoffset="314"
              animate={{
                strokeDashoffset: [314, 0, 314],
                rotate: [0, 360],
              }}
              transition={{
                strokeDashoffset: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 6, repeat: Infinity, ease: "linear" },
              }}
              strokeLinecap="round"
              fill="transparent"
            />
            <defs>
              <linearGradient id="auroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5ff" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Reverse Counter-Rotating Ring 2 */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-cyan-400/30 m-2"
          />

          {/* Pulsing Brand Logo Center */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              filter: [
                "drop-shadow(0 0 12px rgba(6,182,212,0.5))",
                "drop-shadow(0 0 28px rgba(6,182,212,0.85)) drop-shadow(0 0 45px rgba(168,85,247,0.4))",
                "drop-shadow(0 0 12px rgba(6,182,212,0.5))",
              ],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-14 h-14 relative flex items-center justify-center"
          >
            <Image
              src="/Prathomix-logo.png"
              alt="MasmSpace Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </motion.div>
        </div>

        {/* Brand Name & Status Headline */}
        <div className="flex flex-col items-center text-center gap-1.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
              MASMSPACE OS • BY PRATHOMIX
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 font-bold uppercase">
              V2.4 NEURAL
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-sans text-white tracking-tight">
            {message}
          </h2>
          <AnimatePresence mode="wait">
            <motion.p
              key={activePhraseIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-zinc-400 font-mono tracking-wide h-4"
            >
              {phrases[activePhraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── 3. Elegant Linear Progress Bar ───────────────────────────────── */}
        {showProgress && (
          <div className="w-full space-y-2">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                initial={{ width: "10%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span>INITIALIZING CORE</span>
              <span className="text-cyan-400 font-bold">{progress}%</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default GlobalLoader;

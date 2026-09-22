"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Cpu, Layers, Activity } from "lucide-react";

export interface CanvasLoaderProps {
  message?: string;
  submessage?: string;
  onLoaded?: () => void;
  fullScreen?: boolean;
}

export function CanvasLoader({
  message = "Loading Workspace Environment…",
  submessage = "Streaming WebAssembly Canvas Engine & Vector RAG Pipeline",
  onLoaded,
  fullScreen = true,
}: CanvasLoaderProps) {
  const [progress, setProgress] = useState(18);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const pipelineSteps = [
    "Initializing Pyodide WebAssembly runtime…",
    "Compiling infinite vector coordinate space…",
    "Calibrating GPU hardware acceleration…",
    "Mounting collaborative live canvas engine…",
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          onLoaded?.();
          return 100;
        }
        const increment = Math.floor(Math.random() * 12) + 8;
        return Math.min(100, prev + increment);
      });
    }, 220);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % pipelineSteps.length);
    }, 1400);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [onLoaded, pipelineSteps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`relative flex items-center justify-center overflow-hidden bg-[#09090b] text-white select-none ${
        fullScreen ? "fixed inset-0 z-[99999] h-screen w-screen" : "h-full w-full py-16"
      }`}
    >
      {/* ── 1. Ambient Glowing Aurora Gradient Orbs ───────────────────────── */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-500/20 blur-[140px] animate-pulse" />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/25 blur-[150px] animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-blue-600/10 blur-[170px]" />

      {/* Cyber Grid Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(rgba(0, 245, 255, 0.28) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── 2. Central Glassmorphic Loader Card ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-md w-[92%] sm:w-[440px] p-8 sm:p-10 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(6,182,212,0.2)]"
      >
        {/* Glowing Logo Container with Pulsing Rings */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated SVG Orbit Ring */}
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
              stroke="url(#canvasAuroraGradient)"
              strokeWidth="3.5"
              strokeDasharray="314"
              strokeDashoffset={314 - (314 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="canvasAuroraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Pulsing Central Logo */}
          <motion.div
            animate={{
              scale: [1, 1.06, 1],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 m-auto w-14 h-14 rounded-2xl bg-[#09090b]/80 border border-cyan-400/40 p-2.5 flex items-center justify-center shadow-[0_0_28px_rgba(6,182,212,0.45)]"
          >
            <Image
              src="/Prathomix-logo.png"
              alt="MasmSpace"
              width={40}
              height={40}
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]"
              priority
            />
          </motion.div>
        </div>

        {/* Text Header */}
        <h3 className="text-xl font-bold tracking-tight text-white mb-2 text-center flex items-center gap-2">
          <span>{message}</span>
        </h3>
        <p className="text-xs text-zinc-400 text-center mb-6 leading-relaxed">
          {submessage}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center text-[11px] font-mono text-cyan-400 mb-2">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              INITIALIZING
            </span>
            <span className="font-bold text-cyan-300">{progress}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden relative">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Active Realtime Step Text */}
        <div className="h-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStepIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] font-mono text-cyan-300/80 truncate text-center"
            >
              {pipelineSteps[currentStepIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Status badges footer */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-white/5 w-full text-[10px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" /> 60 FPS Engine
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-400" /> Pyodide WASM
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-400" /> Local First
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CanvasLoader;

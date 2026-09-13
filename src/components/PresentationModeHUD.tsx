"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PresentationModeHUDProps {
  isActive: boolean;
  onExit: () => void;
  editor?: any;
  excalidrawAPI?: any;
  onLaserMove?: (pos: { x: number; y: number } | null) => void;
}

export default function PresentationModeHUD({
  isActive,
  onExit,
  editor,
  excalidrawAPI,
  onLaserMove,
}: PresentationModeHUDProps) {
  const [laserActive, setLaserActive] = useState(true);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Laser Pointer cursor tracker (Throttled to 50ms for fluid WebSocket broadcast)
  useEffect(() => {
    if (!isActive || !laserActive) {
      onLaserMove?.(null);
      return;
    }

    let lastUpdate = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const pos = { x: e.clientX, y: e.clientY };

      if (now - lastUpdate >= 50) {
        lastUpdate = now;
        setLaserPos(pos);
        onLaserMove?.(pos);
      } else if (!timer) {
        timer = setTimeout(() => {
          setLaserPos(pos);
          onLaserMove?.(pos);
          lastUpdate = performance.now();
          timer = null;
        }, 50);
      }
    };

    const handleMouseLeave = () => {
      onLaserMove?.(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      onLaserMove?.(null);
    };
  }, [isActive, laserActive, onLaserMove]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Slide navigation by zooming to shapes sequentially (Wrapped in useCallback)
  const getCanvasShapes = useCallback(() => {
    if (excalidrawAPI?.getSceneElements) {
      return excalidrawAPI.getSceneElements().filter((el: any) => !el?.isDeleted);
    }
    if (editor?.getCurrentPageShapes && typeof editor.getCurrentPageShapes === "function") {
      return Array.from(editor.getCurrentPageShapes());
    }
    return [];
  }, [excalidrawAPI, editor]);

  const handleNextSlide = useCallback(() => {
    const shapes = getCanvasShapes();
    if (!shapes || shapes.length === 0) return;
    const nextIdx = (currentSlideIndex + 1) % shapes.length;
    setCurrentSlideIndex(nextIdx);
    const targetShape = shapes[nextIdx];
    if (targetShape) {
      if (excalidrawAPI?.scrollToContent) {
        excalidrawAPI.scrollToContent([targetShape], { fitToViewport: true });
      } else if (editor?.select && editor?.zoomToSelection) {
        editor.select(targetShape.id);
        editor.zoomToSelection({ animation: { duration: 350 } });
      }
    }
  }, [getCanvasShapes, currentSlideIndex, excalidrawAPI, editor]);

  const handlePrevSlide = useCallback(() => {
    const shapes = getCanvasShapes();
    if (!shapes || shapes.length === 0) return;
    const prevIdx = (currentSlideIndex - 1 + shapes.length) % shapes.length;
    setCurrentSlideIndex(prevIdx);
    const targetShape = shapes[prevIdx];
    if (targetShape) {
      if (excalidrawAPI?.scrollToContent) {
        excalidrawAPI.scrollToContent([targetShape], { fitToViewport: true });
      } else if (editor?.select && editor?.zoomToSelection) {
        editor.select(targetShape.id);
        editor.zoomToSelection({ animation: { duration: 350 } });
      }
    }
  }, [getCanvasShapes, currentSlideIndex, excalidrawAPI, editor]);

  // Keyboard shortcut: Esc to exit present mode, Left/Right for slides
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit?.();
      } else if (e.key === "ArrowRight" || e.key === "Space") {
        handleNextSlide();
      } else if (e.key === "ArrowLeft") {
        handlePrevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onExit, handleNextSlide, handlePrevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (!isActive) return null;

  const totalShapes = excalidrawAPI
    ? excalidrawAPI.getSceneElements().filter((el: any) => !el.isDeleted).length
    : editor && typeof editor.getCurrentPageShapes === "function"
    ? editor.getCurrentPageShapes().length
    : 0;

  return (
    <>
      {/* ── Glowing Neon Laser Pointer Effect ───────────────────────────── */}
      {laserActive && (
        <div
          className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out"
          style={{
            left: laserPos.x,
            top: laserPos.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Core Dot */}
          <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-[0_0_12px_#00f5ff,0_0_24px_#00f5ff]" />
          {/* Outer Ring */}
          <div className="absolute inset-[-6px] rounded-full border border-neon-cyan/50 animate-ping" />
        </div>
      )}

      {/* ── Distraction-Free Presentation HUD (Floating Island Detached from Bottom) ──────────── */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#09090b]/60 backdrop-blur-xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.6)] text-white select-none transition-all duration-300 ease-in-out"
      >
        {/* Presenting Indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]">
            Present Mode
          </span>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center gap-1.5 px-2">
          <button
            onClick={handlePrevSlide}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs cursor-pointer"
            title="Previous Frame (Left Arrow)"
          >
            ◀
          </button>
          <span className="text-xs font-mono text-zinc-400 px-1">
            {totalShapes > 0 ? `${currentSlideIndex + 1} / ${totalShapes}` : "Free Walk"}
          </span>
          <button
            onClick={handleNextSlide}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs cursor-pointer"
            title="Next Frame (Right Arrow / Space)"
          >
            ▶
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Laser Pointer Toggle */}
        <button
          onClick={() => setLaserActive(!laserActive)}
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            laserActive
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title="Toggle Presenter Laser Pointer"
        >
          <span>🎯</span>
          <span>Laser</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? "🗗" : "⛶"}
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Exit Presentation */}
        <button
          onClick={onExit}
          className="px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
          title="Exit Present Mode (Esc)"
        >
          <span>✕</span>
          <span>Exit</span>
          <kbd className="text-[9px] bg-red-950/60 px-1 py-0.5 rounded text-red-300">Esc</kbd>
        </button>
      </motion.div>
    </>
  );
}

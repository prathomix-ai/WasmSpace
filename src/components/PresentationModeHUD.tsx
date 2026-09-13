"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Pen,
  Eraser,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

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
  const [hudTool, setHudTool] = useState<"laser" | "draw" | "eraser">("laser");

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

  // Slide navigation by zooming to shapes/frames sequentially
  const getCanvasShapes = useCallback(() => {
    if (excalidrawAPI?.getSceneElements) {
      const allElements = excalidrawAPI.getSceneElements().filter((el: any) => !el?.isDeleted);
      const frames = allElements.filter((el: any) => el?.type === "frame");
      return frames.length > 0 ? frames : allElements;
    }
    if (editor?.getCurrentPageShapes && typeof editor.getCurrentPageShapes === "function") {
      return Array.from(editor.getCurrentPageShapes());
    }
    return [];
  }, [excalidrawAPI, editor]);

  // Force-clear selections whenever Present Mode becomes active
  useEffect(() => {
    if (isActive && excalidrawAPI?.updateScene) {
      excalidrawAPI.updateScene({
        appState: {
          selectedElementIds: {},
          selectedGroupIds: {},
        },
      });
    }
  }, [isActive, excalidrawAPI]);

  const navigateToSlide = useCallback((targetIdx: number) => {
    const shapes = getCanvasShapes();
    if (!shapes || shapes.length === 0) return;

    const boundedIdx = (targetIdx + shapes.length) % shapes.length;
    setCurrentSlideIndex(boundedIdx);

    const targetShape = shapes[boundedIdx];
    if (targetShape) {
      if (excalidrawAPI) {
        // 1. Smoothly pan & zoom to the target frame's coordinates without selecting it
        if (typeof excalidrawAPI.scrollToContent === "function") {
          excalidrawAPI.scrollToContent([targetShape], {
            fitToViewport: true,
            viewportZoomFactor: 0.85,
            animate: true,
            duration: 350,
          });
        }

        // 2. Force-clear any active selections so no crisscross bounding box appears
        if (typeof excalidrawAPI.updateScene === "function") {
          excalidrawAPI.updateScene({
            appState: {
              selectedElementIds: {},
              selectedGroupIds: {},
            },
          });
          // Redundant tick to prevent race conditions with internal Excalidraw animation ticks
          requestAnimationFrame(() => {
            excalidrawAPI.updateScene?.({
              appState: {
                selectedElementIds: {},
                selectedGroupIds: {},
              },
            });
          });
        }
      } else if (editor) {
        if (editor.zoomToSelection) {
          editor.zoomToSelection({ animation: { duration: 350 } });
        }
        if (editor.deselectAll) {
          editor.deselectAll();
        }
      }
    }
  }, [getCanvasShapes, excalidrawAPI, editor]);

  const handleNextSlide = useCallback(() => {
    navigateToSlide(currentSlideIndex + 1);
  }, [navigateToSlide, currentSlideIndex]);

  const handlePrevSlide = useCallback(() => {
    navigateToSlide(currentSlideIndex - 1);
  }, [navigateToSlide, currentSlideIndex]);

  // Presenter tool switches
  const handleSelectLaser = () => {
    setHudTool("laser");
    setLaserActive(true);
    if (excalidrawAPI?.setActiveTool) {
      excalidrawAPI.setActiveTool({ type: "selection" });
    }
  };

  const handleSelectDraw = () => {
    setHudTool("draw");
    setLaserActive(false);
    if (excalidrawAPI?.setActiveTool) {
      excalidrawAPI.setActiveTool({ type: "freedraw" });
    }
  };

  const handleSelectEraser = () => {
    setHudTool("eraser");
    setLaserActive(false);
    if (excalidrawAPI?.setActiveTool) {
      excalidrawAPI.setActiveTool({ type: "eraser" });
    }
  };

  // Keyboard shortcut: Esc to exit present mode, Left/Right/Space for slides
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

      {/* ── Movable / Draggable Presentation HUD Floating Island ──────────── */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
        style={{ left: "calc(50% - 260px)", bottom: "28px" }}
        className="fixed z-50 flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#09090b]/85 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-white select-none transition-shadow hover:shadow-[0_12px_45px_rgba(6,182,212,0.25)]"
      >
        {/* Drag Handle to Move HUD */}
        <div
          className="flex items-center text-zinc-500 hover:text-cyan-400 cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors"
          title="Drag to move this toolbar anywhere"
        >
          <GripVertical className="w-4 h-4 shrink-0" />
        </div>

        {/* Presenting Indicator */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-white/10 cursor-grab active:cursor-grabbing">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
          <span className="text-[11px] sm:text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]">
            Present Mode
          </span>
        </div>

        {/* Slide Navigation */}
        <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            onClick={handlePrevSlide}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs cursor-pointer"
            title="Previous Frame (Left Arrow)"
          >
            ◀
          </button>
          <span className="text-[11px] sm:text-xs font-mono text-zinc-400 px-1 whitespace-nowrap">
            {totalShapes > 0 ? `${currentSlideIndex + 1} / ${totalShapes}` : "Free Walk"}
          </span>
          <button
            type="button"
            onClick={handleNextSlide}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-white transition-all text-xs cursor-pointer"
            title="Next Frame (Right Arrow / Space)"
          >
            ▶
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Presenter Tools: Laser & Pen & Eraser */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSelectLaser}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              hudTool === "laser" && laserActive
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Laser Pointer (Focus attention with neon trail)"
          >
            <span className="text-xs">🎯</span>
            <span className="font-mono text-xs hidden sm:inline">Laser</span>
          </button>

          <button
            type="button"
            onClick={handleSelectDraw}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              hudTool === "draw"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Pen / Draw (Sketch & explain live on canvas)"
          >
            <Pen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-xs hidden sm:inline">Draw</span>
          </button>

          <button
            type="button"
            onClick={handleSelectEraser}
            className={`px-2 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
              hudTool === "eraser"
                ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Eraser (Erase annotations)"
          >
            <Eraser className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Exit Presentation */}
        <button
          type="button"
          onClick={onExit}
          className="px-2.5 py-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.2)] cursor-pointer"
          title="Exit Present Mode (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit</span>
          <kbd className="text-[9px] bg-red-950/60 px-1 py-0.5 rounded text-red-300 font-mono">Esc</kbd>
        </button>
      </motion.div>
    </>
  );
}

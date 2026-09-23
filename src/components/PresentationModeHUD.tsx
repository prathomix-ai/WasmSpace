"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
  Pen,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";

export type PresentationShapeType = 'rectangle' | 'circle' | 'arrow' | 'text' | 'star' | string;

export interface PresentationModeHUDProps {
  isActive: boolean;
  onExit: () => void;
  totalSlides?: number;
  currentSlideIndex?: number;
  currentSlideTitle?: string;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  activeTool?: string;
  onSelectTool?: (tool: any) => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  [key: string]: any;
}

export default function PresentationModeHUD({
  isActive,
  onExit,
  totalSlides = 4,
  currentSlideIndex = 0,
  currentSlideTitle = "Overview",
  onNextSlide,
  onPrevSlide,
  activeTool = "select",
  onSelectTool,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
  onFitView,
}: PresentationModeHUDProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Esc key listener
  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      } else if (e.key === "ArrowRight" || e.key === "Space") {
        onNextSlide?.();
      } else if (e.key === "ArrowLeft") {
        onPrevSlide?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, onExit, onNextSlide, onPrevSlide]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] select-none pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-zinc-200/90 shadow-[0_8px_32px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)] text-zinc-800 text-xs"
        >
          {/* Slide Navigation: Prev */}
          <button
            type="button"
            onClick={onPrevSlide}
            disabled={currentSlideIndex <= 0}
            title="Previous Slide (Left Arrow)"
            className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Slide Progress / Title Indicator */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-zinc-600">
            <span className="font-semibold text-zinc-900">
              {currentSlideIndex + 1}
            </span>
            <span className="text-zinc-400">/</span>
            <span>{Math.max(1, totalSlides)}</span>
            {currentSlideTitle && (
              <>
                <span className="text-zinc-300">·</span>
                <span className="font-sans font-medium text-zinc-700 truncate max-w-[120px]">
                  {currentSlideTitle}
                </span>
              </>
            )}
          </div>

          {/* Slide Navigation: Next */}
          <button
            type="button"
            onClick={onNextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            title="Next Slide (Right Arrow or Space)"
            className="p-1.5 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Pointer / Laser Mode */}
          <button
            type="button"
            onClick={() => onSelectTool?.(activeTool === "laser" ? "select" : "laser")}
            title="Presenter Laser Pointer"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTool === "laser"
                ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                : "hover:bg-zinc-100 text-zinc-600"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>

          {/* Draw annotation on slide */}
          <button
            type="button"
            onClick={() => onSelectTool?.(activeTool === "pen" ? "select" : "pen")}
            title="Pen Annotation"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTool === "pen"
                ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                : "hover:bg-zinc-100 text-zinc-600"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Zoom controls */}
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-zinc-500 w-8 text-center">
            {Math.round(zoomLevel)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Exit Presentation */}
          <button
            type="button"
            onClick={onExit}
            title="Exit Presentation Mode (Esc)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium transition-colors cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit</span>
            <kbd className="text-[9px] font-mono text-zinc-400 bg-white border border-zinc-200 px-1 rounded">
              Esc
            </kbd>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

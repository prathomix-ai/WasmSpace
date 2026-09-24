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
          className="pointer-events-auto flex items-center gap-2 bg-[#171719] border border-[#2A2A2F] px-3 py-1.5 rounded-lg shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5)] text-[#F4F4F5] text-xs"
        >
          {/* Slide Navigation: Prev */}
          <button
            type="button"
            onClick={onPrevSlide}
            disabled={currentSlideIndex <= 0}
            title="Previous slide (Left Arrow)"
            className="p-1.5 rounded text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Slide Progress / Title Indicator */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-[11px] text-zinc-600">
            <span className="font-semibold text-[#F4F4F5]">
              {currentSlideIndex + 1}
            </span>
            <span className="text-[#71717A]">/</span>
            <span>{Math.max(1, totalSlides)}</span>
            {currentSlideTitle && (
              <>
                <span className="text-[#71717A]">·</span>
                <span className="font-sans font-medium text-[#A1A1AA] truncate max-w-[120px]">
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
            className="p-1.5 rounded text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-3.5 w-px bg-[#2A2A2F] mx-0.5" />

          {/* Pointer / Laser Mode */}
          <button
            type="button"
            onClick={() => onSelectTool?.(activeTool === "laser" ? "select" : "laser")}
            title="Presenter Laser Pointer"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              activeTool === "laser"
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-semibold"
                : "hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5]"
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>

          {/* Draw annotation on slide */}
          <button
            type="button"
            onClick={() => onSelectTool?.(activeTool === "pen" ? "select" : "pen")}
            title="Pen Annotation"
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              activeTool === "pen"
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-semibold"
                : "hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5]"
            }`}
          >
            <Pen className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#2A2A2F] mx-0.5" />

          {/* Zoom controls */}
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-[#A1A1AA] w-8 text-center">
            {Math.round(zoomLevel)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#2A2A2F] mx-0.5" />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-1.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Exit Presentation */}
          <button
            type="button"
            onClick={onExit}
            title="Exit Presentation Mode (Esc)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#F87171]/15 text-[#F87171] hover:bg-[#F87171]/25 font-medium transition-colors cursor-pointer ml-1 text-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit</span>
            <kbd className="text-[9px] font-mono text-[#F87171] bg-[#111113] border border-[#F87171]/30 px-1 rounded">
              Esc
            </kbd>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

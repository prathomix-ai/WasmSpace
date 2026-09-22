"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Pen,
  Eraser,
  Maximize2,
  Minimize2,
  X,
  Shapes,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  SHAPE_LIBRARY,
  CATEGORY_LABELS,
  type ShapeCategory,
  type ShapeDefinition,
} from "@/constants/shapeLibrary";

export type PresentationShapeType = string;

export interface PresentationModeHUDProps {
  isActive: boolean;
  onExit: () => void;
  // Slide navigation
  totalSlides?: number;
  currentSlideIndex?: number;
  currentSlideTitle?: string;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  // Presenter tools
  activeTool?: string;
  onSelectTool?: (tool: "select" | "pan" | "pen" | "highlighter" | "eraser" | "laser") => void;
  // Shapes dropdown
  onAddShape?: (shape: string) => void;
  // Ink styling
  penColor?: string;
  onChangePenColor?: (color: string) => void;
  // Optional legacy props
  editor?: any;
  onLaserMove?: (pos: { x: number; y: number } | null) => void;
}

const QUICK_COLORS = [
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#ef4444", name: "Crimson" },
  { hex: "#10b981", name: "Emerald" },
  { hex: "#f59e0b", name: "Amber" },
  { hex: "#ffffff", name: "White" },
];

export default function PresentationModeHUD({
  isActive,
  onExit,
  totalSlides = 0,
  currentSlideIndex = 0,
  currentSlideTitle = "",
  onNextSlide,
  onPrevSlide,
  activeTool = "select",
  onSelectTool,
  onAddShape,
  penColor = "#06b6d4",
  onChangePenColor,
  editor,
  onLaserMove: _onLaserMove,
}: PresentationModeHUDProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [shapeSearch, setShapeSearch] = useState("");
  const [activeShapeCategory, setActiveShapeCategory] = useState<ShapeCategory>("all");
  const shapesMenuRef = useRef<HTMLDivElement>(null);

  const dailyUseShapes = useMemo(
    () => SHAPE_LIBRARY.filter((s) => s.isDailyUse),
    []
  );

  const filteredShapes = useMemo(() => {
    let list = SHAPE_LIBRARY;
    if (activeShapeCategory !== "all") {
      if (activeShapeCategory === "essentials") {
        list = list.filter((s) => s.isDailyUse);
      } else {
        list = list.filter((s) => s.category === activeShapeCategory);
      }
    }
    if (shapeSearch.trim()) {
      const q = shapeSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [shapeSearch, activeShapeCategory]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Close shapes menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(e.target as Node)) {
        setIsShapesOpen(false);
      }
    };
    if (isShapesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isShapesOpen]);

  // Fallback slide navigation for legacy tldraw editor if passed
  const handleLegacyNext = useCallback(() => {
    if (onNextSlide) {
      onNextSlide();
    } else if (editor?.getCurrentPageShapes) {
      const shapes = Array.from(editor.getCurrentPageShapes());
      if (shapes.length > 0) {
        editor.zoomToSelection?.({ animation: { duration: 350 } });
      }
    }
  }, [onNextSlide, editor]);

  const handleLegacyPrev = useCallback(() => {
    if (onPrevSlide) {
      onPrevSlide();
    }
  }, [onPrevSlide]);

  // Global Keyboard shortcuts when Presentation Mode is active
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "Escape") {
        onExit?.();
      } else if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        handleLegacyNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleLegacyPrev();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsMinimized((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onExit, handleLegacyNext, handleLegacyPrev]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleShapeSelect = (shape: ShapeDefinition) => {
    if (onAddShape) {
      onAddShape(shape.id);
    }
    setIsShapesOpen(false);
  };

  if (!isActive) return null;

  const isLaserActive = activeTool === "laser";
  const isDrawActive = activeTool === "pen";
  const isEraserActive = activeTool === "eraser";

  return (
    <>
      <AnimatePresence mode="wait">
        {isMinimized ? (
          /* ── Minimized Ultra-Compact Presentation Pill ── */
          <motion.div
            key="minimized-hud"
            drag
            dragMomentum={false}
            dragElastic={0.06}
            initial={{ y: 20, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{ left: "calc(50% - 130px)", bottom: "20px" }}
            className="fixed z-[99999] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1017]/95 backdrop-blur-2xl border border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.85)] text-zinc-100 select-none pointer-events-auto"
          >
            {/* Drag Handle */}
            <div
              className="flex items-center text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-0.5 -ml-1 transition-colors"
              title="Drag mini toolbar"
            >
              <GripVertical className="w-3.5 h-3.5 shrink-0" />
            </div>

            {/* Glowing Cyan Status Indicator */}
            <div className="flex items-center gap-1.5 pr-1.5 border-r border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                PRESENT
              </span>
            </div>

            {/* Slide Navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLegacyPrev}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-[10px] cursor-pointer"
                title="Previous Frame (Left Arrow)"
              >
                ◀
              </button>
              <span
                className="text-[11px] font-mono text-zinc-300 px-1 whitespace-nowrap font-medium"
                title={currentSlideTitle ? `Current: ${currentSlideTitle}` : "Slide navigation"}
              >
                {totalSlides > 0 ? `${currentSlideIndex + 1} / ${totalSlides}` : "Free"}
              </span>
              <button
                type="button"
                onClick={handleLegacyNext}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-[10px] cursor-pointer"
                title="Next Frame (Right Arrow / Space)"
              >
                ▶
              </button>
            </div>

            <div className="w-[1px] h-3.5 bg-zinc-800" />

            {/* Expand Full Toolbar Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-all border border-cyan-500/30 cursor-pointer"
              title="Expand Presenter Toolbar (M)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans font-medium">Tools</span>
            </button>

            {/* Quick Exit Button */}
            <button
              type="button"
              onClick={onExit}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
              title="Exit Present Mode (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* ── Full Movable Presentation Floating Toolbar (Exact Match with Image 2) ── */
          <motion.div
            key="full-hud"
            drag
            dragMomentum={false}
            dragElastic={0.06}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{ left: "calc(50% - 280px)", bottom: "24px" }}
            className="fixed z-[99999] flex items-center gap-2 sm:gap-2.5 px-3 py-2 rounded-2xl bg-[#0d1017]/95 backdrop-blur-2xl border border-zinc-800 shadow-[0_12px_45px_rgba(0,0,0,0.85)] text-zinc-100 select-none pointer-events-auto"
          >
        {/* 1. Drag Handle Dots */}
        <div
          className="flex items-center text-zinc-500 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-1 -ml-1 transition-colors"
          title="Drag to reposition toolbar"
        >
          <GripVertical className="w-4 h-4 shrink-0" />
        </div>

        {/* 2. PRESENT MODE Indicator with Glowing Cyan Dot */}
        <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
            PRESENT MODE
          </span>
        </div>

        {/* 3. Slide Walk Navigation: ◀ Free Walk ▶ or ◀ 1 / N ▶ */}
        <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            onClick={handleLegacyPrev}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer"
            title="Previous Frame (Left Arrow)"
          >
            ◀
          </button>
          <span
            className="text-xs font-mono text-zinc-300 px-1 whitespace-nowrap"
            title={currentSlideTitle ? `Current: ${currentSlideTitle}` : "Slide navigation"}
          >
            {totalSlides > 0 ? `${currentSlideIndex + 1} / ${totalSlides}` : "Free Walk"}
          </span>
          <button
            type="button"
            onClick={handleLegacyNext}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs cursor-pointer"
            title="Next Frame (Right Arrow / Space)"
          >
            ▶
          </button>
        </div>

        <div className="w-[1px] h-4 bg-zinc-800" />

        {/* 4. Laser Pointer Tool (🎯 Laser) */}
        <button
          type="button"
          onClick={() => onSelectTool?.(isLaserActive ? "select" : "laser")}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            isLaserActive
              ? "bg-rose-500/15 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-semibold"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
          }`}
          title="Laser Pointer [L]"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
          <span className="font-sans">Laser</span>
        </button>

        {/* 5. Draw Tool (✏️ Draw with Emerald Pill Outline as in Image 2) */}
        <button
          type="button"
          onClick={() => onSelectTool?.(isDrawActive ? "select" : "pen")}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
            isDrawActive
              ? "border border-emerald-500/80 bg-emerald-500/15 text-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.25)] font-semibold"
              : "text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/60 border border-transparent"
          }`}
          title="Draw with Ink Pen [P]"
        >
          <Pen className={`w-3.5 h-3.5 ${isDrawActive ? "text-emerald-400" : "text-emerald-400/80"}`} />
          <span className="font-sans">Draw</span>
        </button>

        {/* Quick Ink Color Swatch (When Draw is active) */}
        {isDrawActive && onChangePenColor && (
          <div className="flex items-center gap-1 px-1 bg-zinc-900/90 rounded-lg py-0.5 border border-zinc-800">
            {QUICK_COLORS.map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() => onChangePenColor(col.hex)}
                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                  penColor.toLowerCase() === col.hex.toLowerCase()
                    ? "ring-2 ring-emerald-400 scale-110"
                    : "opacity-70 hover:opacity-100 hover:scale-110"
                }`}
                style={{ backgroundColor: col.hex }}
                title={`Pen Color: ${col.name}`}
              />
            ))}
          </div>
        )}

        {/* 6. Eraser Tool */}
        <button
          type="button"
          onClick={() => onSelectTool?.(isEraserActive ? "select" : "eraser")}
          className={`px-2 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
            isEraserActive
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "text-amber-400/80 hover:text-amber-300 hover:bg-zinc-800/60 border border-transparent"
          }`}
          title="Eraser [E]"
        >
          <Eraser className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* 7. Shapes Library Dropdown Menu (100+ Shapes Grid with Search & Daily Use on Top) */}
        <div className="relative" ref={shapesMenuRef}>
          <button
            type="button"
            onClick={() => setIsShapesOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isShapesOpen
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/60 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
            }`}
            title="Add Architecture Shapes (100+ Library)"
          >
            <Shapes className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline font-sans">Shapes</span>
            <ChevronUp
              className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
                isShapesOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Floating Shapes Popover Menu */}
          <AnimatePresence>
            {isShapesOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 sm:w-[380px] bg-[#0d1017]/98 backdrop-blur-2xl border border-zinc-700/80 rounded-2xl p-3 shadow-[0_20px_60px_rgba(0,0,0,0.95)] z-50 flex flex-col gap-2.5"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-200">
                      Shape Library
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold">
                      110+ Shapes
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Keynote Deck</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={shapeSearch}
                    onChange={(e) => setShapeSearch(e.target.value)}
                    placeholder="Search 100+ shapes (e.g. database, cloud, arrow)..."
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 font-sans transition-all"
                  />
                  {shapeSearch && (
                    <button
                      type="button"
                      onClick={() => setShapeSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {(["all", "essentials", "flowchart", "cloud", "database", "network", "arrows", "symbols"] as ShapeCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveShapeCategory(cat)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                        activeShapeCategory === cat
                          ? "bg-cyan-600 text-white shadow-xs font-semibold"
                          : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat === "all" ? "All" : cat === "essentials" ? "Daily ⚡" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Daily Essentials (Top Section when search is empty) */}
                {!shapeSearch.trim() && activeShapeCategory === "all" && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                        Daily Essentials
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400">Frequently Used</span>
                    </div>
                    <div className="grid grid-cols-8 gap-1.5 pt-0.5">
                      {dailyUseShapes.map((shape) => {
                        const Icon = shape.icon;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => handleShapeSelect(shape)}
                            className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800/90 hover:bg-cyan-600 hover:text-white border border-zinc-700/60 hover:border-cyan-400 transition-all hover:scale-110 cursor-pointer shadow-xs"
                          >
                            <Icon className={`w-4 h-4 ${shape.color} group-hover:text-white transition-colors`} />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-700 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                              {shape.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Main Shapes Grid */}
                <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {shapeSearch.trim()
                        ? `Found ${filteredShapes.length} Shapes`
                        : activeShapeCategory === "all"
                        ? "All Shapes Library"
                        : `${CATEGORY_LABELS[activeShapeCategory]}`}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      {filteredShapes.length} total
                    </span>
                  </div>

                  <div className="max-h-56 sm:max-h-64 overflow-y-auto pr-1 grid grid-cols-8 gap-1.5 pt-1 custom-scrollbar">
                    {filteredShapes.length === 0 ? (
                      <div className="col-span-8 py-6 text-center text-xs text-zinc-500 font-sans">
                        No shapes found for &quot;{shapeSearch}&quot;
                      </div>
                    ) : (
                      filteredShapes.map((shape) => {
                        const Icon = shape.icon;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => handleShapeSelect(shape)}
                            className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800/90 hover:bg-cyan-600 hover:text-white border border-zinc-700/60 hover:border-cyan-400 transition-all hover:scale-110 cursor-pointer shadow-xs"
                          >
                            <Icon className={`w-4 h-4 ${shape.color} group-hover:text-white transition-colors`} />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-700 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                              {shape.label}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-4 bg-zinc-800" />

        {/* 8. Fullscreen Toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* 9. Minimize Toolbar Toggle */}
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Minimize Toolbar (M)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-800" />

        {/* 10. Exit Presentation Button (Red Pill Button as in Image 2) */}
        <button
          type="button"
          onClick={onExit}
          className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-600/70 shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer"
          title="Exit Present Mode (Esc)"
        >
          <X className="w-3.5 h-3.5 text-rose-300" />
          <span>Exit</span>
          <kbd className="text-[9px] bg-rose-950/80 border border-rose-800/60 px-1 py-0.5 rounded text-rose-300 font-mono">
            Esc
          </kbd>
        </button>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

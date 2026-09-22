"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useFeatureFlag } from "@/lib/featureFlags";
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  MousePointer2,
  Type,
  StickyNote,
  Sparkles,
  Maximize2,
  Minimize2,
  Shapes,
  ChevronDown,
  Pipette,
  Presentation,
  Search,
  X,
} from "lucide-react";
import {
  SHAPE_LIBRARY,
  CATEGORY_LABELS,
  type ShapeCategory,
} from "@/constants/shapeLibrary";

export type CanvasToolMode =
  | "select"
  | "pan"
  | "server"
  | "database"
  | "cloud"
  | "box"
  | "pen"
  | "highlighter"
  | "eraser"
  | "laser"
  | "text"
  | "stickyNote"
  | "rectangle"
  | "circle"
  | "diamond"
  | "cylinder"
  | "folder";

export interface BottomToolbarProps {
  activeMode: CanvasToolMode;
  onSelectMode: (mode: CanvasToolMode) => void;
  onToggleAICoPilot?: () => void;
  isAICoPilotOpen?: boolean;
  onFitView?: () => void;
  onOpenSettings?: () => void;
  onAddShape?: (shapeType: string) => void;
  isShapesMenuOpen?: boolean;
  onToggleShapesMenu?: () => void;
  strokeColor?: string;
  onChangeStrokeColor?: (color: string) => void;
  strokeWidth?: number;
  onChangeStrokeWidth?: (width: number) => void;
  eraserRadius?: number;
  onChangeEraserRadius?: (radius: number) => void;
  onStartPresentation?: () => void;
  shapeNodesEnabled?: boolean;
  onToggleShapeNodes?: () => void;
}

export const STYLING_COLORS = [
  { label: "Chalk White", hex: "#ffffff" },
  { label: "Classic Blue", hex: "#3b82f6" },
  { label: "Crimson Red", hex: "#ef4444" },
  { label: "Emerald Green", hex: "#10b981" },
  { label: "Amber Yellow", hex: "#f59e0b" },
  { label: "Purple Violet", hex: "#8b5cf6" },
  { label: "Hot Pink", hex: "#ec4899" },
  { label: "Obsidian Slate", hex: "#0f172a" },
];

export const STROKE_WIDTH_OPTIONS = [
  { label: "Fine", size: 2, desc: "2px" },
  { label: "Medium", size: 4, desc: "4px" },
  { label: "Bold", size: 8, desc: "8px" },
  { label: "Heavy", size: 14, desc: "14px" },
];

export const THICKNESS_OPTIONS = STROKE_WIDTH_OPTIONS;

export const ERASER_RADIUS_OPTIONS = [
  { label: "S", radius: 12, title: "Small (12px)" },
  { label: "M", radius: 24, title: "Medium (24px - Default)" },
  { label: "L", radius: 44, title: "Large (44px)" },
  { label: "XL", radius: 72, title: "Extra Large (72px)" },
];

interface DockTool {
  id: CanvasToolMode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
  color?: string;
}

export default function BottomToolbar({
  activeMode,
  onSelectMode,
  onToggleAICoPilot,
  isAICoPilotOpen = false,
  onFitView,
  onOpenSettings: _onOpenSettings,
  onAddShape,
  isShapesMenuOpen: externalShapesOpen,
  onToggleShapesMenu,
  strokeColor = "#1e293b",
  onChangeStrokeColor,
  strokeWidth = 3,
  onChangeStrokeWidth,
  eraserRadius = 24,
  onChangeEraserRadius,
  onStartPresentation,
  shapeNodesEnabled = true,
  onToggleShapeNodes,
}: BottomToolbarProps) {
  const isAiEnabled = useFeatureFlag("ai_tools");
  const [internalColor, setInternalColor] = useState("#1e293b");
  const [internalWidth, setInternalWidth] = useState(3);
  const [internalEraserRadius, setInternalEraserRadius] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("Prathomix_eraser_radius");
      if (saved) return Number(saved);
    }
    return 24;
  });
  const [isDropperActive, setIsDropperActive] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const currentColor = strokeColor !== undefined ? strokeColor : internalColor;
  const currentWidth = strokeWidth !== undefined ? strokeWidth : internalWidth;
  const currentEraserRadius = eraserRadius !== undefined ? eraserRadius : internalEraserRadius;

  const handleEraserRadiusChange = (r: number) => {
    setInternalEraserRadius(r);
    onChangeEraserRadius?.(r);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("Prathomix_eraser_radius", String(r));
      } catch {}
    }
  };

  const isCustomColor = !STYLING_COLORS.some(
    (col) => col.hex.toLowerCase() === currentColor.toLowerCase()
  );

  const handleColorChange = (c: string) => {
    setInternalColor(c);
    onChangeStrokeColor?.(c);
  };

  const handleWidthChange = (w: number) => {
    setInternalWidth(w);
    onChangeStrokeWidth?.(w);
  };

  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        setIsDropperActive(true);
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          handleColorChange(result.sRGBHex);
        }
      } catch {
        // User cancelled eyedropper or pressed Esc
      } finally {
        setIsDropperActive(false);
      }
    } else {
      // Fallback to HTML color picker if EyeDropper API is unsupported in current browser
      colorInputRef.current?.click();
    }
  };

  const [internalShapesOpen, setInternalShapesOpen] = useState(false);
  const [shapeSearch, setShapeSearch] = useState("");
  const [activeShapeCategory, setActiveShapeCategory] = useState<ShapeCategory>("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shapesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => {
        setTimeout(() => onFitView?.(), 100);
      }).catch((err) => {
        console.warn("Fullscreen request failed:", err);
        onFitView?.();
      });
    } else {
      document.exitFullscreen?.().then(() => {
        setTimeout(() => onFitView?.(), 100);
      }).catch((err) => {
        console.warn("Exit fullscreen failed:", err);
      });
    }
  };

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

  const isShapesOpen =
    externalShapesOpen !== undefined ? externalShapesOpen : internalShapesOpen;
  const toggleShapesOpen = () => {
    if (onToggleShapesMenu) {
      onToggleShapesMenu();
    } else {
      setInternalShapesOpen((prev) => !prev);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        shapesMenuRef.current &&
        !shapesMenuRef.current.contains(e.target as Node)
      ) {
        if (onToggleShapesMenu && externalShapesOpen) {
          onToggleShapesMenu();
        } else {
          setInternalShapesOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [externalShapesOpen, onToggleShapesMenu]);

  // ── Group 1: Navigation Tools ─────────────────────────────────────────────
  const navigationTools: DockTool[] = [
    {
      id: "select",
      icon: MousePointer,
      label: "Select & Transform",
      shortcut: "V",
      color: "text-zinc-300",
    },
    {
      id: "pan",
      icon: Hand,
      label: "Pan Canvas",
      shortcut: "H",
      color: "text-zinc-300",
    },
  ];

  // ── Group 2: Drawing & Annotation Tools ───────────────────────────────────
  const drawingTools: DockTool[] = [
    {
      id: "pen",
      icon: Pen,
      label: "Freehand Pen",
      shortcut: "P",
      color: "text-cyan-300",
    },
    {
      id: "highlighter",
      icon: Highlighter,
      label: "Neon Highlighter",
      shortcut: "Shift+H",
      color: "text-amber-300",
    },
    {
      id: "eraser",
      icon: Eraser,
      label: "Stroke Eraser",
      shortcut: "E",
      color: "text-rose-400",
    },
    {
      id: "laser",
      icon: MousePointer2,
      label: "Laser Pointer",
      shortcut: "L",
      color: "text-red-400",
    },
  ];



  // ── Group 4: UI Elements ──────────────────────────────────────────────────
  const uiElementTools: DockTool[] = [
    {
      id: "text",
      icon: Type,
      label: "Architecture Note",
      shortcut: "T",
      color: "text-amber-400",
    },
    {
      id: "stickyNote",
      icon: StickyNote,
      label: "Sticky Note",
      shortcut: "N",
      color: "text-yellow-400",
    },
  ];

  const isShapeActive = [
    "rectangle",
    "circle",
    "diamond",
    "cylinder",
    "cloud",
    "folder",
    "server",
    "database",
    "box",
  ].includes(activeMode);

  const renderToolButton = (tool: DockTool) => {
    const Icon = tool.icon;
    const isActive = activeMode === tool.id;
    const isLaser = tool.id === "laser";

    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => onSelectMode(isActive && tool.id !== "select" ? "select" : tool.id)}
        aria-label={tool.label}
        className={`relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer pointer-events-auto ${
          isActive
            ? isLaser
              ? "bg-rose-500 text-white shadow-sm scale-105"
              : "bg-blue-600 text-white shadow-sm scale-105"
            : "text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-transparent hover:scale-105"
        }`}
      >
        <Icon
          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
            isActive
              ? "text-white"
              : tool.color || "text-zinc-300"
          }`}
        />

        {isActive && (
          <span
            className={`absolute -bottom-1 w-1 h-1 rounded-full ${
              isLaser
                ? "bg-rose-400"
                : "bg-blue-400"
            }`}
          />
        )}

        <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-zinc-900/95 backdrop-blur-md border border-zinc-700/60 text-[11px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
          <span>{tool.label}</span>
          <span className="ml-1.5 text-[10px] font-mono text-blue-300">[{tool.shortcut}]</span>
        </div>
      </button>
    );
  };

  return (
    /* ── Compact Fixed Toolbar Container ── */
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-max pointer-events-auto select-none flex flex-col items-center">
      {/* ── Main Toolbar: Clean Whiteboard Floating Dock ── */}
      <div className="w-max h-14 px-4 py-2 flex items-center justify-center gap-2 bg-[#121316]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] pointer-events-auto transition-colors duration-200">
        {/* Group 1: Navigation Tools */}
        <div className="flex items-center gap-1">
          {navigationTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-zinc-800 mx-1.5" />

        {/* Group 2: Expanded Shapes Dropdown Menu */}
        <div className="relative" ref={shapesMenuRef}>
          <button
            type="button"
            onClick={toggleShapesOpen}
            aria-label="Shapes Library Menu [S]"
            title="Shapes & Architecture Components [S]"
            className={`relative group flex items-center gap-1 px-2.5 h-9 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer pointer-events-auto ${
              isShapesOpen || isShapeActive
                ? "bg-blue-600 text-white shadow-sm scale-105"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-transparent hover:scale-105"
            }`}
          >
            <Shapes className={`w-4 h-4 transition-transform group-hover:scale-110 ${isShapesOpen || isShapeActive ? "text-white" : "text-slate-600 dark:text-zinc-400"}`} />
            <span className="text-xs font-semibold font-mono hidden md:inline-block">
              Shapes
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isShapesOpen ? "rotate-180" : ""
              }`}
            />

            {(isShapesOpen || isShapeActive) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
            )}

            {/* Tooltip */}
            <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md border border-slate-700/50 text-[11px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
              <span>Shapes Library</span>
              <span className="ml-1.5 text-[10px] font-mono text-blue-400">[S]</span>
            </div>
          </button>

          {/* ── Shapes Popover Dropdown (110+ Shapes with Search & Daily Use on Top) ── */}
          {isShapesOpen && (
            <div className="absolute top-full mt-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-80 sm:w-[380px] rounded-2xl bg-white/98 dark:bg-[#121316]/98 backdrop-blur-2xl border border-slate-200 dark:border-zinc-800 shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-3 z-[9999] pointer-events-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5">
              {/* 1. Header with Badge & Shortcut */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                    Shape Library
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold">
                    110+ Shapes
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">[S] toggle</span>
              </div>

              {/* 1.5. Connection Nodes Toggle Switch */}
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      shapeNodesEnabled
                        ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"
                        : "bg-slate-400 dark:bg-zinc-600"
                    }`}
                  />
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-zinc-200">
                        Shape Nodes
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          shapeNodesEnabled
                            ? "bg-blue-500/15 text-blue-500"
                            : "bg-zinc-500/15 text-zinc-400"
                        }`}
                      >
                        {shapeNodesEnabled ? "ON" : "OFF"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                      {shapeNodesEnabled ? "Shapes have connection ports" : "Clean shapes (no handles)"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleShapeNodes?.();
                  }}
                  role="switch"
                  aria-checked={shapeNodesEnabled}
                  title={shapeNodesEnabled ? "Switch to shapes without connection nodes" : "Switch to shapes with connection nodes"}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    shapeNodesEnabled ? "bg-blue-600" : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      shapeNodesEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* 2. Attractive Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={shapeSearch}
                  onChange={(e) => setShapeSearch(e.target.value)}
                  placeholder="Search 100+ shapes (e.g. database, cloud, arrow)..."
                  className="w-full bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 font-sans transition-all"
                />
                {shapeSearch && (
                  <button
                    type="button"
                    onClick={() => setShapeSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3. Category Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                {(["all", "essentials", "flowchart", "cloud", "database", "network", "arrows", "symbols"] as ShapeCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveShapeCategory(cat)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                      activeShapeCategory === cat
                        ? "bg-blue-600 text-white shadow-xs font-semibold"
                        : "bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {cat === "all" ? "All" : cat === "essentials" ? "Daily ⚡" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* 4. Top Section: Daily Use Shapes (When no search query is typed) */}
              {!shapeSearch.trim() && activeShapeCategory === "all" && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Daily Essentials
                    </span>
                    <span className="text-[9px] font-mono text-blue-500">Frequently Used</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5 pt-0.5">
                    {dailyUseShapes.map((shape) => {
                      const Icon = shape.icon;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => {
                            onAddShape?.(shape.id);
                            if (onToggleShapesMenu && externalShapesOpen) {
                              onToggleShapesMenu();
                            } else {
                              setInternalShapesOpen(false);
                            }
                          }}
                          className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100/90 dark:bg-zinc-800/90 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white border border-slate-200/80 dark:border-zinc-700/60 hover:border-blue-400 transition-all hover:scale-110 cursor-pointer shadow-xs"
                        >
                          <Icon className={`w-4 h-4 ${shape.color} group-hover:text-white transition-colors`} />
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-700 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                            {shape.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Main Grid of Shapes (Scrollable) */}
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    {shapeSearch.trim()
                      ? `Found ${filteredShapes.length} Shapes`
                      : activeShapeCategory === "all"
                      ? "All Shapes Library"
                      : `${CATEGORY_LABELS[activeShapeCategory]}`}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                    {filteredShapes.length} total
                  </span>
                </div>

                <div className="max-h-60 sm:max-h-68 overflow-y-auto pr-1 grid grid-cols-8 gap-1.5 pt-1 custom-scrollbar">
                  {filteredShapes.length === 0 ? (
                    <div className="col-span-8 py-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-sans">
                      No shapes found for &quot;{shapeSearch}&quot;
                    </div>
                  ) : (
                    filteredShapes.map((shape) => {
                      const Icon = shape.icon;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => {
                            onAddShape?.(shape.id);
                            if (onToggleShapesMenu && externalShapesOpen) {
                              onToggleShapesMenu();
                            } else {
                              setInternalShapesOpen(false);
                            }
                          }}
                          className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100/90 dark:bg-zinc-800/90 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white border border-slate-200/80 dark:border-zinc-700/60 hover:border-blue-400 transition-all hover:scale-110 cursor-pointer shadow-xs"
                        >
                          <Icon className={`w-4 h-4 ${shape.color} group-hover:text-white transition-colors`} />
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-zinc-900 border border-slate-700 dark:border-zinc-700 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                            {shape.label}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-zinc-800 mx-1.5" />

        {/* Group 3: Drawing & Annotation Tools */}
        <div className="flex items-center gap-1">
          {drawingTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-zinc-800 mx-1.5" />

        {/* Group 4: UI Elements */}
        <div className="flex items-center gap-1">
          {uiElementTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-zinc-800 mx-1.5" />

        {/* Group 5: Actions: MIX AI, Theme Switcher, Settings, Fit View */}
        <div className="flex items-center gap-1.5">
          {/* MIX Chatbot Trigger */}
          {onToggleAICoPilot && isAiEnabled && (
            <button
              type="button"
              onClick={onToggleAICoPilot}
              title="Open MIX Chatbot & Topology Synthesizer"
              className={`relative group flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer pointer-events-auto ${
                isAICoPilotOpen
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md scale-105"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:scale-105"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAICoPilotOpen ? "text-white" : "text-indigo-500 dark:text-indigo-400"}`} />
              <span className="font-mono tracking-tight font-bold">MIX</span>

              <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md border border-slate-700/50 text-[11px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Open MIX AI Co-Pilot
              </div>
            </button>
          )}

          {/* Present Mode Trigger */}
          {onStartPresentation && (
            <button
              type="button"
              onClick={onStartPresentation}
              title="Present Mode (Laser & Slide Deck Walk) [P]"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent transition-all cursor-pointer pointer-events-auto hover:scale-105 group"
            >
              <Presentation className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Fullscreen & Fit View (Last Button) */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen [F11]"}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (Fit Canvas)"}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent transition-all cursor-pointer pointer-events-auto hover:scale-105"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Dynamic Freehand & Highlighter Styling Popover (Color & Stroke Width) ── */}
      {(activeMode === "pen" || activeMode === "highlighter") && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-[9999] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
          {/* Colors Section */}
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mr-1 hidden sm:inline-block">
              Color
            </span>
            {STYLING_COLORS.map((col) => {
              const isSelected = currentColor.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => handleColorChange(col.hex)}
                  title={col.label}
                  className={`relative w-6 h-6 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center border border-black/10 dark:border-white/10 ${
                    isSelected
                      ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] scale-110 shadow-sm"
                      : "hover:scale-110 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: col.hex }}
                >
                  {isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full ${col.hex === "#ffffff" ? "bg-black" : "bg-white"} shadow-sm`} />
                  )}
                </button>
              );
            })}

            {/* Active Custom / Dropped Color Swatch */}
            {isCustomColor && (
              <button
                type="button"
                onClick={() => handleColorChange(currentColor)}
                title={`Custom Color: ${currentColor}`}
                className="relative w-6 h-6 rounded-full ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] scale-110 shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center border border-black/10"
                style={{ backgroundColor: currentColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
              </button>
            )}

            {/* Subtle Divider */}
            <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700 mx-0.5" />

            {/* Color Dropper Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleEyeDropper}
                aria-label="Color Dropper (Pick color from screen)"
                title="Color Dropper (Sample any color from canvas/screen)"
                className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  isDropperActive
                    ? "bg-blue-600 text-white ring-2 ring-blue-400 scale-110 shadow-sm"
                    : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:scale-110"
                }`}
              >
                <Pipette className="w-3.5 h-3.5 transition-transform group-hover:-rotate-12" />
              </button>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md border border-slate-700/50 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Color Dropper
              </div>
            </div>

            {/* Custom Color Palette Picker */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                aria-label="Custom Color Picker"
                title="Custom Color Palette"
                className={`relative w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer ${
                  isCustomColor
                    ? "ring-2 ring-blue-500 scale-105"
                    : "hover:scale-110 opacity-85 hover:opacity-100"
                }`}
                style={{
                  background:
                    "conic-gradient(from 180deg, #ff0055, #ffdd00, #00ff88, #00ddff, #7700ff, #ff00aa, #ff0055)",
                }}
              >
                <div className="w-4 h-4 rounded-full bg-white dark:bg-[#18181b] flex items-center justify-center">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentColor }}
                  />
                </div>
              </button>
              <input
                ref={colorInputRef}
                type="color"
                value={currentColor.startsWith("#") && currentColor.length === 7 ? currentColor : "#1e293b"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md border border-slate-700/50 text-[10px] font-sans text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Custom Color
              </div>
            </div>
          </div>

          {/* Stroke Thickness Section */}
          <div className="flex items-center gap-1 px-1 border-l border-slate-200 dark:border-zinc-700/60 pl-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 mr-1 hidden sm:inline-block">
              Width
            </span>
            {THICKNESS_OPTIONS.map((opt) => {
              const isSelected = currentWidth === opt.size;
              return (
                <button
                  key={opt.size}
                  type="button"
                  onClick={() => handleWidthChange(opt.size)}
                  title={`${opt.label} (${opt.desc})`}
                  className={`px-2 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm font-bold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{
                      width: opt.size <= 2 ? 4 : opt.size <= 4 ? 6 : 8,
                      height: opt.size <= 2 ? 4 : opt.size <= 4 ? 6 : 8,
                    }}
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dynamic Eraser Radius Popover (Chota / Bada Karna) ── */}
      {activeMode === "eraser" && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 px-3.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.85)] z-[9999] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
            <Eraser className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Eraser Size
            </span>
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700" />

          {/* Quick Preset Buttons: S, M, L, XL */}
          <div className="flex items-center gap-1">
            {ERASER_RADIUS_OPTIONS.map((opt) => {
              const isSelected = Math.abs(currentEraserRadius - opt.radius) <= 4;
              return (
                <button
                  key={opt.label}
                  type="button"
                  title={opt.title}
                  onClick={() => handleEraserRadiusChange(opt.radius)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-sm scale-105"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{
                      width: opt.radius <= 16 ? 4 : opt.radius <= 30 ? 6 : opt.radius <= 50 ? 8 : 10,
                      height: opt.radius <= 16 ? 4 : opt.radius <= 30 ? 6 : opt.radius <= 50 ? 8 : 10,
                    }}
                  />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-slate-200 dark:bg-zinc-700" />

          {/* Smooth Radius Slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={8}
              max={80}
              step={2}
              value={currentEraserRadius}
              onChange={(e) => handleEraserRadiusChange(Number(e.target.value))}
              className="w-20 sm:w-24 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-300 w-9 text-right font-medium">
              {currentEraserRadius}px
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

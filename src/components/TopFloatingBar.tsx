"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer,
  Hand,
  Shapes,
  Pen,
  Highlighter,
  Eraser,
  Waypoints,
  Type,
  StickyNote,
  Undo2,
  Redo2,
  Sparkles,
  Share2,
  Play,
  MoreHorizontal,
  ChevronDown,
  Download,
  Keyboard,
  Trash2,
  ArrowRight,
  Minus,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Maximize2,
  Settings,
  HelpCircle,
  FolderOpen,
} from "lucide-react";
import { CanvasToolMode } from "@/components/BottomToolbar";
import PenSettingsPopover, { PenType } from "@/components/PenSettingsPopover";
import ShapeLibraryPopover from "@/components/ShapeLibraryPopover";

export interface TopFloatingBarProps {
  boardTitle: string;
  onBoardTitleChange: (title: string) => void;
  activeTool: CanvasToolMode | string;
  onSelectTool: (tool: any) => void;
  onAddShape?: (shapeType: string) => void;
  onAddLine?: (lineType: string) => void;
  onAddImage?: () => void;
  onAddComment?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onFitView?: () => void;
  onOpenAICommand?: () => void;
  onShareClick?: () => void;
  onPresentClick?: () => void;
  onOpenSettings?: () => void;
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onExportJSON?: () => void;
  onClearCanvas?: () => void;
  gridType?: "dots" | "lines" | "solid";
  onChangeGridType?: (type: "dots" | "lines" | "solid") => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  drawingColor?: string;
  onChangeDrawingColor?: (color: string) => void;
  drawingWidth?: number;
  onChangeDrawingWidth?: (width: number) => void;
  drawingOpacity?: number;
  onChangeDrawingOpacity?: (opacity: number) => void;
  penType?: PenType;
  onChangePenType?: (type: PenType) => void;
  onOpenUpgradeModal?: () => void;
}

export default function TopFloatingBar({
  boardTitle,
  onBoardTitleChange,
  activeTool,
  onSelectTool,
  onAddShape,
  onAddLine,
  onAddImage,
  onAddComment,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoomLevel = 100,
  onZoomChange,
  onFitView,
  onOpenAICommand,
  onShareClick,
  onPresentClick,
  onOpenSettings,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onClearCanvas,
  gridType = "dots",
  onChangeGridType,
  saveStatus = "saved",
  drawingColor = "#18181B",
  onChangeDrawingColor,
  drawingWidth = 2,
  onChangeDrawingWidth,
  drawingOpacity = 1.0,
  onChangeDrawingOpacity,
  penType: externalPenType,
  onChangePenType: externalOnChangePenType,
  onOpenUpgradeModal,
}: TopFloatingBarProps) {
  // Popover state
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(boardTitle);
  const [isPenPopoverOpen, setIsPenPopoverOpen] = useState(false);
  const [internalPenType, setInternalPenType] = useState<PenType>("ballpen");
  const activePenType = externalPenType !== undefined ? externalPenType : internalPenType;

  const handlePenTypeChange = (newType: PenType) => {
    setInternalPenType(newType);
    externalOnChangePenType?.(newType);
    onSelectTool("pen");

    // Automatically adapt recommended width & opacity presets for specific pen types
    if (newType === "pencil") {
      onChangeDrawingWidth?.(2);
      onChangeDrawingOpacity?.(0.75);
    } else if (newType === "marker") {
      onChangeDrawingWidth?.(8);
      onChangeDrawingOpacity?.(0.92);
    } else if (newType === "brush") {
      onChangeDrawingWidth?.(6);
      onChangeDrawingOpacity?.(1.0);
    } else {
      // ballpen
      onChangeDrawingWidth?.(3);
      onChangeDrawingOpacity?.(1.0);
    }
  };

  const [isShapePopoverOpen, setIsShapePopoverOpen] = useState(false);
  const [isLineMenuOpen, setIsLineMenuOpen] = useState(false);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const lineMenuRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Sync title
  useEffect(() => {
    setTempTitle(boardTitle);
  }, [boardTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Click outside listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (lineMenuRef.current && !lineMenuRef.current.contains(t)) setIsLineMenuOpen(false);
      if (moreMenuRef.current && !moreMenuRef.current.contains(t)) setIsMoreMenuOpen(false);
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(t)) setIsZoomMenuOpen(false);
      if (boardMenuRef.current && !boardMenuRef.current.contains(t)) setIsBoardMenuOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onBoardTitleChange(tempTitle.trim());
    } else {
      setTempTitle(boardTitle);
    }
  };

  const lineOptions = [
    { id: "straight", label: "Straight Line", icon: Minus, shortcut: "L" },
    { id: "arrow", label: "Arrow", icon: ArrowRight, shortcut: "A" },
    { id: "double_arrow", label: "Double Arrow", icon: ArrowRight, shortcut: "" },
    { id: "dashed", label: "Dashed Line", icon: Minus, shortcut: "" },
    { id: "curved", label: "Curved Connector", icon: Waypoints, shortcut: "C" },
    { id: "orthogonal", label: "Orthogonal Step", icon: Waypoints, shortcut: "" },
  ];

  return (
    <div className="fixed top-3 left-3 right-3 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* ── LEFT: Logo, Title & Autosave ── */}
      <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-900 transition-all">
        {/* Brand Emblem */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-85"
          title="MasmSpace — Home"
        >
          <div className="relative w-6 h-5 flex items-center justify-center shrink-0">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace"
              width={24}
              height={19}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold text-xs tracking-tight hidden sm:inline text-zinc-900">
            MasmSpace
          </span>
        </Link>

        <div className="h-3.5 w-px bg-zinc-200 mx-0.5" />

        {/* Board Title with dropdown */}
        <div className="relative" ref={boardMenuRef}>
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTempTitle(boardTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-transparent border-b border-[#635BFF] outline-none text-xs font-medium px-1 py-0.5 text-zinc-900 w-36 sm:w-48"
              maxLength={60}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsBoardMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-zinc-100 transition-colors text-left max-w-[150px] sm:max-w-[210px] group cursor-pointer"
              title="Board options & rename"
            >
              <span className="text-xs font-medium text-zinc-800 truncate">
                {boardTitle || "Untitled Board"}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />
            </button>
          )}

          {/* Board Dropdown Menu */}
          <AnimatePresence>
            {isBoardMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg p-1.5 z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Type className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Rename board</span>
                </button>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Open boards dashboard</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    onExportPNG?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Export as PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    onExportSVG?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Export as SVG</span>
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    if (window.confirm("Clear all items from this canvas?")) {
                      onClearCanvas?.();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Clear canvas</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-3.5 w-px bg-zinc-200 mx-0.5" />

        {/* Autosave Status */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          {saveStatus === "saving" ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden md:inline text-zinc-500">Saving...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden md:inline text-zinc-500">✓ Saved</span>
            </>
          )}
        </div>
      </div>

      {/* ── CENTER: Complete Interactive Toolset ── */}
      <div className="pointer-events-auto flex items-center gap-0.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-700">
        {/* 1. Select (V) */}
        <button
          type="button"
          onClick={() => onSelectTool("select")}
          title="Select (V)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "select"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* 2. Hand / Pan (H) */}
        <button
          type="button"
          onClick={() => onSelectTool("pan")}
          title="Hand / Pan (H)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "pan"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-200 mx-0.5" />

        {/* 3. Pen (P) with Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (activeTool === "pen") {
                setIsPenPopoverOpen((prev) => !prev);
              } else {
                onSelectTool("pen");
                setIsPenPopoverOpen(true);
              }
              setIsShapePopoverOpen(false);
              setIsLineMenuOpen(false);
            }}
            title="Pen (P) — Click for options"
            className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center relative cursor-pointer ${
              activeTool === "pen"
                ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Pen className="w-4 h-4" />
            <span
              className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-white"
              style={{ backgroundColor: drawingColor }}
            />
          </button>

          <PenSettingsPopover
            isOpen={isPenPopoverOpen}
            onClose={() => setIsPenPopoverOpen(false)}
            penType={activePenType}
            onChangePenType={handlePenTypeChange}
            penColor={drawingColor}
            onChangePenColor={onChangeDrawingColor || (() => {})}
            penWidth={drawingWidth}
            onChangePenWidth={onChangeDrawingWidth || (() => {})}
            penOpacity={drawingOpacity}
            onChangePenOpacity={onChangeDrawingOpacity}
          />
        </div>

        {/* 4. Highlighter */}
        <button
          type="button"
          onClick={() => {
            onSelectTool("highlighter");
            setIsPenPopoverOpen(false);
          }}
          title="Highlighter"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "highlighter"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* 5. Eraser (E) */}
        <button
          type="button"
          onClick={() => onSelectTool("eraser")}
          title="Eraser (E)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "eraser"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-200 mx-0.5" />

        {/* 6. Lines & Connectors (L / C) with Popover */}
        <div className="relative" ref={lineMenuRef}>
          <button
            type="button"
            onClick={() => {
              setIsLineMenuOpen((prev) => !prev);
              setIsPenPopoverOpen(false);
              setIsShapePopoverOpen(false);
            }}
            title="Lines & Connectors (L)"
            className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center gap-0.5 cursor-pointer ${
              activeTool === "line" || isLineMenuOpen
                ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Minus className="w-4 h-4 rotate-45" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          <AnimatePresence>
            {isLineMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 mt-1.5 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-50 text-xs"
              >
                {lineOptions.map((lo) => {
                  const Icon = lo.icon;
                  return (
                    <button
                      key={lo.id}
                      type="button"
                      onClick={() => {
                        onAddLine?.(lo.id);
                        setIsLineMenuOpen(false);
                        onSelectTool("select");
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{lo.label}</span>
                      </div>
                      {lo.shortcut && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {lo.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7. Categorized Shapes (R) with Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsShapePopoverOpen((prev) => !prev);
              setIsPenPopoverOpen(false);
              setIsLineMenuOpen(false);
            }}
            title="Shapes Library (R)"
            className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center gap-0.5 cursor-pointer ${
              activeTool === "shape" || isShapePopoverOpen
                ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Shapes className="w-4 h-4" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          <ShapeLibraryPopover
            isOpen={isShapePopoverOpen}
            onClose={() => setIsShapePopoverOpen(false)}
            onSelectShape={(shapeId) => {
              onAddShape?.(shapeId);
              onSelectTool("select");
            }}
            onOpenUpgrade={onOpenUpgradeModal}
          />
        </div>

        {/* 8. Text (T) */}
        <button
          type="button"
          onClick={() => {
            onAddShape?.("text");
            onSelectTool("select");
          }}
          title="Text Note (T)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "text"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Type className="w-4 h-4" />
        </button>

        {/* 9. Sticky Note (N) */}
        <button
          type="button"
          onClick={() => {
            onAddShape?.("stickyNote");
            onSelectTool("select");
          }}
          title="Sticky Note (N)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "stickyNote"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <StickyNote className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-zinc-200 mx-0.5" />

        {/* 10. Image Upload (I) */}
        <button
          type="button"
          onClick={onAddImage}
          title="Insert Image (I)"
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-all text-xs font-medium flex items-center justify-center cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* 11. Comment (M) */}
        <button
          type="button"
          onClick={onAddComment}
          title="Add Comment (M)"
          className={`p-2 rounded-lg transition-all text-xs font-medium flex items-center justify-center cursor-pointer ${
            activeTool === "comment"
              ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
              : "hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* ── RIGHT: Undo/Redo, Zoom, AI, Share, Present & Profile ── */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-zinc-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-700">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Y)"
          className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-3.5 w-px bg-zinc-200 mx-0.5" />

        {/* Zoom percentage & Fit */}
        <div className="relative" ref={zoomMenuRef}>
          <button
            type="button"
            onClick={() => setIsZoomMenuOpen((prev) => !prev)}
            title="Canvas Zoom"
            className="px-1.5 py-1 rounded-md text-[11px] font-mono font-medium hover:bg-zinc-100 transition-colors text-zinc-600 cursor-pointer"
          >
            {Math.round(zoomLevel)}%
          </button>

          <AnimatePresence>
            {isZoomMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1.5 w-32 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-50 text-xs"
              >
                {[25, 50, 75, 100, 150, 200, 400].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      onZoomChange?.(z);
                      setIsZoomMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1 rounded-md hover:bg-zinc-100 text-zinc-700 font-mono text-[11px] cursor-pointer"
                  >
                    {z}%
                  </button>
                ))}
                <div className="h-px bg-zinc-100 my-0.5" />
                <button
                  type="button"
                  onClick={() => {
                    onFitView?.();
                    setIsZoomMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1 rounded-md hover:bg-zinc-100 text-zinc-700 text-[11px] cursor-pointer"
                >
                  Fit to screen
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Command Button */}
        <button
          type="button"
          onClick={onOpenAICommand}
          title="Board Brain AI (Cmd+K)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-[#635BFF]/10 hover:text-[#635BFF] text-zinc-700 transition-colors text-xs font-medium cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
          <span className="hidden sm:inline">Board Brain</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShareClick}
          title="Share & Collaborate"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Share</span>
        </button>

        {/* Present Button */}
        <button
          type="button"
          onClick={onPresentClick}
          title="Presentation Mode"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Present</span>
        </button>

        {/* More Options Dropdown */}
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((prev) => !prev)}
            title="More actions"
            className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-600 cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1.5 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg p-1 z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onExportPNG?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Export PNG</span>
                </button>
                <div className="h-px bg-zinc-100 my-1" />
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-400">
                  Grid Type
                </div>
                {(["dots", "lines", "solid"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      onChangeGridType?.(g);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md text-xs cursor-pointer ${
                      gridType === g
                        ? "bg-[#635BFF]/10 text-[#635BFF] font-semibold"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <span className="capitalize">{g}</span>
                    {gridType === g && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Preferences</span>
                </button>
                <Link
                  href="/shortcuts"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Keyboard shortcuts</span>
                </Link>
                <Link
                  href="/support"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Help & Support</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

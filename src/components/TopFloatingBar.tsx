"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  MousePointer,
  Hand,
  Pen,
  Highlighter,
  Eraser,
  Waypoints,
  Type,
  Square,
  Circle,
  Triangle,
  Diamond,
  ArrowUpRight,
  Minus,
  StickyNote,
  Undo2,
  Redo2,
  Sparkles,
  Share2,
  Play,
  MoreHorizontal,
  ChevronDown,
  Download,
  Trash2,
  Settings,
  Grid,
  Maximize2,
  Plus,
  HelpCircle,
  FolderOpen,
  Check,
  CheckCircle2,
  Sliders,
  Shapes,
} from "lucide-react";
import { CanvasToolMode } from "@/components/BottomToolbar";
import { PenType } from "@/components/DrawingOverlay";

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
  saveStatus?: "saved" | "saving" | "unsaved" | "offline";
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

// Compact Tooltip Component with delay
function Tooltip({
  children,
  text,
  shortcut,
  position = "bottom",
}: {
  children: React.ReactNode;
  text: string;
  shortcut?: string;
  position?: "bottom" | "top";
}) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShow(true), 300);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: position === "bottom" ? 3 : -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === "bottom" ? 3 : -3 }}
            transition={{ duration: 0.1 }}
            className={`absolute ${
              position === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5"
            } z-50 pointer-events-none px-2 py-1 bg-[#1C1C1F] border border-[#2A2A2F] text-[#F4F4F5] rounded text-[11px] font-sans whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.35)] flex items-center gap-1.5`}
          >
            <span>{text}</span>
            {shortcut && (
              <kbd className="px-1 py-0.2 bg-[#242428] border border-[#2A2A2F] text-[#A1A1AA] rounded text-[10px] font-mono">
                {shortcut}
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PEN_COLORS = [
  "#F4F4F5",
  "#A1A1AA",
  "#7C6CFF",
  "#3B82F6",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
  "#0D0D0F",
];

const SHAPE_LIST = [
  { id: "rectangle", label: "Rectangle", icon: Square, shortcut: "R" },
  { id: "circle", label: "Circle", icon: Circle, shortcut: "O" },
  { id: "triangle", label: "Triangle", icon: Triangle },
  { id: "diamond", label: "Diamond", icon: Diamond, shortcut: "D" },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight, shortcut: "A" },
  { id: "line", label: "Line", icon: Minus, shortcut: "L" },
];

const CONNECTOR_TYPES = [
  { id: "straight", label: "Straight Line", desc: "Direct linear path" },
  { id: "elbow", label: "Elbow Connector", desc: "Right-angle step routing" },
  { id: "curved", label: "Curved Connector", desc: "Smooth bezier routing" },
];

export default function TopFloatingBar({
  boardTitle,
  onBoardTitleChange,
  activeTool,
  onSelectTool,
  onAddShape,
  onAddLine,
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
  drawingColor = "#F4F4F5",
  onChangeDrawingColor,
  drawingWidth = 2,
  onChangeDrawingWidth,
  drawingOpacity = 1.0,
  onChangeDrawingOpacity,
  penType = "ballpen",
  onChangePenType,
}: TopFloatingBarProps) {
  // Popover controls
  const [isBoardMenuOpen, setIsBoardMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(boardTitle);
  const [isShapePopoverOpen, setIsShapePopoverOpen] = useState(false);
  const [isPenPopoverOpen, setIsPenPopoverOpen] = useState(false);
  const [isConnectorPopoverOpen, setIsConnectorPopoverOpen] = useState(false);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const shapePopoverRef = useRef<HTMLDivElement>(null);
  const penPopoverRef = useRef<HTMLDivElement>(null);
  const connectorPopoverRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize boardTitle
  useEffect(() => {
    setTempTitle(boardTitle);
  }, [boardTitle]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      setTimeout(() => titleInputRef.current?.focus(), 40);
    }
  }, [isEditingTitle]);

  // Click outside listener for all popovers
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boardMenuRef.current && !boardMenuRef.current.contains(target)) {
        setIsBoardMenuOpen(false);
      }
      if (shapePopoverRef.current && !shapePopoverRef.current.contains(target)) {
        setIsShapePopoverOpen(false);
      }
      if (penPopoverRef.current && !penPopoverRef.current.contains(target)) {
        setIsPenPopoverOpen(false);
      }
      if (connectorPopoverRef.current && !connectorPopoverRef.current.contains(target)) {
        setIsConnectorPopoverOpen(false);
      }
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(target)) {
        setIsZoomMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleTitleSubmit = () => {
    const trimmed = tempTitle.trim();
    if (trimmed && trimmed !== boardTitle) {
      onBoardTitleChange(trimmed);
    } else {
      setTempTitle(boardTitle);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[52px] z-40 bg-[#171719] border-b border-[#2A2A2F] text-[#F4F4F5] flex items-center justify-between px-3 select-none">
      {/* ── LEFT: Brand, Board Name, Dropdown & Status ── */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        {/* Brand Link */}
        <Link
          href="/"
          className="flex items-center gap-2 group transition-opacity hover:opacity-90 shrink-0"
          title="MasmSpace — Home"
        >
          <div className="relative w-6 h-6 flex items-center justify-center rounded bg-[#1C1C1F] border border-[#2A2A2F]">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace"
              width={18}
              height={18}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold text-xs tracking-tight text-[#F4F4F5] hidden sm:inline">
            MasmSpace
          </span>
        </Link>

        <span className="text-[#71717A] text-xs font-mono select-none">/</span>

        {/* Board Title & Dropdown */}
        <div className="relative min-w-0" ref={boardMenuRef}>
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
              className="bg-[#1C1C1F] border border-[#7C6CFF] rounded px-2 py-0.5 text-xs font-medium text-[#F4F4F5] outline-none w-44 sm:w-56"
              maxLength={64}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsBoardMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#242428] text-left transition-colors max-w-[150px] sm:max-w-[220px] group cursor-pointer"
              title="Board options & rename"
            >
              <span className="text-xs font-medium text-[#F4F4F5] truncate">
                {boardTitle || "System Architecture"}
              </span>
              <ChevronDown className="w-3 h-3 text-[#71717A] group-hover:text-[#F4F4F5] transition-colors shrink-0" />
            </button>
          )}

          {/* Board Options Dropdown */}
          <AnimatePresence>
            {isBoardMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 mt-1.5 w-52 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    setIsEditingTitle(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer text-left"
                >
                  <Type className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Rename board</span>
                </button>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer text-left"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Open boards dashboard</span>
                </Link>
                <div className="h-px bg-[#2A2A2F] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    onExportPNG?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer text-left"
                >
                  <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Export as PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    onExportSVG?.();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer text-left"
                >
                  <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Export as SVG</span>
                </button>
                <div className="h-px bg-[#2A2A2F] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setIsBoardMenuOpen(false);
                    if (window.confirm("Clear all items from this canvas?")) {
                      onClearCanvas?.();
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#F87171]" />
                  <span>Clear canvas</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 pl-1">
          {saveStatus === "saving" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
              <span className="text-[#A1A1AA] hidden lg:inline">Saving...</span>
            </>
          ) : saveStatus === "offline" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#F87171]" />
              <span className="text-[#F87171] hidden lg:inline">Offline</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
              <span className="text-[#A1A1AA] hidden lg:inline">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* ── CENTER: Compact Tool Switcher ── */}
      <div className="flex items-center gap-0.5 bg-[#111113] border border-[#2A2A2F] rounded-lg p-0.5">
        {/* 1. Select (V) */}
        <Tooltip text="Select" shortcut="V">
          <button
            type="button"
            onClick={() => onSelectTool("select")}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              activeTool === "select"
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* 2. Pan (H) */}
        <Tooltip text="Pan" shortcut="H">
          <button
            type="button"
            onClick={() => onSelectTool("pan")}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              activeTool === "pan"
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-4 bg-[#2A2A2F] mx-0.5" />

        {/* 3. Pen (P) with Popover */}
        <div className="relative" ref={penPopoverRef}>
          <Tooltip text="Pen & Highlighter" shortcut="P">
            <button
              type="button"
              onClick={() => {
                if (activeTool === "pen" || activeTool === "highlighter") {
                  setIsPenPopoverOpen((prev) => !prev);
                } else {
                  onSelectTool("pen");
                  setIsPenPopoverOpen(true);
                }
                setIsShapePopoverOpen(false);
                setIsConnectorPopoverOpen(false);
              }}
              className={`w-8 h-8 rounded-md flex items-center justify-center relative transition-colors cursor-pointer ${
                activeTool === "pen" || activeTool === "highlighter"
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
              }`}
            >
              {activeTool === "highlighter" ? (
                <Highlighter className="w-4 h-4" />
              ) : (
                <Pen className="w-4 h-4" />
              )}
              <span
                className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-[#171719]"
                style={{ backgroundColor: drawingColor }}
              />
            </button>
          </Tooltip>

          {/* Pen Popover */}
          <AnimatePresence>
            {isPenPopoverOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-52 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-2 z-50 text-xs space-y-2.5"
              >
                {/* Pen vs Highlighter */}
                <div className="grid grid-cols-2 gap-1 bg-[#111113] p-1 rounded-md border border-[#2A2A2F]">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTool("pen");
                      onChangePenType?.("ballpen");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      activeTool === "pen"
                        ? "bg-[#242428] text-[#F4F4F5] font-medium"
                        : "text-[#A1A1AA] hover:text-[#F4F4F5]"
                    }`}
                  >
                    <Pen className="w-3.5 h-3.5" />
                    <span>Pen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTool("highlighter");
                      onChangePenType?.("marker");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      activeTool === "highlighter"
                        ? "bg-[#242428] text-[#F4F4F5] font-medium"
                        : "text-[#A1A1AA] hover:text-[#F4F4F5]"
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight</span>
                  </button>
                </div>

                {/* Color Palette */}
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#71717A] mb-1.5">Color</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChangeDrawingColor?.(c)}
                        className={`w-6 h-6 rounded-full border transition-transform cursor-pointer relative mx-auto ${
                          drawingColor === c ? "border-[#7C6CFF] scale-110" : "border-[#2A2A2F] hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      >
                        {drawingColor === c && (
                          <Check className="w-3 h-3 text-[#7C6CFF] absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stroke Thickness */}
                <div>
                  <div className="text-[10px] uppercase font-mono text-[#71717A] mb-1.5">Thickness</div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[1, 2, 4, 8].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onChangeDrawingWidth?.(w)}
                        className={`py-1 rounded text-xs transition-colors cursor-pointer ${
                          drawingWidth === w
                            ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                            : "bg-[#111113] text-[#A1A1AA] hover:text-[#F4F4F5]"
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Eraser (E) */}
        <Tooltip text="Eraser" shortcut="E">
          <button
            type="button"
            onClick={() => onSelectTool("eraser")}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              activeTool === "eraser"
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
            }`}
          >
            <Eraser className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-4 bg-[#2A2A2F] mx-0.5" />

        {/* 5. Connector (C) */}
        <div className="relative" ref={connectorPopoverRef}>
          <Tooltip text="Connector" shortcut="C">
            <button
              type="button"
              onClick={() => {
                onSelectTool("laser" as any); // laser acts as connector mode in architecture canvas
                setIsConnectorPopoverOpen((prev) => !prev);
                setIsShapePopoverOpen(false);
                setIsPenPopoverOpen(false);
              }}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                activeTool === "laser"
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
              }`}
            >
              <Waypoints className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Connector Popover */}
          <AnimatePresence>
            {isConnectorPopoverOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-48 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-50 text-xs"
              >
                {CONNECTOR_TYPES.map((con) => (
                  <button
                    key={con.id}
                    type="button"
                    onClick={() => {
                      onAddLine?.(con.id);
                      setIsConnectorPopoverOpen(false);
                    }}
                    className="w-full flex flex-col items-start px-2 py-1.5 rounded hover:bg-[#242428] text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-medium text-[#F4F4F5]">{con.label}</span>
                    <span className="text-[10px] text-[#71717A]">{con.desc}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 6. Text (T) */}
        <Tooltip text="Text" shortcut="T">
          <button
            type="button"
            onClick={() => onAddShape?.("text")}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Type className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* 7. Shape (R) Popover */}
        <div className="relative" ref={shapePopoverRef}>
          <Tooltip text="Shape" shortcut="R">
            <button
              type="button"
              onClick={() => {
                setIsShapePopoverOpen((prev) => !prev);
                setIsPenPopoverOpen(false);
                setIsConnectorPopoverOpen(false);
              }}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isShapePopoverOpen
                  ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                  : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
              }`}
            >
              <Shapes className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Shape Popover Menu */}
          <AnimatePresence>
            {isShapePopoverOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-44 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-50 text-xs"
              >
                {SHAPE_LIST.map((sh) => {
                  const Icon = sh.icon;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => {
                        onAddShape?.(sh.id);
                        setIsShapePopoverOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#242428] text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[#A1A1AA] group-hover:text-[#F4F4F5]" />
                        <span className="text-[#F4F4F5]">{sh.label}</span>
                      </div>
                      {sh.shortcut && (
                        <kbd className="text-[10px] font-mono text-[#71717A]">{sh.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 8. Sticky Note (S) */}
        <Tooltip text="Sticky Note" shortcut="S">
          <button
            type="button"
            onClick={() => onAddShape?.("stickyNote")}
            className="w-8 h-8 rounded-md flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <StickyNote className="w-4 h-4 text-[#FBBF24]/90" />
          </button>
        </Tooltip>
      </div>

      {/* ── RIGHT: Undo, Redo, Zoom, AI, Share, Present, More & Avatar ── */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Undo */}
        <Tooltip text="Undo" shortcut="⌘Z">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              canUndo
                ? "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] cursor-pointer"
                : "text-[#71717A]/40 cursor-not-allowed"
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Redo */}
        <Tooltip text="Redo" shortcut="⌘⇧Z">
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              canRedo
                ? "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] cursor-pointer"
                : "text-[#71717A]/40 cursor-not-allowed"
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <div className="w-px h-4 bg-[#2A2A2F] mx-0.5 hidden sm:block" />

        {/* Zoom Dropdown */}
        <div className="relative hidden sm:block" ref={zoomMenuRef}>
          <button
            type="button"
            onClick={() => setIsZoomMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-mono text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <span>{Math.round(zoomLevel)}%</span>
            <ChevronDown className="w-3 h-3 text-[#71717A]" />
          </button>

          <AnimatePresence>
            {isZoomMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-1.5 w-32 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-50 text-xs font-mono"
              >
                {[25, 50, 100, 200, 400].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      onZoomChange?.(z);
                      setIsZoomMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded hover:bg-[#242428] text-left transition-colors cursor-pointer ${
                      Math.round(zoomLevel) === z ? "text-[#7C6CFF] font-medium" : "text-[#F4F4F5]"
                    }`}
                  >
                    <span>{z}%</span>
                    {Math.round(zoomLevel) === z && <Check className="w-3 h-3" />}
                  </button>
                ))}
                <div className="h-px bg-[#2A2A2F] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onFitView?.();
                    setIsZoomMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#242428] text-[#F4F4F5] text-left transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3 text-[#71717A]" />
                  <span>Fit view</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI / Board Brain CTA */}
        <Tooltip text="Ask AI / Board Brain" shortcut="⌘K">
          <button
            type="button"
            onClick={onOpenAICommand}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 text-[#7C6CFF] hover:bg-[#7C6CFF]/25 transition-all text-xs font-medium cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI</span>
          </button>
        </Tooltip>

        {/* Share Button */}
        <Tooltip text="Collaborate & Share">
          <button
            type="button"
            onClick={onShareClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-[#F4F4F5] bg-[#242428] hover:bg-[#2A2A2F] border border-[#2A2A2F] transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </Tooltip>

        {/* Present Mode */}
        <Tooltip text="Present Mode">
          <button
            type="button"
            onClick={onPresentClick}
            className="p-1.5 rounded-md text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* More Menu */}
        <div className="relative" ref={moreMenuRef}>
          <Tooltip text="More options">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-md text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-1.5 w-48 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangeGridType?.(gridType === "dots" ? "lines" : gridType === "lines" ? "solid" : "dots");
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span>Grid style</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#71717A] capitalize">{gridType}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings?.();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Settings</span>
                </button>
                <div className="h-px bg-[#2A2A2F] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onExportPNG?.();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Export PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportSVG?.();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  <span>Export SVG</span>
                </button>
                <div className="h-px bg-[#2A2A2F] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all items from this canvas?")) {
                      onClearCanvas?.();
                    }
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#F87171]" />
                  <span>Clear canvas</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Collaborator Avatar */}
        <div className="w-6 h-6 rounded-full bg-[#7C6CFF] text-[#F4F4F5] flex items-center justify-center text-[10px] font-semibold border border-[#2A2A2F] ml-0.5 cursor-pointer" title="You (Alex Rivera)">
          AR
        </div>
      </div>
    </header>
  );
}

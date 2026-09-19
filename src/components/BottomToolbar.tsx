"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Maximize,
  Shapes,
  Square,
  Circle,
  Diamond,
  Cylinder,
  Cloud,
  Folder,
  Settings,
  ChevronDown,
} from "lucide-react";

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
  onAddShape?: (shapeType: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder") => void;
  isShapesMenuOpen?: boolean;
  onToggleShapesMenu?: () => void;
}

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
  onOpenSettings,
  onAddShape,
  isShapesMenuOpen: externalShapesOpen,
  onToggleShapesMenu,
}: BottomToolbarProps) {
  const [internalShapesOpen, setInternalShapesOpen] = useState(false);
  const shapesMenuRef = useRef<HTMLDivElement>(null);

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

  // ── Group 3: Architecture Shapes Library Items ────────────────────────────
  const architectureShapes = [
    {
      id: "rectangle" as const,
      label: "Rectangle",
      subtitle: "Process / Component Node",
      icon: Square,
      color: "text-cyan-400",
    },
    {
      id: "circle" as const,
      label: "Circle",
      subtitle: "Microservice / API Gateway",
      icon: Circle,
      color: "text-emerald-400",
    },
    {
      id: "diamond" as const,
      label: "Diamond",
      subtitle: "Decision Node / Router",
      icon: Diamond,
      color: "text-amber-400",
    },
    {
      id: "cylinder" as const,
      label: "Cylinder",
      subtitle: "Database / Relational Store",
      icon: Cylinder,
      color: "text-blue-400",
    },
    {
      id: "cloud" as const,
      label: "Cloud",
      subtitle: "AWS / Azure Cloud Infra",
      icon: Cloud,
      color: "text-sky-400",
    },
    {
      id: "folder" as const,
      label: "Folder",
      subtitle: "Directory / Subnet Group",
      icon: Folder,
      color: "text-indigo-400",
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
              ? "bg-rose-500/25 text-rose-300 border border-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.45)] scale-105"
              : "bg-cyan-500/25 text-cyan-300 border border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-transparent hover:scale-105"
        }`}
      >
        <Icon
          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
            isActive
              ? isLaser
                ? "text-rose-300"
                : "text-cyan-300"
              : tool.color || "text-zinc-300"
          }`}
        />

        {isActive && (
          <span
            className={`absolute -bottom-1 w-1 h-1 rounded-full ${
              isLaser
                ? "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                : "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            }`}
          />
        )}

        <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#09090b]/95 backdrop-blur-md border border-white/15 text-[11px] font-sans text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
          <span>{tool.label}</span>
          <span className="ml-1.5 text-[10px] font-mono text-cyan-400">[{tool.shortcut}]</span>
        </div>
      </button>
    );
  };

  return (
    /* ── High Z-Index Container: Guarantees toolbar & dropdowns are NEVER blocked ── */
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-auto select-none">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)] pointer-events-auto">
        {/* Group 1: Navigation Tools */}
        <div className="flex items-center gap-1">
          {navigationTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-1.5" />

        {/* Group 2: Expanded Shapes Dropdown Menu */}
        <div className="relative" ref={shapesMenuRef}>
          <button
            type="button"
            onClick={toggleShapesOpen}
            aria-label="Shapes Library Menu [S]"
            title="Shapes & Architecture Components [S]"
            className={`relative group flex items-center gap-1 px-2.5 h-9 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer pointer-events-auto ${
              isShapesOpen || isShapeActive
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-105"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-transparent hover:scale-105"
            }`}
          >
            <Shapes className="w-4 h-4 text-cyan-400 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold font-mono hidden md:inline-block">
              Shapes
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isShapesOpen ? "rotate-180 text-cyan-300" : "text-zinc-400"
              }`}
            />

            {(isShapesOpen || isShapeActive) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            )}

            {/* Tooltip */}
            <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#09090b]/95 backdrop-blur-md border border-white/15 text-[11px] font-sans text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
              <span>Shapes Library</span>
              <span className="ml-1.5 text-[10px] font-mono text-cyan-400">[S]</span>
            </div>
          </button>

          {/* ── Shapes Popover Dropdown (High z-index) ── */}
          {isShapesOpen && (
            <div className="absolute top-full mt-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-72 rounded-2xl bg-[#09090b]/98 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(6,182,212,0.15)] p-2 z-[9999] pointer-events-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Architecture Library
                </span>
                <span className="text-[10px] font-mono text-zinc-500">[S] toggle</span>
              </div>

              <div className="grid grid-cols-1 gap-1 pt-1.5">
                {architectureShapes.map((shape) => {
                  const Icon = shape.icon;
                  const isSelected = activeMode === shape.id;

                  return (
                    <button
                      key={shape.id}
                      type="button"
                      onClick={() => {
                        onSelectMode(shape.id);
                        onAddShape?.(shape.id);
                        if (onToggleShapesMenu && externalShapesOpen) {
                          onToggleShapesMenu();
                        } else {
                          setInternalShapesOpen(false);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left group cursor-pointer ${
                        isSelected
                          ? "bg-cyan-500/20 border border-cyan-400/50 text-white"
                          : "hover:bg-white/10 border border-transparent text-zinc-300 hover:text-white"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/10 transition-colors">
                        <Icon className={`w-4 h-4 ${shape.color}`} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold font-mono text-zinc-100 group-hover:text-cyan-300 transition-colors">
                            {shape.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-sans truncate">
                          {shape.subtitle}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-1.5" />

        {/* Group 3: Drawing & Annotation Tools */}
        <div className="flex items-center gap-1">
          {drawingTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-1.5" />

        {/* Group 4: UI Elements */}
        <div className="flex items-center gap-1">
          {uiElementTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-1.5" />

        {/* Group 5: Actions: MIX Chatbot, Settings, Fit View */}
        <div className="flex items-center gap-1.5">
          {/* MIX Chatbot Trigger (Toolbar Quota display removed as requested) */}
          {onToggleAICoPilot && (
            <button
              type="button"
              onClick={onToggleAICoPilot}
              title="Open MIX Chatbot & Topology Synthesizer"
              className={`relative group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-lg transition-all duration-200 cursor-pointer pointer-events-auto ${
                isAICoPilotOpen
                  ? "bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 border-cyan-400/80 text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105"
                  : "bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 hover:from-cyan-500/25 hover:via-indigo-500/25 hover:to-purple-500/25 border-cyan-400/40 hover:border-cyan-400/70 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.2)] hover:scale-105"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono tracking-tight font-bold">MIX</span>

              {isAICoPilotOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              )}

              <div className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#09090b]/95 backdrop-blur-md border border-white/15 text-[11px] font-sans text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                Open MIX Chatbot &amp; Architecture Engine
              </div>
            </button>
          )}

          {/* Settings Trigger Modal */}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="Canvas & Quota Settings"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-transparent transition-all cursor-pointer pointer-events-auto hover:scale-105"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Fit View Shortcut */}
          {onFitView && (
            <button
              type="button"
              onClick={onFitView}
              title="Fit Blueprint to Screen (F)"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-transparent transition-all cursor-pointer pointer-events-auto hover:scale-105"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

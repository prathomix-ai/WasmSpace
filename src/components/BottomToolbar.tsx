"use client";

import React from "react";
import {
  MousePointer,
  Hand,
  Server,
  Database,
  Cloud,
  Box,
  Pen,
  Highlighter,
  Eraser,
  MousePointer2,
  Type,
  StickyNote,
  Sparkles,
  Maximize,
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
  | "stickyNote";

export interface BottomToolbarProps {
  activeMode: CanvasToolMode;
  onSelectMode: (mode: CanvasToolMode) => void;
  onToggleAICoPilot?: () => void;
  isAICoPilotOpen?: boolean;
  onFitView?: () => void;
  quotaDisplay?: string;
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
  quotaDisplay,
}: BottomToolbarProps) {
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

  // ── Group 2: Architecture Nodes ───────────────────────────────────────────
  const architectureTools: DockTool[] = [
    {
      id: "server",
      icon: Server,
      label: "Service Node",
      shortcut: "S",
      color: "text-cyan-400",
    },
    {
      id: "database",
      icon: Database,
      label: "Database Node",
      shortcut: "D",
      color: "text-emerald-400",
    },
    {
      id: "cloud",
      icon: Cloud,
      label: "Cloud Gateway / Infra",
      shortcut: "C",
      color: "text-blue-400",
    },
    {
      id: "box",
      icon: Box,
      label: "Cluster / Container",
      shortcut: "B",
      color: "text-purple-400",
    },
  ];

  // ── Group 3: Drawing & Annotation Tools ───────────────────────────────────
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
        className={`relative group flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer ${
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

        {/* macOS Style Dock Indicator Dot */}
        {isActive && (
          <span
            className={`absolute -bottom-1 w-1 h-1 rounded-full ${
              isLaser
                ? "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                : "bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            }`}
          />
        )}

        {/* Tooltip on Hover */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#09090b]/95 backdrop-blur-md border border-white/15 text-[11px] font-sans text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
          <span>{tool.label}</span>
          <span className="ml-1.5 text-[10px] font-mono text-cyan-400">[{tool.shortcut}]</span>
        </div>
      </button>
    );
  };

  return (
    /* ── Enterprise-Grade macOS-Style Floating Dock ── */
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#09090b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] select-none">
        {/* Group 1: Navigation */}
        <div className="flex items-center gap-1">
          {navigationTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Group 2: Architecture Nodes */}
        <div className="flex items-center gap-1">
          {architectureTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Group 3: Drawing & Annotation */}
        <div className="flex items-center gap-1">
          {drawingTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Group 4: UI Elements */}
        <div className="flex items-center gap-1">
          {uiElementTools.map(renderToolButton)}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />

        {/* Group 5: AI Action (AI Co-Pilot) */}
        <div className="flex items-center gap-1.5">
          {onToggleAICoPilot && (
            <button
              type="button"
              onClick={onToggleAICoPilot}
              title="Open AI Co-Pilot & 100+ Prompt Library"
              className={`relative group flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-lg transition-all duration-200 cursor-pointer ${
                isAICoPilotOpen
                  ? "bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30 border-cyan-400/80 text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-105"
                  : "bg-gradient-to-r from-cyan-500/15 via-indigo-500/15 to-purple-500/15 hover:from-cyan-500/25 hover:via-indigo-500/25 hover:to-purple-500/25 border-cyan-400/40 hover:border-cyan-400/70 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.2)] hover:scale-105"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono tracking-tight">AI Co-Pilot</span>

              {quotaDisplay ? (
                <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  {quotaDisplay}
                </span>
              ) : (
                <span className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                  100+
                </span>
              )}

              {/* macOS Style Active Indicator Dot */}
              {isAICoPilotOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
              )}

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-[#09090b]/95 backdrop-blur-md border border-white/15 text-[11px] font-sans text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50">
                Open AI Co-Pilot &amp; 100+ Architecture Prompt Library
              </div>
            </button>
          )}

          {/* Fit View Shortcut */}
          {onFitView && (
            <button
              type="button"
              onClick={onFitView}
              title="Fit Blueprint to Screen (F)"
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-transparent transition-all cursor-pointer hover:scale-105"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

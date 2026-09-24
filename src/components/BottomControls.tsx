"use client";

import React, { useState, useEffect } from "react";
import { Minus, Plus, Maximize2, Map, Grid, Magnet } from "lucide-react";

export interface BottomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  isMinimapOpen: boolean;
  onToggleMinimap: () => void;
  gridType?: string;
  onToggleGrid?: () => void;
  snapToGrid?: boolean;
  onToggleSnap?: () => void;
}

export default function BottomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  isMinimapOpen,
  onToggleMinimap,
  gridType = "dots",
  onToggleGrid,
  snapToGrid = true,
  onToggleSnap,
}: BottomControlsProps) {
  return (
    <>
      {/* ── Bottom-Left Zoom & Canvas Controls (Compact, Dark) ── */}
      <div className="fixed bottom-3.5 left-[110px] z-30 pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center gap-0.5 bg-[#171719] border border-[#2A2A2F] rounded-lg p-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)] text-xs text-[#F4F4F5]">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom out (-)"
            className="w-7 h-7 rounded flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Percentage */}
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset zoom to 100%"
            className="px-2 h-7 rounded text-[11px] font-mono text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer text-center min-w-[44px]"
          >
            {Math.round(zoomLevel)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom in (+)"
            className="w-7 h-7 rounded flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-[#2A2A2F] mx-0.5" />

          {/* Fit to View */}
          <button
            type="button"
            onClick={onFitView}
            title="Fit to screen (Shift+1)"
            className="w-7 h-7 rounded flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Optional Grid Style Toggle */}
          {onToggleGrid && (
            <button
              type="button"
              onClick={onToggleGrid}
              title={`Grid: ${gridType}`}
              className="w-7 h-7 rounded flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Optional Snap Toggle */}
          {onToggleSnap && (
            <button
              type="button"
              onClick={onToggleSnap}
              title={snapToGrid ? "Snap to grid: On" : "Snap to grid: Off"}
              className={`w-7 h-7 rounded flex items-center justify-center transition-colors cursor-pointer ${
                snapToGrid
                  ? "text-[#7C6CFF] bg-[#7C6CFF]/15"
                  : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#242428]"
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom-Right Minimap Toggle (Tiny, remembers state) ── */}
      <div className="fixed bottom-3.5 right-3.5 z-30 pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center bg-[#171719] border border-[#2A2A2F] rounded-lg p-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.35)] text-xs text-[#F4F4F5]">
          <button
            type="button"
            onClick={() => {
              const next = !isMinimapOpen;
              onToggleMinimap();
              if (typeof window !== "undefined") {
                localStorage.setItem("masmspace_show_minimap", String(next));
              }
            }}
            title={isMinimapOpen ? "Hide minimap" : "Show minimap"}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
              isMinimapOpen
                ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Map</span>
          </button>
        </div>
      </div>
    </>
  );
}

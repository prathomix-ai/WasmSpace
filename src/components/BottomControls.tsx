"use client";

import React from "react";
import { Minus, Plus, Maximize2, Map } from "lucide-react";

export interface BottomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  isMinimapOpen: boolean;
  onToggleMinimap: () => void;
}

export default function BottomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  isMinimapOpen,
  onToggleMinimap,
}: BottomControlsProps) {
  return (
    <>
      {/* ── Bottom-Left Zoom & Navigation Controls ── */}
      <div className="fixed bottom-3 left-3 z-30 pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center gap-0.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md px-1 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-700 dark:text-zinc-300 text-xs">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Percentage */}
          <button
            type="button"
            onClick={onResetZoom}
            title="Reset Zoom to 100%"
            className="px-2 py-1 rounded-md text-[11px] font-mono font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer min-w-[42px] text-center"
          >
            {Math.round(zoomLevel)}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />

          {/* Fit to View */}
          <button
            type="button"
            onClick={onFitView}
            title="Fit to Screen (Shift+1)"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Bottom-Right Minimap Toggle ── */}
      <div className="fixed bottom-3 right-3 z-30 pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-zinc-700 dark:text-zinc-300 text-xs">
          <button
            type="button"
            onClick={onToggleMinimap}
            title={isMinimapOpen ? "Hide Minimap" : "Show Minimap"}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              isMinimapOpen
                ? "bg-[#635BFF]/10 text-[#635BFF]"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium hidden sm:inline">Map</span>
          </button>
        </div>
      </div>
    </>
  );
}

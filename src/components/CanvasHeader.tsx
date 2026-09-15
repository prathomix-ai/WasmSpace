"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelLeftOpen, Cloud, Loader2, Save, FileUp, FileText } from "lucide-react";

export interface CanvasHeaderProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  onSaveToCloud: () => void;
  isSavingCloud: boolean;
  isPresentMode?: boolean;
  onImportPdfClick?: () => void;
  isImportingPdf?: boolean;
}

export const CanvasHeader = memo(function CanvasHeader({
  isSidebarVisible,
  onToggleSidebar,
  onSaveToCloud,
  isSavingCloud,
  isPresentMode = false,
  onImportPdfClick,
  isImportingPdf = false,
}: CanvasHeaderProps) {
  if (isPresentMode) return null;

  return (
    <div
      className="fixed top-4 left-4 z-20 pointer-events-auto flex items-center gap-2 select-none"
      role="toolbar"
      aria-label="Canvas Navigation and Controls"
    >
      {/* ── 1. Show Sidebar / Nav Bar Toggle (when sidebar is hidden) ── */}
      <AnimatePresence>
        {!isSidebarVisible && (
          <motion.button
            key="sidebar-toggle-btn"
            type="button"
            initial={{ opacity: 0, x: -16, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onToggleSidebar}
            className="px-3.5 py-2 rounded-xl bg-[#09090b]/85 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 text-xs font-mono text-cyan-300 hover:text-white transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] cursor-pointer group"
            title="Exit Full Screen / Show Sidebar (Ctrl+\)"
            aria-label="Show Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Show Sidebar</span>
            <span className="text-[10px] text-zinc-500 font-sans hidden sm:inline">Ctrl+\</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── 2. Compact Minimalist Icon-Only Save Button with Tooltip & Spinner ── */}
      <div className="relative group flex items-center">
        <button
          type="button"
          id="canvas-compact-save-btn"
          data-tour="save-button"
          onClick={onSaveToCloud}
          disabled={isSavingCloud}
          className={`relative p-2.5 rounded-xl bg-[#09090b]/85 backdrop-blur-xl border border-white/10 hover:border-cyan-400/50 text-cyan-400 hover:text-white hover:bg-cyan-500/10 transition-all duration-200 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer disabled:cursor-wait disabled:opacity-75 ${
            isSavingCloud ? "border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.35)]" : ""
          }`}
          title="Save to Cloud"
          aria-label="Save to Cloud"
        >
          {isSavingCloud ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            <Save className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform duration-150" />
          )}
        </button>

        {/* Floating Minimalist Hover Tooltip */}
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-zinc-950/95 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono font-medium text-cyan-300 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.8)] z-50 flex items-center gap-1.5"
        >
          <Cloud className="w-3 h-3 text-cyan-400" />
          <span>Save to Cloud</span>
        </div>
      </div>

      {/* ── 3. Sleek "Import PDF" Button with Tooltip & Conversion State ── */}
      {onImportPdfClick && (
        <div className="relative group flex items-center">
          <button
            type="button"
            id="canvas-import-pdf-btn"
            onClick={onImportPdfClick}
            disabled={isImportingPdf}
            className={`relative p-2.5 rounded-xl bg-[#09090b]/85 backdrop-blur-xl border border-white/10 hover:border-purple-400/50 text-purple-400 hover:text-white hover:bg-purple-500/10 transition-all duration-200 flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer disabled:cursor-wait disabled:opacity-75 ${
              isImportingPdf ? "border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.35)]" : ""
            }`}
            title="Import Document (PDF, Word, PPT)"
            aria-label="Import Document"
          >
            {isImportingPdf ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform duration-150" />
            )}
          </button>

          {/* Floating Minimalist Hover Tooltip */}
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2.5 py-1 rounded-lg bg-zinc-950/95 backdrop-blur-md border border-purple-500/30 text-[11px] font-mono font-medium text-purple-300 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.8)] z-50 flex items-center gap-1.5"
          >
            <FileText className="w-3 h-3 text-purple-400" />
            <span>Import Document (PDF / Word / PPT)</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default CanvasHeader;

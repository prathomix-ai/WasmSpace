"use client";

import React from "react";
import { StickyNote, Shapes, FileUp, LayoutTemplate, Plus } from "lucide-react";

export interface EmptyCanvasStateProps {
  onAddStickyNote: () => void;
  onAddShape: () => void;
  onImportDocument: () => void;
  onUseTemplate: () => void;
}

export default function EmptyCanvasState({
  onAddStickyNote,
  onAddShape,
  onImportDocument,
  onUseTemplate,
}: EmptyCanvasStateProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 p-4">
      <div className="pointer-events-auto max-w-md w-full text-center">
        {/* Subtle Brand Icon */}
        <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 shadow-sm mx-auto flex items-center justify-center text-[#635BFF] mb-3">
          <Plus className="w-5 h-5" />
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
          Start building your board
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-5">
          Pick a quick starter below or double-click anywhere to begin
        </p>

        {/* 4 Quick Starter Buttons */}
        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
          <button
            type="button"
            onClick={onAddStickyNote}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 shrink-0">
              <StickyNote className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-[#635BFF] transition-colors truncate">
              Sticky note
            </span>
          </button>

          <button
            type="button"
            onClick={onAddShape}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-[#635BFF] shrink-0">
              <Shapes className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-[#635BFF] transition-colors truncate">
              Shape
            </span>
          </button>

          <button
            type="button"
            onClick={onImportDocument}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 shrink-0">
              <FileUp className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-[#635BFF] transition-colors truncate">
              Import file
            </span>
          </button>

          <button
            type="button"
            onClick={onUseTemplate}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 shadow-sm text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 shrink-0">
              <LayoutTemplate className="w-3.5 h-3.5" />
            </div>
            <span className="group-hover:text-[#635BFF] transition-colors truncate">
              Use template
            </span>
          </button>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400 font-mono flex-wrap">
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">V</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">H</kbd> Pan</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">S</kbd> Sticky</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">T</kbd> Text</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">R</kbd> Shape</span>
          <span><kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300">Space+Drag</kbd> Move</span>
        </div>
      </div>
    </div>
  );
}

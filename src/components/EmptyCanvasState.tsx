"use client";

import React from "react";
import { StickyNote, Shapes, Type, FileUp } from "lucide-react";

export interface EmptyCanvasStateProps {
  onAddStickyNote: () => void;
  onAddShape: () => void;
  onAddText?: () => void;
  onImportDocument: () => void;
  onUseTemplate?: () => void;
}

export default function EmptyCanvasState({
  onAddStickyNote,
  onAddShape,
  onAddText,
  onImportDocument,
}: EmptyCanvasStateProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 px-4">
      <div className="pointer-events-auto max-w-sm w-full text-center flex flex-col items-center">
        {/* Title & Subtitle - Clean, spacious, no large card container */}
        <h2 className="text-base font-medium text-[#F4F4F5] tracking-tight">
          Start building your board
        </h2>
        <p className="text-xs text-[#A1A1AA] mt-1 mb-4">
          Double-click anywhere or choose a tool to begin.
        </p>

        {/* 4 Primary Quick Action Pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center mb-5">
          <button
            type="button"
            onClick={onAddStickyNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171719] hover:bg-[#242428] border border-[#2A2A2F] text-xs font-medium text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <StickyNote className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span>Sticky</span>
          </button>

          <button
            type="button"
            onClick={onAddShape}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171719] hover:bg-[#242428] border border-[#2A2A2F] text-xs font-medium text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <Shapes className="w-3.5 h-3.5 text-[#7C6CFF]" />
            <span>Shape</span>
          </button>

          <button
            type="button"
            onClick={onAddText || onAddShape}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171719] hover:bg-[#242428] border border-[#2A2A2F] text-xs font-medium text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={onImportDocument}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#171719] hover:bg-[#242428] border border-[#2A2A2F] text-xs font-medium text-[#F4F4F5] transition-colors cursor-pointer"
          >
            <FileUp className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>Import</span>
          </button>
        </div>

        {/* Very small shortcut row */}
        <div className="flex items-center justify-center gap-2.5 text-[11px] text-[#71717A] font-mono flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">V</kbd>
            <span>Select</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">H</kbd>
            <span>Pan</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">S</kbd>
            <span>Sticky</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">T</kbd>
            <span>Text</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">R</kbd>
            <span>Shape</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.2 rounded bg-[#171719] border border-[#2A2A2F] text-[10px] text-[#A1A1AA]">Space+Drag</kbd>
            <span>Move</span>
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  Sliders,
} from "lucide-react";
import { type Node } from "@xyflow/react";

export interface InspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, patch: Record<string, any>) => void;
  onBringToFront?: (nodeId: string) => void;
  onSendToBack?: (nodeId: string) => void;
}

const PALETTE = [
  "#18181B", // Dark
  "#635BFF", // Indigo
  "#0EA5E9", // Sky
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Rose
  "#FEF3C7", // Sticky Yellow
  "#F3E8FF", // Lavender
];

export default function InspectorPanel({
  isOpen,
  onClose,
  selectedNode,
  onUpdateNode,
  onBringToFront,
  onSendToBack,
}: InspectorPanelProps) {
  if (!isOpen || !selectedNode) return null;

  const nodeData = (selectedNode.data || {}) as any;
  const isLocked = !!nodeData.locked;
  const opacity = nodeData.opacity !== undefined ? nodeData.opacity : 100;
  const currentColor = nodeData.color || "#635BFF";
  const fillMode = nodeData.fillMode || "tint";

  const posX = Math.round(selectedNode.position?.x || 0);
  const posY = Math.round(selectedNode.position?.y || 0);
  const width = Math.round((selectedNode as any).measured?.width || selectedNode.width || 120);
  const height = Math.round((selectedNode as any).measured?.height || selectedNode.height || 80);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed top-16 right-3 bottom-14 z-35 w-64 bg-white/98 dark:bg-[#18181b]/98 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100 select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#635BFF]" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Inspector
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Properties */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans">
          {/* 1. Transform / Position */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Transform
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-400">X</span>
                <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">{posX}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-400">Y</span>
                <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">{posY}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-400">W</span>
                <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">{width}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-mono text-zinc-400">H</span>
                <span className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200">{height}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* 2. Appearance & Color */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Appearance
            </span>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdateNode(selectedNode.id, { color: c })}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-black/10 ${
                    currentColor.toLowerCase() === c.toLowerCase()
                      ? "scale-110 ring-2 ring-[#635BFF] ring-offset-1"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            {/* Fill Mode */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Fill Mode</span>
              <div className="flex items-center gap-1">
                {(["tint", "solid", "outline"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateNode(selectedNode.id, { fillMode: mode })}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-medium transition-colors cursor-pointer ${
                      fillMode === mode
                        ? "bg-[#635BFF] text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1 mt-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Opacity</span>
                <span className="font-mono text-[10px]">{opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={opacity}
                onChange={(e) =>
                  onUpdateNode(selectedNode.id, { opacity: Number(e.target.value) })
                }
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#635BFF]"
              />
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* 3. Layer Ordering */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Layer Hierarchy
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onBringToFront?.(selectedNode.id)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] transition-colors cursor-pointer"
              >
                <ArrowUpToLine className="w-3.5 h-3.5 text-zinc-500" />
                <span>To front</span>
              </button>
              <button
                type="button"
                onClick={() => onSendToBack?.(selectedNode.id)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] transition-colors cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-zinc-500" />
                <span>To back</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* 4. Protection & Lock */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Protection
            </span>
            <button
              type="button"
              onClick={() => onUpdateNode(selectedNode.id, { locked: !isLocked })}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                isLocked
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/60 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span className="text-xs font-medium">
                  {isLocked ? "Element locked" : "Lock element"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {isLocked ? "Read-only" : "Editable"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

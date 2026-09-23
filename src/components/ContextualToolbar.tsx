"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Trash2,
  Sliders,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Crop,
  Layers,
  Minus,
  ArrowRight,
  Tag,
  Palette,
  Check,
} from "lucide-react";
import { type Node } from "@xyflow/react";

export interface ContextualToolbarProps {
  selectedNodes: Node[];
  onUpdateNodeData: (id: string, patch: Record<string, any>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenInspector: () => void;
}

export const STICKY_COLORS = [
  { name: "Yellow", color: "#FEF08A" },
  { name: "Blue", color: "#BAE6FD" },
  { name: "Green", color: "#BBF7D0" },
  { name: "Pink", color: "#FBCFE8" },
  { name: "Purple", color: "#E9D5FF" },
  { name: "Orange", color: "#FED7AA" },
  { name: "Gray", color: "#E4E4E7" },
];

export const SHAPE_COLORS = [
  "#18181B",
  "#635BFF",
  "#2563EB",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
];

export default function ContextualToolbar({
  selectedNodes,
  onUpdateNodeData,
  onDuplicate,
  onDelete,
  onOpenInspector,
}: ContextualToolbarProps) {
  if (!selectedNodes || selectedNodes.length === 0) return null;

  const firstNode = selectedNodes[0];
  const nodeData = (firstNode.data || {}) as any;
  const isMulti = selectedNodes.length > 1;

  const shapeType = (
    nodeData.shapeType ||
    nodeData.shapeStyle ||
    firstNode.type ||
    ""
  ).toLowerCase();

  const isSticky = shapeType === "stickynote" || shapeType === "sticky-note";
  const isText = shapeType === "text" || firstNode.type === "text";
  const isLine = firstNode.type === "line" || shapeType === "line" || nodeData.x1 !== undefined;
  const isImage = shapeType === "image" || firstNode.type === "image";
  const isLocked = Boolean(nodeData.isLocked);
  const currentColor = nodeData.color || (isSticky ? "#FEF08A" : "#635BFF");
  const fillMode = nodeData.fillMode || "tint";

  return (
    <AnimatePresence>
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-35 pointer-events-none select-none">
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-zinc-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-zinc-700 text-xs"
        >
          {/* Multi-selection summary pill */}
          {isMulti && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-100 font-mono text-[11px] text-zinc-600 mr-1">
              {selectedNodes.length} items
            </span>
          )}

          {/* 1. STICKY NOTE: 7 Pastel Colors */}
          {isSticky && !isMulti && (
            <div className="flex items-center gap-1 px-1">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => onUpdateNodeData(firstNode.id, { color: c.color })}
                  style={{ backgroundColor: c.color }}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer border border-black/10 ${
                    currentColor.toLowerCase() === c.color.toLowerCase()
                      ? "scale-125 ring-2 ring-[#635BFF]"
                      : "hover:scale-110"
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* 2. TEXT CONTROLS */}
          {isText && !isMulti && (
            <div className="flex items-center gap-1">
              {/* Bold */}
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeData(firstNode.id, { isBold: !nodeData.isBold })
                }
                className={`p-1.5 rounded-md transition-colors ${
                  nodeData.isBold ? "bg-zinc-200 font-bold" : "hover:bg-zinc-100 text-zinc-600"
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              {/* Italic */}
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeData(firstNode.id, { isItalic: !nodeData.isItalic })
                }
                className={`p-1.5 rounded-md transition-colors ${
                  nodeData.isItalic ? "bg-zinc-200 font-bold" : "hover:bg-zinc-100 text-zinc-600"
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              {/* Font Size Presets */}
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5 text-[10px]">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { fontSize: s })}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      (nodeData.fontSize || "md") === s
                        ? "bg-white font-bold shadow-2xs text-[#635BFF]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. SHAPE CONTROLS */}
          {!isSticky && !isText && !isLine && !isImage && !isMulti && (
            <div className="flex items-center gap-1.5">
              {/* Fill Mode Switcher */}
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5 text-[10px]">
                {(["tint", "solid", "outline"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { fillMode: m })}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      fillMode === m
                        ? "bg-white font-bold shadow-2xs text-[#635BFF]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-1">
                {SHAPE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                      currentColor.toLowerCase() === c.toLowerCase()
                        ? "scale-125 ring-2 ring-offset-1 ring-[#635BFF]"
                        : "hover:scale-110 opacity-80 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 4. LINE CONTROLS */}
          {isLine && !isMulti && (
            <div className="flex items-center gap-1.5">
              {/* Line Style */}
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5 text-[10px]">
                {(["solid", "dashed", "dotted"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { style: st })}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      (nodeData.style || "solid") === st
                        ? "bg-white font-bold shadow-2xs text-[#635BFF]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              {/* Routing */}
              <div className="flex items-center bg-zinc-100 rounded-md p-0.5 text-[10px]">
                {(["straight", "curved", "orthogonal"] as const).map((rt) => (
                  <button
                    key={rt}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { routing: rt })}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      (nodeData.routing || "straight") === rt
                        ? "bg-white font-bold shadow-2xs text-[#635BFF]"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {rt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="h-4 w-px bg-zinc-200 mx-0.5" />

          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(firstNode.id)}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
            title="Duplicate (Cmd+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Lock / Unlock */}
          <button
            type="button"
            onClick={() => onUpdateNodeData(firstNode.id, { isLocked: !isLocked })}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isLocked ? "bg-amber-100 text-amber-700 font-semibold" : "hover:bg-zinc-100 text-zinc-600"
            }`}
            title={isLocked ? "Unlock Object" : "Lock Object"}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Inspect / Properties Panel Toggle */}
          <button
            type="button"
            onClick={onOpenInspector}
            className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
            title="Object Properties Inspector"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(firstNode.id)}
            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete (Delete / Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Trash2,
  Sliders,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Check,
  Palette,
  Minus,
  Plus,
} from "lucide-react";
import { type Node, useReactFlow } from "@xyflow/react";

export interface ContextualToolbarProps {
  selectedNodes: Node[];
  onUpdateNodeData: (id: string, patch: Record<string, any>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenInspector: () => void;
}

// 5 soft, muted sticky note colors matching prompt specification (section 18)
export const STICKY_COLORS = [
  { name: "Yellow", color: "#FEF08A" },
  { name: "Purple", color: "#E9D5FF" },
  { name: "Blue", color: "#BAE6FD" },
  { name: "Green", color: "#BBF7D0" },
  { name: "Coral", color: "#FECDD3" },
];

export const SHAPE_FILL_COLORS = [
  "#171719",
  "#1C1C1F",
  "#7C6CFF",
  "#3B82F6",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
];

export default function ContextualToolbar({
  selectedNodes,
  onUpdateNodeData,
  onDuplicate,
  onDelete,
  onOpenInspector,
}: ContextualToolbarProps) {
  const { flowToScreenPosition } = useReactFlow();
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const firstNode = selectedNodes?.[0];
  const isMulti = (selectedNodes?.length || 0) > 1;

  // Dynamically compute screen position to follow selected object
  useEffect(() => {
    if (!firstNode) {
      setCoords(null);
      return;
    }

    try {
      const screenPos = flowToScreenPosition({
        x: firstNode.position.x,
        y: firstNode.position.y,
      });

      const width = (firstNode as any).measured?.width || firstNode.width || 140;
      const targetX = screenPos.x + width / 2;
      const targetY = screenPos.y - 48;

      // Smart boundary clamping so toolbar never goes outside viewport
      const clampedX = Math.max(160, Math.min(window.innerWidth - 180, targetX));
      const clampedY = Math.max(62, targetY);

      setCoords({ x: clampedX, y: clampedY });
    } catch {
      // Fallback
      setCoords({ x: window.innerWidth / 2, y: 70 });
    }
  }, [firstNode, firstNode?.position?.x, firstNode?.position?.y, flowToScreenPosition]);

  if (!selectedNodes || selectedNodes.length === 0 || !firstNode) return null;

  const nodeData = (firstNode.data || {}) as any;
  const shapeType = (
    nodeData.shapeType ||
    nodeData.shapeStyle ||
    firstNode.type ||
    ""
  ).toLowerCase();

  const isSticky = shapeType === "stickynote" || shapeType === "sticky-note";
  const isText = shapeType === "text" || firstNode.type === "text";
  const isLocked = Boolean(nodeData.isLocked || nodeData.locked);
  const currentColor = nodeData.color || (isSticky ? "#FEF08A" : "#7C6CFF");
  const fontSize = nodeData.fontSize || 14;
  const fontWeight = nodeData.fontWeight || "normal";
  const fontStyle = nodeData.fontStyle || "normal";
  const textAlign = nodeData.textAlign || "left";
  const fillMode = nodeData.fillMode || "tint";

  return (
    <AnimatePresence>
      <div
        className="fixed z-35 pointer-events-none select-none transition-all duration-75 ease-out"
        style={{
          left: coords ? `${coords.x}px` : "50%",
          top: coords ? `${coords.y}px` : "70px",
          transform: "translate(-50%, 0)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.95 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="pointer-events-auto flex items-center gap-1 bg-[#171719] border border-[#2A2A2F] rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.35)] px-1.5 py-1 text-[#F4F4F5] text-xs"
        >
          {/* Multi-selection summary pill */}
          {isMulti && (
            <span className="px-1.5 py-0.5 rounded bg-[#242428] font-mono text-[10px] text-[#A1A1AA] mr-1">
              {selectedNodes.length} items
            </span>
          )}

          {/* ── 1. STICKY NOTE CONTROLS ── */}
          {isSticky && !isMulti && (
            <>
              {/* Color Swatches */}
              <div className="flex items-center gap-1 px-1">
                {STICKY_COLORS.map((st) => (
                  <button
                    key={st.color}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { color: st.color })}
                    title={st.name}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer relative ${
                      currentColor === st.color
                        ? "ring-2 ring-[#7C6CFF] ring-offset-1 ring-offset-[#171719] scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: st.color }}
                  >
                    {currentColor === st.color && (
                      <Check className="w-2.5 h-2.5 text-[#171719] absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>

              <div className="w-px h-3.5 bg-[#2A2A2F] mx-0.5" />
            </>
          )}

          {/* ── 2. TEXT CONTROLS ── */}
          {isText && !isMulti && (
            <>
              {/* Size controls */}
              <div className="flex items-center gap-0.5 bg-[#111113] rounded px-1 py-0.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNodeData(firstNode.id, {
                      fontSize: Math.max(10, fontSize - 2),
                    })
                  }
                  className="p-0.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer"
                  title="Smaller font"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[11px] font-mono px-1 min-w-[24px] text-center text-[#A1A1AA]">
                  {fontSize}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNodeData(firstNode.id, {
                      fontSize: Math.min(48, fontSize + 2),
                    })
                  }
                  className="p-0.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] cursor-pointer"
                  title="Larger font"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Bold */}
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeData(firstNode.id, {
                    fontWeight: fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                title="Bold"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  fontWeight === "bold"
                    ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                    : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
                }`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onClick={() =>
                  onUpdateNodeData(firstNode.id, {
                    fontStyle: fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                title="Italic"
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  fontStyle === "italic"
                    ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                    : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              {/* Alignments */}
              <div className="flex items-center gap-0.5">
                {(["left", "center", "right"] as const).map((align) => {
                  const Icon =
                    align === "left"
                      ? AlignLeft
                      : align === "center"
                      ? AlignCenter
                      : AlignRight;
                  return (
                    <button
                      key={align}
                      type="button"
                      onClick={() => onUpdateNodeData(firstNode.id, { textAlign: align })}
                      title={`Align ${align}`}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        textAlign === align
                          ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                          : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>

              <div className="w-px h-3.5 bg-[#2A2A2F] mx-0.5" />
            </>
          )}

          {/* ── 3. SHAPE CONTROLS ── */}
          {!isSticky && !isText && !isMulti && (
            <>
              {/* Fill Mode Switcher */}
              <div className="flex items-center gap-0.5 bg-[#111113] rounded p-0.5">
                {(["tint", "solid", "outline"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateNodeData(firstNode.id, { fillMode: mode })}
                    className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition-colors cursor-pointer ${
                      fillMode === mode
                        ? "bg-[#242428] text-[#F4F4F5] font-medium"
                        : "text-[#71717A] hover:text-[#A1A1AA]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Fill Color Picker Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen((prev) => !prev)}
                  title="Shape color"
                  className="p-1.5 rounded hover:bg-[#242428] text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-[#2A2A2F]"
                    style={{ backgroundColor: currentColor }}
                  />
                </button>

                {isColorPickerOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center gap-1 z-50">
                    {SHAPE_FILL_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          onUpdateNodeData(firstNode.id, { color: col });
                          setIsColorPickerOpen(false);
                        }}
                        className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                          currentColor === col
                            ? "border-[#7C6CFF] scale-110"
                            : "border-[#2A2A2F] hover:scale-105"
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-3.5 bg-[#2A2A2F] mx-0.5" />
            </>
          )}

          {/* ── COMMON ACTIONS: Duplicate, Delete, Lock, Inspector ── */}
          <button
            type="button"
            onClick={() => onDuplicate(firstNode.id)}
            title="Duplicate (Cmd+D)"
            className="p-1.5 rounded text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateNodeData(firstNode.id, {
                isLocked: !isLocked,
                locked: !isLocked,
              })
            }
            title={isLocked ? "Unlock object" : "Lock object"}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              isLocked
                ? "text-[#FBBF24] bg-[#FBBF24]/10"
                : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428]"
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onOpenInspector}
            title="Inspect properties"
            className="p-1.5 rounded text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#7C6CFF]" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(firstNode.id)}
            title="Delete (Backspace)"
            className="p-1.5 rounded text-[#A1A1AA] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

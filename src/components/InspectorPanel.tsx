"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Lock,
  Unlock,
  ArrowUpToLine,
  ArrowDownToLine,
  Sliders,
  ChevronDown,
  ChevronRight,
  RotateCw,
  Eye,
  Layers,
  Code,
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
  "#F4F4F5",
  "#A1A1AA",
  "#7C6CFF",
  "#3B82F6",
  "#4ADE80",
  "#FBBF24",
  "#F87171",
  "#171719",
];

export default function InspectorPanel({
  isOpen,
  onClose,
  selectedNode,
  onUpdateNode,
  onBringToFront,
  onSendToBack,
}: InspectorPanelProps) {
  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transform: true,
    appearance: true,
    layer: true,
    advanced: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen || !selectedNode) return null;

  const nodeData = (selectedNode.data || {}) as any;
  const isLocked = Boolean(nodeData.locked || nodeData.isLocked);
  const opacity = nodeData.opacity !== undefined ? nodeData.opacity : 100;
  const currentColor = nodeData.color || "#7C6CFF";
  const rotation = nodeData.rotation || 0;
  const strokeWidth = nodeData.strokeWidth || 1;
  const borderRadius = nodeData.borderRadius || 6;

  const posX = Math.round(selectedNode.position?.x || 0);
  const posY = Math.round(selectedNode.position?.y || 0);
  const width = Math.round((selectedNode as any).measured?.width || selectedNode.width || 120);
  const height = Math.round((selectedNode as any).measured?.height || selectedNode.height || 80);

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="fixed top-[52px] right-0 bottom-0 z-35 w-[290px] bg-[#171719] border-l border-[#2A2A2F] shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5)] flex flex-col text-[#F4F4F5] select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#2A2A2F] bg-[#111113]">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#7C6CFF]" />
            <span className="text-xs font-semibold text-[#F4F4F5]">Inspector</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
            title="Close inspector (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Properties */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs font-sans">
          {/* 1. Transform / Position & Size */}
          <div className="border border-[#2A2A2F] rounded-lg p-2.5 bg-[#111113]">
            <button
              type="button"
              onClick={() => toggleSection("transform")}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                Position & Size
              </span>
              {openSections.transform ? (
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#71717A]" />
              )}
            </button>

            {openSections.transform && (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1C1F] border border-[#2A2A2F]">
                    <span className="text-[10px] font-mono text-[#71717A]">X</span>
                    <span className="text-[11px] font-mono text-[#F4F4F5]">{posX}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1C1F] border border-[#2A2A2F]">
                    <span className="text-[10px] font-mono text-[#71717A]">Y</span>
                    <span className="text-[11px] font-mono text-[#F4F4F5]">{posY}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1C1F] border border-[#2A2A2F]">
                    <span className="text-[10px] font-mono text-[#71717A]">W</span>
                    <span className="text-[11px] font-mono text-[#F4F4F5]">{width}px</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C1C1F] border border-[#2A2A2F]">
                    <span className="text-[10px] font-mono text-[#71717A]">H</span>
                    <span className="text-[11px] font-mono text-[#F4F4F5]">{height}px</span>
                  </div>
                </div>

                {/* Rotation preset buttons */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-[#A1A1AA] flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Rotate
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdateNode(selectedNode.id, { rotation: deg })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                          rotation === deg
                            ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                            : "bg-[#1C1C1F] text-[#A1A1AA] hover:text-[#F4F4F5]"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Appearance: Fill, Stroke, Radius */}
          <div className="border border-[#2A2A2F] rounded-lg p-2.5 bg-[#111113]">
            <button
              type="button"
              onClick={() => toggleSection("appearance")}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                Appearance
              </span>
              {openSections.appearance ? (
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#71717A]" />
              )}
            </button>

            {openSections.appearance && (
              <div className="mt-2.5 space-y-3">
                {/* Palette */}
                <div>
                  <span className="text-[10px] text-[#A1A1AA] block mb-1.5">Color Accent</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onUpdateNode(selectedNode.id, { color: c })}
                        className={`w-6 h-6 rounded border transition-transform cursor-pointer mx-auto ${
                          currentColor === c
                            ? "border-[#7C6CFF] ring-2 ring-[#7C6CFF]/40"
                            : "border-[#2A2A2F] hover:scale-105"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] mb-1">
                    <span>Corner Radius</span>
                    <span className="font-mono text-[#F4F4F5]">{borderRadius}px</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[0, 4, 8, 16].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => onUpdateNode(selectedNode.id, { borderRadius: rad })}
                        className={`py-1 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                          borderRadius === rad
                            ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                            : "bg-[#1C1C1F] text-[#A1A1AA] hover:text-[#F4F4F5]"
                        }`}
                      >
                        {rad}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] mb-1">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Opacity
                    </span>
                    <span className="font-mono text-[#F4F4F5]">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, { opacity: Number(e.target.value) })
                    }
                    className="w-full h-1 bg-[#1C1C1F] rounded appearance-none cursor-pointer accent-[#7C6CFF]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Layer Ordering & Lock */}
          <div className="border border-[#2A2A2F] rounded-lg p-2.5 bg-[#111113]">
            <button
              type="button"
              onClick={() => toggleSection("layer")}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                Layer & Protection
              </span>
              {openSections.layer ? (
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#71717A]" />
              )}
            </button>

            {openSections.layer && (
              <div className="mt-2.5 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onBringToFront?.(selectedNode.id)}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#1C1C1F] hover:bg-[#242428] border border-[#2A2A2F] text-[11px] text-[#F4F4F5] transition-colors cursor-pointer"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span>To Front</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendToBack?.(selectedNode.id)}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-[#1C1C1F] hover:bg-[#242428] border border-[#2A2A2F] text-[11px] text-[#F4F4F5] transition-colors cursor-pointer"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 text-[#A1A1AA]" />
                    <span>To Back</span>
                  </button>
                </div>

                {/* Lock Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNode(selectedNode.id, {
                      locked: !isLocked,
                      isLocked: !isLocked,
                    })
                  }
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
                    isLocked
                      ? "bg-[#FBBF24]/10 border-[#FBBF24]/30 text-[#FBBF24]"
                      : "bg-[#1C1C1F] border-[#2A2A2F] text-[#F4F4F5] hover:bg-[#242428]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-[#71717A]" />
                    )}
                    <span className="text-xs font-medium">
                      {isLocked ? "Element Locked" : "Lock Position"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#71717A]">
                    {isLocked ? "Protected" : "Unlocked"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Advanced */}
          <div className="border border-[#2A2A2F] rounded-lg p-2.5 bg-[#111113]">
            <button
              type="button"
              onClick={() => toggleSection("advanced")}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                Advanced Metadata
              </span>
              {openSections.advanced ? (
                <ChevronDown className="w-3 h-3 text-[#71717A]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#71717A]" />
              )}
            </button>

            {openSections.advanced && (
              <div className="mt-2 text-[10px] font-mono text-[#71717A] space-y-1">
                <div>Type: {selectedNode.type}</div>
                <div>ID: {selectedNode.id}</div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

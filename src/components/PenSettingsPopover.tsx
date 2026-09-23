"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Edit3, Feather, Highlighter, Paintbrush } from "lucide-react";

export type PenType = "ballpen" | "pencil" | "marker" | "brush";

export interface PenSettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  penType?: PenType;
  onChangePenType?: (type: PenType) => void;
  penColor: string;
  onChangePenColor: (color: string) => void;
  penWidth: number;
  onChangePenWidth: (width: number) => void;
  penOpacity?: number;
  onChangePenOpacity?: (opacity: number) => void;
  smoothing?: boolean;
  onToggleSmoothing?: () => void;
}

export const STROKE_COLORS = [
  { label: "Charcoal", hex: "#18181B" },
  { label: "Muted Gray", hex: "#71717A" },
  { label: "Indigo", hex: "#635BFF" },
  { label: "Royal Blue", hex: "#2563EB" },
  { label: "Sky Cyan", hex: "#0EA5E9" },
  { label: "Emerald", hex: "#10B981" },
  { label: "Warm Yellow", hex: "#EAB308" },
  { label: "Amber Orange", hex: "#F97316" },
  { label: "Rose Red", hex: "#EF4444" },
  { label: "Pink", hex: "#EC4899" },
  { label: "Pure White", hex: "#FFFFFF" },
];

export const WIDTH_PRESETS = [
  { size: 1, label: "1px" },
  { size: 2, label: "2px" },
  { size: 4, label: "4px" },
  { size: 6, label: "6px" },
  { size: 8, label: "8px" },
  { size: 12, label: "12px" },
  { size: 16, label: "16px" },
];

export const OPACITY_PRESETS = [
  { val: 0.1, label: "10%" },
  { val: 0.25, label: "25%" },
  { val: 0.5, label: "50%" },
  { val: 0.75, label: "75%" },
  { val: 1.0, label: "100%" },
];

export default function PenSettingsPopover({
  isOpen,
  onClose,
  penType = "ballpen",
  onChangePenType,
  penColor,
  onChangePenColor,
  penWidth,
  onChangePenWidth,
  penOpacity = 1.0,
  onChangePenOpacity,
  smoothing = true,
  onToggleSmoothing,
}: PenSettingsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const penTypes = [
    { id: "ballpen" as PenType, label: "Ball Pen", icon: Edit3 },
    { id: "pencil" as PenType, label: "Pencil", icon: Feather },
    { id: "marker" as PenType, label: "Marker", icon: Highlighter },
    { id: "brush" as PenType, label: "Brush", icon: Paintbrush },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-[70] w-72 p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] select-none text-zinc-900"
        >
          {/* ── 1. Pen Type Selector ── */}
          <div className="mb-3">
            <span className="block text-[11px] font-medium text-zinc-500 mb-1.5">
              Tool Type
            </span>
            <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-zinc-100 border border-zinc-200/60">
              {penTypes.map((pt) => {
                const Icon = pt.icon;
                const isSelected = penType === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => onChangePenType?.(pt.id)}
                    title={pt.label}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      isSelected
                        ? "bg-white text-[#635BFF] shadow-2xs font-semibold"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    <span>{pt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. Color Palette ── */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-500">
                Color
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase">
                {penColor}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {STROKE_COLORS.map((c) => {
                const isSelected = penColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onChangePenColor(c.hex)}
                    title={c.label}
                    className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center relative ${
                      isSelected ? "scale-110 ring-2 ring-[#635BFF] ring-offset-1" : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: c.hex,
                      border: c.hex === "#FFFFFF" ? "1px solid #E4E4E7" : "none",
                    }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          c.hex === "#FFFFFF" || c.hex === "#EAB308" ? "text-zinc-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
              {/* Custom Color Input */}
              <label
                title="Custom Color"
                className="w-7 h-7 rounded-lg border border-dashed border-zinc-300 hover:border-zinc-400 flex items-center justify-center cursor-pointer transition-colors"
              >
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => onChangePenColor(e.target.value)}
                  className="sr-only"
                />
                <span className="text-[11px] font-bold text-zinc-500">+</span>
              </label>
            </div>
          </div>

          {/* ── 3. Stroke Width ── */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-500">
                Stroke Width
              </span>
              <span className="text-[10px] font-mono text-zinc-700 font-semibold">
                {penWidth}px
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              {WIDTH_PRESETS.map((p) => {
                const isSelected = penWidth === p.size;
                return (
                  <button
                    key={p.size}
                    type="button"
                    onClick={() => onChangePenWidth(p.size)}
                    title={p.label}
                    className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-all flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-[#635BFF]/10 text-[#635BFF] border border-[#635BFF]/30 font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/70"
                    }`}
                  >
                    <div
                      className="rounded-full bg-current"
                      style={{
                        width: Math.min(10, Math.max(2, p.size)),
                        height: Math.min(10, Math.max(2, p.size)),
                      }}
                    />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 4. Opacity ── */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-500">
                Opacity
              </span>
              <span className="text-[10px] font-mono text-zinc-700 font-semibold">
                {Math.round(penOpacity * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {OPACITY_PRESETS.map((op) => {
                const isSelected = Math.abs(penOpacity - op.val) < 0.05;
                return (
                  <button
                    key={op.label}
                    type="button"
                    onClick={() => onChangePenOpacity?.(op.val)}
                    className={`py-1 rounded-md text-[10px] font-medium transition-all ${
                      isSelected
                        ? "bg-zinc-900 text-white font-semibold"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border border-zinc-200/70"
                    }`}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 5. Smoothing / Stylus Sensitivity ── */}
          {onToggleSmoothing && (
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-zinc-600 font-medium">Stroke Smoothing</span>
              <button
                type="button"
                onClick={onToggleSmoothing}
                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ${
                  smoothing ? "bg-[#635BFF]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-150 ${
                    smoothing ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

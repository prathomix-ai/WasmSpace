"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pipette, Check } from "lucide-react";

export interface PenSettingsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  penColor: string;
  onChangePenColor: (color: string) => void;
  penWidth: number;
  onChangePenWidth: (width: number) => void;
}

const PRESET_COLORS = [
  { label: "Neon Cyan", hex: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" },
  { label: "Neon Purple", hex: "#a855f7", glow: "rgba(168, 85, 247, 0.6)" },
  { label: "Neon Yellow", hex: "#facc15", glow: "rgba(250, 204, 21, 0.6)" },
  { label: "Pure White", hex: "#ffffff", glow: "rgba(255, 255, 255, 0.6)" },
  { label: "Neon Red", hex: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },
  { label: "Neon Emerald", hex: "#10b981", glow: "rgba(16, 185, 129, 0.6)" },
];

const THICKNESS_PRESETS = [
  { label: "Small", size: 2, dotClass: "w-1.5 h-1.5" },
  { label: "Medium", size: 4, dotClass: "w-2.5 h-2.5" },
  { label: "Large", size: 8, dotClass: "w-4 h-4" },
];

export default function PenSettingsPopover({
  isOpen,
  onClose,
  penColor,
  onChangePenColor,
  penWidth,
  onChangePenWidth,
}: PenSettingsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  // Close on outside click
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

  const isCustomColor = !PRESET_COLORS.some(
    (c) => c.hex.toLowerCase() === penColor.toLowerCase()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 z-[60] w-64 p-4 rounded-2xl bg-[#0e1017]/95 backdrop-blur-2xl border border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_24px_rgba(6,182,212,0.2)] select-none"
        >
          {/* ── Section 1: Color Palette ── */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Ink Color
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-300 border border-white/10 uppercase">
                {penColor}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1.5">
              {/* Preset Neon Swatches */}
              {PRESET_COLORS.map((color) => {
                const isSelected =
                  penColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => onChangePenColor(color.hex)}
                    title={color.label}
                    className={`relative w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? "scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#0e1017]"
                        : "hover:scale-110 opacity-85 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      boxShadow: isSelected ? `0 0 12px ${color.glow}` : undefined,
                    }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          color.hex === "#ffffff" || color.hex === "#facc15"
                            ? "text-black"
                            : "text-white"
                        }`}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Wheel Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  title="Custom Hex Color Wheel"
                  className={`relative w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center cursor-pointer ${
                    isCustomColor
                      ? "scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#0e1017] shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                      : "hover:scale-110 opacity-85 hover:opacity-100"
                  }`}
                  style={{
                    background:
                      "conic-gradient(from 180deg, #ff0055, #ffdd00, #00ff88, #00ddff, #7700ff, #ff00aa, #ff0055)",
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-[#0e1017]/80 flex items-center justify-center">
                    <Pipette className="w-2.5 h-2.5 text-white" />
                  </div>
                </button>

                <input
                  ref={colorInputRef}
                  type="color"
                  value={penColor}
                  onChange={(e) => onChangePenColor(e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-white/10 mb-3.5" />

          {/* ── Section 2: Stroke Thickness ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Pen Stroke
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                {penWidth}px
              </span>
            </div>

            {/* Quick S / M / L Preset Dots */}
            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
              {THICKNESS_PRESETS.map((preset) => {
                const isActive = penWidth === preset.size;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onChangePenWidth(preset.size)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-[10px] font-mono transition-all cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/20 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                        : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                    }`}
                  >
                    <span
                      className={`${preset.dotClass} rounded-full`}
                      style={{ backgroundColor: penColor }}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Smooth Precision Slider with Live Preview */}
            <div className="flex items-center gap-2.5 px-1">
              <input
                type="range"
                min={1}
                max={16}
                step={1}
                value={penWidth}
                onChange={(e) => onChangePenWidth(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 focus:outline-none"
              />
              <div
                className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
                title="Live size preview"
              >
                <div
                  className="rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.min(penWidth, 14)}px`,
                    height: `${Math.min(penWidth, 14)}px`,
                    backgroundColor: penColor,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Downward Arrow / Notch pointing toward Pencil Icon */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0e1017] border-r border-b border-white/15" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

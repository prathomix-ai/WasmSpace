"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type Editor } from "@tldraw/tldraw";
import { addGeoToCanvas } from "@/lib/canvasUtils";

interface PropertiesPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  editor: Editor | null;
}

const COLOR_PALETTE = [
  { name: "Cyan", value: "blue", hex: "#00f5ff" },
  { name: "Purple", value: "violet", hex: "#a855f7" },
  { name: "Orange", value: "orange", hex: "#f97316" },
  { name: "Green", value: "green", hex: "#22c55e" },
  { name: "Pink", value: "light-violet", hex: "#ec4899" },
  { name: "Yellow", value: "yellow", hex: "#eab308" },
  { name: "Red", value: "red", hex: "#ef4444" },
  { name: "Void", value: "black", hex: "#18181b" },
];

const GRADIENT_PRESETS = [
  { id: "indigo-wave", name: "Indigo Wave", from: "#3b82f6", to: "#6366f1", color: "blue", fill: "semi" },
  { id: "sunset-ember", name: "Sunset Ember", from: "#f97316", to: "#ec4899", color: "orange", fill: "semi" },
  { id: "emerald-mint", name: "Emerald Mint", from: "#10b981", to: "#06b6d4", color: "green", fill: "semi" },
  { id: "amber-gold", name: "Amber Gold", from: "#eab308", to: "#f97316", color: "yellow", fill: "semi" },
];

export default function PropertiesPanel({
  isOpen,
  onToggleOpen,
  editor,
}: PropertiesPanelProps) {
  const [selectedColor, setSelectedColor] = useState("violet");
  const [selectedFill, setSelectedFill] = useState<"none" | "semi" | "solid" | "pattern">("semi");
  const [selectedSize, setSelectedSize] = useState<"s" | "m" | "l" | "xl">("m");
  const [selectedDash, setSelectedDash] = useState<"draw" | "solid" | "dashed" | "dotted">("draw");
  const [opacity, setOpacity] = useState(100);
  const [selectedShapesCount, setSelectedShapesCount] = useState(0);

  // Sync with canvas selection changes
  useEffect(() => {
    if (!editor) return;

    const updateSelectionInfo = () => {
      const selected = editor.getSelectedShapes();
      setSelectedShapesCount(selected.length);

      if (selected.length > 0) {
        const first = selected[0];
        const props = (first.props || {}) as Record<string, any>;
        if (props.color) setSelectedColor(props.color);
        if (props.fill) setSelectedFill(props.fill);
        if (props.size) setSelectedSize(props.size);
        if (props.dash) setSelectedDash(props.dash);
        if (first.opacity !== undefined) setOpacity(Math.round(first.opacity * 100));
      }
    };

    const cleanup = editor.store.listen(updateSelectionInfo);
    return () => cleanup();
  }, [editor]);

  // Apply updates to selected shapes or defaults
  const applyShapeProp = (propName: string, value: any) => {
    if (!editor) return;

    const selected = editor.getSelectedShapes();
    if (selected.length > 0) {
      const updates = selected.map((shape) => ({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          [propName]: value,
        },
      }));
      editor.updateShapes(updates as any);
    }

    // Also update editor current style for future shapes
    try {
      editor.setStyleForNextShapes({ id: `tldraw:${propName}`, defaultValue: value } as any, value);
    } catch {
      // Ignore if prop doesn't map directly to style prop
    }
  };

  const handleColorChange = (colorValue: string) => {
    setSelectedColor(colorValue);
    applyShapeProp("color", colorValue);
  };

  const handleFillChange = (fillType: "none" | "semi" | "solid" | "pattern") => {
    setSelectedFill(fillType);
    applyShapeProp("fill", fillType);
  };

  const handleSizeChange = (size: "s" | "m" | "l" | "xl") => {
    setSelectedSize(size);
    applyShapeProp("size", size);
  };

  const handleDashChange = (dash: "draw" | "solid" | "dashed" | "dotted") => {
    setSelectedDash(dash);
    applyShapeProp("dash", dash);
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    if (!editor) return;
    const selected = editor.getSelectedShapes();
    if (selected.length > 0) {
      editor.updateShapes(
        selected.map((s) => ({
          id: s.id,
          type: s.type,
          opacity: val / 100,
        }))
      );
    }
  };

  const handleCreateQuickShape = (geo: string) => {
    if (!editor) return;
    const bounds = editor.getViewportPageBounds();
    const cx = bounds ? bounds.center.x : 400;
    const cy = bounds ? bounds.center.y : 300;
    addGeoToCanvas(editor, geo, cx - 100, cy - 70, selectedColor);
  };

  return (
    <div className="fixed top-20 right-4 z-40 flex flex-col items-end pointer-events-none">
      {/* Toggle Button */}
      <button
        onClick={onToggleOpen}
        className={`pointer-events-auto mb-2 p-2.5 rounded-xl border transition-all shadow-lg flex items-center gap-2 ${
          isOpen
            ? "bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan shadow-[0_0_16px_rgba(0,245,255,0.25)]"
            : "bg-void-surface/90 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
        } backdrop-blur-xl`}
        title="Shape Style & Fill Inspector"
      >
        <span className="text-base">🎨</span>
        <span className="text-xs font-mono font-medium">{isOpen ? "Styles" : "Inspector"}</span>
      </button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 bg-void-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl pointer-events-auto flex flex-col gap-4 text-zinc-200 select-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm">🎨</span>
                <span className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-300">
                  Shape Properties
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono">
                {selectedShapesCount > 0 ? `${selectedShapesCount} Selected` : "Canvas Default"}
              </span>
            </div>

            {/* Quick Shape Spawner */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-2">
                Quick Shapes
              </span>
              <div className="grid grid-cols-6 gap-1.5 bg-void-dark/60 p-2 rounded-xl border border-white/5">
                {[
                  { geo: "rectangle", label: "Rect", icon: "▭" },
                  { geo: "ellipse", label: "Circle", icon: "○" },
                  { geo: "diamond", label: "Rhombus", icon: "◇" },
                  { geo: "star", label: "Star", icon: "☆" },
                  { geo: "triangle", label: "Triangle", icon: "△" },
                  { geo: "cloud", label: "Cloud", icon: "☁" },
                ].map((s) => (
                  <button
                    key={s.geo}
                    onClick={() => handleCreateQuickShape(s.geo)}
                    className="h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-zinc-300 hover:text-neon-cyan hover:border hover:border-neon-cyan/30 transition-all text-base"
                    title={`Create ${s.label}`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape Fill Controls */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Shape Fill Mode
                </span>
                <span className="text-[10px] text-neon-cyan font-mono capitalize">
                  {selectedFill}
                </span>
              </div>

              {/* Fill Mode Switcher */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-void-dark/60 rounded-xl border border-white/5 mb-3">
                {[
                  { id: "none", label: "None" },
                  { id: "semi", label: "Glass" },
                  { id: "solid", label: "Solid" },
                  { id: "pattern", label: "Pattern" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFillChange(f.id as any)}
                    className={`py-1 rounded-lg text-[11px] font-mono transition-all ${
                      selectedFill === f.id
                        ? "bg-neon-cyan text-void-dark font-bold shadow-[0_0_10px_rgba(0,245,255,0.4)]"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Gradient Presets */}
              <span className="text-[10px] font-sans uppercase tracking-wider text-zinc-400 block mb-1.5 font-medium">
                Architectural Gradients
              </span>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {GRADIENT_PRESETS.map((grad) => (
                  <button
                    key={grad.id}
                    onClick={() => {
                      handleColorChange(grad.color);
                      handleFillChange(grad.fill as any);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all text-left group"
                    style={{
                      background: `linear-gradient(135deg, ${grad.from}22, ${grad.to}11)`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-md shadow-sm border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                      }}
                    />
                    <span className="text-[11px] font-mono text-zinc-300 group-hover:text-white">
                      {grad.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Color Swatches */}
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
                Palette
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleColorChange(c.value)}
                    className={`h-6 rounded-md transition-all relative ${
                      selectedColor === c.value
                        ? "ring-2 ring-white scale-110 shadow-lg"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Stroke Controls */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Stroke Width
                </span>
                <span className="text-[10px] font-mono text-zinc-400 uppercase">
                  {selectedSize}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-void-dark/60 rounded-xl border border-white/5 mb-3">
                {[
                  { id: "s", label: "Thin", px: 2 },
                  { id: "m", label: "Medium", px: 4 },
                  { id: "l", label: "Thick", px: 6 },
                  { id: "xl", label: "Heavy", px: 8 },
                ].map((sz) => (
                  <button
                    key={sz.id}
                    onClick={() => handleSizeChange(sz.id as any)}
                    className={`py-1 rounded-lg text-[10px] font-mono transition-all flex flex-col items-center gap-1 ${
                      selectedSize === sz.id
                        ? "bg-white/15 text-neon-cyan font-bold border border-neon-cyan/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span
                      className="w-4 bg-current rounded-full"
                      style={{ height: `${sz.px}px` }}
                    />
                    <span>{sz.label}</span>
                  </button>
                ))}
              </div>

              {/* Dash Style */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Line Style
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-void-dark/60 rounded-xl border border-white/5">
                {[
                  { id: "draw", label: "Sketch" },
                  { id: "solid", label: "Solid" },
                  { id: "dashed", label: "Dashed" },
                  { id: "dotted", label: "Dotted" },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDashChange(d.id as any)}
                    className={`py-1 rounded-lg text-[10px] font-mono transition-all ${
                      selectedDash === d.id
                        ? "bg-white/15 text-neon-cyan font-bold border border-neon-cyan/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Opacity
                </span>
                <span className="text-[10px] font-mono text-neon-cyan">{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Square,
  Circle,
  Diamond,
  Triangle,
  Cylinder,
  Cloud,
  Star,
  Heart,
  Hexagon,
  Boxes,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  MessageSquare,
  Server,
  Database,
  User,
  Smartphone,
  Cpu,
  Workflow,
  Plus,
  Bookmark,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export interface ShapeItem {
  id: string;
  label: string;
  category: "basic" | "flowchart" | "diagram" | "callouts" | "arrows";
  icon: React.ComponentType<{ className?: string }>;
  isPro?: boolean;
}

export const ALL_SHAPES: ShapeItem[] = [
  // Basic Shapes
  { id: "rectangle", label: "Rectangle", category: "basic", icon: Square },
  { id: "rounded_rectangle", label: "Rounded Rectangle", category: "basic", icon: Square },
  { id: "circle", label: "Circle / Ellipse", category: "basic", icon: Circle },
  { id: "triangle", label: "Triangle", category: "basic", icon: Triangle },
  { id: "diamond", label: "Diamond", category: "basic", icon: Diamond },
  { id: "hexagon", label: "Hexagon", category: "basic", icon: Hexagon },
  { id: "star", label: "Star", category: "basic", icon: Star },
  { id: "heart", label: "Heart", category: "basic", icon: Heart },

  // Flowchart
  { id: "process", label: "Process", category: "flowchart", icon: Square },
  { id: "decision", label: "Decision", category: "flowchart", icon: Diamond },
  { id: "terminator", label: "Terminator / Pill", category: "flowchart", icon: Circle },
  { id: "database", label: "Database", category: "flowchart", icon: Cylinder },
  { id: "document", label: "Document", category: "flowchart", icon: Boxes },

  // Diagram / Cloud Architecture
  { id: "container", label: "Container / Group", category: "diagram", icon: Boxes },
  { id: "cloud", label: "Cloud Gateway", category: "diagram", icon: Cloud },
  { id: "server", label: "Compute Server", category: "diagram", icon: Server },
  { id: "user", label: "Actor / User", category: "diagram", icon: User },
  { id: "device", label: "Client Device", category: "diagram", icon: Smartphone },
  { id: "api", label: "API Endpoint", category: "diagram", icon: Cpu },
  { id: "queue", label: "Message Queue", category: "diagram", icon: Workflow },

  // Callouts
  { id: "speech_bubble", label: "Speech Bubble", category: "callouts", icon: MessageSquare },
  { id: "callout", label: "Callout Box", category: "callouts", icon: Boxes },
  { id: "thought_bubble", label: "Thought Bubble", category: "callouts", icon: Cloud },

  // Arrows
  { id: "arrow_right", label: "Right Arrow", category: "arrows", icon: ArrowRight },
  { id: "arrow_left", label: "Left Arrow", category: "arrows", icon: ArrowLeft },
  { id: "arrow_up", label: "Up Arrow", category: "arrows", icon: ArrowUp },
  { id: "arrow_down", label: "Down Arrow", category: "arrows", icon: ArrowDown },
  { id: "double_arrow", label: "Bidirectional Arrow", category: "arrows", icon: ArrowLeftRight },
];

export interface ShapeLibraryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (shapeId: string) => void;
  onOpenUpgrade?: () => void;
}

export default function ShapeLibraryPopover({
  isOpen,
  onClose,
  onSelectShape,
  onOpenUpgrade,
}: ShapeLibraryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [recentShapes, setRecentShapes] = useState<string[]>([
    "rectangle",
    "circle",
    "diamond",
    "cloud",
    "database",
  ]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  const filteredShapes = useMemo(() => {
    return ALL_SHAPES.filter((s) => {
      const matchesSearch =
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handlePick = (shape: ShapeItem) => {
    if (shape.isPro) {
      onOpenUpgrade?.();
      return;
    }
    // Update recents
    setRecentShapes((prev) => [
      shape.id,
      ...prev.filter((id) => id !== shape.id).slice(0, 5),
    ]);
    onSelectShape(shape.id);
    onClose();
  };

  const categories = [
    { id: "all", label: "All" },
    { id: "basic", label: "Basic" },
    { id: "flowchart", label: "Flowchart" },
    { id: "diagram", label: "Diagram" },
    { id: "callouts", label: "Callouts" },
    { id: "arrows", label: "Arrows" },
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
          className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 z-[70] w-80 p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] select-none text-zinc-900"
        >
          {/* Header & Search */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shapes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-50 border border-zinc-200 placeholder-zinc-400 text-zinc-900 focus:outline-none focus:border-[#635BFF] focus:ring-1 focus:ring-[#635BFF]/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-2.5 scrollbar-none text-[11px]">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                  activeCategory === c.id
                    ? "bg-zinc-900 text-white font-medium"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Shapes Grid */}
          <div className="max-h-56 overflow-y-auto pr-1 space-y-3">
            {/* Recents row if on 'all' and not searching */}
            {activeCategory === "all" && !searchQuery && (
              <div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Recently Used</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {recentShapes.map((id) => {
                    const shape = ALL_SHAPES.find((s) => s.id === id) || ALL_SHAPES[0];
                    const Icon = shape.icon;
                    return (
                      <button
                        key={`recent-${id}`}
                        type="button"
                        onClick={() => handlePick(shape)}
                        title={shape.label}
                        className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 flex flex-col items-center justify-center text-zinc-700 hover:text-[#635BFF] transition-all"
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filtered Shape Items */}
            <div>
              <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
                {activeCategory === "all" ? "All Shapes" : `${activeCategory} Shapes`} ({filteredShapes.length})
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {filteredShapes.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handlePick(s)}
                      title={s.label}
                      className="p-2 rounded-xl bg-zinc-50 hover:bg-white hover:border-zinc-300 border border-zinc-200/70 flex flex-col items-center justify-center gap-1 text-zinc-700 hover:text-[#635BFF] hover:shadow-2xs transition-all group relative"
                    >
                      <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span className="text-[9px] text-zinc-500 truncate w-full text-center leading-tight">
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

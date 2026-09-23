"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  StickyNote,
  Type,
  Shapes,
  FileUp,
  Waypoints,
} from "lucide-react";

export interface QuickActionButtonProps {
  onAddStickyNote: () => void;
  onAddText: () => void;
  onAddShape: () => void;
  onAddImageOrFile: () => void;
  onAddConnector: () => void;
}

export default function QuickActionButton({
  onAddStickyNote,
  onAddText,
  onAddShape,
  onAddImageOrFile,
  onAddConnector,
}: QuickActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("mousedown", handleOutside);
    }
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  const items = [
    { label: "Sticky Note", icon: StickyNote, action: onAddStickyNote, color: "text-amber-500" },
    { label: "Text", icon: Type, action: onAddText, color: "text-zinc-600 dark:text-zinc-300" },
    { label: "Shape", icon: Shapes, action: onAddShape, color: "text-[#635BFF]" },
    { label: "Connector", icon: Waypoints, action: onAddConnector, color: "text-sky-500" },
    { label: "File / Image", icon: FileUp, action: onAddImageOrFile, color: "text-emerald-500" },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none"
    >
      <div className="relative flex flex-col items-center">
        {/* Expanded Popover List */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="pointer-events-auto mb-2 w-44 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-40 text-xs"
            >
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer text-left font-medium"
                  >
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Quick Actions (+)"
          className={`pointer-events-auto w-9 h-9 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all cursor-pointer ${
            isOpen
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rotate-45"
              : "bg-[#635BFF] text-white hover:bg-[#5248E5] hover:scale-105 active:scale-95"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

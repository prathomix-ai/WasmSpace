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
  Image as ImageIcon,
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

  // Close on outside click
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

  // Keyboard shortcut listener (/ or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const items = [
    { label: "Sticky note", icon: StickyNote, action: onAddStickyNote, shortcut: "S", color: "text-[#FBBF24]" },
    { label: "Text", icon: Type, action: onAddText, shortcut: "T", color: "text-[#F4F4F5]" },
    { label: "Shape", icon: Shapes, action: onAddShape, shortcut: "R", color: "text-[#7C6CFF]" },
    { label: "Connector", icon: Waypoints, action: onAddConnector, shortcut: "C", color: "text-[#3B82F6]" },
    { label: "Image / File", icon: FileUp, action: onAddImageOrFile, shortcut: "F", color: "text-[#4ADE80]" },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 left-[68px] z-30 pointer-events-none select-none"
    >
      <div className="relative">
        {/* Expanded Popover List */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="pointer-events-auto absolute bottom-11 left-0 w-44 bg-[#1C1C1F] border border-[#2A2A2F] rounded-lg shadow-[0_10px_38px_-10px_rgba(0,0,0,0.5)] p-1 z-40 text-xs"
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
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#242428] text-[#F4F4F5] transition-colors cursor-pointer text-left font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <kbd className="text-[10px] font-mono text-[#71717A]">{item.shortcut}</kbd>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Small floating action trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Quick actions (/)"
          className={`pointer-events-auto w-8 h-8 rounded-md flex items-center justify-center border transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${
            isOpen
              ? "bg-[#7C6CFF] text-white border-[#7C6CFF] rotate-45"
              : "bg-[#171719] text-[#A1A1AA] hover:text-[#F4F4F5] border-[#2A2A2F] hover:bg-[#242428]"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

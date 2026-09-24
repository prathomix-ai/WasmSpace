"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layout,
  FileText,
  ListTodo,
  Workflow,
  Wand2,
  ArrowRight,
  Loader2,
  Check,
  Network,
  HelpCircle,
  X,
  CornerDownLeft,
} from "lucide-react";

export interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecutePrompt: (prompt: string, actionType?: string) => Promise<void> | void;
  isPro?: boolean;
  aiUsageCount?: number;
  onOpenUpgradeModal?: () => void;
}

export const SUGGESTED_COMMANDS = [
  {
    id: "summarize",
    label: "Summarize board",
    desc: "Extract key architectural decisions and takeaways",
    icon: FileText,
  },
  {
    id: "organize",
    label: "Organize ideas",
    desc: "Align nodes and tidy up spacing automatically",
    icon: Layout,
  },
  {
    id: "diagram",
    label: "Generate diagram",
    desc: "Synthesize microservices or event-driven system architecture",
    icon: Workflow,
  },
  {
    id: "related",
    label: "Find related ideas",
    desc: "Surface connected concepts across notes and shapes",
    icon: Network,
  },
  {
    id: "tasks",
    label: "Turn notes into tasks",
    desc: "Convert brainstormed sticky notes into structured action items",
    icon: ListTodo,
  },
  {
    id: "cleanup",
    label: "Clean up layout",
    desc: "Straighten connectors and resolve overlapping elements",
    icon: Wand2,
  },
  {
    id: "explain",
    label: "Explain this system",
    desc: "Deep-dive analysis of data flows and architecture topology",
    icon: HelpCircle,
  },
];

export default function AICommandPalette({
  isOpen,
  onClose,
  onExecutePrompt,
}: AICommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 40);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  const filteredCommands = SUGGESTED_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleRunCommand = async (cmdId: string, cmdLabel: string) => {
    setIsLoading(true);
    try {
      await onExecutePrompt(cmdLabel, cmdId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
        const selected = filteredCommands[selectedIndex];
        handleRunCommand(selected.id, selected.label);
      } else if (query.trim()) {
        handleRunCommand("custom", query.trim());
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          className="w-full max-w-lg bg-[#171719] border border-[#2A2A2F] rounded-xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden text-[#F4F4F5]"
        >
          {/* Top Search Input */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[#2A2A2F] bg-[#111113]">
            <Sparkles className="w-4 h-4 text-[#7C6CFF] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask your board anything..."
              className="flex-1 bg-transparent text-xs text-[#F4F4F5] placeholder-[#71717A] outline-none"
            />
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#7C6CFF] animate-spin shrink-0" />
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Suggested Commands List */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
              Suggested AI Actions
            </div>

            {filteredCommands.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#71717A]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[#242428] text-[#F4F4F5] font-mono">Enter</kbd> to ask &quot;{query}&quot;
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => handleRunCommand(cmd.id, cmd.label)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#242428] text-[#F4F4F5]"
                        : "text-[#A1A1AA] hover:bg-[#1C1C1F] hover:text-[#F4F4F5]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#7C6CFF]/20 text-[#7C6CFF]"
                            : "bg-[#111113] text-[#71717A]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{cmd.label}</div>
                        <div className="text-[11px] text-[#71717A] truncate">
                          {cmd.desc}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#71717A] shrink-0">
                        <span>Run</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 border-t border-[#2A2A2F] bg-[#111113] flex items-center justify-between text-[10px] text-[#71717A] font-mono">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

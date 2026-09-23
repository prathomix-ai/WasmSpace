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
  GitBranch,
  Presentation,
  CopyX,
  HelpCircle,
  Clock,
  Zap,
} from "lucide-react";
import ProBadge from "@/components/ProBadge";

export interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecutePrompt: (prompt: string, actionType?: string) => Promise<void> | void;
  isPro?: boolean;
  aiUsageCount?: number;
  onOpenUpgradeModal?: () => void;
}

export const SUGGESTED_ACTIONS = [
  {
    id: "summarize",
    label: "Summarize board",
    desc: "Extract key architectural decisions and takeaways",
    icon: FileText,
    isPro: false,
  },
  {
    id: "organize",
    label: "Organize board",
    desc: "Align nodes and tidy up spacing automatically",
    icon: Layout,
    isPro: false,
  },
  {
    id: "diagram",
    label: "Generate diagram",
    desc: "Synthesize microservices or event-driven system architecture",
    icon: Workflow,
    isPro: true,
  },
  {
    id: "related",
    label: "Find related ideas",
    desc: "Surface connected concepts across notes and shapes",
    icon: Network,
    isPro: false,
  },
  {
    id: "tasks",
    label: "Convert notes into tasks",
    desc: "Turn brainstormed sticky notes into structured action items",
    icon: ListTodo,
    isPro: false,
  },
  {
    id: "mindmap",
    label: "Create mind map",
    desc: "Branch central themes into structured visual topics",
    icon: GitBranch,
    isPro: false,
  },
  {
    id: "flowchart",
    label: "Create flowchart",
    desc: "Generate sequential logic flow with decisions and endpoints",
    icon: Workflow,
    isPro: false,
  },
  {
    id: "cleanup",
    label: "Clean up layout",
    desc: "Straighten connectors and resolve overlapping elements",
    icon: Wand2,
    isPro: false,
  },
  {
    id: "presentation",
    label: "Generate presentation",
    desc: "Arrange canvas frames into a sequential slide deck",
    icon: Presentation,
    isPro: true,
  },
  {
    id: "duplicates",
    label: "Find duplicate ideas",
    desc: "Identify redundant sticky notes and propose merges",
    icon: CopyX,
    isPro: false,
  },
  {
    id: "explain",
    label: "Explain selected content",
    desc: "Analyze selected diagrams or technical snippets",
    icon: HelpCircle,
    isPro: false,
  },
];

export default function AICommandPalette({
  isOpen,
  onClose,
  onExecutePrompt,
  isPro = false,
  aiUsageCount = 6,
  onOpenUpgradeModal,
}: AICommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const limit = isPro ? 150 : 15;
  const isLimitReached = aiUsageCount >= limit;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setStatusMessage(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (promptText: string, actionType?: string, actionIsPro?: boolean) => {
    if (!promptText.trim()) return;

    if (actionIsPro && !isPro) {
      onOpenUpgradeModal?.();
      return;
    }

    if (isLimitReached) {
      onOpenUpgradeModal?.();
      return;
    }

    setIsLoading(true);
    setStatusMessage("Board Brain is processing your canvas...");
    try {
      await onExecutePrompt(promptText, actionType);
      setStatusMessage("Done! Board updated.");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      setStatusMessage("Error executing AI command. Please try again.");
      setTimeout(() => setIsLoading(false), 1500);
    }
  };

  const filteredActions = SUGGESTED_ACTIONS.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/30 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200/90 shadow-[0_16px_50px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden text-zinc-900"
          >
            {/* Header / Title */}
            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900">
                    Ask your board anything
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Board Brain spatial assistant
                  </p>
                </div>
              </div>

              {/* 12-Hour Usage Tracker Pill */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-mono">
                  <Clock className="w-2.5 h-2.5 text-zinc-400" />
                  <span>
                    {aiUsageCount} / {limit} used
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-500">Resets in 7h 42m</span>
                </div>
                {!isPro && (
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="text-[10px] text-[#635BFF] hover:underline font-semibold"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-b border-zinc-100 flex items-center gap-2.5">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    handleSubmit(query);
                  }
                }}
                disabled={isLoading}
                placeholder="What would you like to do?"
                className="w-full text-sm bg-transparent outline-none placeholder-zinc-400 text-zinc-900"
              />
              <button
                type="button"
                onClick={() => query.trim() && handleSubmit(query)}
                disabled={!query.trim() || isLoading}
                className="p-1.5 rounded-lg bg-[#635BFF] hover:bg-[#5248E2] text-white disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Message or Limit Warning */}
            {isLimitReached && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>Your AI limit has been reached ({limit} actions). Resets in 7h 42m.</span>
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="font-semibold text-amber-900 underline hover:text-black"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

            {statusMessage && (
              <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 text-indigo-700 text-xs flex items-center gap-2">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#635BFF]" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Suggested Actions List */}
            <div className="p-2 max-h-72 overflow-y-auto space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Suggested Actions
              </div>

              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSubmit(action.label, action.id, action.isPro)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 group-hover:bg-white border border-zinc-200/60 flex items-center justify-center text-zinc-600 group-hover:text-[#635BFF] transition-colors shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-zinc-800 group-hover:text-zinc-900">
                            {action.label}
                          </span>
                          {action.isPro && <ProBadge />}
                        </div>
                        <span className="text-[11px] text-zinc-500 block truncate">
                          {action.desc}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Press Esc to close</span>
              <span>Cmd+K</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

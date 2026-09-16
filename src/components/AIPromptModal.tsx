"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Sparkles,
  X,
  Copy,
  Check,
  Send,
  ArrowUpRight,
  Layers,
  Database,
  Cloud,
  Terminal,
  Cpu,
  Shield,
  Zap,
  Globe,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  AI_PROMPT_LIBRARY,
  AI_PROMPT_CATEGORIES,
  AIPromptItem,
} from "@/lib/aiPromptLibrary";

export interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
  onGenerateArchitecture?: (prompt: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
  "Cloud Architecture": <Cloud className="w-3.5 h-3.5 text-blue-400" />,
  Microservices: <Layers className="w-3.5 h-3.5 text-cyan-400" />,
  Databases: <Database className="w-3.5 h-3.5 text-emerald-400" />,
  DevOps: <Terminal className="w-3.5 h-3.5 text-amber-400" />,
  Web3: <Globe className="w-3.5 h-3.5 text-purple-400" />,
  "AI & ML": <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
  Cybersecurity: <Shield className="w-3.5 h-3.5 text-rose-400" />,
  "High-Scale": <Activity className="w-3.5 h-3.5 text-orange-400" />,
  Serverless: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
  Fintech: <DollarSign className="w-3.5 h-3.5 text-emerald-300" />,
};

// Popular Quick Suggestion Chips
const POPULAR_CHIPS = [
  "Generate a scalable AWS microservices architecture with API Gateway and Lambda.",
  "Design a high-availability PostgreSQL database cluster with Redis caching.",
  "Create an event-driven Kafka streaming data pipeline.",
  "High-throughput vector RAG pipeline with Google Gemini and Pinecone.",
  "Zero-Trust BeyondCorp corporate security topology with Cloudflare & Okta.",
];

export default function AIPromptModal({
  isOpen,
  onClose,
  onSelectPrompt,
  onGenerateArchitecture,
}: AIPromptModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [customInput, setCustomInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered prompts based on category and search query
  const filteredPrompts = useMemo(() => {
    return AI_PROMPT_LIBRARY.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.prompt.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleCopy = (item: AIPromptItem) => {
    navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleChipClick = (promptText: string) => {
    setCustomInput(promptText);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    if (onGenerateArchitecture) {
      onGenerateArchitecture(customInput);
    } else if (onSelectPrompt) {
      onSelectPrompt(customInput);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] bg-[#0d0d11]/95 border border-white/10 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] overflow-hidden text-white font-sans">
        {/* Top Accent Gradient Border */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121217]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  MasmSpace AI Architecture Prompt Explorer
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  100+ Commands
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Instantly synthesize enterprise system topologies, microservices, and databases
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Explorer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Interactive Prompt Input with Suggestion Chips ── */}
        <div className="p-6 pb-3 border-b border-white/5 bg-[#14141a]/40">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                placeholder="Ask MasmSpace AI (e.g. Generate a scalable AWS microservices architecture with Kafka)..."
                className="w-full bg-[#18181f]/90 border border-white/10 focus:border-cyan-400/70 rounded-xl px-4 py-3.5 pl-11 pr-28 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-inner transition-all"
              />
              <Sparkles className="w-4 h-4 text-cyan-400 absolute left-4 pointer-events-none" />

              <button
                type="submit"
                disabled={!customInput.trim()}
                className="absolute right-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
              >
                <span>Synthesize</span>
                <Send className="w-3 h-3 text-black" />
              </button>
            </div>

            {/* Suggestion Chips (Visible on input focus or when input is empty) */}
            {(isInputFocused || !customInput) && (
              <div className="mt-3.5 flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-cyan-400/90 font-medium">
                  ✨ Instant Architecture Suggestion Chips (Click to fill):
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-lg px-3 py-1.5 text-xs text-zinc-300 hover:text-white cursor-pointer transition-all text-left flex items-center gap-1.5 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 group-hover:bg-cyan-400 transition-colors" />
                      <span className="line-clamp-1">{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Category Tabs & Search Bar ── */}
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5 bg-[#0f0f14]/50">
          {/* Scrollable Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
            {AI_PROMPT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      : "bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter 100+ commands..."
              className="w-full bg-[#18181f]/80 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* ── Prompts Grid Container ── */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 custom-scrollbar">
          {filteredPrompts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-zinc-500">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No architecture prompts found.</p>
              <p className="text-xs text-zinc-600 mt-1">
                Try searching for "Kafka", "AWS", "PostgreSQL", or "Vector RAG".
              </p>
            </div>
          ) : (
            filteredPrompts.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-xl bg-[#18181f]/60 hover:bg-[#18181f]/90 border border-white/5 hover:border-cyan-400/40 p-4 transition-all duration-200 shadow-md hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {item.complexity}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-cyan-300 transition-colors"
                        title="Copy Prompt"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setCustomInput(item.prompt);
                          if (onGenerateArchitecture) {
                            onGenerateArchitecture(item.prompt);
                            onClose();
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-300 transition-colors"
                        title="Load into Canvas"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-zinc-100 mb-1.5 group-hover:text-cyan-200 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-3 line-clamp-2">
                    {item.prompt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setCustomInput(item.prompt);
                      if (onGenerateArchitecture) {
                        onGenerateArchitecture(item.prompt);
                        onClose();
                      }
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    <span>Synthesize</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#121217]/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Library Status: Ready</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-300">{filteredPrompts.length} Prompts available</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors border border-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

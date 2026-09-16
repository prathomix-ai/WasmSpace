"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  X,
  Send,
  Search,
  Copy,
  Check,
  Zap,
  Crown,
  ChevronRight,
  RefreshCw,
  Cpu,
  Layers,
  Cloud,
  Database,
  Terminal,
  Shield,
  Activity,
  Globe,
  DollarSign,
  Info,
} from "lucide-react";
import {
  AI_PROMPT_LIBRARY,
  AI_PROMPT_CATEGORIES,
  AIPromptItem,
} from "@/lib/aiPromptLibrary";

export interface QuotaState {
  tier: "free" | "pro" | "enterprise";
  isPro: boolean;
  actionsUsed: number;
  actionLimit: number;
  resetAt?: string;
  displayQuota: string;
}

interface AICoPilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateArchitecture: (promptText: string) => void;
  onOpenUpgradeModal?: () => void;
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

const POPULAR_QUICK_CHIPS = [
  "Scalable AWS microservices with Lambda & SQS",
  "PostgreSQL cluster with Redis caching & Envoy",
  "Event-driven Kafka streaming data pipeline",
  "AI Vector RAG pipeline with Gemini & Pinecone",
];

export default function AICoPilotDrawer({
  isOpen,
  onClose,
  onGenerateArchitecture,
  onOpenUpgradeModal,
}: AICoPilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "prompts">("chat");
  const [promptInput, setPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quota state initialized with requested default tier logic ("12/15 Free Limits")
  const [quota, setQuota] = useState<QuotaState>({
    tier: "free",
    isPro: false,
    actionsUsed: 12,
    actionLimit: 15,
    displayQuota: "12/15 Free Limits",
  });

  // Fetch or sync quota from backend
  const refreshQuota = async () => {
    try {
      const res = await fetch("/api/generate?action=quota", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const isPro = Boolean(data.isPro || data.tier === "pro" || data.tier === "enterprise");
        const actionsUsed = typeof data.used === "number" ? data.used : 12;
        const actionLimit = isPro ? 300 : 15;
        const displayQuota = isPro
          ? `${actionsUsed}/300 Daily Pro Uses`
          : `${actionsUsed}/15 Free Limits`;

        setQuota({
          tier: isPro ? "pro" : "free",
          isPro,
          actionsUsed,
          actionLimit,
          resetAt: data.resetAt,
          displayQuota,
        });
      }
    } catch {
      // Keep state defaults
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshQuota();
    }
  }, [isOpen]);

  // Filter 100+ prompt library
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

  // Category counts calculation for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: AI_PROMPT_LIBRARY.length };
    AI_PROMPT_LIBRARY.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, []);

  const handleCopyPrompt = (item: AIPromptItem) => {
    navigator.clipboard.writeText(item.prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectPrompt = (promptText: string) => {
    setPromptInput(promptText);
    setActiveTab("chat");
  };

  const handleGenerate = (text: string) => {
    if (!text.trim() || isGenerating) return;

    // Check quota limit locally before proceeding
    if (!quota.isPro && quota.actionsUsed >= 15) {
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }
    if (quota.isPro && quota.actionsUsed >= 300) {
      alert("You have reached your 300 daily PRO uses. Quota resets in 24 hours.");
      return;
    }

    setIsGenerating(true);

    // Optimistically update quota
    const newUsed = quota.actionsUsed + 1;
    setQuota((prev) => ({
      ...prev,
      actionsUsed: newUsed,
      displayQuota: prev.isPro
        ? `${newUsed}/300 Daily Pro Uses`
        : `${newUsed}/15 Free Limits`,
    }));

    onGenerateArchitecture(text);

    setTimeout(() => {
      setIsGenerating(false);
      setPromptInput("");
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerate(promptInput);
  };

  if (!isOpen) return null;

  const quotaPercent = Math.min(
    100,
    Math.round((quota.actionsUsed / quota.actionLimit) * 100)
  );

  return (
    <div className="fixed inset-y-0 right-0 z-[60] w-full sm:w-[460px] bg-[#09090b]/95 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8),-10px_0_30px_rgba(6,182,212,0.1)] flex flex-col font-sans text-white animate-in slide-in-from-right duration-300">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121217]/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">
                AI Co-Pilot
              </h2>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                  quota.isPro
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                }`}
              >
                {quota.isPro ? "PRO Tier" : "Free Plan"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              Topology Synthesis &amp; Prompt Library
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close AI Co-Pilot (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Quota HUD Card (Displays 12/15 Free Uses or 45/300 Daily Pro Uses) ── */}
      <div className="p-4 mx-4 mt-4 rounded-2xl bg-[#121217]/90 border border-white/10 shadow-lg select-none">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-zinc-300">
              AI Generation Quota
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            {quota.displayQuota}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              quotaPercent >= 90
                ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                : "bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2.5 text-[11px] text-zinc-400">
          <span>
            {quota.isPro
              ? "Resets every 24 hours"
              : "15 lifetime free generations"}
          </span>
          {!quota.isPro && (
            <button
              onClick={onOpenUpgradeModal}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors"
            >
              <Crown className="w-3 h-3 text-amber-400" />
              <span>Unlock 300/Day</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Selector ── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "chat"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generate / Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "prompts"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>100+ Prompt Library</span>
        </button>
      </div>

      {/* ── Tab Content: Chat & Direct Prompting ── */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
          {/* Quick Blueprint Chips Grouped by Category */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Select Instant Architecture Blueprint:
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("prompts")}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                100+ Library →
              </button>
            </div>

            {/* Category Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {AI_PROMPT_CATEGORIES.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 ${
                    selectedCategory === cat
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                      : "bg-white/5 text-zinc-400 hover:text-white border border-transparent"
                  }`}
                >
                  {CATEGORY_ICONS[cat]}
                  <span>{cat}</span>
                </button>
              ))}
            </div>

            {/* Clickable Quick Prompt Chips */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {(selectedCategory === "All"
                ? POPULAR_QUICK_CHIPS.map((chip, idx) => ({ id: `quick-${idx}`, prompt: chip, title: chip }))
                : filteredPrompts.slice(0, 5)
              ).map((chipItem) => (
                <button
                  key={chipItem.id}
                  type="button"
                  onClick={() => setPromptInput(chipItem.prompt)}
                  className="text-left text-xs text-zinc-300 hover:text-white bg-[#141419]/80 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-400/40 rounded-xl px-3.5 py-2.5 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="line-clamp-1">{chipItem.prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
                </button>
              ))}
            </div>

            <div className="mt-2 p-3.5 rounded-xl bg-gradient-to-br from-cyan-950/20 via-[#0d0d12] to-indigo-950/20 border border-cyan-400/20 text-xs text-zinc-300 leading-relaxed">
              <p className="font-semibold text-cyan-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Enterprise Synthesis Engine
              </p>
              Click any chip above or describe your cloud, database, or microservice stack below. The AI will synthesize connected nodes, live metrics, and edge topologies directly on your canvas.
            </div>
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-white/10">
            <div className="relative flex flex-col rounded-2xl bg-[#14141a] border border-white/10 focus-within:border-cyan-400/60 shadow-xl transition-all">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
                placeholder="Describe your system architecture (or click any prompt chip above)..."
                className="w-full bg-transparent px-3.5 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-white/5">
                <span className="text-[10px] font-mono text-zinc-500">
                  Press Enter to synthesize
                </span>

                <button
                  type="submit"
                  disabled={!promptInput.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab Content: 100+ Prompt Library ── */}
      {activeTab === "prompts" && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 100+ architecture prompts..."
              className="w-full bg-[#14141a] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/60"
            />
          </div>

          {/* Categories Pill Scroll with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
            {AI_PROMPT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                    : "bg-white/5 text-zinc-400 hover:text-white border border-transparent"
                }`}
              >
                {CATEGORY_ICONS[cat] || <Sparkles className="w-3 h-3" />}
                <span>{cat}</span>
                <span className="text-[9px] opacity-60">({categoryCounts[cat] ?? 0})</span>
              </button>
            ))}
          </div>

          {/* Scrollable Prompts List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredPrompts.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#121217]/90 border border-white/5 hover:border-cyan-400/30 transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                    {item.category}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                  {item.prompt}
                </p>

                {/* Clickable Technology Tag Chips */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        title={`Filter by tag: ${tag}`}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-cyan-500/15 text-zinc-400 hover:text-cyan-300 border border-white/5 hover:border-cyan-400/30 transition-colors cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(item)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPrompt(item.prompt)}
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                      title="Insert prompt into chat box"
                    >
                      <span>Use Prompt</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerate(item.prompt)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Synthesize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

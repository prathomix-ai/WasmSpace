"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  X,
  Send,
  Search,
  Copy,
  Check,
  Zap,
  Crown,
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
  Bot,
  User,
  Wand2,
  Star,
} from "lucide-react";
import {
  AI_PROMPT_LIBRARY,
  AI_PROMPT_CATEGORIES,
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

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isArchitecture?: boolean;
  originalPrompt?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  All: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
  Favorites: <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />,
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

// ── Daily-Use Quick Featured Commands ──
const POPULAR_QUICK_CHIPS = [
  "Design a scalable Kubernetes cluster topology",
  "Map out a Stripe webhook payment flow",
  "Create a Redis Pub/Sub caching architecture",
  "What is a reverse proxy?",
  "Scalable AWS microservices with Lambda & SQS",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat message thread state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content:
        "👋 Welcome! I am **MIX AI**, your Principal Cloud & Architecture Partner.\n\nAsk me any deep technical question (e.g. *\"What is a reverse proxy?\"*, *\"Explain Kafka consumer groups\"*) or select an architecture command to synthesize connected topologies directly on your canvas.",
      timestamp: "Just now",
    },
  ]);

  // Quota state
  const [quota, setQuota] = useState<QuotaState>({
    tier: "free",
    isPro: false,
    actionsUsed: 12,
    actionLimit: 15,
    displayQuota: "12/15 Free Limits",
  });

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // ── Favorites System: State & localStorage Sync ──
  const [favoritedPromptIds, setFavoritedPromptIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored =
        localStorage.getItem("favorited_prompt_ids") ||
        localStorage.getItem("masmspace_favorite_prompts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFavoritedPromptIds((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem("favorited_prompt_ids", JSON.stringify(next));
        localStorage.setItem("masmspace_favorite_prompts", JSON.stringify(next));
      } catch (err) {
        console.error("Failed to save favorited prompts:", err);
      }
      return next;
    });
  };

  // Filter 100+ prompt library and PIN FAVORITES TO ABSOLUTE TOP
  const filteredPrompts = useMemo(() => {
    const list = AI_PROMPT_LIBRARY.filter((item) => {
      const matchesCategory =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Favorites"
          ? favoritedPromptIds.includes(item.id)
          : item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.prompt.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });

    // CRITICAL SORTING:
    // Apply a .sort() function so that ALL favorited prompts are pinned to
    // the absolute TOP of the list, regardless of their original category.
    return [...list].sort((a, b) => {
      const aFav = favoritedPromptIds.includes(a.id);
      const bFav = favoritedPromptIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [searchQuery, selectedCategory, favoritedPromptIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: AI_PROMPT_LIBRARY.length,
      Favorites: favoritedPromptIds.length,
    };
    AI_PROMPT_LIBRARY.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [favoritedPromptIds]);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectPrompt = (promptText: string) => {
    setPromptInput(promptText);
    setActiveTab("chat");
  };

  /**
   * Main conversational handler:
   * Handles technical Q&A via LLM endpoint (/api/chat) with Markdown rendering
   * and triggers architecture node synthesis if requested.
   */
  const handleSendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isGenerating) return;

    // Check quota locally
    if (!quota.isPro && quota.actionsUsed >= 15) {
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }
    if (quota.isPro && quota.actionsUsed >= 300) {
      alert("You have reached your 300 daily PRO uses. Quota resets in 24 hours.");
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `asst-${Date.now()}`;

    // Detect architecture intent
    const lower = text.toLowerCase();
    const isArchRequest =
      lower.startsWith("design") ||
      lower.startsWith("map out") ||
      lower.startsWith("create a") ||
      lower.startsWith("synthesize") ||
      lower.includes("topology") ||
      lower.includes("architecture") ||
      lower.includes("cluster") ||
      lower.includes("workflow") ||
      lower.includes("flow");

    // Append user message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: text,
        timestamp: timeStr,
        isArchitecture: isArchRequest,
      },
    ]);

    setPromptInput("");
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

    try {
      // 1. If it has architecture intent, synthesize blueprint on the React Flow canvas
      if (isArchRequest) {
        onGenerateArchitecture(text);
      }

      // 2. Fetch technical conversational response from LLM endpoint (/api/chat)
      const systemPrompt = isArchRequest
        ? "You are MIX AI, a Principal Systems & Cloud Architect. The user requested an architecture blueprint. Provide a clear, technical architectural breakdown in clean Markdown, highlighting Key Components, Ingress/Egress data flow, Security & Resilience, and Recommended Metrics."
        : "You are MIX AI, an expert Principal Full-Stack Developer and Cloud Architect. Provide crisp, structured, deeply informative technical answers in Markdown format with code snippets, architecture diagrams (ASCII/Markdown), trade-offs, and best practices.";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          systemPrompt,
          mode: "chat",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}: Failed to reach AI endpoint`);
      }

      const data = await res.json();
      const answer = data.text || "I processed your request. See canvas topology.";

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isArchitecture: isArchRequest,
          originalPrompt: text,
        },
      ]);
    } catch (err: any) {
      console.error("[MIX Chatbot] Query error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: `⚠️ **AI Engine Notice**: ${err.message || "Failed to contact LLM backend. Please check your network or try again."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isArchitecture: isArchRequest,
          originalPrompt: text,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(promptInput);
  };

  if (!isOpen) return null;

  const quotaPercent = Math.min(
    100,
    Math.round((quota.actionsUsed / quota.actionLimit) * 100)
  );

  return (
    <div className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[480px] bg-[#09090b]/95 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.9),-10px_0_30px_rgba(6,182,212,0.12)] flex flex-col font-sans text-white animate-in slide-in-from-right duration-300 pointer-events-auto">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#121217]/80">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <Bot className="w-5 h-5 text-cyan-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-black animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>MIX Chatbot</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                  v2.0
                </span>
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
              Conversational Architect &amp; Node Synthesizer
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close MIX Chatbot (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Quota HUD Card ── */}
      <div className="p-3.5 mx-4 mt-3 rounded-2xl bg-[#121217]/90 border border-white/10 shadow-lg select-none">
        <div className="flex items-center justify-between mb-1.5">
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
        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              quotaPercent >= 90
                ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                : "bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
          <span>
            {quota.isPro ? "Resets every 24 hours" : "15 lifetime free generations"}
          </span>
          {!quota.isPro && onOpenUpgradeModal && (
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
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "chat"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Chat &amp; Synthesis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prompts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "prompts"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>100+ Prompt Library</span>
        </button>
      </div>

      {/* ── Tab 1: Conversational Chat & Synthesis ── */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-4">
          {/* Daily-Use Quick Command Chips */}
          <div className="py-2 border-b border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Featured Quick Commands:
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("prompts")}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                All 100+ →
              </button>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {POPULAR_QUICK_CHIPS.map((chip, idx) => {
                const matchedItem = AI_PROMPT_LIBRARY.find(
                  (p) =>
                    p.prompt.toLowerCase() === chip.toLowerCase() ||
                    p.title.toLowerCase() === chip.toLowerCase()
                );
                const chipId = matchedItem ? matchedItem.id : `quick-chip-${idx}`;
                const isFav = favoritedPromptIds.includes(chipId);

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono bg-[#181820] hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all shrink-0 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleSendMessage(chip)}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                      <span className="whitespace-nowrap">{chip}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(chipId, e)}
                      className={`p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                        isFav
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-zinc-500 hover:text-amber-400 opacity-60 group-hover:opacity-100"
                      }`}
                      title={isFav ? "Favorited (Pinned to top)" : "Add to favorites"}
                    >
                      <Star
                        className={`w-2.5 h-2.5 ${
                          isFav ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat Messages Scroll Container */}
          <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 mb-1 text-[10px] font-mono ${
                    msg.role === "user" ? "text-cyan-400" : "text-zinc-400"
                  }`}
                >
                  {msg.role === "user" ? (
                    <>
                      <span>You</span>
                      <User className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-cyan-400" />
                      <span>MIX AI</span>
                    </>
                  )}
                  <span className="text-zinc-500">• {msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "bg-[#14141b] text-zinc-200 border border-white/10 shadow-lg"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="markdown-chat-body prose prose-invert max-w-none text-xs leading-relaxed space-y-2">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-zinc-200">{children}</p>,
                          h1: ({ children }) => <h1 className="text-sm font-bold text-white mt-2 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xs font-bold text-cyan-300 mt-2 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs font-semibold text-indigo-300 mt-1.5 mb-1">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-zinc-300">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-zinc-300">{children}</ol>,
                          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono text-[11px]">
                                {children}
                              </code>
                            ) : (
                              <code className="block p-3 rounded-xl bg-black/70 border border-white/10 overflow-x-auto text-[11px] font-mono text-cyan-200 my-2">
                                {children}
                              </code>
                            );
                          },
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-cyan-400 pl-3 py-1 my-2 text-zinc-400 italic bg-white/[0.02]">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Actions under Assistant Message */}
                  {msg.role === "assistant" && msg.id !== "welcome-msg" && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>

                      {msg.originalPrompt && (
                        <button
                          type="button"
                          onClick={() => onGenerateArchitecture(msg.originalPrompt!)}
                          className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer ml-auto"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Synthesize on Canvas</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-start gap-2 text-xs text-zinc-400 bg-[#14141b] border border-cyan-500/30 rounded-2xl px-4 py-3 animate-pulse">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-cyan-300">MIX AI is thinking…</span>
                  <p className="text-[11px] text-zinc-400">
                    Consulting load-balanced LLM engine &amp; topology synthesizer.
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-white/10">
            <div className="relative flex flex-col rounded-2xl bg-[#14141a] border border-white/10 focus-within:border-cyan-400/70 shadow-xl transition-all">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={2}
                placeholder="Ask technical question or describe architecture (e.g. 'What is a reverse proxy?')..."
                className="w-full bg-transparent px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />

              <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-white/5">
                <span className="text-[10px] font-mono text-zinc-500">
                  Enter to send • Shift+Enter for new line
                </span>

                <button
                  type="submit"
                  disabled={!promptInput.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Thinking…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Tab 2: 100+ Prompt Library ── */}
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

          {/* Categories Pill Scroll with Counts (including Favorites) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
            {["All", "Favorites", ...AI_PROMPT_CATEGORIES.filter((c) => c !== "All")].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
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

          {/* Scrollable Prompts List with Pinned Favorites at the Top */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredPrompts.map((item) => {
              const isFavorited = favoritedPromptIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2 group ${
                    isFavorited
                      ? "bg-[#181613]/95 border-amber-400/35 shadow-[0_0_20px_rgba(251,191,36,0.08)]"
                      : "bg-[#121217]/90 border-white/5 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Star Favorite Pinning Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                          isFavorited
                            ? "text-amber-400 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                            : "text-zinc-500 hover:text-amber-300 hover:bg-white/5 border border-transparent"
                        }`}
                        title={
                          isFavorited
                            ? "Pinned to Top (Click to unpin)"
                            : "Star to pin to top of library"
                        }
                      >
                        <Star
                          className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                            isFavorited ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                      </button>

                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFavorited && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          Pinned
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                    {item.prompt}
                  </p>

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
                      onClick={() => handleCopyText(item.id, item.prompt)}
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
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
                      className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Insert prompt into chat box"
                    >
                      <span>Use Prompt</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("chat");
                      handleSendMessage(item.prompt);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-[11px] font-semibold transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Synthesize</span>
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}

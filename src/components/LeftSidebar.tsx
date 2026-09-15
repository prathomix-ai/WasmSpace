"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv,
  Search,
  Brain,
  Share2,
  Code2,
  Bot,
  FolderClosed,
  Camera,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Briefcase,
  PenTool,
  StickyNote,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  Database,
  Maximize2,
  CloudUpload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LeftSidebarProps {
  boardTitle: string;
  onBoardTitleChange: (title: string) => void;
  // Core Action Handlers
  onPresentClick: () => void;
  onSearchClick: () => void;
  onBoardBrainClick: () => void;
  onSaveAndIndex?: () => void;
  isIndexing?: boolean;
  onShareClick: () => void;
  onCodeStudioClick: () => void;
  isCodeOpen?: boolean;
  onVoiceClick: () => void;
  isVoiceListening?: boolean;
  // Secondary Tools Handlers
  onToggleExplorer: () => void;
  isExplorerOpen?: boolean;
  onTakeScreenshot: () => void;
  onOpenSettings: () => void;
  onOpenProModal: () => void;
  isSummarising?: boolean;
  isProUser?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  // Full Screen / Hide Sidebar
  onToggleSidebarVisibility?: () => void;
  isSidebarVisible?: boolean;
  // Cloud Save
  onSaveToCloud?: () => void;
  isSavingCloud?: boolean;
  // Executive Focus Mode
  isExecutiveMode?: boolean;
  onToggleExecutiveMode?: () => void;
  onSelectPenTool?: () => void;
  onAddStickyNote?: () => void;
}

interface TooltipState {
  text: string;
  subtext?: string;
  isPro?: boolean;
  rect: DOMRect;
}

export function LeftSidebar({
  boardTitle,
  onBoardTitleChange,
  onPresentClick,
  onSearchClick,
  onBoardBrainClick,
  onSaveAndIndex,
  isIndexing = false,
  onShareClick,
  onCodeStudioClick,
  isCodeOpen = false,
  onVoiceClick,
  isVoiceListening = false,
  onToggleExplorer,
  isExplorerOpen = false,
  onTakeScreenshot,
  onOpenSettings,
  onOpenProModal,
  isSummarising = false,
  isProUser = false,
  isCollapsed,
  onToggleCollapse,
  onToggleSidebarVisibility,
  isSidebarVisible = true,
  onSaveToCloud,
  isSavingCloud = false,
  isExecutiveMode = false,
  onToggleExecutiveMode,
  onSelectPenTool,
  onAddStickyNote,
}: LeftSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProSubscription, setHasProSubscription] = useState(false);
  const [mounted, setMounted] = useState(false);

  // PRO Gating Feedback Toast
  const [proToast, setProToast] = useState<string | null>(null);

  // Floating Portal Tooltip State (immune to overflow-y-auto clipping)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    async function checkSubscription() {
      // 1. Fast initial sync from cached local storage session
      try {
        const stored =
          localStorage.getItem("masmspace_current_user") ||
          localStorage.getItem("wasmspace_current_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const email = parsed?.email?.toLowerCase();
          const role = parsed?.role?.toLowerCase();
          const sub = parsed?.subscription_status?.toLowerCase();

          if (email === "admin@prathomix.tech" || role === "admin") {
            setIsAdmin(true);
            setHasProSubscription(true);
          } else if (role === "pro" || sub === "pro" || sub === "active") {
            setHasProSubscription(true);
          }
        }
      } catch {}

      // 2. Fetch live subscription status & role directly from Supabase
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const email = user.email?.toLowerCase();
          if (email === "admin@prathomix.tech") {
            setIsAdmin(true);
            setHasProSubscription(true);
          }

          // Check user metadata
          const metaRole = user.user_metadata?.role?.toLowerCase();
          const metaSub = user.user_metadata?.subscription_status?.toLowerCase();
          if (metaRole === "pro" || metaRole === "admin" || metaSub === "pro" || metaSub === "active") {
            setHasProSubscription(true);
          }

          // Check public.profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, subscription_status")
            .eq("id", user.id)
            .maybeSingle();

          if (profile && isMounted) {
            const role = profile.role?.toLowerCase();
            const sub = profile.subscription_status?.toLowerCase();
            if (role === "admin") {
              setIsAdmin(true);
              setHasProSubscription(true);
            } else if (role === "pro" || sub === "pro" || sub === "active") {
              setHasProSubscription(true);
            }
          }
        }
      } catch (err) {
        console.warn("[LeftSidebar] Supabase subscription check notice:", err);
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, []);

  // Effective PRO status combines props with database subscription state
  const effectiveIsPro = Boolean(isProUser || hasProSubscription);

  /**
   * Centralized PRO Action Guard:
   * Strictly verifies tier status before executing any gated feature.
   * Free users receive a non-blocking toast and an upgrade modal trigger.
   */
  const handleGatedAction = (featureName: string, actionFn?: () => void) => {
    if (!effectiveIsPro) {
      setProToast(`Upgrade to PRO: ${featureName} is exclusive to PRO subscribers.`);
      setTimeout(() => setProToast(null), 4000);
      onOpenProModal();
      return;
    }
    actionFn?.();
  };

  /**
   * Tooltip Helpers:
   * Displays floating tooltips via React Portal at z-[99999], completely
   * avoiding clipping by `overflow-y-auto` or viewport boundaries.
   */
  const showTooltip = (text: string, element: HTMLElement, opts?: { subtext?: string; isPro?: boolean }) => {
    if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    const rect = element.getBoundingClientRect();
    setTooltip({
      text,
      subtext: opts?.subtext,
      isPro: opts?.isPro,
      rect,
    });
  };

  const hideTooltip = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 50);
  };

  // Glowing gradient PRO badge
  const ProBadge = () => (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)] shrink-0 font-mono leading-none select-none border-none">
      PRO
    </span>
  );

  return (
    <>
      {/* ── 1. Desktop & Tablet Sidebar Container with Smooth Distraction-Free Transition ── */}
      <aside
        id="app-left-sidebar"
        data-tour="sidebar"
        className={`hidden md:flex flex-col flex-shrink-0 relative z-50 overflow-y-auto custom-scrollbar my-3 ml-3 h-[calc(100vh-1.5rem)] bg-[#09090b]/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.7),0_0_80px_rgba(6,182,212,0.04)] select-none transition-all duration-300 ease-in-out ${
          !isSidebarVisible
            ? "-translate-x-[calc(100%+2rem)] opacity-0 pointer-events-none !w-0 !m-0 !p-0 overflow-hidden"
            : isCollapsed
            ? "translate-x-0 opacity-100 w-[76px] p-2.5 gap-3"
            : "translate-x-0 opacity-100 w-64 p-3.5 gap-3.5"
        }`}
      >
        {/* ── 1. Header: Logo & Collapse Button ── */}
        <div
          className={`flex items-center shrink-0 ${
            isCollapsed ? "flex-col justify-center gap-2" : "justify-between w-full px-1"
          }`}
        >
          {!isCollapsed ? (
            <>
              <Link
                href="/"
                className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
                onMouseEnter={(e) => showTooltip("MasmSpace Whiteboard OS", e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300">
                  <Image
                    src="/masmspace-logo.png"
                    alt="MasmSpace Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  />
                </div>
                <span className="font-bold text-white tracking-tight font-sans text-base">
                  MasmSpace
                </span>
              </Link>

              <div className="flex items-center gap-1">
                {onToggleSidebarVisibility && (
                  <button
                    type="button"
                    onClick={onToggleSidebarVisibility}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                    aria-label="Full Screen Focus Mode"
                    onMouseEnter={(e) =>
                      showTooltip("Full Screen Focus (Ctrl+\\)", e.currentTarget, {
                        subtext: "Hide sidebar for 100vw canvas",
                      })
                    }
                    onMouseLeave={hideTooltip}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/5"
                  aria-label="Collapse Sidebar"
                  onMouseEnter={(e) => showTooltip("Collapse Sidebar", e.currentTarget)}
                  onMouseLeave={hideTooltip}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/"
                className="p-1 rounded-xl hover:bg-white/5 transition-colors group"
                onMouseEnter={(e) => showTooltip("MasmSpace Whiteboard OS", e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300">
                  <Image
                    src="/masmspace-logo.png"
                    alt="MasmSpace Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  />
                </div>
              </Link>
              {onToggleSidebarVisibility && (
                <button
                  type="button"
                  onClick={onToggleSidebarVisibility}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                  aria-label="Full Screen Focus Mode"
                  onMouseEnter={(e) =>
                    showTooltip("Full Screen Focus (Ctrl+\\)", e.currentTarget, {
                      subtext: "100vw distraction-free canvas",
                    })
                  }
                  onMouseLeave={hideTooltip}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onToggleCollapse}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-white/5"
                aria-label="Expand Sidebar"
                onMouseEnter={(e) => showTooltip("Expand Sidebar", e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── 2. Session Box: Board Title Input (Visible when expanded) ── */}
        {!isCollapsed && (
          <div className="bg-[#09090b]/40 border border-white/5 rounded-xl px-3 py-2.5 text-sm shrink-0 focus-within:border-cyan-400/50 focus-within:shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all">
            <input
              id="sidebar-board-title"
              type="text"
              value={boardTitle}
              onChange={(e) => onBoardTitleChange(e.target.value)}
              placeholder="Untitled Session"
              maxLength={50}
              className="w-full bg-transparent border-none outline-none text-sm font-medium text-zinc-200 placeholder-zinc-500 truncate"
              spellCheck={false}
              onMouseEnter={(e) => showTooltip("Rename Session", e.currentTarget)}
              onMouseLeave={hideTooltip}
            />
          </div>
        )}

        {/* ── 3. Navigation Content ── */}
        {isExecutiveMode ? (
          /* ── Executive Focus Mode: Clean, Distraction-Free Suite ── */
          <div className="bg-[#09090b]/60 backdrop-blur-md border border-white/10 rounded-2xl py-4 px-2 flex flex-col gap-2">
            <div
              className={`rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 ${
                isCollapsed ? "p-2 flex justify-center" : "px-3 py-2.5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-amber-400 shrink-0" />
                {!isCollapsed && (
                  <div>
                    <div className="text-xs font-bold tracking-tight">Executive Focus</div>
                    <div className="text-[10px] text-amber-300/80">Distraction-free</div>
                  </div>
                )}
              </div>
            </div>

            {/* Pen / Freedraw */}
            <button
              type="button"
              id="sidebar-btn-exec-pen"
              onClick={onSelectPenTool}
              className={`flex items-center w-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("Draw Pen", e.currentTarget, {
                  subtext: "Natural freehand sketching",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <PenTool className="w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all shrink-0" />
                {!isCollapsed && <span>Draw Pen</span>}
              </div>
            </button>

            {/* Sticky Notes */}
            <button
              type="button"
              id="sidebar-btn-exec-sticky"
              onClick={onAddStickyNote}
              className={`flex items-center w-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("Sticky Note", e.currentTarget, {
                  subtext: "Place note card on canvas",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <StickyNote className="w-5 h-5 text-yellow-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] transition-all shrink-0" />
                {!isCollapsed && <span>Sticky Note</span>}
              </div>
            </button>

            {/* Laser Presentation Pointer (GATED TO PRO) */}
            <button
              type="button"
              id="sidebar-btn-exec-present"
              onClick={() => handleGatedAction("Laser Presentation Pointer", onPresentClick)}
              className={`flex items-center w-full text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("Laser Pointer", e.currentTarget, {
                  subtext: "Interactive laser pointer HUD",
                  isPro: true,
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-rose-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-all shrink-0" />
                {!isCollapsed && <span>Laser Pointer</span>}
              </div>
              {!isCollapsed && !effectiveIsPro && <ProBadge />}
            </button>

            {/* 100vw Distraction-Free Canvas Toggle */}
            {onToggleSidebarVisibility && (
              <button
                type="button"
                id="sidebar-btn-exec-hide"
                onClick={onToggleSidebarVisibility}
                className={`flex items-center w-full text-sm font-medium text-amber-300 hover:text-white hover:bg-amber-500/20 rounded-lg transition-all border border-transparent hover:border-amber-500/30 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("100vw Distraction-Free Canvas", e.currentTarget, {
                    subtext: "Hide sidebar completely (Ctrl+\\)",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Maximize2 className="w-5 h-5 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all shrink-0" />
                  {!isCollapsed && <span>100vw Canvas</span>}
                </div>
              </button>
            )}

            <div className="w-full h-px bg-white/5 my-1" />

            {/* Exit Executive Focus Mode */}
            <button
              type="button"
              id="sidebar-btn-exit-exec"
              onClick={onToggleExecutiveMode}
              className={`flex items-center w-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
              }`}
              onMouseEnter={(e) => showTooltip("Exit Focus Mode", e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5 text-gray-400 opacity-80 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all shrink-0" />
                {!isCollapsed && <span>Exit Focus</span>}
              </div>
            </button>
          </div>
        ) : (
          /* ── Standard Full Suite Navigation: Premium Glassmorphism Dock ── */
          <div className="bg-[#09090b]/60 backdrop-blur-2xl border border-white/8 rounded-2xl py-3.5 px-2 flex flex-col gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {/* ── Primary Tools (Present to Voice AI) ── */}
            <div className="flex flex-col gap-1.5">
              {/* Present (PRO) */}
              <button
                type="button"
                id="sidebar-btn-present"
                onClick={() => handleGatedAction("Laser Presentation Mode", onPresentClick)}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Present Mode", e.currentTarget, {
                    subtext: "Laser pointer & Slide deck view",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Present</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Search (PRO) */}
              <button
                type="button"
                id="sidebar-btn-search"
                onClick={() => handleGatedAction("Canvas Vector RAG Search", onSearchClick)}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Search Canvas", e.currentTarget, {
                    subtext: "Semantic vector RAG indexing",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Search</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Board Brain (PRO) */}
              <button
                type="button"
                id="sidebar-btn-board-brain"
                onClick={() => handleGatedAction("AI Meeting Summaries & Action Items", onBoardBrainClick)}
                disabled={isSummarising}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer disabled:opacity-50 group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Board Brain AI", e.currentTarget, {
                    subtext: "AI action items & meeting summaries",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all shrink-0" />
                  {!isCollapsed && (
                    <span>{isSummarising ? "Analysing…" : "Board Brain"}</span>
                  )}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Save & Index */}
              {onSaveAndIndex && (
                <button
                  type="button"
                  id="sidebar-btn-save-index"
                  onClick={onSaveAndIndex}
                  disabled={isIndexing}
                  className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer disabled:opacity-50 group ${
                    isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                  } ${isIndexing ? "cursor-wait" : ""}`}
                  onMouseEnter={(e) =>
                    showTooltip("Save & Index Canvas", e.currentTarget, {
                      subtext: "Index canvas text for vector RAG",
                    })
                  }
                  onMouseLeave={hideTooltip}
                >
                  <div className="flex items-center gap-3">
                    <Database
                      className={`w-5 h-5 ${
                        isIndexing ? "text-amber-400 animate-spin" : "text-emerald-400"
                      } opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all shrink-0`}
                    />
                    {!isCollapsed && (
                      <span>{isIndexing ? "Indexing…" : "Save & Index"}</span>
                    )}
                  </div>
                </button>
              )}

              {/* Share (PRO) */}
              <button
                type="button"
                id="sidebar-btn-share"
                onClick={() => handleGatedAction("Live Multiplayer Collaboration", onShareClick)}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Live Multiplayer Collaboration", e.currentTarget, {
                    subtext: "Real-time sync with peer cursors",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Share</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Code Studio (Multi-lang) */}
              <button
                type="button"
                id="sidebar-btn-code"
                onClick={onCodeStudioClick}
                className={`flex items-center w-full text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isCodeOpen
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 border border-transparent hover:border-white/10"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Code Studio", e.currentTarget, {
                    subtext: "Python, C, C++, Java, JS, TS, SQL",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-emerald-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Code Studio</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Multi-Lang
                  </span>
                )}
              </button>

              {/* Voice AI / Corporate Sync */}
              <button
                type="button"
                id="sidebar-btn-voice-robot"
                onClick={onVoiceClick}
                className={`flex items-center w-full text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isVoiceListening
                    ? "bg-purple-900/50 text-purple-200 border border-purple-400/80 shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                    : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 border border-transparent hover:border-white/10"
                }`}
                onMouseEnter={(e) =>
                  showTooltip(
                    isVoiceListening ? "Voice AI (Listening)" : "Voice AI",
                    e.currentTarget,
                    {
                      subtext: isVoiceListening
                        ? "Click to deactivate voice capture"
                        : "Speak meeting notes & drawing commands",
                    }
                  )
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Bot
                    className={`w-5 h-5 shrink-0 transition-opacity ${
                      isVoiceListening
                        ? "text-purple-400 opacity-100 animate-pulse drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                        : "text-cyan-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    }`}
                  />
                  {!isCollapsed && (
                    <span>{isVoiceListening ? "Listening…" : "Voice AI"}</span>
                  )}
                </div>
                {isVoiceListening && !isCollapsed && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.9)]" />
                )}
              </button>
            </div>

            {/* ── Subtle Internal Divider ── */}
            <div className="w-full h-px bg-white/10 my-0.5 shrink-0" />

            {/* ── Secondary Tools (Project Files to Settings) ── */}
            <div className="flex flex-col gap-1.5">
              {/* Project Files Explorer */}
              <button
                type="button"
                id="sidebar-btn-files"
                onClick={onToggleExplorer}
                className={`flex items-center w-full text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isExplorerOpen
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    : "text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 border border-transparent hover:border-white/10"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Project Files", e.currentTarget, {
                    subtext: "VS Code tree & PDF page importer",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <FolderClosed className="w-5 h-5 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Project Files</span>}
                </div>
              </button>

              {/* Screenshot */}
              <button
                type="button"
                id="sidebar-btn-screenshot"
                onClick={onTakeScreenshot}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Take Screenshot", e.currentTarget, {
                    subtext: effectiveIsPro
                      ? "Clean 4K unbranded download"
                      : "Watermarked standard export",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-all shrink-0" />
                  {!isCollapsed && <span>Screenshot</span>}
                </div>
              </button>

              {/* Admin Panel (Only for admin@prathomix.tech) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center w-full text-sm font-semibold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 shadow-[0_0_14px_rgba(6,182,212,0.35)] hover:shadow-[0_0_22px_rgba(6,182,212,0.6)] rounded-lg transition-all duration-300 cursor-pointer group ${
                    isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                  }`}
                  onMouseEnter={(e) =>
                    showTooltip("Admin Panel", e.currentTarget, {
                      subtext: "Master administrative control",
                    })
                  }
                  onMouseLeave={hideTooltip}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] shrink-0" />
                    {!isCollapsed && <span className="font-bold tracking-tight">Admin Panel</span>}
                  </div>
                </Link>
              )}

              {/* Save to Cloud (Supabase) */}
              {onSaveToCloud && (
                <button
                  type="button"
                  id="sidebar-btn-save-cloud"
                  onClick={onSaveToCloud}
                  disabled={isSavingCloud}
                  className={`flex items-center w-full text-sm font-medium text-cyan-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                    isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                  } ${isSavingCloud ? "opacity-75 cursor-wait" : ""}`}
                  onMouseEnter={(e) =>
                    showTooltip("Save to Cloud", e.currentTarget, {
                      subtext: "Sync scene to Supabase database",
                    })
                  }
                  onMouseLeave={hideTooltip}
                >
                  <div className="flex items-center gap-3">
                    <CloudUpload
                      className={`w-5 h-5 text-cyan-400 opacity-80 group-hover:opacity-100 transition-all shrink-0 ${
                        isSavingCloud ? "animate-bounce" : ""
                      }`}
                    />
                    {!isCollapsed && (
                      <span>{isSavingCloud ? "Saving..." : "Save to Cloud"}</span>
                    )}
                  </div>
                </button>
              )}

              {/* Settings */}
              <button
                type="button"
                id="sidebar-btn-settings"
                onClick={onOpenSettings}
                className={`flex items-center w-full text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-white/10 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Settings", e.currentTarget, {
                    subtext: "Canvas theme, grid matrix & account",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-400 opacity-80 group-hover:opacity-100 group-hover:rotate-45 transition-all shrink-0" />
                  {!isCollapsed && <span>Settings</span>}
                </div>
              </button>

              {/* Executive Focus Mode Toggle */}
              <button
                type="button"
                id="sidebar-btn-toggle-exec"
                onClick={() => {
                  if (onToggleSidebarVisibility) {
                    onToggleSidebarVisibility();
                  } else if (onToggleExecutiveMode) {
                    onToggleExecutiveMode();
                  }
                }}
                className={`flex items-center w-full text-sm font-medium text-amber-300 hover:text-white hover:bg-white/10 hover:translate-x-1 rounded-lg transition-all duration-300 border border-transparent hover:border-amber-500/30 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Executive Focus Mode", e.currentTarget, {
                    subtext: "100vw distraction-free canvas (Ctrl+\\)",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-amber-400 opacity-80 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all shrink-0" />
                  {!isCollapsed && <span>Executive Focus</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-mono text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                    Focus
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── 4. Bottom Section: Upgrade to Pro or Subtle PRO Active (mt-auto) ── */}
        <div className="mt-auto pt-2 shrink-0">
          {effectiveIsPro ? (
            <div
              className={`flex items-center w-full rounded-xl bg-cyan-500/5 border border-white/5 text-zinc-400 text-xs font-mono select-none transition-all ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("MasmSpace PRO Active", e.currentTarget, {
                  subtext: "Unlimited AI, 4K exports & vector RAG",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)] shrink-0" />
                {!isCollapsed && <span className="font-semibold text-zinc-300">PRO Active</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] text-cyan-400/80 font-mono">Plan Active</span>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="sidebar-btn-upgrade-pro"
              onClick={onOpenProModal}
              className={`relative overflow-hidden flex items-center w-full rounded-xl bg-gradient-to-r from-cyan-600/30 via-blue-600/25 to-purple-700/30 hover:from-cyan-500/45 hover:via-blue-600/38 hover:to-purple-600/45 border border-cyan-400/60 text-cyan-200 text-sm font-bold shadow-[0_0_24px_rgba(6,182,212,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_0_40px_rgba(6,182,212,0.65)] animate-[glow-breathe_4s_ease-in-out_infinite] transition-all duration-300 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-3"
              }`}
              onMouseEnter={(e) =>
                showTooltip("Upgrade to MasmSpace PRO", e.currentTarget, {
                  subtext: "Unlock live sync, vector RAG & laser HUD",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3.5">
                <Crown className="w-5 h-5 fill-cyan-400 text-cyan-400 opacity-90 group-hover:opacity-100 transition-opacity shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" />
                {!isCollapsed && <span>GET PRO</span>}
              </div>
              {!isCollapsed && (
                <span className="text-xs text-cyan-300 font-bold group-hover:translate-x-0.5 transition-transform">
                  ⚡
                </span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* ── 2. Floating Cyberpunk Toast Notification for Gated Action Interceptions ── */}
      <AnimatePresence>
        {proToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-20 left-4 z-[99999] max-w-sm p-3.5 rounded-2xl bg-[#09090b]/95 backdrop-blur-2xl border border-cyan-400/60 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.35)] text-cyan-200 text-xs flex items-center gap-3 select-none pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-cyan-400 animate-pulse drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-[11px] font-mono tracking-tight">
                MasmSpace PRO Exclusive
              </div>
              <div className="text-[11px] text-cyan-300/90 font-sans leading-snug">
                {proToast}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProToast(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3. High Z-Index Floating Portal Tooltip (No Container Clipping) ── */}
      {mounted &&
        tooltip &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[99999] transition-all duration-150 animate-in fade-in zoom-in-95"
            style={{
              top: Math.max(
                12,
                Math.min(
                  window.innerHeight - 56,
                  tooltip.rect.top + tooltip.rect.height / 2 - 18
                )
              ),
              left: tooltip.rect.right + 12,
            }}
          >
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#09090b]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_16px_rgba(6,182,212,0.25)] text-white text-xs whitespace-nowrap">
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-100">{tooltip.text}</span>
                {tooltip.subtext && (
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {tooltip.subtext}
                  </span>
                )}
              </div>
              {tooltip.isPro && !effectiveIsPro && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                  PRO
                </span>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* ── 4. Mobile Top Bar with Hamburger Menu (flex md:hidden) ── */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 z-40 h-12 items-center justify-between px-3 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5" title="MasmSpace">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            />
            <span className="font-bold text-white tracking-tight text-xs">MasmSpace</span>
          </Link>
          <input
            type="text"
            value={boardTitle}
            onChange={(e) => onBoardTitleChange(e.target.value)}
            placeholder="Untitled"
            maxLength={30}
            className="w-24 xs:w-32 bg-white/5 border border-white/5 rounded-lg px-2 py-0.5 text-xs text-zinc-200 truncate outline-none focus:border-cyan-400/60"
            title="Rename Session"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCodeStudioClick}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              isCodeOpen
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                : "text-zinc-300 hover:bg-white/10"
            }`}
            title="Code Studio"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer"
            title="Menu"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── 5. Mobile Floating Glass Bottom Navigation Bar (flex md:hidden) ── */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden fixed bottom-3 left-3 right-3 z-50 h-14 items-center justify-around px-2 bg-[#09090b]/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-[0_0_24px_rgba(0,0,0,0.6)] select-none"
      >
        {/* Code Studio */}
        <button
          type="button"
          onClick={onCodeStudioClick}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            isCodeOpen ? "text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="Code Studio"
        >
          <Code2 className="w-4 h-4" />
          <span className="text-[10px] leading-none">Code</span>
        </button>

        {/* Voice AI */}
        <button
          type="button"
          onClick={onVoiceClick}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            isVoiceListening ? "text-purple-400 animate-pulse font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="Voice AI"
        >
          <Bot className="w-4 h-4" />
          <span className="text-[10px] leading-none">Voice</span>
        </button>

        {/* Board Brain (Gated to PRO) */}
        <button
          type="button"
          onClick={() => handleGatedAction("Board Brain AI", onBoardBrainClick)}
          disabled={isSummarising}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
          title="Board Brain"
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] leading-none">Brain</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="text-[10px] leading-none">Settings</span>
        </button>

        {/* Mobile Hamburger / Tools Menu */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            mobileMenuOpen ? "text-cyan-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
          }`}
          title="Tools Menu"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] leading-none">Menu</span>
        </button>
      </nav>

      {/* ── 6. Mobile Slide-out Drawer for All Sidebar Tools (flex md:hidden) ── */}
      {mobileMenuOpen && (
        <div className="flex md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#09090b]/90 backdrop-blur-xl border-r border-white/5 p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar shadow-2xl z-10 text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Image
                  src="/masmspace-logo.png"
                  alt="MasmSpace"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain"
                />
                <span className="font-bold text-white text-sm">MasmSpace Menu</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Navigation List */}
            <div className="flex flex-col gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  onCodeStudioClick();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  isCodeOpen
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                    : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Code Studio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onVoiceClick();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${
                  isVoiceListening
                    ? "bg-purple-900/40 text-purple-200 border border-purple-400/40"
                    : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Voice AI {isVoiceListening ? "(Active)" : ""}</span>
              </button>

              {/* Board Brain (PRO Gated) */}
              <button
                type="button"
                onClick={() => {
                  handleGatedAction("AI Meeting Summaries & Action Items", onBoardBrainClick);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>Board Brain AI</span>
                </div>
                {!effectiveIsPro && <ProBadge />}
              </button>

              {/* Search Canvas (PRO Gated) */}
              <button
                type="button"
                onClick={() => {
                  handleGatedAction("Canvas Vector RAG Search", onSearchClick);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Search Canvas</span>
                </div>
                {!effectiveIsPro && <ProBadge />}
              </button>

              {/* Present Mode (PRO Gated) */}
              <button
                type="button"
                onClick={() => {
                  handleGatedAction("Laser Presentation Mode", onPresentClick);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-4 h-4 text-rose-400" />
                  <span>Present Mode</span>
                </div>
                {!effectiveIsPro && <ProBadge />}
              </button>

              {/* Share & Collaborate (PRO Gated) */}
              <button
                type="button"
                onClick={() => {
                  handleGatedAction("Live Multiplayer Collaboration", onShareClick);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Share &amp; Collaborate</span>
                </div>
                {!effectiveIsPro && <ProBadge />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleExplorer();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <FolderClosed className="w-4 h-4 text-amber-400" />
                <span>Project Files</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTakeScreenshot();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-zinc-300" />
                <span>Take Screenshot</span>
              </button>

              {onToggleSidebarVisibility && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleSidebarVisibility();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Executive Focus Mode</span>
                </button>
              )}
            </div>

            {/* Upgrade PRO or Subtle PRO Active at bottom of mobile menu */}
            <div className="mt-auto pt-3 border-t border-white/5">
              {effectiveIsPro ? (
                <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-cyan-500/5 border border-white/5 text-zinc-400 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <span className="font-semibold text-zinc-300">PRO Active</span>
                  </div>
                  <span className="text-[10px] text-cyan-400/80">Plan Active</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs shadow-lg cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                  <span>GET PRO ACCESS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LeftSidebar;

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
  FileUp,
  Sparkles,
  CheckCircle2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import SettingsModal from "@/components/SettingsModal";
import { checkIsProUser } from "@/lib/userSubscription";

interface LeftSidebarProps {
  boardTitle: string;
  onBoardTitleChange: (title: string) => void;
  activeTab?: string;
  // Core Action Handlers
  onPresentClick: () => void;
  onSearchClick: () => void;
  onBoardBrainClick: () => void;
  onImportDocumentClick?: () => void;
  onImportDocument?: (file: File) => void;
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
  onOpenSettings?: () => void;
  onOpenProModal?: () => void;
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
  onImportDocumentClick,
  onImportDocument,
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
  activeTab = "canvas",
}: LeftSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProSubscription, setHasProSubscription] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Modals state
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // PRO Gating Feedback Toast
  const [proToast, setProToast] = useState<string | null>(null);

  // Floating Toast Feedback State for Instant Button Click Confirmation
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: "info" | "success" | "pro";
  } | null>(null);

  const showToast = (
    message: string,
    type: "info" | "success" | "pro" = "info"
  ) => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Floating Portal Tooltip State (immune to overflow-y-auto clipping)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hidden File Input for Document Importer
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportButtonClick = () => {
    if (onImportDocumentClick) {
      onImportDocumentClick();
    }
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportDocument) {
      onImportDocument(file);
    }
    e.target.value = "";
  };

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    async function checkSubscription() {
      // 1. Fast initial sync from cached local storage session
      try {
        const stored =
          localStorage.getItem("prathomix_current_user") ||
          localStorage.getItem("prathomix_current_user");
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

  // Effective PRO status combines props with database subscription state or localhost testing
  const effectiveIsPro = Boolean(
    isProUser ||
      hasProSubscription ||
      checkIsProUser({ isPro: isProUser })
  );

  /**
   * Centralized PRO Action Guard:
   * Strictly verifies tier status before executing any gated feature.
   * Free users receive a non-blocking toast and an upgrade modal trigger.
   */
  const handleGatedAction = (featureName: string, actionFn?: () => void) => {
    if (!effectiveIsPro) {
      setProToast(`Upgrade to PRO: ${featureName} is exclusive to PRO subscribers.`);
      setTimeout(() => setProToast(null), 4000);
      setIsProModalOpen(true);
      onOpenProModal?.();
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

  // Clean, modern PRO badge
  const ProBadge = () => (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shrink-0 font-mono leading-none select-none">
      PRO
    </span>
  );

  // Navigation item class generator with clean, modern whiteboard active state
  const getNavItemClass = (tabId: string) => {
    const isActive = activeTab === tabId;
    return `flex items-center w-full text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-slate-100 dark:bg-zinc-800/80 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50"
    } ${isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"}`;
  };

  return (
    <>
      {/* ── 1. Desktop & Tablet Sidebar Container with Strict Z-Index & Layout Isolation ── */}
      <aside
        id="app-left-sidebar"
        data-tour="sidebar"
        className={`hidden md:flex flex-col flex-shrink-0 fixed top-0 left-0 h-screen z-[99999] bg-white dark:bg-[#121316] pointer-events-auto overflow-y-auto custom-scrollbar border-r border-slate-200 dark:border-zinc-800/80 select-none transition-all duration-300 ease-in-out ${
          !isSidebarVisible
            ? "-translate-x-full opacity-0 pointer-events-none !w-0 overflow-hidden"
            : isCollapsed
            ? "translate-x-0 opacity-100 w-[76px] p-2.5 gap-3"
            : "translate-x-0 opacity-100 w-[260px] p-3.5 gap-3.5"
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
                    src="/Prathomix-logo.png"
                    alt="MasmSpace Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight font-sans text-base leading-none">
                    MasmSpace
                  </span>
                  <span className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider mt-0.5">
                    by Prathomix
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {onToggleSidebarVisibility && (
                  <button
                    type="button"
                    onClick={onToggleSidebarVisibility}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors group"
                onMouseEnter={(e) => showTooltip("MasmSpace Whiteboard OS", e.currentTarget)}
                onMouseLeave={hideTooltip}
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300">
                  <Image
                    src="/Prathomix-logo.png"
                    alt="MasmSpace Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
              </Link>
              {onToggleSidebarVisibility && (
                <button
                  type="button"
                  onClick={onToggleSidebarVisibility}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
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
          <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm shrink-0 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <input
              id="sidebar-board-title"
              type="text"
              value={boardTitle}
              onChange={(e) => onBoardTitleChange(e.target.value)}
              placeholder="Untitled Whiteboard"
              maxLength={50}
              className="w-full bg-transparent border-none outline-none text-sm font-medium text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500 truncate"
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
              className={`rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 ${
                isCollapsed ? "p-2 flex justify-center" : "px-3 py-2.5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                {!isCollapsed && (
                  <div>
                    <div className="text-xs font-bold tracking-tight">Executive Focus</div>
                    <div className="text-[10px] text-amber-600/80 dark:text-amber-300/80">Distraction-free</div>
                  </div>
                )}
              </div>
            </div>

            {/* Pen / Freedraw */}
            <button
              type="button"
              id="sidebar-btn-exec-pen"
              onClick={onSelectPenTool}
              className={`flex items-center w-full text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer group ${
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
                <PenTool className="w-5 h-5 text-blue-500 dark:text-blue-400 opacity-80 group-hover:opacity-100 transition-all shrink-0" />
                {!isCollapsed && <span>Draw Pen</span>}
              </div>
            </button>

            {/* Sticky Notes */}
            <button
              type="button"
              id="sidebar-btn-exec-sticky"
              onClick={onAddStickyNote}
              className={`flex items-center w-full text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer group ${
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
                <StickyNote className="w-5 h-5 text-amber-500 dark:text-yellow-400 opacity-80 group-hover:opacity-100 transition-all shrink-0" />
                {!isCollapsed && <span>Sticky Note</span>}
              </div>
            </button>

            {/* Laser Presentation Pointer (GATED TO PRO) */}
            <button
              type="button"
              id="sidebar-btn-exec-present"
              onClick={() => handleGatedAction("Laser Presentation Pointer", onPresentClick)}
              className={`flex items-center w-full text-sm font-medium text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer group ${
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
                <Tv className="w-5 h-5 text-rose-500 dark:text-rose-400 opacity-80 group-hover:opacity-100 transition-all shrink-0" />
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
                className={`flex items-center w-full text-sm font-medium text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-white hover:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-all border border-transparent hover:border-amber-500/30 cursor-pointer group ${
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
                  <Maximize2 className="w-5 h-5 text-amber-500 dark:text-amber-400 opacity-80 group-hover:opacity-100 transition-all shrink-0" />
                  {!isCollapsed && <span>100vw Canvas</span>}
                </div>
              </button>
            )}

            <div className="w-full h-px bg-slate-200 dark:bg-white/5 my-1" />

            {/* Exit Executive Focus Mode */}
            <button
              type="button"
              id="sidebar-btn-exit-exec"
              onClick={onToggleExecutiveMode}
              className={`flex items-center w-full text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
              }`}
              onMouseEnter={(e) => showTooltip("Exit Focus Mode", e.currentTarget)}
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-gray-400 opacity-80 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all shrink-0" />
                {!isCollapsed && <span>Exit Focus</span>}
              </div>
            </button>
          </div>
        ) : (
          /* ── Standard Full Suite Navigation: Premium Glassmorphism Dock ── */
          <div className="bg-[#09090b]/60 backdrop-blur-2xl border border-white/8 rounded-2xl py-3.5 px-2 flex flex-col gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
            {/* ── Primary Tools (Present to Voice AI) ── */}
            <div className="flex flex-col gap-1.5">
              {/* Present */}
              <button
                type="button"
                id="sidebar-btn-present"
                onClick={() => {
                  showToast("Opening Laser Presentation Mode...", "info");
                  if (onPresentClick) {
                    handleGatedAction("Laser Presentation Mode", onPresentClick);
                  }
                }}
                className={getNavItemClass("present")}
                onMouseEnter={(e) =>
                  showTooltip("Present Mode", e.currentTarget, {
                    subtext: "Laser pointer & Slide deck view",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  {!isCollapsed && <span>Present</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Search */}
              <button
                type="button"
                id="sidebar-btn-search"
                onClick={() => {
                  showToast("Opening Canvas Vector RAG Search...", "info");
                  if (onSearchClick) {
                    handleGatedAction("Canvas Vector RAG Search", onSearchClick);
                  }
                }}
                className={getNavItemClass("search")}
                onMouseEnter={(e) =>
                  showTooltip("Search Canvas", e.currentTarget, {
                    subtext: "Semantic vector RAG indexing",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  {!isCollapsed && <span>Search</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Board Brain */}
              <button
                type="button"
                id="sidebar-btn-board-brain"
                onClick={() => {
                  showToast("Opening Board Brain AI Action Items...", "info");
                  if (onBoardBrainClick) {
                    handleGatedAction("AI Meeting Summaries & Action Items", onBoardBrainClick);
                  }
                }}
                disabled={isSummarising}
                className={`${getNavItemClass("brain")} ${isSummarising ? "opacity-50" : ""}`}
                onMouseEnter={(e) =>
                  showTooltip("Board Brain AI", e.currentTarget, {
                    subtext: "AI action items & meeting summaries",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
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
                  onClick={() => {
                    showToast("Indexing canvas nodes for Vector RAG...", "info");
                    onSaveAndIndex();
                  }}
                  disabled={isIndexing}
                  className={`${getNavItemClass("save")} ${isIndexing ? "cursor-wait" : ""}`}
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
                        isIndexing ? "text-amber-500 animate-spin" : "text-emerald-500"
                      } transition-colors shrink-0`}
                    />
                    {!isCollapsed && (
                      <span>{isIndexing ? "Indexing…" : "Save & Index"}</span>
                    )}
                  </div>
                </button>
              )}

              {/* Import Document (PDF/DOCX/PPTX/Images) */}
              <button
                type="button"
                id="sidebar-btn-import-doc"
                onClick={() => {
                  showToast("Select document (.pdf, .docx, .pptx, image) to import...", "info");
                  handleImportButtonClick();
                }}
                className={getNavItemClass("import")}
                onMouseEnter={(e) =>
                  showTooltip("Import Document", e.currentTarget, {
                    subtext: "Render PDF, DOCX, PPTX, or Image onto canvas",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-purple-500 transition-colors shrink-0" />
                  {!isCollapsed && <span>Import Document</span>}
                </div>
              </button>

              {/* Hidden file input for document importer */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf, .docx, .pptx, image/*"
                className="hidden"
                style={{ display: "none" }}
                onChange={handleFileInputChange}
              />

              {/* Share */}
              <button
                type="button"
                id="sidebar-btn-share"
                onClick={() => {
                  showToast("Opening Live Multiplayer Collaboration...", "info");
                  if (onShareClick) {
                    handleGatedAction("Live Multiplayer Collaboration", onShareClick);
                  }
                }}
                className={getNavItemClass("share")}
                onMouseEnter={(e) =>
                  showTooltip("Live Multiplayer Collaboration", e.currentTarget, {
                    subtext: "Real-time sync with peer cursors",
                    isPro: true,
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                  {!isCollapsed && <span>Share</span>}
                </div>
                {!isCollapsed && !effectiveIsPro && <ProBadge />}
              </button>

              {/* Code Studio (Multi-lang) */}
              <button
                type="button"
                id="sidebar-btn-code"
                onClick={() => {
                  showToast("Toggling Code Studio Multi-Language Editor...", "info");
                  onCodeStudioClick?.();
                }}
                className={`flex items-center w-full text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isCodeOpen
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Code Studio", e.currentTarget, {
                    subtext: "Python, C, C++, Java, JS, TS, SQL",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <Code2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  {!isCollapsed && <span>Code Studio</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    Multi-Lang
                  </span>
                )}
              </button>

              {/* Voice AI / Corporate Sync */}
              <button
                type="button"
                id="sidebar-btn-voice-robot"
                onClick={() => {
                  showToast(isVoiceListening ? "Voice AI capture stopped" : "Voice AI Listening...", "info");
                  onVoiceClick?.();
                }}
                className={`flex items-center w-full text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isVoiceListening
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50"
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
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isVoiceListening
                        ? "text-purple-500 animate-pulse"
                        : "text-slate-500 dark:text-zinc-400 group-hover:text-purple-500"
                    }`}
                  />
                  {!isCollapsed && (
                    <span>{isVoiceListening ? "Listening…" : "Voice AI"}</span>
                  )}
                </div>
                {isVoiceListening && !isCollapsed && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping shrink-0" />
                )}
              </button>
            </div>

            {/* ── Subtle Internal Divider ── */}
            <div className="w-full h-px bg-slate-200 dark:bg-zinc-800 my-1 shrink-0" />

            {/* ── Secondary Tools (Project Files to Settings) ── */}
            <div className="flex flex-col gap-1.5">
              {/* Project Files Explorer */}
              <button
                type="button"
                id="sidebar-btn-files"
                onClick={() => {
                  showToast("Toggling Project Files Explorer...", "info");
                  onToggleExplorer?.();
                }}
                className={`flex items-center w-full text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group ${
                  isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
                } ${
                  isExplorerOpen
                    ? "bg-slate-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50"
                }`}
                onMouseEnter={(e) =>
                  showTooltip("Project Files", e.currentTarget, {
                    subtext: "VS Code tree & PDF page importer",
                  })
                }
                onMouseLeave={hideTooltip}
              >
                <div className="flex items-center gap-3">
                  <FolderClosed className="w-5 h-5 text-amber-500 shrink-0" />
                  {!isCollapsed && <span>Project Files</span>}
                </div>
              </button>

              {/* Screenshot */}
              <button
                type="button"
                id="sidebar-btn-screenshot"
                onClick={() => {
                  showToast("Capturing high-resolution canvas snapshot...", "success");
                  onTakeScreenshot?.();
                }}
                className={`flex items-center w-full text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer group ${
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
                  <Camera className="w-5 h-5 text-indigo-500 shrink-0" />
                  {!isCollapsed && <span>Screenshot</span>}
                </div>
              </button>

              {/* Admin Panel (Only for admin@prathomix.tech) */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center w-full text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 rounded-xl transition-all cursor-pointer group ${
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
                    <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    {!isCollapsed && <span className="font-bold tracking-tight">Admin Panel</span>}
                  </div>
                </Link>
              )}

              {/* Save to Cloud (Supabase) */}
              {onSaveToCloud && (
                <button
                  type="button"
                  id="sidebar-btn-save-cloud"
                  onClick={() => {
                    showToast("Saving whiteboard scene to cloud...", "info");
                    onSaveToCloud();
                  }}
                  disabled={isSavingCloud}
                  className={`flex items-center w-full text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer group ${
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
                      className={`w-5 h-5 text-blue-500 shrink-0 ${
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
                onClick={() => {
                  setIsSettingsOpen(true);
                  onOpenSettings?.();
                }}
                className={`flex items-center w-full text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer group ${
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
                  <Settings className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:rotate-45 transition-transform shrink-0" />
                  {!isCollapsed && <span>Settings</span>}
                </div>
              </button>

              {/* Executive Focus Mode Toggle */}
              <button
                type="button"
                id="sidebar-btn-toggle-exec"
                onClick={() => {
                  showToast("Toggling Executive Focus Mode (100vw)...", "info");
                  if (onToggleSidebarVisibility) {
                    onToggleSidebarVisibility();
                  } else if (onToggleExecutiveMode) {
                    onToggleExecutiveMode();
                  }
                }}
                className={`flex items-center w-full text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100/70 dark:hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer group ${
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
                  <Briefcase className="w-5 h-5 text-amber-500 shrink-0" />
                  {!isCollapsed && <span>Executive Focus</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
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
              className={`flex items-center w-full rounded-xl bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-mono select-none transition-all ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("MasmSpace PRO Active", e.currentTarget, {
                  subtext: "Unlimited AI, 4K exports & vector RAG",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                {!isCollapsed && <span className="font-semibold text-slate-800 dark:text-zinc-200">PRO Active</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">Active</span>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="sidebar-btn-upgrade-pro"
              onClick={() => {
                setIsProModalOpen(true);
                onOpenProModal?.();
              }}
              className={`relative overflow-hidden flex items-center w-full rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer group ${
                isCollapsed ? "justify-center p-2.5" : "justify-between px-3.5 py-2.5"
              }`}
              onMouseEnter={(e) =>
                showTooltip("Upgrade to MasmSpace PRO", e.currentTarget, {
                  subtext: "Unlock live sync, vector RAG & laser HUD",
                })
              }
              onMouseLeave={hideTooltip}
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                {!isCollapsed && <span>Upgrade to PRO</span>}
              </div>
              {!isCollapsed && (
                <span className="text-xs text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* ── 2. Floating Toast Notifications ── */}
      <AnimatePresence>
        {proToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-20 left-4 z-[99999] max-w-sm p-3.5 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-3 select-none pointer-events-auto"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 dark:text-white text-[11px] font-sans">
                MasmSpace PRO
              </div>
              <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-sans leading-snug">
                {proToast}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss alert"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[999999] max-w-sm px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl text-slate-800 dark:text-zinc-100 text-xs flex items-center gap-3 select-none pointer-events-auto transition-all"
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === "pro"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-500"
                  : toast.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-500"
              }`}
            >
              {toast.type === "pro" ? (
                <Crown className="w-4 h-4 text-amber-500" />
              ) : toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <div className="flex-1 font-medium text-xs leading-snug">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss toast"
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
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-md border border-slate-700/50 shadow-xl text-white text-xs whitespace-nowrap">
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-100">{tooltip.text}</span>
                {tooltip.subtext && (
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {tooltip.subtext}
                  </span>
                )}
              </div>
              {tooltip.isPro && !effectiveIsPro && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40">
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
              src="/Prathomix-logo.png"
              alt="MasmSpace Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              priority
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
            onClick={() => {
              setIsSettingsOpen(true);
              onOpenSettings?.();
            }}
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
          onClick={() => {
            setIsSettingsOpen(true);
            onOpenSettings?.();
          }}
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
                  src="/Prathomix-logo.png"
                  alt="MasmSpace"
                  width={28}
                  height={28}
                  className="w-7 h-7 object-contain"
                  priority
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
                  setIsSettingsOpen(true);
                  onOpenSettings?.();
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
            <div className="mt-auto pt-3 border-t border-zinc-800">
              {effectiveIsPro ? (
                <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 text-zinc-300 text-xs font-mono">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-zinc-200">PRO Active</span>
                  </div>
                  <span className="text-[10px] text-blue-400 font-medium">Plan Active</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsProModalOpen(true);
                    onOpenProModal?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm cursor-pointer transition-colors"
                >
                  <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Upgrade to PRO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Modals ── */}
      {isProModalOpen && (
        <ProUpgradeModal onClose={() => setIsProModalOpen(false)} />
      )}

      {isSettingsOpen && !onOpenSettings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenUpgradeModal={() => setIsProModalOpen(true)}
          tier={effectiveIsPro ? "pro" : "free"}
          actionLimit={effectiveIsPro ? 300 : 15}
        />
      )}
    </>
  );
}

export default LeftSidebar;

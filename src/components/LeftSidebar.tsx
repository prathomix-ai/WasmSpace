"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";

interface LeftSidebarProps {
  boardTitle: string;
  onBoardTitleChange: (title: string) => void;
  // Core Action Handlers
  onPresentClick: () => void;
  onSearchClick: () => void;
  onBoardBrainClick: () => void;
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
  // Executive Focus Mode
  isExecutiveMode?: boolean;
  onToggleExecutiveMode?: () => void;
  onSelectPenTool?: () => void;
  onAddStickyNote?: () => void;
}

export function LeftSidebar({
  boardTitle,
  onBoardTitleChange,
  onPresentClick,
  onSearchClick,
  onBoardBrainClick,
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
  isExecutiveMode = false,
  onToggleExecutiveMode,
  onSelectPenTool,
  onAddStickyNote,
}: LeftSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Natural flexbox PRO Badge (no absolute positioning)
  const ProBadge = () => (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0 font-mono leading-none select-none">
      PRO
    </span>
  );

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-full flex-shrink-0 relative z-50 overflow-y-auto custom-scrollbar bg-black/40 backdrop-blur-md border-r border-white/10 select-none transition-all duration-300 ${
          isCollapsed ? "w-[72px] p-2 gap-3" : "w-64 p-4 gap-4"
        }`}
      >
      {/* ── 1. Header: Logo & Collapse Button ── */}
      <div
        className={`flex items-center mb-2 shrink-0 ${
          isCollapsed ? "flex-col justify-center gap-2" : "justify-between w-full"
        }`}
      >
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
              title="MasmSpace Whiteboard OS"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src="/masmspace-logo.png"
                  alt="MasmSpace Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
              </div>
              <span className="font-bold text-white tracking-tight font-sans text-base">
                MasmSpace
              </span>
            </Link>

            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              className="p-1 rounded-xl hover:bg-white/5 transition-colors group"
              title="MasmSpace Whiteboard OS"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300">
                <Image
                  src="/masmspace-logo.png"
                  alt="MasmSpace Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
              </div>
            </Link>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Session Box: Board Title Input (Visible when expanded) ── */}
      {!isCollapsed && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-2 text-sm shrink-0 focus-within:border-cyan-400/50 transition-colors">
          <input
            id="sidebar-board-title"
            type="text"
            value={boardTitle}
            onChange={(e) => onBoardTitleChange(e.target.value)}
            placeholder="Untitled Session"
            maxLength={50}
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-zinc-200 placeholder-zinc-500 truncate"
            title="Rename Session"
            spellCheck={false}
          />
        </div>
      )}

      {/* ── 3. Navigation Content ── */}
      {isExecutiveMode ? (
        /* ── Executive Focus Mode: Clean, Distraction-Free Suite ── */
        <div className="flex flex-col gap-1">
          <div
            className={`rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 ${
              isCollapsed ? "p-2 flex justify-center" : "p-2.5"
            }`}
          >
            <div className="flex items-center gap-2.5">
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
            className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="Pen (Natural Freehand Sketching)"
          >
            <div className="flex items-center gap-3">
              <PenTool className="w-5 h-5 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              {!isCollapsed && <span>Draw Pen</span>}
            </div>
          </button>

          {/* Sticky Notes */}
          <button
            type="button"
            id="sidebar-btn-exec-sticky"
            onClick={onAddStickyNote}
            className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="Add Sticky Note"
          >
            <div className="flex items-center gap-3">
              <StickyNote className="w-5 h-5 text-yellow-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              {!isCollapsed && <span>Sticky Note</span>}
            </div>
          </button>

          {/* Laser Presentation Pointer */}
          <button
            type="button"
            id="sidebar-btn-exec-present"
            onClick={onPresentClick}
            className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="Laser Presentation Pointer"
          >
            <div className="flex items-center gap-3">
              <Tv className="w-5 h-5 text-rose-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
              {!isCollapsed && <span>Laser Pointer</span>}
            </div>
          </button>

          <div className="w-full h-px bg-white/10 my-2" />

          {/* Exit Executive Focus Mode */}
          <button
            type="button"
            id="sidebar-btn-exit-exec"
            onClick={onToggleExecutiveMode}
            className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
              isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="Exit Executive Focus Mode"
          >
            <div className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 text-gray-400 opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all shrink-0" />
              {!isCollapsed && <span>Exit Focus</span>}
            </div>
          </button>
        </div>
      ) : (
        /* ── Standard Full Suite Navigation ── */
        <>
          {/* ── Primary Tools (Present to Voice AI) ── */}
          <div className="flex flex-col gap-1">
            {/* Present (PRO) */}
            <button
              type="button"
              id="sidebar-btn-present"
              onClick={onPresentClick}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="Present Mode (Laser & Slide deck)"
            >
              <div className="flex items-center gap-3">
                <Tv className="w-5 h-5 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Present</span>}
              </div>
              {!isCollapsed && <ProBadge />}
            </button>

            {/* Search (PRO) */}
            <button
              type="button"
              id="sidebar-btn-search"
              onClick={onSearchClick}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="Search Canvas Sessions via Vector RAG"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Search</span>}
              </div>
              {!isCollapsed && <ProBadge />}
            </button>

            {/* Board Brain (PRO) */}
            <button
              type="button"
              id="sidebar-btn-board-brain"
              onClick={onBoardBrainClick}
              disabled={isSummarising}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="AI Board Brain: Meeting Action Items & Summaries"
            >
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && (
                  <span>{isSummarising ? "Analysing…" : "Board Brain"}</span>
                )}
              </div>
              {!isCollapsed && <ProBadge />}
            </button>

            {/* Share (PRO) */}
            <button
              type="button"
              id="sidebar-btn-share"
              onClick={onShareClick}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="Live Multiplayer Collaboration"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-cyan-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Share</span>}
              </div>
              {!isCollapsed && <ProBadge />}
            </button>

            {/* Code Studio (Multi-lang) */}
            <button
              type="button"
              id="sidebar-btn-code"
              onClick={onCodeStudioClick}
              className={`flex items-center w-full rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              } ${
                isCodeOpen
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title="Multi-Language Code Studio (Python, C, C++, Java, JS, TS, SQL)"
            >
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
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
              className={`flex items-center w-full rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              } ${
                isVoiceListening
                  ? "bg-purple-900/50 text-purple-200 border border-purple-400/80 shadow-[0_0_16px_rgba(168,85,247,0.4)]"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title={
                isVoiceListening
                  ? "Voice AI Active (Listening… Click to stop)"
                  : "Voice AI (Speak meeting notes & drawing commands)"
              }
            >
              <div className="flex items-center gap-3">
                <Bot
                  className={`w-5 h-5 shrink-0 transition-opacity ${
                    isVoiceListening
                      ? "text-purple-400 opacity-100 animate-pulse"
                      : "text-cyan-400 opacity-70 group-hover:opacity-100"
                  }`}
                />
                {!isCollapsed && (
                  <span>{isVoiceListening ? "Listening…" : "Voice AI"}</span>
                )}
              </div>
              {isVoiceListening && !isCollapsed && (
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
              )}
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="w-full h-px bg-white/10 my-2 shrink-0" />

          {/* ── Secondary Tools (Project Files to Settings) ── */}
          <div className="flex flex-col gap-1">
            {/* Project Files Explorer */}
            <button
              type="button"
              id="sidebar-btn-files"
              onClick={onToggleExplorer}
              className={`flex items-center w-full rounded-lg text-sm font-medium transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              } ${
                isExplorerOpen
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              title="Project Files (VS Code Tree)"
            >
              <div className="flex items-center gap-3">
                <FolderClosed className="w-5 h-5 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Project Files</span>}
              </div>
            </button>

            {/* Screenshot */}
            <button
              type="button"
              id="sidebar-btn-screenshot"
              onClick={onTakeScreenshot}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title={isProUser ? "Take Screenshot (Clean 4K)" : "Take Screenshot (Free Watermark)"}
            >
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-gray-300 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Screenshot</span>}
              </div>
            </button>

            {/* Settings */}
            <button
              type="button"
              id="sidebar-btn-settings"
              onClick={onOpenSettings}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="Canvas Settings"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400 opacity-70 group-hover:opacity-100 group-hover:rotate-45 transition-all shrink-0" />
                {!isCollapsed && <span>Settings</span>}
              </div>
            </button>

            {/* Executive Focus Mode Toggle */}
            <button
              type="button"
              id="sidebar-btn-toggle-exec"
              onClick={onToggleExecutiveMode}
              className={`flex items-center w-full rounded-lg text-sm font-medium text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors cursor-pointer group ${
                isCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
              }`}
              title="Executive Focus Mode (Distraction-free Pen, Sticky Notes & Laser)"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                {!isCollapsed && <span>Executive Focus</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[9px] font-mono text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                  Focus
                </span>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── 4. Bottom Section: Upgrade to Pro (Pushed to very bottom with mt-auto) ── */}
      <div className="mt-auto pt-2 shrink-0">
        {isProUser ? (
          <div
            className={`flex items-center w-full rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-semibold select-none ${
              isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="MasmSpace PRO Subscriber Active"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
              {!isCollapsed && <span>PRO ACTIVE</span>}
            </div>
          </div>
        ) : (
          <button
            type="button"
            id="sidebar-btn-upgrade-pro"
            onClick={onOpenProModal}
            className={`flex items-center w-full rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer group ${
              isCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2.5"
            }`}
            title="Upgrade to MasmSpace PRO"
          >
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 fill-cyan-400 text-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity shrink-0" />
              {!isCollapsed && <span>GET PRO</span>}
            </div>
            {!isCollapsed && (
              <span className="text-xs text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                ⚡
              </span>
            )}
          </button>
        )}
      </div>
      </aside>

      {/* ── Mobile Top Bar with Hamburger Menu (flex md:hidden) ── */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 z-40 h-12 items-center justify-between px-3 bg-black/80 backdrop-blur-xl border-b border-white/10 select-none">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5" title="MasmSpace">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
            />
            <span className="font-bold text-white tracking-tight text-xs">MasmSpace</span>
          </Link>
          <input
            type="text"
            value={boardTitle}
            onChange={(e) => onBoardTitleChange(e.target.value)}
            placeholder="Untitled"
            maxLength={30}
            className="w-24 xs:w-32 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-zinc-200 truncate outline-none focus:border-cyan-400/60"
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
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            title="Menu"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar (flex md:hidden) ── */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 items-center justify-around px-2 bg-black/90 backdrop-blur-xl border-t border-white/10 select-none"
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
          <Code2 className="w-5 h-5" />
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
          <Bot className="w-5 h-5" />
          <span className="text-[10px] leading-none">Voice</span>
        </button>

        {/* Board Brain */}
        <button
          type="button"
          onClick={onBoardBrainClick}
          disabled={isSummarising}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50"
          title="Board Brain"
        >
          <Brain className="w-5 h-5 text-cyan-400" />
          <span className="text-[10px] leading-none">Brain</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
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
          <Menu className="w-5 h-5" />
          <span className="text-[10px] leading-none">Menu</span>
        </button>
      </nav>

      {/* ── Mobile Slide-out Drawer for All Sidebar Tools (flex md:hidden) ── */}
      {mobileMenuOpen && (
        <div className="flex md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-md">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#0a0d14] border-r border-white/15 p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar shadow-2xl z-10 text-zinc-200">
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
                  isCodeOpen ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "text-zinc-200 hover:bg-white/10"
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
                  isVoiceListening ? "bg-purple-900/40 text-purple-200 border border-purple-400/40" : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Voice AI {isVoiceListening ? "(Active)" : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onBoardBrainClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Board Brain AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSearchClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Search Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onPresentClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Tv className="w-4 h-4 text-rose-400" />
                <span>Present Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onShareClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-zinc-200 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Share &amp; Collaborate</span>
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

              {onToggleExecutiveMode && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleExecutiveMode();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-medium text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Executive Focus Mode</span>
                </button>
              )}
            </div>

            {/* Upgrade PRO at bottom of mobile menu */}
            <div className="mt-auto pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onOpenProModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 font-bold text-xs shadow-lg cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                <span>{isProUser ? "PRO ACTIVE" : "GET PRO ACCESS"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LeftSidebar;

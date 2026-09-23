"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Search,
  Sparkles,
  FolderKanban,
  FileUp,
  LayoutTemplate,
  Settings,
  X,
  Plus,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";

export type NavRailTab =
  | "boards"
  | "search"
  | "ai"
  | "projects"
  | "files"
  | "templates"
  | "settings"
  | null;

export interface LeftNavRailProps {
  onSearchClick: () => void;
  onBoardBrainClick: () => void;
  onToggleExplorer: () => void;
  isExplorerOpen?: boolean;
  onImportDocument?: (file: File) => void;
  onOpenSettings: () => void;
  onOpenProModal?: () => void;
  onSelectTemplate?: (templateId: string) => void;
  currentBoardTitle?: string;
  onSwitchBoard?: (title: string) => void;
}

const TEMPLATES = [
  {
    id: "microservices",
    title: "Microservices Architecture",
    desc: "API gateway, services, database clusters & caching",
    category: "Architecture",
  },
  {
    id: "cloud-topology",
    title: "Cloud Edge & CDN Topology",
    desc: "Ingress routes, serverless workers, auth & storage",
    category: "Cloud",
  },
  {
    id: "flowchart",
    title: "System Decision Flowchart",
    desc: "Logical branch nodes, process steps & terminals",
    category: "Diagrams",
  },
  {
    id: "sprint-kanban",
    title: "Sprint Planning & Brainstorm",
    desc: "Categorized sticky notes, roadmaps & tasks",
    category: "Agile",
  },
  {
    id: "mindmap",
    title: "Product Idea Mind Map",
    desc: "Central concept with branching sub-topics",
    category: "Ideation",
  },
];

const RECENT_BOARDS = [
  { id: "1", title: "System Architecture Topology", updatedAt: "Just now" },
  { id: "2", title: "Microservices Core Blueprint", updatedAt: "2 hours ago" },
  { id: "3", title: "Q3 Engineering Roadmap", updatedAt: "Yesterday" },
  { id: "4", title: "Payment Gateway Ingress", updatedAt: "3 days ago" },
];

export default function LeftNavRail({
  onSearchClick,
  onBoardBrainClick,
  onToggleExplorer,
  isExplorerOpen = false,
  onImportDocument,
  onOpenSettings,
  onOpenProModal: _onOpenProModal,
  onSelectTemplate,
  currentBoardTitle = "System Architecture Topology",
  onSwitchBoard,
}: LeftNavRailProps) {
  const [activeTab, setActiveTab] = useState<NavRailTab>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close flyout on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setActiveTab(null);
      }
    };
    if (activeTab) {
      window.addEventListener("mousedown", handleOutside);
    }
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [activeTab]);

  const handleTabClick = (tab: NavRailTab) => {
    if (tab === "search") {
      onSearchClick();
      setActiveTab(null);
      return;
    }
    if (tab === "ai") {
      onBoardBrainClick();
      setActiveTab(null);
      return;
    }
    if (tab === "projects") {
      onToggleExplorer();
      setActiveTab(null);
      return;
    }
    if (tab === "settings") {
      onOpenSettings();
      setActiveTab(null);
      return;
    }
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportDocument) {
      onImportDocument(file);
      setActiveTab(null);
    }
  };

  const navItems = [
    { id: "boards" as NavRailTab, label: "Boards", icon: LayoutGrid },
    { id: "search" as NavRailTab, label: "Search (Cmd+F)", icon: Search },
    { id: "ai" as NavRailTab, label: "Board Brain", icon: Sparkles },
    { id: "projects" as NavRailTab, label: "Explorer", icon: FolderKanban, active: isExplorerOpen },
    { id: "files" as NavRailTab, label: "Import", icon: FileUp },
    { id: "templates" as NavRailTab, label: "Templates", icon: LayoutTemplate },
  ];

  return (
    <div className="fixed top-16 left-3 bottom-14 z-30 flex items-start pointer-events-none select-none">
      {/* ── 1. Narrow Collapsible Rail (48px) ── */}
      <div className="pointer-events-auto w-12 flex flex-col items-center justify-between py-3 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-zinc-600 dark:text-zinc-400 h-full max-h-[520px]">
        {/* Top items */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || item.active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                title={item.label}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative group ${
                  isActive
                    ? "bg-[#635BFF]/10 text-[#635BFF] font-medium"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {/* Micro tooltip */}
                <span className="absolute left-12 px-2 py-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom items: Settings */}
        <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => handleTabClick("settings")}
            title="Settings"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer group relative"
          >
            <Settings className="w-4 h-4" />
            <span className="absolute left-12 px-2 py-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50">
              Settings
            </span>
          </button>
        </div>
      </div>

      {/* ── 2. Smooth Overlay Flyout Panel (280px) ── */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            ref={flyoutRef}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-auto ml-2 w-72 bg-white/98 dark:bg-[#18181b]/98 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 text-zinc-900 dark:text-zinc-100 z-40 max-h-[520px] flex flex-col"
          >
            {/* Flyout Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold capitalize text-zinc-800 dark:text-zinc-200">
                {activeTab}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content: Boards Tab */}
            {activeTab === "boards" && (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt("Enter new board title:", "New Architecture Board");
                    if (name) {
                      onSwitchBoard?.(name);
                      setActiveTab(null);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#635BFF]/10 text-[#635BFF] hover:bg-[#635BFF]/15 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new board</span>
                </button>

                <div className="pt-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                  Recent Boards
                </div>

                {RECENT_BOARDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSwitchBoard?.(b.title);
                      setActiveTab(null);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition-all cursor-pointer group ${
                      b.title === currentBoardTitle
                        ? "bg-zinc-100 dark:bg-zinc-800/80 font-medium"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-800 dark:text-zinc-200 truncate">
                        {b.title}
                      </span>
                      {b.title === currentBoardTitle && (
                        <Check className="w-3 h-3 text-[#635BFF] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{b.updatedAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Content: Templates Tab */}
            {activeTab === "templates" && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1 mb-1">
                  Click a template to populate your canvas:
                </p>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      onSelectTemplate?.(tmpl.id);
                      setActiveTab(null);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-200/70 dark:border-zinc-800 hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-[#635BFF] transition-colors">
                        {tmpl.title}
                      </span>
                      <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-[#635BFF] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.desc}
                    </p>
                    <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {tmpl.category}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Content: Files / Import Tab */}
            {activeTab === "files" && (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pdf,.png,.jpg,.jpeg,.svg,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                  <FileUp className="w-5 h-5 text-[#635BFF]" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
                  Import document or blueprint
                </h4>
                <p className="text-[11px] text-zinc-400 mb-3 max-w-[200px] leading-relaxed">
                  Support for PDF architecture docs, JSON canvases, and images.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#635BFF] hover:bg-[#5248E5] text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Choose file
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

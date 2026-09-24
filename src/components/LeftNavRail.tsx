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
  HelpCircle,
  X,
  Plus,
  Clock,
  ArrowRight,
  Check,
  ChevronRight,
} from "lucide-react";

export type NavRailTab =
  | "boards"
  | "search"
  | "ai"
  | "projects"
  | "files"
  | "templates"
  | "settings"
  | "help"
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
    title: "System Architecture",
    desc: "API gateway, services, database clusters & caching",
    category: "Architecture",
  },
  {
    id: "cloud-topology",
    title: "Cloud & CDN Topology",
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
    title: "Sprint Planning & Roadmaps",
    desc: "Categorized sticky notes, roadmap & tasks",
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
  onSelectTemplate,
  currentBoardTitle = "System Architecture Topology",
  onSwitchBoard,
}: LeftNavRailProps) {
  const [isHovered, setIsHovered] = useState(false);
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
    if (tab === "help") {
      window.open("https://github.com", "_blank");
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
    { id: "boards" as NavRailTab, label: "Boards", icon: LayoutGrid, shortcut: "B" },
    { id: "search" as NavRailTab, label: "Search", icon: Search, shortcut: "⌘K" },
    { id: "ai" as NavRailTab, label: "Board Brain", icon: Sparkles, shortcut: "AI" },
    { id: "projects" as NavRailTab, label: "Projects", icon: FolderKanban, active: isExplorerOpen, shortcut: "P" },
    { id: "files" as NavRailTab, label: "Files", icon: FileUp, shortcut: "F" },
    { id: "templates" as NavRailTab, label: "Templates", icon: LayoutTemplate, shortcut: "T" },
  ];

  return (
    <>
      {/* ── Left Navigation Rail: 54px by default, expanding smoothly to 220px on hover over canvas ── */}
      <nav
        aria-label="Sidebar Navigation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed top-[52px] bottom-0 left-0 z-30 flex flex-col justify-between py-3 px-1.5 bg-[#111113] border-r border-[#2A2A2F] transition-all duration-200 ease-out select-none shadow-[4px_0_24px_rgba(0,0,0,0.25)]"
        style={{ width: isHovered ? "220px" : "54px" }}
      >
        {/* Top Section Nav Items */}
        <div className="flex flex-col gap-1 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || item.active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                title={!isHovered ? item.label : undefined}
                className={`w-full h-9 rounded-md flex items-center transition-colors cursor-pointer px-2.5 ${
                  isActive
                    ? "bg-[#7C6CFF]/20 text-[#7C6CFF] font-medium"
                    : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="ml-3 flex items-center justify-between flex-1 overflow-hidden"
                  >
                    <span className="text-xs font-medium truncate text-[#F4F4F5]">
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-[#1C1C1F] border border-[#2A2A2F]">
                        {item.shortcut}
                      </kbd>
                    )}
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Settings & Help */}
        <div className="flex flex-col gap-1 w-full pt-2 border-t border-[#2A2A2F]">
          <button
            type="button"
            onClick={() => handleTabClick("settings")}
            title={!isHovered ? "Settings" : undefined}
            className="w-full h-9 rounded-md flex items-center transition-colors cursor-pointer px-2.5 text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="ml-3 flex items-center justify-between flex-1 overflow-hidden"
              >
                <span className="text-xs font-medium truncate text-[#F4F4F5]">Settings</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-[#1C1C1F] border border-[#2A2A2F]">
                  ⌘,
                </kbd>
              </motion.div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabClick("help")}
            title={!isHovered ? "Help & Shortcuts" : undefined}
            className="w-full h-9 rounded-md flex items-center transition-colors cursor-pointer px-2.5 text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#1C1C1F]"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="ml-3 flex items-center justify-between flex-1 overflow-hidden"
              >
                <span className="text-xs font-medium truncate text-[#F4F4F5]">Help</span>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#71717A] bg-[#1C1C1F] border border-[#2A2A2F]">
                  ?
                </kbd>
              </motion.div>
            )}
          </button>
        </div>
      </nav>

      {/* ── Overlay Flyout Panel for Boards / Templates / Files ── */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            ref={flyoutRef}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="fixed top-[52px] left-[56px] bottom-3 z-35 w-80 bg-[#171719] border border-[#2A2A2F] rounded-lg shadow-[0_12px_36px_-4px_rgba(0,0,0,0.5)] p-3 text-[#F4F4F5] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2A2A2F]">
              <span className="text-xs font-semibold capitalize text-[#F4F4F5]">
                {activeTab}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="p-1 rounded text-[#71717A] hover:text-[#F4F4F5] hover:bg-[#242428] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Boards Content */}
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
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-[#7C6CFF]/15 text-[#7C6CFF] hover:bg-[#7C6CFF]/25 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create new board</span>
                </button>

                <div className="pt-2 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider px-1">
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
                    className={`w-full text-left p-2 rounded-md transition-colors cursor-pointer group ${
                      b.title === currentBoardTitle
                        ? "bg-[#242428] font-medium"
                        : "hover:bg-[#1C1C1F]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#F4F4F5] truncate group-hover:text-[#7C6CFF]">
                        {b.title}
                      </span>
                      {b.title === currentBoardTitle && (
                        <Check className="w-3 h-3 text-[#7C6CFF] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#71717A]">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{b.updatedAt}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Templates Content */}
            {activeTab === "templates" && (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                <div className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider px-1 mb-1">
                  Ready-to-use Starters
                </div>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      onSelectTemplate?.(tmpl.id);
                      setActiveTab(null);
                    }}
                    className="w-full text-left p-2.5 rounded-md hover:bg-[#1C1C1F] border border-transparent hover:border-[#2A2A2F] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#F4F4F5] group-hover:text-[#7C6CFF]">
                        {tmpl.title}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#71717A] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-[#A1A1AA] mt-0.5 line-clamp-2">
                      {tmpl.desc}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#111113] text-[#71717A]">
                      {tmpl.category}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Files Content */}
            {activeTab === "files" && (
              <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-10 h-10 rounded-full bg-[#1C1C1F] border border-[#2A2A2F] flex items-center justify-center text-[#7C6CFF] mb-2">
                  <FileUp className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-[#F4F4F5]">Import files & docs</h4>
                <p className="text-[11px] text-[#A1A1AA] mt-1 mb-3">
                  Upload PDF specifications, system JSON topologies or PNG diagrams.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-md bg-[#7C6CFF] text-[#F4F4F5] hover:bg-[#635BFF] text-xs font-medium transition-colors cursor-pointer"
                >
                  Choose file
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

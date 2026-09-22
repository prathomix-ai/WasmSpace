"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Shapes,
  Square,
  Circle,
  Diamond,
  Cylinder,
  Folder,
  Copy,
  Clipboard,
  Boxes,
  Trash2,
  CheckSquare,
  Maximize2,
  Download,
  Server,
  Database,
  Cloud,
  Layers,
  FileText,
  StickyNote,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface CanvasContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onAddNode: (category?: string) => void;
  onAddShape?: (shape: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder") => void;
  onCopy: () => void;
  onPaste: () => void;
  onGroup: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onFitView?: () => void;
  onExportPNG: () => void;
  canCopy?: boolean;
  canPaste?: boolean;
  canDelete?: boolean;
  selectedCount?: number;
}

export default function CanvasContextMenu({
  isOpen,
  x,
  y,
  onClose,
  onAddNode,
  onAddShape,
  onCopy,
  onPaste,
  onGroup,
  onDelete,
  onSelectAll,
  onFitView,
  onExportPNG,
  canCopy = false,
  canPaste = false,
  canDelete = false,
  selectedCount = 0,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAddSubmenu, setShowAddSubmenu] = useState(false);
  const [showShapeSubmenu, setShowShapeSubmenu] = useState(false);
  const [adjustedPos, setAdjustedPos] = useState({ left: x, top: y });

  // Clamp position to viewport so menu never renders off-screen
  useEffect(() => {
    if (!isOpen) {
      setShowAddSubmenu(false);
      setShowShapeSubmenu(false);
      return;
    }

    const menuWidth = 240;
    const menuHeight = 360;
    const padding = 16;

    let left = x;
    let top = y;

    if (left + menuWidth > window.innerWidth - padding) {
      left = Math.max(padding, x - menuWidth);
    }
    if (top + menuHeight > window.innerHeight - padding) {
      top = Math.max(padding, y - menuHeight);
    }

    setAdjustedPos({ left, top });
  }, [x, y, isOpen]);

  // Click outside listener and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nodeSubmenuOptions = [
    {
      id: "service",
      label: "Compute Microservice",
      desc: "Async compute worker",
      icon: <Server className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      id: "database",
      label: "Database Cluster",
      desc: "ACID persistent store",
      icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: "cloud",
      label: "Cloud Edge Gateway",
      desc: "WAF & ingress routing",
      icon: <Cloud className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      id: "box",
      label: "Container Pod Mesh",
      desc: "Kubernetes pod cluster",
      icon: <Layers className="w-3.5 h-3.5 text-purple-400" />,
    },
    {
      id: "text",
      label: "Spec Architecture Note",
      desc: "SLA boundary doc",
      icon: <FileText className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: "stickyNote",
      label: "Task Sticky Note",
      desc: "P0 deployment reminder",
      icon: <StickyNote className="w-3.5 h-3.5 text-rose-400" />,
    },
  ];

  const shapeSubmenuOptions: Array<{
    id: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder";
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "rectangle",
      label: "Rectangle Block",
      desc: "Compute block / service",
      icon: <Square className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      id: "circle",
      label: "Circle Endpoint",
      desc: "API gateway / ingress",
      icon: <Circle className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: "diamond",
      label: "Decision Diamond",
      desc: "Rule branch / condition",
      icon: <Diamond className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: "cylinder",
      label: "Database Cylinder",
      desc: "Transactional data store",
      icon: <Cylinder className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      id: "cloud",
      label: "Cloud Region",
      desc: "VPC cloud boundary",
      icon: <Cloud className="w-3.5 h-3.5 text-indigo-400" />,
    },
    {
      id: "folder",
      label: "Project Subnet",
      desc: "Logical namespace group",
      icon: <Folder className="w-3.5 h-3.5 text-purple-400" />,
    },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] pointer-events-none"
        style={{ width: "100vw", height: "100vh" }}
      >
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.94, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -4 }}
          transition={{ duration: 0.14, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: adjustedPos.left,
            top: adjustedPos.top,
          }}
          className="pointer-events-auto min-w-[240px] rounded-xl bg-[#131418] border border-zinc-800 p-1.5 shadow-2xl text-zinc-100 select-none relative z-50 font-sans"
        >
          {/* ── Context Menu Header Pill ── */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-zinc-800 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Canvas Options
            </span>
            {selectedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
                {selectedCount} Selected
              </span>
            )}
          </div>

          {/* ── 1. Add Architecture Node (With Hover Submenu) ── */}
          <div
            className="relative"
            onMouseEnter={() => {
              setShowAddSubmenu(true);
              setShowShapeSubmenu(false);
            }}
            onMouseLeave={() => setShowAddSubmenu(false)}
          >
            <button
              type="button"
              onClick={() => {
                onAddNode("service");
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-blue-400">
                  <PlusCircle className="w-3.5 h-3.5" />
                </div>
                <span>Add Node</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
            </button>

            {/* Nested Sleek Node Preset Submenu */}
            <AnimatePresence>
              {showAddSubmenu && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-full top-0 ml-1.5 min-w-[210px] rounded-xl bg-[#131418] border border-zinc-800 p-1.5 shadow-2xl z-50 flex flex-col gap-0.5"
                >
                  <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 mb-1 font-medium">
                    Select Blueprint Type
                  </div>
                  {nodeSubmenuOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onAddNode(opt.id);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent transition-all group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {opt.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-200 group-hover:text-white">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {opt.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── 2. Add Whiteboard Shape (With Hover Submenu) ── */}
          {onAddShape && (
            <div
              className="relative"
              onMouseEnter={() => {
                setShowShapeSubmenu(true);
                setShowAddSubmenu(false);
              }}
              onMouseLeave={() => setShowShapeSubmenu(false)}
            >
              <button
                type="button"
                onClick={() => {
                  onAddShape("rectangle");
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-blue-400">
                    <Shapes className="w-3.5 h-3.5" />
                  </div>
                  <span>Add Shape</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              </button>

              {/* Nested Shapes Submenu */}
              <AnimatePresence>
                {showShapeSubmenu && (
                  <motion.div
                    initial={{ opacity: 0, x: -6, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -6, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-full top-0 ml-1.5 min-w-[210px] rounded-xl bg-[#131418] border border-zinc-800 p-1.5 shadow-2xl z-50 flex flex-col gap-0.5"
                  >
                    <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 mb-1 font-medium">
                      Choose Shape
                    </div>
                    {shapeSubmenuOptions.map((shp) => (
                      <button
                        key={shp.id}
                        type="button"
                        onClick={() => {
                          onAddShape(shp.id);
                          onClose();
                        }}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent transition-all group cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          {shp.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-200 group-hover:text-white">
                            {shp.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {shp.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="my-1 border-t border-white/5" />

          {/* ── 3. Copy ── */}
          <button
            type="button"
            disabled={!canCopy}
            onClick={() => {
              if (canCopy) {
                onCopy();
                onClose();
              }
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium border border-transparent transition-all ${
              canCopy
                ? "text-zinc-200 hover:text-white hover:bg-indigo-500/15 hover:border-indigo-500/30 cursor-pointer group"
                : "text-zinc-600 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  canCopy
                    ? "bg-indigo-500/15 border border-indigo-400/30 text-indigo-400 group-hover:scale-110 transition-transform"
                    : "bg-white/5 text-zinc-600"
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
              </div>
              <span>Copy</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
              Ctrl+C
            </kbd>
          </button>

          {/* ── 4. Paste ── */}
          <button
            type="button"
            disabled={!canPaste}
            onClick={() => {
              if (canPaste) {
                onPaste();
                onClose();
              }
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium border border-transparent transition-all ${
              canPaste
                ? "text-zinc-200 hover:text-white hover:bg-emerald-500/15 hover:border-emerald-500/30 cursor-pointer group"
                : "text-zinc-600 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                  canPaste
                    ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 group-hover:scale-110 transition-transform"
                    : "bg-white/5 text-zinc-600"
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
              </div>
              <span>Paste Here</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
              Ctrl+V
            </kbd>
          </button>

          {/* ── 5. Group into Subnet ── */}
          <button
            type="button"
            onClick={() => {
              onGroup();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-purple-500/15 hover:border-purple-500/30 border border-transparent transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Boxes className="w-3.5 h-3.5" />
              </div>
              <span>Group</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
              Ctrl+G
            </kbd>
          </button>

          {/* ── 6. Delete Selected ── */}
          {onDelete && (
            <button
              type="button"
              disabled={!canDelete}
              onClick={() => {
                if (canDelete) {
                  onDelete();
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium border border-transparent transition-all ${
                canDelete
                  ? "text-rose-300 hover:text-rose-100 hover:bg-rose-500/15 hover:border-rose-500/30 cursor-pointer group"
                  : "text-zinc-600 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    canDelete
                      ? "bg-rose-500/15 border border-rose-400/30 text-rose-400 group-hover:scale-110 transition-transform"
                      : "bg-white/5 text-zinc-600"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
                <span>Delete</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
                Del
              </kbd>
            </button>
          )}

          {/* ── Divider ── */}
          <div className="my-1 border-t border-white/5" />

          {/* ── 7. Select All ── */}
          {onSelectAll && (
            <button
              type="button"
              onClick={() => {
                onSelectAll();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <span>Select All</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
                Ctrl+A
              </kbd>
            </button>
          )}

          {/* ── 8. Zoom to Fit ── */}
          {onFitView && (
            <button
              type="button"
              onClick={() => {
                onFitView();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-3.5 h-3.5" />
                </div>
                <span>Zoom to Fit</span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-mono text-zinc-400">
                F
              </kbd>
            </button>
          )}

          {/* ── 9. Export as PNG ── */}
          <button
            type="button"
            onClick={() => {
              onExportPNG();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors group cursor-pointer mt-0.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-blue-400">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">Export as PNG</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-medium uppercase">
              PNG
            </span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

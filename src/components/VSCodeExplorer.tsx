"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type BoardFileNode } from "@/types/explorer";
import { renderPdfFileToImages, type RenderedPdfPage } from "@/lib/pdfImporter";

interface VSCodeExplorerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  nodes: BoardFileNode[];
  activeFileId: string | null;
  onSelectFile: (file: BoardFileNode) => void;
  onCreateFile: (parentId: string | null, name: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onRenameNode: (id: string, newName: string) => void;
  onDeleteNode: (id: string) => void;
  onImportPdfPages: (pages: RenderedPdfPage[], fileName: string) => void;
  leftOffset?: number;
}

export default function VSCodeExplorer({
  isOpen,
  onToggleOpen,
  nodes,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRenameNode,
  onDeleteNode,
  onImportPdfPages,
  leftOffset = 252,
}: VSCodeExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const folderIds = new Set<string>();
    const collectFolderIds = (items: BoardFileNode[]) => {
      items?.forEach((item) => {
        if (item.type === "folder") {
          folderIds.add(item.id);
          if (item.children) collectFolderIds(item.children);
        }
      });
    };
    collectFolderIds(nodes);
    return folderIds;
  });
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startRename = (node: BoardFileNode, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRenamingId(node.id);
    setRenameValue(node.name);
  };

  const submitRename = (id: string) => {
    if (renameValue.trim()) {
      onRenameNode(id, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 25MB file size limit
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert(`File "${file.name}" exceeds the 25MB size limit. Please upload a file under 25MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsImportingPdf(true);
      setImportProgress({ current: 0, total: 1 });

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      let targetFile = file;

      if (fileExt !== "pdf") {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/convert-document", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Could not convert .${fileExt} document.`);
        }

        const pdfBlob = await res.blob();
        targetFile = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, "") + ".pdf", {
          type: "application/pdf",
        });
      }

      const pages = await renderPdfFileToImages(targetFile, (current, total) => {
        setImportProgress({ current, total });
      });

      onImportPdfPages(pages, file.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Could not import document: ${msg}`);
    } finally {
      setIsImportingPdf(false);
      setImportProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Render individual tree node recursively
  const renderNode = (node: BoardFileNode, depth: number = 0) => {
    const isFolder = node.type === "folder";
    const isExpanded = expandedFolders.has(node.id);
    const isActive = node.id === activeFileId;
    const isRenaming = renamingId === node.id;

    return (
      <div key={node.id} className="select-none text-xs">
        <div
          className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
            isActive
              ? "bg-blue-500/10 text-blue-400 border-l-2 border-blue-500 font-medium"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
            } else {
              onSelectFile(node);
            }
          }}
          onDoubleClick={(e) => startRename(node, e)}
        >
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isFolder ? (
              <span className="text-[10px] text-zinc-500 transition-transform duration-150 inline-block w-3 text-center">
                {isExpanded ? "▼" : "▶"}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 w-3" />
            )}

            <span className="text-sm">
              {isFolder ? (isExpanded ? "📂" : "📁") : "📄"}
            </span>

            {isRenaming ? (
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(node.id);
                  if (e.key === "Escape") setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 text-white border border-blue-500 rounded px-1.5 py-0.5 text-xs outline-none w-full"
              />
            ) : (
              <span className="truncate font-mono text-[11px] tracking-tight">
                {node.name}
              </span>
            )}
          </div>

          {/* Right: Hover action icons */}
          <div className="hidden group-hover:flex items-center gap-1 text-[11px] text-zinc-400">
            {isFolder && (
              <button
                className="p-1 hover:text-white hover:bg-zinc-700 rounded"
                title="New Board in Folder"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateFile(node.id, "Untitled Board");
                }}
              >
                +
              </button>
            )}
            <button
              className="p-1 hover:text-amber-300 hover:bg-zinc-700 rounded"
              title="Rename"
              onClick={(e) => startRename(node, e)}
            >
              ✎
            </button>
            <button
              className="p-1 hover:text-rose-400 hover:bg-zinc-700 rounded"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.name}?`)) onDeleteNode(node.id);
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Children (if folder expanded) */}
        {isFolder && isExpanded && node.children && (
          <div className="border-l border-zinc-800/80 ml-3">
            {node.children.length === 0 ? (
              <div
                className="py-1 text-[10px] text-zinc-600 italic"
                style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
              >
                Empty folder
              </div>
            ) : (
              node.children.map((child) => renderNode(child, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed top-4 bottom-4 z-40 flex pointer-events-none transition-all duration-300"
          style={{ left: `${leftOffset}px` }}
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 270, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full bg-[#121316]/98 backdrop-blur-2xl border border-zinc-800 rounded-2xl flex flex-col overflow-hidden pointer-events-auto shadow-2xl"
          >
            {/* Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200 tracking-tight font-sans">
                  Project Explorer
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">
                  WORKSPACE
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onCreateFile(null, "New Board")}
                  className="p-1 hover:text-white hover:bg-zinc-800 rounded text-zinc-400 text-xs"
                  title="New Board File"
                >
                  📄+
                </button>
                <button
                  onClick={() => onCreateFolder(null, "New Folder")}
                  className="p-1 hover:text-white hover:bg-zinc-800 rounded text-zinc-400 text-xs"
                  title="New Folder"
                >
                  📁+
                </button>
                <button
                  onClick={onToggleOpen}
                  className="p-1 hover:text-white hover:bg-zinc-800 rounded text-zinc-400 text-xs"
                  title="Collapse Sidebar"
                >
                  ◀
                </button>
              </div>
            </div>

            {/* Hidden File Input for Universal Documents */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.pptx,.ppt"
              className="hidden"
              onChange={handlePdfUpload}
            />

            {/* Universal Document Import Card */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/20">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingPdf}
                className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <span>{isImportingPdf ? "⏳" : "📥"}</span>
                <span>{isImportingPdf ? "Synthesizing Document..." : "Import Document (PDF/Office)"}</span>
              </button>

              {isImportingPdf && importProgress && (
                <div className="mt-2 text-[10px] text-zinc-400">
                  <div className="flex justify-between mb-1">
                    <span>Converting pages...</span>
                    <span>{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{
                        width: `${(importProgress.current / Math.max(1, importProgress.total)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tree View List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center justify-between">
                <span>Boards & Diagrams</span>
                <span>{nodes.length} items</span>
              </div>
              {nodes.map((node) => renderNode(node, 0))}
            </div>

            {/* Bottom Footer / Storage Status */}
            <div className="p-2.5 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between font-mono bg-zinc-950/40">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Local Sync</span>
              </div>
              <span>v2.4 MasmSpace</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

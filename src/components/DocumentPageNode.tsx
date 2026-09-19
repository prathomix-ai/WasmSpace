"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import {
  FileText,
  Presentation,
  Image as ImageIcon,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
} from "lucide-react";

export interface DocumentPageNodeData {
  imageUrl: string;
  fileName: string;
  pageNumber: number;
  totalPages: number;
  width?: number;
  height?: number;
  isLocked?: boolean;
  fileType?: "pdf" | "docx" | "pptx" | "image" | string;
}

export const DocumentPageNode = memo(function DocumentPageNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = (data || {}) as unknown as DocumentPageNodeData;
  const { setNodes } = useReactFlow();
  const [isLocked, setIsLocked] = useState(nodeData.isLocked !== false);

  const isPresentation =
    nodeData.fileType === "pptx" ||
    nodeData.fileName?.toLowerCase().endsWith(".pptx") ||
    nodeData.fileName?.toLowerCase().endsWith(".ppt");
  const isImage =
    nodeData.fileType === "image" ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(nodeData.fileName || "");

  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              draggable: !nextLocked,
              data: { ...node.data, isLocked: nextLocked },
            }
          : node
      )
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  const handleOpenFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.imageUrl) {
      const w = window.open("");
      w?.document.write(
        `<title>${nodeData.fileName} - Page ${nodeData.pageNumber}</title><body style="margin:0;background:#09090b;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${nodeData.imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain;box-shadow:0 0 40px rgba(0,0,0,0.8);" /></body>`
      );
    }
  };

  const displayWidth = nodeData.width || 850;
  const displayHeight = nodeData.height;

  return (
    <div
      className={`group relative rounded-2xl bg-[#0e0e13]/95 border transition-all duration-200 shadow-2xl overflow-hidden select-none ${
        selected
          ? "border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_30px_rgba(6,182,212,0.25)]"
          : "border-white/10 hover:border-white/20"
      }`}
      style={{
        width: displayWidth,
        minWidth: 400,
      }}
    >
      {/* ── Document Page Header Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#14141b]/95 border-b border-white/10 text-xs backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-white/5 border border-white/10 text-cyan-400 shrink-0">
            {isPresentation ? (
              <Presentation className="w-3.5 h-3.5 text-amber-400" />
            ) : isImage ? (
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-purple-400" />
            )}
          </div>
          <span
            className="font-medium text-zinc-200 truncate max-w-[320px] font-sans"
            title={nodeData.fileName}
          >
            {nodeData.fileName || "Document Page"}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 shrink-0">
            {isPresentation ? "Slide" : "Page"} {nodeData.pageNumber || 1} of{" "}
            {nodeData.totalPages || 1}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleLock}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLocked
                ? "bg-amber-500/15 text-amber-300 border border-amber-400/30 hover:bg-amber-500/25"
                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title={
              isLocked
                ? "Page is locked (Cannot be accidentally dragged). Click to unlock."
                : "Page is unlocked. Click to lock position."
            }
          >
            {isLocked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenFull}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Open high-res page view"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete this page node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Document Page Render Body ── */}
      <div
        className="relative w-full bg-white flex items-center justify-center overflow-hidden"
        style={{
          minHeight: displayHeight ? `${displayHeight}px` : "auto",
        }}
      >
        {nodeData.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nodeData.imageUrl}
            alt={`${nodeData.fileName || "Page"} - Page ${nodeData.pageNumber || 1}`}
            className="w-full h-auto block select-none pointer-events-none"
            loading="lazy"
            style={{
              maxHeight: displayHeight || "none",
            }}
          />
        ) : (
          <div className="py-24 text-zinc-400 text-xs font-mono">
            Rendering document page…
          </div>
        )}

        {/* Lock Overlay Badge watermark */}
        {isLocked && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-[#09090b]/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            <span>Position Locked</span>
          </div>
        )}
      </div>

      {/* ── Connecting Handles ── */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-black"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-black"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-black"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-black"
      />
    </div>
  );
});

export default DocumentPageNode;

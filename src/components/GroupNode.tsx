"use client";

import React, { memo, useState } from "react";
import { NodeProps, NodeResizer, useReactFlow } from "@xyflow/react";
import { Boxes, Trash2, ShieldCheck } from "lucide-react";

export interface GroupNodeData {
  title?: string;
  subtitle?: string;
  category?: string;
  tags?: string[];
  color?: string;
  [key: string]: any;
}

function GroupNodeComponent({
  id,
  data,
  selected,
}: NodeProps) {
  const groupData = (data || {}) as GroupNodeData;
  const { setNodes } = useReactFlow();
  const [title, setTitle] = useState(groupData.title || "Architecture Cluster Zone");
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
  };

  return (
    <div className="relative w-full h-full min-w-[240px] min-h-[160px] rounded-3xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400/80 bg-gradient-to-b from-cyan-950/20 via-cyan-950/10 to-transparent backdrop-blur-[2px] transition-colors duration-200 group">
      <NodeResizer
        color="#06b6d4"
        isVisible={selected}
        minWidth={240}
        minHeight={160}
        lineClassName="!border-cyan-400"
        handleClassName="!w-3 !h-3 !bg-[#09090b] !border-2 !border-cyan-400 !rounded-full"
      />

      {/* ── Top Header Island ── */}
      <div className="absolute -top-4 left-4 flex items-center gap-2 pointer-events-auto select-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#09090b]/90 backdrop-blur-xl border border-cyan-500/40 shadow-[0_4px_20px_rgba(6,182,212,0.25)] text-white">
          <div className="w-5 h-5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Boxes className="w-3 h-3" />
          </div>

          {isEditing ? (
            <input
              type="text"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              className="bg-transparent text-xs font-semibold text-white border-b border-cyan-400 outline-none w-44 font-sans"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditing(true)}
              title="Double click to rename group"
              className="text-xs font-semibold text-white tracking-wide cursor-text hover:text-cyan-300 transition-colors font-sans"
            >
              {title}
            </span>
          )}

          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Group
          </span>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete Group Boundary"
            className="ml-1 p-1 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Bottom Right Badge ── */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-40 group-hover:opacity-80 transition-opacity select-none pointer-events-none">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-widest">
          Security Boundary
        </span>
      </div>
    </div>
  );
}

export const GroupNode = memo(GroupNodeComponent);
export default GroupNode;

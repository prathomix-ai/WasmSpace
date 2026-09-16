"use client";

import React, { memo, useState, useCallback, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow, NodeToolbar } from "@xyflow/react";
import {
  Server,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  Cloud,
  HardDrive,
  Zap,
  Globe,
  Radio,
  AlertTriangle,
  Flame,
  Type,
  Copy,
  Trash2,
} from "lucide-react";

export interface CustomTechNodeData {
  title: string;
  subtitle?: string;
  description?: string;
  category?:
    | "gateway"
    | "service"
    | "database"
    | "cache"
    | "ai"
    | "security"
    | "storage"
    | "queue"
    | string;
  icon?: string;
  status?: "active" | "healthy" | "warning" | "error" | "offline";
  metrics?: {
    latency?: string;
    throughput?: string;
    uptime?: string;
    version?: string;
  };
  tags?: string[];
  accentColor?: "cyan" | "indigo" | "emerald" | "amber" | "rose" | "purple";
  color?: string;
  [key: string]: any;
}

// ── 5 Circular Color Palette Definitions ─────────────────────────────────────
export const COLOR_PALETTE = [
  {
    color: "#0ea5e9",
    name: "Cyan",
    border: "border-[#0ea5e9]/70",
    selectedBorder: "border-[#0ea5e9] ring-1 ring-[#0ea5e9]/60",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.3)]",
    selectedGlow: "shadow-[0_0_28px_rgba(14,165,233,0.45)]",
    bg: "bg-[#18181b]/85 bg-gradient-to-b from-[#0ea5e9]/15 to-transparent",
    topLine: "from-transparent via-[#0ea5e9]/60 to-transparent",
    accentText: "text-[#0ea5e9]",
    handleBorder: "!border-[#0ea5e9]",
    handleShadow: "!shadow-[0_0_8px_rgba(14,165,233,0.8)]",
  },
  {
    color: "#10b981",
    name: "Emerald",
    border: "border-[#10b981]/70",
    selectedBorder: "border-[#10b981] ring-1 ring-[#10b981]/60",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    selectedGlow: "shadow-[0_0_28px_rgba(16,185,129,0.45)]",
    bg: "bg-[#18181b]/85 bg-gradient-to-b from-[#10b981]/15 to-transparent",
    topLine: "from-transparent via-[#10b981]/60 to-transparent",
    accentText: "text-[#10b981]",
    handleBorder: "!border-[#10b981]",
    handleShadow: "!shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  },
  {
    color: "#f43f5e",
    name: "Rose",
    border: "border-[#f43f5e]/70",
    selectedBorder: "border-[#f43f5e] ring-1 ring-[#f43f5e]/60",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
    selectedGlow: "shadow-[0_0_28px_rgba(244,63,94,0.45)]",
    bg: "bg-[#18181b]/85 bg-gradient-to-b from-[#f43f5e]/15 to-transparent",
    topLine: "from-transparent via-[#f43f5e]/60 to-transparent",
    accentText: "text-[#f43f5e]",
    handleBorder: "!border-[#f43f5e]",
    handleShadow: "!shadow-[0_0_8px_rgba(244,63,94,0.8)]",
  },
  {
    color: "#8b5cf6",
    name: "Purple",
    border: "border-[#8b5cf6]/70",
    selectedBorder: "border-[#8b5cf6] ring-1 ring-[#8b5cf6]/60",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    selectedGlow: "shadow-[0_0_28px_rgba(139,92,246,0.45)]",
    bg: "bg-[#18181b]/85 bg-gradient-to-b from-[#8b5cf6]/15 to-transparent",
    topLine: "from-transparent via-[#8b5cf6]/60 to-transparent",
    accentText: "text-[#8b5cf6]",
    handleBorder: "!border-[#8b5cf6]",
    handleShadow: "!shadow-[0_0_8px_rgba(139,92,246,0.8)]",
  },
  {
    color: "#f59e0b",
    name: "Amber",
    border: "border-[#f59e0b]/70",
    selectedBorder: "border-[#f59e0b] ring-1 ring-[#f59e0b]/60",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    selectedGlow: "shadow-[0_0_28px_rgba(245,158,11,0.45)]",
    bg: "bg-[#18181b]/85 bg-gradient-to-b from-[#f59e0b]/15 to-transparent",
    topLine: "from-transparent via-[#f59e0b]/60 to-transparent",
    accentText: "text-[#f59e0b]",
    handleBorder: "!border-[#f59e0b]",
    handleShadow: "!shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  },
];

const DEFAULT_THEME = {
  border: "border-white/10 hover:border-cyan-400/50",
  selectedBorder: "border-cyan-400/90 ring-1 ring-cyan-400/40",
  glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]",
  selectedGlow: "shadow-[0_0_28px_rgba(6,182,212,0.35)]",
  bg: "bg-[#18181b]/80",
  topLine: "from-transparent via-cyan-400/50 to-indigo-500/50",
  accentText: "text-cyan-400/80",
  handleBorder: "!border-cyan-400",
  handleShadow: "!shadow-[0_0_8px_rgba(6,182,212,0.8)]",
};

// Icon mapper for system components
const getCategoryIcon = (category?: string, iconName?: string) => {
  if (iconName) {
    switch (iconName.toLowerCase()) {
      case "server":
        return <Server className="w-4 h-4 text-cyan-400" />;
      case "database":
        return <Database className="w-4 h-4 text-emerald-400" />;
      case "shield":
        return <ShieldCheck className="w-4 h-4 text-indigo-400" />;
      case "cpu":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case "cloud":
        return <Cloud className="w-4 h-4 text-cyan-300" />;
      case "zap":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "globe":
        return <Globe className="w-4 h-4 text-blue-400" />;
      case "harddrive":
        return <HardDrive className="w-4 h-4 text-pink-400" />;
    }
  }

  switch (category?.toLowerCase()) {
    case "gateway":
      return <Globe className="w-4 h-4 text-cyan-400" />;
    case "database":
      return <Database className="w-4 h-4 text-emerald-400" />;
    case "cache":
      return <Flame className="w-4 h-4 text-amber-400" />;
    case "ai":
      return <Cpu className="w-4 h-4 text-indigo-400" />;
    case "security":
      return <ShieldCheck className="w-4 h-4 text-cyan-300" />;
    case "storage":
      return <HardDrive className="w-4 h-4 text-purple-400" />;
    case "queue":
      return <Radio className="w-4 h-4 text-blue-400" />;
    case "text":
    case "note":
      return <Type className="w-4 h-4 text-amber-400" />;
    case "service":
    default:
      return <Layers className="w-4 h-4 text-cyan-400" />;
  }
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "active":
    case "healthy":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Healthy
        </span>
      );
    case "warning":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-2.5 h-2.5" />
          Warning
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Degraded
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          Active
        </span>
      );
  }
};

const CustomTechNode = ({ id, data, selected }: NodeProps) => {
  const nodeData = (data || {}) as CustomTechNodeData;
  const category = nodeData.category || "service";

  const { updateNodeData, setNodes, setEdges, getNode } = useReactFlow();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    title: nodeData.title || "",
    subtitle: nodeData.subtitle || "",
    description: nodeData.description || "",
    latency: nodeData.metrics?.latency || "",
    throughput: nodeData.metrics?.throughput || "",
    uptime: nodeData.metrics?.uptime || "",
    version: nodeData.metrics?.version || "",
  });

  // Resolve dynamic color styling
  const activePaletteItem = COLOR_PALETTE.find(
    (p) =>
      p.color.toLowerCase() === nodeData.color?.toLowerCase() ||
      p.name.toLowerCase() === nodeData.color?.toLowerCase()
  );
  const theme = activePaletteItem || DEFAULT_THEME;

  // Keep local editing state synchronized with external data changes
  useEffect(() => {
    setEditValues({
      title: nodeData.title || "",
      subtitle: nodeData.subtitle || "",
      description: nodeData.description || "",
      latency: nodeData.metrics?.latency || "",
      throughput: nodeData.metrics?.throughput || "",
      uptime: nodeData.metrics?.uptime || "",
      version: nodeData.metrics?.version || "",
    });
  }, [nodeData]);

  // Persist updated values back to node data
  const handleSave = useCallback(() => {
    if (!editingField) return;

    if (editingField === "title") {
      const newTitle = editValues.title.trim() || nodeData.title || "Architecture Node";
      if (updateNodeData) {
        updateNodeData(id, { title: newTitle });
      } else {
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, title: newTitle } } : n))
        );
      }
    } else if (editingField === "subtitle") {
      const newSubtitle = editValues.subtitle.trim();
      if (updateNodeData) {
        updateNodeData(id, { subtitle: newSubtitle });
      } else {
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, subtitle: newSubtitle } } : n))
        );
      }
    } else if (editingField === "description") {
      const newDesc = editValues.description;
      if (updateNodeData) {
        updateNodeData(id, { description: newDesc });
      } else {
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, description: newDesc } } : n))
        );
      }
    } else if (editingField.startsWith("metric-")) {
      const metricKey = editingField.replace("metric-", "") as keyof NonNullable<CustomTechNodeData["metrics"]>;
      const newVal = editValues[metricKey]?.trim();
      const updatedMetrics = {
        ...(nodeData.metrics || {}),
        [metricKey]: newVal,
      };
      if (updateNodeData) {
        updateNodeData(id, { metrics: updatedMetrics });
      } else {
        setNodes((nds) =>
          nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, metrics: updatedMetrics } } : n))
        );
      }
    }

    setEditingField(null);
  }, [editingField, editValues, id, nodeData, updateNodeData, setNodes]);

  const handleCancel = useCallback(() => {
    setEditValues({
      title: nodeData.title || "",
      subtitle: nodeData.subtitle || "",
      description: nodeData.description || "",
      latency: nodeData.metrics?.latency || "",
      throughput: nodeData.metrics?.throughput || "",
      uptime: nodeData.metrics?.uptime || "",
      version: nodeData.metrics?.version || "",
    });
    setEditingField(null);
  }, [nodeData]);

  // Toolbar Actions: Color change, Duplicate, Delete
  const handleColorChange = useCallback(
    (newColor: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
                ...n,
                data: {
                  ...n.data,
                  color: newColor,
                },
              }
            : n
        )
      );
      if (updateNodeData) {
        updateNodeData(id, { color: newColor });
      }
    },
    [id, setNodes, updateNodeData]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const currentNode = getNode(id);
      if (!currentNode) return;

      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const clonedNode = {
        ...currentNode,
        id: newId,
        position: {
          x: currentNode.position.x + 32,
          y: currentNode.position.y + 32,
        },
        selected: true,
        data: {
          ...currentNode.data,
          title: `${nodeData.title || "Architecture Node"} (Copy)`,
        },
      };

      setNodes((nds) => [
        ...nds.map((n) => (n.id === id ? { ...n, selected: false } : n)),
        clonedNode,
      ]);
    },
    [id, getNode, setNodes, nodeData.title]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [id, setNodes, setEdges]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const renderMetric = (
    key: "latency" | "throughput" | "uptime" | "version",
    label: string,
    colorClass: string
  ) => {
    const value = nodeData.metrics?.[key];
    const isEditing = editingField === `metric-${key}`;

    if (value === undefined && !isEditing) return null;

    if (isEditing) {
      return (
        <div
          key={key}
          className="flex items-center justify-between bg-black/60 px-2 py-1 rounded-md border border-cyan-400/80 ring-1 ring-cyan-400/40"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-zinc-400 text-[10px]">{label}</span>
          <input
            type="text"
            autoFocus
            value={editValues[key]}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="nodrag nopan bg-black/90 text-white px-1.5 py-0.5 rounded border border-cyan-400/60 text-[11px] font-mono w-20 text-right outline-none ring-1 ring-cyan-400/40"
          />
        </div>
      );
    }

    return (
      <div
        key={key}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditingField(`metric-${key}`);
        }}
        title={`Double-click to edit ${label}`}
        className="flex items-center justify-between bg-black/30 hover:bg-black/60 hover:border-cyan-400/40 transition-colors px-2 py-1 rounded-md border border-white/5 cursor-text group/metric"
      >
        <span className="text-zinc-500">{label}</span>
        <span className={`${colorClass} font-medium group-hover/metric:text-white transition-colors`}>
          {value}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* ── Floating Node Context Toolbar (Only visible when node is selected) ── */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={12}
        className="flex items-center gap-2 p-2 rounded-xl bg-[#18181b]/90 backdrop-blur-xl border border-white/10 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 5 Circular Color Buttons (#0ea5e9, #10b981, #f43f5e, #8b5cf6, #f59e0b) */}
        <div className="flex items-center gap-1.5 px-0.5">
          {COLOR_PALETTE.map((opt) => {
            const isOptActive =
              nodeData.color?.toLowerCase() === opt.color.toLowerCase() ||
              nodeData.color?.toLowerCase() === opt.name.toLowerCase();
            return (
              <button
                key={opt.color}
                type="button"
                onClick={(e) => handleColorChange(opt.color, e)}
                title={opt.name}
                aria-label={`Set ${opt.name} color`}
                style={{ backgroundColor: opt.color }}
                className={`w-4 h-4 rounded-full transition-all duration-150 cursor-pointer ${
                  isOptActive
                    ? "ring-2 ring-offset-2 ring-offset-[#18181b] ring-white scale-125 shadow-md"
                    : "hover:scale-115 opacity-80 hover:opacity-100"
                }`}
              />
            );
          })}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-4 bg-white/15 mx-0.5" />

        {/* Action: Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          title="Duplicate node"
          aria-label="Duplicate node"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Action: Delete */}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/15 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </NodeToolbar>

      {/* ── Main Node Body with Dynamic Color Styling ── */}
      <div
        className={`relative group min-w-[240px] max-w-[320px] rounded-xl transition-all duration-200 backdrop-blur-md border ${
          editingField ? "select-text" : "select-none"
        } ${selected ? `${theme.selectedBorder} ${theme.selectedGlow}` : `${theme.border} ${theme.glow}`} ${
          theme.bg
        } text-white p-4`}
      >
        {/* Top Glass Glow Gradient Line */}
        <div
          className={`absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r ${theme.topLine} rounded-t-xl`}
        />

        {/* ── Multi-Directional React Flow Handles with Dynamic Color ── */}
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3 !h-3 !bg-[#09090b] !border-2 ${theme.handleBorder} !rounded-full transition-transform hover:!scale-125 ${theme.handleShadow} -top-1.5`}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3 !h-3 !bg-[#09090b] !border-2 ${theme.handleBorder} !rounded-full transition-transform hover:!scale-125 ${theme.handleShadow} -bottom-1.5`}
        />

        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2.5 !h-2.5 !bg-[#09090b] !border-2 !border-zinc-400 hover:!border-cyan-400 !rounded-full transition-transform hover:!scale-125 -left-1.5"
        />

        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2.5 !h-2.5 !bg-[#09090b] !border-2 !border-zinc-400 hover:!border-indigo-400 !rounded-full transition-transform hover:!scale-125 -right-1.5"
        />

        {/* ── Node Header ── */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-zinc-900/90 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-white/25 transition-colors">
              {getCategoryIcon(category, nodeData.icon)}
            </div>
            <div className="min-w-0 flex-1">
              {/* Editable Subtitle with dynamic accent text */}
              {editingField === "subtitle" ? (
                <input
                  type="text"
                  autoFocus
                  value={editValues.subtitle}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, subtitle: e.target.value }))}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="nodrag nopan w-full bg-black/80 border border-white/30 rounded px-1 py-0.5 text-[10px] font-mono font-semibold uppercase text-white outline-none ring-1 ring-white/30"
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingField("subtitle");
                  }}
                  title="Double-click to edit subtitle"
                  className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${theme.accentText} block truncate cursor-text hover:brightness-125 transition-all`}
                >
                  {nodeData.subtitle || category}
                </span>
              )}

              {/* Editable Title */}
              {editingField === "title" ? (
                <input
                  type="text"
                  autoFocus
                  value={editValues.title}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, title: e.target.value }))}
                  onBlur={handleSave}
                  onKeyDown={handleKeyDown}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="nodrag nopan w-full bg-black/80 border border-white/30 rounded px-1.5 py-0.5 text-sm font-semibold text-white outline-none ring-1 ring-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                />
              ) : (
                <h4
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingField("title");
                  }}
                  title="Double-click to edit title"
                  className="text-sm font-semibold text-zinc-100 tracking-tight truncate cursor-text hover:text-white transition-colors"
                >
                  {nodeData.title || "Architecture Node"}
                </h4>
              )}
            </div>
          </div>

          {/* Status Pill */}
          <div className="shrink-0">{getStatusBadge(nodeData.status)}</div>
        </div>

        {/* ── Editable Description ── */}
        {editingField === "description" ? (
          <div className="mb-3">
            <textarea
              autoFocus
              rows={2}
              value={editValues.description}
              onChange={(e) => setEditValues((prev) => ({ ...prev, description: e.target.value }))}
              onBlur={handleSave}
              onKeyDown={handleTextareaKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="nodrag nopan w-full bg-black/80 border border-white/30 rounded-md p-2 text-xs text-zinc-200 leading-relaxed outline-none ring-1 ring-white/30 shadow-[0_0_8px_rgba(255,255,255,0.15)] resize-none"
            />
            <span className="text-[9px] font-mono text-zinc-500 block -mt-1">
              Enter to save • Shift+Enter for new line • Esc to cancel
            </span>
          </div>
        ) : (
          <p
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingField("description");
            }}
            title="Double-click to edit description"
            className={`text-xs leading-relaxed mb-3 line-clamp-2 cursor-text transition-colors ${
              nodeData.description
                ? "text-zinc-400/90 hover:text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400 italic"
            }`}
          >
            {nodeData.description || "Double-click to add a description..."}
          </p>
        )}

        {/* ── Metrics / Telemetry Strip ── */}
        {nodeData.metrics && (
          <div className="mt-3 pt-2.5 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
            {renderMetric("latency", "Latency", "text-cyan-300")}
            {renderMetric("throughput", "Rate", "text-indigo-300")}
            {renderMetric("uptime", "Uptime", "text-emerald-400")}
            {renderMetric("version", "Ver", "text-zinc-300")}
          </div>
        )}

        {/* ── Tags / Stack Pills ── */}
        {nodeData.tags && nodeData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-white/5">
            {nodeData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default memo(CustomTechNode);


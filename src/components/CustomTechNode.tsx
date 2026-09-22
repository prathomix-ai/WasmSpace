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
  Square,
  Circle,
  Diamond,
  Cylinder,
  Folder,
} from "lucide-react";
import { SHAPE_LIBRARY } from "@/constants/shapeLibrary";

export interface CustomTechNodeData {
  title: string;
  subtitle?: string;
  description?: string;
  shape?: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder";
  category?:
    | "gateway"
    | "service"
    | "database"
    | "cache"
    | "ai"
    | "security"
    | "storage"
    | "queue"
    | "diamond"
    | "decision"
    | "cylinder"
    | "folder"
    | "cloud"
    | "circle"
    | "rectangle"
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
    color: "#2563eb",
    name: "Blue",
    border: "border-blue-300 dark:border-blue-500/60",
    selectedBorder: "border-blue-600 ring-2 ring-blue-500/30",
    glow: "shadow-sm hover:shadow-md",
    selectedGlow: "shadow-md shadow-blue-500/10",
    bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
    topLine: "from-transparent via-blue-500/50 to-transparent",
    accentText: "text-blue-600 dark:text-blue-400 font-semibold",
    handleBorder: "!border-blue-500",
    handleShadow: "!shadow-sm",
  },
  {
    color: "#16a34a",
    name: "Emerald",
    border: "border-emerald-300 dark:border-emerald-500/60",
    selectedBorder: "border-emerald-600 ring-2 ring-emerald-500/30",
    glow: "shadow-sm hover:shadow-md",
    selectedGlow: "shadow-md shadow-emerald-500/10",
    bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
    topLine: "from-transparent via-emerald-500/50 to-transparent",
    accentText: "text-emerald-600 dark:text-emerald-400 font-semibold",
    handleBorder: "!border-emerald-500",
    handleShadow: "!shadow-sm",
  },
  {
    color: "#dc2626",
    name: "Rose",
    border: "border-rose-300 dark:border-rose-500/60",
    selectedBorder: "border-rose-600 ring-2 ring-rose-500/30",
    glow: "shadow-sm hover:shadow-md",
    selectedGlow: "shadow-md shadow-rose-500/10",
    bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
    topLine: "from-transparent via-rose-500/50 to-transparent",
    accentText: "text-rose-600 dark:text-rose-400 font-semibold",
    handleBorder: "!border-rose-500",
    handleShadow: "!shadow-sm",
  },
  {
    color: "#7c3aed",
    name: "Purple",
    border: "border-purple-300 dark:border-purple-500/60",
    selectedBorder: "border-purple-600 ring-2 ring-purple-500/30",
    glow: "shadow-sm hover:shadow-md",
    selectedGlow: "shadow-md shadow-purple-500/10",
    bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
    topLine: "from-transparent via-purple-500/50 to-transparent",
    accentText: "text-purple-600 dark:text-purple-400 font-semibold",
    handleBorder: "!border-purple-500",
    handleShadow: "!shadow-sm",
  },
  {
    color: "#ea580c",
    name: "Amber",
    border: "border-amber-300 dark:border-amber-500/60",
    selectedBorder: "border-amber-600 ring-2 ring-amber-500/30",
    glow: "shadow-sm hover:shadow-md",
    selectedGlow: "shadow-md shadow-amber-500/10",
    bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
    topLine: "from-transparent via-amber-500/50 to-transparent",
    accentText: "text-amber-600 dark:text-amber-400 font-semibold",
    handleBorder: "!border-amber-500",
    handleShadow: "!shadow-sm",
  },
];

const DEFAULT_THEME = {
  border: "border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-zinc-600",
  selectedBorder: "border-blue-500 ring-2 ring-blue-500/30",
  glow: "shadow-sm hover:shadow-md",
  selectedGlow: "shadow-lg shadow-blue-500/10",
  bg: "bg-white/95 dark:bg-[#18181b]/95 text-slate-800 dark:text-zinc-100",
  topLine: "from-transparent via-blue-500/40 to-transparent",
  accentText: "text-blue-600 dark:text-blue-400 font-semibold",
  handleBorder: "!border-blue-500",
  handleShadow: "!shadow-sm",
};

// Icon mapper for system components
const getCategoryIcon = (category?: string, iconName?: string) => {
  if (iconName) {
    const shapeDef = SHAPE_LIBRARY.find(
      (s) => s.id.toLowerCase() === iconName.toLowerCase()
    );
    if (shapeDef) {
      const IconComponent = shapeDef.icon;
      return <IconComponent className={`w-4 h-4 ${shapeDef.color || "text-blue-500 dark:text-blue-400"}`} />;
    }

    switch (iconName.toLowerCase()) {
      case "server":
        return <Server className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case "database":
        return <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case "shield":
        return <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
      case "cpu":
        return <Cpu className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case "cloud":
        return <Cloud className="w-4 h-4 text-sky-500 dark:text-sky-400" />;
      case "zap":
        return <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case "globe":
        return <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case "harddrive":
        return <HardDrive className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
    }
  }

  // Check if category matches a shape in SHAPE_LIBRARY
  if (category) {
    const shapeByCategory = SHAPE_LIBRARY.find(
      (s) => s.id.toLowerCase() === category.toLowerCase()
    );
    if (shapeByCategory) {
      const IconComponent = shapeByCategory.icon;
      return <IconComponent className={`w-4 h-4 ${shapeByCategory.color || "text-blue-500 dark:text-blue-400"}`} />;
    }
  }

  switch (category?.toLowerCase()) {
    case "diamond":
    case "decision":
      return <Diamond className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    case "cylinder":
    case "database":
      return <Cylinder className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    case "cloud":
      return <Cloud className="w-4 h-4 text-sky-500 dark:text-sky-400" />;
    case "folder":
      return <Folder className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
    case "circle":
      return <Circle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    case "rectangle":
      return <Square className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
    case "gateway":
      return <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    case "cache":
      return <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    case "ai":
      return <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
    case "security":
      return <ShieldCheck className="w-4 h-4 text-sky-500 dark:text-sky-400" />;
    case "storage":
      return <HardDrive className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
    case "queue":
      return <Radio className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    case "text":
    case "note":
      return <Type className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
    case "service":
    default:
      return <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
  }
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "active":
    case "healthy":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Healthy
        </span>
      );
    case "warning":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
          <AlertTriangle className="w-2.5 h-2.5" />
          Warning
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Degraded
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
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
          className="flex items-center justify-between bg-white dark:bg-black/60 px-2 py-1 rounded-md border border-blue-500/80 ring-1 ring-blue-500/40"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-slate-500 dark:text-zinc-400 text-[10px]">{label}</span>
          <input
            type="text"
            autoFocus
            value={editValues[key]}
            onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="nodrag nopan bg-slate-50 dark:bg-black/90 text-slate-900 dark:text-white px-1.5 py-0.5 rounded border border-slate-300 dark:border-zinc-700 text-[11px] font-mono w-20 text-right outline-none ring-1 ring-blue-500/40"
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
        className="flex items-center justify-between bg-slate-50 dark:bg-black/30 hover:bg-slate-100 dark:hover:bg-black/60 hover:border-blue-400/50 dark:hover:border-zinc-700 transition-colors px-2 py-1 rounded-md border border-slate-200/70 dark:border-white/5 cursor-text group/metric"
      >
        <span className="text-slate-500 dark:text-zinc-500">{label}</span>
        <span className={`${colorClass} font-medium group-hover/metric:text-slate-900 dark:group-hover/metric:text-white transition-colors`}>
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
        className="flex items-center gap-2 p-1.5 rounded-xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 5 Circular Color Buttons */}
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
                    ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#18181b] ring-slate-900 dark:ring-white scale-125 shadow-md"
                    : "hover:scale-115 opacity-80 hover:opacity-100"
                }`}
              />
            );
          })}
        </div>

        {/* Visual Divider */}
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/15 mx-0.5" />

        {/* Action: Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          title="Duplicate node"
          aria-label="Duplicate node"
          className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Action: Delete */}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete node"
          aria-label="Delete node"
          className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all duration-150 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </NodeToolbar>

      {/* ── Main Node Body with Dynamic Color Styling & Shape Contours ── */}
      <div
        className={`relative group min-w-[240px] max-w-[320px] ${
          (nodeData.shape === "circle" || category === "circle")
            ? "rounded-3xl"
            : (nodeData.shape === "diamond" || category === "diamond" || category === "decision")
            ? "rounded-2xl border-amber-500/40"
            : (nodeData.shape === "folder" || category === "folder")
            ? "rounded-xl pt-5"
            : "rounded-xl"
        } transition-all duration-200 backdrop-blur-md border ${
          editingField ? "select-text" : "select-none"
        } ${selected ? `${theme.selectedBorder} ${theme.selectedGlow}` : `${theme.border} ${theme.glow}`} ${
          theme.bg
        } p-4`}
      >
        {/* Top Folder Tab when shape is folder */}
        {(nodeData.shape === "folder" || category === "folder") && (
          <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-t-md bg-slate-100 dark:bg-[#181820] border-t border-x border-slate-200 dark:border-white/20 text-[9px] font-mono text-indigo-600 dark:text-indigo-300 flex items-center gap-1 shadow-sm">
            <Folder className="w-2.5 h-2.5" />
            <span>Folder / Subnet</span>
          </div>
        )}

        {/* Cylinder Database top oval contour when shape is cylinder */}
        {(nodeData.shape === "cylinder" || category === "cylinder" || category === "database") && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-emerald-500/30 blur-[1px]" />
        )}

        {/* Top Accent Line */}
        <div
          className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${theme.topLine} rounded-t-xl`}
        />

        {/* ── Multi-Directional React Flow Handles with Dynamic Color ── */}
        <Handle
          type="target"
          position={Position.Top}
          className={`!w-3 !h-3 !bg-white dark:!bg-[#09090b] !border-2 ${theme.handleBorder} !rounded-full transition-transform hover:!scale-125 ${theme.handleShadow} -top-1.5`}
        />

        <Handle
          type="source"
          position={Position.Bottom}
          className={`!w-3 !h-3 !bg-white dark:!bg-[#09090b] !border-2 ${theme.handleBorder} !rounded-full transition-transform hover:!scale-125 ${theme.handleShadow} -bottom-1.5`}
        />

        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-slate-300 dark:!border-zinc-500 hover:!border-blue-500 !rounded-full transition-transform hover:!scale-125 -left-1.5"
        />

        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-slate-300 dark:!border-zinc-500 hover:!border-blue-500 !rounded-full transition-transform hover:!scale-125 -right-1.5"
        />

        {/* ── Node Header ── */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900/90 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:border-slate-300 dark:group-hover:border-white/25 transition-colors">
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
                  className="nodrag nopan w-full bg-white dark:bg-black/80 border border-slate-300 dark:border-white/30 rounded px-1 py-0.5 text-[10px] font-mono font-semibold uppercase text-slate-900 dark:text-white outline-none ring-1 ring-blue-500/40"
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingField("subtitle");
                  }}
                  title="Double-click to edit subtitle"
                  className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${theme.accentText} block truncate cursor-text hover:opacity-80 transition-all`}
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
                  className="nodrag nopan w-full bg-white dark:bg-black/80 border border-slate-300 dark:border-white/30 rounded px-1.5 py-0.5 text-sm font-semibold text-slate-900 dark:text-white outline-none ring-1 ring-blue-500/40 shadow-sm"
                />
              ) : (
                <h4
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setEditingField("title");
                  }}
                  title="Double-click to edit title"
                  className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-tight truncate cursor-text hover:text-blue-600 dark:hover:text-white transition-colors"
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
              className="nodrag nopan w-full bg-white dark:bg-black/80 border border-slate-300 dark:border-white/30 rounded-md p-2 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed outline-none ring-1 ring-blue-500/40 shadow-sm resize-none"
            />
            <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 block -mt-1">
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
                ? "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                : "text-slate-400 dark:text-zinc-600 hover:text-slate-600 dark:hover:text-zinc-400 italic"
            }`}
          >
            {nodeData.description || "Double-click to add a description..."}
          </p>
        )}

        {/* ── Metrics / Telemetry Strip ── */}
        {nodeData.metrics && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
            {renderMetric("latency", "Latency", "text-blue-600 dark:text-cyan-300")}
            {renderMetric("throughput", "Rate", "text-indigo-600 dark:text-indigo-300")}
            {renderMetric("uptime", "Uptime", "text-emerald-600 dark:text-emerald-400")}
            {renderMetric("version", "Ver", "text-slate-600 dark:text-zinc-300")}
          </div>
        )}

        {/* ── Tags / Stack Pills ── */}
        {nodeData.tags && nodeData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
            {nodeData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 text-slate-600 dark:text-zinc-400"
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


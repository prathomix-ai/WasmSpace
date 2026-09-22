"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  NodeToolbar,
  NodeResizer,
} from "@xyflow/react";
import { Copy, Trash2, Paintbrush, Waypoints } from "lucide-react";
import { SHAPE_LIBRARY } from "@/constants/shapeLibrary";

export type ShapeFillMode = "tint" | "solid" | "outline";

export interface ShapeNodeData {
  shapeType: string;
  shapeStyle?: string;
  label?: string;
  color?: string;
  fillMode?: ShapeFillMode;
  category?: string;
  hasHandles?: boolean;
  [key: string]: any;
}

export const SHAPE_PALETTE = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Emerald", color: "#10b981" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Rose", color: "#f43f5e" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Slate", color: "#64748b" },
];

function ShapeNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = (data || {}) as ShapeNodeData;
  const { setNodes, setEdges, getNode } = useReactFlow();

  const [label, setLabel] = useState(nodeData.label || "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeColor = nodeData.color || "#3b82f6";
  const fillMode: ShapeFillMode = nodeData.fillMode || "tint";
  const shapeType = (nodeData.shapeType || nodeData.shapeStyle || "rectangle").toLowerCase();
  const hasHandles = nodeData.hasHandles !== false;

  useEffect(() => {
    if (nodeData.label !== undefined) {
      setLabel(nodeData.label);
    }
  }, [nodeData.label]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isEditing]);

  const handleSaveText = useCallback(() => {
    setIsEditing(false);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label: label.trim() } } : n
      )
    );
  }, [id, label, setNodes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveText();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setLabel(nodeData.label || "");
    }
  };

  const handleColorChange = useCallback(
    (newColor: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, color: newColor } } : n
        )
      );
    },
    [id, setNodes]
  );

  const handleFillModeToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const nextMode: Record<ShapeFillMode, ShapeFillMode> = {
        tint: "solid",
        solid: "outline",
        outline: "tint",
      };
      const newMode = nextMode[fillMode] || "tint";
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, fillMode: newMode } } : n
        )
      );
    },
    [id, fillMode, setNodes]
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
          x: currentNode.position.x + 36,
          y: currentNode.position.y + 36,
        },
        selected: true,
        data: {
          ...currentNode.data,
          label: `${nodeData.label || "Shape"} (Copy)`,
        },
      };

      setNodes((nds) => [
        ...nds.map((n) => (n.id === id ? { ...n, selected: false } : n)),
        clonedNode,
      ]);
    },
    [id, getNode, setNodes, nodeData.label]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [id, setNodes, setEdges]
  );

  // Compute fill and stroke colors
  const strokeColor = activeColor;
  let fillColor = "transparent";
  let textColor = "#0f172a"; // fallback dark text for light theme

  if (fillMode === "tint") {
    fillColor = `${activeColor}22`; // ~13% opacity
  } else if (fillMode === "solid") {
    fillColor = activeColor;
    textColor = "#ffffff";
  }

  // Look up icon in SHAPE_LIBRARY if it is an icon-based shape
  const shapeDef = SHAPE_LIBRARY.find(
    (s) => s.id.toLowerCase() === shapeType || s.label.toLowerCase() === shapeType
  );
  const IconComponent = shapeDef?.icon;

  // Render SVG or HTML based on shape type
  const renderShapeGeometry = () => {
    switch (shapeType) {
      case "circle":
        return (
          <div
            className="w-full h-full rounded-full transition-colors duration-150"
            style={{
              backgroundColor: fillColor,
              borderColor: strokeColor,
              borderWidth: "2.5px",
              borderStyle: "solid",
            }}
          />
        );

      case "rectangle":
      case "square":
      case "box":
        return (
          <div
            className="w-full h-full rounded-2xl transition-colors duration-150"
            style={{
              backgroundColor: fillColor,
              borderColor: strokeColor,
              borderWidth: "2.5px",
              borderStyle: "solid",
            }}
          />
        );

      case "diamond":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,3 97,50 50,97 3,50"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "triangle":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,4 96,96 4,96"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "cylinder":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Cylinder body */}
            <path
              d="M 6,20 V 80 A 44,14 0 0,0 94,80 V 20 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            {/* Cylinder bottom contour */}
            <path
              d="M 6,80 A 44,14 0 0,0 94,80"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            {/* Cylinder top cap */}
            <ellipse
              cx="50"
              cy="20"
              rx="44"
              ry="14"
              fill={fillMode === "solid" ? activeColor : fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
            />
          </svg>
        );

      case "cloud":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 28,68 A 18,18 0 0,1 25,36 A 24,24 0 0,1 65,30 A 20,20 0 0,1 85,50 A 18,18 0 0,1 78,74 A 12,12 0 0,1 28,68 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "star":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,3 64,36 99,36 71,58 82,92 50,71 18,92 29,58 1,36 36,36"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "hexagon":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="25,4 75,4 97,50 75,96 25,96 3,50"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "pentagon":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,3 97,38 79,97 21,97 3,38"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "octagon":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "heart":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 50,30 A 20,20 0 0,0 12,50 C 12,74 50,95 50,95 C 50,95 88,74 88,50 A 20,20 0 0,0 50,30 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      default:
        // Default clean whiteboard card / symbol shape
        return (
          <div
            className="w-full h-full rounded-2xl transition-colors duration-150"
            style={{
              backgroundColor: fillColor,
              borderColor: strokeColor,
              borderWidth: "2.5px",
              borderStyle: "solid",
            }}
          />
        );
    }
  };

  return (
    <div
      className={`relative select-none group w-full h-full min-w-[70px] min-h-[70px] flex items-center justify-center transition-all ${
        selected ? "drop-shadow-lg" : "hover:drop-shadow-sm"
      }`}
    >
      {/* ── Resizer Handles: Active when selected ── */}
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={60}
        lineClassName="!border-blue-500/80"
        handleClassName="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-blue-500 !rounded-full"
      />

      {/* ── Context Toolbar (Color palette, fill mode, duplicate, delete) ── */}
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={12}
        className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Colors */}
        <div className="flex items-center gap-1 px-0.5">
          {SHAPE_PALETTE.map((opt) => (
            <button
              key={opt.color}
              type="button"
              onClick={(e) => handleColorChange(opt.color, e)}
              title={opt.name}
              aria-label={`Set ${opt.name} color`}
              style={{ backgroundColor: opt.color }}
              className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                activeColor.toLowerCase() === opt.color.toLowerCase()
                  ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-125"
                  : "hover:scale-115 opacity-80 hover:opacity-100"
              }`}
            />
          ))}
        </div>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/15 mx-0.5" />

        {/* Fill mode toggle */}
        <button
          type="button"
          onClick={handleFillModeToggle}
          title={`Fill Style: ${fillMode.toUpperCase()} (Click to toggle)`}
          aria-label="Toggle Fill Style"
          className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer text-[10px] font-mono font-semibold flex items-center gap-1"
        >
          <Paintbrush className="w-3 h-3" />
          <span className="uppercase">{fillMode}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/15 mx-0.5" />

        {/* Toggle Connection Nodes (Handles) for this shape */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setNodes((nds) =>
              nds.map((n) =>
                n.id === id
                  ? { ...n, data: { ...n.data, hasHandles: !hasHandles } }
                  : n
              )
            );
          }}
          title={hasHandles ? "Hide Connection Nodes / Handles" : "Show Connection Nodes / Handles"}
          aria-label="Toggle Connection Nodes"
          className={`p-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
            hasHandles
              ? "text-blue-500 bg-blue-50 dark:bg-blue-500/15"
              : "text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/10"
          }`}
        >
          <Waypoints className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/15 mx-0.5" />

        {/* Duplicate */}
        <button
          type="button"
          onClick={handleDuplicate}
          title="Duplicate shape"
          aria-label="Duplicate shape"
          className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          title="Delete shape"
          aria-label="Delete shape"
          className="p-1 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </NodeToolbar>

      {/* ── React Flow Handles for Arrow Connections (Only when hasHandles is enabled) ── */}
      {hasHandles && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-blue-500 !rounded-full transition-transform hover:!scale-125 -top-1.5"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-blue-500 !rounded-full transition-transform hover:!scale-125 -bottom-1.5"
          />
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-blue-500 !rounded-full transition-transform hover:!scale-125 -left-1.5"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="!w-2.5 !h-2.5 !bg-white dark:!bg-[#09090b] !border-2 !border-blue-500 !rounded-full transition-transform hover:!scale-125 -right-1.5"
          />
        </>
      )}

      {/* ── Base Vector Geometry ── */}
      <div className="absolute inset-0 pointer-events-none">
        {renderShapeGeometry()}
      </div>

      {/* ── Centered Content: Icon (if applicable) & Editable Text ── */}
      <div
        className="relative z-10 w-full h-full flex flex-col items-center justify-center p-3 pointer-events-none text-center"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {/* Render symbol icon if available and not one of pure geometrical primitives */}
        {IconComponent &&
          !["rectangle", "circle", "diamond", "triangle", "cylinder", "cloud", "star", "hexagon", "pentagon", "octagon", "heart"].includes(shapeType) && (
            <div className="mb-1 pointer-events-none">
              <IconComponent className={`w-5 h-5 ${shapeDef?.color || "text-blue-500"}`} />
            </div>
          )}

        {isEditing ? (
          <textarea
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleSaveText}
            onKeyDown={handleKeyDown}
            rows={Math.min(3, Math.max(1, label.split("\n").length))}
            placeholder="Add text..."
            className="pointer-events-auto nodrag nopan bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white text-xs font-semibold rounded px-1.5 py-0.5 border border-blue-400 outline-none resize-none text-center max-w-[90%] shadow-md"
          />
        ) : label ? (
          <span
            title="Double-click to edit text"
            style={{
              color: fillMode === "solid" ? textColor : undefined,
            }}
            className={`pointer-events-auto select-none font-semibold text-xs sm:text-sm tracking-tight px-1.5 py-0.5 rounded cursor-text break-words max-w-[90%] leading-tight ${
              fillMode === "solid"
                ? "text-white drop-shadow-sm"
                : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const ShapeNode = memo(ShapeNodeComponent);
export default ShapeNode;

"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  NodeToolbar,
  NodeResizer,
  type Node,
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

export const PRIMITIVE_SHAPES = new Set([
  "rectangle",
  "rect",
  "square",
  "box",
  "circle",
  "round",
  "diamond",
  "triangle",
  "cylinder",
  "database",
  "cloud",
  "star",
  "hexagon",
  "pentagon",
  "octagon",
  "heart",
  "stickynote",
  "folder",
]);

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
  const isPrimitive = PRIMITIVE_SHAPES.has(shapeType);

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
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      )
    );
  }, [id, label, setNodes]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveText();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setLabel(nodeData.label || "");
    }
  };

  const handleColorChange = useCallback(
    (newColor: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
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
      const modes: ShapeFillMode[] = ["tint", "solid", "outline"];
      const nextMode = modes[(modes.indexOf(fillMode) + 1) % modes.length];
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, fillMode: nextMode } } : n
        )
      );
    },
    [id, fillMode, setNodes]
  );

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const node = getNode(id);
      if (!node) return;
      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const duplicatedNode: Node = {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 30,
          y: node.position.y + 30,
        },
        selected: true,
      };
      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), duplicatedNode]);
    },
    [id, getNode, setNodes]
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
  const IconComponent = shapeDef?.icon as React.ComponentType<any> | undefined;

  // Render SVG or HTML based on shape type
  const renderShapeGeometry = () => {
    switch (shapeType) {
      case "circle":
      case "round":
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
      case "rect":
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
      case "database":
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

      case "stickynote":
        return (
          <div
            className="w-full h-full rounded-xl shadow-md transition-colors duration-150 p-2 relative overflow-hidden"
            style={{
              backgroundColor: fillMode === "outline" ? "transparent" : (fillColor === "transparent" ? "#fef3c7" : fillColor),
              borderColor: strokeColor,
              borderWidth: "2px",
              borderStyle: "solid",
            }}
          >
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-black/10 dark:bg-white/10 rounded-bl"
              style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
            />
          </div>
        );

      case "folder":
        return (
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 6,24 L 38,24 L 48,34 L 94,34 A 4,4 0 0,1 98,38 L 98,84 A 6,6 0 0,1 92,90 L 6,90 A 6,6 0 0,1 0,84 L 0,30 A 6,6 0 0,1 6,24 Z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "text":
        return null;

      default:
        // For non-primitive shapes (arrows, icons, badges, tech symbols):
        // NEVER draw a 2.5px solid rectangle card border!
        if (fillMode === "solid") {
          return (
            <div
              className="w-full h-full rounded-2xl transition-colors duration-150"
              style={{ backgroundColor: `${activeColor}22` }}
            />
          );
        }
        if (fillMode === "tint") {
          return (
            <div
              className="w-full h-full rounded-2xl transition-colors duration-150"
              style={{ backgroundColor: `${activeColor}10` }}
            />
          );
        }
        // Outline mode: completely transparent background, NO enclosing rectangle border!
        return null;
    }
  };

  return (
    <div
      className={`relative select-none group w-full h-full min-w-[50px] min-h-[50px] flex items-center justify-center transition-all ${
        selected ? "drop-shadow-lg" : "hover:drop-shadow-sm"
      }`}
    >
      {/* ── Resizer Handles: Active when selected ── */}
      <NodeResizer
        isVisible={selected}
        minWidth={40}
        minHeight={40}
        lineClassName="!border-[#635BFF]"
        handleClassName="!w-2 !h-2 !bg-white dark:!bg-[#18181b] !border-[1.5px] !border-[#635BFF] !rounded-full shadow-sm"
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
        className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2 pointer-events-none text-center"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {/* Render symbol / arrow icon scaled to fill node if available and not a geometrical primitive */}
        {IconComponent && !isPrimitive && (
          <div className="flex-1 w-full h-full flex items-center justify-center p-1 pointer-events-none">
            <IconComponent
              className="w-full h-full max-w-[85%] max-h-[85%] transition-all duration-150 drop-shadow-xs"
              style={{ color: activeColor }}
              strokeWidth={2.4}
            />
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
            className="pointer-events-auto nodrag nopan bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white text-xs font-semibold rounded px-1.5 py-0.5 border border-blue-400 outline-none resize-none text-center max-w-[90%] shadow-md z-20"
          />
        ) : label ? (
          <span
            title="Double-click to edit text"
            style={{
              color: fillMode === "solid" && isPrimitive ? textColor : undefined,
            }}
            className={`pointer-events-auto select-none font-semibold text-xs sm:text-sm tracking-tight px-1.5 py-0.5 rounded cursor-text break-words max-w-[90%] leading-tight z-20 ${
              fillMode === "solid" && isPrimitive
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

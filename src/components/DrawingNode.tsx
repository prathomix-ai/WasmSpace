"use client";

import React, { memo } from "react";
import { NodeProps } from "@xyflow/react";

export interface DrawingNodeData {
  path: string;
  color: string;
  width: number;
  opacity: number;
  tool: "pen" | "highlighter" | "ballpen" | "pencil" | "marker" | "brush" | string;
  penType?: "ballpen" | "pencil" | "marker" | "brush";
  boxWidth: number;
  boxHeight: number;
  originalPoints?: { x: number; y: number }[];
}

export const DrawingNode = memo(function DrawingNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = (data || {}) as unknown as DrawingNodeData;
  const {
    path = "",
    color = "#06b6d4",
    width = 3,
    opacity = 1,
    tool = "pen",
    penType,
    boxWidth = 100,
    boxHeight = 100,
  } = nodeData;

  const isHighlighter = tool === "highlighter";
  const effectiveType = penType || (["pencil", "marker", "brush", "ballpen"].includes(tool) ? tool : "ballpen");

  const strokeStyle: React.CSSProperties = isHighlighter
    ? {
        mixBlendMode: "screen",
        filter: `drop-shadow(0 0 6px ${color})`,
      }
    : effectiveType === "pencil"
    ? {
        opacity: opacity * 0.82,
        filter: "contrast(1.15)",
      }
    : effectiveType === "marker"
    ? {
        opacity: Math.min(opacity, 0.92),
        filter: "saturate(1.2)",
      }
    : effectiveType === "brush"
    ? {
        filter: `drop-shadow(0 0 1px ${color}60)`,
      }
    : {
        filter: `drop-shadow(0 0 1px ${color}80)`,
      };

  return (
    <div
      className={`relative select-none pointer-events-auto transition-all ${
        selected ? "ring-1 ring-[#635BFF]/70 shadow-[0_0_12px_rgba(99,91,255,0.25)] rounded-md" : ""
      }`}
      style={{
        width: boxWidth,
        height: boxHeight,
      }}
    >
      <svg
        width={boxWidth}
        height={boxHeight}
        viewBox={`0 0 ${boxWidth} ${boxHeight}`}
        className="overflow-visible pointer-events-none"
        style={{ display: "block" }}
      >
        <path
          d={path}
          fill={color}
          opacity={opacity}
          style={strokeStyle}
        />
      </svg>
    </div>
  );
});

export default DrawingNode;

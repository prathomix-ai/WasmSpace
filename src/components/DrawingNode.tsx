"use client";

import React, { memo } from "react";
import { NodeProps } from "@xyflow/react";

export interface DrawingNodeData {
  path: string;
  color: string;
  width: number;
  opacity: number;
  tool: "pen" | "highlighter";
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
    boxWidth = 100,
    boxHeight = 100,
  } = nodeData;

  const isHighlighter = tool === "highlighter";

  return (
    <div
      className={`relative select-none pointer-events-auto transition-all ${
        selected ? "ring-1 ring-cyan-400/70 shadow-[0_0_12px_rgba(6,182,212,0.3)] rounded-md" : ""
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
          style={
            isHighlighter
              ? {
                  mixBlendMode: "screen",
                  filter: `drop-shadow(0 0 6px ${color})`,
                }
              : {
                  filter: `drop-shadow(0 0 1px ${color}80)`,
                }
          }
        />
      </svg>
    </div>
  );
});

export default DrawingNode;

"use client";

import React, { memo } from "react";
import { useViewport } from "@xyflow/react";

export interface AlignmentGuideLine {
  id: string;
  type: "horizontal" | "vertical";
  position: number; // The coordinate (y for horizontal, x for vertical)
  start: number;
  end: number;
  color: "blue" | "red";
  label?: string;
}

interface AlignmentGuidesProps {
  guides: AlignmentGuideLine[];
}

function AlignmentGuidesComponent({ guides }: AlignmentGuidesProps) {
  const { x, y, zoom } = useViewport();

  if (!guides || guides.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-[16] overflow-visible select-none"
      aria-hidden="true"
    >
      <defs>
        {/* Glowing aura filter for high-tech cyberpunk guidelines */}
        <filter id="guide-blue-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="guide-red-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Synchronize canvas flow coordinates with zoom and pan transform */}
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {guides.map((guide) => {
          const isBlue = guide.color === "blue";
          const strokeColor = isBlue ? "#3b82f6" : "#ef4444";
          const glowFilter = isBlue ? "url(#guide-blue-glow)" : "url(#guide-red-glow)";
          const badgeBg = isBlue ? "rgba(30, 58, 138, 0.9)" : "rgba(127, 29, 29, 0.9)";
          const badgeBorder = isBlue ? "#60a5fa" : "#f87171";
          const badgeText = isBlue ? "#93c5fd" : "#fca5a5";

          if (guide.type === "vertical") {
            const midY = (guide.start + guide.end) / 2;
            return (
              <g key={guide.id} className="animate-in fade-in duration-100">
                {/* Outer Glow Halo Line */}
                <line
                  x1={guide.position}
                  y1={guide.start}
                  x2={guide.position}
                  y2={guide.end}
                  stroke={strokeColor}
                  strokeWidth={4}
                  strokeOpacity={0.35}
                  filter={glowFilter}
                />
                {/* Sharp Core Straight Guide Line */}
                <line
                  x1={guide.position}
                  y1={guide.start}
                  x2={guide.position}
                  y2={guide.end}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  strokeOpacity={0.95}
                />
                {/* End Anchor Dots */}
                <circle
                  cx={guide.position}
                  cy={guide.start}
                  r={3.5}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <circle
                  cx={guide.position}
                  cy={guide.end}
                  r={3.5}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />

                {/* Alignment Pill Badge */}
                {guide.label && (
                  <foreignObject
                    x={guide.position + 8}
                    y={midY - 12}
                    width={110}
                    height={26}
                    className="overflow-visible"
                  >
                    <div
                      style={{
                        backgroundColor: badgeBg,
                        borderColor: badgeBorder,
                        color: badgeText,
                      }}
                      className="px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg flex items-center gap-1 w-max"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: strokeColor }}
                      />
                      <span>{guide.label}</span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          }

          // Horizontal alignment guide
          const midX = (guide.start + guide.end) / 2;
          return (
            <g key={guide.id} className="animate-in fade-in duration-100">
              {/* Outer Glow Halo Line */}
              <line
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke={strokeColor}
                strokeWidth={4}
                strokeOpacity={0.35}
                filter={glowFilter}
              />
              {/* Sharp Core Straight Guide Line */}
              <line
                x1={guide.start}
                y1={guide.position}
                x2={guide.end}
                y2={guide.position}
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeOpacity={0.95}
              />
              {/* End Anchor Dots */}
              <circle
                cx={guide.start}
                cy={guide.position}
                r={3.5}
                fill={strokeColor}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <circle
                cx={guide.end}
                cy={guide.position}
                r={3.5}
                fill={strokeColor}
                stroke="#ffffff"
                strokeWidth={1.5}
              />

              {/* Alignment Pill Badge */}
              {guide.label && (
                <foreignObject
                  x={midX - 35}
                  y={guide.position + 8}
                  width={110}
                  height={26}
                  className="overflow-visible"
                >
                  <div
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeText,
                    }}
                    className="px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold tracking-wider uppercase backdrop-blur-md shadow-lg flex items-center gap-1 w-max"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: strokeColor }}
                    />
                    <span>{guide.label}</span>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export const AlignmentGuides = memo(AlignmentGuidesComponent);
export default AlignmentGuides;

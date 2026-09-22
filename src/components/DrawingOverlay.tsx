"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { getStroke } from "perfect-freehand";

export type DrawingTool = "select" | "pan" | "pen" | "highlighter" | "eraser" | "laser";

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  tool: "pen" | "highlighter";
  points: StrokePoint[];
  color: string;
  width: number;
  opacity: number;
}

interface LaserPoint {
  x: number;
  y: number;
  time: number;
}

interface DrawingOverlayProps {
  activeTool: DrawingTool | string;
  penColor?: string;
  penWidth?: number;
  highlighterColor?: string;
  eraserRadius?: number;
  onStrokeComplete?: (stroke: DrawingStroke) => void;
  onEraseStroke?: (pt: StrokePoint, prevPt?: StrokePoint | null, radius?: number) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * Natural handwriting and smooth chisel stroke options for perfect-freehand
 */
export const getFreehandStrokeOptions = (
  width: number,
  tool: "pen" | "highlighter" = "pen"
) => {
  if (tool === "highlighter") {
    return {
      size: Math.max(width * 2.8, 20),
      thinning: 0.1,
      smoothing: 0.7,
      streamline: 0.5,
      simulatePressure: false,
    };
  }
  return {
    size: Math.max(width * 1.8, 3.5),
    thinning: 0.3,
    smoothing: 0.6,
    streamline: 0.5,
    simulatePressure: true,
  };
};

/**
 * Converts outline polygon points from perfect-freehand into a smooth closed SVG path
 */
export function getSvgPathFromStroke(stroke: number[][], closed = true): string {
  const len = stroke.length;
  if (!len) return "";

  const a = stroke[0];
  const b = stroke[1];

  if (len === 1) {
    return `M ${a[0]} ${a[1]} A 0.5 0.5 0 0 1 ${a[0]} ${a[1] + 0.1} Z`;
  }

  if (len === 2) {
    return `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} Z`;
  }

  let d = `M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2} ${b[0]} ${b[1]}`;

  for (let i = 2; i < len; i++) {
    const prev = stroke[i - 1];
    const curr = stroke[i];
    d += ` Q ${prev[0]} ${prev[1]} ${(prev[0] + curr[0]) / 2} ${(prev[1] + curr[1]) / 2}`;
  }

  if (closed) {
    d += " Z";
  }

  return d;
}

/**
 * Generate a smooth continuous SVG path directly from recorded points using perfect-freehand
 */
export function getSvgPathFromPoints(
  points: StrokePoint[],
  width: number,
  tool: "pen" | "highlighter" = "pen"
): string {
  if (points.length === 0) return "";
  const rawPoints = points.map((p) => [p.x, p.y, p.pressure ?? 0.5]);
  const stroke = getStroke(rawPoints, getFreehandStrokeOptions(width, tool));
  return getSvgPathFromStroke(stroke);
}

/**
 * Legacy smooth quadratic bezier fallback
 */
export function pointsToSvgPath(points: StrokePoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

/**
 * Split laser points into distinct path segments if the user moved quickly or paused,
 * preventing sudden jumps across the canvas.
 */
function laserPointsToSvgPaths(points: LaserPoint[]): string[] {
  if (points.length === 0) return [];
  const segments: LaserPoint[][] = [];
  let currentSegment: LaserPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    if (currentSegment.length === 0) {
      currentSegment.push(points[i]);
    } else {
      const prev = currentSegment[currentSegment.length - 1];
      const dt = points[i].time - prev.time;
      const dist = Math.hypot(points[i].x - prev.x, points[i].y - prev.y);
      if (dt > 120 || dist > 140) {
        if (currentSegment.length > 0) segments.push(currentSegment);
        currentSegment = [points[i]];
      } else {
        currentSegment.push(points[i]);
      }
    }
  }
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments.map((seg) => pointsToSvgPath(seg)).filter(Boolean);
}

/**
 * High-performance React Flow drawing overlay component.
 * Renders SVG strokes inside a viewport transformation matrix so drawings
 * stay mathematically locked to the canvas during zoom and pan operations.
 */
export default function DrawingOverlay({
  activeTool,
  penColor = "#06b6d4",
  penWidth = 3,
  highlighterColor = "#facc15",
  eraserRadius = 24,
  onStrokeComplete,
  onEraseStroke,
  onContextMenu,
  className = "",
}: DrawingOverlayProps) {
  const { screenToFlowPosition } = useReactFlow();
  const { x, y, zoom } = useViewport();

  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [laserCursor, setLaserCursor] = useState<StrokePoint | null>(null);
  const [eraserCursor, setEraserCursor] = useState<StrokePoint | null>(null);

  const isDrawingRef = useRef(false);
  const lastErasePointRef = useRef<StrokePoint | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isDrawingToolActive =
    activeTool === "pen" ||
    activeTool === "highlighter" ||
    activeTool === "eraser" ||
    activeTool === "laser";
  const isDrawingActive =
    activeTool === "pen" ||
    activeTool === "highlighter" ||
    activeTool === "eraser" ||
    activeTool === "laser";

  // ── Laser Pointer Animation Loop (fades points older than 750ms) ──────────
  useEffect(() => {
    if (activeTool !== "laser") {
      setLaserPoints([]);
      setLaserCursor(null);
      return;
    }

    let animationFrameId: number;
    const updateLaserTrail = () => {
      const now = Date.now();
      setLaserPoints((prev) => prev.filter((p) => now - p.time < 750));
      animationFrameId = requestAnimationFrame(updateLaserTrail);
    };

    animationFrameId = requestAnimationFrame(updateLaserTrail);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeTool]);

  // Convert screen coordinates to RAW canvas flow coordinates (strictly bypassing any grid snapping)
  const getRawFlowCoordinates = useCallback(
    (e: React.PointerEvent): StrokePoint => {
      const rect = svgRef.current?.getBoundingClientRect();
      const offsetX = e.clientX - (rect?.left ?? 0);
      const offsetY = e.clientY - (rect?.top ?? 0);
      const flowX = (offsetX - x) / zoom;
      const flowY = (offsetY - y) / zoom;
      const pressure = e.pressure > 0 ? e.pressure : 0.5;
      return { x: flowX, y: flowY, pressure };
    },
    [x, y, zoom]
  );

  // Check if points are near eraser coordinate or connecting drag segment
  const isStrokeIntersectedByEraser = (
    stroke: DrawingStroke,
    pt: StrokePoint,
    prevPt?: StrokePoint | null,
    threshold: number = eraserRadius
  ): boolean => {
    for (const p of stroke.points) {
      if (prevPt) {
        const dx = pt.x - prevPt.x;
        const dy = pt.y - prevPt.y;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) {
          if (Math.hypot(p.x - pt.x, p.y - pt.y) < threshold) return true;
        } else {
          let t = ((p.x - prevPt.x) * dx + (p.y - prevPt.y) * dy) / l2;
          t = Math.max(0, Math.min(1, t));
          const projX = prevPt.x + t * dx;
          const projY = prevPt.y + t * dy;
          if (Math.hypot(p.x - projX, p.y - projY) < threshold) return true;
        }
      } else {
        if (Math.hypot(p.x - pt.x, p.y - pt.y) < threshold) return true;
      }
    }
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingActive || e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    isDrawingRef.current = true;
    const pt = getRawFlowCoordinates(e);

    if (activeTool === "eraser") {
      lastErasePointRef.current = pt;
      setEraserCursor(pt);
      setStrokes((prev) => prev.filter((s) => !isStrokeIntersectedByEraser(s, pt, null, eraserRadius)));
      onEraseStroke?.(pt, null, eraserRadius);
      return;
    }

    if (activeTool === "laser") {
      setLaserPoints([{ ...pt, time: Date.now() }]);
      setLaserCursor(pt);
      return;
    }

    const newStroke: DrawingStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: activeTool === "highlighter" ? "highlighter" : "pen",
      points: [pt],
      color: activeTool === "highlighter" ? highlighterColor : penColor,
      width: activeTool === "highlighter" ? 22 : penWidth,
      opacity: activeTool === "highlighter" ? 0.38 : 1,
    };

    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingActive) return;
    const pt = getRawFlowCoordinates(e);

    if (activeTool === "laser") {
      setLaserCursor(pt);
      setLaserPoints((prev) => [...prev, { ...pt, time: Date.now() }]);
      return;
    }

    if (activeTool === "eraser") {
      setEraserCursor(pt);
      if (isDrawingRef.current) {
        const prevPt = lastErasePointRef.current;
        lastErasePointRef.current = pt;
        setStrokes((prev) => prev.filter((s) => !isStrokeIntersectedByEraser(s, pt, prevPt, eraserRadius)));
        onEraseStroke?.(pt, prevPt, eraserRadius);
      }
      return;
    }

    if (!isDrawingRef.current) return;

    if (currentStroke) {
      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, pt],
        };
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawingActive) return;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {}

    isDrawingRef.current = false;
    lastErasePointRef.current = null;

    if (currentStroke && currentStroke.points.length > 0) {
      if (onStrokeComplete) {
        onStrokeComplete(currentStroke);
      } else {
        setStrokes((prev) => [...prev, currentStroke]);
      }
      setCurrentStroke(null);
    }
  };

  // Cursor style based on active tool
  const getCursorClass = () => {
    if (activeTool === "pen") return "cursor-crosshair";
    if (activeTool === "highlighter") return "cursor-crosshair";
    if (activeTool === "eraser") return "cursor-crosshair";
    if (activeTool === "laser") return "cursor-none";
    return "pointer-events-none";
  };

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full z-50 select-none ${
        isDrawingToolActive
          ? `pointer-events-auto ${getCursorClass()}`
          : "pointer-events-none"
      } ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e);
      }}
      onPointerLeave={() => {
        isDrawingRef.current = false;
        lastErasePointRef.current = null;
        setLaserCursor(null);
        setEraserCursor(null);
      }}
      style={{ touchAction: "none" }}
    >
      <defs>
        {/* Glow filter for Laser Pointer trail */}
        <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Synchronize drawings with React Flow viewport */}
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {/* ── Persisted Completed Strokes (Fallback) ── */}
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={getSvgPathFromPoints(stroke.points, stroke.width, stroke.tool)}
            fill={stroke.color}
            opacity={stroke.opacity}
            style={
              stroke.tool === "highlighter"
                ? { mixBlendMode: "screen", filter: `drop-shadow(0 0 6px ${stroke.color})` }
                : { filter: `drop-shadow(0 0 1px ${stroke.color}80)` }
            }
            className={activeTool === "eraser" ? "pointer-events-auto cursor-crosshair hover:opacity-40" : "pointer-events-none"}
            onClick={(e) => {
              if (activeTool === "eraser") {
                e.stopPropagation();
                setStrokes((prev) => prev.filter((s) => s.id !== stroke.id));
              }
            }}
          />
        ))}

        {/* ── Live In-Progress Smooth Stroke (perfect-freehand) ── */}
        {currentStroke && currentStroke.points.length > 0 && (
          <path
            d={getSvgPathFromPoints(currentStroke.points, currentStroke.width, currentStroke.tool)}
            fill={currentStroke.color}
            opacity={currentStroke.opacity}
            style={
              currentStroke.tool === "highlighter"
                ? { mixBlendMode: "screen", filter: `drop-shadow(0 0 6px ${currentStroke.color})` }
                : { filter: `drop-shadow(0 0 1px ${currentStroke.color}80)` }
            }
          />
        )}

        {/* ── Eraser Visual Target Indicator Ring ── */}
        {eraserCursor && activeTool === "eraser" && (
          <g transform={`translate(${eraserCursor.x}, ${eraserCursor.y})`} pointerEvents="none">
            <circle
              r={eraserRadius}
              fill="rgba(244, 63, 94, 0.16)"
              stroke="#f43f5e"
              strokeWidth={Math.max(1, 1.5 / zoom)}
              strokeDasharray={`${4 / zoom} ${3 / zoom}`}
            />
            <circle r={Math.min(4, Math.max(2, eraserRadius / 8))} fill="#f43f5e" />
          </g>
        )}

        {/* ── Laser Pointer Dynamic Fading Trail ── */}
        {laserPointsToSvgPaths(laserPoints).map((pathD, idx) => (
          <g key={idx}>
            {/* Outer red glowing aura */}
            <path
              d={pathD}
              stroke="#ef4444"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#laser-glow)"
              style={{ opacity: 0.8 }}
            />
            {/* Inner hot white core */}
            <path
              d={pathD}
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ opacity: 0.95 }}
            />
          </g>
        ))}

        {/* ── Glowing Laser Pulse Indicator Dot ── */}
        {laserCursor && activeTool === "laser" && (
          <g transform={`translate(${laserCursor.x}, ${laserCursor.y})`}>
            <circle r={8} fill="#ef4444" filter="url(#laser-glow)" opacity={0.8} />
            <circle r={3} fill="#ffffff" />
            <circle r={1.5} fill="#ef4444" />
            <circle
              r={14}
              fill="none"
              stroke="#ef4444"
              strokeWidth={1.5}
              opacity={0.6}
              className="animate-ping"
            />
          </g>
        )}
      </g>
    </svg>
  );
}

"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";

export type DrawingTool = "select" | "pan" | "pen" | "highlighter" | "eraser" | "laser";

export interface StrokePoint {
  x: number;
  y: number;
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
  onStrokeComplete?: (stroke: DrawingStroke) => void;
}

/**
 * Generate smooth SVG path data from an array of coordinates using quadratic Bezier curves
 */
function pointsToSvgPath(points: StrokePoint[]): string {
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
  onStrokeComplete,
}: DrawingOverlayProps) {
  const { screenToFlowPosition } = useReactFlow();
  const { x, y, zoom } = useViewport();

  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);
  const [laserCursor, setLaserCursor] = useState<StrokePoint | null>(null);

  const isDrawingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

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

  // Convert screen coordinates to canvas flow coordinates
  const getFlowCoordinates = useCallback(
    (e: React.PointerEvent): StrokePoint => {
      return screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [screenToFlowPosition]
  );

  // Check if a point is near a stroke for erasing
  const isPointNearStroke = (pt: StrokePoint, stroke: DrawingStroke, threshold: number = 18): boolean => {
    for (const p of stroke.points) {
      const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (dist < threshold) return true;
    }
    return false;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawingActive || e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    isDrawingRef.current = true;
    const pt = getFlowCoordinates(e);

    if (activeTool === "eraser") {
      setStrokes((prev) => prev.filter((s) => !isPointNearStroke(pt, s)));
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
    const pt = getFlowCoordinates(e);

    if (activeTool === "laser") {
      setLaserCursor(pt);
      setLaserPoints((prev) => [...prev, { ...pt, time: Date.now() }]);
      return;
    }

    if (!isDrawingRef.current) return;

    if (activeTool === "eraser") {
      setStrokes((prev) => prev.filter((s) => !isPointNearStroke(pt, s)));
      return;
    }

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

    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      onStrokeComplete?.(currentStroke);
      setCurrentStroke(null);
    }
  };

  // Cursor style based on active tool
  const getCursorClass = () => {
    if (activeTool === "pen") return "cursor-crosshair";
    if (activeTool === "highlighter") return "cursor-crosshair";
    if (activeTool === "eraser") return "cursor-cell";
    if (activeTool === "laser") return "cursor-none";
    return "pointer-events-none";
  };

  return (
    <svg
      ref={svgRef}
      className={`absolute inset-0 w-full h-full z-[15] select-none ${
        isDrawingActive && activeTool !== "eraser"
          ? `pointer-events-auto ${getCursorClass()}`
          : "pointer-events-none"
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setLaserCursor(null)}
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
        {/* ── Persisted Completed Strokes ── */}
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={pointsToSvgPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={activeTool === "eraser" ? Math.max(stroke.width, 16) : stroke.width}
            strokeOpacity={stroke.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className={activeTool === "eraser" ? "pointer-events-auto cursor-cell hover:opacity-40" : "pointer-events-none"}
            onClick={(e) => {
              if (activeTool === "eraser") {
                e.stopPropagation();
                setStrokes((prev) => prev.filter((s) => s.id !== stroke.id));
              }
            }}
          />
        ))}

        {/* ── Live In-Progress Stroke ── */}
        {currentStroke && (
          <path
            d={pointsToSvgPath(currentStroke.points)}
            stroke={currentStroke.color}
            strokeWidth={currentStroke.width}
            strokeOpacity={currentStroke.opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
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

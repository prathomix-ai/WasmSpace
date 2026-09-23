"use client";

import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import { NodeProps, useReactFlow } from "@xyflow/react";

export type LineStyle = "solid" | "dashed" | "dotted";
export type LineRouting = "straight" | "curved" | "orthogonal" | "elbow";
export type MarkerStyle = "none" | "arrow" | "triangle" | "circle" | "diamond" | "bar" | "openArrow";

export interface LineNodeData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cpX?: number; // Optional curve control point
  cpY?: number;
  color?: string;
  width?: number;
  style?: LineStyle;
  routing?: LineRouting;
  startMarker?: MarkerStyle;
  endMarker?: MarkerStyle;
  label?: string;
  isLocked?: boolean;
  [key: string]: any;
}

function LineNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = (data || {}) as LineNodeData;
  const { setNodes } = useReactFlow();

  // Local endpoint positions relative to node origin (0, 0)
  const x1 = nodeData.x1 ?? 0;
  const y1 = nodeData.y1 ?? 0;
  const x2 = nodeData.x2 ?? 160;
  const y2 = nodeData.y2 ?? 100;
  const color = nodeData.color || "#635BFF";
  const strokeWidth = nodeData.width || 2;
  const lineStyle: LineStyle = nodeData.style || "solid";
  const routing: LineRouting = nodeData.routing || "straight";
  const startMarker: MarkerStyle = nodeData.startMarker || "none";
  const endMarker: MarkerStyle = nodeData.endMarker || "arrow";
  const isLocked = Boolean(nodeData.isLocked);

  // Dragging state for endpoints
  const [activeHandle, setActiveHandle] = useState<"start" | "end" | "cp" | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; origX: number; origY: number }>({
    clientX: 0,
    clientY: 0,
    origX: 0,
    origY: 0,
  });

  // Calculate bounding box so SVG renders with padding
  const minX = Math.min(x1, x2, nodeData.cpX ?? x1) - 24;
  const minY = Math.min(y1, y2, nodeData.cpY ?? y1) - 24;
  const maxX = Math.max(x1, x2, nodeData.cpX ?? x2) + 24;
  const maxY = Math.max(y1, y2, nodeData.cpY ?? y2) + 24;
  const svgW = Math.max(48, maxX - minX);
  const svgH = Math.max(48, maxY - minY);

  // SVG-relative points
  const sx = x1 - minX;
  const sy = y1 - minY;
  const ex = x2 - minX;
  const ey = y2 - minY;
  const midX = (sx + ex) / 2;
  const midY = (sy + ey) / 2;

  // Path string calculation
  let pathD = "";
  if (routing === "straight") {
    pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
  } else if (routing === "curved") {
    const cpx = (nodeData.cpX !== undefined ? nodeData.cpX - minX : midX + (ey - sy) * 0.2);
    const cpy = (nodeData.cpY !== undefined ? nodeData.cpY - minY : midY - (ex - sx) * 0.2);
    pathD = `M ${sx} ${sy} Q ${cpx} ${cpy} ${ex} ${ey}`;
  } else if (routing === "orthogonal" || routing === "elbow") {
    // 90-degree step connector
    pathD = `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ey} L ${ex} ${ey}`;
  }

  // Handle Drag logic
  const handlePointerDown = (handle: "start" | "end" | "cp", e: React.PointerEvent) => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);

    const origX = handle === "start" ? x1 : handle === "end" ? x2 : (nodeData.cpX ?? (x1 + x2) / 2);
    const origY = handle === "start" ? y1 : handle === "end" ? y2 : (nodeData.cpY ?? (y1 + y2) / 2);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      origX,
      origY,
    };
  };

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      const newX = Math.round(dragStartRef.current.origX + dx);
      const newY = Math.round(dragStartRef.current.origY + dy);

      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== id) return n;
          const updated = { ...n.data };
          if (activeHandle === "start") {
            updated.x1 = newX;
            updated.y1 = newY;
          } else if (activeHandle === "end") {
            updated.x2 = newX;
            updated.y2 = newY;
          } else if (activeHandle === "cp") {
            updated.cpX = newX;
            updated.cpY = newY;
          }
          return { ...n, data: updated };
        })
      );
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeHandle, id, setNodes]);

  // Dash array
  const strokeDasharray =
    lineStyle === "dashed" ? "8 6" : lineStyle === "dotted" ? "3 4" : undefined;

  // Unique marker IDs per node
  const startMarkerId = `marker-start-${id}`;
  const endMarkerId = `marker-end-${id}`;

  const renderMarkerDef = (markerType: MarkerStyle, markerId: string, isStart: boolean) => {
    if (markerType === "none") return null;

    if (markerType === "arrow" || markerType === "triangle") {
      return (
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={isStart ? 2 : 8}
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={color} />
        </marker>
      );
    }
    if (markerType === "openArrow") {
      return (
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX={isStart ? 2 : 8}
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </marker>
      );
    }
    if (markerType === "circle") {
      return (
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <circle cx="5" cy="5" r="3.5" fill={color} />
        </marker>
      );
    }
    if (markerType === "diamond") {
      return (
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <polygon points="5,1 9,5 5,9 1,5" fill={color} />
        </marker>
      );
    }
    if (markerType === "bar") {
      return (
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="8"
          orient="auto"
        >
          <line x1="5" y1="1" x2="5" y2="9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </marker>
      );
    }
    return null;
  };

  return (
    <div
      className="relative pointer-events-none select-none"
      style={{
        transform: `translate(${minX}px, ${minY}px)`,
        width: svgW,
        height: svgH,
      }}
    >
      <svg
        width={svgW}
        height={svgH}
        className="overflow-visible pointer-events-auto"
        style={{ cursor: isLocked ? "default" : "move" }}
      >
        <defs>
          {renderMarkerDef(startMarker, startMarkerId, true)}
          {renderMarkerDef(endMarker, endMarkerId, false)}
        </defs>

        {/* Thick transparent hit-area for easy selection and dragging */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(16, strokeWidth + 12)}
          className="cursor-pointer"
        />

        {/* Visible line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerStart={startMarker !== "none" ? `url(#${startMarkerId})` : undefined}
          markerEnd={endMarker !== "none" ? `url(#${endMarkerId})` : undefined}
          className="transition-colors duration-150"
        />

        {/* Selection indicator outline */}
        {selected && !isLocked && (
          <path
            d={pathD}
            fill="none"
            stroke="#635BFF"
            strokeWidth={strokeWidth + 4}
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Independent Draggable Endpoints (visible when selected) */}
      {selected && !isLocked && (
        <>
          {/* Start Point Handle */}
          <div
            onPointerDown={(e) => handlePointerDown("start", e)}
            title="Drag Start Endpoint"
            className="pointer-events-auto absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border-2 border-[#635BFF] shadow-sm hover:scale-125 active:scale-110 cursor-grab active:cursor-grabbing transition-transform z-30 flex items-center justify-center"
            style={{ left: sx, top: sy }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
          </div>

          {/* End Point Handle */}
          <div
            onPointerDown={(e) => handlePointerDown("end", e)}
            title="Drag End Endpoint"
            className="pointer-events-auto absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border-2 border-[#635BFF] shadow-sm hover:scale-125 active:scale-110 cursor-grab active:cursor-grabbing transition-transform z-30 flex items-center justify-center"
            style={{ left: ex, top: ey }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
          </div>

          {/* Optional Midpoint / Curve Handle */}
          {routing === "curved" && (
            <div
              onPointerDown={(e) => handlePointerDown("cp", e)}
              title="Drag Curve Control Point"
              className="pointer-events-auto absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full bg-white border-2 border-indigo-400 shadow-xs hover:scale-125 cursor-grab active:cursor-grabbing z-30"
              style={{
                left: nodeData.cpX !== undefined ? nodeData.cpX - minX : midX,
                top: nodeData.cpY !== undefined ? nodeData.cpY - minY : midY,
              }}
            />
          )}
        </>
      )}

      {/* Line Label */}
      {nodeData.label && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-800 text-[11px] font-medium shadow-2xs pointer-events-auto"
          style={{ left: midX, top: midY }}
        >
          {nodeData.label}
        </div>
      )}
    </div>
  );
}

export default memo(LineNodeComponent);

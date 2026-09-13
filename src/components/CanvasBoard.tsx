"use client";

import React from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

export function CanvasSkeletonLoader() {
  return (
    <div className="flex h-full w-full min-h-[400px] items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
        <span className="text-zinc-300">Loading MasmSpace Canvas…</span>
      </div>
    </div>
  );
}

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <CanvasSkeletonLoader /> }
);

export interface CanvasBoardProps {
  initialData?: any;
  onChange?: (elements: readonly any[], appState: any, files: any) => void;
  excalidrawRef?: (api: any) => void;
}

/**
 * Isolated Excalidraw Client Component
 * -------------------------------------
 * Encapsulates the Excalidraw whiteboard engine and its mandatory stylesheet.
 * This component lazily loads Excalidraw with ssr: false for optimal performance on low-end hardware.
 */
export default function CanvasBoard({ onChange, excalidrawRef }: CanvasBoardProps) {
  return (
    <div className="w-full h-full relative">
      <Excalidraw
        excalidrawAPI={excalidrawRef}
        theme="dark"
        zenModeEnabled={true}
        viewModeEnabled={false}
        onChange={onChange}
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            saveAsImage: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
          },
        }}
      />
    </div>
  );
}

"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamic SSR-free import of the full MasmSpace Whiteboard Canvas OS
const WhiteboardCanvas = dynamic(
  () => import("@/app/canvas/WhiteboardCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-zinc-300">Initializing MasmSpace Canvas OS…</span>
        </div>
      </div>
    ),
  }
);

export default function CanvasPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#050505]">
      <WhiteboardCanvas />
    </main>
  );
}

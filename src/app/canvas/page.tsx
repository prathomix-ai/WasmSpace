"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CanvasLoader } from "@/components/CanvasLoader";

// Dynamic SSR-free import of the full MasmSpace Whiteboard Canvas OS
const WhiteboardCanvas = dynamic(
  () => import("@/app/canvas/WhiteboardCanvas"),
  {
    ssr: false,
    loading: () => <CanvasLoader />,
  }
);

export default function CanvasPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#050505]">
      <WhiteboardCanvas />
    </main>
  );
}

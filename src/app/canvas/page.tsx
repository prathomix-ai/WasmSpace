"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { CanvasLoader } from "@/components/CanvasLoader";
import LeftSidebar from "@/components/LeftSidebar";

// Dynamic SSR-free import of the React Flow Architecture Canvas
const ArchitectureCanvas = dynamic(
  () => import("@/components/ArchitectureCanvas"),
  {
    ssr: false,
    loading: () => (
      <CanvasLoader
        message="Loading Architecture Canvas…"
        submessage="Streaming React Flow Graph Engine & Topology Blueprint"
      />
    ),
  }
);

export default function CanvasPage() {
  const [boardTitle, setBoardTitle] = useState("System Architecture Topology");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#09090b]">
      {isSidebarVisible && (
        <LeftSidebar
          boardTitle={boardTitle}
          onBoardTitleChange={setBoardTitle}
          onPresentClick={() => {}}
          onSearchClick={() => {}}
          onBoardBrainClick={() => {}}
          onShareClick={() => {}}
          onCodeStudioClick={() => {}}
          onVoiceClick={() => {}}
          onToggleExplorer={() => {}}
          onTakeScreenshot={() => {}}
          onOpenSettings={() => {}}
          onOpenProModal={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebarVisibility={() => setIsSidebarVisible((prev) => !prev)}
        />
      )}
      <ArchitectureCanvas
        sidebarCollapsed={isSidebarCollapsed || !isSidebarVisible}
      />
    </main>
  );
}

"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { CanvasLoader } from "@/components/CanvasLoader";
import LeftSidebar from "@/components/LeftSidebar";
import SettingsModal from "@/components/SettingsModal";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#09090b]">
      {isSidebarVisible && (
        <LeftSidebar
          boardTitle={boardTitle}
          onBoardTitleChange={setBoardTitle}
          onImportDocument={(file) => setImportedFile(file)}
          onPresentClick={() => {}}
          onSearchClick={() => {}}
          onBoardBrainClick={() => {}}
          onShareClick={() => {}}
          onCodeStudioClick={() => {}}
          onVoiceClick={() => {}}
          onToggleExplorer={() => {}}
          onTakeScreenshot={() => {}}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProModal={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebarVisibility={() => setIsSidebarVisible((prev) => !prev)}
        />
      )}
      <ArchitectureCanvas
        sidebarCollapsed={isSidebarCollapsed || !isSidebarVisible}
        onOpenSettings={() => setIsSettingsOpen(true)}
        importedFile={importedFile}
        onClearImportedFile={() => setImportedFile(null)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}

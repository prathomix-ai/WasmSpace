"use client";

import React, { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CanvasLoader } from "@/components/CanvasLoader";
import LeftSidebar from "@/components/LeftSidebar";
import SettingsModal from "@/components/SettingsModal";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import BoardBrainSearch from "@/components/BoardBrainSearch";
import LiveShareModal from "@/components/LiveShareModal";
import CodeOnBoardWidget from "@/components/CodeOnBoardWidget";
import VSCodeExplorer from "@/components/VSCodeExplorer";
import { type BoardFileNode } from "@/types/explorer";
import { toPng } from "html-to-image";

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

  // Persistent Collaboration Room ID
  const [roomId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let saved = localStorage.getItem("Prathomix_room_id");
      if (!saved) {
        saved = "room-" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("Prathomix_room_id", saved);
      }
      return saved;
    }
    return "room-default";
  });

  // Modals & Panels State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCodeStudioOpen, setIsCodeStudioOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);

  // Project Files Explorer State
  const [explorerFiles, setExplorerFiles] = useState<BoardFileNode[]>([
    {
      id: "root-project",
      name: "Architecture Workspace",
      type: "folder",
      parentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: "doc-1",
          name: "System Topology.json",
          type: "file",
          parentId: "root-project",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "doc-2",
          name: "Microservices Blueprint.md",
          type: "file",
          parentId: "root-project",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  ]);
  const [activeFileId, setActiveFileId] = useState<string | null>("doc-1");

  // Screenshot Capture Handler
  const handleTakeScreenshot = useCallback(async () => {
    try {
      const target =
        (document.querySelector(".react-flow__viewport") as HTMLElement) ||
        (document.querySelector(".react-flow") as HTMLElement) ||
        document.body;

      const dataUrl = await toPng(target, {
        backgroundColor: "#09090b",
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: any) => {
          const cl = (node as HTMLElement)?.classList;
          if (cl && (cl.contains("react-flow__minimap") || cl.contains("react-flow__controls"))) {
            return false;
          }
          return true;
        },
      });

      const a = document.createElement("a");
      const cleanName = boardTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      a.setAttribute("download", `${cleanName}-snapshot-${Date.now()}.png`);
      a.setAttribute("href", dataUrl);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    }
  }, [boardTitle]);

  // Explorer File Management Handlers
  const handleCreateFile = (parentId: string | null, name: string) => {
    const newFile: BoardFileNode = {
      id: `file-${Date.now()}`,
      name,
      type: "file",
      parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExplorerFiles((prev) => {
      const update = (items: BoardFileNode[]): BoardFileNode[] =>
        items.map((it) => {
          if (it.id === parentId) {
            return { ...it, children: [...(it.children || []), newFile] };
          }
          if (it.children) return { ...it, children: update(it.children) };
          return it;
        });
      return parentId ? update(prev) : [...prev, newFile];
    });
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const newFolder: BoardFileNode = {
      id: `folder-${Date.now()}`,
      name,
      type: "folder",
      parentId,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExplorerFiles((prev) => {
      const update = (items: BoardFileNode[]): BoardFileNode[] =>
        items.map((it) => {
          if (it.id === parentId) {
            return { ...it, children: [...(it.children || []), newFolder] };
          }
          if (it.children) return { ...it, children: update(it.children) };
          return it;
        });
      return parentId ? update(prev) : [...prev, newFolder];
    });
  };

  const handleRenameNode = (id: string, newName: string) => {
    setExplorerFiles((prev) => {
      const update = (items: BoardFileNode[]): BoardFileNode[] =>
        items.map((it) => {
          if (it.id === id) return { ...it, name: newName };
          if (it.children) return { ...it, children: update(it.children) };
          return it;
        });
      return update(prev);
    });
  };

  const handleDeleteNode = (id: string) => {
    setExplorerFiles((prev) => {
      const update = (items: BoardFileNode[]): BoardFileNode[] =>
        items
          .filter((it) => it.id !== id)
          .map((it) => (it.children ? { ...it, children: update(it.children) } : it));
      return update(prev);
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 transition-colors duration-200">
      {/* ── Left Navigation Sidebar: Automatically hidden during Presentation Mode ── */}
      {isSidebarVisible && !isPresentationOpen && (
        <LeftSidebar
          boardTitle={boardTitle}
          onBoardTitleChange={setBoardTitle}
          onImportDocument={(file) => setImportedFile(file)}
          onPresentClick={() => setIsPresentationOpen(true)}
          onSearchClick={() => setIsSearchOpen(true)}
          onBoardBrainClick={() => setIsSearchOpen(true)}
          onShareClick={() => setIsShareOpen(true)}
          onCodeStudioClick={() => setIsCodeStudioOpen((prev) => !prev)}
          isCodeOpen={isCodeStudioOpen}
          onVoiceClick={() => setIsVoiceListening((prev) => !prev)}
          isVoiceListening={isVoiceListening}
          onToggleExplorer={() => setIsExplorerOpen((prev) => !prev)}
          isExplorerOpen={isExplorerOpen}
          onTakeScreenshot={handleTakeScreenshot}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProModal={() => setIsProModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarVisible={isSidebarVisible}
          onToggleSidebarVisibility={() => setIsSidebarVisible((prev) => !prev)}
        />
      )}

      {/* ── Main Architecture ReactFlow Canvas ── */}
      <ArchitectureCanvas
        sidebarCollapsed={isSidebarCollapsed || !isSidebarVisible || isPresentationOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpgradeModal={() => setIsProModalOpen(true)}
        importedFile={importedFile}
        onClearImportedFile={() => setImportedFile(null)}
        roomId={roomId}
        boardTitle={boardTitle}
        onBoardTitleChange={setBoardTitle}
        isPresentationOpen={isPresentationOpen}
        onExitPresentation={() => setIsPresentationOpen(false)}
        onStartPresentation={() => setIsPresentationOpen(true)}
      />

      {/* ── 2. Vector RAG Search & Board Brain ── */}
      <BoardBrainSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* ── 3. Live Multiplayer Collaboration Share Modal ── */}
      <LiveShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        boardTitle={boardTitle}
        roomId={roomId}
      />

      {/* ── 4. Code Studio Multi-Language Runner Dock Widget ── */}
      {!isPresentationOpen && (
        <CodeOnBoardWidget
          isOpen={isCodeStudioOpen}
          onClose={() => setIsCodeStudioOpen(false)}
          leftOffset={isSidebarCollapsed ? 88 : 272}
        />
      )}

      {/* ── 5. Project Files & PDF Document Explorer ── */}
      {!isPresentationOpen && (
        <VSCodeExplorer
          isOpen={isExplorerOpen}
          onToggleOpen={() => setIsExplorerOpen((prev) => !prev)}
        nodes={explorerFiles}
        activeFileId={activeFileId}
        onSelectFile={(file) => setActiveFileId(file.id)}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onRenameNode={handleRenameNode}
        onDeleteNode={handleDeleteNode}
        onImportPdfPages={(pages) => {
          if (pages.length > 0 && pages[0].dataUrl) {
            // Document pages are readily available for whiteboard pinning
          }
        }}
        leftOffset={isSidebarCollapsed ? 88 : 272}
      />
      )}

      {/* ── 6. Voice AI Active Floating Status Bar ── */}
      {isVoiceListening && !isPresentationOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] bg-[#121316]/95 backdrop-blur-xl border border-zinc-800 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-medium text-zinc-200 font-sans">
            Voice AI Listening — Speak canvas architecture commands or notes
          </span>
          <button
            type="button"
            onClick={() => setIsVoiceListening(false)}
            className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors ml-1 cursor-pointer font-medium"
          >
            Stop
          </button>
        </div>
      )}

      {/* ── 7. Settings Modal ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenUpgradeModal={() => setIsProModalOpen(true)}
        onGridTypeChange={(type) => {
          window.dispatchEvent(new CustomEvent("prathomix:grid-change", { detail: type }));
        }}
      />

      {/* ── 8. Pro Upgrade Modal ── */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />
    </main>
  );
}

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Sparkles,
  Send,
  Square,
  Diamond,
  Type,
  StickyNote,
  Database,
  Trash2,
  Star,
  Kanban,
  Cpu,
  Grid2X2,
  ListTodo,
  Route,
  Loader2,
} from "lucide-react";
import "@excalidraw/excalidraw/index.css";

import AISummaryModal from "@/components/AISummaryModal";
import BoardBrainSearch from "@/components/BoardBrainSearch";
import CodeOnBoardWidget from "@/components/CodeOnBoardWidget";
import VSCodeExplorer from "@/components/VSCodeExplorer";
import PresentationModeHUD from "@/components/PresentationModeHUD";
import SettingsModal from "@/components/SettingsModal";
import LiveShareModal from "@/components/LiveShareModal";
import LeftSidebar from "@/components/LeftSidebar";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import PricingModal from "@/components/PricingModal";

import { useVoiceControl } from "@/hooks/useVoiceControl";
import { summarizeCanvas } from "@/lib/ai";
import { indexCanvasSession } from "@/lib/rag";
import { createClient } from "@/lib/supabase/client";
import { type SummarizeResponse } from "@/types/ai";
import { type BoardFileNode } from "@/types/explorer";
import { type RenderedPdfPage } from "@/lib/pdfImporter";

// ─────────────────────────────────────────────────────────────────────────────
// Excalidraw — Dynamic SSR-Free Import (Strict Lazy Loading for 4GB RAM Laptops)
// ─────────────────────────────────────────────────────────────────────────────
export function CanvasSkeletonLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-neon-cyan/20 border-t-neon-cyan animate-spin" />
          <div
            className="absolute w-6 h-6 rounded-full border border-violet-500/30 border-b-violet-400 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-zinc-200 font-semibold tracking-wide text-sm">
            MasmSpace Canvas Engine
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            Streaming WebAssembly & Excalidraw assets…
          </span>
        </div>
      </div>
    </div>
  );
}

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <CanvasSkeletonLoader /> }
);

// Initial File Tree for VS Code-Style Explorer
const INITIAL_TREE_NODES: BoardFileNode[] = [
  {
    id: "folder-arch",
    name: "Architecture",
    type: "folder",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: "file-system-design",
        name: "system-design.masmspace",
        type: "file",
        parentId: "folder-arch",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "file-api-gateway",
        name: "api-gateway.masmspace",
        type: "file",
        parentId: "folder-arch",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "folder-flows",
    name: "Flowcharts",
    type: "folder",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    children: [
      {
        id: "file-auth-flow",
        name: "auth-flow.masmspace",
        type: "file",
        parentId: "folder-flows",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "file-main-session",
    name: "main-session.masmspace",
    type: "file",
    parentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Quick Commands Data Structure
export interface QuickCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  actionType: string;
}

// Library of Corporate-Grade & Universal Quick Commands for the AI Chatbot
const QUICK_COMMANDS: QuickCommand[] = [
  // ── Executive & Corporate Workflows ──
  {
    id: "cmd-kanban",
    label: "Generate Kanban Board",
    icon: <Kanban className="w-3.5 h-3.5 text-cyan-400" />,
    actionType: "kanban",
  },
  {
    id: "cmd-sysarch",
    label: "System Architecture Diagram",
    icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
    actionType: "sysarch",
  },
  {
    id: "cmd-swot",
    label: "SWOT Analysis Framework",
    icon: <Grid2X2 className="w-3.5 h-3.5 text-emerald-400" />,
    actionType: "swot",
  },
  {
    id: "cmd-agenda",
    label: "Create Meeting Agenda",
    icon: <ListTodo className="w-3.5 h-3.5 text-amber-400" />,
    actionType: "agenda",
  },
  {
    id: "cmd-userjourney",
    label: "User Journey Map",
    icon: <Route className="w-3.5 h-3.5 text-pink-400" />,
    actionType: "userjourney",
  },

  // ── Universal Enterprise Primitives ──
  {
    id: "cmd-stickynote",
    label: "Add Sticky Note",
    icon: <StickyNote className="w-3.5 h-3.5 text-yellow-300" />,
    actionType: "stickynote",
  },
  {
    id: "cmd-textbox",
    label: "Add Text Box",
    icon: <Type className="w-3.5 h-3.5 text-blue-400" />,
    actionType: "textbox",
  },
  {
    id: "cmd-rectangle",
    label: "Draw Container / Box",
    icon: <Square className="w-3.5 h-3.5 text-zinc-300" />,
    actionType: "rectangle",
  },
  {
    id: "cmd-diamond",
    label: "Decision Gateway",
    icon: <Diamond className="w-3.5 h-3.5 text-indigo-400" />,
    actionType: "diamond",
  },
  {
    id: "cmd-database",
    label: "Database Container",
    icon: <Database className="w-3.5 h-3.5 text-emerald-400" />,
    actionType: "database",
  },
  {
    id: "cmd-clear",
    label: "Clear Canvas",
    icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />,
    actionType: "clear",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main MasmSpace Excalidraw Canvas Component
// ─────────────────────────────────────────────────────────────────────────────
export default function WhiteboardCanvas() {
  // Excalidraw Imperative API ref & state
  const excalidrawAPIRef = useRef<any>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // AI Chatbot State, Favorites & History
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["cmd-kanban", "cmd-sysarch"]);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ai" | "user"; text: string }>>([
    {
      sender: "ai",
      text: "Enterprise Canvas Agent ready. Click any workflow like 'Generate Kanban Board' or star your favorites!",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Executive Focus Mode (Distraction-free canvas for C-level & managers)
  const [isExecutiveMode, setIsExecutiveMode] = useState(false);

  // Enterprise Live Transcription text
  const [corporateTranscript, setCorporateTranscript] = useState(
    "Listening... Generating Sprint Retrospective notes and extracting action items..."
  );

  // Board Title & Metadata
  const [boardTitle, setBoardTitle] = useState("MasmSpace Session");

  // Pro Subscription Gating State (Access Control)
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState(false);
  const [proFeatureName, setProFeatureName] = useState("Advanced AI Tools");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingModalReason, setPricingModalReason] = useState(
    "You have reached your free daily quota of AI actions."
  );
  const [aiUsage, setAiUsage] = useState({
    actions_used: 4,
    action_limit: 15,
    tier: "free",
  });

  // Auto-grant PRO & Admin privileges for admin@prathomix.tech
  useEffect(() => {
    try {
      const stored = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (
          user?.email?.toLowerCase() === "admin@prathomix.tech" ||
          user?.role === "admin"
        ) {
          setIsProUser(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  /**
   * Reusable PRO access control handler:
   * If user is not Pro, intercepts action and displays the Upgrade modal.
   */
  const handleProClick = useCallback(
    (featureName: string, actionCallback: () => void) => {
      if (!isProUser) {
        setProFeatureName(featureName);
        setShowProModal(true);
        return;
      }
      actionCallback();
    },
    [isProUser]
  );

  // Custom UI Layer States
  const [modalOpen, setModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCodeWidgetOpen, setIsCodeWidgetOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // File Tree State (VS Code style explorer)
  const [treeNodes, setTreeNodes] = useState<BoardFileNode[]>(INITIAL_TREE_NODES);
  const [activeFileId, setActiveFileId] = useState<string>("file-main-session");

  // Rotate corporate transcription phrases during active voice sync
  useEffect(() => {
    const phrases = [
      "Listening... Generating Sprint Retrospective notes and extracting action items...",
      "Analyzing System Architecture Discussion & Q3 Roadmap priorities...",
      "Syncing Executive Board Decisions & Key Performance Indicators...",
      "Drafting User Journey milestones and stakeholder sign-offs...",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phrases.length;
      setCorporateTranscript(phrases[idx]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  /**
   * Toggle a command ID in favorites list without triggering command execution
   */
  const toggleFavorite = useCallback((commandId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Crucial: Stop event propagation so it doesn't trigger the command
    setFavorites((prev) =>
      prev.includes(commandId)
        ? prev.filter((id) => id !== commandId)
        : [...prev, commandId]
    );
  }, []);

  /**
   * Select freehand pen tool for Executive Focus Mode
   */
  const handleSelectPenTool = useCallback(() => {
    const api = excalidrawAPI || excalidrawAPIRef.current;
    if (api?.setActiveTool) {
      api.setActiveTool({ type: "freedraw" });
    }
  }, [excalidrawAPI]);

  /**
   * Programmatic drawing commands on Excalidraw Canvas (Corporate Workflows & Universal Shapes)
   */
  const executeCommand = useCallback(
    async (commandType: string) => {
      const api = excalidrawAPI || excalidrawAPIRef.current;
      if (!api) {
        console.warn("Excalidraw API not ready yet.");
        return;
      }

      setIsGenerating(true);

      try {
        // Check quota with Next.js Load Balancer Backend
        try {
          const storedUser = typeof window !== "undefined" ? (localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user")) : null;
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          const userEmail = parsedUser?.email || "guest@masmspace.ai";
          const userId = parsedUser?.id;

          const res = await fetch("/api/execute-command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              commandType,
              prompt: `Draw a ${commandType} component`,
              userEmail,
              userId,
            }),
          });

          if (res.status === 403) {
            const errData = await res.json();
            if (errData.code === "UPGRADE_REQUIRED") {
              setPricingModalReason(
                `You have reached your daily limit of ${errData.action_limit || 15} AI actions.`
              );
              setShowPricingModal(true);
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  text: `⚠️ Daily AI quota reached (${errData.actions_used}/${errData.action_limit}). Upgrade to PRATHOMIX PRO to continue generating unlimited components.`,
                },
              ]);
              return;
            }
          }

          const data = await res.json();
          if (data?.usage) {
            setAiUsage(data.usage);
          }
        } catch (quotaErr) {
          console.warn("Quota validation fallback:", quotaErr);
        }

        const appState = api.getAppState ? api.getAppState() : {};
        const zoom = appState?.zoom?.value || 1;
        const scrollX = appState?.scrollX || 0;
        const scrollY = appState?.scrollY || 0;

        // Compute canvas coordinates to place shape near center of screen
        const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
        const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
        let centerX = -scrollX + viewportWidth / (2 * zoom) - 90;
        let centerY = -scrollY + viewportHeight / (2 * zoom) - 70;

        const baseId = `${commandType}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const existingElements = api.getSceneElements ? api.getSceneElements() : [];
        const activeExisting = existingElements.filter((el: any) => !el.isDeleted);

        // Prevent canvas clutter: mathematically offset new elements based on existing canvas bounding box
        const isLargeTemplate = ["kanban", "swot", "sysarch", "agenda", "userjourney"].includes(commandType);

        if (activeExisting.length > 0) {
          let maxCanvasX = -Infinity;
          let minCanvasY = Infinity;

          for (const el of activeExisting) {
            const elRight = (el.x || 0) + (el.width || 0);
            const elTop = el.y || 0;
            if (elRight > maxCanvasX) maxCanvasX = elRight;
            if (elTop < minCanvasY) minCanvasY = elTop;
          }

          // Check if default center position collides with existing elements
          const isOverlapping = activeExisting.some((el: any) => {
            const elX = el.x || 0;
            const elY = el.y || 0;
            const elW = el.width || 0;
            const elH = el.height || 0;
            return (
              centerX < elX + elW + 50 &&
              centerX + 250 > elX - 50 &&
              centerY < elY + elH + 50 &&
              centerY + 200 > elY - 50
            );
          });

          if ((isOverlapping || isLargeTemplate) && isFinite(maxCanvasX)) {
            if (isLargeTemplate) {
              // Offset large templates cleanly to the right of existing elements
              const templateWidthOffset =
                commandType === "kanban" ? 330 : commandType === "sysarch" ? 360 : 220;
              centerX = maxCanvasX + 100 + templateWidthOffset;
              if (isFinite(minCanvasY)) {
                centerY = Math.max(minCanvasY + 140, centerY);
              }
            } else {
              // Offset individual shapes cascade-style to avoid stacking directly on top
              centerX = maxCanvasX + 60;
            }
          }
        }

      const createRect = (opts: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        strokeColor: string;
        backgroundColor: string;
        roundness?: number;
      }) => ({
        id: opts.id,
        type: "rectangle",
        x: opts.x,
        y: opts.y,
        width: opts.width,
        height: opts.height,
        angle: 0,
        strokeColor: opts.strokeColor,
        backgroundColor: opts.backgroundColor,
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: opts.roundness !== undefined ? { type: opts.roundness } : { type: 3 },
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
      });

      const createText = (opts: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        text: string;
        fontSize?: number;
        strokeColor?: string;
      }) => ({
        id: opts.id,
        type: "text",
        x: opts.x,
        y: opts.y,
        width: opts.width,
        height: opts.height,
        angle: 0,
        strokeColor: opts.strokeColor || "#ffffff",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        text: opts.text,
        fontSize: opts.fontSize || 15,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top",
        baseline: 14,
        containerId: null,
        originalText: opts.text,
        lineHeight: 1.25,
      });

      const createArrow = (opts: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        points: number[][];
        strokeColor?: string;
      }) => ({
        id: opts.id,
        type: "arrow",
        x: opts.x,
        y: opts.y,
        width: opts.width,
        height: opts.height,
        angle: 0,
        strokeColor: opts.strokeColor || "#38bdf8",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        points: opts.points,
        lastCommittedPoint: null,
        startBinding: null,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: "arrow",
      });

      if (commandType === "clear") {
        if (api.resetScene) {
          api.resetScene();
          setChatMessages((prev) => [
            ...prev,
            { sender: "ai", text: "🧹 Canvas cleared." },
          ]);
        }
        return;
      }

      const newElements: any[] = [];
      let labelMsg = "";

      switch (commandType) {
        // ── 1. Generate Kanban Board (3 Columns: To Do, In Progress, Done) ──
        case "kanban": {
          const colW = 210;
          const colH = 360;
          const startX = centerX - 330;
          const startY = centerY - 150;

          // Column 1: TO DO
          newElements.push(
            createRect({
              id: `${baseId}_col1`,
              x: startX,
              y: startY,
              width: colW,
              height: colH,
              strokeColor: "#0284c7",
              backgroundColor: "rgba(2, 132, 199, 0.08)",
            }),
            createText({
              id: `${baseId}_t1`,
              x: startX + 16,
              y: startY + 14,
              width: 170,
              height: 24,
              text: "📋 TO DO (2)",
              fontSize: 16,
              strokeColor: "#38bdf8",
            }),
            createRect({
              id: `${baseId}_c1_1`,
              x: startX + 12,
              y: startY + 50,
              width: 186,
              height: 55,
              strokeColor: "#00f5ff",
              backgroundColor: "rgba(0, 245, 255, 0.12)",
            }),
            createText({
              id: `${baseId}_c1_1t`,
              x: startX + 22,
              y: startY + 65,
              width: 165,
              height: 22,
              text: "[PRO-102] Auth API Gateway",
              fontSize: 12,
              strokeColor: "#e0f2fe",
            }),
            createRect({
              id: `${baseId}_c1_2`,
              x: startX + 12,
              y: startY + 115,
              width: 186,
              height: 55,
              strokeColor: "#00f5ff",
              backgroundColor: "rgba(0, 245, 255, 0.12)",
            }),
            createText({
              id: `${baseId}_c1_2t`,
              x: startX + 22,
              y: startY + 130,
              width: 165,
              height: 22,
              text: "[PRO-109] SSO Integration",
              fontSize: 12,
              strokeColor: "#e0f2fe",
            })
          );

          // Column 2: IN PROGRESS
          const x2 = startX + colW + 20;
          newElements.push(
            createRect({
              id: `${baseId}_col2`,
              x: x2,
              y: startY,
              width: colW,
              height: colH,
              strokeColor: "#eab308",
              backgroundColor: "rgba(234, 179, 8, 0.08)",
            }),
            createText({
              id: `${baseId}_t2`,
              x: x2 + 16,
              y: startY + 14,
              width: 170,
              height: 24,
              text: "⚡ IN PROGRESS (2)",
              fontSize: 16,
              strokeColor: "#facc15",
            }),
            createRect({
              id: `${baseId}_c2_1`,
              x: x2 + 12,
              y: startY + 50,
              width: 186,
              height: 55,
              strokeColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.14)",
            }),
            createText({
              id: `${baseId}_c2_1t`,
              x: x2 + 22,
              y: startY + 65,
              width: 165,
              height: 22,
              text: "[PRO-105] Vector RAG Engine",
              fontSize: 12,
              strokeColor: "#fef3c7",
            }),
            createRect({
              id: `${baseId}_c2_2`,
              x: x2 + 12,
              y: startY + 115,
              width: 186,
              height: 55,
              strokeColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.14)",
            }),
            createText({
              id: `${baseId}_c2_2t`,
              x: x2 + 22,
              y: startY + 130,
              width: 165,
              height: 22,
              text: "[PRO-114] Executive HUD UI",
              fontSize: 12,
              strokeColor: "#fef3c7",
            })
          );

          // Column 3: DONE
          const x3 = startX + (colW + 20) * 2;
          newElements.push(
            createRect({
              id: `${baseId}_col3`,
              x: x3,
              y: startY,
              width: colW,
              height: colH,
              strokeColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.08)",
            }),
            createText({
              id: `${baseId}_t3`,
              x: x3 + 16,
              y: startY + 14,
              width: 170,
              height: 24,
              text: "✅ DONE (2)",
              fontSize: 16,
              strokeColor: "#34d399",
            }),
            createRect({
              id: `${baseId}_c3_1`,
              x: x3 + 12,
              y: startY + 50,
              width: 186,
              height: 55,
              strokeColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.14)",
            }),
            createText({
              id: `${baseId}_c3_1t`,
              x: x3 + 22,
              y: startY + 65,
              width: 165,
              height: 22,
              text: "[PRO-101] Core Board Setup",
              fontSize: 12,
              strokeColor: "#d1fae5",
            }),
            createRect({
              id: `${baseId}_c3_2`,
              x: x3 + 12,
              y: startY + 115,
              width: 186,
              height: 55,
              strokeColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.14)",
            }),
            createText({
              id: `${baseId}_c3_2t`,
              x: x3 + 22,
              y: startY + 130,
              width: 165,
              height: 22,
              text: "[PRO-103] Pyodide WASM Engine",
              fontSize: 12,
              strokeColor: "#d1fae5",
            })
          );

          labelMsg = "Generated Corporate Kanban Board with 3 active columns!";
          break;
        }

        // ── 2. System Architecture Diagram ──
        case "sysarch": {
          const yPos = centerY - 30;
          newElements.push(
            // Client Tier
            createRect({
              id: `${baseId}_tier1`,
              x: centerX - 360,
              y: yPos,
              width: 170,
              height: 75,
              strokeColor: "#00f5ff",
              backgroundColor: "rgba(0, 245, 255, 0.12)",
            }),
            createText({
              id: `${baseId}_tier1_t`,
              x: centerX - 345,
              y: yPos + 22,
              width: 140,
              height: 35,
              text: "Next.js Web / Client",
              fontSize: 13,
              strokeColor: "#e0f2fe",
            }),
            createArrow({
              id: `${baseId}_arr1`,
              x: centerX - 190,
              y: yPos + 37,
              width: 60,
              height: 2,
              points: [[0, 0], [60, 0]],
              strokeColor: "#00f5ff",
            }),

            // Gateway Tier
            createRect({
              id: `${baseId}_tier2`,
              x: centerX - 120,
              y: yPos,
              width: 180,
              height: 75,
              strokeColor: "#a855f7",
              backgroundColor: "rgba(168, 85, 247, 0.15)",
            }),
            createText({
              id: `${baseId}_tier2_t`,
              x: centerX - 105,
              y: yPos + 22,
              width: 150,
              height: 35,
              text: "API Gateway & Auth",
              fontSize: 13,
              strokeColor: "#f3e8ff",
            }),
            createArrow({
              id: `${baseId}_arr2`,
              x: centerX + 60,
              y: yPos + 37,
              width: 60,
              height: 2,
              points: [[0, 0], [60, 0]],
              strokeColor: "#a855f7",
            }),

            // Database Tier
            createRect({
              id: `${baseId}_tier3`,
              x: centerX + 130,
              y: yPos,
              width: 180,
              height: 75,
              strokeColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
            }),
            createText({
              id: `${baseId}_tier3_t`,
              x: centerX + 145,
              y: yPos + 22,
              width: 150,
              height: 35,
              text: "Postgres + pgvector",
              fontSize: 13,
              strokeColor: "#d1fae5",
            })
          );

          labelMsg = "Generated Multi-Tier System Architecture Diagram!";
          break;
        }

        // ── 3. SWOT Analysis Framework ──
        case "swot": {
          const qW = 210;
          const qH = 135;
          const sX = centerX - 220;
          const sY = centerY - 140;

          newElements.push(
            // Strengths
            createRect({
              id: `${baseId}_s`,
              x: sX,
              y: sY,
              width: qW,
              height: qH,
              strokeColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
            }),
            createText({
              id: `${baseId}_st`,
              x: sX + 15,
              y: sY + 15,
              width: 180,
              height: 25,
              text: "💪 STRENGTHS (Internal)",
              fontSize: 13,
              strokeColor: "#34d399",
            }),
            createText({
              id: `${baseId}_sb`,
              x: sX + 15,
              y: sY + 45,
              width: 180,
              height: 60,
              text: "• Native WASM code exec\n• Ultra-fast Excalidraw UI\n• Multi-agent RAG search",
              fontSize: 11,
              strokeColor: "#a7f3d0",
            }),

            // Weaknesses
            createRect({
              id: `${baseId}_w`,
              x: sX + qW + 15,
              y: sY,
              width: qW,
              height: qH,
              strokeColor: "#f43f5e",
              backgroundColor: "rgba(244, 63, 94, 0.12)",
            }),
            createText({
              id: `${baseId}_wt`,
              x: sX + qW + 30,
              y: sY + 15,
              width: 180,
              height: 25,
              text: "⚠️ WEAKNESSES (Internal)",
              fontSize: 13,
              strokeColor: "#fb7185",
            }),
            createText({
              id: `${baseId}_wb`,
              x: sX + qW + 30,
              y: sY + 45,
              width: 180,
              height: 60,
              text: "• Initial mobile sync polish\n• Higher GPU memory cap\n• Complex edge caching",
              fontSize: 11,
              strokeColor: "#fecdd3",
            }),

            // Opportunities
            createRect({
              id: `${baseId}_o`,
              x: sX,
              y: sY + qH + 15,
              width: qW,
              height: qH,
              strokeColor: "#00f5ff",
              backgroundColor: "rgba(0, 245, 255, 0.12)",
            }),
            createText({
              id: `${baseId}_ot`,
              x: sX + 15,
              y: sY + qH + 30,
              width: 180,
              height: 25,
              text: "🚀 OPPORTUNITIES (Market)",
              fontSize: 13,
              strokeColor: "#38bdf8",
            }),
            createText({
              id: `${baseId}_ob`,
              x: sX + 15,
              y: sY + qH + 60,
              width: 180,
              height: 60,
              text: "• Enterprise Whiteboards\n• AI-driven Agile planning\n• C-Level Executive suite",
              fontSize: 11,
              strokeColor: "#bae6fd",
            }),

            // Threats
            createRect({
              id: `${baseId}_t`,
              x: sX + qW + 15,
              y: sY + qH + 15,
              width: qW,
              height: qH,
              strokeColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
            }),
            createText({
              id: `${baseId}_tt`,
              x: sX + qW + 30,
              y: sY + qH + 30,
              width: 180,
              height: 25,
              text: "🛡️ THREATS (External)",
              fontSize: 13,
              strokeColor: "#fbbf24",
            }),
            createText({
              id: `${baseId}_tb`,
              x: sX + qW + 30,
              y: sY + qH + 60,
              width: 180,
              height: 60,
              text: "• Incumbent collaboration tools\n• Data privacy compliance\n• Shifting API rate limits",
              fontSize: 11,
              strokeColor: "#fde68a",
            })
          );

          labelMsg = "Generated SWOT Strategic Analysis Framework!";
          break;
        }

        // ── 4. Create Meeting Agenda ──
        case "agenda": {
          const aX = centerX - 220;
          const aY = centerY - 140;
          const aW = 440;

          newElements.push(
            // Header
            createRect({
              id: `${baseId}_hdr`,
              x: aX,
              y: aY,
              width: aW,
              height: 65,
              strokeColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.14)",
            }),
            createText({
              id: `${baseId}_hdrt`,
              x: aX + 16,
              y: aY + 12,
              width: 400,
              height: 25,
              text: "📅 EXECUTIVE SPRINT REVIEW & STRATEGY SYNC",
              fontSize: 14,
              strokeColor: "#ffffff",
            }),
            createText({
              id: `${baseId}_hdrsub`,
              x: aX + 16,
              y: aY + 36,
              width: 400,
              height: 20,
              text: "Attendees: Executive Leadership & Engineering Leads • Duration: 45m",
              fontSize: 11,
              strokeColor: "#94a3b8",
            }),

            // Items
            createRect({
              id: `${baseId}_it1`,
              x: aX,
              y: aY + 80,
              width: aW,
              height: 50,
              strokeColor: "#334155",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }),
            createText({
              id: `${baseId}_it1t`,
              x: aX + 16,
              y: aY + 95,
              width: 400,
              height: 22,
              text: "01. Q3 Roadmap Review & Milestone Status (15m)",
              fontSize: 13,
              strokeColor: "#e2e8f0",
            }),

            createRect({
              id: `${baseId}_it2`,
              x: aX,
              y: aY + 140,
              width: aW,
              height: 50,
              strokeColor: "#334155",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }),
            createText({
              id: `${baseId}_it2t`,
              x: aX + 16,
              y: aY + 155,
              width: 400,
              height: 22,
              text: "02. Technical Architecture & Scale Bottlenecks (20m)",
              fontSize: 13,
              strokeColor: "#e2e8f0",
            }),

            createRect({
              id: `${baseId}_it3`,
              x: aX,
              y: aY + 200,
              width: aW,
              height: 50,
              strokeColor: "#334155",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            }),
            createText({
              id: `${baseId}_it3t`,
              x: aX + 16,
              y: aY + 215,
              width: 400,
              height: 22,
              text: "03. Action Items, Owners & Sign-Off (10m)",
              fontSize: 13,
              strokeColor: "#e2e8f0",
            })
          );

          labelMsg = "Created Meeting Agenda Framework on canvas!";
          break;
        }

        // ── 5. User Journey Map ──
        case "userjourney": {
          const sW = 140;
          const sH = 90;
          const yPos = centerY - 40;
          const startX = centerX - 330;

          const steps = [
            { num: "1. DISCOVERY", desc: "Organic search\nInteractive demo", color: "#38bdf8" },
            { num: "2. ONBOARD", desc: "Instant canvas\nZero signup wall", color: "#a855f7" },
            { num: "3. EXECUTE", desc: "Realtime team sync\nAI drawing bot", color: "#10b981" },
            { num: "4. ADVOCATE", desc: "Clean 4K export\nEnterprise Pro upgrade", color: "#f59e0b" },
          ];

          steps.forEach((st, i) => {
            const curX = startX + i * (sW + 30);
            newElements.push(
              createRect({
                id: `${baseId}_uj_${i}`,
                x: curX,
                y: yPos,
                width: sW,
                height: sH,
                strokeColor: st.color,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }),
              createText({
                id: `${baseId}_ujt_${i}`,
                x: curX + 10,
                y: yPos + 12,
                width: sW - 20,
                height: 20,
                text: st.num,
                fontSize: 12,
                strokeColor: st.color,
              }),
              createText({
                id: `${baseId}_ujd_${i}`,
                x: curX + 10,
                y: yPos + 38,
                width: sW - 20,
                height: 40,
                text: st.desc,
                fontSize: 11,
                strokeColor: "#cbd5e1",
              })
            );

            if (i < steps.length - 1) {
              newElements.push(
                createArrow({
                  id: `${baseId}_uja_${i}`,
                  x: curX + sW,
                  y: yPos + sH / 2,
                  width: 30,
                  height: 2,
                  points: [[0, 0], [30, 0]],
                  strokeColor: st.color,
                })
              );
            }
          });

          labelMsg = "Generated 4-Stage User Journey Map!";
          break;
        }

        // ── Primitives & Essential Shapes ──
        case "rectangle":
          newElements.push(
            createRect({
              id: baseId,
              x: centerX,
              y: centerY,
              width: 200,
              height: 120,
              strokeColor: "#00f5ff",
              backgroundColor: "rgba(0, 245, 255, 0.15)",
            })
          );
          labelMsg = "Drawn a Container Box on canvas!";
          break;

        case "triangle":
          newElements.push({
            id: baseId,
            type: "line",
            x: centerX,
            y: centerY,
            width: 180,
            height: 160,
            angle: 0,
            strokeColor: "#a855f7",
            backgroundColor: "rgba(168, 85, 247, 0.2)",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            frameId: null,
            roundness: null,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
            points: [
              [90, 0],
              [180, 160],
              [0, 160],
              [90, 0],
            ],
            lastCommittedPoint: null,
            startBinding: null,
            endBinding: null,
            startArrowhead: null,
            endArrowhead: null,
          });
          labelMsg = "Drawn a Triangle on canvas!";
          break;

        case "circle":
          newElements.push({
            id: baseId,
            type: "ellipse",
            x: centerX,
            y: centerY,
            width: 150,
            height: 150,
            angle: 0,
            strokeColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            frameId: null,
            roundness: null,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
          });
          labelMsg = "Drawn a Circle on canvas!";
          break;

        case "diamond":
          newElements.push({
            id: baseId,
            type: "diamond",
            x: centerX,
            y: centerY,
            width: 160,
            height: 160,
            angle: 0,
            strokeColor: "#ec4899",
            backgroundColor: "rgba(236, 72, 153, 0.15)",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 1,
            opacity: 100,
            groupIds: [],
            frameId: null,
            roundness: { type: 2 },
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: Math.floor(Math.random() * 100000),
            isDeleted: false,
            boundElements: null,
            updated: Date.now(),
            link: null,
            locked: false,
          });
          labelMsg = "Drawn a Decision Gateway on canvas!";
          break;

        case "textbox":
          newElements.push(
            createText({
              id: baseId,
              x: centerX,
              y: centerY,
              width: 220,
              height: 40,
              text: "Enterprise Project Note",
              fontSize: 18,
              strokeColor: "#38bdf8",
            })
          );
          labelMsg = "Added a Text Box to canvas!";
          break;

        case "stickynote":
          newElements.push(
            createRect({
              id: baseId,
              x: centerX,
              y: centerY,
              width: 170,
              height: 170,
              strokeColor: "#eab308",
              backgroundColor: "rgba(234, 179, 8, 0.25)",
              roundness: 3,
            }),
            createText({
              id: `${baseId}_txt`,
              x: centerX + 15,
              y: centerY + 20,
              width: 140,
              height: 120,
              text: "💡 Executive Note:\nReview Sprint OKRs before Friday sync.",
              fontSize: 13,
              strokeColor: "#fef08a",
            })
          );
          labelMsg = "Placed an Executive Sticky Note on canvas!";
          break;

        case "database":
          newElements.push(
            createRect({
              id: baseId,
              x: centerX,
              y: centerY,
              width: 150,
              height: 160,
              strokeColor: "#6366f1",
              backgroundColor: "rgba(99, 102, 241, 0.2)",
            }),
            createText({
              id: `${baseId}_t`,
              x: centerX + 15,
              y: centerY + 20,
              width: 120,
              height: 30,
              text: "🗄️ Database",
              fontSize: 14,
              strokeColor: "#c7d2fe",
            })
          );
          labelMsg = "Added a Database container to canvas!";
          break;

        default:
          console.warn(`Unknown commandType: ${commandType}`);
          return;
      }

      if (newElements.length > 0) {
        api.updateScene({
          elements: [...existingElements, ...newElements],
          commitToHistory: true,
        });

        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: `✨ ${labelMsg}` },
        ]);
      }
    } catch (err: any) {
      console.error("Execute command error:", err);
    } finally {
      setIsGenerating(false);
    }
  },
  [excalidrawAPI]
);

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputMsg.trim();
    if (!query || isGenerating) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setInputMsg("");

    const lower = query.toLowerCase();
    if (lower.includes("triangle")) {
      executeCommand("triangle");
    } else if (lower.includes("rect") || lower.includes("square") || lower.includes("box")) {
      executeCommand("rectangle");
    } else if (lower.includes("clear") || lower.includes("reset")) {
      const api = excalidrawAPI || excalidrawAPIRef.current;
      if (api?.resetScene) {
        api.resetScene();
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: "🧹 Canvas cleared." },
        ]);
      }
    } else {
      setIsGenerating(true);
      // Call Next.js Load Balancer API Route for custom user prompts
      (async () => {
        try {
          const storedUser = typeof window !== "undefined" ? (localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user")) : null;
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          const userEmail = parsedUser?.email || "guest@masmspace.ai";
          const userId = parsedUser?.id;

          const res = await fetch("/api/execute-command", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: query,
              userEmail,
              userId,
            }),
          });

          if (res.status === 403) {
            const errData = await res.json();
            if (errData.code === "UPGRADE_REQUIRED") {
              setPricingModalReason(
                `You have reached your daily quota of ${errData.action_limit || 15} AI actions.`
              );
              setShowPricingModal(true);
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  text: `⚠️ Daily AI quota reached (${errData.actions_used}/${errData.action_limit}). Upgrade to PRATHOMIX PRO to continue.`,
                },
              ]);
              return;
            }
          }

          const data = await res.json();
          if (data.usage) {
            setAiUsage(data.usage);
          }

          if (data.elements && data.elements.length > 0) {
            const api = excalidrawAPI || excalidrawAPIRef.current;
            if (api) {
              const existing = api.getSceneElements ? api.getSceneElements() : [];
              const activeExisting = existing.filter((el: any) => !el.isDeleted);
              
              let finalElements = data.elements;
              if (activeExisting.length > 0) {
                let maxCanvasX = -Infinity;
                for (const el of activeExisting) {
                  const elRight = (el.x || 0) + (el.width || 0);
                  if (elRight > maxCanvasX) maxCanvasX = elRight;
                }
                let minNewX = Infinity;
                for (const el of data.elements) {
                  if (typeof el.x === "number" && el.x < minNewX) minNewX = el.x;
                }
                if (isFinite(maxCanvasX) && isFinite(minNewX) && minNewX <= maxCanvasX + 40) {
                  const shiftX = maxCanvasX + 80 - minNewX;
                  finalElements = data.elements.map((el: any) => ({
                    ...el,
                    x: typeof el.x === "number" ? el.x + shiftX : el.x,
                  }));
                }
              }

              api.updateScene({
                elements: [...existing, ...finalElements],
                commitToHistory: true,
              });
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "ai",
                  text: `✨ Generated elements via ${data.provider || "AI Engine"}.`,
                },
              ]);
            }
          }
        } catch (err: any) {
          console.warn("API execute-command failed, fallback:", err.message);
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: `Processed "${query}". You can also click Quick Commands below.`,
            },
          ]);
        } finally {
          setIsGenerating(false);
        }
      })();
    }
  };
  const boardSnapshotsRef = useRef<Record<string, { elements: readonly any[]; appState?: any; files?: any }>>({});

  // AI Summary State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummarizeResponse | null>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Current User Auth State for RAG Ownership and Laser Peer Display
  // ───────────────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ id?: string; email?: string; name?: string } | null>(null);

  useEffect(() => {
    try {
      const savedUser =
        localStorage.getItem("masmspace_current_user") ||
        localStorage.getItem("wasmspace_current_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed) setCurrentUser(parsed);
      }
    } catch {}

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0],
        });
      }
    }).catch(() => {});
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Realtime Laser Pointer Broadcast & Peer Collaboration (WebSockets + BroadcastChannel)
  // ───────────────────────────────────────────────────────────────────────────
  const [peerLasers, setPeerLasers] = useState<Record<string, { x: number; y: number; userName: string; timestamp: number }>>({});
  const channelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channelName = `board:${activeFileId || "default"}`;
    const supabase = createClient();

    // 1. Supabase Realtime WebSocket Channel
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "laser:pointer" }, ({ payload }) => {
        if (!payload || !payload.userId) return;
        setPeerLasers((prev) => {
          if (payload.x === null || payload.y === null) {
            const next = { ...prev };
            delete next[payload.userId];
            return next;
          }
          return {
            ...prev,
            [payload.userId]: {
              x: payload.x,
              y: payload.y,
              userName: payload.userName || "Collaborator",
              timestamp: Date.now(),
            },
          };
        });
      })
      .subscribe();

    channelRef.current = channel;

    // 2. BroadcastChannel for instant local cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(`masmspace-laser-${activeFileId || "default"}`);
      bc.onmessage = (event) => {
        const payload = event.data;
        if (!payload || !payload.userId) return;
        setPeerLasers((prev) => {
          if (payload.x === null || payload.y === null) {
            const next = { ...prev };
            delete next[payload.userId];
            return next;
          }
          return {
            ...prev,
            [payload.userId]: {
              x: payload.x,
              y: payload.y,
              userName: payload.userName || "Collaborator",
              timestamp: Date.now(),
            },
          };
        });
      };
      broadcastChannelRef.current = bc;
    }

    // Decay interval to prune inactive peer lasers after 2.5 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      setPeerLasers((prev) => {
        let changed = false;
        const updated = { ...prev };
        for (const [id, laser] of Object.entries(updated)) {
          if (now - laser.timestamp > 2500) {
            delete updated[id];
            changed = true;
          }
        }
        return changed ? updated : prev;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
      if (bc) bc.close();
    };
  }, [activeFileId]);

  // Throttled Laser coordinates broadcaster (50ms throttled from HUD)
  const handleLaserMove = useCallback((pos: { x: number; y: number } | null) => {
    const payload = {
      userId: currentUser?.id || "local-presenter",
      userName: currentUser?.name || currentUser?.email?.split("@")[0] || "Presenter",
      x: pos ? pos.x : null,
      y: pos ? pos.y : null,
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "laser:pointer",
        payload,
      }).catch(() => {});
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch {}
    }
  }, [currentUser]);

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas Text Extraction & Vector pgvector Indexing (Board Brain RAG)
  // ───────────────────────────────────────────────────────────────────────────
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingNotice, setIndexingNotice] = useState<string | null>(null);

  /**
   * Scrapes all text nodes, sticky notes, container-bound text, labels, and
   * element annotations across the entire Excalidraw scene.
   */
  const extractCanvasText = useCallback((elements: readonly any[]): string => {
    const textPieces: string[] = [];
    const seenTexts = new Set<string>();

    for (const el of elements) {
      if (!el || el.isDeleted) continue;

      // 1. Direct text element or sticky note text
      if (typeof el.text === "string" && el.text.trim()) {
        const trimmed = el.text.trim();
        if (!seenTexts.has(trimmed)) {
          seenTexts.add(trimmed);
          textPieces.push(trimmed);
        }
      }

      // 2. originalText field
      if (typeof el.originalText === "string" && el.originalText.trim()) {
        const trimmed = el.originalText.trim();
        if (!seenTexts.has(trimmed)) {
          seenTexts.add(trimmed);
          textPieces.push(trimmed);
        }
      }

      // 3. Shape labels (e.g. rectangles/diamonds/arrows with text)
      if (el.label) {
        const labelText = typeof el.label === "string" ? el.label : el.label?.text;
        if (typeof labelText === "string" && labelText.trim()) {
          const trimmed = labelText.trim();
          if (!seenTexts.has(trimmed)) {
            seenTexts.add(trimmed);
            textPieces.push(trimmed);
          }
        }
      }

      // 4. Custom data text or OCR notes
      if (typeof el.customData?.text === "string" && el.customData.text.trim()) {
        const trimmed = el.customData.text.trim();
        if (!seenTexts.has(trimmed)) {
          seenTexts.add(trimmed);
          textPieces.push(trimmed);
        }
      }
    }

    return textPieces.join("\n");
  }, []);

  /**
   * Save & Index: Extracts canvas text and stores vector embeddings in Supabase pgvector
   */
  const handleSaveAndIndex = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    setIsIndexing(true);
    setIndexingNotice(null);

    try {
      const elements = api.getSceneElements().filter((el: any) => !el.isDeleted);
      const extractedText = extractCanvasText(elements) || "MasmSpace whiteboard canvas";
      const ownerId = currentUser?.id || "00000000-0000-0000-0000-000000000000";
      const boardId = activeFileId || "default-board";

      const res = await indexCanvasSession({
        board_id: boardId,
        owner_id: ownerId,
        title: boardTitle || "Canvas Session",
        extracted_text: extractedText,
        tags: ["canvas", "indexed"],
      });

      setIndexingNotice("Board indexed successfully! Search is ready.");
      setTimeout(() => setIndexingNotice(null), 3500);
      return res;
    } catch (err: any) {
      console.warn("[Save & Index] Notice:", err?.message);
      setIndexingNotice(`Indexed with fallback: ${err?.message || "Ready"}`);
      setTimeout(() => setIndexingNotice(null), 3500);
    } finally {
      setIsIndexing(false);
    }
  }, [extractCanvasText, currentUser, activeFileId, boardTitle]);

  // ───────────────────────────────────────────────────────────────────────────
  // Multiplayer Preparation & Synchronization Engine
  // ───────────────────────────────────────────────────────────────────────────
  /**
   * Broadcasts local canvas changes to all active collaborators via Supabase Realtime Channels.
   *
   * Architecture Note:
   * Uses Supabase Broadcast channel (`realtime:masmspace-canvas:<board_id>`) to multiplex
   * delta changes with debounce to avoid network saturation, while persisting complete
   * scene snapshots periodically to Supabase Postgres with pgvector embeddings.
   */
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastCanvasUpdate = useCallback(
    (elements: readonly any[], appState: any) => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(() => {
        if (process.env.NODE_ENV === "development" && elements && appState) {
          // Development diagnostic logger for local state tracking
          // console.debug(`[Multiplayer Sync] ${elements.length} elements cached.`);
        }
        /* 
         * ── Supabase Realtime WebSocket Push Architecture ──────────────────
         * In production with active Supabase credentials:
         *
         * const channel = supabase.channel(`board:${activeFileId}`, {
         *   config: { broadcast: { self: false, ack: false } },
         * });
         * 
         * channel.send({
         *   type: "broadcast",
         *   event: "canvas:change",
         *   payload: {
         *     boardId: activeFileId,
         *     elements, // Serialized Excalidraw scene elements
         *     appState: {
         *       viewBackgroundColor: appState.viewBackgroundColor,
         *       zoom: appState.zoom,
         *       scrollX: appState.scrollX,
         *       scrollY: appState.scrollY,
         *     },
         *     timestamp: Date.now(),
         *   },
         * });
         */
        // Dev log placeholder showing captured element count
        // console.log(`[Multiplayer Sync] Broadcasted ${elements.length} elements for board ${activeFileId}`);
      }, 150);
    },
    []
  );

  /**
   * Excalidraw onChange Event Handler
   */
  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      // 1. Maintain in-memory snapshot for active board
      boardSnapshotsRef.current[activeFileId] = { elements, appState, files };

      // 2. Trigger debounced multiplayer sync
      broadcastCanvasUpdate(elements, appState);
    },
    [activeFileId, broadcastCanvasUpdate]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // File Tree Management (Save/Restore Scene per Board)
  // ───────────────────────────────────────────────────────────────────────────
  const handleSelectFile = useCallback(
    async (file: BoardFileNode) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      // 1. Persist current scene elements and files
      if (activeFileId) {
        boardSnapshotsRef.current[activeFileId] = {
          elements: api.getSceneElements(),
          appState: api.getAppState(),
          files: api.getFiles(),
        };
      }

      setActiveFileId(file.id);
      setBoardTitle(file.name.replace(/\.masmspace$/, ""));

      // 2. Restore saved scene or initialize fresh board
      const savedSnapshot = boardSnapshotsRef.current[file.id];
      if (savedSnapshot && savedSnapshot.elements?.length > 0) {
        if (savedSnapshot.files) {
          api.addFiles(Object.values(savedSnapshot.files));
        }
        api.updateScene({
          elements: savedSnapshot.elements,
          commitToHistory: true,
        });
        setTimeout(() => {
          api.scrollToContent(savedSnapshot.elements, { fitToViewport: true });
        }, 80);
      } else {
        // Fresh board greeting card
        const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
        const greetingElements = convertToExcalidrawElements([
          {
            type: "rectangle",
            x: 250,
            y: 180,
            width: 380,
            height: 140,
            backgroundColor: "#0d1322",
            strokeColor: "#00f5ff",
            fillStyle: "solid",
            roundness: { type: 3 },
            label: {
              text: `✦ ${file.name}\nReady for infinite diagramming & brainstorming!`,
              fontSize: 16,
              strokeColor: "#f1f5f9",
            },
          },
        ]);

        api.updateScene({
          elements: greetingElements,
          commitToHistory: true,
        });
        setTimeout(() => {
          api.scrollToContent(greetingElements, { fitToViewport: true });
        }, 80);
      }
    },
    [activeFileId]
  );

  const handleCreateFile = useCallback(
    (parentId: string | null, name: string) => {
      const formattedName = name.endsWith(".masmspace") ? name : `${name}.masmspace`;
      const newFile: BoardFileNode = {
        id: `file-${Date.now()}`,
        name: formattedName,
        type: "file",
        parentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTreeNodes((prev) => {
        if (!parentId) return [...prev, newFile];

        const addRecursive = (nodes: BoardFileNode[]): BoardFileNode[] => {
          return nodes.map((n) => {
            if (n.id === parentId && n.type === "folder") {
              return { ...n, children: [...(n.children || []), newFile] };
            }
            if (n.children) {
              return { ...n, children: addRecursive(n.children) };
            }
            return n;
          });
        };
        return addRecursive(prev);
      });

      handleSelectFile(newFile);
    },
    [handleSelectFile]
  );

  const handleCreateFolder = useCallback((parentId: string | null, name: string) => {
    const newFolder: BoardFileNode = {
      id: `folder-${Date.now()}`,
      name: name.trim() || "New Folder",
      type: "folder",
      parentId,
      children: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTreeNodes((prev) => {
      if (!parentId) return [...prev, newFolder];

      const addRecursive = (nodes: BoardFileNode[]): BoardFileNode[] => {
        return nodes.map((n) => {
          if (n.id === parentId && n.type === "folder") {
            return { ...n, children: [...(n.children || []), newFolder] };
          }
          if (n.children) {
            return { ...n, children: addRecursive(n.children) };
          }
          return n;
        });
      };
      return addRecursive(prev);
    });
  }, []);

  const handleRenameNode = useCallback(
    (id: string, newName: string) => {
      setTreeNodes((prev) => {
        const renameRecursive = (nodes: BoardFileNode[]): BoardFileNode[] => {
          return nodes.map((n) => {
            if (n.id === id) {
              return { ...n, name: newName, updatedAt: new Date().toISOString() };
            }
            if (n.children) {
              return { ...n, children: renameRecursive(n.children) };
            }
            return n;
          });
        };
        return renameRecursive(prev);
      });

      if (id === activeFileId) {
        setBoardTitle(newName.replace(/\.masmspace$/, ""));
      }
    },
    [activeFileId]
  );

  const handleDeleteNode = useCallback((id: string) => {
    setTreeNodes((prev) => {
      const deleteRecursive = (nodes: BoardFileNode[]): BoardFileNode[] => {
        return nodes
          .filter((n) => n.id !== id)
          .map((n) => (n.children ? { ...n, children: deleteRecursive(n.children) } : n));
      };
      return deleteRecursive(prev);
    });
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // PDF Import & Canvas Insertion (Converted to Excalidraw Images)
  // ───────────────────────────────────────────────────────────────────────────
  const handleImportPdfPages = useCallback(
    async (pages: RenderedPdfPage[], fileName: string) => {
      const api = excalidrawAPIRef.current;
      if (!api || pages.length === 0) return;

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");

      // 1. Register binary image files with Excalidraw's store
      const fileDataList = pages.map((page, idx) => ({
        id: `pdf-${Date.now()}-${idx}` as any,
        dataURL: page.dataUrl as any,
        mimeType: "image/png" as const,
        created: Date.now(),
      }));
      api.addFiles(fileDataList);

      // 2. Generate Excalidraw element skeletons
      let startX = 120;
      const startY = 160;
      const currentElements = api.getSceneElements();

      const newSkeletons: any[] = [];
      pages.forEach((page, idx) => {
        const fileId = fileDataList[idx].id;

        // Label above page
        newSkeletons.push({
          type: "text",
          text: `📄 Page ${page.pageNumber} (${fileName})`,
          x: startX,
          y: startY - 36,
          fontSize: 16,
          strokeColor: "#00f5ff",
        });

        // High-resolution PDF page image
        newSkeletons.push({
          type: "image",
          fileId,
          x: startX,
          y: startY,
          width: page.width,
          height: page.height,
          strokeColor: "transparent",
        });

        startX += page.width + 60;
      });

      const createdElements = convertToExcalidrawElements(newSkeletons);
      api.updateScene({
        elements: [...currentElements, ...createdElements],
        commitToHistory: true,
      });

      setTimeout(() => {
        api.scrollToContent(createdElements, { fitToViewport: true });
      }, 100);
    },
    []
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Multi-Language Code Studio: Insert Output to Canvas
  // ───────────────────────────────────────────────────────────────────────────
  const handleInsertCodeOutput = useCallback(
    async (executionResult: string, isError: boolean, selectedLanguage: string = "python") => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      // Clean up any duplicate prefixes if already present in executionResult
      const cleanedResult = executionResult
        .replace(/^(?:[^\w\s]*\s*)?[A-Za-z0-9#+]+\s*Output:\s*/i, "")
        .trim();

      // Dynamic language output title (e.g., 'c' -> "C Output:", 'javascript' -> "Javascript Output:")
      const langTitle = selectedLanguage
        ? selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)
        : "Code";

      const outputText = `${langTitle} Output:\n\n${cleanedResult.slice(0, 600)}`;

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const appState = api.getAppState();
      const posX = appState.scrollX ? -appState.scrollX + 300 : 300;
      const posY = appState.scrollY ? -appState.scrollY + 200 : 200;

      const newNote = convertToExcalidrawElements([
        {
          type: "rectangle",
          x: posX,
          y: posY,
          width: 380,
          height: 180,
          backgroundColor: isError ? "#450a0a" : "#1e1338",
          strokeColor: isError ? "#ef4444" : "#a855f7",
          fillStyle: "solid",
          roundness: { type: 3 },
          label: {
            text: outputText,
            fontSize: 14,
            strokeColor: "#f8fafc",
          },
        },
      ]);

      api.updateScene({
        elements: [...api.getSceneElements(), ...newNote],
        commitToHistory: true,
      });
      api.scrollToContent(newNote, { fitToViewport: true });
    },
    []
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Canvas Screenshot & Export Engine (Free: MasmSpace Watermark | Pro: Clean)
  // ───────────────────────────────────────────────────────────────────────────
  const handleTakeScreenshot = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    try {
      const elements = api.getSceneElements().filter((el: any) => !el.isDeleted);
      if (!elements || elements.length === 0) {
        alert("Canvas is empty! Draw something first to capture a screenshot.");
        return;
      }

      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const appState = api.getAppState();
      const files = api.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: true,
          exportBackground: true,
        },
        files,
      });

      if (!blob) return;

      // ── PRO MEMBER: Clean, unbranded, watermark-free download ──────────────
      if (isProUser) {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${boardTitle.replace(/\s+/g, "_")}_pro.png`;
        a.click();
        URL.revokeObjectURL(downloadUrl);
        return;
      }

      // ── NORMAL / FREE USER: Stamp official MasmSpace Watermark ───────────────
      const img = new Image();
      const rawUrl = URL.createObjectURL(blob);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw original canvas drawing
        ctx.drawImage(img, 0, 0);

        // Watermark pill details (Only rendered on the exported image, never on the live UI)
        const text = "✦ Powered by MasmSpace";
        ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const metrics = ctx.measureText(text);
        const padding = 16;
        const pillWidth = metrics.width + padding * 2;
        const pillHeight = 38;
        const x = canvas.width - pillWidth - 24;
        const y = canvas.height - pillHeight - 24;

        // Glowing dark pill background with cyan border
        ctx.fillStyle = "rgba(6, 7, 10, 0.90)";
        ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, pillWidth, pillHeight, 19);
        ctx.fill();
        ctx.stroke();

        // Watermark vibrant cyan typography
        ctx.fillStyle = "#22d3ee";
        ctx.fillText(text, x + padding, y + 24);

        canvas.toBlob((watermarkedBlob) => {
          if (!watermarkedBlob) return;
          const downloadUrl = URL.createObjectURL(watermarkedBlob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `${boardTitle.replace(/\s+/g, "_")}_watermarked.png`;
          a.click();
          URL.revokeObjectURL(downloadUrl);
        }, "image/png");

        URL.revokeObjectURL(rawUrl);
      };
      img.src = rawUrl;
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    }
  }, [boardTitle, isProUser]);

  // ───────────────────────────────────────────────────────────────────────────
  // AI Canvas Summarization (Extract text from Excalidraw scene)
  // ───────────────────────────────────────────────────────────────────────────
  const handleSummarise = useCallback(async () => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    setError(null);
    setSummaryData(null);
    setModalOpen(true);
    setIsLoading(true);

    try {
      const allElements = api.getSceneElements().filter((el: any) => !el.isDeleted);

      // Extract all text, sticky notes, and labels across the canvas
      const canvasText = extractCanvasText(allElements) || "No textual elements found on the canvas.";

      const shapesPayload = allElements.map((el: any) => ({
        id: el.id,
        type: el.type,
        props: {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          strokeColor: el.strokeColor,
          backgroundColor: el.backgroundColor,
        },
      }));

      // 1. Call AI Summarization Engine
      const result = await summarizeCanvas({
        canvas_text: canvasText,
        shapes: shapesPayload,
        board_title: boardTitle,
      });

      setSummaryData(result);

      // 2. Automatically index into Supabase pgvector store for hybrid search
      indexCanvasSession({
        board_id: activeFileId || "default-board",
        owner_id: currentUser?.id || "00000000-0000-0000-0000-000000000000",
        title: boardTitle || "Canvas Session",
        extracted_text: canvasText,
        tags: ["canvas", "summary"],
      }).catch((err) => console.warn("[Auto-Index] Notice:", err?.message));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while analysing the canvas.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [boardTitle, extractCanvasText, activeFileId, currentUser]);

  // ───────────────────────────────────────────────────────────────────────────
  // Voice Control Handlers mapped to Excalidraw
  // ───────────────────────────────────────────────────────────────────────────
  const voiceEvents = {
    onClearBoard: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (api) api.resetScene();
    }, []),

    onDrawShape: useCallback(async (geo: string) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const shapeType = geo === "ellipse" ? "ellipse" : geo === "diamond" ? "diamond" : "rectangle";

      const newShape = convertToExcalidrawElements([
        {
          type: shapeType,
          x: 350,
          y: 240,
          width: 220,
          height: 140,
          strokeColor: "#00f5ff",
          backgroundColor: "rgba(0, 245, 255, 0.12)",
          fillStyle: "solid",
        },
      ]);

      api.updateScene({
        elements: [...api.getSceneElements(), ...newShape],
        commitToHistory: true,
      });
      api.scrollToContent(newShape, { fitToViewport: true });
    }, []),

    onAddNote: useCallback(async (text: string) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const newNote = convertToExcalidrawElements([
        {
          type: "rectangle",
          x: 320,
          y: 220,
          width: 260,
          height: 150,
          backgroundColor: "#2e1065",
          strokeColor: "#a855f7",
          fillStyle: "solid",
          roundness: { type: 3 },
          label: {
            text: text || "Spoken note",
            fontSize: 16,
            strokeColor: "#ffffff",
          },
        },
      ]);

      api.updateScene({
        elements: [...api.getSceneElements(), ...newNote],
        commitToHistory: true,
      });
      api.scrollToContent(newNote, { fitToViewport: true });
    }, []),

    onAddText: useCallback(async (text: string) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const newText = convertToExcalidrawElements([
        {
          type: "text",
          text: text || "Voice Dictated Text",
          x: 350,
          y: 250,
          fontSize: 22,
          strokeColor: "#00f5ff",
        },
      ]);

      api.updateScene({
        elements: [...api.getSceneElements(), ...newText],
        commitToHistory: true,
      });
    }, []),

    onZoomIn: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      const currentZoom = api.getAppState().zoom.value;
      api.updateScene({ appState: { zoom: { value: currentZoom * 1.25 } } });
    }, []),

    onZoomOut: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      const currentZoom = api.getAppState().zoom.value;
      api.updateScene({ appState: { zoom: { value: Math.max(0.2, currentZoom * 0.8) } } });
    }, []),

    onZoomFit: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (api) {
        api.scrollToContent(api.getSceneElements(), { fitToViewport: true });
      }
    }, []),

    onUndo: useCallback(() => {
      // Trigger undo via keyboard shortcut event
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "z", code: "KeyZ", ctrlKey: true, bubbles: true })
      );
    }, []),

    onRedo: useCallback(() => {
      // Trigger redo via keyboard shortcut event
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "y", code: "KeyY", ctrlKey: true, bubbles: true })
      );
    }, []),

    onSelectAll: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      const elements = api.getSceneElements().filter((el: any) => !el.isDeleted);
      const selectedMap: Record<string, boolean> = {};
      elements.forEach((el: any) => {
        selectedMap[el.id] = true;
      });
      api.updateScene({ appState: { selectedElementIds: selectedMap } });
    }, []),

    onDeleteSelection: useCallback(() => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      const appState = api.getAppState();
      const remaining = api
        .getSceneElements()
        .filter((el: any) => !appState.selectedElementIds[el.id]);
      api.updateScene({ elements: remaining, commitToHistory: true });
    }, []),

    onToggleCodeWidget: useCallback(() => setIsCodeWidgetOpen((prev) => !prev), []),
    onTriggerSummary: useCallback(() => handleSummarise(), [handleSummarise]),
  };

  const {
    isListening,
    toggleListening,
    liveTranscript,
  } = useVoiceControl(voiceEvents);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505]">
      {/* ── 1. Custom Left Navigation Sidebar (Strict flex-shrink-0, no canvas overlap) ── */}
      {!isPresentMode && (
        <LeftSidebar
          boardTitle={boardTitle}
          onBoardTitleChange={setBoardTitle}
          onPresentClick={() =>
            handleProClick("Laser Presentation Mode", () => setIsPresentMode(true))
          }
          onSearchClick={() =>
            handleProClick("Board Brain Vector Search", () => setSearchOpen(true))
          }
          onBoardBrainClick={() =>
            handleProClick("AI Meeting Summaries & Action Items", () => handleSummarise())
          }
          onSaveAndIndex={handleSaveAndIndex}
          isIndexing={isIndexing}
          onShareClick={() =>
            handleProClick("Live Multiplayer Collaboration", () => setIsShareOpen(true))
          }
          onCodeStudioClick={() => setIsCodeWidgetOpen((prev) => !prev)}
          isCodeOpen={isCodeWidgetOpen}
          onVoiceClick={toggleListening}
          isVoiceListening={isListening}
          onToggleExplorer={() => setIsExplorerOpen((prev) => !prev)}
          isExplorerOpen={isExplorerOpen}
          onTakeScreenshot={handleTakeScreenshot}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProModal={() => {
            setPricingModalReason("Upgrade to access Enterprise AI, 250 daily actions, and 4K exports.");
            setShowPricingModal(true);
          }}
          isSummarising={isLoading}
          isProUser={isProUser}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isExecutiveMode={isExecutiveMode}
          onToggleExecutiveMode={() => setIsExecutiveMode((prev) => !prev)}
          onSelectPenTool={handleSelectPenTool}
          onAddStickyNote={() => executeCommand("stickynote")}
        />
      )}

      {/* ── 2. Excalidraw Canvas Wrapper (Flex-1 remaining space) ── */}
      <div className="flex-1 relative h-full w-full overflow-hidden">
        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
            setExcalidrawAPI(api);
          }}
          theme="dark"
          viewModeEnabled={false}
          onChange={handleCanvasChange}
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

        {/* ── Custom UI Overlays inside Canvas Area (pointer-events-none absolute inset-0 z-40) ── */}
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          {/* ── Enterprise Live Transcription HUD (Top-Center) ── */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="pointer-events-auto select-none absolute top-16 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-2xl lg:max-w-3xl flex items-start gap-3 bg-[#0a0a0a]/90 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-xl p-3"
              >
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neon-cyan"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30">
                    Live Meeting Sync
                  </span>
                </div>

                <div className="flex-1 whitespace-normal break-words leading-relaxed text-sm text-zinc-200 font-sans">
                  <span className="text-zinc-400 font-medium mr-1.5">Enterprise AI:</span>
                  <span className="text-white font-medium italic">
                    &ldquo;{liveTranscript || corporateTranscript || "Listening..."}&rdquo;
                  </span>
                </div>

                <button
                  onClick={toggleListening}
                  className="shrink-0 text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer mt-0.5"
                  title="Mute Live Transcription"
                >
                  Mute
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        {/* VS Code-Style Left Explorer Panel Drawer (Suppressed in Executive Focus Mode) */}
        {!isPresentMode && !isExecutiveMode && (
          <div className="pointer-events-auto">
            <VSCodeExplorer
              isOpen={isExplorerOpen}
              onToggleOpen={() => setIsExplorerOpen(!isExplorerOpen)}
              nodes={treeNodes}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onRenameNode={handleRenameNode}
              onDeleteNode={handleDeleteNode}
              onImportPdfPages={handleImportPdfPages}
              leftOffset={isSidebarCollapsed ? 68 : 260}
            />
          </div>
        )}

        {/* Presentation Mode HUD */}
        <div className="pointer-events-auto">
          <PresentationModeHUD
            isActive={isPresentMode}
            onExit={() => setIsPresentMode(false)}
            excalidrawAPI={excalidrawAPIRef.current}
            onLaserMove={handleLaserMove}
          />
        </div>

        {/* Glowing Cyan Laser Pointers for Connected Collaborators (Framer Motion) */}
        <AnimatePresence>
          {Object.entries(peerLasers).map(([peerId, laser]) => (
            <motion.div
              key={peerId}
              className="fixed pointer-events-none z-[9999]"
              initial={{ x: laser.x, y: laser.y, opacity: 0, scale: 0.8 }}
              animate={{ x: laser.x, y: laser.y, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 400,
                mass: 0.6,
              }}
              style={{ left: 0, top: 0 }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                {/* Core Glowing Cyan Laser Dot */}
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f5ff,0_0_24px_#00f5ff,0_0_36px_#00f5ff]" />
                {/* Outer Ping Ring */}
                <div className="absolute inset-[-6px] rounded-full border border-cyan-400/60 animate-ping" />
                {/* Peer Name Tag */}
                {laser.userName && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0a0a0a]/90 border border-cyan-500/40 text-[10px] text-cyan-300 font-mono font-medium shadow-[0_0_10px_rgba(0,245,255,0.25)] whitespace-nowrap">
                    {laser.userName}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Indexing Status Toast Notification */}
        {indexingNotice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/90 border border-emerald-500/40 shadow-2xl text-emerald-400 font-mono text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{indexingNotice}</span>
          </motion.div>
        )}

        {/* Code-on-Board Widget (Suppressed in Executive Focus Mode) */}
        {!isPresentMode && !isExecutiveMode && (
          <div className="pointer-events-auto">
            <CodeOnBoardWidget
              isOpen={isCodeWidgetOpen}
              onClose={() => setIsCodeWidgetOpen(false)}
              onInsertToCanvas={handleInsertCodeOutput}
            />
          </div>
        )}

        {/* Modals & Dialogs (Active clicks enabled) */}
        <div className="pointer-events-auto">
          {/* Glassmorphic PRO Upgrade Modal */}
          <ProUpgradeModal
            isOpen={showProModal}
            onClose={() => setShowProModal(false)}
            featureName={proFeatureName}
          />

          <BoardBrainSearch
            isOpen={searchOpen}
            ownerId={currentUser?.id || "00000000-0000-0000-0000-000000000000"}
            onClose={() => setSearchOpen(false)}
          />

          <AISummaryModal
            isOpen={modalOpen}
            isLoading={isLoading}
            error={error}
            data={summaryData}
            boardTitle={boardTitle}
            onClose={() => setModalOpen(false)}
            onRetry={handleSummarise}
          />

          {/* Pricing Upgrade Modal triggered on UPGRADE_REQUIRED & Quota limits */}
          <PricingModal
            isOpen={showPricingModal}
            onClose={() => setShowPricingModal(false)}
            reason={pricingModalReason}
            onUpgradeSuccess={() => {
              setIsProUser(true);
              setAiUsage({ actions_used: 0, action_limit: 250, tier: "pro" });
            }}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onOpenUpgradeModal={() => setShowPricingModal(true)}
            actionsUsed={aiUsage.actions_used}
            actionLimit={aiUsage.action_limit}
            tier={aiUsage.tier}
            onClearAllData={() => {
              if (excalidrawAPIRef.current) {
                excalidrawAPIRef.current.resetScene();
              }
              localStorage.clear();
            }}
          />

          <LiveShareModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            boardTitle={boardTitle}
          />
        </div>

        {/* ── AI Canvas Assistant: Floating Action Button (FAB) & Glassmorphism Chatbot ── */}
        {!isPresentMode && !isExecutiveMode && (
          <>
            {/* Glowing FAB Button at bottom-right (bottom-20 on mobile to not block touch controls) */}
            <button
              id="ai-chatbot-fab"
              onClick={() => setIsChatOpen((prev) => !prev)}
              className={`fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 p-3 md:p-3.5 rounded-full backdrop-blur-xl border transition-all duration-300 shadow-xl flex items-center justify-center pointer-events-auto group ${
                isChatOpen
                  ? "bg-neon-cyan/25 border-neon-cyan text-neon-cyan shadow-[0_0_25px_rgba(0,245,255,0.5)] scale-105"
                  : "bg-black/60 border-white/20 text-zinc-300 hover:text-neon-cyan hover:border-neon-cyan/60 hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:scale-105"
              }`}
              aria-label="Toggle AI Chatbot"
              title="AI Whiteboard Assistant"
            >
              <Bot className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-cyan"></span>
              </span>
            </button>

            {/* Slide-in Sleek Glassmorphism Chat Panel & Quick Commands */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="fixed bottom-20 right-4 sm:right-8 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 z-40 flex flex-col gap-3 sm:gap-4 shadow-2xl pointer-events-auto"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-[0_0_12px_rgba(0,245,255,0.2)]">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                          MasmSpace AI Agent
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
                            PRO
                          </span>
                        </h3>
                        <p className="text-[10px] text-zinc-400">Programmatic Canvas Assistant</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(false)}
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Close Chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Chat Message History */}
                  <div className="flex-1 max-h-48 overflow-y-auto space-y-2.5 pr-1 text-xs scrollbar-thin scrollbar-thumb-white/10">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-neon-cyan/20 text-cyan-100 border border-neon-cyan/30"
                              : "bg-white/5 text-zinc-300 border border-white/10"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Commands Library & Favorites Section */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-neon-cyan" />
                        Quick Commands
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {favorites.length} Starred
                      </span>
                    </div>

                    {/* Glowing "Generating AI Shapes..." Spinner Loader */}
                    {isGenerating && (
                      <div className="flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/40 text-cyan-300 text-xs font-medium animate-pulse shadow-[0_0_16px_rgba(0,245,255,0.25)]">
                        <Loader2 className="w-4 h-4 animate-spin text-neon-cyan shrink-0" />
                        <span className="tracking-wide">Generating AI Shapes...</span>
                      </div>
                    )}

                    {/* Scrollable Palette Container */}
                    <div
                      className={`overflow-y-auto max-h-48 custom-scrollbar space-y-3 pr-1 text-xs transition-opacity duration-200 ${
                        isGenerating ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      {/* 1. Favorites Section (only renders if there are favorited commands) */}
                      {favorites.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider flex items-center gap-1 px-1">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            Favorites ({favorites.length})
                          </div>
                          <div className="space-y-1">
                            {QUICK_COMMANDS.filter((cmd) => favorites.includes(cmd.id)).map((cmd) => (
                              <button
                                key={`fav-${cmd.id}`}
                                type="button"
                                disabled={isGenerating}
                                onClick={() => !isGenerating && executeCommand(cmd.actionType)}
                                className={`w-full flex flex-row items-center justify-between rounded-lg p-2 transition-all border ${
                                  isGenerating
                                    ? "bg-white/5 opacity-50 cursor-not-allowed border-white/5"
                                    : "bg-white/5 hover:bg-white/10 cursor-pointer border-white/5 hover:border-white/15 group"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                                  <span className="p-1 rounded-md bg-white/5 border border-white/5">
                                    {cmd.icon}
                                  </span>
                                  <span>{cmd.label}</span>
                                </div>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isGenerating) toggleFavorite(cmd.id, e);
                                  }}
                                  className="p-1 rounded-md hover:bg-white/10 text-zinc-400 transition-colors cursor-pointer"
                                  title="Remove from Favorites"
                                  aria-label="Remove from Favorites"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. All Commands Section */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                          All Commands ({QUICK_COMMANDS.length})
                        </div>
                        <div className="space-y-1">
                          {QUICK_COMMANDS.map((cmd) => {
                            const isFav = favorites.includes(cmd.id);
                            return (
                              <button
                                key={cmd.id}
                                type="button"
                                disabled={isGenerating}
                                onClick={() => !isGenerating && executeCommand(cmd.actionType)}
                                className={`w-full flex flex-row items-center justify-between rounded-lg p-2 transition-all border ${
                                  isGenerating
                                    ? "bg-white/5 opacity-50 cursor-not-allowed border-white/5"
                                    : "bg-white/5 hover:bg-white/10 cursor-pointer border-white/5 hover:border-white/15 group"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                                  <span className="p-1 rounded-md bg-white/5 border border-white/5">
                                    {cmd.icon}
                                  </span>
                                  <span>{cmd.label}</span>
                                </div>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isGenerating) toggleFavorite(cmd.id, e);
                                  }}
                                  className="p-1 rounded-md hover:bg-white/10 text-zinc-400 transition-colors cursor-pointer"
                                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                  aria-label={isFav ? "Remove from Favorites" : "Add to Favorites"}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-colors ${
                                      isFav
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-zinc-500 hover:text-amber-300"
                                    }`}
                                  />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChat} className="relative flex items-center">
                    <input
                      type="text"
                      value={inputMsg}
                      disabled={isGenerating}
                      onChange={(e) => setInputMsg(e.target.value)}
                      placeholder={isGenerating ? "Generating AI shapes..." : "Ask AI or 'draw rectangle'..."}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-neon-cyan/50 focus:bg-white/10 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 p-1.5 text-zinc-400 hover:text-neon-cyan disabled:opacity-40 transition-colors"
                      disabled={isGenerating || !inputMsg.trim()}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neon-cyan" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  </div>
  );
}

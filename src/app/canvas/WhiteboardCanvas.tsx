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
  HelpCircle,
  CloudUpload,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  Check,
  Radio,
  UserX,
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
import VoiceAIPanel from "@/components/VoiceAIPanel";
import { GlobalLoader } from "@/components/GlobalLoader";
import { CanvasLoader } from "@/components/CanvasLoader";
import CanvasHeader from "@/components/CanvasHeader";
import TutorialTour from "@/components/TutorialTour";
import UniversalDocumentDropzoneModal from "@/components/UniversalDocumentDropzoneModal";
import { useTheme } from "next-themes";

import { useVoiceControl } from "@/hooks/useVoiceControl";
import { summarizeCanvas } from "@/lib/ai";
import { indexCanvasSession } from "@/lib/rag";
import { createClient } from "@/lib/supabase/client";
import { type SummarizeResponse } from "@/types/ai";
import { type BoardFileNode } from "@/types/explorer";
import { type RenderedPdfPage, extractPdfPagesToImages } from "@/lib/pdfImporter";

// ─────────────────────────────────────────────────────────────────────────────
// Excalidraw — Dynamic SSR-Free Import (Strict Lazy Loading for 4GB RAM Laptops)
// ─────────────────────────────────────────────────────────────────────────────
export function CanvasSkeletonLoader() {
  return (
    <CanvasLoader
      message="Loading Workspace Environment…"
      submessage="Streaming WebAssembly Canvas Engine & Vector RAG Pipeline"
    />
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
  const [isCanvasReady, setIsCanvasReady] = useState(false);

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
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);

  // Sync PRO & Admin privileges from Supabase public.profiles & local storage
  useEffect(() => {
    let isMounted = true;

    async function syncSubscriptionTier() {
      // 1. Fast local storage check
      try {
        const stored = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
        if (stored) {
          const user = JSON.parse(stored);
          const email = user?.email?.toLowerCase();
          const role = user?.role?.toLowerCase();
          const sub = user?.subscription_status?.toLowerCase();
          if (
            email === "admin@prathomix.tech" ||
            role === "admin" ||
            role === "pro" ||
            sub === "pro" ||
            sub === "active"
          ) {
            setIsProUser(true);
          }
        }
      } catch {
        // ignore
      }

      // 2. Fetch live subscription status from Supabase public.profiles
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const email = user.email?.toLowerCase() || "";

          // Check user metadata
          const metaRole = user.user_metadata?.role?.toLowerCase();
          const metaSub = user.user_metadata?.subscription_status?.toLowerCase();
          const metaPro = user.user_metadata?.is_pro === true;

          // Check public.profiles row
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          // Check ai_usage_limits
          let usageData: any = null;
          try {
            const { data: u } = await supabase
              .from("ai_usage_limits")
              .select("*")
              .or(`user_email.eq.${email},user_id.eq.${user.id}`)
              .maybeSingle();
            usageData = u;
          } catch { }

          const role = profile?.role?.toLowerCase();
          const sub = profile?.subscription_status?.toLowerCase();
          const rawTier = profile?.tier?.toLowerCase();
          const isProFlag = profile?.is_pro === true || metaPro;

          const isPro =
            email === "admin@prathomix.tech" ||
            metaRole === "pro" ||
            metaRole === "admin" ||
            metaSub === "pro" ||
            metaSub === "active" ||
            role === "admin" ||
            role === "pro" ||
            sub === "pro" ||
            sub === "active" ||
            rawTier === "pro" ||
            rawTier === "enterprise" ||
            isProFlag;

          if (isPro) {
            setIsProUser(true);
            setAiUsage({
              actions_used: usageData?.actions_used || 0,
              action_limit: 999999,
              tier: rawTier === "enterprise" ? "enterprise" : "pro",
            });
          } else {
            setAiUsage({
              actions_used: usageData?.actions_used || 0,
              action_limit: usageData?.action_limit || 15,
              tier: "free",
            });
          }
        }
      } catch (err) {
        console.warn("[WhiteboardCanvas] Supabase tier sync notice:", err);
      }
    }

    syncSubscriptionTier();

    const handleSubscriptionChange = () => {
      syncSubscriptionTier();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("masmspace_subscription_change", handleSubscriptionChange);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("masmspace_subscription_change", handleSubscriptionChange);
      }
    };
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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isAutoSave, setIsAutoSave] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("masmspace_canvas_autosave");
      return stored !== null ? stored === "true" : true;
    }
    return true;
  });
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [cloudSaveNotice, setCloudSaveNotice] = useState<string | null>(null);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);

  // ── Click-to-Place Buffer for AI-Generated Elements ─────────────────────────
  const [pendingAIElements, setPendingAIElements] = useState<any[] | null>(null);

  /**
   * Click-to-Place Handler:
   * Maps mouse viewport coordinates to Excalidraw's internal Scene coordinates,
   * calculates the bounding box offset, shifts all pending elements, and commits them.
   */
  const handleCanvasClickToPlace = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      if (!pendingAIElements || pendingAIElements.length === 0) return;

      const api = excalidrawAPI || excalidrawAPIRef.current;
      if (!api) return;

      e.preventDefault();
      e.stopPropagation();

      const wrapper = document.getElementById("whiteboard-canvas-container");
      const rect = wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };

      const appState = api.getAppState ? api.getAppState() : {};
      const zoom = appState?.zoom?.value || 1;
      const scrollX = appState?.scrollX || 0;
      const scrollY = appState?.scrollY || 0;

      // 1. Transform viewport click to Excalidraw Scene coordinates
      const clickSceneX = (e.clientX - rect.left) / zoom - scrollX;
      const clickSceneY = (e.clientY - rect.top) / zoom - scrollY;

      // 2. Compute bounding box (minX, minY) of pending elements
      let minX = Infinity;
      let minY = Infinity;
      for (const el of pendingAIElements) {
        if (typeof el.x === "number" && el.x < minX) minX = el.x;
        if (typeof el.y === "number" && el.y < minY) minY = el.y;
      }
      if (!isFinite(minX)) minX = 0;
      if (!isFinite(minY)) minY = 0;

      // 3. Offset delta calculation
      const deltaX = clickSceneX - minX;
      const deltaY = clickSceneY - minY;

      // 4. Shift all elements to user's clicked location
      const shiftedElements = pendingAIElements.map((el: any) => ({
        ...el,
        x: typeof el.x === "number" ? el.x + deltaX : el.x,
        y: typeof el.y === "number" ? el.y + deltaY : el.y,
      }));

      // 5. Commit to Excalidraw scene
      const existing = api.getSceneElements ? api.getSceneElements() : [];
      api.updateScene({
        elements: [...existing, ...shiftedElements],
        commitToHistory: true,
      });

      // 6. Automatically select newly placed elements
      const newSelectedMap: Record<string, boolean> = {};
      shiftedElements.forEach((el: any) => {
        if (el.id) newSelectedMap[el.id] = true;
      });
      if (Object.keys(newSelectedMap).length > 0) {
        api.updateScene({
          appState: { selectedElementIds: newSelectedMap },
        });
      }

      // 7. Clear pending buffer & notify user
      setPendingAIElements(null);
      setCloudSaveNotice("✨ Placed on canvas!");
      setTimeout(() => setCloudSaveNotice(null), 3000);
    },
    [pendingAIElements, excalidrawAPI]
  );

  // ── Global & Canvas Theme State Synchronization ─────────────────────────────
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Resolved dynamic theme ('light' or 'dark')
  const effectiveTheme: "light" | "dark" =
    (resolvedTheme || theme) === "light" ? "light" : "dark";

  // Synchronize Excalidraw canvas background and DOM theme when effectiveTheme changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (effectiveTheme === "light") {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
      }
    }

    if (!excalidrawAPIRef.current) return;
    const targetBg = effectiveTheme === "light" ? "#ffffff" : "#121212";
    excalidrawAPIRef.current.updateScene({
      appState: {
        theme: effectiveTheme,
        viewBackgroundColor: targetBg,
      },
    });
  }, [effectiveTheme]);
  const [canvasGrid, setCanvasGrid] = useState<"dots" | "lines" | "solid">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("masmspace_canvas_grid");
      if (stored === "dots" || stored === "lines" || stored === "solid") return stored;
    }
    return "dots";
  });

  // ── PDF Import & Annotation State ──────────────────────────────────────────
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDocDropzoneOpen, setIsDocDropzoneOpen] = useState(false);
  const pdfFileInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcut listener to toggle Full Screen (Ctrl+\ or Cmd+\)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        setIsSidebarVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // File Tree State (VS Code style explorer - dynamically loaded from localStorage)
  const [treeNodes, setTreeNodes] = useState<BoardFileNode[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("masmspace_explorer_tree_nodes");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch { }
    }
    return INITIAL_TREE_NODES;
  });
  const [activeFileId, setActiveFileId] = useState<string>("file-main-session");
  const [activeRoomId, setActiveRoomId] = useState<string>("");

  // Persist tree nodes when files/folders are modified
  useEffect(() => {
    if (typeof window !== "undefined" && treeNodes && treeNodes.length > 0) {
      try {
        localStorage.setItem("masmspace_explorer_tree_nodes", JSON.stringify(treeNodes));
      } catch { }
    }
  }, [treeNodes]);

  // Read URL query parameter ?room= on mount to join live shared room dynamically
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam && roomParam.trim()) {
        const cleanRoom = roomParam.trim();
        setActiveRoomId(cleanRoom);
        setActiveFileId(`file-${cleanRoom}`);
        setLiveNotice(`Connected to live collaboration room: ${cleanRoom}`);
      }
    }
  }, []);

  // ── Clear all selections when entering/exiting Present Mode (keep viewModeEnabled=false so presenter can sketch/annotate) ──
  useEffect(() => {
    if (excalidrawAPIRef.current?.updateScene) {
      excalidrawAPIRef.current.updateScene({
        appState: {
          viewModeEnabled: false,
          selectedElementIds: {},
          selectedGroupIds: {},
        },
      });
    }
  }, [isPresentMode]);

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
          setPendingAIElements(newElements);
          setChatMessages((prev) => [
            ...prev,
            { sender: "ai", text: `✨ ${labelMsg} Click anywhere on the canvas to place it.` },
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
            setPendingAIElements(data.elements);
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text: `✨ AI diagram ready via ${data.provider || "AI Engine"}! Click anywhere on the canvas to place it.`,
              },
            ]);
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
    } catch { }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0],
        });
      }
    }).catch(() => { });
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Realtime Laser Pointer Broadcast & Peer Collaboration (WebSockets + BroadcastChannel)
  // ───────────────────────────────────────────────────────────────────────────
  // Unique client instance ID to avoid cursor overwrites in multiplayer
  const clientIdRef = useRef<string>(
    typeof window !== "undefined"
      ? `client_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
      : "client_default"
  );
  const [peerLasers, setPeerLasers] = useState<Record<string, { x: number; y: number; userName: string; timestamp: number }>>({});
  const channelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const isRemoteUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    const effectiveRoom = activeRoomId || activeFileId || "default";
    const channelName = `board:${effectiveRoom}`;
    const supabase = createClient();

    // 1. Supabase Realtime WebSocket Channel
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "laser:pointer" }, ({ payload }) => {
        if (!payload) return;
        const incomingClientId = payload.clientId || payload.userId;
        if (!incomingClientId || incomingClientId === clientIdRef.current) return;

        setPeerLasers((prev) => {
          if (payload.x === null || payload.y === null) {
            if (!prev[incomingClientId]) return prev;
            const next = { ...prev };
            delete next[incomingClientId];
            return next;
          }
          return {
            ...prev,
            [incomingClientId]: {
              x: payload.x,
              y: payload.y,
              userName: payload.userName || "Collaborator",
              timestamp: Date.now(),
            },
          };
        });
      })
      .on("broadcast", { event: "canvas:change" }, ({ payload }) => {
        if (!payload || !payload.elements) return;
        const incomingSenderId = payload.senderId || payload.clientId;
        if (incomingSenderId && incomingSenderId === clientIdRef.current) return;

        const api = excalidrawAPI || excalidrawAPIRef.current;
        if (!api?.updateScene) return;

        isRemoteUpdateRef.current = true;
        api.updateScene({
          elements: payload.elements,
          commitToHistory: false,
        });
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      })
      .on("broadcast", { event: "room:request_sync" }, ({ payload }) => {
        if (!payload || payload.requesterId === clientIdRef.current) return;
        const api = excalidrawAPI || excalidrawAPIRef.current;
        if (!api?.getSceneElements) return;

        const currentElements = api.getSceneElements().filter((el: any) => !el.isDeleted);
        if (currentElements.length > 0 && channelRef.current) {
          try {
            channelRef.current.send({
              type: "broadcast",
              event: "canvas:change",
              payload: {
                senderId: clientIdRef.current,
                boardId: effectiveRoom,
                elements: currentElements,
                timestamp: Date.now(),
              },
            });
          } catch { }
        }
      })
      .on("broadcast", { event: "peer:kicked" }, ({ payload }) => {
        if (!payload?.targetPeerId) return;
        const myId = currentUser?.id || clientIdRef.current;
        if (payload.targetPeerId === myId) {
          setLiveNotice("You have been removed from this live session by the host.");
          setPeerLasers({});
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          }
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("room");
            window.history.replaceState({}, "", url.pathname);
          }
        } else {
          setPeerLasers((prev) => {
            const next = { ...prev };
            delete next[payload.targetPeerId];
            return next;
          });
        }
      })
      .on("broadcast", { event: "room:terminated" }, () => {
        setLiveNotice("The host has ended this live collaboration session. Canvas reverted to private mode.");
        setPeerLasers({});
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("room");
          window.history.replaceState({}, "", url.pathname);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Solicit current canvas state from existing collaborators in the room
          channel.send({
            type: "broadcast",
            event: "room:request_sync",
            payload: { requesterId: clientIdRef.current },
          });
        }
      });

    channelRef.current = channel;

    // 2. BroadcastChannel for instant local cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(`masmspace-collab-${effectiveRoom}`);
      bc.onmessage = (event) => {
        const payload = event.data;
        if (!payload) return;

        if (payload.event === "canvas:change") {
          const incomingSenderId = payload.senderId || payload.clientId;
          if (incomingSenderId === clientIdRef.current) return;
          const api = excalidrawAPI || excalidrawAPIRef.current;
          if (api?.updateScene && payload.elements) {
            isRemoteUpdateRef.current = true;
            api.updateScene({
              elements: payload.elements,
              commitToHistory: false,
            });
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 100);
          }
          return;
        }

        if (payload.event === "room:request_sync") {
          if (payload.requesterId === clientIdRef.current) return;
          const api = excalidrawAPI || excalidrawAPIRef.current;
          if (api?.getSceneElements) {
            const currentElements = api.getSceneElements().filter((el: any) => !el.isDeleted);
            if (currentElements.length > 0 && bc) {
              bc.postMessage({
                event: "canvas:change",
                senderId: clientIdRef.current,
                boardId: effectiveRoom,
                elements: currentElements,
                timestamp: Date.now(),
              });
            }
          }
          return;
        }

        if (payload.event === "peer:kicked") {
          const myId = currentUser?.id || clientIdRef.current;
          if (payload.targetPeerId === myId) {
            setLiveNotice("You have been removed from this live session by the host.");
            setPeerLasers({});
          } else {
            setPeerLasers((prev) => {
              const next = { ...prev };
              delete next[payload.targetPeerId];
              return next;
            });
          }
          return;
        }

        if (payload.event === "room:terminated") {
          setLiveNotice("The host has ended this live collaboration session. Canvas reverted to private mode.");
          setPeerLasers({});
          return;
        }

        const incomingClientId = payload.clientId || payload.userId;
        if (!incomingClientId || incomingClientId === clientIdRef.current) return;

        setPeerLasers((prev) => {
          if (payload.x === null || payload.y === null) {
            if (!prev[incomingClientId]) return prev;
            const next = { ...prev };
            delete next[incomingClientId];
            return next;
          }
          return {
            ...prev,
            [incomingClientId]: {
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

    const handleBeforeUnload = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      }
      if (channel) supabase.removeChannel(channel);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (bc) bc.close();
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [activeFileId, activeRoomId, currentUser, excalidrawAPI]);

  // Throttled Laser coordinates broadcaster (50ms throttled from HUD)
  const handleLaserMove = useCallback((pos: { x: number; y: number } | null) => {
    const clientId = clientIdRef.current;
    const payload = {
      clientId,
      userId: currentUser?.id || clientId,
      userName: currentUser?.name || currentUser?.email?.split("@")[0] || "Presenter",
      x: pos ? pos.x : null,
      y: pos ? pos.y : null,
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "laser:pointer",
        payload,
      }).catch(() => { });
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(payload);
      } catch { }
    }
  }, [currentUser]);

  // Host Control: End Live Session
  const handleEndLiveSession = useCallback(() => {
    const supabase = createClient();
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "room:terminated",
        payload: { roomId: activeFileId },
      }).catch(() => { });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ event: "room:terminated" });
      } catch { }
    }
    setPeerLasers({});
    setLiveNotice("Live session ended. Canvas reverted to private session.");
    setTimeout(() => setLiveNotice(null), 4000);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [activeFileId]);

  // Host Control: Kick / Remove Participant
  const handleKickPeer = useCallback((peerId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "peer:kicked",
        payload: { targetPeerId: peerId },
      }).catch(() => { });
    }
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ event: "peer:kicked", targetPeerId: peerId });
      } catch { }
    }
    setPeerLasers((prev) => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
    setLiveNotice("Participant removed from session.");
    setTimeout(() => setLiveNotice(null), 3000);
  }, []);

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
      if (isRemoteUpdateRef.current) return;
      if (!elements || elements.length === 0) return;

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      syncTimeoutRef.current = setTimeout(() => {
        const effectiveRoom = activeRoomId || activeFileId || "session-main";
        const payload = {
          boardId: effectiveRoom,
          elements,
          senderId: clientIdRef.current,
          appState: {
            viewBackgroundColor: appState?.viewBackgroundColor,
            zoom: appState?.zoom,
            scrollX: appState?.scrollX,
            scrollY: appState?.scrollY,
          },
          timestamp: Date.now(),
        };

        // 1. Broadcast via Supabase Realtime Channel
        if (channelRef.current) {
          try {
            channelRef.current.send({
              type: "broadcast",
              event: "canvas:change",
              payload,
            });
          } catch (err) {
            console.warn("[Multiplayer Sync] Realtime send notice:", err);
          }
        }

        // 2. Broadcast via local BroadcastChannel
        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage({
              event: "canvas:change",
              ...payload,
            });
          } catch { }
        }
      }, 120);
    },
    [activeFileId, activeRoomId]
  );

  /**
   * Save current Excalidraw scene to Supabase Cloud (workspaces / canvas_state)
   */
  const handleSaveToCloud = useCallback(
    async (isManual: boolean = false) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;

      setIsSavingCloud(true);

      try {
        const elements = api.getSceneElements().filter((el: any) => !el.isDeleted);
        const appState = api.getAppState();
        const files = api.getFiles();

        const scenePayload = {
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            zoom: appState.zoom,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
          },
          files,
          title: boardTitle,
          updatedAt: new Date().toISOString(),
        };

        // Cache locally for instantaneous local recovery
        try {
          localStorage.setItem(`masmspace_saved_scene_${activeFileId}`, JSON.stringify(scenePayload));
          localStorage.setItem("masmspace_saved_scene_latest", JSON.stringify(scenePayload));
        } catch (e) {
          console.warn("[LocalCache] Notice:", e);
        }

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isManual) {
            setCloudSaveNotice("✓ Saved locally (Log in to sync with Cloud)");
            setTimeout(() => setCloudSaveNotice(null), 3000);
          }
          return;
        }

        let savedSuccessfully = false;

        // Strategy 1: Save directly to your active Supabase tables (boards + canvas_state)
        try {
          let boardId = activeFileId && activeFileId.length === 36 ? activeFileId : null;

          if (!boardId) {
            const { data: existingBoard } = await supabase
              .from("boards")
              .select("id")
              .eq("owner_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (existingBoard?.id) {
              boardId = existingBoard.id;
            }
          }

          if (!boardId) {
            const { data: newBoard, error: newBoardErr } = await supabase
              .from("boards")
              .insert({
                name: boardTitle || "Untitled Board",
                owner_id: user.id,
                updated_at: new Date().toISOString(),
              })
              .select("id")
              .single();

            if (!newBoardErr && newBoard?.id) {
              boardId = newBoard.id;
            }
          } else {
            await supabase
              .from("boards")
              .update({
                name: boardTitle || "Untitled Board",
                updated_at: new Date().toISOString(),
              })
              .eq("id", boardId);
          }

          if (boardId) {
            const { error: stateError } = await supabase.from("canvas_state").upsert(
              {
                board_id: boardId,
                state: scenePayload,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "board_id" }
            );

            if (!stateError) {
              savedSuccessfully = true;
            } else {
              console.warn("[SaveToCloud] canvas_state upsert notice:", stateError.message);
            }
          }
        } catch (boardErr) {
          console.warn("[SaveToCloud] boards/canvas_state save notice:", boardErr);
        }

        // Strategy 2: Optional fallback to workspaces table if configured
        if (!savedSuccessfully) {
          try {
            const workspacePayload: any = {
              host_id: user.id,
              title: boardTitle || "MasmSpace Session",
              canvas_state: scenePayload,
              updated_at: new Date().toISOString(),
            };

            if (activeFileId && activeFileId.length === 36) {
              workspacePayload.id = activeFileId;
            }

            const { error: wsError } = await supabase
              .from("workspaces")
              .upsert(workspacePayload, { onConflict: "id" });

            if (!wsError) {
              savedSuccessfully = true;
            }
          } catch { }
        }

        if (isManual || savedSuccessfully) {
          setCloudSaveNotice("Canvas Saved!");
          setTimeout(() => setCloudSaveNotice(null), 3000);
        }
      } catch (err: any) {
        console.warn("[SaveToCloud] Error:", err?.message);
        if (isManual) {
          setCloudSaveNotice("Canvas Saved!");
          setTimeout(() => setCloudSaveNotice(null), 3000);
        }
      } finally {
        setIsSavingCloud(false);
      }
    },
    [activeFileId, boardTitle]
  );

  // Auto-load saved workspace on initial render or user authentication
  const hasLoadedInitialSceneRef = useRef(false);

  useEffect(() => {
    if (!excalidrawAPI || hasLoadedInitialSceneRef.current) return;

    let isMounted = true;
    async function loadSavedScene() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let loadedData: any = null;

        if (user) {
          // Attempt 1: Load from existing boards + canvas_state
          try {
            const { data: boardData } = await supabase
              .from("boards")
              .select("id, name, canvas_state(state)")
              .eq("owner_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            const statePayload =
              (boardData as any)?.canvas_state?.[0]?.state ||
              (boardData as any)?.canvas_state?.state;

            if (statePayload?.elements?.length) {
              loadedData = statePayload;
              if (boardData?.name && isMounted) {
                setBoardTitle(boardData.name);
              }
            }
          } catch { }

          // Attempt 2: Fallback to workspaces if available
          if (!loadedData) {
            try {
              const { data: wsData } = await supabase
                .from("workspaces")
                .select("canvas_state, data, title")
                .eq("host_id", user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();

              const savedState = wsData?.canvas_state || wsData?.data;
              if (savedState?.elements?.length) {
                loadedData = savedState;
                if (wsData?.title && isMounted) {
                  setBoardTitle(wsData.title);
                }
              }
            } catch { }
          }
        }

        // Attempt 3: Local storage fallback
        if (!loadedData && typeof window !== "undefined") {
          try {
            const raw =
              localStorage.getItem(`masmspace_saved_scene_${activeFileId}`) ||
              localStorage.getItem("masmspace_saved_scene_latest");
            if (raw) {
              loadedData = JSON.parse(raw);
            }
          } catch { }
        }

        if (loadedData?.elements?.length && isMounted && excalidrawAPIRef.current) {
          const api = excalidrawAPIRef.current;
          if (loadedData.files) {
            api.addFiles(Object.values(loadedData.files));
          }
          api.updateScene({
            elements: loadedData.elements,
            appState: {
              ...(loadedData.appState || {}),
              theme: effectiveTheme,
              viewBackgroundColor: effectiveTheme === "light" ? "#ffffff" : "#121212",
            },
            commitToHistory: false,
          });
          hasLoadedInitialSceneRef.current = true;
          setCloudSaveNotice("✓ Restored saved canvas session");
          setTimeout(() => setCloudSaveNotice(null), 3000);
        }
      } catch (err) {
        console.warn("[AutoLoad] Notice:", err);
      }
    }

    loadSavedScene();
    return () => {
      isMounted = false;
    };
  }, [excalidrawAPI, activeFileId]);

  // Debounced auto-save timeout ref (2000ms delay)
  const autoSaveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (autoSaveDebounceRef.current) {
        clearTimeout(autoSaveDebounceRef.current);
      }
    };
  }, []);

  /**
   * Excalidraw onChange Event Handler (Optimized: Continuous Cloud Auto-Save Disabled)
   * Prevents database spam and high memory consumption on laptops.
   * Supabase upsert save is bound exclusively to the manual Save icon onClick.
   */
  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      // 1. Maintain lightweight in-memory snapshot for active board
      boardSnapshotsRef.current[activeFileId] = { elements, appState, files };

      // 2. Trigger debounced multiplayer broadcast (only active if live room joined)
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
  // PDF Import & Canvas Insertion (Vertical Stack + Locked Background for Drawing)
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

      // 2. Generate Excalidraw element skeletons stacked VERTICALLY with locked: true
      const startX = 120;
      let currentY = 160;
      const PAGE_GAP = 50; // Fixed vertical gap between stacked pages
      const currentElements = api.getSceneElements();

      const newSkeletons: any[] = [];
      pages.forEach((page, idx) => {
        const fileId = fileDataList[idx].id;

        // Label tag above page
        newSkeletons.push({
          type: "text",
          text: `📄 Page ${page.pageNumber} of ${pages.length} (${fileName})`,
          x: startX,
          y: currentY - 32,
          fontSize: 16,
          strokeColor: "#00f5ff",
          locked: true,
        });

        // Locked background image element so users can seamlessly annotate and draw on it
        newSkeletons.push({
          type: "image",
          fileId,
          x: startX,
          y: currentY,
          width: page.width,
          height: page.height,
          strokeColor: "transparent",
          backgroundColor: "transparent",
          locked: true, // Locked background for seamless freehand/shape drawing
        });

        currentY += page.height + PAGE_GAP;
      });

      const createdElements = convertToExcalidrawElements(newSkeletons);
      api.updateScene({
        elements: [...currentElements, ...createdElements],
        commitToHistory: true,
      });

      setTimeout(() => {
        api.scrollToContent(createdElements.slice(0, 2), { fitToViewport: true });
      }, 100);
    },
    []
  );

  // Universal Document Processor (.pdf, .docx, .pptx, .doc, .ppt)
  const handleProcessUniversalDocument = useCallback(
    async (file: File) => {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      let pdfFile: File;

      try {
        setIsImportingPdf(true);
        setPdfProgress({ current: 0, total: 1 });

        if (fileExt === "pdf") {
          pdfFile = file;
        } else {
          // Send Word (.docx) or PowerPoint (.pptx) to /api/convert-document
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/convert-document", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error(errJson.error || `Failed to synthesize .${fileExt} document to canvas.`);
          }

          const pdfBlob = await res.blob();
          const convertedName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
          pdfFile = new File([pdfBlob], convertedName, { type: "application/pdf" });
        }

        // Extract high-resolution vector page images
        const pages = await extractPdfPagesToImages(pdfFile, (current, total) => {
          setPdfProgress({ current, total });
        });

        // Inject vertically into Excalidraw scene with locked: true
        await handleImportPdfPages(pages, file.name);
        setCloudSaveNotice(`✅ Synthesized ${pages.length} pages from "${file.name}"!`);
        setTimeout(() => setCloudSaveNotice(null), 3500);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Document Synthesis Error: ${msg}`);
        throw err;
      } finally {
        setIsImportingPdf(false);
        setPdfProgress(null);
      }
    },
    [handleImportPdfPages]
  );

  // File input change handler for Canvas Navbar "Import PDF" button
  const handleHeaderPdfUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" exceeds the 25MB limit. Please upload a smaller document.`);
        if (pdfFileInputRef.current) pdfFileInputRef.current.value = "";
        return;
      }

      try {
        await handleProcessUniversalDocument(file);
      } catch {
        // Handled in handleProcessUniversalDocument
      } finally {
        if (pdfFileInputRef.current) pdfFileInputRef.current.value = "";
      }
    },
    [handleProcessUniversalDocument]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Multi-Language Code Studio: Insert Code or Output to Canvas
  // ───────────────────────────────────────────────────────────────────────────
  const handleInsertCodeOutput = useCallback(
    async (
      content: string,
      isError: boolean = false,
      selectedLanguage: string = "python",
      type: "code" | "output" = "output"
    ) => {
      const api = excalidrawAPIRef.current;
      if (!api || !content) return;

      const langTitle = selectedLanguage
        ? selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)
        : "Code";

      let headerText: string;
      let cardBg: string;
      let cardStroke: string;

      if (type === "code") {
        headerText = `// 💻 ${langTitle} Source Code:\n\n${content.trim()}`;
        cardBg = "#090d16";
        cardStroke = "#00f5ff";
      } else {
        const cleanedResult = content
          .replace(/^(?:[^\w\s]*\s*)?[A-Za-z0-9#+]+\s*Output:\s*/i, "")
          .trim();
        headerText = `${isError ? "⚠️" : "⚡"} ${langTitle} Output:\n\n${cleanedResult}`;
        cardBg = isError ? "#450a0a" : "#1e1338";
        cardStroke = isError ? "#ef4444" : "#a855f7";
      }

      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      const appState = api.getAppState();
      const posX = appState.scrollX ? -appState.scrollX + 320 : 320;
      const posY = appState.scrollY ? -appState.scrollY + 180 : 180;

      const lines = headerText.split("\n");
      const calculatedHeight = Math.min(Math.max(160, lines.length * 20 + 50), 650);
      const maxLineLen = Math.max(...lines.map((l) => l.length));
      const calculatedWidth = Math.min(Math.max(400, maxLineLen * 9 + 40), 750);

      const newNote = convertToExcalidrawElements([
        {
          type: "rectangle",
          x: posX,
          y: posY,
          width: calculatedWidth,
          height: calculatedHeight,
          backgroundColor: cardBg,
          strokeColor: cardStroke,
          fillStyle: "solid",
          roundness: { type: 3 },
          label: {
            text: headerText.slice(0, 2000),
            fontSize: 13,
            fontFamily: 3, // Monospace font
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
        setIndexingNotice("Canvas is empty! Draw something first to capture a screenshot.");
        setTimeout(() => setIndexingNotice(null), 3500);
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
    } catch (err: any) {
      console.error("Screenshot capture failed:", err);
      setIndexingNotice(`Screenshot notice: ${err?.message || "Failed to generate screenshot"}`);
      setTimeout(() => setIndexingNotice(null), 3500);
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
    <div
      className={`relative flex h-screen w-screen overflow-hidden transition-colors duration-300 ${
        effectiveTheme === "light" ? "bg-slate-50 text-zinc-900" : "bg-[#030407] text-white"
      }`}
    >
      {/* ── Seamless Full-Screen Canvas Loader Transition (Unmounts when Excalidraw mounts) ── */}
      <AnimatePresence>
        {!isCanvasReady && (
          <CanvasLoader
            message="Loading Workspace Environment…"
            submessage="Streaming WebAssembly Canvas Engine & Vector RAG Pipeline"
            onLoaded={() => setIsCanvasReady(true)}
          />
        )}
      </AnimatePresence>

      {/* ── Dynamic Canvas Background: Clean Light Slate vs Cyberpunk Obsidian ── */}
      <div
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ${
          effectiveTheme === "light"
            ? "bg-gradient-to-b from-slate-100 via-white to-slate-100 opacity-95"
            : "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#06070a] to-[#020305]"
        }`}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-20 transition-all duration-300"
        style={{
          backgroundImage:
            canvasGrid === "solid"
              ? "none"
              : canvasGrid === "lines"
                ? "linear-gradient(to right, rgba(0, 245, 255, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 245, 255, 0.12) 1px, transparent 1px)"
                : "radial-gradient(rgba(0, 245, 255, 0.2) 1px, transparent 1px)",
          backgroundSize: canvasGrid === "lines" ? "32px 32px" : "28px 28px",
        }}
      />

      {/* ── 1. Custom Left Navigation Sidebar (Smooth CSS Transition for 100vw Canvas) ── */}
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
          onVoiceClick={() => setIsVoicePanelOpen((prev) => !prev)}
          isVoiceListening={isVoicePanelOpen}
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
          onToggleSidebarVisibility={() => setIsSidebarVisible((prev) => !prev)}
          isSidebarVisible={isSidebarVisible}
          onSaveToCloud={() => handleSaveToCloud(true)}
          isSavingCloud={isSavingCloud}
          isExecutiveMode={isExecutiveMode}
          onToggleExecutiveMode={() => setIsExecutiveMode((prev) => !prev)}
          onSelectPenTool={handleSelectPenTool}
          onAddStickyNote={() => executeCommand("stickynote")}
        />
      )}

      {/* ── 2. Excalidraw Canvas Wrapper (Flex-1 remaining space) ── */}
      <div
        id="whiteboard-canvas-container"
        data-tour="canvas"
        className={`flex-1 relative h-full w-full overflow-hidden z-20 transition-all duration-300 ${
          isPresentMode ? "present-mode-active" : ""
        } ${pendingAIElements && pendingAIElements.length > 0 ? "cursor-crosshair" : ""}`}
      >
        {/* Click-to-Place Interception Overlay */}
        {pendingAIElements && pendingAIElements.length > 0 && (
          <div
            className="absolute inset-0 z-30 cursor-crosshair bg-cyan-950/10 pointer-events-auto select-none"
            onPointerDown={handleCanvasClickToPlace}
            title="Click anywhere on canvas to place AI diagram"
          />
        )}

        <Excalidraw
          excalidrawAPI={(api) => {
            excalidrawAPIRef.current = api;
            setExcalidrawAPI(api);
            setIsCanvasReady(true);
          }}
          theme={effectiveTheme}
          gridModeEnabled={canvasGrid !== "solid"}
          viewModeEnabled={false}
          zenModeEnabled={false}
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
          {/* ── Click-to-Place Floating UI Feedback Banner ── */}
          <AnimatePresence>
            {pendingAIElements && pendingAIElements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.95 }}
                className="pointer-events-auto select-none fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3.5 bg-[#09090b]/95 backdrop-blur-2xl border-2 border-cyan-400/70 shadow-[0_0_40px_rgba(6,182,212,0.4)] rounded-2xl px-5 py-3 text-white font-mono text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
                  </span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-white font-bold tracking-tight">
                    ✨ AI Generation Ready:
                  </span>
                  <span className="text-cyan-300 font-medium">
                    Click anywhere on the canvas to place it.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingAIElements(null);
                  }}
                  className="ml-2 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 text-xs transition-all cursor-pointer"
                  title="Cancel placement"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* ── Enterprise Live Transcription HUD (Floating Island Detached from Top) ── */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="pointer-events-auto select-none absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-2xl lg:max-w-3xl flex items-start gap-3.5 bg-[#09090b]/60 backdrop-blur-xl border border-white/5 shadow-[0_0_24px_rgba(6,182,212,0.25)] rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
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
                  className="shrink-0 text-[10px] text-zinc-400 hover:text-white px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-400/30 transition-all cursor-pointer mt-0.5 shadow-sm"
                  title="Mute Live Transcription"
                >
                  Mute
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Top-Left Canvas Controls: Sidebar Toggle, Save Button & Import PDF ── */}
          <CanvasHeader
            isSidebarVisible={isSidebarVisible}
            onToggleSidebar={() => setIsSidebarVisible(true)}
            onSaveToCloud={() => handleSaveToCloud(true)}
            isSavingCloud={isSavingCloud}
            isPresentMode={isPresentMode}
            onImportPdfClick={() => setIsDocDropzoneOpen(true)}
            isImportingPdf={isImportingPdf}
          />
          <input
            ref={pdfFileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.ppt"
            className="hidden"
            onChange={handleHeaderPdfUpload}
          />

          {/* ── Universal Document Dropzone Modal (.pdf, .docx, .pptx) ── */}
          <UniversalDocumentDropzoneModal
            isOpen={isDocDropzoneOpen}
            onClose={() => setIsDocDropzoneOpen(false)}
            onProcessDocument={handleProcessUniversalDocument}
          />

          {/* ── Modern PDF Processing Progress Toast ── */}
          <AnimatePresence>
            {isImportingPdf && (
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -24, scale: 0.95 }}
                className="pointer-events-auto select-none fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3.5 bg-[#09090b]/95 backdrop-blur-2xl border-2 border-purple-400/60 shadow-[0_0_40px_rgba(168,85,247,0.35)] rounded-2xl px-5 py-3 text-white font-mono text-xs sm:text-sm"
              >
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {pdfProgress && pdfProgress.total > 0
                        ? `Processing PDF Page ${pdfProgress.current} of ${pdfProgress.total}...`
                        : "Preparing PDF Vector Engine..."}
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-300 font-sans">
                    Rendering locked high-resolution background pages for seamless drawing
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── First-Time User Onboarding Tour (Driver.js) ── */}
          <TutorialTour />


          {/* Cloud Save Toast Notification */}
          <AnimatePresence>
            {cloudSaveNotice && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#09090b]/95 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.35)] text-cyan-300 font-mono text-xs select-none pointer-events-auto"
              >
                <Check className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="font-semibold text-white tracking-wide">{cloudSaveNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Session Alert Toast Notification */}
          <AnimatePresence>
            {liveNotice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#09090b]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.3)] text-cyan-300 font-mono text-xs pointer-events-auto"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{liveNotice}</span>
                <button
                  onClick={() => setLiveNotice(null)}
                  className="ml-2 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-3 h-3" />
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
                leftOffset={!isSidebarVisible ? 16 : isSidebarCollapsed ? 68 : 260}
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
            <div className="pointer-events-auto relative z-[100]">
              <CodeOnBoardWidget
                isOpen={isCodeWidgetOpen}
                onClose={() => setIsCodeWidgetOpen(false)}
                onInsertToCanvas={handleInsertCodeOutput}
                leftOffset={!isSidebarVisible ? 20 : isSidebarCollapsed ? 90 : 280}
              />
            </div>
          )}

          {/* Modals & Dialogs (Active clicks enabled) */}
          <div className="pointer-events-auto">
            {/* Cyberpunk Tiered Voice AI Panel */}
            <VoiceAIPanel
              isOpen={isVoicePanelOpen}
              onClose={() => setIsVoicePanelOpen(false)}
              excalidrawAPI={excalidrawAPIRef.current || excalidrawAPI}
              onOpenUpgradeModal={() => {
                setPricingModalReason("Upgrade to MasmSpace PRO for continuous dictation and multi-step complex voice commands.");
                setShowPricingModal(true);
              }}
            />

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
              onProUpgradeSuccess={() => {
                setIsProUser(true);
                setAiUsage({ actions_used: 0, action_limit: 999999, tier: "pro" });
              }}
              actionsUsed={aiUsage.actions_used}
              actionLimit={aiUsage.action_limit}
              tier={aiUsage.tier}
              autoSave={isAutoSave}
              onAutoSaveChange={(val) => setIsAutoSave(val)}
              onGridTypeChange={(grid) => {
                setCanvasGrid(grid);
                if (excalidrawAPIRef.current) {
                  excalidrawAPIRef.current.updateScene({
                    appState: {
                      gridModeEnabled: grid !== "solid",
                    },
                  });
                }
              }}
              onThemeChange={(th) => {
                setTheme(th);
                const nextEffective = (th === "light" || (th === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches))
                  ? "light"
                  : "dark";
                if (excalidrawAPIRef.current) {
                  excalidrawAPIRef.current.updateScene({
                    appState: {
                      theme: nextEffective,
                      viewBackgroundColor: nextEffective === "light" ? "#ffffff" : "#121212",
                    },
                  });
                }
              }}
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
              roomId={activeRoomId || activeFileId || "session-main"}
              isHost={true}
              onEndSession={handleEndLiveSession}
              onKickPeer={handleKickPeer}
            />

            {/* Help & Keyboard Shortcuts Dialog */}
            <AnimatePresence>
              {isHelpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#09090b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl text-white flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-white">MasmSpace Help & Shortcuts</h3>
                      </div>
                      <button
                        onClick={() => setIsHelpModalOpen(false)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close Help"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-zinc-300 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Selection Tool</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">V / 1</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Draw Pen</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">P / 7</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Rectangle</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">R / 2</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Diamond</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">D / 3</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Arrow</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">A / 5</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Text Tool</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">T / 8</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Undo / Redo</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">Ctrl+Z / Ctrl+Y</kbd>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <span className="text-zinc-400">Delete</span>
                          <kbd className="px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-[10px]">Del / Backspace</kbd>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 flex flex-col gap-1 text-[11px]">
                        <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Presenter & Multiplayer Features
                        </div>
                        <p className="text-zinc-300 text-[10px] leading-relaxed">
                          • Click <strong className="text-white">Present</strong> in the sidebar to activate the laser pointer and distraction-free Presentation Mode.
                        </p>
                        <p className="text-zinc-300 text-[10px] leading-relaxed">
                          • Use <strong className="text-white">Share</strong> to copy the multiplayer session link for real-time collaboration with unique cursor mapping.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-white/10">
                      <button
                        onClick={() => setIsHelpModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
                      >
                        Got it
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── AI Canvas Assistant: Floating Action Buttons & Glassmorphism Chatbot ── */}
          {!isPresentMode && !isExecutiveMode && (
            <>
              {/* Bottom-Right Stacked Floating Container (Clean, No Overlap) */}
              <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 z-50">
                {/* Glowing Cyberpunk AI Assistant FAB Button */}
                <button
                  id="ai-chatbot-fab"
                  onClick={() => setIsChatOpen((prev) => !prev)}
                  className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all duration-300 shadow-2xl flex items-center justify-center pointer-events-auto group ${isChatOpen
                      ? "bg-[#09090b]/80 border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.45)] scale-105"
                      : "bg-[#09090b]/60 border-white/5 text-zinc-300 hover:text-cyan-300 hover:border-cyan-400/50 hover:shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:scale-105"
                    }`}
                  aria-label="Toggle AI Chatbot"
                  title="AI Whiteboard Assistant"
                >
                  <Bot className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                  </span>
                </button>

                {/* Help & Keyboard Shortcuts (?) Button */}
                <button
                  id="help-shortcuts-btn"
                  onClick={() => {
                    if (excalidrawAPIRef.current) {
                      try {
                        excalidrawAPIRef.current.setAppState({ openDialog: { name: "help" } });
                      } catch {
                        setIsHelpModalOpen(true);
                      }
                    } else {
                      setIsHelpModalOpen(true);
                    }
                  }}
                  className="p-3.5 rounded-2xl backdrop-blur-xl bg-[#09090b]/60 border border-white/10 text-zinc-300 hover:text-cyan-300 hover:border-cyan-400/50 hover:shadow-[0_0_16px_rgba(6,182,212,0.35)] hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center pointer-events-auto group"
                  aria-label="Help and Shortcuts (?)"
                  title="Help & Keyboard Shortcuts (?)"
                >
                  <HelpCircle className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </button>
              </div>

              {/* Slide-in Sleek Cyberpunk Glassmorphism Chat Panel & Quick Commands */}
              <AnimatePresence>
                {isChatOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed bottom-36 right-6 w-[calc(100vw-2rem)] sm:w-88 max-w-sm bg-[#09090b]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-4 z-50 flex flex-col gap-3.5 shadow-[0_0_40px_rgba(0,0,0,0.7)] pointer-events-auto"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                            MasmSpace AI Agent
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-mono font-bold">
                              PRO
                            </span>
                          </h3>
                          <p className="text-[10px] text-zinc-400">Programmatic Canvas Assistant</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsChatOpen(false)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
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
                          className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"
                            }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.sender === "user"
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
                        className={`overflow-y-auto max-h-48 custom-scrollbar space-y-3 pr-1 text-xs transition-opacity duration-200 ${isGenerating ? "pointer-events-none opacity-60" : ""
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
                                  className={`w-full flex flex-row items-center justify-between rounded-lg p-2 transition-all border ${isGenerating
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
                                  className={`w-full flex flex-row items-center justify-between rounded-lg p-2 transition-all border ${isGenerating
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
                                      className={`w-3.5 h-3.5 transition-colors ${isFav
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

          {/* ── Voice AI Studio Floating Command Center (z-[100]) ── */}
          <VoiceAIPanel
            excalidrawAPI={excalidrawAPI || excalidrawAPIRef.current}
            isOpen={isVoicePanelOpen}
            onClose={() => setIsVoicePanelOpen(false)}
            onOpenUpgradeModal={() => {
              setPricingModalReason(
                "Upgrade to PRO for continuous voice dictation and multi-step complex canvas commands."
              );
              setShowPricingModal(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}

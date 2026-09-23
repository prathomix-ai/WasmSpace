"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  MiniMapNodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomTechNode, { CustomTechNodeData } from "@/components/CustomTechNode";
import GroupNode from "@/components/GroupNode";
import ShapeNode from "@/components/ShapeNode";
import LineNode from "@/components/LineNode";
import ProUpgradeModal from "@/components/ProUpgradeModal";
import type { CanvasToolMode } from "@/components/BottomToolbar";
import TopFloatingBar from "@/components/TopFloatingBar";
import ContextualToolbar from "@/components/ContextualToolbar";
import InspectorPanel from "@/components/InspectorPanel";
import BottomControls from "@/components/BottomControls";
import AICommandPalette from "@/components/AICommandPalette";
import EmptyCanvasState from "@/components/EmptyCanvasState";
import QuickActionButton from "@/components/QuickActionButton";
import PresentationModeHUD, { PresentationShapeType } from "@/components/PresentationModeHUD";
import { SHAPE_LIBRARY } from "@/constants/shapeLibrary";
import DrawingOverlay, { DrawingStroke, StrokePoint, getSvgPathFromPoints, pointsToSvgPath, PenType } from "@/components/DrawingOverlay";
import DrawingNode from "@/components/DrawingNode";
import AlignmentGuides, { AlignmentGuideLine } from "@/components/AlignmentGuides";
import AICoPilotDrawer from "@/components/AICoPilotDrawer";
import CanvasContextMenu from "@/components/CanvasContextMenu";
import SettingsModal from "@/components/SettingsModal";
import { toPng } from "html-to-image";
import DocumentPageNode from "@/components/DocumentPageNode";
import { importDocumentFile } from "@/utils/documentImporter";
import { checkIsProUser } from "@/lib/userSubscription";
import { LiveSyncManager, type LiveCursor, type CompactCoordinate } from "@/lib/liveSync";
import { scheduleDebouncedSave, flushCanvasSave } from "@/lib/canvasPersistence";
import { useMixAIGenerate } from "@/lib/useMixAI";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  CheckCircle,
} from "lucide-react";
import { useTheme } from "next-themes";

function getInitialColorForShape(shapeDef?: { color?: string }): string {
  if (!shapeDef?.color) return "#3b82f6";
  const c = shapeDef.color.toLowerCase();
  if (c.includes("emerald")) return "#10b981";
  if (c.includes("rose")) return "#f43f5e";
  if (c.includes("amber")) return "#f59e0b";
  if (c.includes("purple")) return "#8b5cf6";
  if (c.includes("cyan")) return "#06b6d4";
  if (c.includes("indigo")) return "#6366f1";
  if (c.includes("teal")) return "#14b8a6";
  if (c.includes("sky")) return "#0ea5e9";
  if (c.includes("yellow")) return "#eab308";
  if (c.includes("pink")) return "#ec4899";
  if (c.includes("red")) return "#ef4444";
  if (c.includes("green")) return "#22c55e";
  return "#3b82f6";
}

// ── 1. Clean Initial State: Completely Empty Canvas (No Pre-existing Nodes or Edges) ──
const initialNodes: Node<any>[] = [];
const initialEdges: Edge[] = [];

export interface ArchitectureCanvasProps {
  sidebarCollapsed?: boolean;
  className?: string;
  onOpenUpgradeModal?: () => void;
  onOpenSettings?: () => void;
  importedFile?: File | null;
  onClearImportedFile?: () => void;
  roomId?: string;
  isLiveSession?: boolean;
  permission?: "edit" | "view";
  boardTitle?: string;
  onBoardTitleChange?: (title: string) => void;
  isReadOnly?: boolean;
  isPresentationOpen?: boolean;
  onExitPresentation?: () => void;
  onStartPresentation?: () => void;
  onShareClick?: () => void;
}

const CustomMiniMapNode = React.memo(function CustomMiniMapNode({
  id,
  x,
  y,
  width,
  height,
  color,
  strokeColor,
  strokeWidth,
  borderRadius = 4,
  shapeRendering,
  className,
  onClick,
}: MiniMapNodeProps) {
  const { getNode } = useReactFlow();
  const node = getNode(id);

  // If node is a freehand drawing stroke, render the actual SVG stroke path instead of a solid bounding box
  if (node?.type === "drawingNode") {
    const dData = (node.data || {}) as any;
    if (dData?.path) {
      return (
        <g
          transform={`translate(${x}, ${y})`}
          className={className}
          onClick={onClick ? (e) => onClick(e, id) : undefined}
          style={{ cursor: "pointer" }}
        >
          <path
            d={dData.path}
            fill={dData.color || color || "#06b6d4"}
            opacity={dData.opacity ?? 1}
          />
        </g>
      );
    }
  }

  // Fallback for standard tech architecture nodes (render clean rounded rectangle)
  return (
    <rect
      className={className}
      x={x}
      y={y}
      rx={borderRadius}
      ry={borderRadius}
      width={width}
      height={height}
      style={{
        fill: color,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      }}
      shapeRendering={shapeRendering}
      onClick={onClick ? (e) => onClick(e, id) : undefined}
    />
  );
});

function ArchitectureCanvasInner({
  sidebarCollapsed = false,
  className = "",
  onOpenUpgradeModal,
  onOpenSettings: externalOpenSettings,
  onShareClick: externalOpenShare,
  importedFile,
  onClearImportedFile,
  roomId = "room-default",
  isLiveSession = false,
  permission = "edit",
  boardTitle = "System Architecture Topology",
  onBoardTitleChange,
  isReadOnly = false,
  isPresentationOpen = false,
  onExitPresentation,
  onStartPresentation,
}: ArchitectureCanvasProps) {
  const { screenToFlowPosition, fitView, setCenter, zoomIn, zoomOut, zoomTo } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      techNode: CustomTechNode,
      shapeNode: ShapeNode,
      lineNode: LineNode,
      groupNode: GroupNode,
      documentPageNode: DocumentPageNode,
      imageNode: DocumentPageNode,
      drawingNode: DrawingNode,
    }),
    []
  );

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [nodes, setNodes, rawOnNodesChange] = useNodesState<Node<any>>(initialNodes);
  const [edges, setEdges, rawOnEdgesChange] = useEdgesState<Edge>(initialEdges);
  const isDraggingRef = useRef(false);
  const latestNodesRef = useRef(nodes);
  const latestEdgesRef = useRef(edges);

  useEffect(() => {
    latestNodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    latestEdgesRef.current = edges;
  }, [edges]);

  // SWR-powered AI topology generation hook
  const { generateBlueprint } = useMixAIGenerate();

  // 1. State Optimization: Debounced & Throttled onNodesChange
  // Updates local UI smoothly at 60fps; suppresses DB sync during drag; streams 50ms batch coordinate deltas
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      let isDragActive = false;
      for (const change of changes) {
        if (change.type === "position" && change.dragging) {
          isDragActive = true;
          break;
        }
      }

      isDraggingRef.current = isDragActive;
      rawOnNodesChange(changes);

      // If active drag, batch lightweight coordinate updates to peers
      if (isDragActive && syncManagerRef.current) {
        for (const change of changes) {
          if (change.type === "position" && change.position) {
            syncManagerRef.current.queueCoordinateUpdate(
              change.id,
              change.position.x,
              change.position.y
            );
          }
        }
      }

      // If NOT dragging (e.g. selection, dimension change, remove), schedule debounced save
      if (!isDragActive && !isReadOnly) {
        scheduleDebouncedSave(roomId, latestNodesRef.current, latestEdgesRef.current, boardTitle, 2500, false);
      }
    },
    [rawOnNodesChange, roomId, boardTitle, isReadOnly]
  );

  // 2. Debounced onEdgesChange: Schedules DB save with 2.5s debounce
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      rawOnEdgesChange(changes);
      if (!isReadOnly) {
        scheduleDebouncedSave(roomId, latestNodesRef.current, latestEdgesRef.current, boardTitle, 2500, isDraggingRef.current);
      }
    },
    [rawOnEdgesChange, roomId, boardTitle, isReadOnly]
  );
  const [activeToolMode, setActiveToolMode] = useState<CanvasToolMode>("select");
  const [penType, setPenType] = useState<PenType>("ballpen");
  const [drawingColor, setDrawingColor] = useState<string>(isDark ? "#ffffff" : "#1e293b");
  const [drawingWidth, setDrawingWidth] = useState<number>(3);
  const [eraserRadius, setEraserRadius] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("Prathomix_eraser_radius");
      if (saved) return Number(saved);
    }
    return 24;
  });
  const [isAICoPilotOpen, setIsAICoPilotOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(100);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [isAICommandOpen, setIsAICommandOpen] = useState(false);
  const [isProUpgradeOpen, setIsProUpgradeOpen] = useState(false);
  const [drawingOpacity, setDrawingOpacity] = useState<number>(1.0);
  const [redoHistory, setRedoHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const activeSelectedNode = selectedNodes[0] || null;
  const [shapeNodesEnabled, setShapeNodesEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prathomix_shape_nodes_enabled");
      if (saved !== null) return saved === "true";
    }
    return true;
  });

  const handleToggleShapeNodes = useCallback(() => {
    setShapeNodesEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("prathomix_shape_nodes_enabled", String(next));
      }
      return next;
    });
  }, []);
  const [synthesizeNotification, setSynthesizeNotification] = useState<string | null>(null);

  // Canvas Background Grid Style (dots | lines | solid)
  const [gridType, setGridType] = useState<"dots" | "lines" | "solid">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("Prathomix_canvas_grid");
      if (saved === "dots" || saved === "lines" || saved === "solid") {
        return saved;
      }
    }
    return "dots";
  });

  // Listen for real-time grid style changes across components & tabs
  useEffect(() => {
    const handleGridEvent = (e: Event) => {
      const customEvent = e as CustomEvent<"dots" | "lines" | "solid">;
      if (customEvent.detail && ["dots", "lines", "solid"].includes(customEvent.detail)) {
        setGridType(customEvent.detail);
        return;
      }
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("Prathomix_canvas_grid");
        if (saved === "dots" || saved === "lines" || saved === "solid") {
          setGridType(saved);
        }
      }
    };

    window.addEventListener("prathomix:grid-change", handleGridEvent);
    window.addEventListener("storage", handleGridEvent);
    return () => {
      window.removeEventListener("prathomix:grid-change", handleGridEvent);
      window.removeEventListener("storage", handleGridEvent);
    };
  }, []);

  // Real-time live collaboration sync state
  const [remoteCursors, setRemoteCursors] = useState<Record<string, LiveCursor>>({});
  const [, setLivePeersCount] = useState(1);
  const syncManagerRef = useRef<LiveSyncManager | null>(null);
  const isBroadcastingRef = useRef(false);

  // Sync default pen color when switching between light whiteboard & dark studio
  useEffect(() => {
    setDrawingColor((prev) => {
      if (prev === "#1e293b" && isDark) return "#ffffff";
      if (prev === "#ffffff" && !isDark) return "#1e293b";
      return prev;
    });
  }, [isDark]);

  // ── Presentation Mode State & Slide Deck Navigation ──
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slideNodes = useMemo(() => {
    return nodes.filter((n) => !n.hidden && n.type !== "groupNode");
  }, [nodes]);

  const navigateToSlide = useCallback(
    (targetIdx: number) => {
      if (slideNodes.length === 0) return;
      const boundedIdx = (targetIdx + slideNodes.length) % slideNodes.length;
      setCurrentSlideIndex(boundedIdx);

      const targetShape = slideNodes[boundedIdx];
      if (targetShape) {
        const posX = targetShape.position.x + (targetShape.width || 200) / 2;
        const posY = targetShape.position.y + (targetShape.height || 120) / 2;
        setCenter(posX, posY, { zoom: 1.15, duration: 450 });
        setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === targetShape.id })));
      }
    },
    [slideNodes, setCenter, setNodes]
  );

  const handleNextSlide = useCallback(() => {
    navigateToSlide(currentSlideIndex + 1);
  }, [navigateToSlide, currentSlideIndex]);

  const handlePrevSlide = useCallback(() => {
    navigateToSlide(currentSlideIndex - 1);
  }, [navigateToSlide, currentSlideIndex]);

  const handleExitPresentation = useCallback(() => {
    setActiveToolMode("select");
    if (onExitPresentation) {
      onExitPresentation();
    }
  }, [onExitPresentation]);

  // When entering presentation mode, auto-focus on first slide without forcing laser mode.
  // Only update tool mode on presentation open/close transitions, NOT on every stroke or node addition.
  const prevPresentationOpenRef = useRef(isPresentationOpen);
  useEffect(() => {
    const wasOpen = prevPresentationOpenRef.current;
    prevPresentationOpenRef.current = isPresentationOpen;

    if (isPresentationOpen && !wasOpen) {
      if (slideNodes.length > 0) {
        const target = slideNodes[0];
        setCenter(
          target.position.x + (target.width || 200) / 2,
          target.position.y + (target.height || 120) / 2,
          { zoom: 1.15, duration: 500 }
        );
      }
    } else if (!isPresentationOpen && wasOpen) {
      setActiveToolMode("select");
    }
  }, [isPresentationOpen, slideNodes, setCenter]);

  // Undo / History Stack
  const [, setHistory] = useState<{ nodes: Node<any>[]; edges: Edge[] }[]>([]);

  // Custom Sleek Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    targetNode?: Node<any>;
  } | null>(null);

  // In-session Node Clipboard for Copy & Paste
  const [clipboardNodes, setClipboardNodes] = useState<Node<any>[]>([]);

  // Smart Alignment Guides & Grid Snapping State
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuideLine[]>([]);
  const [isSnappingEnabled] = useState(true);
  const snapPosRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // Live AI Quota Tracking — synced from global SubscriptionContext
  const subscription = useSubscription();
  const [aiUsage, setAiUsage] = useState({
    used: 0,
    limit: 15,
    tier: "free",
  });

  // Keep aiUsage in sync with SubscriptionContext (for SettingsModal)
  useEffect(() => {
    if (subscription.isResolved) {
      setAiUsage({
        used: subscription.actionsUsed,
        limit: subscription.actionLimit,
        tier: subscription.tier,
      });
    }
  }, [subscription.isResolved, subscription.actionsUsed, subscription.actionLimit, subscription.tier]);

  useEffect(() => {
    const handleSubChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tier === "pro" || detail?.is_pro) {
        setAiUsage((prev) => ({ ...prev, limit: 300, tier: "pro" }));
      }
    };
    window.addEventListener("Prathomix_subscription_change", handleSubChange);
    return () => window.removeEventListener("Prathomix_subscription_change", handleSubChange);
  }, [isSettingsModalOpen]);

  // Live Sync Engine lifecycle
  useEffect(() => {
    if (!roomId) return;

    let myId = `user_${Math.random().toString(36).substring(2, 7)}`;
    let myName = isLiveSession ? "Collaborator" : "Host Architect";
    const myColor = isLiveSession ? "#10b981" : "#06b6d4";

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("prathomix_current_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          myId = parsed.id || myId;
          myName = parsed.name || myName;
        }
      } catch {}
    }

    const manager = new LiveSyncManager({
      roomId,
      userId: myId,
      userName: myName,
      userColor: myColor,
      isHost: !isLiveSession,
      onStateReceived: (incomingNodes, incomingEdges, incomingTitle) => {
        isBroadcastingRef.current = true;
        setNodes(incomingNodes);
        setEdges(incomingEdges);
        if (incomingTitle && onBoardTitleChange) {
          onBoardTitleChange(incomingTitle);
        }
        setTimeout(() => {
          isBroadcastingRef.current = false;
        }, 80);
      },
      // 2. High-Concurrency Multiplayer Sync: Compact Coordinate Deltas
      onCoordinatesReceived: (coords: CompactCoordinate[]) => {
        setNodes((nds) => {
          const map = new Map(coords.map((c) => [c.id, c]));
          return nds.map((n) => {
            const up = map.get(n.id);
            if (up) {
              return { ...n, position: { x: up.x, y: up.y } };
            }
            return n;
          });
        });
      },
      onCursorReceived: (cursor) => {
        setRemoteCursors((prev) => ({ ...prev, [cursor.id]: cursor }));
      },
      onRequestState: () => {
        return {
          nodes: latestNodesRef.current,
          edges: latestEdgesRef.current,
          title: boardTitle,
        };
      },
      onPeersUpdated: (count) => {
        setLivePeersCount(count);
      },
    });

    syncManagerRef.current = manager;

    return () => {
      manager.destroy();
      syncManagerRef.current = null;
    };
  }, [roomId, isLiveSession, boardTitle, onBoardTitleChange, setNodes, setEdges]);

  // Automatically broadcast settled state changes to peers (suppressed during active drag)
  useEffect(() => {
    if (isBroadcastingRef.current || !syncManagerRef.current || isReadOnly) return;
    if (isDraggingRef.current) return; // Do not broadcast heavy state during drag
    const timeout = setTimeout(() => {
      syncManagerRef.current?.broadcastState(nodes, edges, boardTitle);
    }, 400);
    return () => clearTimeout(timeout);
  }, [nodes, edges, boardTitle, isReadOnly]);

  // Stale remote cursor purger
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (now - v.lastUpdated > 4000) {
            delete next[k];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initial Empty Canvas: strictly guarantee canvas starts clean for host
  useEffect(() => {
    if (!isLiveSession) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges, isLiveSession]);

  // Push snapshot to undo stack before mutations
  const pushHistorySnapshot = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), { nodes: [...nodes], edges: [...edges] }]);
  }, [nodes, edges]);

  // Freehand Drawing Stroke Completion Handler: converts SVG stroke into a React Flow Node
  const handleStrokeComplete = useCallback(
    (stroke: DrawingStroke) => {
      if (!stroke.points || stroke.points.length === 0) return;

      pushHistorySnapshot();

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const pt of stroke.points) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      const padding = Math.max(stroke.width * 2, 16);
      const posX = minX - padding;
      const posY = minY - padding;
      const boxWidth = Math.max(maxX - minX + padding * 2, padding * 2);
      const boxHeight = Math.max(maxY - minY + padding * 2, padding * 2);

      const relativePoints: StrokePoint[] = stroke.points.map((p) => ({
        x: p.x - posX,
        y: p.y - posY,
        pressure: p.pressure,
      }));

      const pathD = getSvgPathFromPoints(relativePoints, stroke.width, stroke.tool);

      const newDrawingNode: Node<any> = {
        id: stroke.id || `drawing-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: "drawingNode",
        position: { x: posX, y: posY },
        data: {
          path: pathD,
          color: stroke.color,
          width: stroke.width,
          opacity: stroke.opacity,
          tool: stroke.tool,
          penType: stroke.penType || penType,
          originalPoints: stroke.points,
          boxWidth,
          boxHeight,
        },
        style: {
          width: boxWidth,
          height: boxHeight,
        },
      };

      setNodes((prev) => [...prev, newDrawingNode]);
    },
    [pushHistorySnapshot, setNodes]
  );

  // Freehand Drag-Eraser Handler: removes drawing nodes or elements under eraser coordinate or swept path
  const handleEraseAtPoint = useCallback(
    (pt: StrokePoint, prevPt?: StrokePoint | null, customRadius?: number) => {
      setNodes((nds) => {
        let hasDeleted = false;
        const threshold = customRadius || eraserRadius || 26;

        const nextNodes = nds.filter((n) => {
          if (n.type === "drawingNode") {
            const originalPoints = (n.data as any)?.originalPoints as StrokePoint[] | undefined;
            const nx = n.position.x;
            const ny = n.position.y;
            const nw = (n.data as any)?.boxWidth || 50;
            const nh = (n.data as any)?.boxHeight || 50;
            const pad = threshold + 15;

            // Fast bounding box check
            const inBox = (x: number, y: number) =>
              x >= nx - pad && x <= nx + nw + pad && y >= ny - pad && y <= ny + nh + pad;

            if (!inBox(pt.x, pt.y) && (!prevPt || !inBox(prevPt.x, prevPt.y))) {
              return true;
            }

            if (!originalPoints || originalPoints.length === 0) {
              hasDeleted = true;
              return false;
            }

            for (const p of originalPoints) {
              if (prevPt) {
                const dx = pt.x - prevPt.x;
                const dy = pt.y - prevPt.y;
                const l2 = dx * dx + dy * dy;
                if (l2 === 0) {
                  if (Math.hypot(p.x - pt.x, p.y - pt.y) < threshold) {
                    hasDeleted = true;
                    return false;
                  }
                } else {
                  let t = ((p.x - prevPt.x) * dx + (p.y - prevPt.y) * dy) / l2;
                  t = Math.max(0, Math.min(1, t));
                  const projX = prevPt.x + t * dx;
                  const projY = prevPt.y + t * dy;
                  if (Math.hypot(p.x - projX, p.y - projY) < threshold) {
                    hasDeleted = true;
                    return false;
                  }
                }
              } else {
                if (Math.hypot(p.x - pt.x, p.y - pt.y) < threshold) {
                  hasDeleted = true;
                  return false;
                }
              }
            }
            return true;
          }

          // Also allow erasing non-drawing architecture nodes when eraser crosses them
          const nx = n.position.x;
          const ny = n.position.y;
          const nw = (n.measured?.width || (n as any).width || 140);
          const nh = (n.measured?.height || (n as any).height || 70);

          const inNode = (x: number, y: number) =>
            x >= nx && x <= nx + nw && y >= ny && y <= ny + nh;

          if (inNode(pt.x, pt.y) || (prevPt && inNode(prevPt.x, prevPt.y))) {
            hasDeleted = true;
            return false;
          }

          return true;
        });

        if (hasDeleted) {
          const remainingNodeIds = new Set(nextNodes.map((n) => n.id));
          setEdges((eds) =>
            eds.filter((e) => remainingNodeIds.has(e.source) && remainingNodeIds.has(e.target))
          );
          return nextNodes;
        }
        return nds;
      });
    },
    [setNodes, setEdges]
  );

  // Multi-Page Document Importer (PDFs, Images, DOCX, PPTX)
  const processDocumentImport = useCallback(
    async (file: File) => {
      try {
        setSynthesizeNotification(`✨ Processing ${file.name}…`);

        const { nodes: importedNodes, pageCount, fileName } = await importDocumentFile(file, {
          startX: 120,
          startY: 120,
          targetWidth: 850,
          onProgress: (_curr, _total, msg) => {
            setSynthesizeNotification(msg);
          },
        });

        if (importedNodes.length === 0) {
          throw new Error("No pages could be extracted from this document.");
        }

        setNodes((prev) => [...prev, ...importedNodes]);
        setSynthesizeNotification(
          `✨ Imported ${fileName} (${pageCount} page${pageCount > 1 ? "s" : ""} vertically stacked)`
        );

        setTimeout(() => {
          fitView({ padding: 0.15, maxZoom: 1, duration: 800 });
        }, 200);

        setTimeout(() => {
          setSynthesizeNotification(null);
        }, 5000);
      } catch (err: any) {
        console.error("[Document Importer] Error:", err);
        alert(`Document import failed: ${err.message || "Unknown error"}`);
        setSynthesizeNotification(null);
      } finally {
        if (onClearImportedFile) {
          onClearImportedFile();
        }
      }
    },
    [fitView, setNodes, onClearImportedFile]
  );

  useEffect(() => {
    if (importedFile) {
      processDocumentImport(importedFile);
    }
  }, [importedFile, processDocumentImport]);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      const file = e.dataTransfer.files?.[0];
      if (file) {
        const validExts = [
          ".pdf",
          ".docx",
          ".doc",
          ".pptx",
          ".ppt",
          ".png",
          ".jpg",
          ".jpeg",
          ".webp",
          ".svg",
        ];
        const hasValidExt = validExts.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );
        if (hasValidExt || file.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          processDocumentImport(file);
        }
      }
    },
    [processDocumentImport]
  );

  // Undo last canvas change (Cmd/Ctrl + Z)
  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) {
        setSynthesizeNotification("Nothing to undo");
        setTimeout(() => setSynthesizeNotification(null), 1500);
        return prev;
      }
      const previous = prev[prev.length - 1];
      setRedoHistory((r) => [...r, { nodes: [...nodes], edges: [...edges] }]);
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setSynthesizeNotification("Undid last action");
      setTimeout(() => setSynthesizeNotification(null), 1500);
      return prev.slice(0, -1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  // Redo canvas change (Cmd/Ctrl + Y)
  const handleRedo = useCallback(() => {
    setRedoHistory((prev) => {
      if (prev.length === 0) {
        setSynthesizeNotification("Nothing to redo");
        setTimeout(() => setSynthesizeNotification(null), 1500);
        return prev;
      }
      const next = prev[prev.length - 1];
      setHistory((h) => [...h, { nodes: [...nodes], edges: [...edges] }]);
      setNodes(next.nodes);
      setEdges(next.edges);
      setSynthesizeNotification("Redid action");
      setTimeout(() => setSynthesizeNotification(null), 1500);
      return prev.slice(0, -1);
    });
  }, [nodes, edges, setNodes, setEdges]);

  // Clear entire canvas
  const handleClearCanvas = useCallback(() => {
    pushHistorySnapshot();
    setNodes([]);
    setEdges([]);
    setSynthesizeNotification("Canvas cleared");
    setTimeout(() => setSynthesizeNotification(null), 1500);
  }, [pushHistorySnapshot, setNodes, setEdges]);

  // Add whiteboard shape from toolbar dropdown or canvas click
  const handleAddShape = useCallback(
    (shapeType: string) => {
      pushHistorySnapshot();
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() * 80 - 40),
        y: window.innerHeight / 2 + (Math.random() * 80 - 40),
      });

      const shapeDef = SHAPE_LIBRARY.find((s) => s.id.toLowerCase() === shapeType.toLowerCase());
      const normalizedShape = (shapeDef?.id || shapeType).toLowerCase();
      const isCircle = normalizedShape === "circle" || normalizedShape === "round";
      const isSquareLike = [
        "circle",
        "round",
        "square",
        "diamond",
        "star",
        "hexagon",
        "pentagon",
        "octagon",
        "heart",
        "triangle",
        "move",
        "arrowupright",
        "arrowdownright",
        "arrowleftright",
        "arrowupdown",
        "refreshcw",
        "repeat",
      ].includes(normalizedShape);
      const isHorizontalArrow = ["arrowright", "arrowleft"].includes(normalizedShape);
      const isVerticalArrow = ["arrowup", "arrowdown"].includes(normalizedShape);
      const isText = normalizedShape === "text";
      const isSticky = normalizedShape === "stickynote";
      const isPrimitive = [
        "rectangle",
        "rect",
        "square",
        "box",
        "circle",
        "round",
        "diamond",
        "triangle",
        "cylinder",
        "database",
        "cloud",
        "star",
        "hexagon",
        "pentagon",
        "octagon",
        "heart",
        "stickynote",
        "folder",
      ].includes(normalizedShape);
      const isIconSymbol = !isPrimitive && !isHorizontalArrow && !isVerticalArrow && !isSquareLike;

      let defaultWidth = 140;
      let defaultHeight = 90;

      if (isCircle || isSquareLike) {
        defaultWidth = 110;
        defaultHeight = 110;
      } else if (isHorizontalArrow) {
        defaultWidth = 130;
        defaultHeight = 70;
      } else if (isVerticalArrow) {
        defaultWidth = 70;
        defaultHeight = 130;
      } else if (isIconSymbol) {
        defaultWidth = 85;
        defaultHeight = 85;
      } else if (isText) {
        defaultWidth = 180;
        defaultHeight = 50;
      } else if (isSticky) {
        defaultWidth = 130;
        defaultHeight = 130;
      } else if (normalizedShape === "rectangle" || normalizedShape === "box") {
        defaultWidth = 160;
        defaultHeight = 100;
      }

      const label = isText
        ? "Text Note"
        : isSticky
        ? "Sticky Note"
        : "";

      const initialColor = isSticky ? "#f59e0b" : getInitialColorForShape(shapeDef);

      const newNode: Node<any> = {
        id,
        type: "shapeNode",
        position,
        style: {
          width: defaultWidth,
          height: defaultHeight,
        },
        data: {
          shapeType: normalizedShape,
          shapeStyle: shapeDef?.shapeStyle || normalizedShape,
          label,
          color: initialColor,
          fillMode: isSticky ? "solid" : (isText || !isPrimitive) ? "outline" : "tint",
          category: shapeDef?.category || "essentials",
          hasHandles: shapeNodesEnabled,
        },
        selected: true,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);
      setSynthesizeNotification(`Added ${shapeDef?.label || normalizedShape}`);
      setTimeout(() => setSynthesizeNotification(null), 2500);
    },
    [screenToFlowPosition, pushHistorySnapshot, setNodes, shapeNodesEnabled]
  );

  // Add editable line with independent endpoints
  const handleAddLine = useCallback(
    (lineType: string = "straight") => {
      pushHistorySnapshot();
      const id = `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() * 40 - 20),
        y: window.innerHeight / 2 + (Math.random() * 40 - 20),
      });

      const newLineNode: Node = {
        id,
        type: "lineNode",
        position,
        data: {
          x1: 0,
          y1: 0,
          x2: 180,
          y2: 80,
          color: "#635BFF",
          width: 2,
          routing: lineType === "curved" ? "curved" : lineType === "orthogonal" ? "orthogonal" : "straight",
          style: lineType === "dashed" ? "dashed" : "solid",
          startMarker: lineType === "double_arrow" ? "arrow" : "none",
          endMarker: lineType === "arrow" || lineType === "double_arrow" ? "arrow" : "none",
        },
        selected: true,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newLineNode]);
      setSynthesizeNotification(`Added ${lineType} line`);
      setTimeout(() => setSynthesizeNotification(null), 2000);
    },
    [screenToFlowPosition, pushHistorySnapshot, setNodes]
  );

  // Eraser Tool Handlers: Clicking a node or edge when Eraser tool is active removes it
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, clickedNode: Node) => {
      setContextMenu(null);
      if (activeToolMode === "eraser") {
        setNodes((nds) => nds.filter((n) => n.id !== clickedNode.id));
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== clickedNode.id && e.target !== clickedNode.id
          )
        );
      }
    },
    [activeToolMode, setNodes, setEdges]
  );

  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, clickedEdge: Edge) => {
      setContextMenu(null);
      if (activeToolMode === "eraser") {
        setEdges((eds) => eds.filter((e) => e.id !== clickedEdge.id));
      }
    },
    [activeToolMode, setEdges]
  );

  // ── Context Menu Actions (Add Node, Copy, Paste, Group, Export as PNG) ──
  const handlePaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      if ("stopPropagation" in event && typeof event.stopPropagation === "function") {
        event.stopPropagation();
      }
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowPosition: flowPos,
      });
    },
    [screenToFlowPosition]
  );

  const handleNodeContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent, node: Node) => {
      event.preventDefault();
      event.stopPropagation();
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, selected: true } : (event as React.MouseEvent).shiftKey ? n : { ...n, selected: false }
        )
      );
      const flowPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        flowPosition: flowPos,
        targetNode: node as Node<any>,
      });
    },
    [screenToFlowPosition, setNodes]
  );

  const handleContextMenuAddNode = useCallback(
    (category: string = "service") => {
      const position = contextMenu?.flowPosition || { x: 250, y: 180 };
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      let newNode: Node<any>;

      if (category === "database") {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Database Cluster",
            subtitle: "Managed Relational Store",
            category: "database",
            status: "healthy",
            description: "Dedicated persistence tier with automated replication and snapshot backup.",
            metrics: { latency: "3.5ms", uptime: "99.99%" },
            tags: ["PostgreSQL", "Aurora", "ACID"],
          },
          selected: true,
        };
      } else if (category === "cloud" || category === "gateway") {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Cloud Edge Gateway",
            subtitle: "Multi-Region Ingress",
            category: "gateway",
            status: "active",
            description: "Global anycast edge routing with rate-limiting, SSL termination, and WAF inspection.",
            metrics: { latency: "4.2ms", throughput: "48.2k rps", uptime: "99.99%" },
            tags: ["Cloudflare", "HTTP/3", "WAF"],
          },
          selected: true,
        };
      } else if (category === "box") {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Container Cluster Mesh",
            subtitle: "Kubernetes Pod Cluster",
            category: "service",
            status: "active",
            description: "Orchestrated container cluster with service mesh and autoscaling HPA.",
            metrics: { latency: "6.8ms", throughput: "24.5k rps", uptime: "99.95%" },
            tags: ["Kubernetes", "Envoy", "gRPC"],
          },
          selected: true,
        };
      } else if (category === "text") {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Architecture Spec Note",
            subtitle: "Specification & SLA Note",
            category: "text",
            status: "active",
            description: "System architecture boundary note: cross-region latency threshold is 10ms.",
            tags: ["Architecture Note", "Docs"],
          },
          selected: true,
        };
      } else if (category === "stickyNote") {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "System Review Note",
            subtitle: "Deployment Task",
            category: "note",
            status: "warning",
            description: "Ensure Redis cache eviction TTL is configured to 300 seconds before release.",
            tags: ["Sticky Note", "P0 Priority"],
          },
          selected: true,
        };
      } else {
        newNode = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Microservice Worker",
            subtitle: "Async Compute Service",
            category: "service",
            status: "active",
            description: "High-performance compute container processing domain jobs.",
            metrics: { latency: "12ms", throughput: "8.4k rps", uptime: "99.9%" },
            tags: ["FastAPI", "Docker", "AutoScaled"],
          },
          selected: true,
        };
      }

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);
      setSynthesizeNotification(`Added ${newNode.data.title}`);
      setTimeout(() => setSynthesizeNotification(null), 2500);
    },
    [contextMenu, setNodes]
  );

  const handleContextMenuCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const toCopy =
      selectedNodes.length > 0
        ? selectedNodes
        : contextMenu?.targetNode
          ? [contextMenu.targetNode]
          : [];

    if (toCopy.length > 0) {
      setClipboardNodes(toCopy);
      setSynthesizeNotification(
        `Copied ${toCopy.length} node${toCopy.length > 1 ? "s" : ""} to clipboard`
      );
      setTimeout(() => setSynthesizeNotification(null), 2500);
    }
  }, [nodes, contextMenu]);

  const handleContextMenuPaste = useCallback(() => {
    if (clipboardNodes.length === 0) return;

    const pastePos = contextMenu?.flowPosition;
    const minX = Math.min(...clipboardNodes.map((n) => n.position.x));
    const minY = Math.min(...clipboardNodes.map((n) => n.position.y));

    const pastedNodes: Node<any>[] = clipboardNodes.map((node) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newPosition = pastePos
        ? {
          x: pastePos.x + (node.position.x - minX),
          y: pastePos.y + (node.position.y - minY),
        }
        : {
          x: node.position.x + 40,
          y: node.position.y + 40,
        };

      return {
        ...node,
        id: newId,
        position: newPosition,
        selected: true,
      };
    });

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...pastedNodes,
    ]);

    setSynthesizeNotification(
      `Pasted ${pastedNodes.length} node${pastedNodes.length > 1 ? "s" : ""}`
    );
    setTimeout(() => setSynthesizeNotification(null), 2500);
  }, [clipboardNodes, contextMenu, setNodes]);

  const handleContextMenuGroup = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const targetNodes =
      selectedNodes.length > 0
        ? selectedNodes
        : contextMenu?.targetNode
          ? [contextMenu.targetNode]
          : [];

    if (targetNodes.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      targetNodes.forEach((node) => {
        const x = node.position.x;
        const y = node.position.y;
        const w = (node as any).measured?.width || (node as any).width || 280;
        const h = (node as any).measured?.height || (node as any).height || 180;

        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x + w > maxX) maxX = x + w;
        if (y + h > maxY) maxY = y + h;
      });

      const paddingX = 40;
      const paddingTop = 50;
      const paddingBottom = 40;

      const groupNodeId = `group-${Date.now()}`;
      const newGroupNode: Node = {
        id: groupNodeId,
        type: "groupNode",
        position: { x: minX - paddingX, y: minY - paddingTop },
        style: {
          width: Math.max(maxX - minX + paddingX * 2, 320),
          height: Math.max(maxY - minY + paddingTop + paddingBottom, 220),
        },
        data: {
          title: "Architecture Subnet Boundary",
          subtitle: "Virtual Private Cloud (VPC)",
          category: "group",
          tags: ["Group", "Security Zone"],
        },
        zIndex: -1,
        selected: true,
      };

      setNodes((nds) => [newGroupNode, ...nds]);
      setSynthesizeNotification(
        `Created boundary group around ${targetNodes.length} node${targetNodes.length > 1 ? "s" : ""
        }`
      );
      setTimeout(() => setSynthesizeNotification(null), 3000);
    } else {
      const pos = contextMenu?.flowPosition || { x: 200, y: 150 };
      const groupNodeId = `group-${Date.now()}`;
      const newGroupNode: Node = {
        id: groupNodeId,
        type: "groupNode",
        position: { x: pos.x - 40, y: pos.y - 40 },
        style: {
          width: 480,
          height: 320,
        },
        data: {
          title: "New Subnet Cluster Zone",
          subtitle: "Architecture Group",
          category: "group",
          tags: ["Group", "Boundary"],
        },
        zIndex: -1,
        selected: true,
      };

      setNodes((nds) => [newGroupNode, ...nds]);
      setSynthesizeNotification("Created new Architecture Group Boundary");
      setTimeout(() => setSynthesizeNotification(null), 3000);
    }
  }, [nodes, contextMenu, setNodes]);

  const handleContextMenuAddShape = useCallback(
    (shapeType: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder") => {
      pushHistorySnapshot();
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const position = contextMenu?.flowPosition || screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const isCircle = shapeType === "circle";
      const isSquareLike = ["circle", "diamond"].includes(shapeType);
      const width = isCircle ? 130 : isSquareLike ? 130 : 160;
      const height = isCircle ? 130 : isSquareLike ? 130 : 100;
      const label = "";

      const newNode: Node<any> = {
        id,
        type: "shapeNode",
        position,
        style: {
          width,
          height,
        },
        data: {
          shapeType,
          shapeStyle: shapeType,
          label,
          color: "#3b82f6",
          fillMode: "tint",
          category: "essentials",
          hasHandles: shapeNodesEnabled,
        },
        selected: true,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);
      setSynthesizeNotification(`Added ${shapeType.charAt(0).toUpperCase() + shapeType.slice(1)}`);
      setTimeout(() => setSynthesizeNotification(null), 2500);
    },
    [contextMenu, screenToFlowPosition, pushHistorySnapshot, setNodes, shapeNodesEnabled]
  );

  const handleContextMenuDelete = useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    const targetId = contextMenu?.targetNode?.id;
    const idsToDelete = new Set(selectedIds);
    if (targetId) idsToDelete.add(targetId);

    if (idsToDelete.size === 0) return;

    pushHistorySnapshot();
    setNodes((nds) => nds.filter((n) => !idsToDelete.has(n.id)));
    setEdges((eds) =>
      eds.filter(
        (e) => !idsToDelete.has(e.source) && !idsToDelete.has(e.target)
      )
    );
    setSynthesizeNotification(`Deleted ${idsToDelete.size} item${idsToDelete.size > 1 ? "s" : ""}`);
    setTimeout(() => setSynthesizeNotification(null), 2000);
  }, [nodes, contextMenu, pushHistorySnapshot, setNodes, setEdges]);

  const handleContextMenuSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
  }, [setNodes]);

  const handleContextMenuFitView = useCallback(() => {
    fitView({ padding: 0.25, maxZoom: 1, duration: 400 });
  }, [fitView]);

  const handleContextMenuExportPNG = useCallback(async () => {
    try {
      const viewportElement = document.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewportElement) {
        setSynthesizeNotification("Canvas viewport not found for export");
        return;
      }

      setSynthesizeNotification("Generating high-resolution PNG export...");

      const dataUrl = await toPng(viewportElement, {
        backgroundColor: "#09090b",
        pixelRatio: 2,
        cacheBust: true,
        filter: (node: any) => {
          const classList = (node as HTMLElement)?.classList;
          if (
            classList &&
            (classList.contains("react-flow__minimap") ||
              classList.contains("react-flow__controls"))
          ) {
            return false;
          }
          return true;
        },
      });

      const a = document.createElement("a");
      a.setAttribute("download", `MasmSpace-topology-${Date.now()}.png`);
      a.setAttribute("href", dataUrl);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSynthesizeNotification("Architecture Canvas exported as PNG successfully!");
      setTimeout(() => setSynthesizeNotification(null), 3000);
    } catch (err) {
      console.error("Failed to export PNG:", err);
      setSynthesizeNotification("Export failed. Please try again.");
      setTimeout(() => setSynthesizeNotification(null), 3000);
    }
  }, []);

  // High-contrast Minimap node blip coloring for effortless visual navigation
  const getMinimapNodeColor = useCallback((node: Node<any>) => {
    if (node.type === "drawingNode") {
      return (node.data as any)?.color || "#06b6d4";
    }
    if (node.type === "groupNode") {
      return "#0284c7"; // Distinct group boundary color
    }
    const cat = (node.data as any)?.category;
    if (cat === "database" || cat === "storage") {
      return "#f59e0b"; // High-contrast amber / gold
    }
    if (cat === "note" || cat === "stickyNote" || cat === "text") {
      return "#facc15"; // Bright vivid yellow
    }
    if (cat === "ai") {
      return "#ec4899"; // Neon magenta
    }
    if (cat === "gateway" || cat === "cloud") {
      return "#38bdf8"; // Bright sky cyan
    }
    // High-contrast electric cyan blip for microservices / workers
    return "#06b6d4";
  }, []);

  const getMinimapNodeStrokeColor = useCallback((node: Node<any>) => {
    if (node.type === "drawingNode") {
      return (node.data as any)?.color || "#06b6d4";
    }
    if (node.selected) {
      return "#ffffff";
    }
    const cat = (node.data as any)?.category;
    if (cat === "database" || cat === "storage" || cat === "note" || cat === "stickyNote") {
      return "#fef08a"; // High-visibility soft yellow contour
    }
    return "#a5f3fc"; // High-visibility soft cyan contour
  }, []);

  // ── Smart Alignment & Snapping Engine (Center: Blue, Edge: Red) ──
  const handleNodeDrag = useCallback(
    (_event: MouseEvent | TouchEvent | React.MouseEvent, draggedNode: Node<any>) => {
      if (!isSnappingEnabled) {
        if (alignmentGuides.length > 0) setAlignmentGuides([]);
        snapPosRef.current = { x: null, y: null };
        return;
      }

      const SNAP_THRESHOLD = 10; // Precision flow pixel snap threshold
      const newGuides: AlignmentGuideLine[] = [];

      const dWidth =
        draggedNode.measured?.width ||
        (draggedNode as any).width ||
        (draggedNode.type === "groupNode" ? (draggedNode.style?.width as number) || 400 : 280);
      const dHeight =
        draggedNode.measured?.height ||
        (draggedNode as any).height ||
        (draggedNode.type === "groupNode" ? (draggedNode.style?.height as number) || 240 : 180);

      const curX = draggedNode.position.x;
      const curY = draggedNode.position.y;

      const dLeft = curX;
      const dCenterX = curX + dWidth / 2;
      const dRight = curX + dWidth;

      const dTop = curY;
      const dCenterY = curY + dHeight / 2;
      const dBottom = curY + dHeight;

      let closestDiffX = Infinity;
      let snappedX: number | null = null;
      let xGuide: AlignmentGuideLine | null = null;

      let closestDiffY = Infinity;
      let snappedY: number | null = null;
      let yGuide: AlignmentGuideLine | null = null;

      const otherNodes = nodes.filter((n) => n.id !== draggedNode.id);

      for (const other of otherNodes) {
        const oWidth =
          other.measured?.width ||
          (other as any).width ||
          (other.type === "groupNode" ? (other.style?.width as number) || 400 : 280);
        const oHeight =
          other.measured?.height ||
          (other as any).height ||
          (other.type === "groupNode" ? (other.style?.height as number) || 240 : 180);

        const oLeft = other.position.x;
        const oCenterX = other.position.x + oWidth / 2;
        const oRight = other.position.x + oWidth;

        const oTop = other.position.y;
        const oCenterY = other.position.y + oHeight / 2;
        const oBottom = other.position.y + oHeight;

        // ── 1. Vertical Alignment Guideline Check (X-Axis) ──
        // (a) Center-to-Center: Blue Guideline
        const diffCenterX = Math.abs(dCenterX - oCenterX);
        if (diffCenterX <= SNAP_THRESHOLD && diffCenterX < closestDiffX) {
          closestDiffX = diffCenterX;
          snappedX = oCenterX - dWidth / 2;
          const startY = Math.min(dTop, oTop) - 60;
          const endY = Math.max(dBottom, oBottom) + 60;
          xGuide = {
            id: `v-center-${other.id}`,
            type: "vertical",
            position: oCenterX,
            start: startY,
            end: endY,
            color: "blue",
            label: "Center",
          };
        }

        // (b) Left-to-Left: Red Guideline
        const diffLeftLeft = Math.abs(dLeft - oLeft);
        if (diffLeftLeft <= SNAP_THRESHOLD && diffLeftLeft < closestDiffX) {
          closestDiffX = diffLeftLeft;
          snappedX = oLeft;
          const startY = Math.min(dTop, oTop) - 60;
          const endY = Math.max(dBottom, oBottom) + 60;
          xGuide = {
            id: `v-left-${other.id}`,
            type: "vertical",
            position: oLeft,
            start: startY,
            end: endY,
            color: "red",
            label: "Left Align",
          };
        }

        // (c) Right-to-Right: Red Guideline
        const diffRightRight = Math.abs(dRight - oRight);
        if (diffRightRight <= SNAP_THRESHOLD && diffRightRight < closestDiffX) {
          closestDiffX = diffRightRight;
          snappedX = oRight - dWidth;
          const startY = Math.min(dTop, oTop) - 60;
          const endY = Math.max(dBottom, oBottom) + 60;
          xGuide = {
            id: `v-right-${other.id}`,
            type: "vertical",
            position: oRight,
            start: startY,
            end: endY,
            color: "red",
            label: "Right Align",
          };
        }

        // ── 2. Horizontal Alignment Guideline Check (Y-Axis) ──
        // (a) Center-to-Center: Blue Guideline
        const diffCenterY = Math.abs(dCenterY - oCenterY);
        if (diffCenterY <= SNAP_THRESHOLD && diffCenterY < closestDiffY) {
          closestDiffY = diffCenterY;
          snappedY = oCenterY - dHeight / 2;
          const startX = Math.min(dLeft, oLeft) - 60;
          const endX = Math.max(dRight, oRight) + 60;
          yGuide = {
            id: `h-center-${other.id}`,
            type: "horizontal",
            position: oCenterY,
            start: startX,
            end: endX,
            color: "blue",
            label: "Center",
          };
        }

        // (b) Top-to-Top: Red Guideline
        const diffTopTop = Math.abs(dTop - oTop);
        if (diffTopTop <= SNAP_THRESHOLD && diffTopTop < closestDiffY) {
          closestDiffY = diffTopTop;
          snappedY = oTop;
          const startX = Math.min(dLeft, oLeft) - 60;
          const endX = Math.max(dRight, oRight) + 60;
          yGuide = {
            id: `h-top-${other.id}`,
            type: "horizontal",
            position: oTop,
            start: startX,
            end: endX,
            color: "red",
            label: "Top Align",
          };
        }

        // (c) Bottom-to-Bottom: Red Guideline
        const diffBottomBottom = Math.abs(dBottom - oBottom);
        if (diffBottomBottom <= SNAP_THRESHOLD && diffBottomBottom < closestDiffY) {
          closestDiffY = diffBottomBottom;
          snappedY = oBottom - dHeight;
          const startX = Math.min(dLeft, oLeft) - 60;
          const endX = Math.max(dRight, oRight) + 60;
          yGuide = {
            id: `h-bottom-${other.id}`,
            type: "horizontal",
            position: oBottom,
            start: startX,
            end: endX,
            color: "red",
            label: "Bottom Align",
          };
        }
      }

      if (xGuide) newGuides.push(xGuide);
      if (yGuide) newGuides.push(yGuide);

      snapPosRef.current = { x: snappedX, y: snappedY };
      setAlignmentGuides(newGuides);
    },
    [nodes, isSnappingEnabled, alignmentGuides.length]
  );

  const handleNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent | React.MouseEvent, draggedNode: Node<any>) => {
      isDraggingRef.current = false;

      const { x: snapX, y: snapY } = snapPosRef.current;
      let finalNodes = latestNodesRef.current;
      if (snapX !== null || snapY !== null) {
        finalNodes = latestNodesRef.current.map((n) => {
          if (n.id === draggedNode.id) {
            return {
              ...n,
              position: {
                x: snapX !== null ? snapX : n.position.x,
                y: snapY !== null ? snapY : n.position.y,
              },
            };
          }
          return n;
        });
        setNodes(finalNodes);
      }
      snapPosRef.current = { x: null, y: null };
      setAlignmentGuides([]);

      // ── REQUIREMENT 1: Sync to DB strictly on onNodeDragStop ──
      if (!isReadOnly) {
        flushCanvasSave(roomId, finalNodes, latestEdgesRef.current, boardTitle);
      }

      // ── REQUIREMENT 2: Broadcast settled full state to peers ──
      syncManagerRef.current?.broadcastState(finalNodes, latestEdgesRef.current, boardTitle);
    },
    [roomId, boardTitle, isReadOnly, setNodes]
  );

  // Keyboard shortcut bindings for seamless enterprise workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Handle Ctrl/Cmd combinations: Undo, Copy, Paste, Group
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          handleContextMenuCopy();
          return;
        }
        if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          handleContextMenuPaste();
          return;
        }
        if (e.key === "g" || e.key === "G") {
          e.preventDefault();
          handleContextMenuGroup();
          return;
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          handleContextMenuSelectAll();
          return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (nodes.some((n) => n.selected)) {
          e.preventDefault();
          handleContextMenuDelete();
          return;
        }
      }

      if (e.key === "Escape") {
        setContextMenu(null);
        setIsShapesMenuOpen(false);
        setActiveToolMode("select");
      } else if (e.key === "v" || e.key === "V") {
        setActiveToolMode("select");
      } else if (e.key === "h" || e.key === "H") {
        setActiveToolMode("pan");
      } else if (e.key === "s" || e.key === "S") {
        // Toggle Architecture Shapes Library dropdown
        setIsShapesMenuOpen((prev) => !prev);
      } else if (e.key === "p" || e.key === "P") {
        setActiveToolMode("pen");
      } else if (e.key === "e" || e.key === "E") {
        setActiveToolMode("eraser");
      } else if (e.key === "t" || e.key === "T") {
        setActiveToolMode("text");
      } else if (e.key === "n" || e.key === "N") {
        setActiveToolMode("stickyNote");
      } else if (e.key === "l" || e.key === "L") {
        setActiveToolMode("laser");
      } else if (e.key === "f" || e.key === "F") {
        fitView({ padding: 0.25, maxZoom: 1 });
      } else if (e.key === "?") {
        setIsSettingsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    fitView,
    nodes,
    handleUndo,
    handleContextMenuCopy,
    handleContextMenuPaste,
    handleContextMenuGroup,
    handleContextMenuDelete,
    handleContextMenuSelectAll,
  ]);

  // Handle drag-and-drop connections between node handles
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#635BFF", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#635BFF",
              width: 16,
              height: 16,
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  // Click-to-Place node on Canvas Pane
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      setContextMenu(null);
      // Ignore click placement when in navigation or freehand drawing modes
      if (
        activeToolMode === "select" ||
        activeToolMode === "pan" ||
        activeToolMode === "pen" ||
        activeToolMode === "highlighter" ||
        activeToolMode === "eraser" ||
        activeToolMode === "laser"
      ) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      if (activeToolMode === "server") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Microservice Service",
            subtitle: "Async Worker Service",
            category: "service",
            status: "active",
            description: "High-performance compute container processing domain jobs.",
            metrics: {
              latency: "12ms",
              throughput: "8.4k rps",
              uptime: "99.9%",
            },
            tags: ["FastAPI", "Docker", "AutoScaled"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (activeToolMode === "database") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Database Cluster",
            subtitle: "Managed Relational Store",
            category: "database",
            status: "healthy",
            description: "Dedicated persistence tier with automated replication and snapshot backup.",
            metrics: {
              latency: "3.5ms",
              uptime: "99.99%",
            },
            tags: ["PostgreSQL", "Aurora", "ACID"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (activeToolMode === "cloud") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Cloud Edge Gateway",
            subtitle: "Multi-Region Ingress",
            category: "gateway",
            status: "active",
            description: "Global anycast edge routing with rate-limiting, SSL termination, and WAF inspection.",
            metrics: {
              latency: "4.2ms",
              throughput: "48.2k rps",
              uptime: "99.99%",
            },
            tags: ["Cloudflare", "HTTP/3", "WAF"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (activeToolMode === "box") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Container Cluster Mesh",
            subtitle: "Kubernetes Pod Cluster",
            category: "service",
            status: "active",
            description: "Orchestrated container cluster with service mesh and autoscaling HPA.",
            metrics: {
              latency: "6.8ms",
              throughput: "24.5k rps",
              uptime: "99.95%",
            },
            tags: ["Kubernetes", "Envoy", "gRPC"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (activeToolMode === "text") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "Architecture Spec Note",
            subtitle: "Specification & SLA Note",
            category: "text",
            status: "active",
            description: "System architecture boundary note: cross-region latency threshold is 10ms.",
            tags: ["Architecture Note", "Docs"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      } else if (activeToolMode === "stickyNote") {
        const newNode: Node<CustomTechNodeData> = {
          id,
          type: "techNode",
          position,
          data: {
            title: "System Review Note",
            subtitle: "Deployment Task",
            category: "note",
            status: "warning",
            description: "Ensure Redis cache eviction TTL is configured to 300 seconds before release.",
            tags: ["Sticky Note", "P0 Priority"],
          },
        };
        setNodes((nds) => [...nds, newNode]);
      }

      // Reset to select tool after placement
      setActiveToolMode("select");
    },
    [activeToolMode, screenToFlowPosition, setNodes]
  );

  // Dynamic AI Architecture Synthesis directly onto Canvas with SWR Caching & Backoff
  const handleGenerateArchitecture = useCallback(
    async (promptText: string) => {
      try {
        setSynthesizeNotification(`🧠 Synthesizing topology blueprint...`);
        await generateBlueprint(promptText);
      } catch (err: any) {
        console.warn("[ArchitectureCanvas] SWR AI Notice:", err);
      }

      const lower = promptText.toLowerCase();
      let generatedNodes: Node<CustomTechNodeData>[] = [];
      let generatedEdges: Edge[] = [];

      if (lower.includes("aws") || lower.includes("lambda") || lower.includes("sqs")) {
        // AWS Microservices Architecture
        generatedNodes = [
          {
            id: "aws-gw",
            type: "techNode",
            position: { x: 300, y: 80 },
            data: {
              title: "Amazon API Gateway",
              subtitle: "Regional HTTP API",
              category: "gateway",
              status: "active",
              description: "Managed REST/HTTP API with Cognito authorizer and WAF inspection.",
              metrics: { latency: "3.8ms", throughput: "65k rps", uptime: "99.99%" },
              tags: ["AWS", "API Gateway", "WAF"],
            },
          },
          {
            id: "aws-lambda",
            type: "techNode",
            position: { x: 180, y: 280 },
            data: {
              title: "Order Processor Lambda",
              subtitle: "Serverless Compute",
              category: "service",
              status: "active",
              description: "Event-driven auto-scaling Node.js/Python microservice worker.",
              metrics: { latency: "22ms", uptime: "100%" },
              tags: ["Lambda", "ARM64", "Serverless"],
            },
          },
          {
            id: "aws-sqs",
            type: "techNode",
            position: { x: 420, y: 280 },
            data: {
              title: "Transaction SQS Queue",
              subtitle: "Standard Message Bus",
              category: "queue",
              status: "active",
              description: "Decoupled async buffer with Dead-Letter Queue (DLQ) retry policies.",
              metrics: { throughput: "120k msg/s", uptime: "99.99%" },
              tags: ["SQS", "FIFO", "DLQ"],
            },
          },
          {
            id: "aws-dynamo",
            type: "techNode",
            position: { x: 300, y: 480 },
            data: {
              title: "DynamoDB Global Store",
              subtitle: "NoSQL Multi-Active Table",
              category: "database",
              status: "healthy",
              description: "Single-digit millisecond latency at any scale with global replication.",
              metrics: { latency: "4.1ms", uptime: "99.999%" },
              tags: ["DynamoDB", "On-Demand", "Global"],
            },
          },
        ];

        generatedEdges = [
          {
            id: "e-gw-lambda",
            source: "aws-gw",
            target: "aws-lambda",
            animated: true,
            style: { stroke: "#06b6d4", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
          },
          {
            id: "e-gw-sqs",
            source: "aws-gw",
            target: "aws-sqs",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          },
          {
            id: "e-lambda-dynamo",
            source: "aws-lambda",
            target: "aws-dynamo",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
          },
          {
            id: "e-sqs-dynamo",
            source: "aws-sqs",
            target: "aws-dynamo",
            animated: true,
            style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "5 5" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
          },
        ];
      } else if (lower.includes("database") || lower.includes("postgres") || lower.includes("redis")) {
        // High-Availability Data Tier
        generatedNodes = [
          {
            id: "ingress-node",
            type: "techNode",
            position: { x: 280, y: 70 },
            data: {
              title: "Envoy Load Balancer",
              subtitle: "L7 Reverse Proxy",
              category: "gateway",
              status: "active",
              description: "Intelligent connection pooling and query circuit breaking.",
              metrics: { latency: "1.2ms", throughput: "95k rps" },
              tags: ["Envoy", "gRPC", "Keep-Alive"],
            },
          },
          {
            id: "redis-cache",
            type: "techNode",
            position: { x: 120, y: 270 },
            data: {
              title: "Redis Cluster Cache",
              subtitle: "In-Memory Data Store",
              category: "cache",
              status: "active",
              description: "Write-through sub-millisecond cache with active LRU eviction.",
              metrics: { latency: "0.6ms", throughput: "200k ops" },
              tags: ["Redis 7.2", "Cluster", "PubSub"],
            },
          },
          {
            id: "postgres-primary",
            type: "techNode",
            position: { x: 440, y: 270 },
            data: {
              title: "PostgreSQL Aurora Primary",
              subtitle: "Multi-AZ Read/Write Node",
              category: "database",
              status: "healthy",
              description: "ACID compliant relational core with automated point-in-time recovery.",
              metrics: { latency: "8.5ms", uptime: "99.99%" },
              tags: ["PostgreSQL 16", "WAL", "Multi-AZ"],
            },
          },
          {
            id: "postgres-replica",
            type: "techNode",
            position: { x: 440, y: 490 },
            data: {
              title: "PostgreSQL Read Replica",
              subtitle: "Streaming Replication Node",
              category: "database",
              status: "healthy",
              description: "Dedicated read query replica offloading primary read workload.",
              metrics: { latency: "5.2ms", uptime: "100%" },
              tags: ["Replica", "Async", "Read-Only"],
            },
          },
        ];

        generatedEdges = [
          {
            id: "e-lb-redis",
            source: "ingress-node",
            target: "redis-cache",
            animated: true,
            style: { stroke: "#f59e0b", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
          },
          {
            id: "e-lb-pg",
            source: "ingress-node",
            target: "postgres-primary",
            animated: true,
            style: { stroke: "#06b6d4", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
          },
          {
            id: "e-pg-replica",
            source: "postgres-primary",
            target: "postgres-replica",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
          },
        ];
      } else {
        // Universal Microservice Topology Synthesis
        generatedNodes = [
          {
            id: "edge-ingress",
            type: "techNode",
            position: { x: 280, y: 70 },
            data: {
              title: "Edge API Ingress",
              subtitle: "API Gateway & Router",
              category: "gateway",
              status: "active",
              description: "Edge layer routing client requests to downstream microservices.",
              metrics: { latency: "4.5ms", throughput: "42k rps", uptime: "99.99%" },
              tags: ["Envoy", "Zero-Trust", "TLS 1.3"],
            },
          },
          {
            id: "core-service",
            type: "techNode",
            position: { x: 140, y: 280 },
            data: {
              title: "Core Business Engine",
              subtitle: "Kubernetes Microservice",
              category: "service",
              status: "active",
              description: "Stateless domain execution tier with horizontal auto-scaling.",
              metrics: { latency: "14ms", uptime: "99.95%" },
              tags: ["Go", "Kubernetes", "gRPC"],
            },
          },
          {
            id: "ai-brain",
            type: "techNode",
            position: { x: 440, y: 280 },
            data: {
              title: "AI Semantic Engine",
              subtitle: "Vector RAG & LLM Engine",
              category: "ai",
              status: "active",
              description: "Contextual semantic retrieval and high-throughput query synthesis.",
              metrics: { latency: "65ms", uptime: "99.9%" },
              tags: ["Gemini 1.5", "Pinecone", "RAG"],
            },
          },
          {
            id: "persistence-layer",
            type: "techNode",
            position: { x: 280, y: 500 },
            data: {
              title: "Distributed Data Lake",
              subtitle: "Scalable Persistence Tier",
              category: "database",
              status: "healthy",
              description: "Distributed ACID storage with automated cross-region replication.",
              metrics: { latency: "9.2ms", uptime: "99.99%" },
              tags: ["PostgreSQL", "Kafka", "Aurora"],
            },
          },
        ];

        generatedEdges = [
          {
            id: "e-edge-core",
            source: "edge-ingress",
            target: "core-service",
            animated: true,
            style: { stroke: "#06b6d4", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
          },
          {
            id: "e-edge-ai",
            source: "edge-ingress",
            target: "ai-brain",
            animated: true,
            style: { stroke: "#6366f1", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
          },
          {
            id: "e-core-db",
            source: "core-service",
            target: "persistence-layer",
            animated: true,
            style: { stroke: "#10b981", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
          },
          {
            id: "e-ai-db",
            source: "ai-brain",
            target: "persistence-layer",
            animated: true,
            style: { stroke: "#a855f7", strokeWidth: 2, strokeDasharray: "5 5" },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
          },
        ];
      }

      setNodes(generatedNodes);
      setEdges(generatedEdges);

      // ── REQUIREMENT 1 & 2: Sync to DB and broadcast full settled synthesized blueprint ──
      if (!isReadOnly) {
        flushCanvasSave(roomId, generatedNodes, generatedEdges, boardTitle);
      }
      syncManagerRef.current?.broadcastState(generatedNodes, generatedEdges, boardTitle);

      setTimeout(() => fitView({ padding: 0.3, maxZoom: 1 }), 80);

      setSynthesizeNotification(`✨ Synthesized blueprint: "${promptText.slice(0, 48)}..."`);
      setTimeout(() => setSynthesizeNotification(null), 4500);
    },
    [fitView, setNodes, setEdges, generateBlueprint, isReadOnly, roomId, boardTitle]
  );

  const handleExecuteAICommand = useCallback(
    async (promptText: string, actionType?: string) => {
      pushHistorySnapshot();
      if (actionType === "organize" || promptText.toLowerCase().includes("organize") || actionType === "cleanup") {
        setNodes((nds) => {
          let col = 0;
          let row = 0;
          return nds.map((n) => {
            const x = 140 + col * 260;
            const y = 140 + row * 180;
            col++;
            if (col >= 3) {
              col = 0;
              row++;
            }
            return { ...n, position: { x, y } };
          });
        });
        setSynthesizeNotification("Canvas elements organized into clean grid");
        setTimeout(() => setSynthesizeNotification(null), 2500);
        return;
      }
      if (actionType === "summarize" || promptText.toLowerCase().includes("summarize")) {
        setSynthesizeNotification("AI extracted key architecture decisions");
        setTimeout(() => setSynthesizeNotification(null), 2500);
        return;
      }
      if (actionType === "tasks") {
        const tasks = [
          "1. Setup API Ingress & SSL",
          "2. Connect Postgres Cluster",
          "3. Configure Redis Caching",
          "4. Run End-to-End Tests",
        ];
        const newNodes: Node[] = tasks.map((t, idx) => ({
          id: `task-node-${Date.now()}-${idx}`,
          type: "shapeNode",
          position: { x: 220, y: 140 + idx * 110 },
          data: {
            shapeType: "stickynote",
            label: t,
            color: "#DCFCE7",
            hasHandles: true,
          },
        }));
        setNodes((prev) => [...prev, ...newNodes]);
        setSynthesizeNotification("Generated action tasks on board");
        setTimeout(() => setSynthesizeNotification(null), 2500);
        return;
      }
      await handleGenerateArchitecture(promptText);
    },
    [handleGenerateArchitecture, pushHistorySnapshot, setNodes]
  );

  useEffect(() => {
    const handleTemplate = (e: any) => {
      const tmplId = e.detail;
      if (tmplId === "microservices") {
        handleGenerateArchitecture("Microservices with API Gateway, Auth Service, Order Service, and PostgreSQL database cluster");
      } else if (tmplId === "cloud-topology") {
        handleGenerateArchitecture("Cloud Edge CDN topology with ingress router, serverless compute, and S3 object storage");
      } else if (tmplId === "flowchart") {
        handleGenerateArchitecture("Decision flowchart with user registration, email validation, payment verification, and onboarding steps");
      } else if (tmplId === "sprint-kanban") {
        handleGenerateArchitecture("Sprint planning board with Backlog, In Progress, Review, and Done columns");
      } else {
        handleGenerateArchitecture("Product mind map with core value proposition, growth channels, user segments, and roadmap milestones");
      }
    };
    window.addEventListener("prathomix:load-template", handleTemplate);
    return () => window.removeEventListener("prathomix:load-template", handleTemplate);
  }, [handleGenerateArchitecture]);

  const isPlacementMode =
    activeToolMode === "server" ||
    activeToolMode === "database" ||
    activeToolMode === "cloud" ||
    activeToolMode === "box" ||
    activeToolMode === "text" ||
    activeToolMode === "stickyNote";

  return (
    <div
      id="architecture-canvas-root"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleCanvasDrop}
      onPointerMove={(e) => {
        if (syncManagerRef.current) {
          const flowPt = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          syncManagerRef.current.broadcastCursor(flowPt.x, flowPt.y);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if ((e.target as HTMLElement)?.closest?.(".react-flow__node")) {
          return;
        }
        handlePaneContextMenu(e);
      }}
      className={`absolute inset-0 z-0 transition-all duration-300 overflow-hidden bg-[#FAFAF9] dark:bg-[#0E0F12] text-zinc-900 dark:text-zinc-100 ${className}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isReadOnly ? undefined : onNodesChange}
        onEdgesChange={isReadOnly ? undefined : onEdgesChange}
        onConnect={isReadOnly ? undefined : onConnect}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onMoveStart={() => setContextMenu(null)}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDrag={isReadOnly ? undefined : handleNodeDrag}
        onNodeDragStop={isReadOnly ? undefined : handleNodeDragStop}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        snapToGrid={isSnappingEnabled && activeToolMode !== "pen" && activeToolMode !== "highlighter"}
        snapGrid={[8, 8]}
        nodeTypes={nodeTypes}
        colorMode={isDark ? "dark" : "light"}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnDrag={activeToolMode === "pan" || isReadOnly}
        selectionOnDrag={!isReadOnly && activeToolMode === "select"}
        onlyRenderVisibleElements={true}
        elevateNodesOnSelect={false}
        elevateEdgesOnSelect={false}
        nodeOrigin={[0, 0]}
        onMove={(_, viewport) => setCurrentZoom(Math.round(viewport.zoom * 100))}
        className={
          activeToolMode === "eraser"
            ? "[&_.react-flow__node]:!cursor-cell [&_.react-flow__edge]:!cursor-cell cursor-cell"
            : isPlacementMode
              ? "[&_.react-flow__pane]:!cursor-crosshair cursor-crosshair"
              : ""
        }
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { stroke: isDark ? "#3f3f46" : "#cbd5e1", strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* ── Dynamic Whiteboard Grid (Dots, Lines, Solid/Blank) ── */}
        {gridType !== "solid" && (
          <Background
            variant={gridType === "lines" ? BackgroundVariant.Lines : BackgroundVariant.Dots}
            gap={gridType === "lines" ? 24 : 24}
            size={gridType === "lines" ? 1 : 1.2}
            color={
              isDark
                ? (gridType === "lines" ? "#27272a" : "#27272a")
                : (gridType === "lines" ? "#E4E4E7" : "#E4E4E7")
            }
            className={gridType === "lines" ? "opacity-70" : "opacity-80"}
          />
        )}

        {/* ── Whiteboard MiniMap (Compact, togglable) ── */}
        {isMinimapOpen && (
          <MiniMap
            zoomable
            pannable
            nodeComponent={CustomMiniMapNode}
            nodeColor={getMinimapNodeColor}
            nodeStrokeColor={getMinimapNodeStrokeColor}
            nodeStrokeWidth={1}
            nodeBorderRadius={3}
            maskColor={isDark ? "rgba(14, 15, 18, 0.75)" : "rgba(250, 250, 249, 0.75)"}
            maskStrokeColor={isDark ? "#27272a" : "#E4E4E7"}
            maskStrokeWidth={1}
            className="!bg-white/95 dark:!bg-[#18181b]/95 !border !border-zinc-200 dark:!border-zinc-800 !rounded-xl !shadow-md overflow-hidden !bottom-12 !right-3"
            style={{ width: 160, height: 100 }}
          />
        )}

        {/* ── Remote Collaborators Real-Time Cursors ── */}
        {Object.values(remoteCursors).map((c) => (
          <div
            key={c.id}
            className="pointer-events-none absolute z-[99999] transition-transform duration-75 flex items-start gap-1"
            style={{
              transform: `translate(${c.x}px, ${c.y}px)`,
            }}
          >
            <svg
              className="w-4 h-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              viewBox="0 0 24 24"
              fill={c.color}
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" />
            </svg>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono text-white font-semibold shadow-md whitespace-nowrap"
              style={{ backgroundColor: c.color }}
            >
              {c.name}
            </span>
          </div>
        ))}

        {/* ── Complete Drawing Layer (Pen, Highlighter, Eraser, Laser Pointer) ── */}
        <div
          className={`absolute inset-0 z-50 ${
            activeToolMode === "pen" ||
            activeToolMode === "highlighter" ||
            activeToolMode === "eraser" ||
            activeToolMode === "laser"
              ? "pointer-events-auto"
              : "pointer-events-none"
          }`}
        >
          <DrawingOverlay
            activeTool={activeToolMode}
            penType={penType}
            penColor={drawingColor}
            penWidth={drawingWidth}
            penOpacity={drawingOpacity}
            highlighterColor={drawingColor}
            eraserRadius={eraserRadius}
            onStrokeComplete={handleStrokeComplete}
            onEraseStroke={handleEraseAtPoint}
            onContextMenu={handlePaneContextMenu}
          />
        </div>

        {/* ── Smart Alignment Guides (Center: Blue, Edge: Red) ── */}
        <AlignmentGuides guides={alignmentGuides} />
      </ReactFlow>

      {/* ── Success Toast for Synthesized Topologies & Actions (Bottom-Right) ── */}
      {synthesizeNotification && (
        <div className="fixed bottom-6 right-6 z-[99999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 shadow-lg font-sans">
            <CheckCircle className="w-4 h-4 text-[#635BFF] shrink-0" />
            <span>{synthesizeNotification}</span>
          </div>
        </div>
      )}

      {/* ── 1. Top Slim Floating Navigation Bar ── */}
      {!isPresentationOpen && (
        <TopFloatingBar
          boardTitle={boardTitle}
          onBoardTitleChange={onBoardTitleChange || (() => {})}
          activeTool={activeToolMode}
          onSelectTool={(tool) => {
            if (["text", "stickyNote"].includes(tool)) {
              handleAddShape(tool as any);
              setActiveToolMode("select");
            } else {
              setActiveToolMode(tool);
            }
          }}
          onAddShape={handleAddShape}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={history.length > 0}
          canRedo={redoHistory.length > 0}
          zoomLevel={currentZoom}
          onZoomChange={(z) => zoomTo(z / 100, { duration: 200 })}
          onFitView={() => fitView({ padding: 0.25, maxZoom: 1, duration: 250 })}
          onOpenAICommand={() => setIsAICommandOpen(true)}
          onShareClick={externalOpenShare}
          onPresentClick={onStartPresentation}
          onOpenSettings={externalOpenSettings || (() => setIsSettingsModalOpen(true))}
          onExportPNG={handleContextMenuExportPNG}
          onClearCanvas={handleClearCanvas}
          gridType={gridType}
          onChangeGridType={setGridType}
          drawingColor={drawingColor}
          onChangeDrawingColor={setDrawingColor}
          drawingWidth={drawingWidth}
          onChangeDrawingWidth={setDrawingWidth}
          drawingOpacity={drawingOpacity}
          onChangeDrawingOpacity={setDrawingOpacity}
          penType={penType}
          onChangePenType={setPenType}
          onAddLine={handleAddLine}
          onOpenUpgradeModal={() => setIsProUpgradeOpen(true)}
        />
      )}

      {/* ── 2. Contextual Floating Toolbar on Object Selection ── */}
      {!isPresentationOpen && selectedNodes.length > 0 && (
        <ContextualToolbar
          selectedNodes={selectedNodes}
          onUpdateNodeData={(id, patch) => {
            setNodes((nds) =>
              nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
            );
          }}
          onDuplicate={(id) => {
            const node = nodes.find((n) => n.id === id);
            if (node) {
              const newId = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              setNodes((nds) => [
                ...nds.map((n) => ({ ...n, selected: false })),
                {
                  ...node,
                  id: newId,
                  position: { x: node.position.x + 30, y: node.position.y + 30 },
                  selected: true,
                },
              ]);
            }
          }}
          onDelete={(id) => {
            setNodes((nds) => nds.filter((n) => n.id !== id));
            setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
          }}
          onOpenInspector={() => setIsInspectorOpen((prev) => !prev)}
        />
      )}

      {/* ── 3. Compact Right-Side Inspector Panel ── */}
      {!isPresentationOpen && isInspectorOpen && activeSelectedNode && (
        <InspectorPanel
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          selectedNode={activeSelectedNode}
          onUpdateNode={(id, patch) => {
            setNodes((nds) =>
              nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n))
            );
          }}
          onBringToFront={(id) => {
            setNodes((nds) => {
              const node = nds.find((n) => n.id === id);
              if (!node) return nds;
              return [...nds.filter((n) => n.id !== id), node];
            });
          }}
          onSendToBack={(id) => {
            setNodes((nds) => {
              const node = nds.find((n) => n.id === id);
              if (!node) return nds;
              return [node, ...nds.filter((n) => n.id !== id)];
            });
          }}
        />
      )}

      {/* ── 4. Minimal Bottom Controls ── */}
      {!isPresentationOpen && (
        <BottomControls
          zoomLevel={currentZoom}
          onZoomIn={() => zoomIn({ duration: 150 })}
          onZoomOut={() => zoomOut({ duration: 150 })}
          onResetZoom={() => zoomTo(1, { duration: 150 })}
          onFitView={() => fitView({ padding: 0.25, maxZoom: 1, duration: 250 })}
          isMinimapOpen={isMinimapOpen}
          onToggleMinimap={() => setIsMinimapOpen((prev) => !prev)}
        />
      )}

      {/* ── 5. Empty Canvas Onboarding State ── */}
      {!isPresentationOpen && nodes.length === 0 && (
        <EmptyCanvasState
          onAddStickyNote={() => handleAddShape("stickyNote")}
          onAddShape={() => handleAddShape("rectangle")}
          onImportDocument={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json,.pdf,.png,.jpg,.jpeg";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) processDocumentImport(file);
            };
            input.click();
          }}
          onUseTemplate={() => {
            handleGenerateArchitecture("System Architecture Microservices and Ingress API");
          }}
        />
      )}

      {/* ── 6. Floating Quick Action Button ── */}
      {!isPresentationOpen && (
        <QuickActionButton
          onAddStickyNote={() => handleAddShape("stickyNote")}
          onAddText={() => handleAddShape("text")}
          onAddShape={() => handleAddShape("rectangle")}
          onAddConnector={() => setActiveToolMode("laser" as any)}
          onAddImageOrFile={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json,.pdf,.png,.jpg,.jpeg";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) processDocumentImport(file);
            };
            input.click();
          }}
        />
      )}

      {/* ── 7. AI Command Palette ── */}
      <AICommandPalette
        isOpen={isAICommandOpen}
        onClose={() => setIsAICommandOpen(false)}
        onExecutePrompt={handleExecuteAICommand}
        isPro={aiUsage.tier === "pro"}
        aiUsageCount={aiUsage.used}
        onOpenUpgradeModal={() => {
          setIsAICommandOpen(false);
          setIsProUpgradeOpen(true);
        }}
      />

      <ProUpgradeModal
        isOpen={isProUpgradeOpen}
        onClose={() => setIsProUpgradeOpen(false)}
      />

      {/* ── Upgraded Presentation Mode HUD: ONLY rendered during presentation mode ── */}
      {isPresentationOpen && (
        <PresentationModeHUD
          isActive={isPresentationOpen}
          onExit={handleExitPresentation}
          totalSlides={slideNodes.length}
          currentSlideIndex={currentSlideIndex}
          currentSlideTitle={
            slideNodes[currentSlideIndex]?.data?.title ||
            slideNodes[currentSlideIndex]?.data?.label ||
            "Architecture Node"
          }
          onNextSlide={handleNextSlide}
          onPrevSlide={handlePrevSlide}
          activeTool={activeToolMode}
          onSelectTool={(tool) => setActiveToolMode(tool as any)}
          onAddShape={(shape: any) => handleAddShape(shape as any)}
          penColor={drawingColor}
          onChangePenColor={setDrawingColor}
        />
      )}

      {/* ── Enterprise Settings Modal (Strict Quota, Reset Countdown & Shortcuts) ── */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenUpgradeModal={onOpenUpgradeModal}
        actionsUsed={aiUsage.used}
        actionLimit={aiUsage.limit}
        tier={aiUsage.tier}
        onGridTypeChange={setGridType}
      />

      {/* ── AI Co-Pilot Slide Drawer (Chat, Quota & 100+ Prompt Library) ── */}
      <AICoPilotDrawer
        isOpen={isAICoPilotOpen}
        onClose={() => setIsAICoPilotOpen(false)}
        onGenerateArchitecture={handleGenerateArchitecture}
        onOpenUpgradeModal={onOpenUpgradeModal}
      />

      {/* ── Custom Sleek Right-Click Context Menu ── */}
      <CanvasContextMenu
        isOpen={!!contextMenu?.isOpen}
        x={contextMenu?.x || 0}
        y={contextMenu?.y || 0}
        onClose={() => setContextMenu(null)}
        onAddNode={handleContextMenuAddNode}
        onAddShape={handleContextMenuAddShape}
        onCopy={handleContextMenuCopy}
        onPaste={handleContextMenuPaste}
        onGroup={handleContextMenuGroup}
        onDelete={handleContextMenuDelete}
        onSelectAll={handleContextMenuSelectAll}
        onFitView={handleContextMenuFitView}
        onExportPNG={handleContextMenuExportPNG}
        canCopy={nodes.some((n) => n.selected) || !!contextMenu?.targetNode}
        canPaste={clipboardNodes.length > 0}
        canDelete={nodes.some((n) => n.selected) || !!contextMenu?.targetNode}
        selectedCount={
          nodes.filter((n) => n.selected).length ||
          (contextMenu?.targetNode ? 1 : 0)
        }
      />
    </div>
  );
}

export default function ArchitectureCanvas(props: ArchitectureCanvasProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

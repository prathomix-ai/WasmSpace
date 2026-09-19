"use client";

import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomTechNode, { CustomTechNodeData } from "@/components/CustomTechNode";
import GroupNode from "@/components/GroupNode";
import BottomToolbar, { CanvasToolMode } from "@/components/BottomToolbar";
import DrawingOverlay, { DrawingStroke, StrokePoint, getSvgPathFromPoints, pointsToSvgPath } from "@/components/DrawingOverlay";
import DrawingNode from "@/components/DrawingNode";
import AlignmentGuides, { AlignmentGuideLine } from "@/components/AlignmentGuides";
import AICoPilotDrawer from "@/components/AICoPilotDrawer";
import CanvasContextMenu from "@/components/CanvasContextMenu";
import SettingsModal from "@/components/SettingsModal";
import { toPng } from "html-to-image";
import DocumentPageNode from "@/components/DocumentPageNode";
import { importDocumentFile } from "@/utils/documentImporter";
import {
  Sparkles,
  CheckCircle,
} from "lucide-react";

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
}

function ArchitectureCanvasInner({
  sidebarCollapsed = false,
  className = "",
  onOpenUpgradeModal,
  onOpenSettings: externalOpenSettings,
  importedFile,
  onClearImportedFile,
}: ArchitectureCanvasProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      techNode: CustomTechNode,
      groupNode: GroupNode,
      documentPageNode: DocumentPageNode,
      imageNode: DocumentPageNode,
      drawingNode: DrawingNode,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<any>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [activeToolMode, setActiveToolMode] = useState<CanvasToolMode>("select");
  const [drawingColor, setDrawingColor] = useState<string>("#06b6d4");
  const [drawingWidth, setDrawingWidth] = useState<number>(3);
  const [isAICoPilotOpen, setIsAICoPilotOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);
  const [synthesizeNotification, setSynthesizeNotification] = useState<string | null>(null);

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
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const snapPosRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });

  // FORCE Empty Initial Canvas State: strictly guarantee canvas is completely blank on load
  useEffect(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

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

  // Freehand Drag-Eraser Handler: removes drawing nodes under eraser coordinate
  const handleEraseAtPoint = useCallback(
    (pt: StrokePoint) => {
      setNodes((nds) =>
        nds.filter((n) => {
          if (n.type !== "drawingNode") return true;
          const originalPoints = (n.data as any)?.originalPoints as StrokePoint[] | undefined;
          if (!originalPoints) {
            const nx = n.position.x;
            const ny = n.position.y;
            const nw = (n.data as any)?.boxWidth || 50;
            const nh = (n.data as any)?.boxHeight || 50;
            return !(pt.x >= nx - 15 && pt.x <= nx + nw + 15 && pt.y >= ny - 15 && pt.y <= ny + nh + 15);
          }
          const isNear = originalPoints.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < 22);
          return !isNear;
        })
      );
    },
    [setNodes]
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
          fitView({ padding: 0.15, duration: 800 });
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
      setNodes(previous.nodes);
      setEdges(previous.edges);
      setSynthesizeNotification("Undid last action (Cmd/Ctrl + Z)");
      setTimeout(() => setSynthesizeNotification(null), 2000);
      return prev.slice(0, -1);
    });
  }, [setNodes, setEdges]);

  // Add architecture shape from toolbar dropdown or canvas click
  const handleAddShape = useCallback(
    (shapeType: "rectangle" | "circle" | "diamond" | "cylinder" | "cloud" | "folder") => {
      pushHistorySnapshot();
      const id = `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const position = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() * 80 - 40),
        y: window.innerHeight / 2 + (Math.random() * 80 - 40),
      });

      let newNode: Node<any>;

      switch (shapeType) {
        case "circle":
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Microservice Endpoint",
              subtitle: "API Gateway Service",
              category: "circle",
              shape: "circle",
              status: "active",
              description: "High-throughput API gateway endpoint handling load-balanced ingress traffic.",
              metrics: { latency: "2.4ms", throughput: "40k rps", uptime: "99.99%" },
              tags: ["Endpoint", "Circle", "API Gateway"],
            },
            selected: true,
          };
          break;

        case "diamond":
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Decision Router",
              subtitle: "Rule Evaluation Engine",
              category: "diamond",
              shape: "diamond",
              status: "active",
              description: "Evaluates payload conditions and dispatches events to targeted downstream services.",
              metrics: { latency: "0.9ms", uptime: "100%" },
              tags: ["Decision", "Router", "Diamond", "Branch"],
            },
            selected: true,
          };
          break;

        case "cylinder":
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Relational Database",
              subtitle: "High-Availability Store",
              category: "cylinder",
              shape: "cylinder",
              status: "healthy",
              description: "Persistent transactional database with automated failover and read replicas.",
              metrics: { latency: "1.8ms", throughput: "14k qps", uptime: "99.999%" },
              tags: ["Database", "PostgreSQL", "Cylinder", "ACID"],
            },
            selected: true,
          };
          break;

        case "cloud":
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Cloud Infrastructure",
              subtitle: "AWS / Azure Cloud Region",
              category: "cloud",
              shape: "cloud",
              status: "active",
              description: "Multi-region cloud fabric hosting container clusters and serverless functions.",
              metrics: { latency: "5.2ms", throughput: "120k rps", uptime: "99.99%" },
              tags: ["AWS", "Azure", "Cloud", "Infra"],
            },
            selected: true,
          };
          break;

        case "folder":
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Project Subnet",
              subtitle: "Namespace / Service Group",
              category: "folder",
              shape: "folder",
              status: "active",
              description: "Logical boundary grouping environment microservices and internal queues.",
              tags: ["Namespace", "Folder", "Subnet"],
            },
            selected: true,
          };
          break;

        case "rectangle":
        default:
          newNode = {
            id,
            type: "techNode",
            position,
            data: {
              title: "Compute Component",
              subtitle: "Async Worker Service",
              category: "rectangle",
              shape: "rectangle",
              status: "active",
              description: "Scalable worker container processing asynchronous background workflows.",
              metrics: { latency: "11ms", throughput: "9.5k rps", uptime: "99.9%" },
              tags: ["Worker", "Compute", "Rectangle"],
            },
            selected: true,
          };
          break;
      }

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);
      setSynthesizeNotification(`Added ${newNode.data.title}`);
      setTimeout(() => setSynthesizeNotification(null), 2500);
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
      a.setAttribute("download", `masmspace-topology-${Date.now()}.png`);
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
      const { x: snapX, y: snapY } = snapPosRef.current;
      if (snapX !== null || snapY !== null) {
        setNodes((nds) =>
          nds.map((n) => {
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
          })
        );
      }
      snapPosRef.current = { x: null, y: null };
      setAlignmentGuides([]);
    },
    [setNodes]
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
        fitView({ padding: 0.25 });
      } else if (e.key === "?") {
        setIsSettingsModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    fitView,
    handleUndo,
    handleContextMenuCopy,
    handleContextMenuPaste,
    handleContextMenuGroup,
  ]);

  // Handle drag-and-drop connections between node handles
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#06b6d4", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#06b6d4",
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

  // Dynamic AI Architecture Synthesis directly onto Canvas
  const handleGenerateArchitecture = useCallback(
    (promptText: string) => {
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

      setTimeout(() => fitView({ padding: 0.3 }), 80);

      setSynthesizeNotification(`✨ Synthesized blueprint: "${promptText.slice(0, 48)}..."`);
      setTimeout(() => setSynthesizeNotification(null), 4500);
    },
    [fitView, setNodes, setEdges]
  );

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
      className={`absolute top-0 right-0 bottom-0 z-0 transition-all duration-300 overflow-hidden bg-[#09090b] text-white ${
        sidebarCollapsed ? "left-0 md:left-[76px]" : "left-0 md:left-[260px]"
      } ${className}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onMoveStart={() => setContextMenu(null)}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        snapToGrid={isSnappingEnabled && activeToolMode !== "pen" && activeToolMode !== "highlighter"}
        snapGrid={[12, 12]}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        panOnDrag={activeToolMode === "pan"}
        selectionOnDrag={activeToolMode === "select"}
        className={
          activeToolMode === "eraser"
            ? "[&_.react-flow__node]:!cursor-cell [&_.react-flow__edge]:!cursor-cell cursor-cell"
            : isPlacementMode
              ? "[&_.react-flow__pane]:!cursor-crosshair cursor-crosshair"
              : ""
        }
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#06b6d4", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* ── Glowing Dark Dotted Blueprint Grid ── */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#3f3f46"
          className="opacity-80"
        />

        {/* ── React Flow Zoom & Navigation Controls ── */}
        <Controls
          showInteractive={false}
          className="!bg-[#18181b]/90 !backdrop-blur-md !border !border-white/10 !rounded-xl !p-1 !shadow-[0_8px_30px_rgba(0,0,0,0.5)] [&>button]:!bg-transparent [&>button]:!border-white/5 [&>button]:!rounded-lg [&>button]:!fill-zinc-300 hover:[&>button]:!bg-white/10 hover:[&>button]:!fill-cyan-400 [&>button]:transition-colors"
        />

        {/* ── Blueprint MiniMap (High-Contrast Differentiated Navigation) ── */}
        <MiniMap
          zoomable
          pannable
          nodeColor={getMinimapNodeColor}
          nodeStrokeColor={getMinimapNodeStrokeColor}
          nodeStrokeWidth={2}
          nodeBorderRadius={6}
          maskColor="rgba(5, 8, 20, 0.7)"
          maskStrokeColor="#22d3ee"
          maskStrokeWidth={2}
          className="!bg-[#0d1222] !border-2 !border-cyan-500/40 !rounded-2xl !shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)] overflow-hidden"
        />

        {/* ── Clean Top HUD Panel (Navbar AI Prompt Explorer Removed) ── */}
        <Panel
          position="top-left"
          className="m-4 flex items-center gap-3 bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white tracking-tight">
                  PRATHOMIX
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Topology Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                System Architecture Blueprint
              </p>
            </div>
          </div>
        </Panel>

        {/* ── Top Right Synchronized Status Pill ── */}
        <Panel
          position="top-right"
          className="m-4 flex items-center gap-2.5 bg-[#18181b]/80 backdrop-blur-xl border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-300 shadow-lg select-none"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Topology Synchronized</span>
          <span className="text-zinc-600">|</span>
          <span className="text-cyan-400 font-semibold">{nodes.length} Nodes</span>
          <span className="text-zinc-600">|</span>
          <span className="text-indigo-400 font-semibold">{edges.length} Edges</span>
          <span className="text-zinc-600">|</span>
          <button
            onClick={() => setIsSnappingEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-mono transition-colors ${isSnappingEnabled
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25"
                : "bg-zinc-800/60 border-white/10 text-zinc-400 hover:bg-zinc-800"
              }`}
            title="Toggle Smart Alignment Guides & Grid Snapping"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isSnappingEnabled ? "bg-cyan-400 animate-pulse" : "bg-zinc-500"
                }`}
            />
            <span>Snap & Guides {isSnappingEnabled ? "ON" : "OFF"}</span>
          </button>
        </Panel>

        {/* ── Complete Drawing Layer (Pen, Highlighter, Eraser, Laser Pointer) ── */}
        <DrawingOverlay
          activeTool={activeToolMode}
          penColor={drawingColor}
          penWidth={drawingWidth}
          highlighterColor={drawingColor}
          onStrokeComplete={handleStrokeComplete}
          onEraseStroke={handleEraseAtPoint}
        />

        {/* ── Smart Alignment Guides (Center: Blue, Edge: Red) ── */}
        <AlignmentGuides guides={alignmentGuides} />
      </ReactFlow>

      {/* ── Success Toast for Synthesized Topologies & Actions (Bottom-Right) ── */}
      {synthesizeNotification && (
        <div className="fixed bottom-6 right-6 z-[99999] pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 bg-[#09090b]/95 backdrop-blur-2xl border border-cyan-400/50 rounded-2xl px-5 py-3 text-xs text-white shadow-[0_0_30px_rgba(6,182,212,0.35)] font-mono">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{synthesizeNotification}</span>
          </div>
        </div>
      )}

      {/* ── Enterprise Apple-Style Floating Top Toolbar Wrapped in High Z-Index ── */}
      <BottomToolbar
        activeMode={activeToolMode}
        strokeColor={drawingColor}
        onChangeStrokeColor={setDrawingColor}
        strokeWidth={drawingWidth}
        onChangeStrokeWidth={setDrawingWidth}
        onSelectMode={(mode) => {
          if (["rectangle", "circle", "diamond", "cylinder", "cloud", "folder"].includes(mode)) {
            handleAddShape(mode as any);
            setActiveToolMode("select");
          } else {
            setActiveToolMode(mode);
          }
        }}
        onToggleAICoPilot={() => setIsAICoPilotOpen((prev) => !prev)}
        isAICoPilotOpen={isAICoPilotOpen}
        onFitView={() => fitView({ padding: 0.25 })}
        onOpenSettings={externalOpenSettings || (() => setIsSettingsModalOpen(true))}
        onAddShape={handleAddShape}
        isShapesMenuOpen={isShapesMenuOpen}
        onToggleShapesMenu={() => setIsShapesMenuOpen((prev) => !prev)}
      />

      {/* ── Enterprise Settings Modal (Strict Quota, Reset Countdown & Shortcuts) ── */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenUpgradeModal={onOpenUpgradeModal}
        actionsUsed={12}
        actionLimit={15}
        tier="free"
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
        onCopy={handleContextMenuCopy}
        onPaste={handleContextMenuPaste}
        onGroup={handleContextMenuGroup}
        onExportPNG={handleContextMenuExportPNG}
        canCopy={nodes.some((n) => n.selected) || !!contextMenu?.targetNode}
        canPaste={clipboardNodes.length > 0}
        selectedCount={nodes.filter((n) => n.selected).length}
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

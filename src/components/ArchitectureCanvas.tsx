"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
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
import BottomToolbar, { CanvasToolMode } from "@/components/BottomToolbar";
import DrawingOverlay from "@/components/DrawingOverlay";
import AICoPilotDrawer from "@/components/AICoPilotDrawer";
import {
  Sparkles,
  CheckCircle,
} from "lucide-react";

// ── 1. Clean Initial State: Completely Empty Canvas (No Pre-existing Nodes or Edges) ──
const initialNodes: Node<CustomTechNodeData>[] = [];
const initialEdges: Edge[] = [];

export interface ArchitectureCanvasProps {
  sidebarCollapsed?: boolean;
  className?: string;
  onOpenUpgradeModal?: () => void;
}

function ArchitectureCanvasInner({
  sidebarCollapsed = false,
  className = "",
  onOpenUpgradeModal,
}: ArchitectureCanvasProps) {
  const { screenToFlowPosition, fitView } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      techNode: CustomTechNode,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CustomTechNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [activeToolMode, setActiveToolMode] = useState<CanvasToolMode>("select");
  const [isAICoPilotOpen, setIsAICoPilotOpen] = useState(false);
  const [synthesizeNotification, setSynthesizeNotification] = useState<string | null>(null);

  // FORCE Empty Initial Canvas State: strictly guarantee canvas is completely blank on load
  useEffect(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Eraser Tool Handlers: Clicking a node or edge when Eraser tool is active removes it
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, clickedNode: Node) => {
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
      if (activeToolMode === "eraser") {
        setEdges((eds) => eds.filter((e) => e.id !== clickedEdge.id));
      }
    },
    [activeToolMode, setEdges]
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

      if (e.key === "Escape") {
        setActiveToolMode("select");
      } else if (e.key === "v" || e.key === "V") {
        setActiveToolMode("select");
      } else if (e.key === "h" || e.key === "H") {
        setActiveToolMode("pan");
      } else if (e.key === "s" || e.key === "S") {
        setActiveToolMode("server");
      } else if (e.key === "d" || e.key === "D") {
        setActiveToolMode("database");
      } else if (e.key === "c" || e.key === "C") {
        setActiveToolMode("cloud");
      } else if (e.key === "b" || e.key === "B") {
        setActiveToolMode("box");
      } else if (e.key === "p" || e.key === "P") {
        setActiveToolMode("pen");
      } else if (e.key === "e" || e.key === "E") {
        setActiveToolMode("eraser");
      } else if (e.key === "l" || e.key === "L") {
        setActiveToolMode("laser");
      } else if (e.key === "t" || e.key === "T") {
        setActiveToolMode("text");
      } else if (e.key === "n" || e.key === "N") {
        setActiveToolMode("stickyNote");
      } else if (e.key === "f" || e.key === "F") {
        fitView({ padding: 0.25 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fitView]);

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
      className={`absolute top-0 right-0 bottom-0 transition-all duration-300 overflow-hidden bg-[#09090b] text-white ${
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
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
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

        {/* ── Blueprint MiniMap ── */}
        <MiniMap
          zoomable
          pannable
          nodeColor="#06b6d4"
          nodeStrokeColor="#ffffff"
          nodeBorderRadius={8}
          maskColor="rgba(9, 9, 11, 0.85)"
          className="!bg-[#121215]/95 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl overflow-hidden"
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
        </Panel>

        {/* ── Complete Drawing Layer (Pen, Highlighter, Eraser, Laser Pointer) ── */}
        <DrawingOverlay activeTool={activeToolMode} />
      </ReactFlow>

      {/* ── Success Toast for Synthesized Topologies ── */}
      {synthesizeNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 bg-[#09090b]/95 backdrop-blur-2xl border border-cyan-400/50 rounded-2xl px-5 py-2.5 text-xs text-white shadow-[0_0_30px_rgba(6,182,212,0.35)] font-mono">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>{synthesizeNotification}</span>
          </div>
        </div>
      )}

      {/* ── Enterprise Apple-Style Floating Bottom Dock ── */}
      <BottomToolbar
        activeMode={activeToolMode}
        onSelectMode={setActiveToolMode}
        onToggleAICoPilot={() => setIsAICoPilotOpen((prev) => !prev)}
        isAICoPilotOpen={isAICoPilotOpen}
        onFitView={() => fitView({ padding: 0.25 })}
        quotaDisplay="12/15 Free Limits"
      />

      {/* ── AI Co-Pilot Slide Drawer (Chat, Quota & 100+ Prompt Library) ── */}
      <AICoPilotDrawer
        isOpen={isAICoPilotOpen}
        onClose={() => setIsAICoPilotOpen(false)}
        onGenerateArchitecture={handleGenerateArchitecture}
        onOpenUpgradeModal={onOpenUpgradeModal}
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

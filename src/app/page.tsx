"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  ChevronDown,
  Users,
  Play,
  LogOut,
  MousePointer,
  Hand,
  Shapes,
  Pen,
  Type,
  StickyNote,
  Waypoints,
  Square,
  Circle,
  HelpCircle,
  Zap,
  Shield,
  Layers,
  LayoutGrid,
  FileUp,
  Download,
  Terminal,
  Cpu,
  Clock,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Interactive Workflow Steps ────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    id: "think",
    label: "Think",
    title: "Capture ideas without friction",
    desc: "Brainstorm and drop thoughts, notes, and requirements freely onto an infinite plane with zero clutter.",
    badge: "Infinite Canvas",
    metric: "Zero Latency",
  },
  {
    id: "sketch",
    label: "Sketch",
    title: "Draw and structure flows",
    desc: "Use high-precision vector pen, geometrical shapes, and sticky notes to outline mental models and system flows.",
    badge: "Vector Pen & Shapes",
    metric: "Sub-pixel Precision",
  },
  {
    id: "connect",
    label: "Connect",
    title: "Map relationships & topology",
    desc: "Link components with smart dynamic connectors that automatically route straight, elbow, or curved paths.",
    badge: "Smart Connectors",
    metric: "Auto Routing",
  },
  {
    id: "synthesize",
    label: "Synthesize",
    title: "AI-assisted system intelligence",
    desc: "Ask Board Brain to summarize decisions, tidy layouts, generate diagrams, or convert notes into tasks.",
    badge: "Board Brain AI",
    metric: "Context Aware",
  },
  {
    id: "collaborate",
    label: "Collaborate",
    title: "Execute together in real time",
    desc: "Co-author with your team with live presence cursors, instant room link sharing, and distraction-free presentation.",
    badge: "Live Multiplayer",
    metric: "Global Realtime",
  },
];

// ── Use Cases ────────────────────────────────────────────────────────────────
const USE_CASES = [
  {
    id: "architecture",
    label: "System Architects",
    title: "Microservices and cloud topology design",
    desc: "Design scalable distributed systems, database clusters, ingress gateways, and event-driven architectures with professional clarity.",
    tags: ["Microservices", "Event Queues", "Kubernetes", "API Gateways"],
  },
  {
    id: "engineering",
    label: "Engineering Teams",
    title: "Technical documentation & RFC brainstorms",
    desc: "Review pull requests, blueprint database schemas, debate RFC proposals, and align technical squads without context switching.",
    tags: ["RFC Review", "Schema Modeling", "Sprint Tech Specs", "Data Pipelines"],
  },
  {
    id: "product",
    label: "Product & Strategy",
    title: "Roadmaps, specs, and feature discovery",
    desc: "Align PMs, UX designers, and founders on user journey maps, product requirements, sprint planning, and quarterly milestones.",
    tags: ["User Journeys", "Sprint Roadmaps", "Sticky Brainstorming", "Feature Spec"],
  },
];

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "microservices",
    title: "Microservices & Ingress Gateway",
    category: "Architecture",
    desc: "API gateway, auth cluster, message bus, distributed workers, and cached read-replicas.",
    nodes: 18,
    color: "#7C6CFF",
  },
  {
    id: "kanban",
    title: "Sprint Planning & Roadmap",
    category: "Agile Planning",
    desc: "Backlog stickies, active sprint swimlanes, review checkpoints, and deployment trackers.",
    nodes: 14,
    color: "#FBBF24",
  },
  {
    id: "cloud-edge",
    title: "Cloud Edge & CDN Topology",
    category: "Infrastructure",
    desc: "Edge serverless workers, global CDN caching, origin cluster, and multi-region failovers.",
    nodes: 16,
    color: "#3B82F6",
  },
  {
    id: "decision-flow",
    title: "System Decision Flowchart",
    category: "Flowcharts",
    desc: "Structured flowchart with decision diamonds, process blocks, and branch outcomes.",
    nodes: 12,
    color: "#4ADE80",
  },
];

// ── Pricing Plans ────────────────────────────────────────────────────────────
const PRICING_PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever free",
    desc: "Perfect for individuals and engineers starting to think visually.",
    highlight: false,
    cta: "Start Free",
    href: "/canvas",
    features: [
      "Infinite collaborative canvas",
      "Full shape & vector pen library",
      "Smart dynamic connectors",
      "Export as PNG & SVG",
      "Up to 3 active boards",
      "Basic Board Brain AI (15 prompts/mo)",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "per user / month",
    desc: "For technical leads, architects, and high-velocity product teams.",
    highlight: true,
    badge: "Most Popular",
    cta: "Launch Pro Workspace",
    href: "/billing",
    features: [
      "Unlimited infinite boards",
      "Unlimited Board Brain AI actions",
      "Real-time multiplayer collaboration",
      "Distraction-free Presentation Mode",
      "Priority vector export (4K resolution)",
      "Smart alignment & auto layout clean-up",
      "Private workspace rooms & access control",
    ],
  },
  {
    name: "Team & Enterprise",
    price: "$29",
    period: "per seat / month",
    desc: "For organizations requiring custom integrations and dedicated support.",
    highlight: false,
    cta: "Contact Team",
    href: "/billing",
    features: [
      "Everything in Pro",
      "Dedicated workspace tenancy",
      "SAML / SSO & custom domain mapping",
      "Audit logs & version history rollback",
      "Custom AI system architecture tuning",
      "99.9% uptime SLA & priority support",
    ],
  },
];

// ── FAQ Items ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How is MasmSpace different from generic whiteboard tools?",
    a: "MasmSpace is built specifically for technical thinking, architecture diagramming, and real execution. It provides an infinite 95% usable workspace, contextual controls that hide until needed, intelligent system connectors that stay attached, and Board Brain AI that understands architectural context.",
  },
  {
    q: "Can I use MasmSpace without an account?",
    a: "Yes. You can click 'Launch Canvas' and start diagramming immediately. Your work autosaves to local browser storage. Creating an account unlocks cloud sync across devices and real-time live multiplayer collaboration.",
  },
  {
    q: "How does real-time collaboration work?",
    a: "Every canvas has a unique persistent room link. When you click 'Share', you can send the URL with either 'Can view' or 'Can edit' permissions. You'll see teammate avatars, live cursors, and synced object changes in real time.",
  },
  {
    q: "Can I export my architecture diagrams?",
    a: "Yes. You can export high-resolution PNG snapshots, vector SVGs for documentation, or raw JSON topologies that can be re-imported into any MasmSpace workspace.",
  },
];

export default function LandingPage() {
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [selectedDemoNode, setSelectedDemoNode] = useState<string | null>("gateway");
  const [demoZoom, setDemoZoom] = useState(100);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }: any) => {
        if (data?.session?.user) {
          setCurrentUser(data.session.user);
        }
      });
    } catch {
      // Supabase optional
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F4F4F5] font-sans selection:bg-[#7C6CFF]/20 selection:text-[#7C6CFF]">
      {/* ── 1. GLOBAL SLIM HEADER ── */}
      <header className="sticky top-0 z-50 h-[54px] bg-[#171719]/90 backdrop-blur-md border-b border-[#2A2A2F] select-none">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
              title="MasmSpace"
            >
              <div className="relative w-7 h-7 flex items-center justify-center rounded-md bg-[#1C1C1F] border border-[#2A2A2F]">
                <Image
                  src="/masmspace-logo.png"
                  alt="MasmSpace"
                  width={20}
                  height={20}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#F4F4F5]">
                MasmSpace
              </span>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[#A1A1AA]">
              <a href="#demo" className="hover:text-[#F4F4F5] transition-colors">
                Product Demo
              </a>
              <a href="#features" className="hover:text-[#F4F4F5] transition-colors">
                Features
              </a>
              <a href="#workflow" className="hover:text-[#F4F4F5] transition-colors">
                Workflow
              </a>
              <a href="#use-cases" className="hover:text-[#F4F4F5] transition-colors">
                Use Cases
              </a>
              <a href="#templates" className="hover:text-[#F4F4F5] transition-colors">
                Templates
              </a>
              <a href="#pricing" className="hover:text-[#F4F4F5] transition-colors">
                Pricing
              </a>
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <span className="text-xs text-[#A1A1AA] hidden sm:inline max-w-[140px] truncate">
                {currentUser.email}
              </span>
            ) : (
              <Link
                href="/signin"
                className="text-xs font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors px-2 py-1"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-medium shadow-sm transition-all"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION: Spacious & Dignified ── */}
      <section className="pt-20 pb-14 sm:pt-28 sm:pb-18 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#171719] border border-[#2A2A2F] text-[12px] font-medium text-[#A1A1AA] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          <span>MasmSpace 2.0 · Refined Dark Architecture Canvas</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-[-0.03em] text-[#F4F4F5] leading-[1.08] max-w-4xl mx-auto mb-6">
          Think visually.
          <br />
          <span className="text-[#A1A1AA]">Build intelligently.</span>
        </h1>

        {/* Supporting Message */}
        <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed mb-8">
          A collaborative infinite workspace for ideas, systems, diagrams and execution.
          Built for engineers, system architects, and technical product teams.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/canvas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-[#F4F4F5] text-sm font-medium shadow-[0_8px_30px_rgba(124,108,255,0.25)] transition-all cursor-pointer"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#171719] hover:bg-[#242428] border border-[#2A2A2F] text-sm font-medium text-[#F4F4F5] transition-colors cursor-pointer"
          >
            Explore MasmSpace
          </a>
        </div>

        {/* Key Product Values */}
        <div className="flex items-center justify-center gap-6 text-[12px] text-[#71717A] flex-wrap">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#7C6CFF]" /> Free to start
          </span>
          <span className="w-1 h-1 rounded-full bg-[#2A2A2F]" />
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#7C6CFF]" /> Real-time collaboration
          </span>
          <span className="w-1 h-1 rounded-full bg-[#2A2A2F]" />
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#7C6CFF]" /> Board Brain AI
          </span>
        </div>
      </section>

      {/* ── 3. INTERACTIVE PRODUCT PREVIEW (Section 28) ── */}
      <section id="demo" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="relative rounded-xl border border-[#2A2A2F] bg-[#111113] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Top Simulated Slim Bar */}
          <div className="h-[48px] border-b border-[#2A2A2F] bg-[#171719] px-4 flex items-center justify-between text-xs select-none">
            {/* Left */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2F]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2F]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2F]" />
              </div>
              <div className="h-3 w-px bg-[#2A2A2F] mx-1" />
              <span className="font-semibold text-xs text-[#F4F4F5]">MasmSpace</span>
              <span className="text-[#71717A]">/</span>
              <span className="text-xs text-[#F4F4F5] font-medium">Distributed Microservices Topology</span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-[#A1A1AA] ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                <span>Saved</span>
              </span>
            </div>

            {/* Center Tools Simulation */}
            <div className="hidden md:flex items-center gap-1 bg-[#111113] border border-[#2A2A2F] rounded-md p-0.5">
              <span className="px-2 py-0.5 rounded bg-[#7C6CFF]/20 text-[#7C6CFF] text-[11px] font-medium flex items-center gap-1">
                <MousePointer className="w-3 h-3" /> Select
              </span>
              <span className="p-1 text-[#A1A1AA]"><Hand className="w-3 h-3" /></span>
              <span className="p-1 text-[#A1A1AA]"><Pen className="w-3 h-3" /></span>
              <span className="p-1 text-[#A1A1AA]"><Waypoints className="w-3 h-3" /></span>
              <span className="p-1 text-[#A1A1AA]"><Shapes className="w-3 h-3" /></span>
              <span className="p-1 text-[#FBBF24]"><StickyNote className="w-3 h-3" /></span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#7C6CFF]/15 text-[#7C6CFF] text-[11px] font-medium border border-[#7C6CFF]/30">
                <Sparkles className="w-3 h-3" />
                <span>AI</span>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#7C6CFF] text-white flex items-center justify-center text-[9px] font-bold">
                AR
              </div>
            </div>
          </div>

          {/* Interactive Whiteboard Canvas Canvas Body */}
          <div className="relative h-[480px] w-full bg-[#0D0D0F] overflow-hidden select-none">
            {/* Dark Dot Grid */}
            <div
              className="absolute inset-0 opacity-70 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#18181B 1.2px, transparent 1.2px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Simulated Connectors (SVG Curves) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {/* Connector 1: Gateway -> Auth */}
              <path
                d="M 280 140 C 340 140, 360 90, 420 90"
                fill="none"
                stroke="#7C6CFF"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Connector 2: Gateway -> Orders */}
              <path
                d="M 280 160 C 350 160, 360 230, 430 230"
                fill="none"
                stroke="#7C6CFF"
                strokeWidth="2"
              />
              {/* Connector 3: Orders -> Database */}
              <path
                d="M 590 230 C 650 230, 670 230, 720 230"
                fill="none"
                stroke="#4ADE80"
                strokeWidth="2"
              />
              {/* Arrow Heads */}
              <circle cx="420" cy="90" r="3" fill="#7C6CFF" />
              <circle cx="430" cy="230" r="3" fill="#7C6CFF" />
              <circle cx="720" cy="230" r="3" fill="#4ADE80" />
            </svg>

            {/* Contextual Toolbar floating above selected node */}
            {selectedDemoNode === "gateway" && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-[130px] top-[75px] z-30 flex items-center gap-1.5 px-2 py-1 rounded bg-[#171719] border border-[#2A2A2F] shadow-[0_8px_20px_rgba(0,0,0,0.5)] text-xs text-[#F4F4F5]"
              >
                <span className="w-3 h-3 rounded-full bg-[#7C6CFF]" />
                <span className="text-[11px] font-mono text-[#A1A1AA]">#7C6CFF</span>
                <div className="w-px h-3 bg-[#2A2A2F]" />
                <span className="text-[10px] text-[#A1A1AA]">Solid</span>
                <span className="text-[10px] text-[#A1A1AA]">2px</span>
                <div className="w-px h-3 bg-[#2A2A2F]" />
                <span className="text-[#7C6CFF] text-[10px] font-medium">Inspected</span>
              </motion.div>
            )}

            {/* Node 1: API Gateway (Interactive Click) */}
            <div
              onClick={() => setSelectedDemoNode("gateway")}
              className={`absolute left-[120px] top-[120px] z-20 w-[160px] p-3 rounded-lg bg-[#171719] border transition-all cursor-pointer ${
                selectedDemoNode === "gateway"
                  ? "border-[#7C6CFF] ring-1 ring-[#7C6CFF] shadow-[0_0_20px_rgba(124,108,255,0.15)]"
                  : "border-[#2A2A2F] hover:border-[#7C6CFF]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-[#7C6CFF] uppercase font-semibold">
                  Ingress
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
              </div>
              <div className="text-xs font-semibold text-[#F4F4F5]">Cloud API Gateway</div>
              <div className="text-[10px] text-[#A1A1AA] mt-1 font-mono">10,000 req/sec</div>
            </div>

            {/* Node 2: Auth Service */}
            <div
              onClick={() => setSelectedDemoNode("auth")}
              className={`absolute left-[420px] top-[60px] z-20 w-[160px] p-3 rounded-lg bg-[#171719] border transition-all cursor-pointer ${
                selectedDemoNode === "auth"
                  ? "border-[#7C6CFF] ring-1 ring-[#7C6CFF]"
                  : "border-[#2A2A2F] hover:border-[#7C6CFF]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-[#3B82F6] uppercase font-semibold">
                  Security
                </span>
                <Shield className="w-3 h-3 text-[#3B82F6]" />
              </div>
              <div className="text-xs font-semibold text-[#F4F4F5]">Auth & JWT Cluster</div>
              <div className="text-[10px] text-[#A1A1AA] mt-1 font-mono">Zero Trust · mTLS</div>
            </div>

            {/* Node 3: Order Engine */}
            <div
              onClick={() => setSelectedDemoNode("orders")}
              className={`absolute left-[430px] top-[200px] z-20 w-[160px] p-3 rounded-lg bg-[#171719] border transition-all cursor-pointer ${
                selectedDemoNode === "orders"
                  ? "border-[#7C6CFF] ring-1 ring-[#7C6CFF]"
                  : "border-[#2A2A2F] hover:border-[#7C6CFF]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-[#4ADE80] uppercase font-semibold">
                  Compute
                </span>
                <Cpu className="w-3 h-3 text-[#4ADE80]" />
              </div>
              <div className="text-xs font-semibold text-[#F4F4F5]">Order Processing</div>
              <div className="text-[10px] text-[#A1A1AA] mt-1 font-mono">Event Worker Pool</div>
            </div>

            {/* Node 4: Distributed Database */}
            <div
              onClick={() => setSelectedDemoNode("db")}
              className={`absolute left-[720px] top-[200px] z-20 w-[160px] p-3 rounded-lg bg-[#171719] border transition-all cursor-pointer ${
                selectedDemoNode === "db"
                  ? "border-[#7C6CFF] ring-1 ring-[#7C6CFF]"
                  : "border-[#2A2A2F] hover:border-[#7C6CFF]/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-[#FBBF24] uppercase font-semibold">
                  Persistence
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
              </div>
              <div className="text-xs font-semibold text-[#F4F4F5]">Postgres & Vector DB</div>
              <div className="text-[10px] text-[#A1A1AA] mt-1 font-mono">3x Read Replicas</div>
            </div>

            {/* Sticky Note 1: Soft Yellow */}
            <div className="absolute left-[130px] top-[300px] z-20 w-[160px] p-3 rounded-lg bg-[#FEF08A] text-[#171719] shadow-md -rotate-1">
              <div className="text-[10px] font-mono uppercase font-bold text-[#854D0E] mb-1">
                Architecture Note
              </div>
              <p className="text-xs font-medium leading-snug">
                Rate limiter enforced at edge CDN: 120 req/min per IP address.
              </p>
            </div>

            {/* Sticky Note 2: Soft Blue */}
            <div className="absolute left-[380px] top-[320px] z-20 w-[150px] p-3 rounded-lg bg-[#BAE6FD] text-[#0C4A6E] shadow-md rotate-1">
              <div className="text-[10px] font-mono uppercase font-bold text-[#0369A1] mb-1">
                SLO Goal
              </div>
              <p className="text-xs font-medium leading-snug">
                P99 response latency &lt; 25ms end-to-end.
              </p>
            </div>

            {/* Simulated Collaborator Cursor */}
            <motion.div
              animate={{ x: [490, 520, 500], y: [160, 180, 165] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute z-40 pointer-events-none flex items-start gap-1"
            >
              <MousePointer className="w-3.5 h-3.5 text-[#4ADE80] fill-[#4ADE80]" />
              <span className="px-1.5 py-0.5 rounded bg-[#4ADE80] text-black font-semibold text-[10px] shadow">
                Sarah Chen
              </span>
            </motion.div>

            {/* AI Assistant Command Chip */}
            <div className="absolute right-4 top-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1C1C1F] border border-[#2A2A2F] text-xs shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-[#7C6CFF]" />
              <span className="text-[#A1A1AA]">Board Brain:</span>
              <span className="text-[#F4F4F5] font-medium">Topology validated · No bottlenecks</span>
            </div>

            {/* Bottom-left mini controls */}
            <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1 bg-[#171719] border border-[#2A2A2F] rounded-md px-2 py-1 text-xs font-mono text-[#A1A1AA]">
              <button
                type="button"
                onClick={() => setDemoZoom((prev) => Math.max(50, prev - 10))}
                className="hover:text-white"
              >
                −
              </button>
              <span className="w-10 text-center text-[#F4F4F5]">{demoZoom}%</span>
              <button
                type="button"
                onClick={() => setDemoZoom((prev) => Math.min(200, prev + 10))}
                className="hover:text-white"
              >
                +
              </button>
            </div>

            {/* Bottom-right tiny minimap simulation */}
            <div className="absolute bottom-3 right-3 z-30 w-28 h-16 rounded bg-[#171719] border border-[#2A2A2F] p-1 overflow-hidden hidden sm:block">
              <div className="w-full h-full relative bg-[#111113] rounded">
                <div className="absolute left-2 top-2 w-3 h-2 bg-[#7C6CFF]/60 rounded-xs" />
                <div className="absolute left-8 top-1.5 w-3 h-2 bg-[#3B82F6]/60 rounded-xs" />
                <div className="absolute left-8 top-7 w-3 h-2 bg-[#4ADE80]/60 rounded-xs" />
                <div className="absolute left-14 top-7 w-3 h-2 bg-[#FBBF24]/60 rounded-xs" />
                <div className="absolute inset-1 border border-[#7C6CFF]/40 rounded-xs pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. CORE CAPABILITIES (Section 15, 16, 17, 20) ── */}
      <section id="features" className="py-20 border-t border-[#2A2A2F] bg-[#111113]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
              Infinite Visual Workspace
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mt-2 mb-4">
              Built for serious technical clarity
            </h2>
            <p className="text-sm text-[#A1A1AA] leading-relaxed">
              Every detail is engineered to maximize usable canvas area, eliminate visual clutter,
              and keep tools contextual so you can focus on building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-[#171719] border border-[#2A2A2F]">
              <div className="w-10 h-10 rounded-lg bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 flex items-center justify-center text-[#7C6CFF] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F4F5] mb-2">
                95% Usable Canvas Area
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                No permanent bulky sidebars, heavy floating dashboards, or intrusive inspectors.
                Tools appear contextually above your selected objects.
              </p>
              <div className="text-[11px] font-mono text-[#7C6CFF]">
                Canvas &gt; Content &gt; Tools &gt; Settings
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-[#171719] border border-[#2A2A2F]">
              <div className="w-10 h-10 rounded-lg bg-[#4ADE80]/15 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80] mb-4">
                <Waypoints className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F4F5] mb-2">
                Working Smart Connectors
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                Dynamic connectors that actually link nodes, snap to anchor ports, and update their
                geometry automatically when you move or resize elements.
              </p>
              <div className="text-[11px] font-mono text-[#4ADE80]">
                Straight · Elbow · Bezier Curves
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-[#171719] border border-[#2A2A2F]">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F4F5] mb-2">
                Board Brain AI
              </h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                Compact command palette summoned by ⌘K. Summarize complex diagrams, clean up overlapping
                layouts, or synthesize microservice topologies on demand.
              </p>
              <div className="text-[11px] font-mono text-[#3B82F6]">
                Context-aware Diagram Synthesis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. BUILDER WORKFLOW: Think -> Sketch -> Connect -> Build ── */}
      <section id="workflow" className="py-20 border-t border-[#2A2A2F] bg-[#0D0D0F]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
              Frictionless Thinking
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mt-2 mb-4">
              From raw concept to architectural execution
            </h2>
          </div>

          {/* Workflow Step Selector Tabs */}
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
            {WORKFLOW_STEPS.map((step, idx) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveWorkflow(idx)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activeWorkflow === idx
                    ? "bg-[#7C6CFF] text-white"
                    : "bg-[#171719] text-[#A1A1AA] hover:text-[#F4F4F5] border border-[#2A2A2F]"
                }`}
              >
                <span>{step.label}</span>
              </button>
            ))}
          </div>

          {/* Active Step Showcase Card */}
          <div className="p-8 rounded-xl bg-[#171719] border border-[#2A2A2F] flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-md">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#7C6CFF]/15 text-[#7C6CFF] border border-[#7C6CFF]/30">
                {WORKFLOW_STEPS[activeWorkflow].badge}
              </span>
              <h3 className="text-2xl font-semibold text-[#F4F4F5] mt-3 mb-3">
                {WORKFLOW_STEPS[activeWorkflow].title}
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
                {WORKFLOW_STEPS[activeWorkflow].desc}
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/canvas"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-white text-xs font-medium transition-all"
                >
                  <span>Try in Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Visual simulation card */}
            <div className="w-full md:w-80 p-5 rounded-lg bg-[#111113] border border-[#2A2A2F] font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#2A2A2F] pb-2 mb-3 text-[11px] text-[#71717A]">
                <span>Status: Optimal</span>
                <span className="text-[#4ADE80]">{WORKFLOW_STEPS[activeWorkflow].metric}</span>
              </div>
              <div className="space-y-2 text-[#A1A1AA] text-[11px]">
                <div className="flex items-center justify-between">
                  <span>Input Mode:</span>
                  <span className="text-[#F4F4F5]">Low Friction</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Autosave:</span>
                  <span className="text-[#4ADE80]">Continuous Local + Cloud</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shortcuts:</span>
                  <span className="text-[#7C6CFF]">V · H · S · T · R · C</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. USE CASES (Section 25) ── */}
      <section id="use-cases" className="py-20 border-t border-[#2A2A2F] bg-[#111113]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
              Tailored for Builders
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mt-2 mb-4">
              Where technical decisions take shape
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {USE_CASES.map((uc) => (
              <div
                key={uc.id}
                className="p-6 rounded-xl bg-[#171719] border border-[#2A2A2F] flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-mono text-[#7C6CFF]">{uc.label}</span>
                  <h3 className="text-base font-semibold text-[#F4F4F5] mt-1 mb-2">
                    {uc.title}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
                    {uc.desc}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#2A2A2F]">
                  {uc.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111113] text-[#A1A1AA] border border-[#2A2A2F]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TEMPLATES SHOWCASE (Section 25) ── */}
      <section id="templates" className="py-20 border-t border-[#2A2A2F] bg-[#0D0D0F]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
                Starter Topologies
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mt-2">
                Launch with ready-to-use blueprints
              </h2>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-xs text-[#7C6CFF] hover:text-[#635BFF] font-medium"
            >
              <span>Explore all templates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl) => (
              <Link
                key={tmpl.id}
                href="/canvas"
                className="p-5 rounded-xl bg-[#171719] border border-[#2A2A2F] hover:border-[#7C6CFF] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#71717A] mb-2">
                    <span>{tmpl.category}</span>
                    <span>{tmpl.nodes} nodes</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#F4F4F5] group-hover:text-[#7C6CFF] transition-colors mb-2">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {tmpl.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2A2A2F] flex items-center justify-between text-[11px] text-[#7C6CFF] font-medium">
                  <span>Open template</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PRICING ── */}
      <section id="pricing" className="py-20 border-t border-[#2A2A2F] bg-[#111113]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
              Simple & Transparent
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mt-2 mb-4">
              Predictable pricing for creators and teams
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl flex flex-col justify-between relative ${
                  plan.highlight
                    ? "bg-[#171719] border-2 border-[#7C6CFF] shadow-[0_8px_30px_rgba(124,108,255,0.2)]"
                    : "bg-[#171719] border border-[#2A2A2F]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#7C6CFF] text-white">
                    {plan.badge}
                  </span>
                )}
                <div>
                  <div className="text-base font-semibold text-[#F4F4F5] mb-1">{plan.name}</div>
                  <p className="text-xs text-[#A1A1AA] mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-3xl font-bold text-[#F4F4F5]">{plan.price}</span>
                    <span className="text-xs text-[#71717A]">{plan.period}</span>
                  </div>

                  <ul className="space-y-2.5 mb-6 text-xs text-[#A1A1AA]">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#7C6CFF] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={plan.href}
                  className={`w-full py-2.5 rounded-md text-xs font-medium text-center transition-all cursor-pointer ${
                    plan.highlight
                      ? "bg-[#7C6CFF] hover:bg-[#635BFF] text-white shadow-md"
                      : "bg-[#1C1C1F] hover:bg-[#242428] border border-[#2A2A2F] text-[#F4F4F5]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ── */}
      <section className="py-20 border-t border-[#2A2A2F] bg-[#0D0D0F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#7C6CFF]">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-[#F4F4F5] mt-2">
              Everything you need to know
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={faq.q}
                className="border border-[#2A2A2F] rounded-lg bg-[#171719] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-[#F4F4F5]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#71717A] transition-transform ${
                      openFaq === idx ? "rotate-180 text-[#7C6CFF]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#A1A1AA] leading-relaxed border-t border-[#2A2A2F] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA ── */}
      <section className="py-20 border-t border-[#2A2A2F] bg-[#111113] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#F4F4F5] mb-4">
            Start thinking on MasmSpace today.
          </h2>
          <p className="text-sm text-[#A1A1AA] leading-relaxed mb-8 max-w-xl mx-auto">
            Experience a collaborative infinite workspace with maximum usable area, working connectors,
            and contextual intelligence.
          </p>
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#7C6CFF] hover:bg-[#635BFF] text-[#F4F4F5] text-sm font-medium shadow-[0_8px_30px_rgba(124,108,255,0.3)] transition-all cursor-pointer"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── 11. REFINED DARK FOOTER ── */}
      <footer className="border-t border-[#2A2A2F] bg-[#0D0D0F] py-12 text-xs text-[#71717A] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-[#171719] border border-[#2A2A2F] flex items-center justify-center">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={14}
                height={14}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-xs text-[#F4F4F5]">MasmSpace</span>
            <span>· Built for visual thinking and system architecture</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#F4F4F5] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#F4F4F5] transition-colors">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-[#F4F4F5] transition-colors">
              Support
            </Link>
            <Link href="/shortcuts" className="hover:text-[#F4F4F5] transition-colors">
              Shortcuts
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
  Layers,
  Users,
  Play,
  LogOut,
  MousePointer,
  Hand,
  Shapes,
  Pen,
  Type,
  StickyNote,
  Code2,
  Cpu,
  ShieldCheck,
  Download,
  LayoutTemplate,
  Workflow,
  Wand2,
  FileText,
  Boxes,
  Compass,
  Zap,
  Lock,
  Cloud,
  Terminal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ── Interactive Workflow Steps ────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  {
    id: "think",
    label: "Think",
    title: "Capture ideas without friction",
    desc: "Dump thoughts, notes, and early questions onto an open canvas. No rigid pages or forced structure.",
    badge: "Infinite Canvas",
    previewType: "notes",
  },
  {
    id: "sketch",
    label: "Sketch",
    title: "Draw and shape your concept",
    desc: "Use high-precision pen, shapes, and sticky notes to outline flows, wireframes, and mental models.",
    badge: "Vector Shapes & Pen",
    previewType: "sketch",
  },
  {
    id: "connect",
    label: "Connect",
    title: "Map relationships & architecture",
    desc: "Link concepts with smart directional connectors. Watch disparate ideas form a coherent system.",
    badge: "Smart Connectors",
    previewType: "diagram",
  },
  {
    id: "build",
    label: "Build",
    title: "From visual model to execution",
    desc: "Attach architecture specifications, runnable code blocks, and data flows directly on the canvas.",
    badge: "Technical Workflows",
    previewType: "code",
  },
  {
    id: "collaborate",
    label: "Collaborate",
    title: "Work together with zero latency",
    desc: "Co-create with your team in real time. Share a live room link with presence cursors and instant sync.",
    badge: "Live Multiplayer",
    previewType: "collab",
  },
];

// ── Use Cases ────────────────────────────────────────────────────────────────
const USE_CASES = [
  {
    id: "product",
    label: "Product Teams",
    title: "Roadmaps, specs, and feature discovery in one place",
    desc: "Align PMs, designers, and engineers on user journeys, PRDs, and release milestones without switching between five different tools.",
    highlights: ["User story mapping", "Sprint planning stickies", "Interactive wireframes"],
  },
  {
    id: "engineering",
    label: "Engineering",
    title: "System architecture and cloud topology modeling",
    desc: "Map microservices, database clusters, API gateways, and asynchronous event queues with clear technical hierarchy.",
    highlights: ["Microservices blueprints", "Live code execution", "Data schema mapping"],
  },
  {
    id: "research",
    label: "Research & Strategy",
    title: "Synthesize customer interviews and competitive analysis",
    desc: "Group qualitative findings with AI assistance, discover common themes, and translate research insights into actionable next steps.",
    highlights: ["Affinity clustering", "AI synthesis", "Strategic decision trees"],
  },
  {
    id: "design",
    label: "Design",
    title: "Brainstorming and visual concept exploration",
    desc: "Freehand sketching, moodboarding, and layout experiments that bridge the gap between rough sketches and polished design.",
    highlights: ["Freehand sketching", "Moodboards & assets", "Design critique sessions"],
  },
  {
    id: "startups",
    label: "Startups & Founders",
    title: "Pitch decks, business models, and launch planning",
    desc: "Draft pitch architectures, brainstorm product-market fit, and track execution milestones on an unbounded board.",
    highlights: ["Lean canvas modeling", "Go-to-market roadmaps", "Investor presentations"],
  },
];

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "microservices",
    title: "Microservices Architecture",
    category: "Architecture",
    desc: "API gateway, auth worker, database clusters, and caching topology.",
    nodes: 8,
  },
  {
    id: "product-roadmap",
    title: "Quarterly Product Roadmap",
    category: "Product",
    desc: "Categorized swimlanes for Now, Next, and Later feature epics.",
    nodes: 12,
  },
  {
    id: "brainstorm",
    title: "Team Brainstorm & Synthesis",
    category: "Ideation",
    desc: "Color-coded sticky notes with AI affinity grouping and voting.",
    nodes: 15,
  },
  {
    id: "flowchart",
    title: "User Onboarding Decision Flow",
    category: "Diagrams",
    desc: "Step-by-step logic nodes with conditional branches and error recovery.",
    nodes: 9,
  },
];

export default function LandingPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>("think");
  const [activeUseCase, setActiveUseCase] = useState<string>("product");
  const [proBillingCycle, setProBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Track window scroll for subtle navbar transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Supabase authenticated user
  useEffect(() => {
    let isMounted = true;
    async function checkUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && isMounted) {
          setCurrentUser({
            email: user.email,
            name:
              (user.user_metadata?.full_name as string) ||
              (user.user_metadata?.name as string) ||
              user.email?.split("@")[0],
          });
          return;
        }
      } catch {}

      if (typeof window !== "undefined" && isMounted) {
        try {
          const stored = localStorage.getItem("prathomix_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed) setCurrentUser(parsed);
          }
        } catch {}
      }
    }

    checkUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("prathomix_current_user");
        localStorage.removeItem("prathomix_user_avatar");
      }
      setCurrentUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
      setCurrentUser(null);
    } finally {
      setIsSigningOut(false);
    }
  };

  const activeWorkflowItem =
    WORKFLOW_STEPS.find((w) => w.id === activeWorkflow) || WORKFLOW_STEPS[0];
  const activeUseCaseItem =
    USE_CASES.find((u) => u.id === activeUseCase) || USE_CASES[0];

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#18181B] selection:bg-[#635BFF]/15 selection:text-[#635BFF] font-sans antialiased">
      {/* ── 1. SLIM STICKY NAVIGATION ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          isScrolled
            ? "bg-[#FAFAF9]/90 backdrop-blur-md border-b border-[#E4E4E7] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Logo & Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-85"
            title="MasmSpace Homepage"
          >
            <div className="relative w-7 h-6 flex items-center justify-center shrink-0">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={28}
                height={22}
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#18181B]">
              MasmSpace
            </span>
          </Link>

          {/* Center: Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-[#52525B]">
            <a
              href="#overview"
              className="hover:text-[#18181B] transition-colors"
            >
              Why MasmSpace
            </a>
            <a
              href="#features"
              className="hover:text-[#18181B] transition-colors"
            >
              Features
            </a>
            <a
              href="#builders"
              className="hover:text-[#18181B] transition-colors"
            >
              For Builders
            </a>
            <a
              href="#use-cases"
              className="hover:text-[#18181B] transition-colors"
            >
              Use Cases
            </a>
            <a
              href="#pricing"
              className="hover:text-[#18181B] transition-colors"
            >
              Pricing
            </a>
          </nav>

          {/* Right: Auth / CTA */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#52525B] hidden sm:inline max-w-[120px] truncate">
                  {currentUser.name || currentUser.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  title="Sign Out"
                  className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/signin"
                className="text-[13px] font-medium text-[#52525B] hover:text-[#18181B] transition-colors px-2 py-1"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/canvas"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#635BFF] hover:bg-[#5248E5] text-white text-[13px] font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] font-medium text-[#52525B] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" />
          <span>The Visual Workspace for Thinking & Building</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-[-0.03em] text-[#18181B] leading-[1.08] max-w-4xl mx-auto mb-6">
          Think Visually.
          <br />
          <span className="text-[#52525B]">Build Faster.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-[#52525B] max-w-2xl mx-auto leading-relaxed mb-8">
          MasmSpace is an infinite collaborative workspace for brainstorming,
          diagramming, planning, building, and turning complex ideas into reality.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/canvas"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Launch Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#showcase"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-sm font-medium text-[#18181B] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Trust & Product Metadata */}
        <div className="flex items-center justify-center gap-6 text-[12px] text-[#71717A]">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Free to start
          </span>
          <span className="w-1 h-1 rounded-full bg-[#E4E4E7]" />
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Real-time collaboration
          </span>
          <span className="w-1 h-1 rounded-full bg-[#E4E4E7] hidden sm:inline" />
          <span className="hidden sm:flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#635BFF]" /> AI board intelligence
          </span>
        </div>
      </section>

      {/* ── 3. HERO PRODUCT VISUAL ── */}
      <section id="showcase" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="relative rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden">
          {/* Top Mockup Chrome: Floating Bar simulation */}
          <div className="h-11 border-b border-[#E4E4E7] bg-[#FAFAF9]/80 px-4 flex items-center justify-between text-xs select-none">
            {/* Left: Window controls & board title */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4E4E7]" />
              </div>
              <div className="h-3.5 w-px bg-[#E4E4E7] mx-1" />
              <div className="flex items-center gap-1.5 font-medium text-[#18181B]">
                <div className="w-4 h-4 rounded bg-[#635BFF] text-white text-[9px] font-bold flex items-center justify-center">
                  M
                </div>
                <span>Product Launch Roadmap</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" title="Saved" />
              </div>
            </div>

            {/* Center: Compact tool switcher simulation */}
            <div className="hidden md:flex items-center gap-1 bg-white border border-[#E4E4E7] px-1 py-0.5 rounded-lg shadow-sm">
              <span className="px-2 py-0.5 rounded bg-[#635BFF]/10 text-[#635BFF] font-semibold text-[11px] flex items-center gap-1">
                <MousePointer className="w-3 h-3" /> Select
              </span>
              <span className="p-1 text-[#71717A]"><Hand className="w-3 h-3" /></span>
              <span className="p-1 text-[#71717A]"><Shapes className="w-3 h-3" /></span>
              <span className="p-1 text-[#71717A]"><Pen className="w-3 h-3" /></span>
              <span className="p-1 text-[#71717A]"><Type className="w-3 h-3" /></span>
              <span className="p-1 text-[#71717A]"><StickyNote className="w-3 h-3" /></span>
            </div>

            {/* Right: Presence Avatars */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 border border-white text-indigo-700 text-[9px] font-bold flex items-center justify-center">
                  SK
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-100 border border-white text-emerald-700 text-[9px] font-bold flex items-center justify-center">
                  AP
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#635BFF] text-white font-medium text-[11px]">
                Share
              </span>
            </div>
          </div>

          {/* Canvas Canvas Simulation Area */}
          <div className="relative h-[380px] sm:h-[480px] bg-[#FAFAF9] overflow-hidden select-none">
            {/* Subtle Dot Grid */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#A1A1AA 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Simulated 48px Left Rail */}
            <div className="absolute top-4 left-4 z-10 w-9 bg-white border border-[#E4E4E7] rounded-xl shadow-sm py-2 flex flex-col items-center gap-2 text-[#71717A]">
              <span className="p-1 rounded text-[#635BFF] bg-[#635BFF]/10"><Boxes className="w-3.5 h-3.5" /></span>
              <span className="p-1"><Sparkles className="w-3.5 h-3.5" /></span>
              <span className="p-1"><LayoutTemplate className="w-3.5 h-3.5" /></span>
            </div>

            {/* Simulated Connected Whiteboard Elements */}
            <div className="absolute inset-0 p-6 sm:p-12 flex items-center justify-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl w-full relative">
                {/* 1. Research Phase Note */}
                <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] shadow-sm transform -rotate-1 hover:rotate-0 transition-transform">
                  <div className="text-[10px] font-mono text-[#92400E] uppercase mb-1">
                    01 · Research
                  </div>
                  <h4 className="text-xs font-semibold text-[#78350F] mb-1">
                    Customer Interviews
                  </h4>
                  <p className="text-[11px] text-[#92400E] leading-snug">
                    Synthesized 24 calls: need a single visual canvas over scattered docs.
                  </p>
                </div>

                {/* 2. Architecture Spec Node */}
                <div className="p-4 rounded-xl bg-white border border-[#E4E4E7] shadow-sm relative group">
                  <div className="text-[10px] font-mono text-[#635BFF] uppercase mb-1 flex items-center gap-1">
                    <Workflow className="w-2.5 h-2.5" /> 02 · Systems
                  </div>
                  <h4 className="text-xs font-semibold text-[#18181B] mb-1">
                    Ingress & Vector RAG
                  </h4>
                  <p className="text-[11px] text-[#52525B] leading-snug">
                    Real-time state synchronization via WebSocket & Supabase.
                  </p>
                  {/* Selection indicator pill */}
                  <span className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded bg-[#635BFF] text-white text-[9px] font-mono font-medium">
                    Alex K.
                  </span>
                </div>

                {/* 3. Product Action Sticky */}
                <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] shadow-sm transform rotate-1 hover:rotate-0 transition-transform">
                  <div className="text-[10px] font-mono text-[#166534] uppercase mb-1">
                    03 · Product
                  </div>
                  <h4 className="text-xs font-semibold text-[#14532D] mb-1">
                    Infinite Canvas V2
                  </h4>
                  <p className="text-[11px] text-[#166534] leading-snug">
                    Sub-20ms rendering with React Flow and WebAssembly.
                  </p>
                </div>

                {/* 4. Launch Ready Card */}
                <div className="p-4 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] shadow-sm">
                  <div className="text-[10px] font-mono text-[#075985] uppercase mb-1">
                    04 · Launch
                  </div>
                  <h4 className="text-xs font-semibold text-[#0C4A6E] mb-1">
                    Public Release
                  </h4>
                  <p className="text-[11px] text-[#075985] leading-snug">
                    Shareable live room links with presentation mode.
                  </p>
                </div>

                {/* Live Collaborator Cursor 1 */}
                <div className="absolute -top-4 left-1/4 pointer-events-none flex items-center gap-1 text-[#635BFF]">
                  <MousePointer className="w-3.5 h-3.5 fill-[#635BFF]" />
                  <span className="px-1.5 py-0.5 rounded bg-[#635BFF] text-white text-[9px] font-medium font-mono">
                    Sarah P. (editing)
                  </span>
                </div>

                {/* Live Collaborator Cursor 2 */}
                <div className="absolute bottom-2 right-1/4 pointer-events-none flex items-center gap-1 text-emerald-600">
                  <MousePointer className="w-3.5 h-3.5 fill-emerald-600" />
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-medium font-mono">
                    Alex K.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Zoom Indicator simulation */}
            <div className="absolute bottom-3 left-4 bg-white border border-[#E4E4E7] px-2 py-1 rounded-lg shadow-sm text-[11px] font-mono text-[#71717A] flex items-center gap-2">
              <span>-</span>
              <span>100%</span>
              <span>+</span>
            </div>

            {/* Bottom-Right AI Assistant Pill */}
            <div className="absolute bottom-3 right-4 bg-white border border-[#E4E4E7] px-3 py-1.5 rounded-xl shadow-sm text-xs font-medium text-[#18181B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#635BFF]" />
              <span>Ask AI: &quot;Organize board layout&quot;</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. PRODUCT INTERACTION SEQUENCE ── */}
      <section className="py-16 bg-white border-y border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
              The Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181B]">
              From first spark to completed system
            </h2>
          </div>

          {/* Interactive Steps Bar */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8 flex-wrap">
            {WORKFLOW_STEPS.map((step) => {
              const isActive = activeWorkflow === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveWorkflow(step.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#635BFF] text-white shadow-sm"
                      : "bg-[#F4F4F5] text-[#52525B] hover:text-[#18181B] hover:bg-[#E4E4E7]"
                  }`}
                >
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* Step Detail Display */}
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#635BFF]/10 text-[#635BFF] text-[11px] font-mono font-medium mb-3">
              {activeWorkflowItem.badge}
            </span>
            <h3 className="text-lg font-semibold text-[#18181B] mb-2">
              {activeWorkflowItem.title}
            </h3>
            <p className="text-sm text-[#52525B] max-w-xl mx-auto leading-relaxed">
              {activeWorkflowItem.desc}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. PROBLEM & POSITIONING SECTION ── */}
      <section id="overview" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-[#71717A] block mb-2 font-semibold">
            Unified Workspace
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] mb-4">
            Your ideas shouldn&apos;t live in five different tools.
          </h2>
          <p className="text-base text-[#52525B] leading-relaxed">
            Switching between note-taking apps, diagram editors, chat threads, and
            task trackers fractures context. MasmSpace connects your entire thinking
            process onto one infinite canvas.
          </p>
        </div>

        {/* Visual Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Traditional Workflow */}
          <div className="p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm">
            <div className="text-xs font-mono uppercase tracking-wider text-[#71717A] mb-4 font-semibold">
              Traditional Fragmented Stack
            </div>
            <div className="space-y-3 text-sm text-[#52525B]">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F4F5]">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span>Notes buried across scattered docs</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F4F5]">
                <Workflow className="w-4 h-4 text-zinc-400" />
                <span>Diagrams trapped in rigid export images</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F4F4F5]">
                <Boxes className="w-4 h-4 text-zinc-400" />
                <span>Context lost between meetings and task boards</span>
              </div>
            </div>
          </div>

          {/* MasmSpace Unified Workflow */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#635BFF]/30 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#635BFF]/5 rounded-bl-full pointer-events-none" />
            <div className="text-xs font-mono uppercase tracking-wider text-[#635BFF] mb-4 font-semibold">
              MasmSpace Unified Canvas
            </div>
            <div className="space-y-3 text-sm text-[#18181B]">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#635BFF]/5">
                <Check className="w-4 h-4 text-[#635BFF]" />
                <span className="font-medium">Infinite visual brainstorming & stickies</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#635BFF]/5">
                <Check className="w-4 h-4 text-[#635BFF]" />
                <span className="font-medium">System architecture & flowchart diagramming</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#635BFF]/5">
                <Check className="w-4 h-4 text-[#635BFF]" />
                <span className="font-medium">Integrated AI that understands your board</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CORE CAPABILITIES (EDITORIAL 6) ── */}
      <section id="features" className="py-20 bg-white border-t border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B]">
              Designed for serious visual work.
            </h2>
          </div>

          {/* 6 Editorial Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 01 Infinite Canvas */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  01 · Spatial Freedom
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Infinite Canvas
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Think without arbitrary boundaries. Zoom smoothly from a 10,000-foot
                  strategic view down to minute implementation details.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center text-xs text-[#71717A]">
                Unbounded 60 FPS graph engine
              </div>
            </div>

            {/* 02 Real-Time Collaboration */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  02 · Team Alignment
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Multiplayer Collaboration
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Work together on the same board with sub-50ms sync latency. Live
                  presence cursors, object locking, and instant room sharing.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-[#18181B]">Zero-conflict live room sync</span>
              </div>
            </div>

            {/* 03 AI Board Intelligence */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  03 · Ambient AI
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Board Brain Intelligence
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Turn chaotic brainstorm notes into structured affinity maps,
                  summarize key decisions, and synthesize architecture diagrams.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center text-xs text-[#635BFF] font-medium">
                Cmd+K Spotlight Command Palette
              </div>
            </div>

            {/* 04 Powerful Diagramming */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  04 · Visual Modeling
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Precision Diagramming
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Microservice containers, relational database cylinders, cloud gateways,
                  and smart orthogonal arrows with 8px alignment snapping.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center text-xs text-[#52525B]">
                Smart connection snap handles
              </div>
            </div>

            {/* 05 Builder Tools */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  05 · Technical Execution
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Builder Workflows
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Link architecture nodes directly to code snippets, API endpoints,
                  and document pages. Move from high-level design to execution.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center text-xs text-[#52525B]">
                In-browser Code Studio & specs
              </div>
            </div>

            {/* 06 Present & Share */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/40 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono text-[#71717A] block mb-3 font-semibold">
                  06 · Presentation
                </span>
                <h3 className="text-base font-semibold text-[#18181B] mb-2">
                  Present & Export
                </h3>
                <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                  Turn your whiteboard into a focused presentation deck with one click.
                  Export crisp vector SVGs, high-res PNGs, and JSON files.
                </p>
              </div>
              <div className="h-28 rounded-xl bg-white border border-[#E4E4E7] p-3 flex items-center justify-center text-xs text-[#52525B]">
                Fullscreen presentation HUD
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. AI EXPERIENCE SHOWCASE ── */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E4E4E7] shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
              AI That Understands Your Board
            </span>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181B] mb-3">
              Not a generic chatbot. A spatial collaborator.
            </h2>
            <p className="text-sm text-[#52525B] leading-relaxed">
              MasmSpace AI reads the topology of your canvas. It understands which
              notes are related, identifies logical gaps in your system design, and
              automatically tidies your board.
            </p>
          </div>

          {/* AI Interactive Demo Simulation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="text-[11px] font-mono text-[#71717A] mb-1">Prompt</div>
              <div className="text-xs font-medium text-[#18181B] mb-3">
                &quot;Organize these 12 scattered feature ideas into themes.&quot;
              </div>
              <div className="text-[11px] text-[#52525B]">
                AI clusters sticky notes into Acquisition, Retention, and Core Infra categories.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="text-[11px] font-mono text-[#71717A] mb-1">Prompt</div>
              <div className="text-xs font-medium text-[#18181B] mb-3">
                &quot;Generate event-driven payment architecture.&quot;
              </div>
              <div className="text-[11px] text-[#52525B]">
                Instantly generates Ingress Router, Stripe Webhook Worker, and Postgres DB nodes.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="text-[11px] font-mono text-[#71717A] mb-1">Prompt</div>
              <div className="text-xs font-medium text-[#18181B] mb-3">
                &quot;Extract action items from this workshop.&quot;
              </div>
              <div className="text-[11px] text-[#52525B]">
                Transforms discussion stickies into an actionable numbered task checklist.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FOR BUILDERS SECTION ── */}
      <section id="builders" className="py-20 bg-white border-t border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
              For Builders & Engineers
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] mb-3">
              From visual thinking to technical execution.
            </h2>
            <p className="text-base text-[#52525B] leading-relaxed">
              Design the architecture, connect dependencies, review data schemas,
              and write implementation code directly inside the workspace.
            </p>
          </div>

          {/* Builder Step Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mb-3">
                <Shapes className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-1">1. Model System</h4>
              <p className="text-xs text-[#52525B]">
                Place microservices, caching layers, and database clusters with clean connections.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-1">2. Attach Specs</h4>
              <p className="text-xs text-[#52525B]">
                Embed OpenAPI endpoints, SQL schemas, and environment configs directly on nodes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                <Terminal className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-1">3. Run & Validate</h4>
              <p className="text-xs text-[#52525B]">
                Execute code in browser via WebAssembly with multi-language runner support.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAFAF9] border border-[#E4E4E7]">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-[#18181B] mb-1">4. Review with Team</h4>
              <p className="text-xs text-[#52525B]">
                Walk through architecture decisions asynchronously or during live sprint reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. USE CASES SECTION ── */}
      <section id="use-cases" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
            Use Cases
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] mb-3">
            One workspace for every role.
          </h2>
          <p className="text-base text-[#52525B]">
            Whether you are mapping an engineering system, synthesizing user research,
            or running a product brainstorm.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {USE_CASES.map((uc) => {
            const isActive = activeUseCase === uc.id;
            return (
              <button
                key={uc.id}
                type="button"
                onClick={() => setActiveUseCase(uc.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#18181B] text-white shadow-sm"
                    : "bg-white text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7]"
                }`}
              >
                {uc.label}
              </button>
            );
          })}
        </div>

        {/* Active Use Case Card */}
        <div className="p-8 rounded-3xl bg-white border border-[#E4E4E7] shadow-sm max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">
            {activeUseCaseItem.title}
          </h3>
          <p className="text-sm text-[#52525B] leading-relaxed mb-6">
            {activeUseCaseItem.desc}
          </p>
          <div className="flex flex-wrap gap-2">
            {activeUseCaseItem.highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F4F4F5] text-[#18181B] text-xs font-medium"
              >
                <Check className="w-3.5 h-3.5 text-[#635BFF]" />
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. TEMPLATES SHOWCASE ── */}
      <section className="py-20 bg-white border-y border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
                Templates
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-[#18181B]">
                Start with an idea. Not a blank canvas.
              </h2>
            </div>
            <Link
              href="/canvas"
              className="mt-4 sm:mt-0 text-xs font-medium text-[#635BFF] hover:underline flex items-center gap-1"
            >
              Browse all templates in canvas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl) => (
              <Link
                key={tmpl.id}
                href="/canvas"
                className="p-5 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] hover:border-[#635BFF]/50 hover:bg-[#635BFF]/5 transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#71717A] tracking-wider block mb-2">
                    {tmpl.category}
                  </span>
                  <h4 className="text-sm font-semibold text-[#18181B] group-hover:text-[#635BFF] transition-colors mb-1.5">
                    {tmpl.title}
                  </h4>
                  <p className="text-xs text-[#52525B] leading-relaxed mb-4">
                    {tmpl.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-3 border-t border-[#E4E4E7]">
                  <span>{tmpl.nodes} starter blocks</span>
                  <span className="text-[#635BFF] font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                    Use →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. SECURITY & RELIABILITY ── */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
          <div className="p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm">
            <Cloud className="w-5 h-5 text-[#635BFF] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#18181B] mb-1">Continuous Cloud Autosave</h4>
            <p className="text-xs text-[#52525B]">
              Every stroke and node change is synced instantly to persistent Supabase storage.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm">
            <Lock className="w-5 h-5 text-[#635BFF] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#18181B] mb-1">Workspace Permissions</h4>
            <p className="text-xs text-[#52525B]">
              Share read-only view links or invite collaborators with full edit authority.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm">
            <Download className="w-5 h-5 text-[#635BFF] mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-[#18181B] mb-1">Universal Export</h4>
            <p className="text-xs text-[#52525B]">
              Full data ownership: export crisp vector SVGs, high-res PNGs, and JSON graphs.
            </p>
          </div>
        </div>
      </section>

      {/* ── 12. PRICING SECTION ── */}
      <section id="pricing" className="py-20 bg-white border-t border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#635BFF] block mb-2 font-semibold">
              Pricing Plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18181B] mb-3">
              Simple, transparent pricing.
            </h2>
            <p className="text-base text-[#52525B]">
              Start free. Upgrade when you need unlimited boards, AI intelligence, and team collaboration.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center gap-1 p-1 mt-6 rounded-xl bg-[#F4F4F5] border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => setProBillingCycle("monthly")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  proBillingCycle === "monthly"
                    ? "bg-white text-[#18181B] shadow-sm"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setProBillingCycle("yearly")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  proBillingCycle === "yearly"
                    ? "bg-white text-[#18181B] shadow-sm"
                    : "text-[#52525B] hover:text-[#18181B]"
                }`}
              >
                <span>Yearly</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                  Save 18%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {/* Free Plan */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] flex flex-col justify-between">
              <div>
                <h4 className="text-base font-semibold text-[#18181B] mb-1">Free</h4>
                <p className="text-xs text-[#52525B] mb-4">
                  For exploring ideas on an infinite visual whiteboard.
                </p>
                <div className="text-3xl font-semibold text-[#18181B] mb-6">
                  $0{" "}
                  <span className="text-xs font-normal text-[#71717A]">/ forever</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#52525B] mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> 3 active boards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Infinite canvas & shapes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Standard PNG export
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Community templates
                  </li>
                </ul>
              </div>
              <Link
                href="/canvas"
                className="w-full py-2 rounded-xl bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-medium text-[#18181B] text-center shadow-sm transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Pro Plan (Highlighted) */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#635BFF] shadow-lg relative flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#635BFF] text-white text-[10px] font-semibold uppercase tracking-wider">
                Recommended
              </span>
              <div>
                <h4 className="text-base font-semibold text-[#18181B] mb-1">Pro</h4>
                <p className="text-xs text-[#52525B] mb-4">
                  For individual builders and power thinkers.
                </p>
                <div className="text-3xl font-semibold text-[#18181B] mb-6">
                  {proBillingCycle === "yearly" ? "$49" : "$5"}{" "}
                  <span className="text-xs font-normal text-[#71717A]">
                    {proBillingCycle === "yearly" ? "/ year" : "/ month"}
                  </span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#52525B] mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" />{" "}
                    <strong>Unlimited</strong> boards
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> AI Board Brain & copilot
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Live multiplayer collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Code Studio & execution
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> High-resolution exports
                  </li>
                </ul>
              </div>
              <Link
                href={`/canvas?plan=${proBillingCycle}`}
                className="w-full py-2 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-xs font-medium text-white text-center shadow-sm transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-[#E4E4E7] flex flex-col justify-between">
              <div>
                <h4 className="text-base font-semibold text-[#18181B] mb-1">Enterprise</h4>
                <p className="text-xs text-[#52525B] mb-4">
                  For organizations requiring custom security and SLAs.
                </p>
                <div className="text-3xl font-semibold text-[#18181B] mb-6">
                  Custom
                </div>
                <ul className="space-y-2.5 text-xs text-[#52525B] mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Dedicated cloud instance
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> SAML SSO & audit logs
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> Custom AI model endpoints
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#635BFF]" /> 99.9% uptime SLA
                  </li>
                </ul>
              </div>
              <a
                href="mailto:contact@prathomix.tech?subject=MasmSpace%20Enterprise%20Inquiry"
                className="w-full py-2 rounded-xl bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-xs font-medium text-[#18181B] text-center shadow-sm transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 13. FAQ ACCORDION ── */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-[#71717A] block mb-2 font-semibold">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181B]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "What makes MasmSpace different from other whiteboard tools?",
              a: "MasmSpace is built from the ground up for both visual thinkers and builders. It bridges freehand brainstorming with structured system architecture, live code specs, and AI board intelligence on a high-performance infinite canvas.",
            },
            {
              q: "Is MasmSpace free to use?",
              a: "Yes. You can create up to 3 persistent boards completely free with all basic shapes, sticky notes, and export features. Pro unlocks unlimited boards, AI assistance, and live multiplayer collaboration.",
            },
            {
              q: "How does real-time collaboration work?",
              a: "Every board has a persistent room ID. When you click 'Share' in the top bar, you can send a link to teammates to co-edit simultaneously with live presence cursors and instant state synchronization.",
            },
            {
              q: "Can I export my boards?",
              a: "Yes. You can export high-resolution PNG snapshots, vector formats, or JSON files at any time. Your work remains completely under your ownership.",
            },
          ].map((item, idx) => (
            <div
              key={item.q}
              className="rounded-xl border border-[#E4E4E7] bg-white overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-[#18181B] hover:text-[#635BFF] transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#71717A] transition-transform duration-150 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-[#52525B] leading-relaxed border-t border-[#F4F4F5] pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 14. FINAL CTA ── */}
      <section className="py-24 bg-white border-t border-[#E4E4E7] text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.02em] text-[#18181B] mb-4">
            Your next idea deserves a canvas.
          </h2>
          <p className="text-base text-[#52525B] max-w-xl mx-auto mb-8 leading-relaxed">
            Start thinking, building, and collaborating in MasmSpace today. No credit
            card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/canvas"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#635BFF] hover:bg-[#5248E5] text-white text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-sm font-medium text-[#18181B] transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ── 15. MINIMAL PREMIUM FOOTER ── */}
      <footer className="py-14 bg-[#FAFAF9] border-t border-[#E4E4E7] text-xs text-[#71717A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-3">
                <div className="relative w-6 h-5 flex items-center justify-center shrink-0">
                  <Image
                    src="/masmspace-logo.png"
                    alt="MasmSpace"
                    width={24}
                    height={19}
                    className="object-contain"
                  />
                </div>
                <span className="font-semibold text-sm text-[#18181B]">
                  MasmSpace
                </span>
              </Link>
              <p className="text-xs text-[#52525B] max-w-xs leading-relaxed mb-3">
                The visual workspace for thinking, diagramming, and building complex systems.
              </p>
              <div className="text-[11px] text-[#71717A]">
                Powered by PRATHOMIX SOLUTION
              </div>
            </div>

            {/* Product */}
            <div>
              <div className="font-semibold text-[#18181B] mb-3">Product</div>
              <ul className="space-y-2">
                <li><Link href="/canvas" className="hover:text-[#18181B] transition-colors">Infinite Canvas</Link></li>
                <li><a href="#features" className="hover:text-[#18181B] transition-colors">Features</a></li>
                <li><a href="#builders" className="hover:text-[#18181B] transition-colors">For Builders</a></li>
                <li><a href="#pricing" className="hover:text-[#18181B] transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <div className="font-semibold text-[#18181B] mb-3">Resources</div>
              <ul className="space-y-2">
                <li><Link href="/features" className="hover:text-[#18181B] transition-colors">Architecture Guide</Link></li>
                <li><a href="#use-cases" className="hover:text-[#18181B] transition-colors">Templates</a></li>
                <li><a href="mailto:contact@prathomix.tech" className="hover:text-[#18181B] transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <div className="font-semibold text-[#18181B] mb-3">Legal</div>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-[#18181B] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#18181B] transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-[#18181B] transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div>© {new Date().getFullYear()} MasmSpace. All rights reserved.</div>
            <div className="flex items-center gap-4 text-[#71717A]">
              <span>Made for visual thinkers & systems architects</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

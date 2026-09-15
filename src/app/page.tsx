"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import {
  Sparkles,
  Code2,
  Cpu,
  Zap,
  ArrowRight,
  Terminal,
  Mail,
  Check,
  ChevronDown,
  Layers,
  BookOpen,
  Users,
  Boxes,
  Activity,
  Play,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CanvasLoader } from "@/components/CanvasLoader";

export default function LandingPage() {
  // ── Canvas Launch Loading State ───────────────────────────────────────────
  const [isLaunchingCanvas, setIsLaunchingCanvas] = useState(false);

  // ── Segment-Wise Tabs State ────────────────────────────────────────────────
  const [activeSegment, setActiveSegment] = useState<
    "engineers" | "researchers" | "product"
  >("engineers");

  // ── FAQ Accordion State ────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // ── Pro Pricing Billing Cycle (Monthly: $5/mo, Yearly: $49/yr Save 18%) ──
  const [proBillingCycle, setProBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // ── Authentication & Sign-Out State ───────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ email?: string; name?: string } | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setCurrentUser({
            email: user.email,
            name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0],
          });
          return;
        }
      } catch { }

      if (typeof window !== "undefined" && isMounted) {
        try {
          const stored = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed) setCurrentUser(parsed);
          }
        } catch { }
      }
    }

    checkUser();
    return () => { isMounted = false; };
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("masmspace_current_user");
        localStorage.removeItem("wasmspace_current_user");
        localStorage.removeItem("masmspace_user_avatar");
      }
      setCurrentUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("masmspace_current_user");
      }
      setCurrentUser(null);
    } finally {
      setIsSigningOut(false);
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // ── Animation Variants ─────────────────────────────────────────────────────
  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  // ── Segments Data ──────────────────────────────────────────────────────────
  const segments = {
    engineers: {
      title: "Software Engineers & Architects",
      tag: "Deep Architecture",
      icon: Terminal,
      headline: "From System Doodles to Executable Architecture in Seconds.",
      bullets: [
        "Map microservices, event queues, and database schemas on an infinite grid.",
        "Validate algorithms and data structures locally with in-canvas Pyodide runtime.",
        "Generate OpenAPI specs and ready-to-paste boilerplate directly from diagrams.",
      ],
      codeSnippet: `// System Architecture Spec
interface PipelineNode {
  service: "api-gateway" | "auth-broker";
  throughput: "100k req/sec";
  wasmRuntime: true;
}
const gateway: PipelineNode = {
  service: "api-gateway",
  throughput: "100k req/sec",
  wasmRuntime: true
};`,
    },
    researchers: {
      title: "AI Researchers & Students",
      tag: "Mathematical Modeling",
      icon: BookOpen,
      headline: "Graph Equations, Run Computations, and Sketch Logic.",
      bullets: [
        "Interactive math sketching with instant matrix and vector computations.",
        "Run Python data manipulation and chart generation directly on sticky nodes.",
        "Neural semantic memory recalls every formula and model architecture you draw.",
      ],
      codeSnippet: `import numpy as np

# Neural Layer Weight Simulation
def simulate_forward_pass(inputs, weights):
    activations = np.dot(inputs, weights)
    return np.maximum(0, activations) # ReLU

print("[Pyodide WASM] Tensor layer converged.")`,
    },
    product: {
      title: "Product Teams & Founders",
      tag: "Rapid Scoping",
      icon: Users,
      headline: "Bridge the Void Between Design, Strategy, and Engineering.",
      bullets: [
        "Wireframe user flows and state transitions with smart snap-to-grid shapes.",
        "Export clean, presentation-ready vector assets for investor decks or specs.",
        "Zero-latency multiplayer lets your whole team brainstorm together with live cursors.",
      ],
      codeSnippet: `/* Product Flow Specification */
[Landing Page] ➔ {Auth Modal}
       │
       ├── (User Pro) ➔ [Pro Canvas + Unlimited AI]
       └── (User Free) ➔ [Standard Canvas + 10 Actions/Day]`,
    },
  };

  // ── FAQ Data ───────────────────────────────────────────────────────────────
  const faqs = [
    {
      q: "Does MasmSpace really run smoothly on 4GB RAM or low-end PCs?",
      a: "Yes, absolutely. The Pyodide WebAssembly compiler and canvas computation engine execute inside isolated Web Workers on background threads. The main rendering loop is strictly decoupled, guaranteeing a fluid 60 FPS without memory leaks or UI freeze even on budget hardware.",
    },
    {
      q: "Where does my code and whiteboard data live? Is it private?",
      a: "By default, MasmSpace adheres to a local-first philosophy. Code execution and diagram state happen client-side in your browser sandboxed via WebAssembly. With Pro Cloud Sync, state is stored in high-security encrypted Supabase tables, and your diagrams are never used to train third-party AI models.",
    },
    {
      q: "Can I use MasmSpace offline without an internet connection?",
      a: "Yes. Once the Pyodide WebAssembly runtime is cached in your browser's CacheStorage, core whiteboard drawing and local Python code execution work completely offline with zero dependency on external cloud servers.",
    },
    {
      q: "How does the AI Architecture Swarm generate diagram elements?",
      a: "Our backend load-balances between Google Gemini 1.5 and Groq Llama-3.3 high-speed inference pools. It returns deterministic Excalidraw element geometry that renders natively onto your canvas with editable strokes, labels, and connectors.",
    },
    {
      q: "Can I export my canvases to external tools?",
      a: "Yes. You can export your full canvas or selected elements as clean vector SVGs, high-resolution PNGs, or portable `.masmspace` JSON files with zero platform lock-in.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative overflow-x-hidden">
      {/* ── Seamless Full-Screen Canvas Loader Transition ── */}
      <AnimatePresence>
        {isLaunchingCanvas && (
          <CanvasLoader
            message="Loading Workspace Environment…"
            submessage="Streaming WebAssembly Canvas Engine & Vector RAG Pipeline"
          />
        )}
      </AnimatePresence>

      {/* ── Ambient Neon Backdrops (Cyber-Glass Accents) ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-b from-cyan-500/15 via-purple-600/10 to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-[35%] right-[-12%] w-[550px] h-[550px] bg-purple-600/10 blur-[170px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[160px] rounded-full" />
        {/* Fine cyber dot matrix grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.9) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          NAVBAR
         ═══════════════════════════════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#030303]/75 border-b border-white/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3.5 focus:outline-none">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:border-cyan-500/40 transition-colors">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace Logo"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                MasmSpace
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                v2.4 Live
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
            <a href="#problems" className="hover:text-white transition-colors">
              Why MasmSpace
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#builders" className="hover:text-white transition-colors">
              For Builders
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            {currentUser ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="truncate max-w-[120px] md:max-w-[160px] text-zinc-200 font-medium">
                    {currentUser.name || currentUser.email}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm"
                  title="Sign out of MasmSpace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}

            <Link
              href="/canvas"
              onClick={() => setIsLaunchingCanvas(true)}
              className="group relative inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500/20 via-cyan-400/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/40 hover:border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] transition-all duration-300 active:scale-[0.98]"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. HERO SECTION (ABOVE THE FOLD)
         ═══════════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 pt-20">
        <section className="min-h-[calc(100vh-5rem)] flex flex-col justify-center px-6 sm:px-8 py-20 sm:py-28 max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="text-center flex flex-col items-center max-w-4xl mx-auto mb-14 sm:mb-18"
          >
            {/* Live Status Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-medium text-cyan-400 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.12)]"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Pyodide WebAssembly + AI Intelligence Live</span>
            </motion.div>

            {/* Headline with striking Cyan-to-Purple gradient */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6"
            >
              Your Brain&apos;s Operating System.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500">
                Sketch, Code, and Build—At the Speed of Thought.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl font-normal leading-relaxed mb-10"
            >
              Live code execution with Pyodide WASM, AI architecture generation,
              and infinite multi-user collaboration on a single cyberpunk canvas.
            </motion.p>

            {/* CTA Group */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 w-full sm:w-auto"
            >
              <Link
                href="/canvas"
                onClick={() => setIsLaunchingCanvas(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-xl text-base font-semibold text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:shadow-[0_0_45px_rgba(6,182,212,0.7)] transition-all duration-300 active:scale-[0.98]"
              >
                <span>Launch Canvas</span>
                <ArrowRight className="w-5 h-5 text-black" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-medium text-gray-300 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 backdrop-blur-lg transition-all duration-200"
              >
                Explore Technology
              </a>
            </motion.div>
          </motion.div>

          {/* Visual: Sleek Dark-Mode Mockup (Canvas + Live Code Runner) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl mx-auto rounded-2xl border border-white/10 bg-[#06080e]/80 backdrop-blur-2xl p-3 sm:p-5 shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.1)] overflow-hidden"
          >
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70 border border-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70 border border-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500/70 border border-green-500" />
                <span className="ml-3 text-xs font-mono text-gray-400">
                  masmspace://workspace/neural-cluster.masmspace
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="hidden sm:inline-flex items-center gap-1 text-cyan-400 font-mono">
                  <Activity className="w-3.5 h-3.5" /> 60 FPS WASM
                </span>
                <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10">
                  Pyodide v0.26
                </span>
              </div>
            </div>

            {/* Mockup Body: Two Columns (Whiteboard Visuals + Code Runner) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 min-h-[380px] sm:min-h-[460px]">
              {/* Left Column: Whiteboard Diagram Mockup (7 cols) */}
              <div className="lg:col-span-7 rounded-xl bg-[#0a0d16] border border-white/[0.05] p-5 relative overflow-hidden flex flex-col justify-between">
                {/* Canvas Toolbar Mockup */}
                <div className="flex items-center gap-2 bg-[#030303]/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 w-fit text-xs text-gray-300">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">
                    Selection
                  </span>
                  <span className="px-2 py-0.5 hover:text-white cursor-pointer">
                    Rectangle
                  </span>
                  <span className="px-2 py-0.5 hover:text-white cursor-pointer">
                    Arrow
                  </span>
                  <span className="px-2 py-0.5 hover:text-white cursor-pointer">
                    AI Swarm
                  </span>
                </div>

                {/* Drawn Diagram Nodes */}
                <div className="my-auto py-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 relative">
                  {/* Node 1: Client Gateway */}
                  <div className="p-4 rounded-xl border border-cyan-400/40 bg-cyan-500/[0.06] backdrop-blur-md text-left w-48 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                    <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wide">
                      Entry Gateway
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      MasmSpace Client
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" /> Low Latency
                    </div>
                  </div>

                  {/* Connector Arrow */}
                  <div className="text-cyan-400 font-mono text-xs flex items-center">
                    <span className="hidden sm:inline">──►</span>
                    <span className="sm:hidden">▼</span>
                  </div>

                  {/* Node 2: WASM Worker */}
                  <div className="p-4 rounded-xl border border-purple-400/40 bg-purple-500/[0.06] backdrop-blur-md text-left w-52 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                    <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wide">
                      Browser Sandbox
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      Pyodide WASM Core
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-purple-400" /> Zero Server Latency
                    </div>
                  </div>
                </div>

                {/* Bottom Canvas Footer */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/[0.04]">
                  <span>Canvas scale: 100% (Infinite Grid)</span>
                  <span className="text-cyan-400/80">3 Active Collaborators</span>
                </div>
              </div>

              {/* Right Column: Code Runner Panel (5 cols) */}
              <div className="lg:col-span-5 rounded-xl bg-[#04060a] border border-white/[0.08] p-4 flex flex-col justify-between font-mono text-xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-gray-400 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-gray-200">algorithm_runner.py</span>
                    </div>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Play className="w-3 h-3 fill-emerald-400" /> Running
                    </span>
                  </div>

                  {/* Code Editor Body */}
                  <div className="mt-3 text-gray-300 leading-relaxed overflow-x-auto">
                    <p className="text-gray-400"># Native In-Browser WebAssembly</p>
                    <p>
                      <span className="text-purple-400">import</span> numpy{" "}
                      <span className="text-purple-400">as</span> np
                    </p>
                    <p>
                      <span className="text-purple-400">import</span> time
                    </p>
                    <br />
                    <p>
                      <span className="text-cyan-400">def</span>{" "}
                      <span className="text-teal-300">benchmark_pipeline</span>():
                    </p>
                    <p className="pl-4">
                      matrix = np.random.rand(1000, 1000)
                    </p>
                    <p className="pl-4">
                      inv = np.linalg.pinv(matrix)
                    </p>
                    <p className="pl-4 text-gray-400">
                      return f&quot;Solved 1M elements: &#123;inv.shape&#125;&quot;
                    </p>
                    <br />
                    <p>
                      <span className="text-purple-400">print</span>(
                      benchmark_pipeline())
                    </p>
                  </div>
                </div>

                {/* Code Terminal Output */}
                <div className="mt-4 p-3 rounded-lg bg-black/60 border border-emerald-500/20 text-emerald-400 text-[11px]">
                  <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1">
                    Terminal Output:
                  </p>
                  <p>✦ [Pyodide Engine] Solved 1M elements: (1000, 1000)</p>
                  <p className="text-gray-400 mt-0.5">
                    ⏱ Execution: 22ms • Memory: 14MB • Server hops: 0
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            2. PROBLEM SECTION (THE PAIN POINTS)
           ═══════════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════════
            2. PROBLEM SECTION (THE PAIN POINTS)
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="problems"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 sm:px-8 py-24 sm:py-32 scroll-mt-20 border-t border-white/[0.04]"
        >
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <span className="text-xs uppercase font-mono tracking-widest text-red-400/80 mb-3 block">
              The Architecture Bottleneck
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Modern Technical Planning is Broken.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              Engineers waste hours toggling between static sketch pads, external
              IDEs, and sluggish canvas tools that choke on complex workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pain Point 1 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="h-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-red-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-400">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                  Scattered Tools
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Diagrams are trapped in one whiteboard, algorithm validation is
                  buried in a local terminal, and AI prompting context is lost
                  across browser tabs.
                </p>
              </div>
            </Tilt>

            {/* Pain Point 2 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="h-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-yellow-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6 text-yellow-400">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                  Heavy Latency & Crashes
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Traditional cloud-rendered tools consume gigabytes of RAM, lag
                  during screen shares, crash on 4GB laptops, and lack real local
                  code compilation.
                </p>
              </div>
            </Tilt>

            {/* Pain Point 3 */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="h-full p-8 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                  Brutal Context Switching
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Every switch between whiteboard, documentation, and code editor
                  costs 23 minutes of deep focus recovery. Your creative momentum
                  evaporates.
                </p>
              </div>
            </Tilt>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════════
            3. SOLUTION & KEY FEATURES (THE TECH POWERHOUSE)
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="features"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 sm:px-8 py-24 sm:py-32 scroll-mt-20 border-t border-white/[0.04]"
        >
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-3 block">
              The MasmSpace Solution
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Engineered for Pure Velocity.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              We fused high-performance WebAssembly with intelligent multi-agent
              architecture to give you an unconstrained engineering workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Pyodide WASM */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="group h-full p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono uppercase text-cyan-400/80 mb-2 block">
                    Client-Side Runtime
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-cyan-300 transition-colors">
                    Browser-Based Python Engine (WASM)
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Run authentic Python 3, NumPy, and algorithm scripts natively
                    inside your browser via Pyodide WebAssembly. Zero round-trips
                    to an external cloud server, zero server fees, zero latency.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-cyan-400/80 font-mono">
                  <span>Pyodide WebAssembly</span>
                  <span>Instant Exec</span>
                </div>
              </div>
            </Tilt>

            {/* Feature 2: AI Architecture Swarm */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="group h-full p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-purple-500/40 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono uppercase text-purple-400/80 mb-2 block">
                    Intelligent Generation
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-purple-300 transition-colors">
                    AI Architecture Swarm
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    Multi-agent intelligence (Gemini 1.5 &amp; Groq Llama-3.3)
                    transforms natural language prompts or rough wireframes into
                    structured, editable architecture blueprints and deployment
                    manifests.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-purple-400/80 font-mono">
                  <span>Multi-Provider Balancer</span>
                  <span>Sub-Second Output</span>
                </div>
              </div>
            </Tilt>

            {/* Feature 3: Infinite Cyber-Glass Canvas */}
            <Tilt
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.15}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="group h-full p-8 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-teal-500/40 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-6 text-teal-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono uppercase text-teal-400/80 mb-2 block">
                    Hardware Accelerated
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-teal-300 transition-colors">
                    Infinite Cyber-Glass Canvas
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6">
                    High-throughput vector rendering engine optimized for locked 60
                    FPS even on low-power 4GB RAM laptops. Unlimited board
                    dimensions, smooth zoom, and crisp Excalidraw-grade visual
                    precision.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-teal-400/80 font-mono">
                  <span>Web Worker Threads</span>
                  <span>60 FPS Locked</span>
                </div>
              </div>
            </Tilt>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════════
            4. FOR DIFFERENT BUILDERS (SEGMENT-WISE VALUE)
           ═══════════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════════
            4. FOR DIFFERENT BUILDERS (SEGMENT-WISE VALUE)
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="builders"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 sm:px-8 py-24 sm:py-32 scroll-mt-20 border-t border-white/[0.04]"
        >
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs uppercase font-mono tracking-widest text-purple-400 mb-3 block">
              Tailored Workflows
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Built for Every Type of Builder.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              Whether you are architecting a distributed cloud, training a neural
              network, or shipping a startup product flow.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {(
              [
                { id: "engineers", label: "Software Engineers", icon: Terminal },
                { id: "researchers", label: "AI Researchers & Students", icon: BookOpen },
                { id: "product", label: "Product Teams", icon: Users },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSegment === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSegment(tab.id)}
                  className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "bg-white/[0.02] text-gray-400 hover:text-white border border-white/10 hover:bg-white/[0.05]"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Segment Card Content with smooth fade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSegment}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="max-w-5xl mx-auto rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl p-8 sm:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <span className="text-xs font-mono uppercase px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 inline-block mb-4">
                    {segments[activeSegment].tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                    {segments[activeSegment].headline}
                  </h3>
                  <div className="space-y-3.5 mt-6">
                    {segments[activeSegment].bullets.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 text-cyan-300">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-sm sm:text-base text-gray-300 leading-relaxed">
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-xl bg-black/70 border border-white/10 p-5 font-mono text-xs overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08] text-gray-400 text-[11px]">
                    <span className="text-cyan-400">spec_execution.preview</span>
                    <span>MasmSpace Runtime</span>
                  </div>
                  <pre className="text-gray-300 whitespace-pre leading-relaxed font-mono">
                    {segments[activeSegment].codeSnippet}
                  </pre>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════════
            5. TRANSPARENT PRICING (DEVELOPER FRIENDLY)
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="pricing"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 sm:px-8 py-24 sm:py-32 scroll-mt-20 border-t border-white/[0.04]"
        >
          <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-3 block">
              Predictable &amp; Generous
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Developer-First Pricing.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              Start building for free with native WASM execution. Upgrade only
              when you need unlimited AI agent throughput and team sync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Tier */}
            <Tilt
              tiltMaxAngleX={8}
              tiltMaxAngleY={8}
              scale={1.01}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.08}
              glareColor="#ffffff"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="h-full p-8 sm:p-10 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 hover:border-white/20">
                <div>
                  <span className="text-xs font-mono uppercase text-gray-400">
                    Starter Plan
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1 mb-2">
                    Free Tier
                  </h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      $0
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                      / forever
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    Ideal for solo tinkerers, students, and engineers needing a
                    blazing fast code-enabled sketchpad.
                  </p>

                  <div className="space-y-3.5 mb-8">
                    {[
                      "Core Infinite Canvas & Excalidraw Engine",
                      "Local Pyodide WebAssembly Python Runner",
                      "10 Daily AI Architecture Generation Prompts",
                      "Local-first JSON, SVG, & PNG High-Res Exports",
                      "100% Offline Capability",
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/canvas"
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </Tilt>

            {/* Pro Tier with Dynamic Pulsing Glow & 3D Tilt */}
            <Tilt
              tiltMaxAngleX={8}
              tiltMaxAngleY={8}
              scale={1.02}
              transitionSpeed={2000}
              glareEnable={true}
              glareMaxOpacity={0.12}
              glareColor="#06b6d4"
              glarePosition="all"
              glareBorderRadius="1rem"
              className="h-full rounded-2xl"
            >
              <div className="relative h-full p-8 sm:p-10 rounded-2xl bg-white/[0.03] border-2 border-cyan-400/50 backdrop-blur-xl flex flex-col justify-between shadow-[0_0_50px_rgba(6,182,212,0.35)] animate-[glow-breathe_4s_ease-in-out_infinite] transition-all duration-300 hover:border-cyan-300">
                {/* Pro Badge */}
                <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-black text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                  Most Popular
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase text-cyan-400">
                      Professional Architecture
                    </span>

                    {/* Monthly / Yearly Switcher */}
                    <div className="inline-flex p-0.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono">
                      <button
                        onClick={() => setProBillingCycle("monthly")}
                        className={`px-2.5 py-1 rounded-md transition-all ${proBillingCycle === "monthly"
                            ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30"
                            : "text-gray-400 hover:text-white"
                          }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setProBillingCycle("yearly")}
                        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${proBillingCycle === "yearly"
                            ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-400/30"
                            : "text-gray-400 hover:text-white"
                          }`}
                      >
                        <span>Yearly</span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 font-bold leading-none">
                          Save 18%
                        </span>
                      </button>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    Pro Tier
                  </h3>

                  {/* Dynamic Price Display */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">
                      {proBillingCycle === "yearly" ? "$49" : "$5"}
                    </span>
                    <span className="text-sm text-gray-400 font-mono">
                      {proBillingCycle === "yearly" ? "/ year" : "/ month"}
                    </span>
                    {proBillingCycle === "yearly" && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        Save 18%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-cyan-400/80 font-mono mb-6">
                    {proBillingCycle === "yearly"
                      ? "Billed annually ($4.08/mo effective) • Cancel anytime"
                      : "Flexible monthly billing • Cancel anytime"}
                  </p>

                  <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                    Engineered for lead architects, senior engineers, and teams
                    demanding infinite AI swarm generation.
                  </p>

                  <div className="space-y-3.5 mb-8">
                    {[
                      "Everything in Free Tier",
                      "300 Daily AI Architecture Generation Prompts",
                      "Encrypted Cloud Sync & Version History (Supabase)",
                      "Priority Low-Latency Multi-User Collaboration",
                      "Custom Python Script Templates & Voice-to-Canvas",
                      "Priority 24/7 Developer Support",
                    ].map((feat, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-white">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/canvas?plan=${proBillingCycle}`}
                  onClick={() => setIsLaunchingCanvas(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-black bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] transition-all active:scale-[0.98]"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </Link>
              </div>
            </Tilt>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════════
            6. FAQ (OBJECTION HANDLER)
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          id="faq"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-5xl mx-auto px-6 sm:px-8 py-24 sm:py-32 scroll-mt-20 border-t border-white/[0.04]"
        >
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-3 block">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Frequently Asked Questions.
            </h2>
            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              Everything you need to know about WebAssembly execution, privacy,
              and low-spec device performance.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left text-base font-semibold text-white hover:text-cyan-300 transition-colors focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-cyan-400" : ""
                        }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-1 text-sm text-gray-400 leading-relaxed border-t border-white/[0.04]">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════════
            7. FINAL CTA & MINIMALIST FOOTER
           ═══════════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative px-6 sm:px-8 py-24 sm:py-32 border-t border-white/[0.06] overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-cyan-500/15 via-purple-600/15 to-transparent blur-[140px] rounded-full" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Ready to Build at the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 via-purple-400 to-cyan-400 bg-[length:200%_auto] animate-shimmer-text">
                Speed of Thought?
              </span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of software architects, developers, and AI
              researchers crafting the future on MasmSpace.
            </p>
            <Link
              href="/canvas"
              onClick={() => setIsLaunchingCanvas(true)}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-xl text-base font-semibold text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:brightness-110 shadow-[0_0_35px_rgba(6,182,212,0.45)] hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] transition-all duration-300 active:scale-[0.98]"
            >
              <span>Launch MasmSpace Now</span>
              <ArrowRight className="w-5 h-5 text-black" />
            </Link>
          </div>
        </motion.section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#030303]/95 backdrop-blur-2xl py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10">
            {/* Left Brand info */}
            <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-white tracking-tight">
                  MasmSpace
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-gray-400 font-mono">
                  by PRATHOMIX SOLUTION
                </span>
              </div>
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} PRATHOMIX SOLUTION. All rights
                reserved.
              </p>
            </div>

            {/* Support Emails & Legal */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
              <a
                href="mailto:support@prathomix.tech"
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-400/80" />
                <span>support@prathomix.tech</span>
              </a>

              <a
                href="mailto:hello@prathomix.tech"
                className="inline-flex items-center gap-1.5 text-gray-400 hover:text-purple-400 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-purple-400/80" />
                <span>hello@prathomix.tech</span>
              </a>

              <span className="text-gray-400/40">|</span>

              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

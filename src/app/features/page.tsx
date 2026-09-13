import { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Sparkles, Terminal, Cpu, Zap, Cloud, Layers, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Features - Cyber-Glassmorphism AI & Developer Workspace",
  description:
    "Explore MasmSpace features: interactive whiteboard canvas, in-browser WebAssembly Python runtime, Python FastAPI intelligence, and Supabase real-time cloud sync.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "MasmSpace Features | Next-Gen AI Workspace",
    description:
      "Engineered for developers, architects, and researchers. Discover WebAssembly execution, AI modeling, and collaborative infinite canvas.",
    url: "https://masmspace.online/features",
  },
};

export default function FeaturesPage() {
  const features = [
    {
      icon: <Cpu className="w-7 h-7 text-cyan-400" />,
      title: "WebAssembly Code Engine",
      description:
        "Execute Python algorithms, data structures, and math functions instantly inside your browser using Pyodide WebAssembly.",
    },
    {
      icon: <Sparkles className="w-7 h-7 text-violet-400" />,
      title: "Autonomous AI Intelligence",
      description:
        "Powered by FastAPI backend with load-balanced Gemini and Groq models. Summarize, refactor, and generate diagrams automatically.",
    },
    {
      icon: <Cloud className="w-7 h-7 text-emerald-400" />,
      title: "Supabase Real-Time Cloud Sync",
      description:
        "Instant cross-device synchronization, automated version snapshots, and encrypted cloud persistence for your canvases.",
    },
    {
      icon: <Layers className="w-7 h-7 text-amber-400" />,
      title: "Cyber-Glassmorphism Canvas",
      description:
        "An infinite whiteboard interface built with high-FPS rendering, customizable toolbars, and futuristic neon visual feedback.",
    },
    {
      icon: <Terminal className="w-7 h-7 text-pink-400" />,
      title: "VS Code Style Explorer",
      description:
        "Organize files, shapes, and code snippets in an intuitive folder tree hierarchy inspired by modern developer IDEs.",
    },
    {
      icon: <Zap className="w-7 h-7 text-blue-400" />,
      title: "Voice-To-Canvas Control",
      description:
        "Speak natural language technical instructions to generate architecture nodes, flowcharts, and sticky notes hands-free.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-void text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Developer Superpowers</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Engineered for{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
              Builders & Architects
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-base md:text-lg">
            Everything you need to design complex architectures, prototype code in WebAssembly, and collaborate with AI assistants in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-cyan-500/40 transition-all group"
            >
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/canvas"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:opacity-95 transition-opacity"
          >
            Launch Whiteboard Canvas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

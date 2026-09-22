"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  RotateCcw,
  Sparkles,
  Home,
  Layout,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  LifeBuoy,
} from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Safely record runtime exception to console
    console.error("[MasmSpace Runtime Boundary Caught Error]:", error);
  }, [error]);

  const handleCopyDigest = () => {
    const id = error?.digest || "ERR_RUNTIME_RECOVERABLE";
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-6 selection:bg-cyan-500/20 selection:text-cyan-300 font-sans relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-lg w-full p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl shadow-black/80 text-center space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-500/20">
            M
          </div>
          <span className="text-sm font-bold tracking-tight text-white">MasmSpace</span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            Powered by PRATHOMIX
          </span>
        </div>

        {/* Warning Badge Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <AlertTriangle className="w-8 h-8 text-amber-400" />
        </div>

        {/* Friendly Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Session Restored from a Hiccup
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            A temporary runtime exception occurred, but your canvas diagrams and workspaces remain safely intact in your browser cache.
          </p>
        </div>

        {/* Incident Reference Pill */}
        {error?.digest && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 max-w-full truncate">
            <span>Reference: {error.digest}</span>
            <button
              onClick={handleCopyDigest}
              className="hover:text-cyan-400 transition-colors p-0.5"
              title="Copy Incident ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,245,255,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recover Session</span>
          </button>

          <Link
            href="/canvas"
            className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layout className="w-4 h-4 text-cyan-400" />
            <span>Canvas Studio</span>
          </Link>
        </div>

        {/* Collapsible Technical Details (Developer Diagnostics) */}
        <div className="pt-2 border-t border-zinc-800/60 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-zinc-500 hover:text-zinc-300 text-[11px] font-mono py-1 transition-colors"
          >
            <span>Technical Diagnostics</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 max-h-32 overflow-y-auto space-y-1">
              <p className="text-rose-400 font-semibold">{error?.name || "Error"}: {error?.message || "An unexpected error occurred."}</p>
              {error?.digest && <p className="text-zinc-500">Digest: {error.digest}</p>}
            </div>
          )}
        </div>

        {/* Footer Support Navigation */}
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 pt-1">
          <Link href="/" className="hover:text-zinc-300 flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span>•</span>
          <a
            href="mailto:support@prathomix.tech"
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}

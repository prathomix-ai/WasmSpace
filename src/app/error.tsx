"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log exception safely to diagnostics
    console.error("[MasmSpace Runtime Boundary Caught Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas-dark text-zinc-100 flex items-center justify-center p-6 selection:bg-neon-cyan/20 selection:text-neon-cyan font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-2xl">
          ⚠️
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white font-mono">Application Restored from Hiccup</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            A runtime exception was safely intercepted by the MasmSpace error boundary. Your canvas session data remains preserved in local storage.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-xs font-mono text-zinc-400 overflow-x-auto max-h-24">
            <code>{error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all"
          >
            ↻ Recover Session
          </button>
          <Link
            href="/canvas"
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-all flex items-center justify-center"
          >
            Canvas Studio
          </Link>
        </div>
      </div>
    </div>
  );
}

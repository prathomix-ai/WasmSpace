import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas-dark text-zinc-100 flex items-center justify-center p-6 selection:bg-neon-cyan/20 selection:text-neon-cyan font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-xl shadow-2xl text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
          STATUS 404 // COORDINATES UNMAPPED
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white font-mono">Board Not Found</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            The infinite canvas page you are looking for has been archived, relocated, or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/canvas"
            className="flex-1 px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <span>✍️</span> Open Canvas Studio
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 transition-all flex items-center justify-center"
          >
            MasmSpace Home
          </Link>
        </div>
      </div>
    </div>
  );
}

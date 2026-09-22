"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wrench,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Zap,
  Server,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function MaintenancePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // Auto-decrement countdown to auto-refresh check
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkStatus();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkStatus = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/feature-flags?t=" + Date.now());
      if (res.ok) {
        const data = await res.json();
        const isMaintenance = Boolean(data?.flags?.maintenance_mode?.enabled);
        if (!isMaintenance) {
          setStatusMessage("Maintenance completed! Redirecting back to workspace...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1200);
          return;
        }
      }
      setStatusMessage("Upgrade still actively in progress. Checking again in a moment.");
    } catch {
      setStatusMessage("System upgrade underway. Please stand by.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-white text-base">
            M
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base">MasmSpace</span>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Powered by PRATHOMIX
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Scheduled Upgrade
        </div>
      </header>

      {/* Central Hero Card */}
      <main className="w-full max-w-2xl my-auto z-10 text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-2xl shadow-cyan-950/40 mb-6 backdrop-blur-xl relative group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-sm group-hover:blur-md transition-all" />
          <Wrench className="w-10 h-10 text-cyan-400 relative animate-[spin_6s_linear_infinite]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Under Scheduled <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Maintenance</span>
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-8">
          We are deploying major high-concurrency infrastructure enhancements and system updates to ensure ultra-smooth 1,000+ viewer collaboration. Your canvas workspaces and data are 100% secure.
        </p>

        {/* Status Metrics Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md text-left mb-8 max-w-xl mx-auto shadow-inner">
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Canvas Engine</span>
            </div>
            <p className="text-xs font-semibold text-zinc-200">Re-indexing Topologies</p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Realtime Mesh</span>
            </div>
            <p className="text-xs font-semibold text-zinc-200">Bandwidth Throttling</p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/50">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Integrity</span>
            </div>
            <p className="text-xs font-semibold text-emerald-400">100% Secure</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={checkStatus}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking Status..." : "Check Status Now"}
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-sm font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <span>Admin Sign-In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feedback message */}
        {statusMessage && (
          <p className="mt-4 text-xs font-mono text-cyan-400 animate-fade-in">
            {statusMessage}
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Auto-refresh in <span className="font-mono text-zinc-400">{countdown}s</span>
        </p>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 border-t border-zinc-800/60 pt-4 z-10 gap-2">
        <p>© {new Date().getFullYear()} PRATHOMIX Solution Inc. All systems operational shortly.</p>
        <div className="flex items-center gap-4">
          <a
            href="mailto:support@prathomix.tech"
            className="hover:text-zinc-400 transition-colors"
          >
            support@prathomix.tech
          </a>
          <span>•</span>
          <span className="text-zinc-500 font-mono">Status: Upgrading</span>
        </div>
      </footer>
    </div>
  );
}

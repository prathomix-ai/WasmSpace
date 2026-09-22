"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Sparkles,
  Users,
  Code2,
  CreditCard,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Layers,
  Wrench,
} from "lucide-react";
import { useFeatureFlags, DEFAULT_FEATURE_FLAGS } from "@/lib/featureFlags";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  system: <Wrench className="w-4 h-4 text-rose-400" />,
  ai: <Sparkles className="w-4 h-4 text-cyan-400" />,
  collaboration: <Users className="w-4 h-4 text-emerald-400" />,
  tools: <Code2 className="w-4 h-4 text-indigo-400" />,
  billing: <CreditCard className="w-4 h-4 text-amber-400" />,
};

export default function FeatureFlagsModule() {
  const { flags, isLoading, mutate } = useFeatureFlags();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleToggleFlag = async (id: string, currentState: boolean) => {
    const nextState = !currentState;
    setTogglingId(id);
    setFeedback(null);

    // Optimistic UI mutation
    const updatedFlags = {
      ...flags,
      [id]: {
        ...flags[id],
        enabled: nextState,
        updated_at: new Date().toISOString(),
      },
    };
    mutate(updatedFlags, false);

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          enabled: nextState,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to update feature flag`);
      }

      await res.json().catch(() => ({}));
      mutate(); // Revalidate from server

      setFeedback({
        type: "success",
        message: `Feature '${flags[id]?.name || id}' is now ${nextState ? "ENABLED" : "DISABLED"} live across the app.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      // Revert optimistic update
      mutate();
      setFeedback({
        type: "error",
        message: err.message || "Failed to toggle feature flag.",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const maintenanceFlag = flags["maintenance_mode"] || DEFAULT_FEATURE_FLAGS["maintenance_mode"];
  const otherFlags = Object.values(flags).filter((f) => f.id !== "maintenance_mode");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Feature Flags & Kill Switches</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Instant Hot-Toggle
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Instantly disable or enable pages, AI tools, and system features live without redeploying.
          </p>
        </div>

        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Flags</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/30 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 1. GLOBAL MAINTENANCE MODE (High Priority Emergency Card) ── */}
      <div
        className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
          maintenanceFlag.enabled
            ? "bg-rose-950/30 border-rose-500/50 shadow-2xl shadow-rose-950/50"
            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                maintenanceFlag.enabled
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white">Global Maintenance Mode</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    maintenanceFlag.enabled
                      ? "bg-rose-500 text-white animate-bounce"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {maintenanceFlag.enabled ? "ACTIVE (SYSTEM LOCKED)" : "STANDBY (NORMAL)"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                When active, all non-admin traffic across the entire site is automatically redirected by the Next.js edge middleware to the <code className="text-cyan-400 font-mono">/maintenance</code> page. Super Admins retain full access to manage and lift maintenance.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleFlag("maintenance_mode", maintenanceFlag.enabled)}
            disabled={togglingId === "maintenance_mode"}
            className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0 ${
              maintenanceFlag.enabled
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-950/50"
                : "bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-950/50"
            }`}
          >
            {togglingId === "maintenance_mode" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : maintenanceFlag.enabled ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Lift Maintenance</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Enable Maintenance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. APP FEATURE SWITCHES GRID ── */}
      <div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">
            Application Tool Kill Switches
          </h3>
          <p className="text-xs text-zinc-500">
            Toggle features on or off in real-time. Toggling takes effect immediately across all active client sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {otherFlags.map((flag) => {
            const isToggling = togglingId === flag.id;

            return (
              <div
                key={flag.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  flag.enabled
                    ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                    : "bg-zinc-950/70 border-zinc-900 opacity-60 hover:opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                        {CATEGORY_ICONS[flag.category] || <Layers className="w-4 h-4 text-zinc-400" />}
                      </div>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        {flag.category}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.id, flag.enabled)}
                      disabled={isToggling}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        flag.enabled ? "bg-cyan-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          flag.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{flag.name}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    {flag.description || "System feature flag."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono">
                  <span>ID: {flag.id}</span>
                  <span
                    className={`font-semibold ${
                      flag.enabled ? "text-cyan-400" : "text-rose-400"
                    }`}
                  >
                    {flag.enabled ? "ACTIVE" : "KILLED (DISABLED)"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

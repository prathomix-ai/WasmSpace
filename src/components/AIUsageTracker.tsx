"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Clock, Crown, Zap, AlertCircle } from "lucide-react";

interface AIUsageTrackerProps {
  actionsUsed?: number;
  actionLimit?: number;
  tier?: string;
  onOpenUpgradeModal?: () => void;
}

export function AIUsageTracker({
  actionsUsed = 0,
  actionLimit = 15,
  tier = "free",
  onOpenUpgradeModal,
}: AIUsageTrackerProps) {
  const [countdown, setCountdown] = useState({ hours: "00", minutes: "00", seconds: "00" });

  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      // Convert to IST (UTC + 5:30)
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffsetMs);

      // Compute next midnight IST
      const istMidnight = new Date(istNow);
      istMidnight.setHours(24, 0, 0, 0);

      const diffMs = Math.max(0, istMidnight.getTime() - istNow.getTime());
      const hours = String(Math.floor(diffMs / (1000 * 60 * 60))).padStart(2, "0");
      const minutes = String(Math.floor((diffMs / (1000 * 60)) % 60)).padStart(2, "0");
      const seconds = String(Math.floor((diffMs / 1000) % 60)).padStart(2, "0");

      setCountdown({ hours, minutes, seconds });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min(100, Math.round((actionsUsed / actionLimit) * 100));
  const isExhausted = actionsUsed >= actionLimit;
  const isHigh = percentage >= 80;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/5 dark:bg-black/30 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-xl text-zinc-900 dark:text-zinc-100 space-y-4 select-none">
      {/* ── Header: Title, Tier Badge ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-600 dark:text-neon-cyan border border-cyan-500/20 dark:border-neon-cyan/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-mono font-bold tracking-tight">
                AI Usage &amp; Quota
              </h4>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                  tier === "enterprise" || tier === "pro"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                }`}
              >
                {tier === "enterprise" ? "Enterprise" : tier === "pro" ? "PRO Tier" : "Free Tier"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Daily quota for AI canvas generation &amp; smart assistants
            </p>
          </div>
        </div>

        {tier === "free" && onOpenUpgradeModal && (
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            <span>Upgrade</span>
          </button>
        )}
      </div>

      {/* ── Glowing Glassmorphism Progress Bar ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Daily AI Actions
          </span>
          <span className="font-bold text-white">
            <span className={isExhausted ? "text-rose-400" : isHigh ? "text-amber-400" : "text-cyan-400"}>
              {actionsUsed}
            </span>
            <span className="text-zinc-500"> / {actionLimit} actions</span>
          </span>
        </div>

        {/* Outer Bar */}
        <div className="relative w-full h-3 rounded-full bg-black/40 dark:bg-zinc-900 border border-white/10 overflow-hidden p-0.5 shadow-inner">
          {/* Glowing Fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isExhausted
                ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_15px_rgba(244,63,94,0.7)]"
                : isHigh
                ? "bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                : "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 shadow-[0_0_15px_rgba(0,245,255,0.6)]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* ── Dynamic Countdown Timer Below Progress Bar ── */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
        <div className="flex items-center gap-1.5 font-mono text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Credits reset in:</span>
          <span className="font-bold text-cyan-300 font-mono tracking-wide">
            {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
          </span>
          <span className="text-[10px] text-zinc-500">(Midnight IST)</span>
        </div>

        {isExhausted && (
          <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Limit Reached</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIUsageTracker;

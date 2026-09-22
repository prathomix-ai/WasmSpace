"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { initGlobalApiInterceptor, emitGlobalToast, ToastEventDetail } from "@/lib/apiInterceptor";

interface ToastItem extends ToastEventDetail {
  id: string;
}

export const toast = {
  show: (message: string, type: ToastEventDetail["type"] = "info", durationMs = 4500) => {
    emitGlobalToast(message, type, durationMs);
  },
  success: (message: string, durationMs = 4500) => emitGlobalToast(message, "success", durationMs),
  error: (message: string, durationMs = 4500) => emitGlobalToast(message, "error", durationMs),
  warning: (message: string, durationMs = 4500) => emitGlobalToast(message, "warning", durationMs),
  info: (message: string, durationMs = 4500) => emitGlobalToast(message, "info", durationMs),
};

export default function GlobalToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // 1. Initialize Global Fetch Interceptor
    initGlobalApiInterceptor();

    // 2. Listen for Toast Dispatch Events
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastEventDetail>;
      if (!customEvent.detail?.message) return;

      const newId = "toast-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
      const newToast: ToastItem = {
        id: newId,
        message: customEvent.detail.message,
        type: customEvent.detail.type || "info",
        durationMs: customEvent.detail.durationMs || 4500,
      };

      setToasts((prev) => {
        // Limit max concurrent toasts to 3 to prevent clutter
        const filtered = prev.filter((t) => t.message !== newToast.message);
        return [...filtered.slice(-2), newToast];
      });

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newId));
      }, newToast.durationMs);
    };

    window.addEventListener("masmspace:toast", handleToastEvent);
    return () => {
      window.removeEventListener("masmspace:toast", handleToastEvent);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:right-6 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const isError = t.type === "error";
        const isWarning = t.type === "warning";
        const isSuccess = t.type === "success";

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-down ${
              isError
                ? "bg-zinc-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/40"
                : isWarning
                ? "bg-zinc-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/40"
                : isSuccess
                ? "bg-zinc-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40"
                : "bg-zinc-950/90 border-cyan-500/40 text-cyan-200 shadow-cyan-950/40"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {!isError && !isWarning && !isSuccess && <Info className="w-4 h-4 text-cyan-400" />}
            </div>

            <div className="flex-1 text-xs leading-relaxed font-medium">
              {t.message}
            </div>

            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-zinc-500 hover:text-white transition-colors p-0.5 -mr-1 -mt-1 rounded-lg"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

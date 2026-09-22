/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MasmSpace — Unified Subscription Context (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a single, app-wide subscription & quota state consumed by:
 *   - AICoPilotDrawer (MIX Chatbot quota HUD)
 *   - ArchitectureCanvas (aiUsage for Settings Modal)
 *   - LeftSidebar (PRO badge & gated features)
 *
 * Fetches live state from /api/generate (GET) and /api/check-subscription,
 * and listens for "Prathomix_subscription_change" custom events to
 * instantly update all consumers when a payment webhook confirms PRO status.
 */

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SubscriptionState {
  /** Whether the session is resolved (false = still loading) */
  isResolved: boolean;
  /** True if current user holds an active PRO / enterprise / admin tier */
  isPro: boolean;
  /** The canonical tier string returned from the database */
  tier: "free" | "pro" | "enterprise" | "admin";
  /** Number of AI generations used in the current period */
  actionsUsed: number;
  /** Maximum allowed AI generations for the current period */
  actionLimit: number;
  /** Human-readable quota label, e.g. "42/300 Daily Pro Uses" */
  displayQuota: string;
  /** ISO string of the next quota reset timestamp */
  resetAt?: string;
  /** Countdown label, e.g. "Quota resets in 18h 30m" */
  resetCountdown?: string;
  /** Trigger a manual quota refresh (e.g. after a message is sent) */
  refreshQuota: () => void;
  /** Trigger a manual subscription & quota refresh (alias) */
  refreshSubscription: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const SubscriptionContext = createContext<SubscriptionState>({
  isResolved: false,
  isPro: false,
  tier: "free",
  actionsUsed: 0,
  actionLimit: 15,
  displayQuota: "0/15 Free Limits",
  refreshQuota: () => {},
  refreshSubscription: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5-minute in-memory cache

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<SubscriptionState, "refreshQuota" | "refreshSubscription">>({
    isResolved: false,
    isPro: false,
    tier: "free",
    actionsUsed: 0,
    actionLimit: 15,
    displayQuota: "0/15 Free Limits",
  });

  const lastFetchRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  // ── Core Fetch ──────────────────────────────────────────────────────────────
  const fetchSubscriptionState = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchRef.current < CACHE_TTL_MS) return;
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    lastFetchRef.current = now;

    try {
      // 1. Get the current session access token from Supabase client
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      // 2. Build auth headers for backend requests
      const authHeaders: HeadersInit = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      // 3. Fetch live quota from GET /api/generate
      //    This is the authoritative endpoint that reads the profiles table.
      const quotaRes = await fetch("/api/generate", {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      });

      if (quotaRes.ok) {
        const data = await quotaRes.json();

        const isPro = Boolean(
          data.isPro ||
            data.tier === "pro" ||
            data.tier === "enterprise" ||
            data.tier === "admin"
        );
        const actionsUsed = typeof data.used === "number" ? data.used : 0;
        const actionLimit = isPro ? 300 : 15;

        setState({
          isResolved: true,
          isPro,
          tier: isPro ? ((data.tier as any) || "pro") : "free",
          actionsUsed,
          actionLimit,
          displayQuota: isPro
            ? `${actionsUsed}/300 Daily Pro Uses`
            : `${actionsUsed}/15 Free Limits`,
          resetAt: data.nextResetTime,
          resetCountdown: data.resetCountdown,
        });

        // Persist fast-path flag so userSubscription.ts helpers can read synchronously
        if (typeof window !== "undefined") {
          try {
            if (isPro) {
              localStorage.setItem("Prathomix_pro_status", "true");
            } else {
              localStorage.removeItem("Prathomix_pro_status");
            }
          } catch {}
        }

        isFetchingRef.current = false;
        return;
      }
    } catch (err) {
      console.warn("[SubscriptionContext] Quota fetch failed:", err);
    }

    // 4. Fallback: check /api/check-subscription
    try {
      const subRes = await fetch("/api/check-subscription", { cache: "no-store" });
      if (subRes.ok) {
        const sub = await subRes.json();
        const isPro = Boolean(
          sub.is_pro || sub.active || sub.tier === "pro" || sub.tier === "admin"
        );

        setState((prev) => ({
          ...prev,
          isResolved: true,
          isPro,
          tier: isPro ? ((sub.tier as any) || "pro") : "free",
          actionLimit: isPro ? 300 : 15,
          displayQuota: isPro
            ? `${prev.actionsUsed}/300 Daily Pro Uses`
            : `${prev.actionsUsed}/15 Free Limits`,
        }));

        if (typeof window !== "undefined") {
          try {
            if (isPro) localStorage.setItem("Prathomix_pro_status", "true");
            else localStorage.removeItem("Prathomix_pro_status");
          } catch {}
        }
        isFetchingRef.current = false;
        return;
      }
    } catch {}

    // 5. Last resort: mark as resolved with defaults
    setState((prev) => ({ ...prev, isResolved: true }));
    isFetchingRef.current = false;
  }, []);

  // ── Initial Load & Supabase Auth State Listener ─────────────────────────────
  useEffect(() => {
    fetchSubscriptionState(true);

    const supabase = createClient();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        lastFetchRef.current = 0;
        fetchSubscriptionState(true);
      } else if (event === "SIGNED_OUT") {
        lastFetchRef.current = 0;
        isFetchingRef.current = false;
        setState({
          isResolved: true,
          isPro: false,
          tier: "free",
          actionsUsed: 0,
          actionLimit: 15,
          displayQuota: "0/15 Free Limits",
        });
        try { localStorage.removeItem("Prathomix_pro_status"); } catch {}
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSubscriptionState]);

  // ── Custom Event Listener (Payment Webhook → UI Sync) ────────────────────────
  useEffect(() => {
    const handleSubChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tier === "pro" || detail?.is_pro) {
        // Optimistically update to PRO, then re-fetch for accuracy
        setState((prev) => ({
          ...prev,
          isPro: true,
          tier: "pro",
          actionLimit: 300,
          displayQuota: `${prev.actionsUsed}/300 Daily Pro Uses`,
        }));
        lastFetchRef.current = 0;
        setTimeout(() => fetchSubscriptionState(true), 800);
      }
    };

    window.addEventListener("Prathomix_subscription_change", handleSubChange);
    return () => window.removeEventListener("Prathomix_subscription_change", handleSubChange);
  }, [fetchSubscriptionState]);

  const refreshQuota = useCallback(() => {
    lastFetchRef.current = 0; // Invalidate cache
    fetchSubscriptionState(true);
  }, [fetchSubscriptionState]);

  return (
    <SubscriptionContext.Provider value={{ ...state, refreshQuota, refreshSubscription: refreshQuota }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── Consumer Hook ─────────────────────────────────────────────────────────────

/**
 * Returns the global unified subscription & quota state.
 * Must be used inside a <SubscriptionProvider>.
 */
export function useSubscription(): SubscriptionState {
  return useContext(SubscriptionContext);
}

export default SubscriptionContext;

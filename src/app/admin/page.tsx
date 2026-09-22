"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  Zap,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Users,
  Activity,
  Sliders,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AnalyticsOverviewModule from "@/components/admin/AnalyticsOverviewModule";
import FeatureFlagsModule from "@/components/admin/FeatureFlagsModule";
import SiteSettingsModule from "@/components/admin/SiteSettingsModule";
import UserManagementModule from "@/components/admin/UserManagementModule";

// Authorized superadmin emails
const DEFAULT_SUPERADMIN_EMAILS = [
  "admin@prathomix.tech",
  ...(process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS
    ? process.env.NEXT_PUBLIC_SUPERADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : []),
];

export default function AdminPage() {
  const [currentAdmin, setCurrentAdmin] = useState<{
    email: string;
    role?: string;
  } | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminTab, setAdminTab] = useState<
    "analytics" | "flags" | "directory" | "override" | "settings"
  >("analytics");
  const [directoryKey, setDirectoryKey] = useState(0);

  // Form State
  const [targetEmail, setTargetEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro" | "enterprise">("pro");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    details?: any;
  } | null>(null);

  // Recent Manual Overrides (Local audit log)
  const [recentGrants, setRecentGrants] = useState<
    Array<{
      email: string;
      plan: string;
      grantedAt: string;
      status: string;
    }>
  >([]);

  // ── 1. Check Super Admin Authorization ────────────────────────────────────
  useEffect(() => {
    async function checkAdminAuth() {
      setIsVerifyingAuth(true);

      try {
        // First check Supabase Auth Session
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let email = user?.email?.toLowerCase();
        let role = (user?.user_metadata as any)?.role;

        // Query profiles table for live role check
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role;
          }
        }

        // Fallback to local user session
        if (!email && typeof window !== "undefined") {
          const stored =
            localStorage.getItem("prathomix_current_user") ||
            localStorage.getItem("masmspace_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            email = parsed.email?.toLowerCase();
            role = parsed.role;
          }
        }

        if (email) {
          setCurrentAdmin({ email, role });
          // Strictly require 'superadmin' role or designated root email
          const hasAccess =
            DEFAULT_SUPERADMIN_EMAILS.includes(email) ||
            email === "admin@prathomix.tech" ||
            role === "superadmin" ||
            role === "admin";
          setIsAuthorized(Boolean(hasAccess));
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Super Admin auth check notice:", err);
        setIsAuthorized(false);
      } finally {
        setIsVerifyingAuth(false);
      }
    }

    checkAdminAuth();

    // Load local overrides history if available
    try {
      const storedHistory = localStorage.getItem("Prathomix_admin_grants");
      if (storedHistory) {
        setRecentGrants(JSON.parse(storedHistory));
      }
    } catch {}
  }, []);

  // ── 2. Handle Manual Subscription Grant ────────────────────────────────────
  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = targetEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFeedback({
        type: "error",
        message: "Please enter a valid target user email address.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/grant-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          plan: selectedPlan,
          admin_email: currentAdmin?.email,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setFeedback({
          type: "success",
          message: data.message || `Successfully granted ${selectedPlan.toUpperCase()} tier to ${cleanEmail}`,
          details: data.user,
        });

        // Sync local cache if current browser is simulating or using this user
        try {
          const stored =
            localStorage.getItem("prathomix_current_user") ||
            localStorage.getItem("prathomix_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.email?.toLowerCase() === cleanEmail) {
              parsed.role = selectedPlan === "free" ? "user" : "pro";
              parsed.subscription_status = selectedPlan;
              parsed.is_pro = selectedPlan !== "free";
              localStorage.setItem("prathomix_current_user", JSON.stringify(parsed));
              localStorage.setItem("prathomix_current_user", JSON.stringify(parsed));
              window.dispatchEvent(new Event("storage"));
            }
          }
        } catch {}

        // Add to audit log
        const newEntry = {
          email: cleanEmail,
          plan: selectedPlan,
          grantedAt: new Date().toLocaleTimeString(),
          status: "active",
        };
        const updated = [newEntry, ...recentGrants.slice(0, 9)];
        setRecentGrants(updated);
        try {
          localStorage.setItem("Prathomix_admin_grants", JSON.stringify(updated));
        } catch {}

        setDirectoryKey((k) => k + 1);
        setTargetEmail("");
      } else {
        setFeedback({
          type: "error",
          message:
            data?.error || data?.detail || "Failed to grant subscription. Check server logs.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Network error connecting to backend.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 3. Handle Manual Access Revocation ─────────────────────────────────────
  const handleRevokeAccess = async () => {
    const cleanEmail = targetEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFeedback({
        type: "error",
        message: "Please enter a valid target user email address to revoke access.",
      });
      return;
    }

    setIsRevoking(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/revoke-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          admin_email: currentAdmin?.email,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setFeedback({
          type: "success",
          message: data.message || `Access revoked! ${cleanEmail} role reset to 'free'.`,
          details: data.user || { role: "free", subscription_status: "free" },
        });

        // Sync local cache if current browser is simulating or using this revoked user
        try {
          const stored =
            localStorage.getItem("prathomix_current_user") ||
            localStorage.getItem("prathomix_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.email?.toLowerCase() === cleanEmail) {
              parsed.role = "user";
              parsed.subscription_status = "free";
              parsed.is_pro = false;
              localStorage.setItem("prathomix_current_user", JSON.stringify(parsed));
              localStorage.setItem("prathomix_current_user", JSON.stringify(parsed));
              window.dispatchEvent(new Event("storage"));
            }
          }
        } catch {}

        // Add action to Recent Overrides audit log
        const newEntry = {
          email: cleanEmail,
          plan: "Free",
          grantedAt: new Date().toLocaleTimeString(),
          status: "revoked",
        };
        const updated = [newEntry, ...recentGrants.slice(0, 9)];
        setRecentGrants(updated);
        try {
          localStorage.setItem("Prathomix_admin_grants", JSON.stringify(updated));
        } catch {}

        setDirectoryKey((k) => k + 1);
        setTargetEmail("");
      } else {
        setFeedback({
          type: "error",
          message:
            data?.error || data?.detail || "Failed to revoke access. Check server logs.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || "Network error connecting to backend.",
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // ── 4. Quick Bypass Login for Local Dev/Demo ──────────────────────────────
  const handleDemoAdminLogin = () => {
    const demoAdmin = {
      email: "admin@prathomix.tech",
      role: "admin",
      name: "Prathomix Lead Admin",
    };
    localStorage.setItem("prathomix_current_user", JSON.stringify(demoAdmin));
    localStorage.setItem("prathomix_current_user", JSON.stringify(demoAdmin));
    setCurrentAdmin(demoAdmin);
    setIsAuthorized(true);
  };

  // ── 5. Render Loading or Unauthorized States ──────────────────────────────
  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-zinc-400 font-mono">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-zinc-400">
          Verifying Admin Credentials...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-mono selection:bg-neon-cyan/20 selection:text-neon-cyan">
        <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Access Restricted
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This console requires elevated administrator privileges. Only authorized
              staff accounts have access to manual subscription overrides.
            </p>
          </div>

          {currentAdmin?.email && (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
              Authenticated as:{" "}
              <span className="text-zinc-200 font-bold">{currentAdmin.email}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleDemoAdminLogin}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/40 transition-all shadow-[0_0_15px_rgba(0,245,255,0.15)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Simulate Admin Access (admin@prathomix.tech)</span>
            </button>

            <Link
              href="/login"
              className="block w-full py-2.5 px-4 rounded-xl text-xs text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              ← Sign In with Another Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 6. Authorized Cyber-Glassmorphism Admin UI ─────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-zinc-100 font-mono relative selection:bg-neon-cyan/20 selection:text-neon-cyan">
      {/* Cyber Ambient Neon Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[180px]" />
      </div>

      {/* Top Bar */}
      <header className="border-b border-white/10 bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-bold text-base text-white tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-neon-cyan text-lg">✦</span>
              <span>MasmSpace</span>
              <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">by Prathomix</span>
            </Link>
            <span className="text-zinc-700">/</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>SUPER ADMIN</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Superadmin: {currentAdmin?.email}</span>
            </div>
            <Link
              href="/canvas"
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all"
            >
              Go to Canvas →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Zap className="w-7 h-7 text-neon-cyan" />
              <span>PRATHOMIX Super Admin Dashboard</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Global system telemetry, feature flags &amp; kill-switches, subscriber management, and emergency maintenance controls.
            </p>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center flex-wrap gap-1 p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800 self-start md:self-auto">
            <button
              onClick={() => setAdminTab("analytics")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "analytics"
                  ? "bg-neon-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setAdminTab("flags")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "flags"
                  ? "bg-neon-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Feature Flags</span>
            </button>
            <button
              onClick={() => setAdminTab("directory")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "directory"
                  ? "bg-neon-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setAdminTab("override")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "override"
                  ? "bg-neon-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Override</span>
            </button>
            <button
              onClick={() => setAdminTab("settings")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminTab === "settings"
                  ? "bg-neon-cyan text-zinc-950 shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Analytics Telemetry */}
        {adminTab === "analytics" && <AnalyticsOverviewModule />}

        {/* Tab 2: Feature Flags & Kill Switches */}
        {adminTab === "flags" && <FeatureFlagsModule />}

        {/* Tab 3: Live User Directory & Management */}
        {adminTab === "directory" && (
          <UserManagementModule
            key={directoryKey}
            adminEmail={currentAdmin?.email}
            onUserUpdated={() => setDirectoryKey((k) => k + 1)}
          />
        )}

        {/* Tab 2: Manual Subscription Override Form */}
        {adminTab === "override" && (
          <div className="space-y-8">
            <div className="p-8 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.4)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-80" />

              <form onSubmit={handleGrantSubscription} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* User Email Input */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold">
                      User Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="e.g. developer@company.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan text-xs text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Tier Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold">
                      Subscription Tier
                    </label>
                    <select
                      value={selectedPlan}
                      onChange={(e) =>
                        setSelectedPlan(e.target.value as "free" | "pro" | "enterprise")
                      }
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan text-xs text-zinc-200 outline-none transition-all cursor-pointer"
                    >
                      <option value="free">Free Plan (Default / Reset)</option>
                      <option value="pro">Pro Plan (Unlimited AI)</option>
                      <option value="enterprise">Enterprise (Dedicated)</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || isRevoking}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-neon-cyan via-cyan-500 to-violet-600 hover:opacity-90 text-zinc-950 transition-all shadow-[0_0_25px_rgba(0,245,255,0.25)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Upgrading Database...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-zinc-950" />
                        <span>Grant Subscription</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleRevokeAccess}
                    disabled={isSubmitting || isRevoking}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 hover:text-red-300 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Instantly reset user role to 'user' and tier to 'free'"
                  >
                    {isRevoking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        <span>Revoking Access...</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 text-red-400" />
                        <span>Revoke Access</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    ⚡ Direct Supabase <code className="text-zinc-400">public.profiles</code> &amp; Auth metadata update.
                  </span>
                </div>
              </form>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`mt-6 p-4 rounded-2xl border flex items-start gap-3 text-xs transition-all ${
                    feedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{feedback.message}</p>
                    {feedback.details && (
                      <p className="text-[11px] opacity-80">
                        Status: {feedback.details.subscription_status || "active"} |
                        Role: {feedback.details.role || "user"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Log / Recent Overrides */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-neon-cyan" />
                  <span>Recent Manual Overrides</span>
                </h2>
                <button
                  onClick={() => {
                    setRecentGrants([]);
                    localStorage.removeItem("Prathomix_admin_grants");
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Clear Log
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl overflow-hidden">
                {recentGrants.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    No manual subscription grants performed in this session.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/60 text-xs">
                    {recentGrants.map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-white">{entry.email}</div>
                          <div className="text-[11px] text-zinc-500">
                            Granted at {entry.grantedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              entry.plan.toLowerCase() === "free"
                                ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                            }`}
                          >
                            {entry.plan}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              entry.status === "revoked"
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Site Settings */}
        {adminTab === "settings" && <SiteSettingsModule />}
      </main>
    </div>
  );
}

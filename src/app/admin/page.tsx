"use client";

import React, { useState } from "react";
import Link from "next/link";
import UserManagementModule from "@/components/admin/UserManagementModule";
import SubscriptionModule from "@/components/admin/SubscriptionModule";
import SiteSettingsModule from "@/components/admin/SiteSettingsModule";

type AdminTab = "users" | "subscriptions" | "settings";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="min-h-screen bg-canvas-dark text-zinc-100 font-sans selection:bg-neon-cyan/20 selection:text-neon-cyan">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[160px]" />
      </div>

      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-bold text-lg text-white font-mono flex items-center gap-2 group"
            >
              <span className="text-neon-cyan group-hover:scale-110 transition-transform">✦</span>
              <span>MasmSpace</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
              <span>ADMIN OS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/canvas"
              className="text-xs font-mono px-3.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-neon-cyan/40 text-zinc-300 hover:text-white transition-all flex items-center gap-2"
            >
              <span>✍️</span>
              <span>Canvas Studio</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-800 text-xs font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-neon-green" />
              <span>Supabase RBAC: Enforced</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Body ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* ── Sidebar (Tabs Navigation) ───────────────────────────── */}
          <aside className="md:col-span-3 space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
                Admin Controls
              </div>

              {/* Tab: Users */}
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-mono transition-all text-left ${
                  activeTab === "users"
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_16px_rgba(0,245,255,0.15)] font-bold"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">👥</span>
                  <div>
                    <div>Users</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Roles &amp; Pro Access</div>
                  </div>
                </div>
                {activeTab === "users" && <span className="text-neon-cyan">→</span>}
              </button>

              {/* Tab: Subscriptions */}
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-mono transition-all text-left ${
                  activeTab === "subscriptions"
                    ? "bg-neon-purple/15 text-neon-purple border border-neon-purple/40 shadow-[0_0_16px_rgba(168,85,247,0.15)] font-bold"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚡</span>
                  <div>
                    <div>Subscriptions</div>
                    <div className="text-[10px] text-zinc-500 font-normal">MRR, Seats &amp; Plans</div>
                  </div>
                </div>
                {activeTab === "subscriptions" && <span className="text-neon-purple">→</span>}
              </button>

              {/* Tab: Site Settings */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-mono transition-all text-left ${
                  activeTab === "settings"
                    ? "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_16px_rgba(0,245,255,0.15)] font-bold"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚙️</span>
                  <div>
                    <div>Site Settings</div>
                    <div className="text-[10px] text-zinc-500 font-normal">Dynamic CMS &amp; Pricing</div>
                  </div>
                </div>
                {activeTab === "settings" && <span className="text-neon-cyan">→</span>}
              </button>
            </div>

            {/* Quick Admin Security Info Box */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs font-mono space-y-2">
              <div className="text-zinc-400 font-bold flex items-center gap-1.5">
                <span>🛡️</span> Security Context
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Protected by Next.js Server Middleware + Supabase Row Level Security (RLS). Mutations are restricted to verified <code className="text-neon-cyan">admin</code> roles.
              </p>
            </div>
          </aside>

          {/* ── Main Tab Content (Right 9 Cols) ────────────────────── */}
          <main className="md:col-span-9">
            {activeTab === "users" && <UserManagementModule />}
            {activeTab === "subscriptions" && <SubscriptionModule />}
            {activeTab === "settings" && <SiteSettingsModule />}
          </main>
        </div>
      </div>
    </div>
  );
}

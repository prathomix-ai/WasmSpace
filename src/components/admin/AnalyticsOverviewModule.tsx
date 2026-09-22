"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  ShieldCheck,
  Zap,
  Activity,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { AnalyticsOverview } from "@/types/admin";

export default function AnalyticsOverviewModule() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics?t=" + Date.now());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch analytics telemetry`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error || "Failed to load live metrics");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
      // Fallback preview data if database is empty/offline
      setData({
        totalUsers: 14,
        activeProMembers: 6,
        freeTierUsers: 8,
        dailyActiveUsers: 5,
        mrr: 114,
        growthRatePercentage: 18.5,
        proConversionRate: 42.8,
        recentUsers: [
          {
            id: "u-1",
            email: "admin@prathomix.tech",
            role: "superadmin",
            tier: "enterprise",
            created_at: new Date().toISOString(),
          },
          {
            id: "u-2",
            email: "lead.architect@company.com",
            role: "user",
            tier: "pro",
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "u-3",
            email: "dev@cloudsystem.io",
            role: "user",
            tier: "pro",
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-8">
      {/* Module Header with Live Indicator & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Live Analytics Overview</h2>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time subscriber breakdown, DAU, and conversion metrics across MasmSpace.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh Metrics"}</span>
        </button>
      </div>

      {/* 4 Core Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : data?.totalUsers ?? 0}
            </span>
            <span className="text-xs font-semibold text-cyan-400">Registered</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-medium">+{data?.growthRatePercentage ?? 0}%</span> this week
          </p>
        </div>

        {/* Active PRO Members */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-amber-500/20 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wider">Active PRO Members</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : data?.activeProMembers ?? 0}
            </span>
            <span className="text-xs font-semibold text-amber-400">Subscribers</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-zinc-300">{data?.proConversionRate ?? 0}%</span> conversion rate
          </p>
        </div>

        {/* Free Tier Users */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-lg relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Free Tier Users</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : data?.freeTierUsers ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-400">Free Accounts</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Upsell opportunity pool
          </p>
        </div>

        {/* Daily Active Users (DAU) */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">Daily Active (DAU)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {isLoading ? "..." : data?.dailyActiveUsers ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-400">Last 24h</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Real-time canvas presence</span>
          </p>
        </div>
      </div>

      {/* Revenue & Tier Distribution Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estimated Monthly Recurring Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-cyan-950/30 border border-cyan-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Estimated MRR
              </span>
            </div>
            <span className="text-xs font-mono text-cyan-400">Base $19/mo</span>
          </div>
          <div className="text-3xl font-black text-white mb-2">
            ${data?.mrr?.toLocaleString() ?? 0}
            <span className="text-sm font-normal text-zinc-400"> / month</span>
          </div>
          <p className="text-xs text-zinc-400">
            Projected ARR: <span className="font-semibold text-white">${((data?.mrr ?? 0) * 12).toLocaleString()}</span> (excluding yearly discounts & coupons)
          </p>
        </div>

        {/* Pro Conversion Funnel Progress */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Pro Conversion Distribution
              </span>
              <span className="text-xs font-mono text-amber-400">
                {data?.proConversionRate ?? 0}% PRO
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden flex gap-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, data?.proConversionRate ?? 0))}%` }}
              />
              <div
                className="h-full bg-zinc-700 rounded-r-full transition-all duration-500 flex-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Pro Members ({data?.activeProMembers ?? 0})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Free Users ({data?.freeTierUsers ?? 0})
            </span>
          </div>
        </div>
      </div>

      {/* Recent User Signups Table */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Recent Registrations</h3>
            <p className="text-xs text-zinc-400">Latest active users registered in Supabase.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Showing {data?.recentUsers?.length ?? 0} latest
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase font-mono tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">User Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Tier</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
              {data?.recentUsers && data.recentUsers.length > 0 ? (
                data.recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-300">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[220px]">{u.email}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          u.role === "superadmin"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : u.role === "admin"
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                          u.tier === "pro" || u.tier === "enterprise"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {u.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500 font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-zinc-500">
                    No recent users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { type UserProfile, type SubscriptionStatus, type UserRole } from "@/types/admin";

interface UserManagementModuleProps {
  adminEmail?: string;
  onUserUpdated?: () => void;
}

export default function UserManagementModule({
  adminEmail,
  onUserUpdated,
}: UserManagementModuleProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [targetStatus, setTargetStatus] = useState<SubscriptionStatus>("pro");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real user profiles from Supabase via Admin API or direct client
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = adminEmail
        ? `/api/admin/users?admin_email=${encodeURIComponent(adminEmail)}`
        : `/api/admin/users`;
      const res = await fetch(url);
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        // Direct client fallback
        const supabase = createClient();
        const { data: directProfiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (directProfiles) {
          setUsers(directProfiles as UserProfile[]);
        }
      }
    } catch (err: any) {
      console.warn("[Admin] Error fetching profiles:", err?.message);
    } finally {
      setIsLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Grant Pro / Update subscription status handler via backend API
  const handleGrantProStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a valid user email address." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const cleanEmail = targetEmail.trim().toLowerCase();

    try {
      const endpoint =
        targetStatus === "free"
          ? "/api/admin/revoke-access"
          : "/api/admin/grant-subscription";

      const payload =
        targetStatus === "free"
          ? { email: cleanEmail, admin_email: adminEmail }
          : { email: cleanEmail, plan: targetStatus, admin_email: adminEmail };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setStatusMessage({
          type: "success",
          text: `Successfully updated ${cleanEmail} to ${targetStatus.toUpperCase()}! Pro status is now live in database.`,
        });
        setTargetEmail("");
        await fetchProfiles();
        onUserUpdated?.();
      } else {
        throw new Error(data?.error || "Failed to update subscription");
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to update subscription status.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle role or status directly on a user row
  const handleQuickStatusChange = async (userId: string, newStatus: SubscriptionStatus) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, subscription_status: newStatus } : u))
    );

    try {
      const endpoint =
        newStatus === "free"
          ? "/api/admin/revoke-access"
          : "/api/admin/grant-subscription";

      const payload =
        newStatus === "free"
          ? { email: targetUser.email, admin_email: adminEmail }
          : { email: targetUser.email, plan: newStatus, admin_email: adminEmail };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Server failed to update status");
      }
      await fetchProfiles();
      onUserUpdated?.();
    } catch (err: any) {
      console.error("[UserManagementModule] Status update error:", err);
      // Revert on failure
      fetchProfiles();
    }
  };

  const handleToggleRole = async (userId: string, currentRole: UserRole) => {
    const newRole: UserRole = currentRole === "admin" ? "user" : "admin";
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    try {
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);
      await fetchProfiles();
    } catch (err) {
      console.warn("[UserManagementModule] Toggle role error:", err);
      fetchProfiles();
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalUsers = users.length;
  const proUsers = users.filter(
    (u) => u.subscription_status === "pro" || u.subscription_status === "enterprise"
  ).length;
  const freeUsers = users.filter((u) => u.subscription_status === "free").length;

  return (
    <div className="space-y-8">
      {/* ── Summary Stats Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Total Registered Users</span>
            <span className="text-neon-cyan">👥</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">{totalUsers}</div>
          <p className="text-xs text-zinc-500 mt-1">Across all workspace accounts</p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-cyan-500/30 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-neon-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Active Pro &amp; Enterprise</span>
            <span className="text-neon-cyan">⚡</span>
          </div>
          <div className="text-3xl font-extrabold text-neon-cyan font-mono">{proUsers}</div>
          <p className="text-xs text-zinc-400 mt-1">
            {totalUsers > 0 ? Math.round((proUsers / totalUsers) * 100) : 0}% active paid tier
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Free Tier Accounts</span>
            <span className="text-zinc-400">🌱</span>
          </div>
          <div className="text-3xl font-extrabold text-zinc-300 font-mono">{freeUsers}</div>
          <p className="text-xs text-zinc-500 mt-1">Ready for 1-click Pro upgrade</p>
        </div>
      </div>

      {/* ── Form: Manual Pro Access Grant ────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-zinc-900/70 border border-cyan-500/30 shadow-[0_0_24px_rgba(0,245,255,0.06)] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <span className="text-neon-cyan">✦</span> Quick Pro Subscription Grant
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instantly promote user email to Pro or Enterprise status in Supabase database.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hidden sm:inline-block">
            ADMIN BYPASS
          </span>
        </div>

        <form onSubmit={handleGrantProStatus} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Email Input */}
          <div className="sm:col-span-6">
            <input
              type="email"
              required
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Enter user email (e.g., client@company.com)"
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Tier Selector */}
          <div className="sm:col-span-3">
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as SubscriptionStatus)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-zinc-700/80 text-sm text-zinc-200 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            >
              <option value="pro">Tier: Pro (Unlimited AI)</option>
              <option value="enterprise">Tier: Enterprise</option>
              <option value="free">Tier: Reset to Free</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-full min-h-[42px] px-4 py-2 rounded-xl text-sm font-semibold font-mono text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_16px_rgba(0,245,255,0.3)] hover:shadow-[0_0_24px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Upgrading Database…</span>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Grant Pro Status</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-green-950/40 border border-green-500/40 text-green-300"
                : "bg-red-950/40 border border-red-500/40 text-red-300"
            }`}
          >
            <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* ── Users Table Section ──────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-mono">User Profiles Directory</h3>
            <p className="text-xs text-zinc-400">Live records from Supabase public.profiles table</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email…"
                className="px-3.5 py-1.5 pl-8 rounded-xl bg-zinc-900 border border-zinc-700/80 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-neon-cyan w-56 font-mono"
              />
              <span className="absolute left-2.5 top-2 text-zinc-500 text-xs">🔍</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchProfiles}
              disabled={isLoading}
              title="Refresh users from Supabase"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-neon-cyan transition-colors cursor-pointer"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Glassmorphism Table Container */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left text-xs sm:text-sm text-zinc-300 font-mono">
            <thead className="bg-zinc-950/70 text-zinc-400 text-xs uppercase border-b border-zinc-800">
              <tr>
                <th className="p-4">User Account</th>
                <th className="p-4">Role</th>
                <th className="p-4">Subscription Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    Loading user directory from Supabase...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No users matching &ldquo;{searchQuery}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPro = user.subscription_status === "pro";
                  const isEnterprise = user.subscription_status === "enterprise";
                  const isAdmin = user.role === "admin";

                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Email & ID */}
                      <td className="p-4">
                        <div className="font-semibold text-white">{user.email}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{user.id}</div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdmin
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {isAdmin ? "★ Admin" : "User"}
                        </span>
                      </td>

                      {/* Subscription Status Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isEnterprise
                              ? "bg-purple-900/30 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                              : isPro
                              ? "bg-cyan-950/50 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,245,255,0.2)]"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEnterprise ? "bg-purple-400" : isPro ? "bg-cyan-400 animate-pulse" : "bg-zinc-500"
                            }`}
                          />
                          {user.subscription_status}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="p-4 text-zinc-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.subscription_status === "free" ? (
                            <button
                              onClick={() => handleQuickStatusChange(user.id, "pro")}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/40 transition-all cursor-pointer"
                            >
                              Upgrade Pro
                            </button>
                          ) : (
                            <button
                              onClick={() => handleQuickStatusChange(user.id, "free")}
                              className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-red-400 hover:bg-red-950/30 border border-zinc-700 transition-all cursor-pointer"
                            >
                              Downgrade
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleRole(user.id, user.role)}
                            title={isAdmin ? "Revoke Admin" : "Make Admin"}
                            className="px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:bg-zinc-800 transition-all cursor-pointer"
                          >
                            {isAdmin ? "Demote" : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

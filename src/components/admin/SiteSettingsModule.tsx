"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { type SiteSettings } from "@/types/admin";

const DEFAULT_SETTINGS: SiteSettings = {
  id: "landing_page",
  hero_headline: "The Infinite AI Canvas for Modern Teams & Thinkers.",
  hero_subheadline:
    "Draw, code, present, and brainstorm. Let our AI auto-correct your shapes, generate code from text, and summarize your meetings in real-time.",
  cta_text: "Start Your Free Canvas",
  pro_price_monthly: 19,
  pro_price_yearly: 190,
  announcement_banner: "⚡ MasmSpace 2.4 (Powered by Prathomix) with WebAssembly Python & Infinite Canvas Engine is Live!",
};

export default function SiteSettingsModule() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch current site settings from Supabase
  const fetchSettings = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "landing_page")
        .single();

      if (!error && data) {
        setSettings({
          id: data.id,
          hero_headline: data.hero_headline || DEFAULT_SETTINGS.hero_headline,
          hero_subheadline: data.hero_subheadline || DEFAULT_SETTINGS.hero_subheadline,
          cta_text: data.cta_text || DEFAULT_SETTINGS.cta_text,
          pro_price_monthly: Number(data.pro_price_monthly) || DEFAULT_SETTINGS.pro_price_monthly,
          pro_price_yearly: Number(data.pro_price_yearly) || DEFAULT_SETTINGS.pro_price_yearly,
          announcement_banner: data.announcement_banner || DEFAULT_SETTINGS.announcement_banner,
          updated_at: data.updated_at,
        });
      }
    } catch {
      // Offline fallback
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save changes to Supabase site_settings table
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const supabase = createClient();
      const payload = {
        id: "landing_page",
        hero_headline: settings.hero_headline,
        hero_subheadline: settings.hero_subheadline,
        cta_text: settings.cta_text,
        pro_price_monthly: Number(settings.pro_price_monthly),
        pro_price_yearly: Number(settings.pro_price_yearly),
        announcement_banner: settings.announcement_banner,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("site_settings")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        throw error;
      }

      setStatusMessage({
        type: "success",
        text: "Site settings successfully persisted to Supabase database!",
      });
    } catch {
      // Local fallback for offline preview
      setStatusMessage({
        type: "success",
        text: "[Saved to Local State] Settings updated. (Connect live Supabase for DB persistence).",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <span className="text-neon-cyan">✦</span> Dynamic CMS &amp; Landing Page Controller
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Update marketing copy, headlines, and SaaS pricing in real-time across the platform.
          </p>
        </div>
        {settings.updated_at && (
          <div className="text-xs font-mono text-zinc-500">
            Last saved: {new Date(settings.updated_at).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Settings Form (Left / 7 cols) ─────────────────────────── */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* Announcement Banner */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Announcement Banner Text
            </label>
            <input
              type="text"
              value={settings.announcement_banner || ""}
              onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
              placeholder="e.g., ⚡ MasmSpace v2.4 (Powered by Prathomix) is live with Pyodide & Voice Control"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Hero Headline */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Hero Headline (Main H1)
            </label>
            <textarea
              rows={2}
              value={settings.hero_headline}
              onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Hero Subheadline */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Hero Subheadline
            </label>
            <textarea
              rows={3}
              value={settings.hero_subheadline}
              onChange={(e) => setSettings({ ...settings, hero_subheadline: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Primary CTA Button Text */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Primary Call To Action (CTA) Button
            </label>
            <input
              type="text"
              value={settings.cta_text}
              onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
            />
          </div>

          {/* Pricing Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Pro Monthly Price ($ / mo)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={settings.pro_price_monthly}
                  onChange={(e) =>
                    setSettings({ ...settings, pro_price_monthly: Number(e.target.value) })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Pro Yearly Price ($ / yr)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-zinc-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  value={settings.pro_price_yearly}
                  onChange={(e) =>
                    setSettings({ ...settings, pro_price_yearly: Number(e.target.value) })
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-100 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Notification Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-green-950/40 border border-green-500/40 text-green-300"
                  : "bg-red-950/40 border border-red-500/40 text-red-300"
              }`}
            >
              <span>{statusMessage.type === "success" ? "✓" : "⚠️"}</span>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl font-mono text-sm font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_24px_rgba(0,245,255,0.35)] hover:shadow-[0_0_36px_rgba(0,245,255,0.55)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Database…</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Site Settings</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Live Preview Card (Right / 5 cols) ────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Live Landing Preview
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              WYSIWYG Mode
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

            {/* Simulated Announcement */}
            {settings.announcement_banner && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                {settings.announcement_banner}
              </div>
            )}

            {/* Simulated Hero Headline */}
            <h4 className="text-lg sm:text-xl font-extrabold text-white font-mono leading-snug">
              {settings.hero_headline || "Your Headline Here"}
            </h4>

            {/* Simulated Subheadline */}
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {settings.hero_subheadline || "Your subheadline copy here."}
            </p>

            {/* Simulated CTA Button */}
            <div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-black bg-neon-cyan shadow-[0_0_16px_rgba(0,245,255,0.4)] pointer-events-none"
              >
                {settings.cta_text || "Call to Action"}
              </button>
            </div>

            {/* Simulated Pricing Callout */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Pro Subscription:</span>
              <span className="text-neon-cyan font-bold">
                ${settings.pro_price_monthly} / mo (${settings.pro_price_yearly} / yr)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

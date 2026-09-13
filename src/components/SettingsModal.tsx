"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Grid,
  Sparkles,
  Languages,
  AlertTriangle,
  Trash2,
  X,
  Check,
  Moon,
  Sun,
  Laptop,
  Sliders,
  Save,
  CreditCard,
  Plug,
  GitBranch,
  FileText,
  Crown,
  ExternalLink,
  ZoomIn,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { AIUsageTracker } from "./AIUsageTracker";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData?: () => void;
  onOpenUpgradeModal?: () => void;
  actionsUsed?: number;
  actionLimit?: number;
  tier?: string;
}

type TabType =
  | "profile"
  | "canvas"
  | "ai"
  | "appearance"
  | "billing"
  | "integrations"
  | "danger";

export function SettingsModal({
  isOpen,
  onClose,
  onClearAllData,
  onOpenUpgradeModal,
  actionsUsed = 4,
  actionLimit = 15,
  tier = "free",
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Profile Settings State (Dynamically populated from Supabase Auth)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas Settings State
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [canvasScale, setCanvasScale] = useState(100);

  // AI Features State
  const [summarizationLanguage, setSummarizationLanguage] = useState("English (US)");
  const [autoShapeCorrection, setAutoShapeCorrection] = useState(true);

  // Integrations State
  const [githubSync, setGithubSync] = useState(false);
  const [notionExport, setNotionExport] = useState(false);

  // Danger Zone Confirmation State
  const [confirmClear, setConfirmClear] = useState(false);
  const [dataCleared, setDataCleared] = useState(false);

  // Fetch live user from Supabase Auth
  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      if (!isOpen) return;
      setIsLoadingUser(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "";
          setName(fullName);
          setEmail(user.email || "");
          setIsLoadingUser(false);
          return;
        }
      } catch (err) {
        console.warn("[SettingsModal] Supabase getUser fallback:", err);
      }

      // Fallback to local storage if running in guest / local mode
      if (typeof window !== "undefined" && isMounted) {
        try {
          const stored = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            setName(parsed.name || (parsed.email ? parsed.email.split("@")[0] : ""));
            setEmail(parsed.email || "");
          }
        } catch {}
      }

      if (isMounted) {
        setIsLoadingUser(false);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { full_name: name },
      });
    } catch (err) {
      console.warn("[SettingsModal] Supabase updateUser fallback:", err);
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
        const parsed = stored ? JSON.parse(stored) : {};
        const updated = JSON.stringify({ ...parsed, name, email });
        localStorage.setItem("masmspace_current_user", updated);
      } catch {}
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExecuteClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    if (onClearAllData) {
      onClearAllData();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }
    setDataCleared(true);
    setTimeout(() => {
      setDataCleared(false);
      setConfirmClear(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      {/* ── Glass Backdrop ──────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-[#050505]/75 backdrop-blur-xl transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Main Modal Container (Glassmorphism Card) ────────────────────── */}
      <div className="relative w-[95%] md:max-w-2xl mx-auto max-h-[90vh] flex flex-col rounded-3xl bg-white/95 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden z-10 transition-all text-zinc-900 dark:text-zinc-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-600 dark:text-neon-cyan border border-cyan-500/20 dark:border-neon-cyan/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base sm:text-lg font-mono font-bold tracking-tight">
                Settings &amp; Preferences
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure your workspace, AI engine, and personal profile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-neon-cyan cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Tab List + Right Tab Content */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-[420px] overflow-hidden">
          {/* Left Vertical Tab List */}
          <nav
            aria-label="Settings navigation"
            className="w-full sm:w-52 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible shrink-0"
          >
            {/* Profile Tab */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "profile"
                  ? "bg-cyan-500/15 dark:bg-neon-cyan/20 text-cyan-700 dark:text-neon-cyan border border-cyan-500/30 dark:border-neon-cyan/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile</span>
            </button>

            {/* Canvas Tab */}
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "canvas"
                  ? "bg-cyan-500/15 dark:bg-neon-cyan/20 text-cyan-700 dark:text-neon-cyan border border-cyan-500/30 dark:border-neon-cyan/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>Canvas</span>
            </button>

            {/* AI Features Tab */}
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "ai"
                  ? "bg-purple-500/15 dark:bg-neon-purple/20 text-purple-700 dark:text-neon-purple border border-purple-500/30 dark:border-neon-purple/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>AI Features</span>
            </button>

            {/* Appearance Tab (Sun/Moon) */}
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "appearance"
                  ? "bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Sun className="w-4 h-4 shrink-0" />
              <span>Appearance</span>
            </button>

            {/* Billing & Plan Tab (Credit Card) */}
            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "billing"
                  ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Billing &amp; Plan</span>
            </button>

            {/* Integrations Tab (Plug/Link) */}
            <button
              onClick={() => setActiveTab("integrations")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "integrations"
                  ? "bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 dark:border-indigo-500/40 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Plug className="w-4 h-4 shrink-0" />
              <span>Integrations</span>
            </button>

            {/* Danger Zone Tab */}
            <button
              onClick={() => setActiveTab("danger")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap sm:mt-auto cursor-pointer ${
                activeTab === "danger"
                  ? "bg-red-500/15 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-500/40 shadow-sm"
                  : "text-red-500/80 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Danger Zone</span>
            </button>
          </nav>

          {/* Right Tab Content Viewport */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* 1. Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-5 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm tracking-tight">Public Profile</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Your authenticated account identity and multiplayer display details.
                  </p>
                </div>

                {isLoadingUser ? (
                  /* Skeleton Loader while Supabase data is resolving */
                  <div className="space-y-4 animate-pulse pt-2">
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 bg-black/10 dark:bg-white/10 rounded" />
                      <div className="h-10 w-full bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3.5 w-28 bg-black/10 dark:bg-white/10 rounded" />
                      <div className="h-10 w-full bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Full Name Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-cyan-500 dark:focus:border-neon-cyan focus:ring-1 focus:ring-cyan-500 dark:focus:ring-neon-cyan outline-none transition-all placeholder:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Email Address Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-cyan-500 dark:focus:border-neon-cyan focus:ring-1 focus:ring-cyan-500 dark:focus:ring-neon-cyan outline-none transition-all placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  {savedSuccess ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                      <Check className="w-3.5 h-3.5" /> Changes saved successfully!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={isSaving || isLoadingUser}
                    className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* 2. Canvas Tab */}
            {activeTab === "canvas" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm tracking-tight">Canvas Customization</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Control precision snapping and workspace matrix rules.
                  </p>
                </div>

                {/* Snap to Grid Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs sm:text-sm font-mono font-bold">Snap to Grid</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Automatically aligns shapes and connectors to a 20px grid matrix.
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={snapToGrid}
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 ${
                      snapToGrid ? "bg-neon-cyan" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        snapToGrid ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 3. AI Features Tab */}
            {activeTab === "ai" && (
              <div className="space-y-6 animate-fade-in">
                {/* Live AI Usage & Quota Tracker */}
                <AIUsageTracker
                  actionsUsed={actionsUsed}
                  actionLimit={actionLimit}
                  tier={tier}
                  onOpenUpgradeModal={() => {
                    onClose();
                    onOpenUpgradeModal?.();
                  }}
                />

                <div className="space-y-1 pt-2">
                  <h3 className="font-mono font-bold text-sm tracking-tight">AI &amp; Smart Assistants</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Configure machine learning summarization language and real-time geometry snapping.
                  </p>
                </div>

                {/* Summarization Language Dropdown */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-purple-500 dark:text-neon-purple" />
                    <span>Summarization Language</span>
                  </label>
                  <select
                    value={summarizationLanguage}
                    onChange={(e) => setSummarizationLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-purple-500 dark:focus:border-neon-purple focus:ring-1 focus:ring-purple-500 outline-none transition-all text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish (Español)">Spanish (Español)</option>
                    <option value="French (Français)">French (Français)</option>
                    <option value="German (Deutsch)">German (Deutsch)</option>
                    <option value="Japanese (日本語)">Japanese (日本語)</option>
                    <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                    <option value="Mandarin (中文)">Mandarin (中文)</option>
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    The Board Brain LLM synthesizes whiteboard nodes and transcripts in this language.
                  </p>
                </div>

                {/* Auto-Shape Correction Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-neon-purple" />
                      <span>Auto-Shape Correction</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Snap freehand sketches to mathematically perfect rectangles, ellipses, and arrows.
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoShapeCorrection}
                    onClick={() => setAutoShapeCorrection(!autoShapeCorrection)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neon-purple/40 ${
                      autoShapeCorrection ? "bg-neon-purple" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        autoShapeCorrection ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 4. Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm tracking-tight">Appearance &amp; Display</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Customize system palettes and workspace canvas visual scaling.
                  </p>
                </div>

                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Theme (Light / Dark / System)</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Light Button */}
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-cyan-500 dark:border-neon-cyan bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-700 dark:text-neon-cyan font-bold shadow-sm"
                          : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:border-black/20 dark:hover:border-white/20"
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span>Light</span>
                    </button>

                    {/* Dark Button */}
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-cyan-500 dark:border-neon-cyan bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-700 dark:text-neon-cyan font-bold shadow-sm"
                          : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:border-black/20 dark:hover:border-white/20"
                      }`}
                    >
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <span>Dark</span>
                    </button>

                    {/* System Button */}
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "system"
                          ? "border-cyan-500 dark:border-neon-cyan bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-700 dark:text-neon-cyan font-bold shadow-sm"
                          : "border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:border-black/20 dark:hover:border-white/20"
                      }`}
                    >
                      <Laptop className="w-5 h-5 text-zinc-400" />
                      <span>System</span>
                    </button>
                  </div>
                </div>

                {/* Canvas UI Scale Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-cyan-500 dark:text-neon-cyan" />
                        <span>Canvas UI Scale</span>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Adjust the interface element scaling and toolbar sizing.
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                      {canvasScale}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={80}
                    max={120}
                    step={5}
                    value={canvasScale}
                    onChange={(e) => setCanvasScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 dark:accent-neon-cyan"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Compact (80%)</span>
                    <span>Default (100%)</span>
                    <span>Spacious (120%)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Billing & Plan Tab */}
            {activeTab === "billing" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm tracking-tight">Billing &amp; Subscription</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Manage your subscription tier, billing cycle, and AI quota limits.
                  </p>
                </div>

                {/* Active Tier Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 dark:from-white/[0.04] dark:to-white/[0.08] border border-black/10 dark:border-white/10 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-mono font-bold text-base text-zinc-900 dark:text-white">
                          {tier === "pro" ? "MasmSpace Pro Plan" : "Starter Plan"}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border ${
                            tier === "pro"
                              ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                              : "bg-cyan-500/15 text-cyan-600 dark:text-neon-cyan border-cyan-500/30"
                          }`}
                        >
                          {tier === "pro" ? "Active" : "Free Tier"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tier === "pro"
                          ? "All enterprise superpowers enabled with priority Groq AI acceleration."
                          : "Standard access with daily limited actions. Upgrade to unlock full speed."}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-500/10 dark:bg-neon-cyan/15 text-cyan-600 dark:text-neon-cyan border border-cyan-500/20 dark:border-neon-cyan/30 shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>

                  {/* AI Usage Quota Display */}
                  <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-500 dark:text-zinc-400">AI Usage Quota Limit</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {actionsUsed} / {tier === "pro" ? "250 Actions (Pro)" : `${actionLimit} Actions (Starter)`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tier === "pro"
                            ? "bg-gradient-to-r from-cyan-500 to-indigo-500"
                            : "bg-gradient-to-r from-cyan-400 to-cyan-600"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (actionsUsed / (tier === "pro" ? 250 : actionLimit)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 flex items-center gap-3">
                    {tier === "pro" ? (
                      <button
                        type="button"
                        onClick={() => {
                          window.open("https://billing.stripe.com/p/login/test", "_blank");
                        }}
                        className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Manage Subscription</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenUpgradeModal?.();
                        }}
                        className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Upgrade to Pro ($49/yr)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm tracking-tight">Ecosystem &amp; Integrations</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Connect your whiteboard workflows directly to external developer and productivity tools.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* GitHub Repository Sync */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-zinc-800 text-white shrink-0">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-mono font-bold">GitHub Repository Sync</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Commit architecture schematics and Excalidraw diagrams directly into your git repo.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={githubSync}
                      onClick={() => setGithubSync(!githubSync)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        githubSync ? "bg-neon-cyan" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          githubSync ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Notion Export */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-zinc-800 text-white shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-mono font-bold">Notion Export</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Embed live interactive board sessions into company wikis and Notion team pages.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={notionExport}
                      onClick={() => setNotionExport(!notionExport)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notionExport ? "bg-neon-cyan" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          notionExport ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Danger Zone Tab */}
            {activeTab === "danger" && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-1">
                  <h3 className="font-mono font-bold text-sm text-red-600 dark:text-red-400 tracking-tight">
                    Danger Zone
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Irreversible actions that purge local cache and saved whiteboard sessions.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 dark:bg-red-950/20 border border-red-500/20 dark:border-red-500/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-mono font-bold text-red-600 dark:text-red-300">
                        Purge All Local Boards &amp; Cache
                      </h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        This action will immediately erase all whiteboard canvas elements, local files, Python execution history, and custom presets from this browser. This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    {dataCleared ? (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold text-center">
                        ✓ All Local Data Has Been Cleared
                      </div>
                    ) : confirmClear ? (
                      <div className="space-y-2">
                        <p className="text-xs font-mono font-bold text-red-500">
                          Are you completely sure? Click confirm to proceed.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleExecuteClear}
                            className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-[0_0_16px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Confirm &amp; Erase Everything</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClear(false)}
                            className="px-3 py-2 rounded-xl font-mono text-xs font-medium text-zinc-400 hover:text-white bg-black/10 dark:bg-white/10 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleExecuteClear}
                        className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold text-white bg-red-600/90 hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All Data</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;

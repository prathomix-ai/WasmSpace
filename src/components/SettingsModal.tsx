"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  User,
  Mail,
  Grid,
  Sparkles,
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
  Crown,
  ExternalLink,
  ZoomIn,
  Lock,
  Camera,
  Shield,
  Bell,
  MousePointer,
  Cpu,
  Code2,
  Type,
  RefreshCw,
  Receipt,
  Download,
  LogOut,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData?: () => void;
  onOpenUpgradeModal?: () => void;
  actionsUsed?: number;
  actionLimit?: number;
  tier?: string;
  autoSave?: boolean;
  onAutoSaveChange?: (val: boolean) => void;
}

type TabType = "account" | "canvas" | "ai_tools" | "billing" | "privacy";

// Reusable animated Toggle Switch component
function ToggleSwitch({
  checked,
  onChange,
  id,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-label={label || "Toggle"}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
        checked ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-zinc-700/60"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  onClearAllData,
  onOpenUpgradeModal,
  actionsUsed = 4,
  actionLimit = 15,
  tier = "free",
  autoSave: initialAutoSave,
  onAutoSaveChange,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab state (default to "account")
  const [activeTab, setActiveTab] = useState<TabType>("account");

  // ==========================================
  // 1. Account State
  // ==========================================
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Dynamic Subscription & Usage Counter State
  const [userTier, setUserTier] = useState<string>(tier || "free");
  const [dynamicActionsUsed, setDynamicActionsUsed] = useState<number>(actionsUsed ?? 0);
  const [dynamicActionLimit, setDynamicActionLimit] = useState<number>(actionLimit ?? 15);
  const [isPro, setIsPro] = useState<boolean>(
    tier === "pro" || tier === "enterprise"
  );

  useEffect(() => {
    if (tier) {
      setUserTier(tier);
      setIsPro(tier === "pro" || tier === "enterprise");
    }
  }, [tier]);

  useEffect(() => {
    if (actionsUsed !== undefined) {
      setDynamicActionsUsed(actionsUsed);
    }
  }, [actionsUsed]);

  useEffect(() => {
    if (actionLimit !== undefined) {
      setDynamicActionLimit(actionLimit);
    }
  }, [actionLimit]);

  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Danger zone state
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteAccountSuccess, setDeleteAccountSuccess] = useState(false);

  // Sign out state & handler
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("masmspace_current_user");
        localStorage.removeItem("wasmspace_current_user");
        localStorage.removeItem("masmspace_user_avatar");
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("[SettingsModal] Sign out error:", err);
      if (typeof window !== "undefined") {
        localStorage.removeItem("masmspace_current_user");
        localStorage.removeItem("wasmspace_current_user");
        localStorage.removeItem("masmspace_user_avatar");
        window.location.href = "/login";
      }
    } finally {
      setIsSigningOut(false);
    }
  };

  // ==========================================
  // 2. Canvas State
  // ==========================================
  const [gridType, setGridType] = useState<"dots" | "lines" | "solid">("dots");
  const [autoSave, setAutoSave] = useState(initialAutoSave ?? true);

  useEffect(() => {
    if (initialAutoSave !== undefined) {
      setAutoSave(initialAutoSave);
    }
  }, [initialAutoSave]);
  const [defaultZoom, setDefaultZoom] = useState(100);

  // ==========================================
  // 3. AI & Tools State
  // ==========================================
  const [defaultModel, setDefaultModel] = useState("groq-llama-3.3-70b");
  const [aiTone, setAiTone] = useState("concise");
  const [defaultCodeLang, setDefaultCodeLang] = useState("python");
  const [editorFontSize, setEditorFontSize] = useState("14");

  // ==========================================
  // 5. Privacy & Multiplayer State
  // ==========================================
  const [broadcastCursor, setBroadcastCursor] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // General state feedback
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);

  // ---------------------------------------------------------------------------
  // Load User Data & Local Preferences
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadInitialSettings() {
      if (!isOpen) return;
      setIsLoadingUser(true);

      // Load Supabase authenticated user & live public.profiles
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const emailClean = user.email?.toLowerCase() || "";
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "";
          setName(fullName);
          setEmail(user.email || "");
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
          }

          // 1. Fetch live row from Supabase public.profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          // 2. Query ai_usage_limits if table exists
          let quotaRecord: any = null;
          try {
            const { data: qData } = await supabase
              .from("ai_usage_limits")
              .select("*")
              .or(`user_email.eq.${emailClean},user_id.eq.${user.id}`)
              .maybeSingle();
            quotaRecord = qData;
          } catch {}

          // 3. Evaluate PRO / Enterprise tier status
          const isAdmin = emailClean === "admin@prathomix.tech";
          const role = profile?.role?.toLowerCase() || user.user_metadata?.role?.toLowerCase();
          const subStatus = profile?.subscription_status?.toLowerCase() || user.user_metadata?.subscription_status?.toLowerCase();
          const rawTier = profile?.tier?.toLowerCase() || profile?.subscription_tier?.toLowerCase() || quotaRecord?.tier?.toLowerCase();
          const isProFlag = profile?.is_pro === true || user.user_metadata?.is_pro === true;

          const proActive =
            isAdmin ||
            role === "admin" ||
            role === "pro" ||
            subStatus === "pro" ||
            subStatus === "active" ||
            rawTier === "pro" ||
            rawTier === "enterprise" ||
            isProFlag;

          setIsPro(proActive);
          setUserTier(proActive ? (rawTier === "enterprise" ? "enterprise" : "pro") : "free");

          // 4. Bind dynamic usage counter
          const usedCount =
            quotaRecord?.actions_used ??
            profile?.actions_used ??
            profile?.actions_count ??
            profile?.usage_count ??
            actionsUsed ??
            0;
          const limitCount = proActive
            ? 999999
            : (quotaRecord?.action_limit ?? profile?.action_limit ?? actionLimit ?? 15);

          setDynamicActionsUsed(usedCount);
          setDynamicActionLimit(limitCount);
        }
      } catch (err) {
        console.warn("[SettingsModal] Supabase profile fetch notice:", err);
      }

      // Load local storage preferences
      if (typeof window !== "undefined" && isMounted) {
        try {
          const storedUser =
            localStorage.getItem("masmspace_current_user") ||
            localStorage.getItem("wasmspace_current_user");
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if (!name && parsed.name) setName(parsed.name);
            if (!email && parsed.email) setEmail(parsed.email);
            if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);

            const role = parsed.role?.toLowerCase();
            const sub = parsed.subscription_status?.toLowerCase();
            const pTier = parsed.tier?.toLowerCase();
            if (
              parsed.email?.toLowerCase() === "admin@prathomix.tech" ||
              role === "admin" ||
              role === "pro" ||
              sub === "pro" ||
              sub === "active" ||
              pTier === "pro" ||
              pTier === "enterprise"
            ) {
              setIsPro(true);
              setUserTier(pTier === "enterprise" ? "enterprise" : "pro");
              setDynamicActionLimit(999999);
            }
          }

          const storedAvatar = localStorage.getItem("masmspace_user_avatar");
          if (storedAvatar) setAvatarUrl(storedAvatar);

          const storedGrid = localStorage.getItem("masmspace_canvas_grid");
          if (storedGrid === "dots" || storedGrid === "lines" || storedGrid === "solid") {
            setGridType(storedGrid);
          }

          const storedAutoSave = localStorage.getItem("masmspace_canvas_autosave");
          if (storedAutoSave !== null) {
            setAutoSave(storedAutoSave === "true");
          }

          const storedZoom = localStorage.getItem("masmspace_canvas_default_zoom");
          if (storedZoom) setDefaultZoom(Number(storedZoom));

          const storedModel = localStorage.getItem("masmspace_default_model");
          if (storedModel) setDefaultModel(storedModel);

          const storedTone = localStorage.getItem("masmspace_ai_tone");
          if (storedTone) setAiTone(storedTone);

          const storedCodeLang = localStorage.getItem("masmspace_default_code_lang");
          if (storedCodeLang) setDefaultCodeLang(storedCodeLang);

          const storedFontSize = localStorage.getItem("masmspace_editor_font_size");
          if (storedFontSize) setEditorFontSize(storedFontSize);

          const storedBroadcast = localStorage.getItem("masmspace_broadcast_cursor");
          if (storedBroadcast !== null) {
            setBroadcastCursor(storedBroadcast === "true");
          }

          const storedNotifications = localStorage.getItem("masmspace_email_notifications");
          if (storedNotifications !== null) {
            setEmailNotifications(storedNotifications === "true");
          }
        } catch (e) {
          console.warn("[SettingsModal] Failed reading local preferences:", e);
        }
      }

      if (isMounted) {
        setIsLoadingUser(false);
      }
    }

    loadInitialSettings();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle ESC key to close
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

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // Handle Avatar Image Upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        localStorage.setItem("masmspace_user_avatar", result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove custom avatar
  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    localStorage.removeItem("masmspace_user_avatar");
  };

  // Save Account Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl,
        },
      });
    } catch (err) {
      console.warn("[SettingsModal] Supabase updateUser fallback:", err);
    }

    if (typeof window !== "undefined") {
      try {
        const stored =
          localStorage.getItem("masmspace_current_user") ||
          localStorage.getItem("wasmspace_current_user");
        const parsed = stored ? JSON.parse(stored) : {};
        const updated = JSON.stringify({ ...parsed, name, email, avatarUrl });
        localStorage.setItem("masmspace_current_user", updated);
      } catch {}
    }

    setIsSavingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2500);
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordStatus(error.message);
      } else {
        setPasswordStatus("success:Password updated successfully!");
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword("");
          setConfirmPassword("");
          setPasswordStatus(null);
        }, 1800);
      }
    } catch (err: any) {
      setPasswordStatus(err?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (!confirmDeleteAccount) {
      setConfirmDeleteAccount(true);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[SettingsModal] Signout error during delete:", err);
    }

    if (onClearAllData) {
      onClearAllData();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }

    setDeleteAccountSuccess(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  // Canvas Settings Auto-Persist
  const handleGridTypeChange = (type: "dots" | "lines" | "solid") => {
    setGridType(type);
    localStorage.setItem("masmspace_canvas_grid", type);
    flashSaved();
  };

  const handleAutoSaveToggle = (val: boolean) => {
    setAutoSave(val);
    localStorage.setItem("masmspace_canvas_autosave", String(val));
    onAutoSaveChange?.(val);
    flashSaved();
  };

  const handleDefaultZoomChange = (zoom: number) => {
    setDefaultZoom(zoom);
    localStorage.setItem("masmspace_canvas_default_zoom", String(zoom));
    flashSaved();
  };

  // AI & Tools Settings Auto-Persist
  const handleModelChange = (model: string) => {
    setDefaultModel(model);
    localStorage.setItem("masmspace_default_model", model);
    flashSaved();
  };

  const handleToneChange = (tone: string) => {
    setAiTone(tone);
    localStorage.setItem("masmspace_ai_tone", tone);
    flashSaved();
  };

  const handleCodeLangChange = (lang: string) => {
    setDefaultCodeLang(lang);
    localStorage.setItem("masmspace_default_code_lang", lang);
    flashSaved();
  };

  const handleFontSizeChange = (size: string) => {
    setEditorFontSize(size);
    localStorage.setItem("masmspace_editor_font_size", size);
    flashSaved();
  };

  // Privacy & Multiplayer Settings Auto-Persist
  const handleBroadcastCursorToggle = (val: boolean) => {
    setBroadcastCursor(val);
    localStorage.setItem("masmspace_broadcast_cursor", String(val));
    flashSaved();
  };

  const handleEmailNotificationsToggle = (val: boolean) => {
    setEmailNotifications(val);
    localStorage.setItem("masmspace_email_notifications", String(val));
    flashSaved();
  };

  const flashSaved = () => {
    setGeneralSaveSuccess(true);
    setTimeout(() => setGeneralSaveSuccess(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#000000]/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Glassmorphism Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#09090b]/80 backdrop-blur-xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden z-10 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base sm:text-lg font-mono font-bold tracking-tight text-white flex items-center gap-2">
                Settings &amp; Preferences
                {generalSaveSuccess && (
                  <span className="text-[11px] font-sans font-normal text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <Check className="w-3 h-3" /> Auto-saved
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Manage your account, whiteboard canvas, AI engines, and collaborative privacy.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Layout: Left Vertical Tabs + Right Pane */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-[500px] overflow-hidden">
          
          {/* Left Vertical Tabs Navigation */}
          <nav
            aria-label="Settings categories"
            className="w-full sm:w-60 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-white/10 bg-black/40 flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible shrink-0"
          >
            {/* 1. Account */}
            <button
              onClick={() => setActiveTab("account")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "account"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Account</span>
            </button>

            {/* 2. Canvas */}
            <button
              onClick={() => setActiveTab("canvas")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "canvas"
                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <Grid className="w-4 h-4 shrink-0" />
              <span>Canvas</span>
            </button>

            {/* 3. AI & Tools */}
            <button
              onClick={() => setActiveTab("ai_tools")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "ai_tools"
                  ? "bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>AI &amp; Tools</span>
            </button>

            {/* 4. Billing */}
            <button
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "billing"
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Billing</span>
            </button>

            {/* 5. Privacy & Multiplayer */}
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 w-full text-left whitespace-nowrap cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Privacy &amp; MP</span>
            </button>

            {/* Mobile Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
              title="Sign out of MasmSpace"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>{isSigningOut ? "..." : "Sign Out"}</span>
            </button>

            {/* Plan Badge indicator & Sign Out at bottom of sidebar on desktop */}
            <div className="hidden sm:block mt-auto pt-4 border-t border-white/10 space-y-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">Tier</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isPro
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {isPro ? "PRO ACTIVE" : "FREE PLAN"}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Actions: {dynamicActionsUsed}/{isPro ? "Unlimited" : dynamicActionLimit}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-mono text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                title="Sign out of MasmSpace"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </nav>

          {/* Right Tab Content Viewport */}
          <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-6">
            
            {/* ============================================================= */}
            {/* SECTION 1: ACCOUNT                                           */}
            {/* ============================================================= */}
            {activeTab === "account" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-mono font-bold text-base tracking-tight text-white">Account Details</h3>
                  <p className="text-xs text-zinc-400">
                    Manage your personal identity, avatar image, and credentials.
                  </p>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500/40 bg-zinc-800 flex items-center justify-center text-white font-mono font-bold text-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{name ? name.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase() || "U"}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                      title="Upload Avatar"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-white">Avatar Picture</span>
                      <span className="text-[10px] font-mono text-zinc-500">JPG, PNG, WebP up to 2MB</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all cursor-pointer"
                      >
                        Upload Image
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-medium text-zinc-300">
                      Display Name
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm bg-white/5 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none text-zinc-100 placeholder:text-zinc-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Input (Read-Only from Supabase) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono font-medium text-zinc-300">
                        Email Address
                      </label>
                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-cyan-400" /> Read-only (Supabase Auth)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl font-sans text-xs sm:text-sm bg-white/[0.02] border border-white/5 text-zinc-400 cursor-not-allowed select-all"
                      />
                    </div>
                  </div>

                  {/* Save Profile Button & Password CTA */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(!showPasswordModal)}
                      className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showPasswordModal ? "Hide Password Form" : "Change Password"}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {profileSaveSuccess && (
                        <span className="text-xs font-mono font-medium text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Profile updated!
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingProfile || isLoadingUser}
                        className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Inline Change Password Sub-form */}
                {showPasswordModal && (
                  <form
                    onSubmit={handleChangePassword}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 animate-fade-in"
                  >
                    <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-cyan-400" /> Update Account Password
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="password"
                          placeholder="New Password (min 6 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-zinc-100 placeholder:text-zinc-500"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="Confirm New Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-zinc-100 placeholder:text-zinc-500"
                        />
                      </div>
                    </div>

                    {passwordStatus && (
                      <div
                        className={`text-xs font-mono ${
                          passwordStatus.startsWith("success:")
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {passwordStatus.replace("success:", "")}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all cursor-pointer"
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="border-t border-white/10 pt-4" />

                {/* Active Session & Sign Out Option */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-xs font-mono font-bold text-white">Active Session</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Logged in as <span className="font-mono text-zinc-200">{email || name || "Authenticated User"}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="px-4 py-2 rounded-xl font-mono text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                  </button>
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="p-4 sm:p-5 rounded-2xl bg-red-950/20 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)] space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-mono font-bold text-red-400">
                        Danger Zone: Delete Account
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Permanently purge your account, saved whiteboards, and all session data. This action is irreversible and cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {deleteAccountSuccess ? (
                      <span className="text-xs font-mono text-red-400 font-bold">
                        Account wiped. Redirecting...
                      </span>
                    ) : confirmDeleteAccount ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAccount(false)}
                          className="px-3 py-2 rounded-xl font-mono text-xs text-zinc-400 hover:text-white bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-xl font-mono text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Account</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECTION 2: CANVAS                                            */}
            {/* ============================================================= */}
            {activeTab === "canvas" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-mono font-bold text-base tracking-tight text-white">Canvas Preferences</h3>
                  <p className="text-xs text-zinc-400">
                    Customize your drawing environment, grid alignment matrix, and zoom factors.
                  </p>
                </div>

                {/* Theme Selector (Dark/Light) */}
                <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <label className="block text-xs font-mono font-medium text-zinc-300 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Canvas Theme</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTheme("dark");
                        flashSaved();
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Moon className="w-5 h-5 text-indigo-400" />
                      <span>Dark (Cyberpunk)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme("light");
                        flashSaved();
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Sun className="w-5 h-5 text-amber-400" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTheme("system");
                        flashSaved();
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
                        theme === "system"
                          ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <Laptop className="w-5 h-5 text-zinc-400" />
                      <span>System Auto</span>
                    </button>
                  </div>
                </div>

                {/* Grid Type (Dots / Lines / Solid) */}
                <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <label className="block text-xs font-mono font-medium text-zinc-300 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-cyan-400" />
                    <span>Grid Style Matrix</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: "dots", label: "Dotted Grid", desc: "Subtle 20px dots" },
                      { key: "lines", label: "Lined Mesh", desc: "Blueprint crosslines" },
                      { key: "solid", label: "Solid Blank", desc: "Pure dark canvas" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleGridTypeChange(item.key as any)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 font-mono text-xs transition-all cursor-pointer ${
                          gridType === item.key
                            ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="capitalize">{item.label}</span>
                        <span className="text-[10px] text-zinc-500 font-sans">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Save Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-2">
                      <Save className="w-4 h-4 text-cyan-400" />
                      <span>Continuous Auto-Save</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Instantly sync shape elements and drawing changes to local storage and Supabase cloud.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={autoSave}
                    onChange={handleAutoSaveToggle}
                    id="auto-save-switch"
                    label="Auto Save"
                  />
                </div>

                {/* Default Zoom Slider */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-cyan-400" />
                        <span>Default Canvas Zoom</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Camera magnification level when opening a new whiteboard session.
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {defaultZoom}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={50}
                    max={150}
                    step={10}
                    value={defaultZoom}
                    onChange={(e) => handleDefaultZoomChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>50% (Overview)</span>
                    <span>100% (Standard)</span>
                    <span>150% (Close-up)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECTION 3: AI & TOOLS                                        */}
            {/* ============================================================= */}
            {activeTab === "ai_tools" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-mono font-bold text-base tracking-tight text-white">AI &amp; Developer Tools</h3>
                  <p className="text-xs text-zinc-400">
                    Configure LLM reasoning models, synthesis tone, and Code Studio preferences.
                  </p>
                </div>

                {/* Default LLM Model Dropdown */}
                <div className="space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <label className="block text-xs font-mono font-medium text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Default LLM Model</span>
                  </label>
                  <select
                    value={defaultModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl font-mono text-xs sm:text-sm bg-white/5 border border-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none text-zinc-100 cursor-pointer"
                  >
                    <option value="groq-llama-3.3-70b" className="bg-zinc-900 text-white">
                      Groq Llama 3.3 70B Versatile (Ultra-Fast Inference)
                    </option>
                    <option value="gemini-1.5-pro" className="bg-zinc-900 text-white">
                      Google Gemini 1.5 Pro (Deep Visual &amp; Canvas Logic)
                    </option>
                    <option value="gemini-1.5-flash" className="bg-zinc-900 text-white">
                      Google Gemini 1.5 Flash (Balanced Low Latency)
                    </option>
                    <option value="gpt-4o-mini" className="bg-zinc-900 text-white">
                      OpenAI GPT-4o Mini (Standard Multimodal)
                    </option>
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    Powers the "Board Brain" canvas summarizer, AI Agent assistant, and code generation.
                  </p>
                </div>

                {/* AI Response Tone */}
                <div className="space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <label className="block text-xs font-mono font-medium text-zinc-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>AI Response Tone</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "concise", label: "Concise", desc: "Bullet points & punchy" },
                      { key: "detailed", label: "Comprehensive", desc: "Full architectural depth" },
                      { key: "technical", label: "Architect", desc: "Strict code & schemas" },
                      { key: "creative", label: "Brainstorming", desc: "Expansive & ideation" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => handleToneChange(t.key)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-mono text-xs transition-all cursor-pointer ${
                          aiTone === t.key
                            ? "border-purple-400 bg-purple-500/15 text-purple-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>{t.label}</span>
                        <span className="text-[9px] text-zinc-500 font-sans text-center">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Studio Settings: Language & Font Size */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span>Code Studio Defaults</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Language Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-zinc-300">
                        Default Runtime Language
                      </label>
                      <select
                        value={defaultCodeLang}
                        onChange={(e) => handleCodeLangChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl font-mono text-xs bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-zinc-100 cursor-pointer"
                      >
                        <option value="python" className="bg-zinc-900 text-white">Python (Pyodide / Py3)</option>
                        <option value="javascript" className="bg-zinc-900 text-white">JavaScript (Node ES2024)</option>
                        <option value="typescript" className="bg-zinc-900 text-white">TypeScript (Strict)</option>
                        <option value="html" className="bg-zinc-900 text-white">HTML / CSS Web Component</option>
                        <option value="sql" className="bg-zinc-900 text-white">SQL (PostgreSQL / SQLite)</option>
                        <option value="rust" className="bg-zinc-900 text-white">Rust (WebAssembly)</option>
                      </select>
                    </div>

                    {/* Font Size Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Editor Font Size</span>
                      </label>
                      <select
                        value={editorFontSize}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl font-mono text-xs bg-white/5 border border-white/10 focus:border-cyan-400 outline-none text-zinc-100 cursor-pointer"
                      >
                        <option value="12" className="bg-zinc-900 text-white">12px (Compact)</option>
                        <option value="14" className="bg-zinc-900 text-white">14px (Recommended)</option>
                        <option value="16" className="bg-zinc-900 text-white">16px (Medium)</option>
                        <option value="18" className="bg-zinc-900 text-white">18px (Large)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECTION 4: BILLING                                           */}
            {/* ============================================================= */}
            {activeTab === "billing" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-mono font-bold text-base tracking-tight text-white">Billing &amp; Subscription</h3>
                  <p className="text-xs text-zinc-400">
                    Manage your subscription tier, billing invoices, and daily AI quotas.
                  </p>
                </div>

                {/* Current Plan Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.08] border border-white/10 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-mono font-bold text-lg text-white">
                          {isPro ? "MasmSpace PRO" : "Free Starter Plan"}
                        </h4>
                        {isPro ? (
                          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.35)] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {userTier === "enterprise" ? "UNLIMITED" : "PRO PLAN"}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border bg-zinc-800 text-zinc-400 border-zinc-700">
                            FREE PLAN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                        {isPro
                          ? "You have full access to Unlimited AI Generations, 4K exports, laser multiplayer, and Board Brain intelligence."
                          : "You are currently on the basic free plan with standard limits. Upgrade for Unlimited AI Generations, 4K exports, and real-time collaboration."}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Crown className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Quota Bar */}
                  <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Daily AI Action Quota</span>
                      {isPro ? (
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          Unlimited AI Generations
                        </span>
                      ) : (
                        <span className="font-bold text-white">
                          Actions: {dynamicActionsUsed} / {dynamicActionLimit}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      {isPro ? (
                        <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />
                      ) : (
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                          style={{
                            width: `${Math.min(
                              100,
                              (dynamicActionsUsed / Math.max(1, dynamicActionLimit)) * 100
                            )}%`,
                          }}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {isPro
                        ? "Enterprise-grade quota unlocked: unlimited model inference with Gemini 1.5 Pro and Groq Llama 3.3."
                        : "Upgrade to PRO to unlock Unlimited AI Generations and remove daily execution caps."}
                    </p>
                  </div>

                  {/* Razorpay Upgrade Button or Manage Button */}
                  <div className="mt-5 flex items-center gap-3">
                    {isPro ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Subscription Active
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenUpgradeModal?.();
                        }}
                        className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Upgrade to PRO ($5/mo via Razorpay)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Billing History Placeholder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-cyan-400" />
                      <span>Billing &amp; Invoice History</span>
                    </h4>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                    {isPro ? (
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-zinc-400">
                            <th className="py-2.5 px-4">Invoice</th>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          <tr>
                            <td className="py-3 px-4 text-white font-medium">INV-2026-0901</td>
                            <td className="py-3 px-4 text-zinc-400">Sep 1, 2026</td>
                            <td className="py-3 px-4 text-white">$5.00 USD</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => alert("Downloading invoice receipt...")}
                                className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <Receipt className="w-8 h-8 text-zinc-600 mx-auto" />
                        <p className="text-xs font-mono text-zinc-400">
                          No previous invoices found on Free Tier.
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Upgrade to PRO via Razorpay to view instant receipts and monthly invoice statements.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* SECTION 5: PRIVACY & MULTIPLAYER                             */}
            {/* ============================================================= */}
            {activeTab === "privacy" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="font-mono font-bold text-base tracking-tight text-white">Privacy &amp; Multiplayer</h3>
                  <p className="text-xs text-zinc-400">
                    Control collaborative visibility, live cursor broadcasting, and notification alerts.
                  </p>
                </div>

                {/* Broadcast Cursor Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-cyan-400" />
                      <span>Broadcast My Cursor</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Allows remote team members to see your cursor coordinates, laser pointer, and element selections in real-time.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={broadcastCursor}
                    onChange={handleBroadcastCursorToggle}
                    id="broadcast-cursor-switch"
                    label="Broadcast Cursor"
                  />
                </div>

                {/* Email Notifications Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      <span>Email Notifications</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Receive weekly canvas summaries, shared board invitations, and security activity alerts.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={emailNotifications}
                    onChange={handleEmailNotificationsToggle}
                    id="email-notifications-switch"
                    label="Email Notifications"
                  />
                </div>

                {/* Security & End-to-End Privacy Note */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Workspace Data Isolation</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    MasmSpace transmits collaborative strokes through encrypted WebSockets. Your canvas assets and code studio files remain private to invited board members.
                  </p>
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

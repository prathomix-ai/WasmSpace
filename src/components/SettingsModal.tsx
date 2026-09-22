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
  Loader2,
  LogOut,
  Tag,
  Clock,
  Keyboard,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/currency";
import { redeemPromoCode } from "@/lib/promo";
import { downloadInvoicePdf } from "@/lib/invoicePdf";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { checkIsProUser } from "@/lib/userSubscription";
import { validateImageBytes } from "@/lib/file-validator";

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData?: () => void;
  onOpenUpgradeModal?: () => void;
  onProUpgradeSuccess?: () => void;
  actionsUsed?: number;
  actionLimit?: number;
  tier?: string;
  autoSave?: boolean;
  onAutoSaveChange?: (val: boolean) => void;
  onGridTypeChange?: (val: "dots" | "lines" | "solid") => void;
  onThemeChange?: (val: string) => void;
}

type TabType = "account" | "canvas" | "ai_tools" | "billing" | "privacy" | "shortcuts";

// Reusable Clean Professional Toggle Switch
function ToggleSwitch({
  checked,
  onChange,
  id,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-blue-600" : "bg-zinc-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
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
  onProUpgradeSuccess,
  actionsUsed = 0,
  actionLimit = 15,
  tier = "free",
  autoSave: initialAutoSave,
  onAutoSaveChange,
  onGridTypeChange,
  onThemeChange,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { currency } = useCurrency();
  const subscription = useSubscription();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<TabType>("account");

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoStatus, setPromoStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const [proExpiryDate, setProExpiryDate] = useState<string | null>(null);

  // Invoice PDF download state
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // AI Quota & Live Dynamic Countdown State
  const [nextResetTime, setNextResetTime] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState<string>("Resets in 24h 00m");

  const handleDownloadInvoice = async (invoiceItem: {
    id: string;
    date: string;
    amount: string;
    tier: string;
    status: string;
  }) => {
    try {
      setDownloadingInvoiceId(invoiceItem.id);
      await downloadInvoicePdf({
        id: invoiceItem.id,
        date: invoiceItem.date,
        amount: invoiceItem.amount,
        tier: invoiceItem.tier,
        status: invoiceItem.status,
        customerEmail: email || "user@example.com",
      });
    } catch (err) {
      console.error("[SettingsModal] Failed to download invoice PDF:", err);
      alert("Could not generate invoice PDF. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim() || isRedeemingPromo) return;

    setIsRedeemingPromo(true);
    setPromoStatus({ type: "idle" });

    try {
      const res = await redeemPromoCode(promoCodeInput.trim());

      if (res.success) {
        setPromoStatus({
          type: "success",
          message: res.message || "Promo code activated! PRO access unlocked.",
        });
        setPromoCodeInput("");
        await subscription.refreshSubscription();

        if (res.pro_expiry_date) {
          setProExpiryDate(res.pro_expiry_date);
        }

        if (onProUpgradeSuccess) {
          onProUpgradeSuccess();
        }
      } else {
        setPromoStatus({
          type: "error",
          message: res.message || res.error || "Invalid or expired promo code.",
        });
      }
    } catch (err: any) {
      setPromoStatus({
        type: "error",
        message: err.message || "Network error. Please try again.",
      });
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  // Profile Form States
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Security / Password Form States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Danger Zone States
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteAccountSuccess, setDeleteAccountSuccess] = useState(false);

  // Canvas Settings States
  const [gridType, setGridType] = useState<"dots" | "lines" | "solid">("dots");
  const [autoSave, setAutoSave] = useState<boolean>(
    initialAutoSave !== undefined ? initialAutoSave : true
  );
  const [defaultZoom, setDefaultZoom] = useState<number>(100);

  // AI & Tools Settings States
  const [defaultModel, setDefaultModel] = useState<string>("groq-llama-3.3-70b");
  const [aiTone, setAiTone] = useState<string>("concise");
  const [defaultCodeLang, setDefaultCodeLang] = useState<string>("python");
  const [editorFontSize, setEditorFontSize] = useState<string>("14");

  // Privacy & Collaboration States
  const [broadcastCursor, setBroadcastCursor] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  // ── Unified Billing & Quota State (Single Source of Truth) ──
  const [userTier, setUserTier] = useState<string>(subscription.tier || tier);
  const [isPro, setIsPro] = useState<boolean>(subscription.isPro);
  const [dynamicActionsUsed, setDynamicActionsUsed] = useState<number>(subscription.actionsUsed || actionsUsed);
  const [dynamicActionLimit, setDynamicActionLimit] = useState<number>(subscription.actionLimit || actionLimit || 15);

  useEffect(() => {
    if (subscription.isResolved) {
      setUserTier(subscription.tier);
      setIsPro(subscription.isPro);
      setDynamicActionsUsed(subscription.actionsUsed);
      setDynamicActionLimit(subscription.actionLimit);
    }
  }, [subscription.isResolved, subscription.tier, subscription.isPro, subscription.actionsUsed, subscription.actionLimit]);

  // General Notification / Auto-Save indicator
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);

  // Handle User Sign Out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      localStorage.removeItem("Prathomix_pro_status");
      localStorage.removeItem("Prathomix_ai_usage");
      window.location.href = "/login";
    } catch (err) {
      console.error("[SettingsModal] Sign out error:", err);
      window.location.href = "/login";
    } finally {
      setIsSigningOut(false);
    }
  };

  // Sync prop changes and global subscription events
  useEffect(() => {
    const syncSubscription = () => {
      const effective = checkIsProUser({ tier });
      setIsPro(effective);
      setUserTier(effective ? "pro" : (tier || "free"));
      setDynamicActionsUsed(actionsUsed);
      setDynamicActionLimit(effective ? 300 : (actionLimit || 15));
    };

    syncSubscription();

    const handleSubscriptionChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tier === "pro" || detail?.is_pro) {
        setIsPro(true);
        setUserTier("pro");
        setDynamicActionLimit(300);
        if (detail.pro_expiry_date) {
          setProExpiryDate(detail.pro_expiry_date);
        }
      }
    };

    window.addEventListener("Prathomix_subscription_change", handleSubscriptionChange);
    window.addEventListener("storage", syncSubscription);

    return () => {
      window.removeEventListener("Prathomix_subscription_change", handleSubscriptionChange);
      window.removeEventListener("storage", syncSubscription);
    };
  }, [actionsUsed, actionLimit, tier]);

  // Dynamic 24-hour countdown timer logic
  useEffect(() => {
    if (!isOpen) return;

    const updateTimer = () => {
      let targetTimeMs: number;

      if (nextResetTime) {
        targetTimeMs = new Date(nextResetTime).getTime();
      } else {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setUTCHours(24, 0, 0, 0);
        targetTimeMs = nextMidnight.getTime();
      }

      const diffMs = targetTimeMs - Date.now();

      if (diffMs <= 0) {
        setResetCountdown("Resetting quota...");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const hStr = String(hours).padStart(2, "0");
      const mStr = String(minutes).padStart(2, "0");
      const sStr = String(seconds).padStart(2, "0");

      setResetCountdown(`Resets in ${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isOpen, nextResetTime]);

  // Load User from Supabase and LocalStorage preferences
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const supabase = createClient();

    async function loadUserData() {
      setIsLoadingUser(true);
      try {
        // Immediate check from local storage & environment
        if (checkIsProUser({ tier })) {
          if (isMounted) {
            setIsPro(true);
            setUserTier("pro");
            setDynamicActionLimit(300);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setUser(null);
            const savedName = localStorage.getItem("Prathomix_user_name");
            setEmail("guest@Prathomix.io");
            setName(savedName || "Guest Architect");
            if (checkIsProUser({ tier })) {
              setIsPro(true);
              setUserTier("pro");
              setDynamicActionLimit(300);
            }
            setIsLoadingUser(false);
          }
          return;
        }

        const authUser = session.user;
        if (isMounted) {
          setUser(authUser);
          setEmail(authUser.email || "");
          setName(authUser.user_metadata?.full_name || authUser.user_metadata?.name || "");
          setAvatarUrl(authUser.user_metadata?.avatar_url || null);

          // Check user auth metadata
          const metaRole = authUser.user_metadata?.role?.toLowerCase();
          const metaSub = authUser.user_metadata?.subscription_status?.toLowerCase();
          const metaTier = authUser.user_metadata?.tier?.toLowerCase();
          if (
            metaRole === "pro" ||
            metaRole === "admin" ||
            metaSub === "pro" ||
            metaSub === "active" ||
            metaTier === "pro" ||
            metaTier === "enterprise" ||
            authUser.user_metadata?.is_pro === true
          ) {
            setIsPro(true);
            setUserTier("pro");
            setDynamicActionLimit(300);
          }
        }

        // Fetch User Profile from database
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, full_name, avatar_url, tier, is_pro, pro_expires_at, role, subscription_status")
            .eq("id", authUser.id)
            .single();

          if (profile && isMounted) {
            if (profile.full_name || profile.name) {
              setName(profile.full_name || profile.name);
            }
            if (profile.avatar_url) {
              setAvatarUrl(profile.avatar_url);
            }
            if (profile.pro_expires_at) {
              setProExpiryDate(profile.pro_expires_at);
            }
            const pRole = profile.role?.toLowerCase();
            const pSub = profile.subscription_status?.toLowerCase();
            const pTier = profile.tier?.toLowerCase();
            if (
              pTier === "pro" ||
              pTier === "enterprise" ||
              profile.is_pro ||
              pRole === "pro" ||
              pRole === "admin" ||
              pSub === "pro" ||
              pSub === "active" ||
              checkIsProUser({ tier })
            ) {
              setIsPro(true);
              setUserTier("pro");
              setDynamicActionLimit(300);
            }
          }
        } catch (err) {
          console.warn("[SettingsModal] Supabase profile fetch notice:", err);
        }

        // Fetch user quota stats
        try {
          const quotaRes = await fetch("/api/generate?action=quota", {
            headers: { "x-user-id": authUser.id },
          });
          if (quotaRes.ok) {
            const qData = await quotaRes.json();
            if (isMounted && qData) {
              if (typeof qData.used === "number") setDynamicActionsUsed(qData.used);
              if (typeof qData.limit === "number") setDynamicActionLimit(qData.limit);
              if (qData.tier) {
                setUserTier(qData.tier);
                setIsPro(qData.tier === "pro" || qData.tier === "enterprise");
              }
              if (qData.nextResetAt) {
                setNextResetTime(qData.nextResetAt);
              }
            }
          }
        } catch (qErr) {
          console.warn("[SettingsModal] Quota fetch notice:", qErr);
        }
      } catch (e) {
        console.error("[SettingsModal] Auth session check failed:", e);
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    loadUserData();

    // Load LocalStorage persisted preferences
    try {
      const savedGrid = localStorage.getItem("Prathomix_canvas_grid");
      if (savedGrid && (savedGrid === "dots" || savedGrid === "lines" || savedGrid === "solid")) {
        setGridType(savedGrid);
      }
      const savedAutoSave = localStorage.getItem("Prathomix_canvas_autosave");
      if (savedAutoSave !== null) {
        setAutoSave(savedAutoSave === "true");
      }
      const savedZoom = localStorage.getItem("Prathomix_canvas_default_zoom");
      if (savedZoom) {
        setDefaultZoom(Number(savedZoom));
      }
      const savedModel = localStorage.getItem("Prathomix_default_model");
      if (savedModel) {
        setDefaultModel(savedModel);
      }
      const savedTone = localStorage.getItem("Prathomix_ai_tone");
      if (savedTone) {
        setAiTone(savedTone);
      }
      const savedCodeLang = localStorage.getItem("Prathomix_default_code_lang");
      if (savedCodeLang) {
        setDefaultCodeLang(savedCodeLang);
      }
      const savedFontSize = localStorage.getItem("Prathomix_editor_font_size");
      if (savedFontSize) {
        setEditorFontSize(savedFontSize);
      }
      const savedBroadcast = localStorage.getItem("Prathomix_broadcast_cursor");
      if (savedBroadcast !== null) {
        setBroadcastCursor(savedBroadcast === "true");
      }
      const savedNotifs = localStorage.getItem("Prathomix_email_notifications");
      if (savedNotifs !== null) {
        setEmailNotifications(savedNotifs === "true");
      }
    } catch (e) {
      console.warn("[SettingsModal] Failed reading local preferences:", e);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle Avatar Upload with Deep File & Content Signature Validation
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers change
    e.target.value = "";

    // 1. File size check (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB.");
      return;
    }

    // 2. Extension & MIME check - prohibit SVGs, scripts, and non-raster formats
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!validExtensions.includes(ext)) {
      alert("Only JPG, PNG, and WebP image files are allowed. SVG and executable files are prohibited.");
      return;
    }

    // 3. Inspect binary magic bytes to verify content is truly an authentic image
    try {
      const headerSlice = file.slice(0, 32);
      const arrayBuf = await headerSlice.arrayBuffer();
      const validation = validateImageBytes(new Uint8Array(arrayBuf), 2 * 1024 * 1024);
      if (!validation.valid) {
        alert(validation.error || "Invalid image file header. Corrupted or disguised files are rejected.");
        return;
      }
    } catch {
      alert("Failed to verify image file integrity. Please try another image.");
      return;
    }

    // 4. Read as Base64 data and store in isolated DB column (profiles.avatar_url)
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAvatarUrl(base64Data);

      if (user?.id) {
        try {
          const supabase = createClient();
          await supabase.from("profiles").upsert({
            id: user.id,
            avatar_url: base64Data,
            updated_at: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("[SettingsModal] Failed saving avatar to DB:", err);
        }
      }
      flashSaved();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    if (user?.id) {
      try {
        const supabase = createClient();
        await supabase.from("profiles").upsert({
          id: user.id,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("[SettingsModal] Failed clearing avatar:", err);
      }
    }
    flashSaved();
  };

  // Save Display Name to Supabase
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      const supabase = createClient();
      if (user?.id) {
        await supabase.from("profiles").upsert({
          id: user.id,
          name: name.trim(),
          full_name: name.trim(),
          updated_at: new Date().toISOString(),
        });

        await supabase.auth.updateUser({
          data: { full_name: name.trim(), name: name.trim() },
        });
      }

      localStorage.setItem("Prathomix_user_name", name.trim());
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("[SettingsModal] Supabase updateUser notice:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 6) {
      setPasswordStatus("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordStatus(error.message);
      } else {
        setPasswordStatus("success:Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStatus(null);
        }, 2000);
      }
    } catch (err: any) {
      setPasswordStatus(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Danger Zone - Clear Account
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
    localStorage.setItem("Prathomix_canvas_grid", type);
    onGridTypeChange?.(type);
    flashSaved();
  };

  const handleAutoSaveToggle = (val: boolean) => {
    setAutoSave(val);
    localStorage.setItem("Prathomix_canvas_autosave", String(val));
    onAutoSaveChange?.(val);
    flashSaved();
  };

  const handleDefaultZoomChange = (zoom: number) => {
    setDefaultZoom(zoom);
    localStorage.setItem("Prathomix_canvas_default_zoom", String(zoom));
    flashSaved();
  };

  // AI & Tools Settings Auto-Persist
  const handleModelChange = (model: string) => {
    setDefaultModel(model);
    localStorage.setItem("Prathomix_default_model", model);
    flashSaved();
  };

  const handleToneChange = (tone: string) => {
    setAiTone(tone);
    localStorage.setItem("Prathomix_ai_tone", tone);
    flashSaved();
  };

  const handleCodeLangChange = (lang: string) => {
    setDefaultCodeLang(lang);
    localStorage.setItem("Prathomix_default_code_lang", lang);
    flashSaved();
  };

  const handleFontSizeChange = (size: string) => {
    setEditorFontSize(size);
    localStorage.setItem("Prathomix_editor_font_size", size);
    flashSaved();
  };

  // Privacy Settings Auto-Persist
  const handleBroadcastCursorToggle = (val: boolean) => {
    setBroadcastCursor(val);
    localStorage.setItem("Prathomix_broadcast_cursor", String(val));
    flashSaved();
  };

  const handleEmailNotificationsToggle = (val: boolean) => {
    setEmailNotifications(val);
    localStorage.setItem("Prathomix_email_notifications", String(val));
    flashSaved();
  };

  const flashSaved = () => {
    setGeneralSaveSuccess(true);
    setTimeout(() => setGeneralSaveSuccess(false), 2000);
  };

  if (!isOpen) return null;

  const navigationTabs: Array<{
    id: TabType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "account", label: "Account & Profile", icon: <User className="w-4 h-4 shrink-0" /> },
    { id: "canvas", label: "Canvas & Grid", icon: <Grid className="w-4 h-4 shrink-0" /> },
    { id: "ai_tools", label: "AI Engines & Tools", icon: <Cpu className="w-4 h-4 shrink-0" /> },
    { id: "billing", label: "Billing & Plans", icon: <CreditCard className="w-4 h-4 shrink-0" /> },
    { id: "privacy", label: "Privacy & Sharing", icon: <Shield className="w-4 h-4 shrink-0" /> },
    { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* Subtle Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Clean Enterprise Modal Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#111215] border border-zinc-800 shadow-2xl overflow-hidden z-10 text-zinc-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-[#141519]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700/60">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="settings-modal-title" className="text-base font-semibold text-zinc-100">
                  Settings
                </h2>
                {generalSaveSuccess && (
                  <span className="text-xs font-normal text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Manage your workspace preferences, profile, and subscription.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar Tabs + Right Viewport */}
        <div className="flex-1 flex flex-col sm:flex-row min-h-[500px] overflow-hidden">
          
          {/* Left Vertical Tabs Navigation */}
          <nav
            aria-label="Settings categories"
            className="w-full sm:w-56 p-3 border-b sm:border-b-0 sm:border-r border-zinc-800/80 bg-[#0e0f12] flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible shrink-0"
          >
            {navigationTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-white border border-zinc-700/80 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Plan Info Badge & Sign Out in Sidebar Bottom */}
            <div className="hidden sm:block mt-auto pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Plan</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isPro
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {isPro ? "PRO" : "FREE"}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Quota</span>
                  <span className="font-medium text-zinc-300">
                    {dynamicActionsUsed} / {isPro ? 300 : dynamicActionLimit}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-0.5">
                  <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{resetCountdown}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </nav>

          {/* Right Tab Content Viewport */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 bg-[#111215]">
            
            {/* ============================================================= */}
            {/* TAB 1: ACCOUNT & PROFILE                                      */}
            {/* ============================================================= */}
            {activeTab === "account" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Account Profile</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Manage your credentials, display identity, and daily AI quotas.
                  </p>
                </div>

                {/* Clean Professional Quota Card */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">
                          AI Generation Quota
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {isPro
                            ? "300 Generations / 24-hour cycle"
                            : "15 Generations lifetime quota"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs font-semibold text-zinc-200">
                        {dynamicActionsUsed} / {isPro ? 300 : dynamicActionLimit} used
                      </span>
                      <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{resetCountdown}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (dynamicActionsUsed / (isPro ? 300 : dynamicActionLimit || 15)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  {!isPro && onOpenUpgradeModal && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 mt-2">
                      <span className="text-zinc-400 text-xs">
                        Need 300 daily generations and full developer tools?
                      </span>
                      <button
                        type="button"
                        onClick={onOpenUpgradeModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-sm"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Upgrade to PRO</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="relative group">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center text-white font-medium text-lg">
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
                      <Camera className="w-4 h-4" />
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
                    <div className="text-xs font-medium text-zinc-200">Profile Picture</div>
                    <p className="text-[11px] text-zinc-400">JPG, PNG, or WebP up to 2MB</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-colors cursor-pointer"
                      >
                        Upload
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3.5 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50 outline-none text-zinc-100 placeholder:text-zinc-600 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-zinc-300">
                        Email Address
                      </label>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Managed via Supabase
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="w-full pl-9 pr-3.5 py-2 rounded-lg text-xs bg-zinc-900/40 border border-zinc-800/80 text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(!showPasswordModal)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{showPasswordModal ? "Hide Password Form" : "Change Password"}</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      {profileSaveSuccess && (
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingProfile || isLoadingUser}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Password Change Sub-form */}
                {showPasswordModal && (
                  <form
                    onSubmit={handleChangePassword}
                    className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3"
                  >
                    <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Update Password</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="password"
                        placeholder="New password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none text-zinc-100 placeholder:text-zinc-600"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none text-zinc-100 placeholder:text-zinc-600"
                      />
                    </div>

                    {passwordStatus && (
                      <div
                        className={`text-xs ${
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
                        className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Danger Zone */}
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-2.5 mt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-red-300">Delete Account</div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                        Permanently delete your account, saved whiteboards, and all session history. This action cannot be reversed.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    {deleteAccountSuccess ? (
                      <span className="text-xs text-red-400 font-medium">Account deleted. Redirecting...</span>
                    ) : confirmDeleteAccount ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteAccount(false)}
                          className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-white hover:bg-red-600/80 border border-red-800/60 transition-colors flex items-center gap-1.5 cursor-pointer"
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
            {/* TAB 2: CANVAS & GRID                                          */}
            {/* ============================================================= */}
            {activeTab === "canvas" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Canvas Preferences</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Customize your drawing theme, grid alignment style, and zoom behavior.
                  </p>
                </div>

                {/* Theme Selector */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                  <label className="block text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-zinc-400" />
                    <span>Interface Theme</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
                      { key: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
                      { key: "system", label: "System", icon: <Laptop className="w-4 h-4" /> },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setTheme(item.key);
                          onThemeChange?.(item.key);
                          flashSaved();
                        }}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 text-xs transition-all cursor-pointer ${
                          theme === item.key
                            ? "border-blue-500 bg-blue-500/10 text-white font-medium shadow-sm"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Type */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                  <label className="block text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-zinc-400" />
                    <span>Grid Style</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: "dots", label: "Dots", desc: "Subtle 24px grid" },
                      { key: "lines", label: "Lines", desc: "Cross grid lines" },
                      { key: "solid", label: "Solid", desc: "Blank canvas" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleGridTypeChange(item.key as any)}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1 text-xs transition-all cursor-pointer ${
                          gridType === item.key
                            ? "border-blue-500 bg-blue-500/10 text-white font-medium shadow-sm"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <span>{item.label}</span>
                        <span className="text-[10px] text-zinc-500">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous Auto-Save Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                      <Save className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Automatic Cloud Save</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Sync changes automatically to local storage and active session.
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
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                        <ZoomIn className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Default Canvas Zoom</span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Initial zoom factor when opening whiteboard blueprints.
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
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
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>50% (Wide)</span>
                    <span>100% (Default)</span>
                    <span>150% (Zoomed)</span>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 3: AI ENGINES & TOOLS                                     */}
            {/* ============================================================= */}
            {activeTab === "ai_tools" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">AI Engines &amp; Code Studio</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select default LLM providers, synthesis tone, and runtime languages.
                  </p>
                </div>

                {/* Default LLM Model */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <label className="block text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                    <span>Default AI Model</span>
                  </label>
                  <select
                    value={defaultModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none text-zinc-100 cursor-pointer"
                  >
                    <option value="groq-llama-3.3-70b" className="bg-zinc-900 text-white">
                      Groq Llama 3.3 70B (Fast Low-Latency Inference)
                    </option>
                    <option value="gemini-1.5-pro" className="bg-zinc-900 text-white">
                      Google Gemini 1.5 Pro (Deep Architecture Reasoning)
                    </option>
                    <option value="gemini-1.5-flash" className="bg-zinc-900 text-white">
                      Google Gemini 1.5 Flash (Balanced Fast Mode)
                    </option>
                    <option value="gpt-4o-mini" className="bg-zinc-900 text-white">
                      OpenAI GPT-4o Mini (Standard Multimodal)
                    </option>
                  </select>
                  <p className="text-[11px] text-zinc-400">
                    Powers the AI Co-Pilot drawer, topology generation, and architecture summarization.
                  </p>
                </div>

                {/* Response Tone */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                  <label className="block text-xs font-medium text-zinc-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-zinc-400" />
                    <span>Response Tone</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "concise", label: "Concise", desc: "Bullet points & summaries" },
                      { key: "detailed", label: "Comprehensive", desc: "Full architectural depth" },
                      { key: "technical", label: "Architect", desc: "Strict specs & schemas" },
                      { key: "creative", label: "Ideation", desc: "Brainstorming & exploration" },
                    ].map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => handleToneChange(t.key)}
                        className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 text-xs transition-all cursor-pointer ${
                          aiTone === t.key
                            ? "border-blue-500 bg-blue-500/10 text-white font-medium shadow-sm"
                            : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700 hover:text-white"
                        }`}
                      >
                        <span>{t.label}</span>
                        <span className="text-[10px] text-zinc-500 text-center">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Code Studio Defaults */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3.5">
                  <div className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-zinc-400" />
                    <span>Code Studio Defaults</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs text-zinc-300">Default Language</label>
                      <select
                        value={defaultCodeLang}
                        onChange={(e) => handleCodeLangChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none text-zinc-100 cursor-pointer"
                      >
                        <option value="python" className="bg-zinc-900 text-white">Python (Pyodide)</option>
                        <option value="javascript" className="bg-zinc-900 text-white">JavaScript (Node ES2024)</option>
                        <option value="typescript" className="bg-zinc-900 text-white">TypeScript (Strict)</option>
                        <option value="html" className="bg-zinc-900 text-white">HTML / CSS Component</option>
                        <option value="sql" className="bg-zinc-900 text-white">SQL (PostgreSQL / SQLite)</option>
                        <option value="rust" className="bg-zinc-900 text-white">Rust (WebAssembly)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs text-zinc-300 flex items-center gap-1">
                        <Type className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Font Size</span>
                      </label>
                      <select
                        value={editorFontSize}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-xs bg-zinc-900 border border-zinc-800 focus:border-zinc-600 outline-none text-zinc-100 cursor-pointer"
                      >
                        <option value="12" className="bg-zinc-900 text-white">12px (Compact)</option>
                        <option value="14" className="bg-zinc-900 text-white">14px (Standard)</option>
                        <option value="16" className="bg-zinc-900 text-white">16px (Medium)</option>
                        <option value="18" className="bg-zinc-900 text-white">18px (Large)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 4: BILLING & PLANS                                        */}
            {/* ============================================================= */}
            {activeTab === "billing" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Billing &amp; Subscription</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    View active plan, redeem promo vouchers, and download invoice receipts.
                  </p>
                </div>

                {/* Plan Card */}
                <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-white">
                          {isPro ? "MasmSpace Professional" : "Starter Plan"}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isPro
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {isPro ? "ACTIVE PRO" : "FREE"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                        {isPro
                          ? "Includes 300 daily AI generations, 4K canvas exports, and real-time collaboration."
                          : "Basic starter plan with standard 15 lifetime generations and standard exports."}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <Crown className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      {isPro ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Subscription is active</span>
                          {proExpiryDate && (
                            <span className="text-zinc-500">
                              (Expires {new Date(proExpiryDate).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-400">
                          Upgrade to PRO for {currency === "INR" ? "₹149/month" : "$5/month"}.
                        </div>
                      )}
                    </div>

                    {!isPro && onOpenUpgradeModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenUpgradeModal?.();
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Upgrade to Pro</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Redeem Promo Code */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                    <Tag className="w-4 h-4 text-zinc-400" />
                    <span>Redeem Promo Code</span>
                  </div>

                  <form onSubmit={handleRedeemPromo} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder="Enter coupon or promo code"
                        disabled={isRedeemingPromo}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 uppercase tracking-wider disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isRedeemingPromo || !promoCodeInput.trim()}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isRedeemingPromo ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Applying...</span>
                          </>
                        ) : (
                          <span>Apply</span>
                        )}
                      </button>
                    </div>

                    {promoStatus.type === "success" && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{promoStatus.message}</span>
                      </div>
                    )}
                    {promoStatus.type === "error" && (
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{promoStatus.message}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Billing History */}
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-zinc-400" />
                    <span>Invoices</span>
                  </div>

                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/60">
                    {isPro ? (
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
                            <th className="py-2.5 px-4 font-medium">Invoice</th>
                            <th className="py-2.5 px-4 font-medium">Date</th>
                            <th className="py-2.5 px-4 font-medium">Amount</th>
                            <th className="py-2.5 px-4 font-medium">Status</th>
                            <th className="py-2.5 px-4 font-medium text-right">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                          {[
                            {
                              id: "INV-2026-0901",
                              date: "Sep 1, 2026",
                              amount: "$5.00 USD",
                              tier: "MasmSpace PRO - 1 Month",
                              status: "PAID",
                            },
                          ].map((inv) => (
                            <tr key={inv.id}>
                              <td className="py-2.5 px-4 font-medium text-white">{inv.id}</td>
                              <td className="py-2.5 px-4 text-zinc-400">{inv.date}</td>
                              <td className="py-2.5 px-4">{inv.amount}</td>
                              <td className="py-2.5 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-medium">
                                  Paid
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                <button
                                  type="button"
                                  disabled={downloadingInvoiceId === inv.id}
                                  onClick={() => handleDownloadInvoice(inv)}
                                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 text-xs font-medium"
                                >
                                  {downloadingInvoiceId === inv.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" />
                                      <span>PDF</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center space-y-1.5">
                        <Receipt className="w-6 h-6 text-zinc-600 mx-auto" />
                        <p className="text-xs text-zinc-400">No invoices yet on Free Plan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 5: PRIVACY & COLLABORATION                                */}
            {/* ============================================================= */}
            {activeTab === "privacy" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">Privacy &amp; Collaboration</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure collaborative visibility, live cursor sharing, and notifications.
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                      <MousePointer className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Broadcast Live Cursor</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Allows connected collaborators to see your pointer movements and laser trails.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={broadcastCursor}
                    onChange={handleBroadcastCursorToggle}
                    id="broadcast-cursor-switch"
                    label="Broadcast Cursor"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Email Notifications</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Receive weekly board summaries and workspace activity updates.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={emailNotifications}
                    onChange={handleEmailNotificationsToggle}
                    id="email-notifications-switch"
                    label="Email Notifications"
                  />
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Encrypted Collaboration</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Collaborative changes are transmitted securely. Canvas drawings and code scripts remain accessible only to authorized session participants.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 6: KEYBOARD SHORTCUTS                                     */}
            {/* ============================================================= */}
            {activeTab === "shortcuts" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-zinc-400" />
                    <span>Keyboard Shortcuts</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Quick navigation, drawing modes, and canvas editing shortcuts.
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-medium text-zinc-400">
                    <span>Action / Command</span>
                    <span>Shortcut</span>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {[
                      { action: "Select & Pointer Mode", key: "V", category: "Navigation" },
                      { action: "Pan Canvas (Hand)", key: "H", category: "Navigation" },
                      { action: "Pen Tool", key: "P", category: "Drawing" },
                      { action: "Stroke Eraser", key: "E", category: "Drawing" },
                      { action: "Highlighter Tool", key: "Shift + H", category: "Drawing" },
                      { action: "Laser Pointer", key: "L", category: "Presentation" },
                      { action: "Architecture Shapes", key: "S", category: "Elements" },
                      { action: "Architecture Text Note", key: "T", category: "Notes" },
                      { action: "Sticky Task Note", key: "N", category: "Notes" },
                      { action: "Undo Action", key: "Ctrl + Z", category: "History" },
                      { action: "Copy Selection", key: "Ctrl + C", category: "Clipboard" },
                      { action: "Paste At Cursor", key: "Ctrl + V", category: "Clipboard" },
                      { action: "Group into Subnet", key: "Ctrl + G", category: "Organization" },
                      { action: "Zoom to Fit", key: "F", category: "View" },
                      { action: "Deselect / Cancel", key: "Esc", category: "General" },
                    ].map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-zinc-200">
                            {shortcut.action}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {shortcut.category}
                          </span>
                        </div>
                        <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/80 text-zinc-300 font-mono text-xs shadow-none">
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Shortcuts are active across the canvas whenever you are not actively typing in an input field or text note.
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

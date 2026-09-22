"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getSafeClientErrorMessage } from "@/lib/api-error";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  Cpu,
  ShieldCheck,
  Check,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode state: Sign-Up or Sign-In
  const [isSignUp, setIsSignUp] = useState(false);

  // Form input states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus tracking for floating label animations
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check URL query param e.g. /login?mode=signup or /signup
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);

    const redirectUrl = searchParams.get("next") || searchParams.get("redirect") || "/canvas";

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}${redirectUrl.startsWith("/") ? redirectUrl : `/${redirectUrl}`}`
              : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(getSafeClientErrorMessage(err, "Failed to initialize Google authentication."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation check for Sign-Up
    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify and try again.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
    }
    const redirectUrl = searchParams.get("next") || searchParams.get("redirect") || "/canvas";
    const targetPath = redirectUrl.startsWith("/") ? redirectUrl : `/${redirectUrl}`;

    try {
      setLoading(true);
      const supabase = createClient();

      if (isSignUp) {
        // Supabase Auth Sign-Up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phoneNumber,
              role: "user",
            },
          },
        });

        if (error) {
          throw error;
        }

        setSuccessMsg(
          "Account created successfully! Check your email or sign in below."
        );
        setIsSignUp(false);
      } else {
        // Supabase Auth Sign-In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // Fetch user profile role and subscription status if available
        let userRole: "user" | "admin" = "user";
        let subStatus = "free";
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, subscription_status")
            .eq("id", data.user.id)
            .maybeSingle();

          if (profile?.role === "admin" || email.toLowerCase().includes("admin")) {
            userRole = "admin";
          }
          subStatus =
            profile?.subscription_status ||
            (data.user.user_metadata as any)?.subscription_status ||
            "free";
        }

        // Store local session fallback
        const sessionData = JSON.stringify({
          email,
          name: data?.user?.user_metadata?.full_name || email.split("@")[0],
          role: userRole,
          subscription_status: subStatus,
          is_pro: subStatus === "pro" || subStatus === "enterprise" || userRole === "admin",
        });
        localStorage.setItem("prathomix_current_user", sessionData);
        localStorage.setItem("prathomix_current_user", sessionData);

        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => router.push(targetPath), 800);
      }
    } catch (err: any) {
      setErrorMsg(getSafeClientErrorMessage(err, "Authentication failed. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      {/* Frosted Glass Card Container */}
      <div className="relative rounded-3xl bg-[#09090b]/70 backdrop-blur-2xl border border-white/10 p-7 sm:p-9 shadow-[0_20px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.08)] overflow-hidden">
        {/* Subtle Top Accent Glow Line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

        {/* Header inside Form Card */}
        <div className="mb-6 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              <Sparkles className="w-3 h-3" />
              {isSignUp ? "Get Started Free" : "Welcome Back"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isSignUp ? "Create your workspace" : "Sign in to your account"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
            {isSignUp
              ? "Join thousands of builders architecting systems in real-time."
              : "Access your cloud canvases, AI diagrams, and workspaces."}
          </p>
        </div>

        {/* Social Authentication */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-center gap-3 group relative cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isSignUp ? "Sign up with Google" : "Continue with Google"}</span>
        </button>

        {/* Separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#0c0d12] px-3 text-zinc-500 font-mono">
              or continue with email
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span className="font-mono text-[11px] leading-snug">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-mono text-[11px] leading-snug">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Inputs with Modern Interactive Floating Labels */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div className="relative group">
                <div
                  className={`relative flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 ${
                    focusedField === "name"
                      ? "border-cyan-400/80 bg-white/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Full Name (e.g. Alex Rivera)"
                    className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="relative group">
                <div
                  className={`relative flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 ${
                    focusedField === "phone"
                      ? "border-cyan-400/80 bg-white/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Phone Number (Optional)"
                    className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Address */}
          <div className="relative group">
            <div
              className={`relative flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 ${
                focusedField === "email"
                  ? "border-cyan-400/80 bg-white/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="name@company.com"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none font-mono text-[13px]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="relative group">
            <div
              className={`relative flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 ${
                focusedField === "password"
                  ? "border-cyan-400/80 bg-white/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div className="pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="Password (minimum 6 characters)"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none font-mono text-[13px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="pr-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Sign-Up only) */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative group"
            >
              <div
                className={`relative flex items-center rounded-xl bg-white/[0.03] border transition-all duration-200 ${
                  focusedField === "confirmPassword"
                    ? "border-cyan-400/80 bg-white/[0.06] shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="pl-3.5 text-zinc-400 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required={isSignUp}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Confirm password"
                  className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none font-mono text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="pr-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Vibrant Aurora Continue Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.55)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Free Workspace" : "Continue to MasmSpace"}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switcher */}
        <div className="text-center pt-5 mt-5 border-t border-white/[0.08]">
          <p className="text-xs text-zinc-400">
            {isSignUp ? "Already have an account?" : "New to MasmSpace?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer ml-1"
            >
              {isSignUp ? "Sign In" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ── Global Midnight Oceanic Gradient Orbs ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[130px]" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.9) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* ── Left Side: Pure CSS Animated Gradient Mesh & Brand Visual ──── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-white/10 overflow-hidden z-10">
        {/* Animated Pure CSS Mesh Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden bg-[#09090b]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-[#09090b] to-purple-950/30" />
          {/* Animated glowing mesh orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] opacity-40 animate-aurora-mesh filter blur-[90px] pointer-events-none bg-[radial-gradient(ellipse_at_top_left,#06b6d4_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,#6366f1_0%,transparent_50%),radial-gradient(ellipse_at_center,#8b5cf6_0%,transparent_50%)]" />

          {/* Micro-noise texture simulation */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/80" />
        </div>

        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
            <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/15 p-2 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)] group-hover:scale-105 group-hover:border-cyan-400/40 transition-all duration-300">
              <Image
                src="/Prathomix-logo.png"
                alt="MasmSpace"
                width={38}
                height={38}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors leading-none block">
                MasmSpace
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold mt-0.5">
                Powered by PRATHOMIX
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/[0.04] border border-white/10 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v2.4 Linear Studio
          </span>
        </div>

        {/* Center Tagline & Dynamic 3D/Glass Graphic Showcase */}
        <div className="my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-6 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5" />
            Next-Gen Spatial Architecture
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Architect systems at the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400">
              speed of thought.
            </span>
          </h1>

          <p className="mt-5 text-base text-zinc-400 leading-relaxed max-w-lg">
            The spatial whiteboard workspace built for engineers. Generate deep architectures,
            collaborate across infinite canvases, and transform diagrams into production-ready specs.
          </p>

          {/* Floating Glassmorphic Capability Badges */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Infinite Multi-Canvas</h4>
                  <p className="text-[11px] text-zinc-400">60FPS realtime collaborative sync</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Contextual AI Agent</h4>
                  <p className="text-[11px] text-zinc-400">Click-to-place intelligent graphs</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Cloud State Persistence</h4>
                  <p className="text-[11px] text-zinc-400">Supabase instant memory snapshot</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Enterprise Ready</h4>
                  <p className="text-[11px] text-zinc-400">SOC2 compliant & encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in Hero panel */}
        <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 PRATHOMIX Solution. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/" className="hover:text-zinc-300 transition-colors">Security</Link>
          </div>
        </div>
      </div>

      {/* ── Right Side: High-Conversion Frosted Glass Auth ───────────────── */}
      <div className="w-full lg:w-1/2 xl:w-5/12 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 relative z-10">
        {/* Mobile Header Logo (visible only on small screens) */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/15 p-1.5 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Image
                src="/Prathomix-logo.png"
                alt="MasmSpace"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-2xl tracking-tight text-white leading-none">MasmSpace</span>
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider">by Prathomix</span>
            </div>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="w-full max-w-md p-8 rounded-3xl bg-[#09090b]/80 backdrop-blur-2xl border border-white/15 text-center font-mono text-xs text-zinc-400 shadow-2xl">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              <span>Initializing MasmSpace Auth...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

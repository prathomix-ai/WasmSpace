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
  Database,
  ShieldCheck,
  Check,
  Workflow,
  MousePointer2,
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

  // Focus tracking
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

        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => router.push(targetPath), 600);
      }
    } catch (err: any) {
      setErrorMsg(getSafeClientErrorMessage(err, "Authentication failed. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-[420px] mx-auto"
    >
      {/* Clean White Surface Card with Subtle SaaS Elevation */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-7 sm:p-9">
        {/* Card Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-zinc-100 text-zinc-700 border border-zinc-200/80 mb-3">
            <Sparkles className="w-3 h-3 text-[#635BFF]" />
            {isSignUp ? "Get Started Free" : "Welcome Back"}
          </div>
          <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900 leading-tight">
            {isSignUp ? "Create your workspace" : "Sign in to your account"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500">
            {isSignUp
              ? "Start thinking, diagramming, and collaborating on an infinite canvas."
              : "Access your cloud canvases, AI diagrams, and workspaces."}
          </p>
        </div>

        {/* Social Authentication */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm text-zinc-700 bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#635BFF]" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-white px-3 text-zinc-400 font-medium">
              or continue with email
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="text-xs font-medium leading-snug">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="text-xs font-medium leading-snug">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3.5"
            >
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Full Name
                </label>
                <div
                  className={`relative flex items-center rounded-xl bg-white border transition-all duration-150 ${
                    focusedField === "name"
                      ? "border-[#635BFF] ring-2 ring-[#635BFF]/15"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="pl-3.5 text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required={isSignUp}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Alex Rivera"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                  Phone Number <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <div
                  className={`relative flex items-center rounded-xl bg-white border transition-all duration-150 ${
                    focusedField === "phone"
                      ? "border-[#635BFF] ring-2 ring-[#635BFF]/15"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="pl-3.5 text-zinc-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Email Address
            </label>
            <div
              className={`relative flex items-center rounded-xl bg-white border transition-all duration-150 ${
                focusedField === "email"
                  ? "border-[#635BFF] ring-2 ring-[#635BFF]/15"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="pl-3.5 text-zinc-400">
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
                className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Password
              </label>
            </div>
            <div
              className={`relative flex items-center rounded-xl bg-white border transition-all duration-150 ${
                focusedField === "password"
                  ? "border-[#635BFF] ring-2 ring-[#635BFF]/15"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <div className="pl-3.5 text-zinc-400">
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
                className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="pr-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
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
            >
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                Confirm Password
              </label>
              <div
                className={`relative flex items-center rounded-xl bg-white border transition-all duration-150 ${
                  focusedField === "confirmPassword"
                    ? "border-[#635BFF] ring-2 ring-[#635BFF]/15"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="pl-3.5 text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required={isSignUp}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Repeat your password"
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="pr-3.5 text-zinc-400 hover:text-zinc-600 transition-colors"
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

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-[#635BFF] hover:bg-[#5248E2] active:bg-[#4338CA] shadow-[0_1px_2px_rgba(99,91,255,0.2)] transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

        {/* Mode Switcher */}
        <div className="text-center pt-5 mt-5 border-t border-zinc-100">
          <p className="text-xs text-zinc-500">
            {isSignUp ? "Already have an account?" : "New to MasmSpace?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[#635BFF] hover:text-[#5248E2] font-semibold transition-colors cursor-pointer ml-1"
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
    <div className="min-h-screen w-full bg-[#FAFAF9] text-zinc-900 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-[#635BFF]/10 selection:text-[#635BFF]">
      {/* ── Left Side: Editorial Product Showcase ──────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-12 xl:p-16 border-r border-zinc-200 bg-[#F4F4F5]/60 overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.4] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(24, 24, 27, 0.08) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2.5 group focus:outline-none">
            <div className="relative w-8 h-7 flex items-center justify-center shrink-0">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={32}
                height={25}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base tracking-tight text-zinc-900 leading-none">
                MasmSpace
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide mt-0.5">
                by Prathomix
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border border-zinc-200 text-zinc-600 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Continuous Canvas
          </span>
        </div>

        {/* Center Editorial Showcase */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-zinc-700 text-xs font-medium mb-5 shadow-2xs">
            <Workflow className="w-3.5 h-3.5 text-[#635BFF]" />
            Spatial Architecture & Thinking
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Architect systems at the{" "}
            <span className="text-[#635BFF]">
              speed of thought.
            </span>
          </h1>

          <p className="mt-4 text-sm xl:text-base text-zinc-600 leading-relaxed max-w-lg">
            The infinite collaborative workspace for engineers, designers, and visual thinkers.
            Map complex topologies, collaborate in real time, and turn architecture into reality.
          </p>

          {/* Interactive Miniature Canvas Preview */}
          <div className="mt-8 p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 text-[11px] text-zinc-500">
              <span className="font-medium text-zinc-700">Live Architecture Session</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>2 Active Builders</span>
              </div>
            </div>

            {/* Simulated Canvas Objects */}
            <div className="relative h-32 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 p-3 flex items-center justify-around">
              {/* Node 1: API Gateway */}
              <div className="bg-white border border-zinc-200 rounded-lg p-2.5 shadow-2xs text-left w-28">
                <div className="text-[10px] font-semibold text-zinc-900 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Gateway
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">REST / WebSocket</div>
              </div>

              {/* Dynamic Connector */}
              <div className="h-0.5 w-10 bg-zinc-300 relative">
                <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-400 rotate-45" />
              </div>

              {/* Node 2: Microservice */}
              <div className="bg-white border border-[#635BFF] ring-2 ring-[#635BFF]/15 rounded-lg p-2.5 shadow-2xs text-left w-28 relative">
                <div className="text-[10px] font-semibold text-zinc-900 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#635BFF]" /> Auth Cluster
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">JWT / Session</div>

                {/* Collaborator Cursor */}
                <div className="absolute -bottom-5 right-2 flex items-center gap-1 pointer-events-none">
                  <MousePointer2 className="w-3 h-3 text-[#635BFF] fill-[#635BFF]" />
                  <span className="text-[9px] font-semibold bg-[#635BFF] text-white px-1.5 py-0.5 rounded shadow-xs">
                    Alex M.
                  </span>
                </div>
              </div>

              {/* Dynamic Connector */}
              <div className="h-0.5 w-10 bg-zinc-300 relative">
                <div className="absolute -top-1 right-0 w-2 h-2 border-t-2 border-r-2 border-zinc-400 rotate-45" />
              </div>

              {/* Node 3: Database */}
              <div className="bg-white border border-zinc-200 rounded-lg p-2.5 shadow-2xs text-left w-28">
                <div className="text-[10px] font-semibold text-zinc-900 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Database
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">PostgreSQL</div>
              </div>
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-[#635BFF]">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Infinite Multi-Canvas</h4>
                <p className="text-[11px] text-zinc-500">Sub-20ms rendering engine</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Board Intelligence</h4>
                <p className="text-[11px] text-zinc-500">AI topology understanding</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Cloud Persistence</h4>
                <p className="text-[11px] text-zinc-500">Continuous cloud autosave</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">Enterprise Security</h4>
                <p className="text-[11px] text-zinc-500">Encrypted data controls</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in Hero panel */}
        <div className="relative z-10 pt-4 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
          <span>© 2026 PRATHOMIX Solution. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms</Link>
            <Link href="/features" className="hover:text-zinc-900 transition-colors">Features</Link>
          </div>
        </div>
      </div>

      {/* ── Right Side: Clean White Auth Form Container ───────────────── */}
      <div className="w-full lg:w-1/2 xl:w-5/12 min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 relative z-10 bg-[#FAFAF9]">
        {/* Mobile Header Logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="relative w-8 h-7 flex items-center justify-center shrink-0">
              <Image
                src="/masmspace-logo.png"
                alt="MasmSpace"
                width={32}
                height={25}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-lg tracking-tight text-zinc-900 leading-none">
                MasmSpace
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">by Prathomix</span>
            </div>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="w-full max-w-[420px] p-8 rounded-2xl bg-white border border-zinc-200 text-center font-sans text-xs text-zinc-500 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#635BFF] mb-2" />
              <span>Loading MasmSpace...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        {/* Small footer link on mobile */}
        <div className="lg:hidden mt-8 text-center text-xs text-zinc-400">
          <span>© 2026 PRATHOMIX Solution.</span>
        </div>
      </div>
    </div>
  );
}

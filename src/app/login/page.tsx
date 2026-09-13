"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
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
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}${redirectUrl.startsWith("/") ? redirectUrl : `/${redirectUrl}`}` : undefined,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize Google authentication.");
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
      const supabase = createClient();

      if (isSignUp) {
        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match.");
          setLoading(false);
          return;
        }

        // Supabase Auth Sign-Up
        const { data, error } = await supabase.auth.signUp({
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

        // Fetch user profile role if available
        let userRole: "user" | "admin" = "user";
        if (data.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

          if (profile?.role === "admin" || email.toLowerCase().includes("admin")) {
            userRole = "admin";
          }
        }

        // Store local session fallback
        const sessionData = JSON.stringify({
          email,
          name: data?.user?.user_metadata?.full_name || email.split("@")[0],
          role: userRole,
        });
        localStorage.setItem("masmspace_current_user", sessionData);

        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => router.push(targetPath), 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative w-full max-w-lg mx-auto rounded-3xl bg-[#09090b]/80 backdrop-blur-2xl border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.1)] overflow-hidden z-10 text-white p-6 sm:p-10 space-y-6"
    >
      {/* Subtle top interior glow line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-white mb-2 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/15 p-1.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] group-hover:scale-105 transition-transform">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <span className="group-hover:text-cyan-300 transition-colors">
            MasmSpace
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {isSignUp ? "Create Your Account" : "Sign In to MasmSpace"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          {isSignUp
            ? "Join thousands of builders architecting systems with MasmSpace AI."
            : "Sign in to access your technical canvases & AI intelligence."}
        </p>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="font-mono text-[11px] leading-snug">{errorMsg}</span>
        </div>
      )}

      {/* Success Feedback */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-mono text-[11px] leading-snug">{successMsg}</span>
        </div>
      )}

      {/* ── Social Login: Continue with Google ──────────────────────────── */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all duration-300 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>

        {/* ── Visual Divider ────────────────────────────────────────────── */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-xs text-gray-500 px-3 font-mono">OR CONTINUE WITH EMAIL</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
      </div>

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name on Sign-Up */}
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span>Full Name</span>
              <span className="text-red-400/80 text-xs font-mono font-normal">
                *Required
              </span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
            </div>
          </div>
        )}

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Email Address</span>
            <span className="text-red-400/80 text-xs font-mono font-normal">
              *Required
            </span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@masmspace.ai"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
            />
          </div>
        </div>

        {/* Contact Number on Sign-Up */}
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span>Contact Number (Phone)</span>
              <span className="text-zinc-500 text-xs font-mono">Optional</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
            <span>Password</span>
            <span className="text-red-400/80 text-xs font-mono font-normal">
              *Required
            </span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password on Sign-Up */}
        {isSignUp && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
              <span>Confirm Password</span>
              <span className="text-red-400/80 text-xs font-mono font-normal">
                *Required
              </span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Action CTA Button (Cyan to Blue Gradient with Neon Glow) ─── */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? "Create Free Account" : "Sign In to MasmSpace"}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Switcher: Sign In <-> Sign Up ─────────────────────────────────── */}
      <div className="text-center pt-3 border-t border-white/[0.08]">
        <p className="text-xs text-zinc-400">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors cursor-pointer ml-1"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden font-sans">
      {/* ── Background Atmosphere (#030303 base with controlled 90px glow orbs) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Cyan Orb */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px]" />
        {/* Purple Orb */}
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px]" />
        {/* Fine background dot texture */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-lg p-8 rounded-3xl bg-[#09090b]/80 backdrop-blur-2xl border border-white/15 text-center font-mono text-xs text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            <span>Loading MasmSpace Auth...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

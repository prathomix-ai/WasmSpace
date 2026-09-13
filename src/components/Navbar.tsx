"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck, ArrowRight, Menu, X, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface NavbarProps {
  onOpenAuth?: () => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  // ── Smart Admin Navigation & User Auth State ────────────────────
  const [currentUser, setCurrentUser] = useState<{ role?: "admin" | "user"; email: string; name?: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("masmspace_current_user");
      localStorage.removeItem("wasmspace_current_user");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsDropdownOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    // 1. Sync from localStorage
    try {
      const savedUser = localStorage.getItem("masmspace_current_user") || localStorage.getItem("wasmspace_current_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. Sync from Supabase Auth
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        const userEmail = user?.email;
        if (userEmail) {
          setCurrentUser((prev) => prev || {
            email: userEmail,
            name: user?.user_metadata?.full_name || userEmail.split("@")[0],
            role: userEmail.toLowerCase().includes("admin") ? "admin" : "user",
          });
        }
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#06070a]/75 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
            <Image
              src="/masmspace-logo.png"
              alt="MasmSpace Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.55)]"
              priority
            />
          </div>
          <span className="font-mono font-extrabold text-xl tracking-tight text-zinc-900 dark:text-white">
            MasmSpace
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-500/10 dark:bg-neon-cyan/10 border border-cyan-500/30 dark:border-neon-cyan/30 text-cyan-600 dark:text-neon-cyan">
            v2.0 OS
          </span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300 font-sans">
          <a href="#features" className="hover:text-cyan-600 dark:hover:text-neon-cyan transition-colors">
            Features
          </a>
          <a href="#use-cases" className="hover:text-cyan-600 dark:hover:text-neon-cyan transition-colors">
            Use Cases
          </a>
          <a href="#pricing" className="hover:text-cyan-600 dark:hover:text-neon-cyan transition-colors">
            Pricing
          </a>
          <a href="#contact" className="hover:text-cyan-600 dark:hover:text-neon-cyan transition-colors">
            Contact
          </a>
        </nav>

        {/* Right: Theme Toggle, Admin Button, Sign In / Avatar & Canvas Launch CTA */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* ── 1. Smart Admin Navigation: Rendered ONLY if logged-in user is admin ── */}
          {currentUser?.role === "admin" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link
                href="/admin"
                id="navbar-admin-btn"
                className="relative px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold text-black bg-neon-cyan hover:bg-neon-cyan/90 border border-neon-cyan shadow-[0_0_20px_rgba(0,245,255,0.4)] hover:shadow-[0_0_30px_rgba(0,245,255,0.7)] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Admin Control Center"
              >
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Admin</span>
              </Link>
            </motion.div>
          )}

          {/* ── 2. Sign In Link (If Not Logged In) ── */}
          {!currentUser && (
            <Link
              href="/login"
              onClick={
                onOpenAuth
                  ? (e) => {
                      e.preventDefault();
                      onOpenAuth();
                    }
                  : undefined
              }
              className="text-sm font-medium text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-200 px-3 py-2 cursor-pointer"
              title="Sign In to MasmSpace"
            >
              Sign In
            </Link>
          )}

          {/* ── 3. Profile Avatar Button & Interactive Dropdown Menu ── */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              id="user-profile-avatar-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-8 h-8 rounded-full bg-cyan-500/15 dark:bg-neon-cyan/20 border border-cyan-500/30 dark:border-neon-cyan/40 flex items-center justify-center text-cyan-700 dark:text-neon-cyan text-xs font-mono font-bold shadow-sm select-none hover:ring-2 hover:ring-cyan-500/40 transition-all cursor-pointer focus:outline-none"
              title={currentUser ? `Logged in as ${currentUser.email}` : "Account Menu"}
              aria-label="Toggle user profile menu"
              aria-expanded={isDropdownOpen}
            >
              {currentUser?.email ? (
                currentUser.email[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>

            {/* Dropdown Menu (Absolute Positioning) */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-gray-800/60 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-md">
                {currentUser ? (
                  <div className="py-1 divide-y divide-gray-800/60">
                    <div className="px-4 py-2 text-xs font-mono text-gray-400 truncate">
                      {currentUser.email}
                    </div>
                    <div className="py-1">
                      <Link
                        href="/canvas"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                      >
                        Profile Settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-gray-800/50 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-1">
                    <Link
                      href="/login"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenAuth) onOpenAuth();
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onOpenAuth) onOpenAuth();
                      }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 3. Canvas Launch CTA Button ("Go to Canvas" when logged in, "Launch Canvas" when logged out) ── */}
          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
            <Link
              href="/canvas"
              className="relative group px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold text-white bg-zinc-900 dark:bg-zinc-950 border border-cyan-500/40 dark:border-neon-cyan/40 hover:border-cyan-400 dark:hover:border-neon-cyan shadow-[0_0_16px_rgba(0,245,255,0.25)] hover:shadow-[0_0_24px_rgba(0,245,255,0.5)] backdrop-blur-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="relative z-10">
                {currentUser ? "Go to Canvas" : "Launch Canvas"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 dark:text-neon-cyan group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-black/5 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-6 py-4 space-y-3 font-mono text-sm overflow-hidden"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-zinc-700 dark:text-zinc-300 hover:text-neon-cyan py-1"
            >
              Features
            </a>
            <a
              href="#use-cases"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-zinc-700 dark:text-zinc-300 hover:text-neon-cyan py-1"
            >
              Use Cases
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-zinc-700 dark:text-zinc-300 hover:text-neon-cyan py-1"
            >
              Pricing
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-zinc-700 dark:text-zinc-300 hover:text-neon-cyan py-1"
            >
              Contact
            </a>

            {/* Mobile Sign In or User Status */}
            {!currentUser ? (
              <div className="border-t border-black/5 dark:border-white/10 pt-2 space-y-1">
                <Link
                  href="/login"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="block text-cyan-600 dark:text-neon-cyan font-semibold py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="block text-zinc-700 dark:text-zinc-300 hover:text-white py-1"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 py-1 border-t border-black/5 dark:border-white/10 pt-2 space-y-1.5">
                <div className="truncate">
                  Logged in as: <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentUser.email}</span>
                </div>
                <Link
                  href="/canvas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-zinc-700 dark:text-zinc-300 hover:text-white py-1"
                >
                  Profile Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="block text-red-400 hover:text-red-300 py-1 text-left w-full cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Mobile Admin Link (Rendered only if admin) */}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-neon-cyan font-bold py-1 flex items-center gap-2 border-t border-black/5 dark:border-white/10 pt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;

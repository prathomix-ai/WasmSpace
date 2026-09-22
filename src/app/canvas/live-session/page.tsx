"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Users, Eye, Edit3, ArrowLeft, Copy, Check } from "lucide-react";
import Link from "next/link";

// Dynamic SSR-free import of the Architecture Canvas
const ArchitectureCanvas = dynamic(
  () => import("@/components/ArchitectureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-zinc-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-zinc-300">Connecting to Live Whiteboard Room…</span>
        </div>
      </div>
    ),
  }
);

function LiveSessionContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "session-main";
  const permission = (searchParams.get("permission") as "edit" | "view") || "edit";
  const isReadOnly = permission === "view";

  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initSessionUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Collaborator";
          setCurrentUser({ id: user.id, name });
          setIsReady(true);
          return;
        }
      } catch {}

      // Guest Collaborator auto-session initialization
      if (typeof window !== "undefined" && isMounted) {
        const stored = localStorage.getItem("prathomix_current_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCurrentUser({
              id: parsed.id || `guest_${Math.random().toString(36).substring(2, 7)}`,
              name: parsed.name || "Guest Collaborator",
            });
            setIsReady(true);
            return;
          } catch {}
        }

        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const guestObj = {
          id: `guest_${Math.random().toString(36).substring(2, 8)}`,
          name: `Guest #${randomNum}`,
          role: "user",
          tier: "free",
        };
        localStorage.setItem("prathomix_current_user", JSON.stringify(guestObj));
        setCurrentUser({ id: guestObj.id, name: guestObj.name });
        setIsReady(true);
      }
    }

    initSessionUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-zinc-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span className="text-zinc-300">Synchronizing Live Session…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#09090b] flex flex-col font-sans">
      {/* ── Top Clean Collaboration Status Bar ── */}
      <header className="h-12 border-b border-zinc-800 bg-[#111215] px-4 flex items-center justify-between text-xs text-zinc-300 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/canvas"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Return to Main Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace</span>
          </Link>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-100 font-mono">Live Whiteboard</span>
            <span className="text-zinc-500 font-mono text-[11px] hidden md:inline">
              Room: {room}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Permission Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium border ${
              isReadOnly
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}
          >
            {isReadOnly ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            <span>{isReadOnly ? "View-Only Mode" : "Can Edit"}</span>
          </div>

          {/* User Badge */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[11px]">
              <Users className="w-3 h-3 text-zinc-400" />
              <span>{currentUser.name}</span>
            </div>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-[11px] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Synchronized Architecture ReactFlow Canvas ── */}
      <div className="flex-1 relative overflow-hidden">
        <ArchitectureCanvas
          roomId={room}
          isLiveSession={true}
          permission={permission}
          isReadOnly={isReadOnly}
          sidebarCollapsed={true}
        />
      </div>
    </main>
  );
}

export default function LiveSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#09090b] text-zinc-400 font-mono text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <span className="text-zinc-300">Loading Live Collaboration Room…</span>
          </div>
        </div>
      }
    >
      <LiveSessionContent />
    </Suspense>
  );
}

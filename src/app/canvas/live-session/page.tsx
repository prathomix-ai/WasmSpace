"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

// Dynamic import of WhiteboardCanvas to prevent SSR issues with Excalidraw
const WhiteboardCanvas = dynamic(
  () => import("@/app/canvas/WhiteboardCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-zinc-300">Connecting to Live Canvas Room…</span>
        </div>
      </div>
    ),
  }
);

function LiveSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user && isMounted) {
          // Check fallback local session
          const stored = typeof window !== "undefined" ? localStorage.getItem("masmspace_current_user") : null;
          if (!stored) {
            const currentPath = window.location.pathname + window.location.search;
            router.replace(`/login?next=${encodeURIComponent(currentPath)}`);
            return;
          }
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.warn("[LiveSession] Auth verification fallback:", err);
        if (isMounted) setIsAuthenticated(true);
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-zinc-300">Verifying session credentials…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#050505]">
      <WhiteboardCanvas />
    </main>
  );
}

export default function LiveSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#06070a] text-zinc-400 font-mono text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-zinc-300">Loading Live Session…</span>
          </div>
        </div>
      }
    >
      <LiveSessionContent />
    </Suspense>
  );
}

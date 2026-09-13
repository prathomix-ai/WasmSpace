"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Share2,
  Copy,
  Check,
  X,
  Globe,
  Shield,
  ChevronDown,
  Users,
  Radio,
  UserCheck,
  UserX,
  PowerOff,
  Crown,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type PermissionType = "view" | "edit";

export interface PeerUser {
  id: string;
  name: string;
  email?: string;
  color?: string;
  isSelf?: boolean;
  isHost?: boolean;
}

export interface LiveShareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  shareUrl?: string;
  boardTitle?: string;
  roomId?: string;
  activePeers?: PeerUser[];
  isHost?: boolean;
  onEndSession?: () => void;
  onKickPeer?: (peerId: string) => void;
}

// Curated avatar background styles for multiplayer collaborators
const AVATAR_COLORS = [
  "bg-cyan-500 text-black border-cyan-300",
  "bg-purple-500 text-white border-purple-300",
  "bg-emerald-500 text-black border-emerald-300",
  "bg-amber-500 text-black border-amber-300",
  "bg-rose-500 text-white border-rose-300",
  "bg-indigo-500 text-white border-indigo-300",
  "bg-sky-500 text-black border-sky-300",
];

// Helper to compute 2-letter initials
function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "ME";
}

export function LiveShareModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  shareUrl: externalShareUrl,
  boardTitle = "Untitled Canvas",
  roomId = "room-default",
  activePeers: externalPeers,
  isHost = true,
  onEndSession,
  onKickPeer,
}: LiveShareModalProps) {
  // If controlled externally via isOpen/onClose props
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof externalIsOpen === "boolean";
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setShowEndConfirm(false);
    if (isControlled && externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [isControlled, externalOnClose]);

  // Permissions state
  const [permission, setPermission] = useState<PermissionType>("edit");
  const [copied, setCopied] = useState(false);

  // Host Action States
  const [kickingPeerId, setKickingPeerId] = useState<string | null>(null);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Dynamic share URL calculation
  const [shareUrl, setShareUrl] = useState(externalShareUrl || "");
  useEffect(() => {
    if (externalShareUrl) {
      setShareUrl(externalShareUrl);
    } else if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const cleanRoom = roomId || "session-main";
      setShareUrl(`${origin}/canvas/live-session?room=${cleanRoom}&permission=${permission}`);
    }
  }, [externalShareUrl, roomId, permission]);

  // Real-time connected peers state
  const [peers, setPeers] = useState<PeerUser[]>([]);
  const [currentAuthUser, setCurrentAuthUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Load current authenticated user
  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
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
            "Me";
          setCurrentAuthUser({
            id: user.id,
            name: fullName,
            email: user.email || "",
          });
          return;
        }
      } catch {}

      if (typeof window !== "undefined" && isMounted) {
        try {
          const stored = localStorage.getItem("masmspace_current_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            setCurrentAuthUser({
              id: parsed.id || "local-user",
              name: parsed.name || (parsed.email ? parsed.email.split("@")[0] : "Me"),
              email: parsed.email || "",
            });
          }
        } catch {}
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Supabase Realtime Presence & Broadcast Subscription
  useEffect(() => {
    if (!isOpen) return;

    // If external peers are passed from parent, seed them
    if (externalPeers && externalPeers.length > 0) {
      setPeers(externalPeers);
      setIsConnected(true);
    }

    const supabase = createClient();
    const cleanRoom = roomId || "session-main";
    const channelName = `presence:${cleanRoom}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentAuthUser?.id || `anon_${Math.random().toString(36).substring(2, 7)}`,
        },
      },
    });

    const updatePresenceList = () => {
      const presenceState = channel.presenceState();
      const peerList: PeerUser[] = [];
      const seenIds = new Set<string>();

      Object.entries(presenceState).forEach(([key, presences]: [string, any]) => {
        if (Array.isArray(presences)) {
          presences.forEach((p, idx) => {
            const id = p.user_id || key || `peer_${idx}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              const isSelf = currentAuthUser ? id === currentAuthUser.id : false;
              peerList.push({
                id,
                name: p.name || (p.email ? p.email.split("@")[0] : "Collaborator"),
                email: p.email || "",
                color: AVATAR_COLORS[peerList.length % AVATAR_COLORS.length],
                isSelf,
                isHost: p.isHost || (isHost && isSelf),
              });
            }
          });
        }
      });

      // Ensure current user is always included if present
      if (currentAuthUser && !seenIds.has(currentAuthUser.id)) {
        peerList.unshift({
          id: currentAuthUser.id,
          name: `${currentAuthUser.name}`,
          email: currentAuthUser.email,
          color: AVATAR_COLORS[0],
          isSelf: true,
          isHost: isHost,
        });
      }

      setPeers(peerList);
      setIsConnected(true);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        updatePresenceList();
      })
      .on("presence", { event: "join" }, () => {
        updatePresenceList();
      })
      .on("presence", { event: "leave" }, () => {
        updatePresenceList();
      })
      // Listen for participant kicked signal
      .on("broadcast", { event: "peer:kicked" }, ({ payload }) => {
        if (!payload?.targetPeerId) return;
        setPeers((prev) => prev.filter((p) => p.id !== payload.targetPeerId));
        // If current user is the target, terminate connection
        if (currentAuthUser && payload.targetPeerId === currentAuthUser.id) {
          handleClose();
        }
      })
      // Listen for room terminated signal from host
      .on("broadcast", { event: "room:terminated" }, () => {
        setIsConnected(false);
        setPeers([]);
        handleClose();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          if (currentAuthUser) {
            await channel.track({
              user_id: currentAuthUser.id,
              name: currentAuthUser.name,
              email: currentAuthUser.email,
              isHost: isHost,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (channel) {
        channel.untrack().catch(() => {});
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [isOpen, roomId, currentAuthUser, externalPeers, isHost, handleClose]);

  // Host Control: Kick / Remove Participant
  const handleKickUser = async (peer: PeerUser) => {
    if (!isHost || peer.isSelf) return;
    setKickingPeerId(peer.id);

    try {
      // 1. Broadcast disconnect signal to room channel
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "peer:kicked",
          payload: {
            targetPeerId: peer.id,
            targetName: peer.name,
            kickedBy: currentAuthUser?.name || "Host",
            timestamp: Date.now(),
          },
        });
      }

      // 2. Trigger parent callback if provided
      onKickPeer?.(peer.id);

      // 3. Optimistically remove from local peers state
      setPeers((prev) => prev.filter((p) => p.id !== peer.id));
    } catch (err) {
      console.error("Failed to kick participant:", err);
    } finally {
      setKickingPeerId(null);
    }
  };

  // Host Control: End Live Session
  const handleEndLiveSession = async () => {
    if (!isHost) return;
    setIsEndingSession(true);

    try {
      // 1. Broadcast room:terminated event to all peers
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "room:terminated",
          payload: {
            roomId,
            terminatedBy: currentAuthUser?.name || "Host",
            timestamp: Date.now(),
          },
        });

        await channelRef.current.untrack().catch(() => {});
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // 2. Trigger parent callback to revert canvas to private session
      onEndSession?.();

      setIsConnected(false);
      setPeers([]);
      setShowEndConfirm(false);
      handleClose();
    } catch (err) {
      console.error("Failed to end live session:", err);
    } finally {
      setIsEndingSession(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Compute display peers (exclude self for the other peers count)
  const otherPeers = peers.filter((p) => !p.isSelf);

  return (
    <>
      {/* ── Standalone Share Button (Rendered when uncontrolled) ────────── */}
      {!isControlled && (
        <button
          onClick={handleOpen}
          aria-label="Share Canvas"
          className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold text-zinc-800 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 backdrop-blur-md border border-black/10 dark:border-white/20 hover:border-cyan-500 dark:hover:border-neon-cyan shadow-sm hover:shadow-[0_0_16px_rgba(0,245,255,0.3)] transition-all duration-200 cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-neon-cyan" />
          <span>Share</span>
        </button>
      )}

      {/* ── Modal Pop-up ──────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-share-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Glass Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal Panel (Glassmorphism Card) */}
          <div className="relative w-[95%] md:max-w-2xl mx-auto rounded-3xl bg-[#09090b]/90 backdrop-blur-2xl border border-white/10 shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden z-10 text-zinc-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Ambient Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_16px_rgba(6,182,212,0.25)]">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="live-share-modal-title" className="font-mono font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                    Share Live Canvas
                  </h3>
                  <p className="text-xs text-zinc-400 truncate max-w-[240px] sm:max-w-xs font-mono">
                    {boardTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                aria-label="Close share dialog"
                className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">

              {/* Permission & Access Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold text-white">General Access</div>
                    <div className="text-[11px] text-zinc-400">
                      Authenticated collaborators with this live room link can join
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu for Permissions */}
                <div className="relative shrink-0">
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as PermissionType)}
                    aria-label="Collaboration permission level"
                    className="appearance-none font-mono text-xs font-bold px-4 py-2 pr-9 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all cursor-pointer text-zinc-100 shadow-sm"
                  >
                    <option value="edit">Can Edit (Full Access)</option>
                    <option value="view">Can View Only</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Read-only URL Input with Copy Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono font-medium text-zinc-300">
                    Direct Live Collaboration Link
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Auth Required on Join
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      aria-label="Whiteboard share link"
                      className="w-full pl-3.5 pr-4 py-2.5 rounded-xl font-mono text-xs bg-white/5 border border-white/10 text-zinc-200 select-all outline-none focus:border-cyan-400"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  </div>

                  {/* Copy Link Button with Visual Feedback */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm ${
                      copied
                        ? "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] scale-105"
                        : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_16px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-black" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic Real-Time Connected Peers Indicator & Participant Management */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Live Avatar Stack with Real User Initials */}
                    {peers.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden items-center">
                        {peers.slice(0, 5).map((peer, idx) => (
                          <div
                            key={peer.id || idx}
                            title={`${peer.name}${peer.email ? ` (${peer.email})` : ""}${peer.isSelf ? " - You" : ""}`}
                            className={`w-7 h-7 rounded-full border-2 border-[#09090b] flex items-center justify-center text-[10px] font-mono font-bold shadow-md transition-transform hover:scale-110 hover:z-20 cursor-default ${
                              peer.color || AVATAR_COLORS[idx % AVATAR_COLORS.length]
                            }`}
                          >
                            {getInitials(peer.name, peer.email)}
                          </div>
                        ))}
                        {peers.length > 5 && (
                          <div className="w-7 h-7 rounded-full border-2 border-[#09090b] bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-mono font-bold">
                            +{peers.length - 5}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Dynamic Peer Count and Room State */}
                    <div className="text-xs font-mono">
                      {otherPeers.length > 0 ? (
                        <span className="text-zinc-300">
                          <strong className="text-cyan-400 font-bold">
                            {otherPeers.length} {otherPeers.length === 1 ? "peer" : "peers"}
                          </strong>{" "}
                          active in room
                        </span>
                      ) : (
                        <span className="text-zinc-400">
                          <strong className="text-zinc-200 font-bold">Only you</strong> in this session
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supabase Presence Status Badge */}
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span>{isConnected ? "Realtime Presence" : "Connecting..."}</span>
                  </div>
                </div>

                {/* Participant Management List with Kick Controls */}
                {peers.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {peers.map((peer, idx) => (
                      <div
                        key={peer.id || idx}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono border transition-all ${
                          peer.isSelf
                            ? "bg-cyan-500/10 border-cyan-500/25 text-zinc-100"
                            : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                              peer.color || AVATAR_COLORS[idx % AVATAR_COLORS.length]
                            }`}
                          >
                            {getInitials(peer.name, peer.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate max-w-[140px] sm:max-w-[180px] font-semibold text-zinc-200">
                                {peer.name}
                              </span>
                              {peer.isSelf && (
                                <span className="text-[9px] px-1 rounded bg-cyan-400/20 text-cyan-300 font-bold">
                                  You
                                </span>
                              )}
                              {peer.isHost ? (
                                <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-bold flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Host
                                </span>
                              ) : (
                                <span className="text-[9px] px-1 rounded bg-white/5 text-zinc-400">
                                  Peer
                                </span>
                              )}
                            </div>
                            {peer.email && (
                              <p className="text-[10px] text-zinc-500 truncate max-w-[180px]">
                                {peer.email}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Kick / Remove Participant Button (Host Only, Non-Self) */}
                        {isHost && !peer.isSelf && (
                          <button
                            type="button"
                            onClick={() => handleKickUser(peer)}
                            disabled={kickingPeerId === peer.id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer group/kick shrink-0 shadow-sm"
                            title={`Remove ${peer.name} from live room`}
                            aria-label={`Remove ${peer.name}`}
                          >
                            {kickingPeerId === peer.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                            ) : (
                              <UserX className="w-3.5 h-3.5 group-hover/kick:scale-110 transition-transform" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Host Control: Prominent End Live Session Button */}
                {isHost && (
                  <div className="pt-2 border-t border-white/10">
                    {!showEndConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowEndConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-mono text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 shadow-[0_0_16px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] transition-all cursor-pointer group"
                      >
                        <PowerOff className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                        <span>End Live Session</span>
                      </button>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-bold text-rose-200 font-mono">End Live Collaboration Session?</p>
                            <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                              This will disconnect all {otherPeers.length} connected {otherPeers.length === 1 ? "participant" : "participants"}, terminate the WebSocket room, and revert your canvas to private mode.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowEndConfirm(false)}
                            disabled={isEndingSession}
                            className="px-3 py-1.5 rounded-xl font-mono text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleEndLiveSession}
                            disabled={isEndingSession}
                            className="px-4 py-1.5 rounded-xl font-mono text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-[0_0_16px_rgba(225,29,72,0.5)] transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            {isEndingSession ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Terminating…</span>
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-3.5 h-3.5" />
                                <span>Yes, End Session</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Encrypted WebSocket presence channel</span>
              </span>

              <button
                onClick={handleClose}
                className="px-4 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveShareModal;

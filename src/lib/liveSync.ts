/**
 * Real-time Live Whiteboard Collaboration Sync Engine
 * Architected for High Concurrency (up to 1,000 users/viewers).
 * Combines cross-tab BroadcastChannel with Supabase Realtime Channels.
 * Implements cursor throttling (~25fps), coordinate batching, and payload compression.
 */

import { createClient } from "@/lib/supabase/client";
import { type Node, type Edge } from "@xyflow/react";

export interface LiveCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastUpdated: number;
}

export interface CompactCoordinate {
  id: string;
  x: number;
  y: number;
}

export interface LiveSyncMessage {
  type:
    | "canvas_state"
    | "request_canvas_state"
    | "cursor_move"
    | "batch_coordinates"
    | "user_joined";
  senderId: string;
  senderName?: string;
  senderColor?: string;
  nodes?: Node<any>[];
  edges?: Edge[];
  boardTitle?: string;
  cursor?: { x: number; y: number };
  coordinates?: CompactCoordinate[];
}

export class LiveSyncManager {
  private roomId: string;
  private userId: string;
  private userName: string;
  private userColor: string;
  private isHost: boolean;
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: any = null;
  private onStateReceived?: (nodes: Node<any>[], edges: Edge[], title?: string) => void;
  private onCoordinatesReceived?: (coordinates: CompactCoordinate[]) => void;
  private onCursorReceived?: (cursor: LiveCursor) => void;
  private onRequestState?: () => { nodes: Node<any>[]; edges: Edge[]; title?: string } | null;
  private onPeersUpdated?: (peersCount: number) => void;
  private isDestroyed = false;

  // Throttling and Batching Queues
  private lastCursorSent = 0;
  private cursorThrottleMs = 40; // ~25 frames per second
  private coordinateBuffer: Map<string, CompactCoordinate> = new Map();
  private coordinateFlushTimer: NodeJS.Timeout | null = null;
  private coordinateBatchIntervalMs = 50; // Batch updates into 50ms windows

  constructor(options: {
    roomId: string;
    userId: string;
    userName: string;
    userColor: string;
    isHost?: boolean;
    onStateReceived?: (nodes: Node<any>[], edges: Edge[], title?: string) => void;
    onCoordinatesReceived?: (coordinates: CompactCoordinate[]) => void;
    onCursorReceived?: (cursor: LiveCursor) => void;
    onRequestState?: () => { nodes: Node<any>[]; edges: Edge[]; title?: string } | null;
    onPeersUpdated?: (peersCount: number) => void;
  }) {
    this.roomId = options.roomId;
    this.userId = options.userId;
    this.userName = options.userName;
    this.userColor = options.userColor;
    this.isHost = Boolean(options.isHost);
    this.onStateReceived = options.onStateReceived;
    this.onCoordinatesReceived = options.onCoordinatesReceived;
    this.onCursorReceived = options.onCursorReceived;
    this.onRequestState = options.onRequestState;
    this.onPeersUpdated = options.onPeersUpdated;

    this.init();
  }

  private init() {
    // 1. Browser BroadcastChannel for zero-latency local tab sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(`masmspace_room_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (err) {
        console.warn("[LiveSync] BroadcastChannel init notice:", err);
      }
    }

    // 2. Setup Supabase Realtime channel with presence & broadcast
    try {
      const supabase = createClient();
      const channelName = `canvas_room_${this.roomId}`;
      this.supabaseChannel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: this.userId },
        },
      });

      this.supabaseChannel
        .on("broadcast", { event: "sync" }, ({ payload }: { payload: LiveSyncMessage }) => {
          this.handleIncomingMessage(payload);
        })
        .on("presence", { event: "sync" }, () => {
          if (this.isDestroyed) return;
          const state = this.supabaseChannel.presenceState();
          const count = Object.keys(state).length;
          this.onPeersUpdated?.(Math.max(1, count));
        })
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED" && !this.isDestroyed) {
            this.supabaseChannel.track({
              user_id: this.userId,
              name: this.userName,
              color: this.userColor,
              isHost: this.isHost,
            });

            if (!this.isHost) {
              this.requestCanvasState();
            }
          }
        });
    } catch (err) {
      console.warn("[LiveSync] Supabase Realtime init notice:", err);
    }

    if (!this.isHost) {
      setTimeout(() => this.requestCanvasState(), 300);
      setTimeout(() => this.requestCanvasState(), 1200);
    }
  }

  private handleIncomingMessage(msg: LiveSyncMessage) {
    if (!msg || msg.senderId === this.userId || this.isDestroyed) return;

    if (msg.type === "request_canvas_state") {
      const current = this.onRequestState?.();
      if (current && current.nodes && current.nodes.length > 0) {
        this.broadcastState(current.nodes, current.edges, current.title);
      }
      return;
    }

    if (msg.type === "canvas_state") {
      if (msg.nodes) {
        this.onStateReceived?.(msg.nodes, msg.edges || [], msg.boardTitle);
      }
      return;
    }

    if (msg.type === "batch_coordinates" && msg.coordinates) {
      this.onCoordinatesReceived?.(msg.coordinates);
      return;
    }

    if (msg.type === "cursor_move" && msg.cursor) {
      this.onCursorReceived?.({
        id: msg.senderId,
        name: msg.senderName || "Collaborator",
        color: msg.senderColor || "#06b6d4",
        x: msg.cursor.x,
        y: msg.cursor.y,
        lastUpdated: Date.now(),
      });
      return;
    }
  }

  /**
   * Broadcasts complete whiteboard state (nodes & edges).
   * Reserved for structural changes or drag stops (never during continuous drag).
   */
  public broadcastState(nodes: Node<any>[], edges: Edge[], boardTitle?: string) {
    if (this.isDestroyed) return;

    // Sanitize nodes to keep WebSocket payload minimal
    const sanitizedNodes = nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: n.data,
      width: n.width,
      height: n.height,
    }));

    const sanitizedEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      style: e.style,
      animated: e.animated,
      data: e.data,
    }));

    const payload: LiveSyncMessage = {
      type: "canvas_state",
      senderId: this.userId,
      senderName: this.userName,
      senderColor: this.userColor,
      nodes: sanitizedNodes,
      edges: sanitizedEdges,
      boardTitle,
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `masmspace_room_snapshot_${this.roomId}`,
          JSON.stringify({ nodes: sanitizedNodes, edges: sanitizedEdges, boardTitle, time: Date.now() })
        );
      } catch {}
    }

    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    try {
      this.supabaseChannel?.send({
        type: "broadcast",
        event: "sync",
        payload,
      });
    } catch {}
  }

  /**
   * Batches lightweight coordinate movements into a 50ms window.
   * Drastically reduces WebSocket payload size for 1000 concurrent users.
   */
  public queueCoordinateUpdate(id: string, x: number, y: number) {
    if (this.isDestroyed) return;

    this.coordinateBuffer.set(id, { id, x: Math.round(x), y: Math.round(y) });

    if (!this.coordinateFlushTimer) {
      this.coordinateFlushTimer = setTimeout(() => {
        this.flushCoordinateBatch();
      }, this.coordinateBatchIntervalMs);
    }
  }

  public flushCoordinateBatch() {
    if (this.coordinateFlushTimer) {
      clearTimeout(this.coordinateFlushTimer);
      this.coordinateFlushTimer = null;
    }

    if (this.coordinateBuffer.size === 0 || this.isDestroyed) return;

    const coordinates = Array.from(this.coordinateBuffer.values());
    this.coordinateBuffer.clear();

    const payload: LiveSyncMessage = {
      type: "batch_coordinates",
      senderId: this.userId,
      coordinates,
    };

    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    try {
      this.supabaseChannel?.send({
        type: "broadcast",
        event: "sync",
        payload,
      });
    } catch {}
  }

  public requestCanvasState() {
    if (this.isDestroyed) return;

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`masmspace_room_snapshot_${this.roomId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.nodes && Array.isArray(parsed.nodes)) {
            this.onStateReceived?.(parsed.nodes, parsed.edges || [], parsed.boardTitle);
          }
        }
      } catch {}
    }

    const payload: LiveSyncMessage = {
      type: "request_canvas_state",
      senderId: this.userId,
    };

    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    try {
      this.supabaseChannel?.send({
        type: "broadcast",
        event: "sync",
        payload,
      });
    } catch {}
  }

  /**
   * Throttles cursor movements to ~25fps (40ms) to avoid WebSocket flooding.
   */
  public broadcastCursor(x: number, y: number) {
    if (this.isDestroyed) return;

    const now = Date.now();
    if (now - this.lastCursorSent < this.cursorThrottleMs) {
      return;
    }
    this.lastCursorSent = now;

    const payload: LiveSyncMessage = {
      type: "cursor_move",
      senderId: this.userId,
      senderName: this.userName,
      senderColor: this.userColor,
      cursor: { x: Math.round(x), y: Math.round(y) },
    };

    try {
      this.broadcastChannel?.postMessage(payload);
    } catch {}

    try {
      this.supabaseChannel?.send({
        type: "broadcast",
        event: "sync",
        payload,
      });
    } catch {}
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.coordinateFlushTimer) {
      clearTimeout(this.coordinateFlushTimer);
      this.coordinateFlushTimer = null;
    }
    try {
      this.broadcastChannel?.close();
    } catch {}
    try {
      if (this.supabaseChannel) {
        const supabase = createClient();
        supabase.removeChannel(this.supabaseChannel);
      }
    } catch {}
  }
}

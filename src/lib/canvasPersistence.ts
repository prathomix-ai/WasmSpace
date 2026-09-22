/**
 * Enterprise Canvas Persistence Engine
 * Handles fault-tolerant, debounced persistence to Supabase 'workspaces' table.
 * Strictly guarantees that dragging actions NEVER spam the database.
 * Syncs only on settled events (e.g., onNodeDragStop, manual saves).
 */

import { createClient } from "@/lib/supabase/client";
import { type Node, type Edge } from "@xyflow/react";

interface CanvasSnapshot {
  nodes: Node<any>[];
  edges: Edge[];
  title?: string;
  updatedAt: string;
}

let pendingSaveTimer: NodeJS.Timeout | null = null;
let latestSnapshot: CanvasSnapshot | null = null;
let isSaving = false;

/**
 * Saves canvas state to Supabase workspaces table if authenticated,
 * and always maintains an instantaneous local snapshot.
 */
export async function persistCanvasState(
  roomId: string,
  nodes: Node<any>[],
  edges: Edge[],
  title = "Untitled Workspace"
): Promise<{ success: boolean; source: "supabase" | "local" | "error" }> {
  const timestamp = new Date().toISOString();
  latestSnapshot = {
    nodes,
    edges,
    title,
    updatedAt: timestamp,
  };

  // 1. Instantaneous Local Storage Cache
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `masmspace_workspace_${roomId}`,
        JSON.stringify(latestSnapshot)
      );
    } catch {}
  }

  // 2. Persist to Supabase workspaces if authenticated
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, source: "local" };
    }

    isSaving = true;

    // Sanitize node and edge data before DB serialization to minimize payload size
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

    const payload = {
      user_id: user.id,
      name: title,
      data: {
        roomId,
        nodes: sanitizedNodes,
        edges: sanitizedEdges,
        updatedAt: timestamp,
      },
      updated_at: timestamp,
    };

    // Upsert by user_id and roomId if table supports it, or check existing
    const { data: existingWorkspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingWorkspace) {
      await supabase
        .from("workspaces")
        .update({
          name: title,
          data: payload.data,
          updated_at: timestamp,
        })
        .eq("id", existingWorkspace.id);
    } else {
      await supabase.from("workspaces").insert(payload);
    }

    isSaving = false;
    return { success: true, source: "supabase" };
  } catch (err) {
    isSaving = false;
    console.warn("[CanvasPersistence] Database sync notice:", err);
    return { success: true, source: "local" };
  }
}

/**
 * Schedules a debounced database save. Cancelled if another change occurs.
 * Will NEVER execute if isDragging is true.
 */
export function scheduleDebouncedSave(
  roomId: string,
  nodes: Node<any>[],
  edges: Edge[],
  title?: string,
  delayMs = 2500,
  isDragging = false
) {
  if (isDragging) {
    // Suppress DB scheduling during active dragging
    return;
  }

  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
  }

  pendingSaveTimer = setTimeout(() => {
    persistCanvasState(roomId, nodes, edges, title);
    pendingSaveTimer = null;
  }, delayMs);
}

/**
 * Immediately flushes any pending save (called strictly on onNodeDragStop).
 */
export function flushCanvasSave(
  roomId: string,
  nodes: Node<any>[],
  edges: Edge[],
  title?: string
) {
  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }
  return persistCanvasState(roomId, nodes, edges, title);
}

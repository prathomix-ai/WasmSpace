// ─────────────────────────────────────────────────────────────────────────────
// Prathomix — AI Summarize Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CanvasShape {
  id: string;
  type: string;
  text?: string;
  props?: Record<string, unknown>;
}

export interface SummarizeRequest {
  canvas_text?: string;
  shapes?: CanvasShape[];
  board_title?: string;
  context?: string;
}

export interface ActionItem {
  task: string;
  owner?: string | null;
  due?: string | null;
  priority: "high" | "medium" | "low";
}

export type SessionMood =
  | "productive"
  | "brainstorming"
  | "planning"
  | "retrospective";

export interface SummarizeResponse {
  summary: string;
  key_points: string[];
  action_items: ActionItem[];
  decisions: string[];
  next_steps: string[];
  mood: SessionMood;
  model_used: string;
  processing_time_ms: number;
}

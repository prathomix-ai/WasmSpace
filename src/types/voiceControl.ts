// ─────────────────────────────────────────────────────────────────────────────
// Prathomix — Voice Control Types
// ─────────────────────────────────────────────────────────────────────────────

export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "unsupported"
  | "permission_denied"
  | "error";

export type VoiceIntentType =
  | "CLEAR_BOARD"
  | "DRAW_RECTANGLE"
  | "DRAW_CIRCLE"
  | "DRAW_TRIANGLE"
  | "DRAW_STAR"
  | "DRAW_DIAMOND"
  | "DRAW_ARROW"
  | "ADD_NOTE"
  | "ADD_TEXT"
  | "ZOOM_IN"
  | "ZOOM_OUT"
  | "ZOOM_FIT"
  | "UNDO"
  | "REDO"
  | "SELECT_ALL"
  | "DELETE_SELECTION"
  | "TOGGLE_CODE_WIDGET"
  | "TRIGGER_SUMMARY";

export interface RecognizedCommand {
  id: string;
  transcript: string;
  intent: VoiceIntentType;
  description: string;
  payload?: string;
  confidence: number;
  timestamp: string;
}

export interface VoiceCommandRule {
  intent: VoiceIntentType;
  title: string;
  description: string;
  examples: string[];
  patterns: RegExp[];
  actionDescription: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Advanced Multi-Step Action Pipeline Types (Free vs PRO)
// ─────────────────────────────────────────────────────────────────────────────
export type VoiceActionType =
  | "add_shape"
  | "add_text"
  | "update_color"
  | "resize_element"
  | "delete"
  | "duplicate"
  | "clear_canvas"
  | "select_all";

export interface CanvasVoiceAction {
  action: VoiceActionType;
  type?: "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text" | string;
  x?: number;
  y?: number;
  id?: string;
  targetId?: string;
  shape?: "rectangle" | "ellipse" | "diamond" | "arrow" | "line";
  text?: string;
  color?: string; // hex or CSS color name
  backgroundColor?: string;
  width?: number;
  height?: number;
  scale?: number; // scale multiplier e.g. 2 for 2x larger
  label?: string;
  fontSize?: number;
  isSelected?: boolean;
}

export interface VoiceCommandResponse {
  success: boolean;
  tier: "free" | "pro";
  isPro: boolean;
  actions: CanvasVoiceAction[];
  rawTranscript: string;
  requiresProForMultiStep?: boolean;
  warning?: string;
  error?: string;
  code?: string;
  latencyMs?: number;
}

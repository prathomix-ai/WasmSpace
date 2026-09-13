// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — Voice Control Types
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

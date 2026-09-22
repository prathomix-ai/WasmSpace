import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { executeWithLoadBalancer } from "@/lib/ai-balancer";
import { CanvasVoiceAction, VoiceCommandResponse } from "@/types/voiceControl";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Admin Client for Tier & Quota Verification
// ─────────────────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

// In-memory fallback quota store for development or offline DB
const localVoiceQuota = new Map<string, { used: number; limit: number; resetAt: number }>();

// Clean hex color mapping for voice color names
const COLOR_NAME_MAP: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  cyan: "#00f5ff",
  neon_cyan: "#00f5ff",
  green: "#10b981",
  emerald: "#10b981",
  yellow: "#eab308",
  amber: "#f59e0b",
  orange: "#f97316",
  purple: "#a855f7",
  violet: "#8b5cf6",
  pink: "#ec4899",
  rose: "#f43f5e",
  silver: "#c0c0c0",
  gray: "#9ca3af",
  grey: "#9ca3af",
  white: "#ffffff",
  black: "#1e1e1e",
  dark: "#121212",
};

const SYSTEM_VOICE_PROMPT = `
You are an expert Voice Intent Parser and Canvas Action Orchestrator.
CRITICAL MANDATE: You MUST output STRICT RAW JSON ONLY.
DO NOT wrap the response in markdown code blocks (\`\`\`json or \`\`\`).
DO NOT include any conversational text, introductory greeting, markdown styling, or commentary.
Your entire output must start with '{' and end with '}'.

OUTPUT SCHEMA:
{
  "actions": [
    {
      "action": "add_shape" | "add_text" | "update_color" | "resize_element" | "duplicate" | "delete" | "clear_canvas" | "select_all",
      "type": "rectangle" | "ellipse" | "diamond" | "arrow" | "line" | "text",
      "shape": "rectangle" | "ellipse" | "diamond" | "arrow" | "line",
      "x": number or null,
      "y": number or null,
      "width": number (default ~220),
      "height": number (default ~130),
      "color": "#hex" (stroke/border color e.g. "#00f5ff"),
      "backgroundColor": "#hex or rgba" (fill color e.g. "rgba(0, 245, 255, 0.1)"),
      "text": "text content if adding text or note",
      "label": "optional text inside shape",
      "scale": number (multiplier e.g. 1.5 for 1.5x larger),
      "id": "temp1",
      "targetId": "temp1",
      "isSelected": boolean
    }
  ]
}

Strict Rules:
1. Always convert spoken colors to hex codes (e.g. "silver" -> "#c0c0c0", "red" -> "#ef4444", "cyan" -> "#00f5ff", "neon cyan" -> "#00f5ff", "emerald" -> "#10b981", "white" -> "#ffffff").
2. For add_shape, specify both "type" and "shape" (e.g. "rectangle", "ellipse", "diamond").
3. For add_text, specify action: "add_text", type: "text", text: "..."
4. If the user refers to "this", "it", "the selection", "selected", or "these", set "isSelected": true.
5. Multi-step commands (e.g., "draw a red circle, make it bigger, and copy it"):
   - Step 1: { "action": "add_shape", "type": "ellipse", "shape": "ellipse", "color": "#ef4444", "id": "temp1" }
   - Step 2: { "action": "resize_element", "targetId": "temp1", "scale": 1.5 }
   - Step 3: { "action": "duplicate", "targetId": "temp1" }
6. Return PURE JSON ONLY.
`.trim();

/**
 * Strips markdown code blocks and conversational wrappers before JSON.parse()
 */
function cleanAndSanitizeLlmJson(rawOutput: string): string {
  if (!rawOutput || typeof rawOutput !== "string") return "";

  let text = rawOutput.trim();

  // 1. Remove markdown code fences (```json ... ``` or ``` ...)
  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/\s*```$/i, "");
  text = text.replace(/```(?:json)?/gi, "");
  text = text.replace(/```/g, "");

  // 2. Locate outermost JSON structure ({...} or [...])
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    text = text.slice(startIdx);
  }

  const lastBrace = text.lastIndexOf("}");
  const lastBracket = text.lastIndexOf("]");
  const endIdx = Math.max(lastBrace, lastBracket);

  if (endIdx !== -1 && endIdx < text.length - 1) {
    text = text.slice(0, endIdx + 1);
  }

  // 3. Remove trailing commas before closing braces/brackets
  text = text.replace(/,\s*([\]}])/g, "$1");

  return text.trim();
}

// Helper to extract JSON from arbitrary LLM text (markdown, conversational, trailing commas)
function extractAndParseActions(rawAiText: string, transcript: string): CanvasVoiceAction[] {
  if (!rawAiText || typeof rawAiText !== "string") {
    console.warn("[/api/voice-command] No raw AI text received, using keyword fallback.");
    return fallbackKeywordExtraction(transcript);
  }

  const cleanText = cleanAndSanitizeLlmJson(rawAiText);

  // 1. Try direct parse on sanitized string
  try {
    const parsed = JSON.parse(cleanText);
    const rawList = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.actions)
      ? parsed.actions
      : [parsed];
    const sanitized = sanitizeActionsList(rawList);
    if (sanitized.length > 0) return sanitized;
  } catch (parseErr: any) {
    console.warn("[/api/voice-command] Direct JSON.parse failed on sanitized text:", parseErr?.message);
  }

  // 2. Extract JSON array [...] or object {...} via regex
  const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const fixedJson = arrayMatch[0].replace(/,\s*([\]}])/g, "$1");
      const parsed = JSON.parse(fixedJson);
      if (Array.isArray(parsed)) {
        const sanitized = sanitizeActionsList(parsed);
        if (sanitized.length > 0) return sanitized;
      }
    } catch {}
  }

  const objMatch = cleanText.match(/\{[\s\S]*"actions"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
  if (objMatch) {
    try {
      const fixedJson = objMatch[0].replace(/,\s*([\]}])/g, "$1");
      const parsed = JSON.parse(fixedJson);
      if (Array.isArray(parsed?.actions)) {
        const sanitized = sanitizeActionsList(parsed.actions);
        if (sanitized.length > 0) return sanitized;
      }
    } catch {}
  }

  // 3. Regex extraction of individual action objects: { "action": ... }
  const individualObjectMatches = cleanText.match(/\{[^{}]*"action"\s*:\s*"[^"]+"[^{}]*\}/gi);
  if (individualObjectMatches && individualObjectMatches.length > 0) {
    const extractedList: any[] = [];
    for (const itemStr of individualObjectMatches) {
      try {
        const fixedStr = itemStr.replace(/,\s*([\]}])/g, "$1");
        const obj = JSON.parse(fixedStr);
        if (obj && typeof obj === "object") extractedList.push(obj);
      } catch {}
    }
    const sanitized = sanitizeActionsList(extractedList);
    if (sanitized.length > 0) return sanitized;
  }

  console.warn("[/api/voice-command] LLM parsing yielded 0 actions, running fallback keyword extraction.");
  return fallbackKeywordExtraction(transcript);
}

// Action normalization & schema sanitation
function sanitizeActionsList(rawList: any[]): CanvasVoiceAction[] {
  const result: CanvasVoiceAction[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;

    let rawAction = String(item.action || "").toLowerCase().trim();

    // Map common aliases
    if (["draw_shape", "create_shape", "make_shape", "shape"].includes(rawAction)) {
      rawAction = "add_shape";
    } else if (["write_text", "create_text", "text", "label"].includes(rawAction)) {
      rawAction = "add_text";
    } else if (["color", "change_color", "recolor", "set_color"].includes(rawAction)) {
      rawAction = "update_color";
    } else if (["scale", "resize", "grow", "shrink"].includes(rawAction)) {
      rawAction = "resize_element";
    } else if (["copy", "clone"].includes(rawAction)) {
      rawAction = "duplicate";
    } else if (["remove", "erase"].includes(rawAction)) {
      rawAction = "delete";
    } else if (["clear", "reset_canvas", "wipe"].includes(rawAction)) {
      rawAction = "clear_canvas";
    }

    // Supported actions filter
    const validActions = [
      "add_shape",
      "add_text",
      "update_color",
      "resize_element",
      "duplicate",
      "delete",
      "clear_canvas",
      "select_all",
    ];
    if (!validActions.includes(rawAction)) continue;

    const actionObj: CanvasVoiceAction = {
      action: rawAction as any,
    };

    if (item.id && typeof item.id === "string") {
      actionObj.id = item.id.trim();
    }
    if (item.targetId && typeof item.targetId === "string") {
      actionObj.targetId = item.targetId.trim();
    }
    if (item.isSelected === true) {
      actionObj.isSelected = true;
    }

    if (item.x !== undefined && isFinite(Number(item.x))) {
      actionObj.x = Number(item.x);
    }
    if (item.y !== undefined && isFinite(Number(item.y))) {
      actionObj.y = Number(item.y);
    }

    // Shape attributes
    if (rawAction === "add_shape") {
      let shape = String(item.type || item.shape || "rectangle").toLowerCase().trim();
      if (["circle", "oval", "round"].includes(shape)) shape = "ellipse";
      if (["box", "square"].includes(shape)) shape = "rectangle";
      if (["rhombus"].includes(shape)) shape = "diamond";
      const validShape = ["rectangle", "ellipse", "diamond", "arrow", "line"].includes(shape)
        ? shape
        : "rectangle";
      actionObj.shape = validShape as any;
      actionObj.type = validShape as any;

      const w = Number(item.width);
      actionObj.width = isFinite(w) && w > 0 ? Math.min(Math.max(w, 40), 2000) : 200;

      const h = Number(item.height);
      actionObj.height = isFinite(h) && h > 0 ? Math.min(Math.max(h, 40), 2000) : 130;

      if (item.label && typeof item.label === "string") {
        actionObj.label = item.label.slice(0, 100);
      }
    }

    // Text attributes
    if (rawAction === "add_text") {
      actionObj.type = "text";
      actionObj.text = String(item.text || "Voice Note").slice(0, 200);
      const fs = Number(item.fontSize);
      actionObj.fontSize = isFinite(fs) && fs > 0 ? Math.min(Math.max(fs, 12), 120) : 24;
    }

    // Colors
    if (item.color) {
      actionObj.color = normalizeColor(item.color);
    }
    if (item.backgroundColor) {
      actionObj.backgroundColor = normalizeColor(item.backgroundColor);
    }

    // Scale / Dimensions
    if (rawAction === "resize_element") {
      const s = Number(item.scale);
      actionObj.scale = isFinite(s) && s > 0 ? Math.min(Math.max(s, 0.1), 10) : 1.5;
      if (item.width && isFinite(Number(item.width))) {
        actionObj.width = Math.min(Math.max(Number(item.width), 30), 3000);
      }
      if (item.height && isFinite(Number(item.height))) {
        actionObj.height = Math.min(Math.max(Number(item.height), 30), 3000);
      }
    }

    result.push(actionObj);
  }

  return result;
}

// Normalize color names or hex strings
function normalizeColor(colorStr: string): string {
  if (!colorStr || typeof colorStr !== "string") return "#00f5ff";
  const clean = colorStr.toLowerCase().trim().replace(/['"]/g, "");
  if (COLOR_NAME_MAP[clean]) return COLOR_NAME_MAP[clean];
  // Check if valid hex code
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(clean)) return clean;
  // Check if valid rgba/rgb
  if (/^rgba?\([\d\s,.]+\)$/i.test(clean)) return clean;
  return "#00f5ff"; // Fallback to brand neon cyan
}

// Intelligent keyword fallback if LLM produces completely unparseable output
function fallbackKeywordExtraction(transcript: string): CanvasVoiceAction[] {
  const text = transcript.toLowerCase();
  const detectedColor = Object.keys(COLOR_NAME_MAP).find((c) => text.includes(c));
  const hexColor = detectedColor ? COLOR_NAME_MAP[detectedColor] : "#00f5ff";

  if (text.includes("clear") || text.includes("delete all") || text.includes("wipe")) {
    return [{ action: "clear_canvas" }];
  }
  if (text.includes("delete") || text.includes("remove") || text.includes("erase")) {
    return [{ action: "delete" }];
  }
  if (text.includes("select all")) {
    return [{ action: "select_all" }];
  }
  if (text.includes("copy") || text.includes("duplicate")) {
    return [{ action: "duplicate" }];
  }
  if (text.includes("circle") || text.includes("ellipse") || text.includes("round")) {
    return [{ action: "add_shape", shape: "ellipse", color: hexColor, width: 140, height: 140 }];
  }
  if (text.includes("diamond") || text.includes("rhombus")) {
    return [{ action: "add_shape", shape: "diamond", color: hexColor, width: 160, height: 160 }];
  }
  if (text.includes("arrow")) {
    return [{ action: "add_shape", shape: "arrow", color: hexColor, width: 180, height: 60 }];
  }
  if (text.includes("line")) {
    return [{ action: "add_shape", shape: "line", color: hexColor, width: 180, height: 2 }];
  }
  if (text.includes("text") || text.includes("write") || text.includes("note")) {
    const rawNote = transcript.replace(/add text|write|note/gi, "").trim();
    return [{ action: "add_text", text: rawNote || "Voice Note", color: hexColor, fontSize: 24 }];
  }

  // Default shape: rectangle
  return [{ action: "add_shape", shape: "rectangle", color: hexColor, width: 200, height: 130 }];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      transcript,
      userEmail,
      userId,
      selectedElements = [],
    } = body;

    if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
      return NextResponse.json(
        { success: false, error: "Empty speech transcript received." },
        { status: 400 }
      );
    }

    const cleanEmail = (userEmail || "guest@Prathomix.ai").trim().toLowerCase();
    const isAdmin = cleanEmail === "admin@prathomix.tech";

    // ── 1. Tier-Based Capability Routing via Supabase (With Safe 3.5s Timeout) ──
    let isPro = isAdmin;
    let userTier: "free" | "pro" = isAdmin ? "pro" : "free";

    if (!isAdmin && supabaseAdmin) {
      try {
        const fetchTierPromise = (async () => {
          let query = supabaseAdmin
            .from("profiles")
            .select("id, email, role, subscription_status");

          if (userId) {
            query = query.or(`id.eq.${userId},email.ilike.${cleanEmail}`);
          } else {
            query = query.ilike("email", cleanEmail);
          }

          return await query.maybeSingle();
        })();

        // Wrap in a 3500ms timeout to prevent hanging on connection drops
        const timeoutPromise = new Promise<{ data: null }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 3500)
        );

        const { data: profile } = await Promise.race([fetchTierPromise, timeoutPromise]);

        if (profile) {
          const subStatus = (profile.subscription_status || "").toLowerCase();
          const role = (profile.role || "").toLowerCase();
          if (subStatus === "pro" || subStatus === "active" || role === "admin") {
            isPro = true;
            userTier = "pro";
          }
        }
      } catch (err) {
        console.warn("[/api/voice-command] Supabase profile check timeout/error (safe fallback to Free):", err);
        // Safely continues as Free user without crashing
      }
    }

    // Rate Limiting for FREE users
    if (!isPro) {
      const now = Date.now();
      const quota = localVoiceQuota.get(cleanEmail) || {
        used: 0,
        limit: 25,
        resetAt: now + 86400000,
      };

      if (now > quota.resetAt) {
        quota.used = 0;
        quota.resetAt = now + 86400000;
      }

      if (quota.used >= quota.limit) {
        return NextResponse.json(
          {
            success: false,
            error: "Free Voice AI limit reached for today. Upgrade to PRO for unlimited voice commands.",
            code: "UPGRADE_REQUIRED",
            tier: "free",
            isPro: false,
          },
          { status: 403 }
        );
      }

      quota.used += 1;
      localVoiceQuota.set(cleanEmail, quota);
    }

    // ── 2. Context Formulation for the LLM ──────────────────────────────────
    const selectedSummary = Array.isArray(selectedElements) && selectedElements.length > 0
      ? selectedElements.map((el: any) => ({
          id: String(el.id || ""),
          type: String(el.type || "rectangle"),
          width: Math.round(Number(el.width) || 100),
          height: Math.round(Number(el.height) || 100),
          strokeColor: String(el.strokeColor || "#ffffff"),
          backgroundColor: String(el.backgroundColor || "transparent"),
          text: el.text || el.label?.text || null,
        }))
      : [];

    const promptContext = `
Spoken Command: "${transcript.trim()}"
User Tier: ${userTier.toUpperCase()}
Has Active Canvas Selection: ${selectedSummary.length > 0 ? "YES" : "NO"}
Active Selected Elements (${selectedSummary.length}): ${JSON.stringify(selectedSummary)}
`.trim();

    // ── 3. High-Priority Low-Latency LLM Intent Parsing ─────────────────────
    const primaryProvider = isPro ? "groq" : "gemini";

    let aiRawText = "";
    try {
      const aiRes = await executeWithLoadBalancer({
        prompt: promptContext,
        systemPrompt: SYSTEM_VOICE_PROMPT,
        primaryProvider,
        temperature: 0.1,
        maxTokens: 1024,
        responseMimeType: "application/json",
      });
      aiRawText = aiRes.text || "";
    } catch (aiErr: any) {
      console.warn("[/api/voice-command] AI Load Balancer failure, activating intelligent fallback:", aiErr?.message);
    }

    // ── 4. Bulletproof Intent Extraction & Action Sanitization ───────────────
    let actions = extractAndParseActions(aiRawText, transcript);

    // ── 5. Strict Tier-Based Enforcement (FREE vs PRO) ─────────────────────
    let requiresProForMultiStep = false;
    let warning: string | undefined = undefined;

    if (!isPro) {
      // FREE Users: Single-step basic commands only
      if (actions.length > 1) {
        requiresProForMultiStep = true;
        warning =
          "You used a multi-step complex voice command. Only the first step was executed. Upgrade to PRO for unlimited multi-step workflow execution!";
        actions = [actions[0]]; // Truncate to first action
      }
    }

    const latencyMs = Date.now() - startTime;

    const responsePayload: VoiceCommandResponse = {
      success: true,
      tier: userTier,
      isPro,
      actions,
      rawTranscript: transcript,
      requiresProForMultiStep,
      warning,
      latencyMs,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/voice-command]",
      "Failed to process voice command. Please try again."
    );
  }
}


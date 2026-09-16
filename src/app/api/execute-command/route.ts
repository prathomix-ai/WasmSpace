import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getProviderKeys } from "@/lib/ai-balancer";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Admin Client for Quota Management
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

// Global in-memory round-robin pointer state
let geminiPointer = 0;
let groqPointer = 0;

// Dev & Fallback in-memory quota tracking
const localQuotaStore = new Map<
  string,
  { actions_used: number; action_limit: number; tier: string; reset_at: string }
>([
  [
    "exhausted@masmspace.ai",
    {
      actions_used: 15,
      action_limit: 15,
      tier: "free",
      reset_at: new Date(Date.now() + 86400000).toISOString(),
    },
  ],
]);

function getNextKey(pool: string[], currentPointer: number): { key: string; nextPointer: number } {
  if (pool.length === 0) return { key: "", nextPointer: 0 };
  const key = pool[currentPointer % pool.length];
  const nextPointer = (currentPointer + 1) % pool.length;
  return { key, nextPointer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exact System Prompt & Strict Temperature Configuration
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  "You are an Excalidraw component generator. Do NOT converse. Output ONLY a valid JSON array of elements. No markdown formatting, no explanations.";

const STRICT_CONFIG = {
  temperature: 0.1,
  top_p: 0.9,
};

// ─────────────────────────────────────────────────────────────────────────────
// LLM Provider Callers
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(6000),
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: STRICT_CONFIG.temperature,
        topP: STRICT_CONFIG.top_p,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  return rawText;
}

async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(6000),
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: STRICT_CONFIG.temperature,
      top_p: STRICT_CONFIG.top_p,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API Error [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "[]";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler: Quota Enforcement & Load-Balanced AI Command Execution
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, commandType, userEmail = "guest@masmspace.ai", userId } = body;

    if (!prompt && !commandType) {
      return NextResponse.json(
        { error: "Missing required prompt or commandType" },
        { status: 400 }
      );
    }

    const cleanEmail = (userEmail || "").trim().toLowerCase();
    const isAdmin = cleanEmail === "admin@prathomix.tech";

    // ── 1. Resolve Authenticated User & Check Quota ──
    let authenticatedUserId: string | null = userId || null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ") && supabaseAdmin) {
      try {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user?.id) {
          authenticatedUserId = authData.user.id;
        }
      } catch {}
    }

    let currentUsage = {
      actions_used: 0,
      action_limit: 15,
      tier: "free",
      reset_at: new Date(Date.now() + 86400000).toISOString(),
    };

    if (!isAdmin) {
      if (supabaseAdmin) {
        try {
          // Find quota record strictly by user ID first, fallback to user_email
          let quota = null;
          if (authenticatedUserId) {
            const res = await supabaseAdmin
              .from("ai_usage_limits")
              .select("*")
              .eq("user_id", authenticatedUserId)
              .maybeSingle();
            quota = res.data;
          }

          if (!quota) {
            const res = await supabaseAdmin
              .from("ai_usage_limits")
              .select("*")
              .eq("user_email", cleanEmail)
              .maybeSingle();
            quota = res.data;
          }

          if (!quota) {
            const { data: newQuota, error: insertErr } = await supabaseAdmin
              .from("ai_usage_limits")
              .insert({
                user_email: cleanEmail,
                user_id: authenticatedUserId || null,
                tier: "free",
                actions_used: 0,
                action_limit: 15,
              })
              .select()
              .single();

            if (!insertErr && newQuota) {
              quota = newQuota;
            }
          }

          if (quota) {
            currentUsage = {
              actions_used: quota.actions_used,
              action_limit: quota.action_limit,
              tier: quota.tier,
              reset_at: quota.reset_at,
            };
          }
        } catch (dbErr) {
          console.warn("[/api/execute-command] Supabase check fallback:", dbErr);
        }
      }

      // Check quota threshold: If actions_used >= action_limit, return 403 UPGRADE_REQUIRED
      if (currentUsage.actions_used >= currentUsage.action_limit) {
        return NextResponse.json(
          {
            error: currentUsage.tier === "pro" ? "PRO Limit Reached" : "Free Limit Reached. Upgrade to PRO.",
            code: "UPGRADE_REQUIRED",
            tier: currentUsage.tier,
            actions_used: currentUsage.actions_used,
            action_limit: currentUsage.action_limit,
            reset_at: currentUsage.reset_at,
          },
          { status: currentUsage.tier === "pro" ? 429 : 403 }
        );
      }
    }

    // ── 2. Round-Robin Key Selection & Provider Routing ──
    const geminiKeys = getProviderKeys("gemini");
    const groqKeys = getProviderKeys("groq");

    // Strict Groq Routing for High-Speed Quick Commands (Draw Container, Decision Gateway)
    const isStrictGroqCommand =
      commandType === "rectangle" ||
      commandType === "diamond" ||
      commandType === "container" ||
      commandType === "decision" ||
      Boolean(
        prompt &&
          /\b(draw\s+container|container|decision\s+gateway|decision|gateway|box)\b/i.test(prompt)
      );

    let rawJson = "";
    let providerUsed = "";
    let attempts = 0;

    // 1. If strict Groq command, strictly query Groq for maximum token generation speed
    if (isStrictGroqCommand && groqKeys.length > 0) {
      let groqAttempts = 0;
      while (groqAttempts < groqKeys.length && !rawJson) {
        const { key, nextPointer } = getNextKey(groqKeys, groqPointer);
        groqPointer = nextPointer;
        groqAttempts++;
        try {
          rawJson = await callGroq(key, prompt || `Draw a ${commandType}`);
          providerUsed = `Groq Llama-3.3 (Key #${groqPointer || 1})`;
          break;
        } catch (err: any) {
          console.warn(`[Load Balancer] Strict Groq key failed for ${commandType}:`, err.message);
        }
      }
    }

    // 2. If not a strict Groq command (or Groq was unavailable), use standard Gemini pool
    if (!rawJson) {
      if (!isStrictGroqCommand) {
        while (geminiKeys.length > 0 && attempts < geminiKeys.length && !rawJson) {
          const { key, nextPointer } = getNextKey(geminiKeys, geminiPointer);
          geminiPointer = nextPointer;
          attempts++;
          try {
            rawJson = await callGemini(key, prompt || `Draw a ${commandType}`);
            providerUsed = `Gemini (Key #${geminiPointer || 1})`;
            break;
          } catch (err: any) {
            console.warn(`[Load Balancer] Gemini key failed, cycling to next key:`, err.message);
          }
        }
      }

      // Fallback to Groq pool if Gemini failed or Groq was needed
      if (!rawJson && groqKeys.length > 0) {
        let groqAttempts = 0;
        while (groqAttempts < groqKeys.length && !rawJson) {
          const { key, nextPointer } = getNextKey(groqKeys, groqPointer);
          groqPointer = nextPointer;
          groqAttempts++;
          try {
            rawJson = await callGroq(key, prompt || `Draw a ${commandType}`);
            providerUsed = `Groq Llama-3.3 (Key #${groqPointer || 1})`;
            break;
          } catch (err: any) {
            console.warn(`[Load Balancer] Groq fallback failed:`, err.message);
          }
        }
      }
    }

    // ── 3. Parse and Validate Excalidraw Elements Array ──
    let elements: any[] = [];
    if (rawJson) {
      try {
        // Strip any rogue markdown if present
        let cleaned = rawJson.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        }
        const parsed = JSON.parse(cleaned);
        elements = Array.isArray(parsed)
          ? parsed
          : parsed.elements && Array.isArray(parsed.elements)
          ? parsed.elements
          : [parsed];
      } catch (parseErr) {
        console.warn("Could not parse LLM output directly as elements JSON:", parseErr);
      }
    }

    // Fallback deterministic mockup if AI keys not configured or returned empty
    if (elements.length === 0) {
      elements = [
        {
          id: `ai_elem_${Date.now()}`,
          type: "rectangle",
          x: 400,
          y: 250,
          width: 220,
          height: 120,
          strokeColor: "#00f5ff",
          backgroundColor: "rgba(0, 245, 255, 0.15)",
          fillStyle: "solid",
          strokeWidth: 2,
          roundness: { type: 3 },
          text: prompt || commandType || "MasmSpace AI Component",
        },
      ];
      providerUsed = "Deterministic Native Engine";
    }

    // ── 4. Increment Actions Used in Supabase & Local Store ──
    if (!isAdmin) {
      currentUsage.actions_used += 1;

      if (supabaseAdmin) {
        try {
          if (authenticatedUserId) {
            await supabaseAdmin
              .from("ai_usage_limits")
              .update({
                actions_used: currentUsage.actions_used,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", authenticatedUserId);
          } else {
            await supabaseAdmin
              .from("ai_usage_limits")
              .update({
                actions_used: currentUsage.actions_used,
                updated_at: new Date().toISOString(),
              })
              .eq("user_email", cleanEmail);
          }
        } catch (dbErr) {
          console.warn("Supabase increment error:", dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      elements,
      provider: providerUsed,
      usage: {
        actions_used: currentUsage.actions_used,
        action_limit: currentUsage.action_limit,
        remaining: Math.max(0, currentUsage.action_limit - currentUsage.actions_used),
        tier: currentUsage.tier,
      },
    });
  } catch (error: any) {
    console.error("[/api/execute-command] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute AI command" },
      { status: 500 }
    );
  }
}

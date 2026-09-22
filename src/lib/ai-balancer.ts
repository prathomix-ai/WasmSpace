/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Prathomix — Elite AI Load Balancer & Key Rotator
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 * 1. Round-Robin Key Cycling across multiple free-tier keys (GEMINI_KEY_1..5, GROQ_KEY_1..5).
 * 2. Strict Token Throttling (800 tokens for chat/standard, 2048 for code generation).
 * 3. Automatic Failover & Retry (catches 429 Too Many Requests & 5xx Server Errors,
 *    rotates to the next key, and seamlessly falls back between Gemini and Groq).
 * 4. Zero-Leak Server-Side Security (server-only runtime check, no client exposure).
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Token Limit Constants ───────────────────────────────────────────────────
export const TOKEN_LIMITS = {
  CHAT: 800,        // Standard conversational queries & UI prompts
  CODE: 2048,       // Code generation & complex script architecture
  DEFAULT: 800,
} as const;

export type TaskMode = "chat" | "code";
export type AIProvider = "gemini" | "groq";

export interface AIBalancerOptions {
  prompt: string;
  systemPrompt?: string;
  mode?: TaskMode;
  maxTokens?: number;
  temperature?: number;
  primaryProvider?: AIProvider;
  responseMimeType?: "text/plain" | "application/json";
}

export interface AIBalancerResponse {
  text: string;
  provider: AIProvider;
  keyIdentifier: string;
  attempts: number;
  executionTimeMs: number;
}

// ── In-Memory Round-Robin State ──────────────────────────────────────────────
let geminiPointer = 0;
let groqPointer = 0;

/**
 * Reads and validates API keys from server environment variables.
 * Supports GEMINI_KEY_1..5, GROQ_KEY_1..5, or legacy comma-separated lists.
 */
export function getProviderKeys(provider: AIProvider): string[] {
  // Ensure server-only execution
  if (typeof window !== "undefined") {
    throw new Error("Security Violation: AI Balancer must never execute in the browser.");
  }

  const prefix = provider.toUpperCase(); // "GEMINI" or "GROQ"
  const collectedKeys: string[] = [];

  // 1. Read indexed keys: GEMINI_KEY_1 through GEMINI_KEY_10
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`${prefix}_KEY_${i}`];
    if (key && key.trim().length > 0) {
      collectedKeys.push(key.trim());
    }
  }

  // 2. Fallback to comma-separated keys if provided: GEMINI_KEYS="key1,key2,key3"
  const commaSeparated = process.env[`${prefix}_KEYS`];
  if (commaSeparated) {
    const parts = commaSeparated.split(",").map((k) => k.trim()).filter(Boolean);
    for (const part of parts) {
      if (!collectedKeys.includes(part)) {
        collectedKeys.push(part);
      }
    }
  }

  // 3. Fallback to standard single key: GEMINI_API_KEY / GROQ_API_KEY
  const singleKey = process.env[`${prefix}_API_KEY`];
  if (singleKey && !collectedKeys.includes(singleKey.trim())) {
    collectedKeys.push(singleKey.trim());
  }

  return collectedKeys;
}

const blacklistedKeys = new Set<string>();

/**
 * Sequentially selects the next key using round-robin logic.
 * Automatically skips any keys that have previously failed authentication.
 */
function getNextRoundRobinKey(keys: string[], provider: AIProvider): { key: string; index: number } {
  const activeKeys = keys.filter(k => !blacklistedKeys.has(k));
  const pool = activeKeys.length > 0 ? activeKeys : keys;

  if (pool.length === 0) {
    return { key: "", index: -1 };
  }

  if (provider === "gemini") {
    const index = geminiPointer % pool.length;
    geminiPointer = (geminiPointer + 1) % pool.length;
    return { key: pool[index], index: keys.indexOf(pool[index]) + 1 };
  } else {
    const index = groqPointer % pool.length;
    groqPointer = (groqPointer + 1) % pool.length;
    return { key: pool[index], index: keys.indexOf(pool[index]) + 1 };
  }
}

// ── Hardcoded Model Names (Direct in Code) ──────────────────────────────────
const GEMINI_MODEL: string = "gemini-1.5-flash";
const GROQ_MODEL: string = "llama-3.1-8b-instant";

// ── Provider Execution: Google Gemini ────────────────────────────────────────
async function callGemini(
  apiKey: string,
  prompt: string,
  systemPrompt: string | undefined,
  maxTokens: number,
  temperature: number,
  responseMimeType: "text/plain" | "application/json"
): Promise<string> {
  const preferredModel = GEMINI_MODEL;
  const fallbackModel = "gemini-3.6-flash";

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: systemPrompt
            ? `${systemPrompt}\n\nUser Request: ${prompt}`
            : prompt,
        },
      ],
    },
  ];

  async function sendGeminiReq(model: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000), // Strict 15s timeout to prevent hanging UI loading states
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: Math.max(maxTokens, 500),
          ...(responseMimeType === "application/json" ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
  }

  let res = await sendGeminiReq(preferredModel);

  // If preferred model is sunset/404, fallback to active free model
  if (!res.ok && res.status === 404 && preferredModel !== fallbackModel) {
    res = await sendGeminiReq(fallbackModel);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const error = new Error(`Gemini Error (${res.status}): ${errBody.slice(0, 200)}`);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();

  // ── Handle blocked / empty candidates gracefully ────────────────────────────
  const candidate = data?.candidates?.[0];
  const finishReason: string = candidate?.finishReason || "UNKNOWN";

  let text: string | undefined;
  for (const c of data?.candidates || []) {
    for (const part of c?.content?.parts || []) {
      if (part?.text && part.text.trim().length > 0) {
        text = part.text;
        break;
      }
    }
    if (text) break;
  }

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason || "none";
    throw new Error(
      `Gemini returned no usable text. finishReason=${finishReason}, blockReason=${blockReason}`
    );
  }

  return text;
}

// ── Provider Execution: Groq ────────────────────────────────────────────────
async function callGroq(
  apiKey: string,
  prompt: string,
  systemPrompt: string | undefined,
  maxTokens: number,
  temperature: number,
  responseMimeType: "text/plain" | "application/json"
): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const preferredModel = GROQ_MODEL;
  const fallbackModel = "qwen/qwen3.8-27b";

  async function sendGroqReq(model: string) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(15000), // Strict 15s timeout to prevent hanging UI loading states
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseMimeType === "application/json" ? { response_format: { type: "json_object" } } : {}),
      }),
    });
  }

  let res = await sendGroqReq(preferredModel);

  // If preferred model is retired/not found, fallback to active model
  if (!res.ok && res.status === 404 && preferredModel !== fallbackModel) {
    res = await sendGroqReq(fallbackModel);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    const error = new Error(`Groq Error (${res.status}): ${errBody.slice(0, 200)}`);
    (error as any).status = res.status;
    throw error;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq returned an empty choice content.");
  }
  return text;
}

// ── Master Load Balancer Function ────────────────────────────────────────────
/**
 * Executes an AI prompt through round-robin key pools with strict token throttling
 * and resilient cross-provider failover.
 *
 * @param options AIBalancerOptions
 * @returns Promise<AIBalancerResponse>
 */
export async function executeWithLoadBalancer(
  options: AIBalancerOptions
): Promise<AIBalancerResponse> {
  const startTime = Date.now();

  const {
    prompt,
    systemPrompt,
    mode = "chat",
    temperature = 0.2,
    primaryProvider = "gemini",
    responseMimeType = "text/plain",
  } = options;

  // 1. Enforce strict token limits (800 for chat, 2048 for code)
  const resolvedMaxTokens =
    options.maxTokens ||
    (mode === "code" ? TOKEN_LIMITS.CODE : TOKEN_LIMITS.CHAT);

  // 2. Determine provider order (e.g. Gemini -> Groq or Groq -> Gemini)
  const secondaryProvider: AIProvider = primaryProvider === "gemini" ? "groq" : "gemini";
  const providerSequence: AIProvider[] = [primaryProvider, secondaryProvider];

  let totalAttempts = 0;
  const failureLogs: string[] = [];

  for (const provider of providerSequence) {
    const keys = getProviderKeys(provider);

    if (keys.length === 0) {
      failureLogs.push(`No keys configured for provider [${provider}].`);
      continue;
    }

    // Try up to the total number of keys available for this provider
    let providerAttempts = 0;
    const maxAttemptsForProvider = keys.length;

    while (providerAttempts < maxAttemptsForProvider) {
      providerAttempts++;
      totalAttempts++;

      const { key, index } = getNextRoundRobinKey(keys, provider);
      const keyId = `${provider.toUpperCase()}_KEY_${index}`;

      try {
        let resultText = "";
        if (provider === "gemini") {
          resultText = await callGemini(
            key,
            prompt,
            systemPrompt,
            resolvedMaxTokens,
            temperature,
            responseMimeType
          );
        } else {
          resultText = await callGroq(
            key,
            prompt,
            systemPrompt,
            resolvedMaxTokens,
            temperature,
            responseMimeType
          );
        }

        // Success! Return immediately with telemetry
        return {
          text: resultText,
          provider,
          keyIdentifier: keyId,
          attempts: totalAttempts,
          executionTimeMs: Date.now() - startTime,
        };
      } catch (err: any) {
        const statusCode = err?.status || (err.message.includes("429") ? 429 : 500);
        const isRateLimit = statusCode === 429;
        const isServerError = statusCode >= 500 && statusCode <= 599;

        failureLogs.push(
          `[${keyId}] Failed (${statusCode}): ${err.message || "Unknown error"}`
        );

        if (statusCode === 401 || statusCode === 403) {
          blacklistedKeys.add(key);
          console.warn(`[AI Load Balancer] ${keyId} blacklisted due to permanent auth failure (${statusCode}).`);
        }

        // Immediate retry with the next key in the loop
      }
    }
  }

  // ── Graceful Degradation on Extreme High Load ───────────────────────────
  // If all providers and keys fail (e.g. concurrent global rate limits), return a friendly,
  // branded response so the user interface remains smooth and never crashes.
  console.warn(
    `[AI Load Balancer] All external provider keys exhausted (${totalAttempts} attempts). Returning graceful degradation response.\nFailures: ${failureLogs.join("; ")}`
  );

  return {
    text: "MIX AI is experiencing unprecedented demand. Please try again in 30 seconds.",
    provider: "gemini",
    keyIdentifier: "FALLBACK_DEGRADED",
    attempts: totalAttempts,
    executionTimeMs: Date.now() - startTime,
  };
}

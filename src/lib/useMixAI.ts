/**
 * SWR-Powered MIX AI Hook Suite
 * Implements high-throughput request deduplication, memory caching,
 * exponential backoff retries, and graceful 429 rate-limit resilience.
 */

import useSWRMutation from "swr/mutation";
import { useState, useCallback } from "react";

// In-Memory Global AI Cache across the application session
const aiPromptCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes cache for deterministic architecture questions

interface ChatPayload {
  prompt: string;
  systemPrompt?: string;
  mode?: "chat" | "architecture";
  /** Hint to the backend that the user holds a PRO tier (affects token limits) */
  isPro?: boolean;
}

interface GeneratePayload {
  prompt: string;
  action?: string;
  context?: any;
}

/**
 * Executes fetch with exponential backoff retry for network errors or transient 5xx/429 errors.
 */
async function fetchWithBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, options);

      // Handle 429 Too Many Requests with retry-after header
      if (res.status === 429) {
        attempt++;
        if (attempt >= maxRetries) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error || `AI rate limit reached. Please wait ${errData.retryAfter || 60} seconds.`
          );
        }
        const retryAfter = res.headers.get("Retry-After");
        const waitMs = retryAfter ? Number(retryAfter) * 1000 : delay;
        console.warn(`[MIX AI] Rate limited (429). Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        delay *= 2;
        continue;
      }

      // Handle server 5xx transient issues
      if (res.status >= 500 && res.status < 600) {
        attempt++;
        if (attempt >= maxRetries) return res;
        console.warn(`[MIX AI] Server status ${res.status}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      return res;
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      console.warn(`[MIX AI] Network exception on ${url}. Retrying in ${delay}ms...`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error("Maximum retry attempts exceeded for AI request.");
}

/**
 * SWR Mutation Fetcher for MIX AI Chat (/api/chat)
 */
async function chatMutationFetcher(
  url: string,
  { arg }: { arg: ChatPayload }
): Promise<{ text: string; cached?: boolean }> {
  const cacheKey = `chat_${arg.prompt.trim().toLowerCase()}_${arg.mode || "chat"}`;
  const now = Date.now();

  const cached = aiPromptCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { text: cached.result.text, cached: true };
  }

  const res = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: arg.prompt,
      systemPrompt: arg.systemPrompt,
      mode: arg.mode,
      isPro: arg.isPro ?? false,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}: Failed to reach AI endpoint`);
  }

  const data = await res.json();
  const textResult = data.text || "Processed request successfully.";

  aiPromptCache.set(cacheKey, { result: { text: textResult }, timestamp: now });

  return { text: textResult, cached: false };
}

/**
 * SWR Mutation Fetcher for MIX AI Architecture Generation (/api/generate)
 */
async function generateMutationFetcher(
  url: string,
  { arg }: { arg: GeneratePayload }
): Promise<any> {
  const cacheKey = `gen_${arg.prompt.trim().toLowerCase()}`;
  const now = Date.now();

  const cached = aiPromptCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  const res = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}: Failed to generate architecture`);
  }

  const data = await res.json();
  aiPromptCache.set(cacheKey, { result: data, timestamp: now });

  return { ...data, cached: false };
}

/**
 * Custom Hook: Wraps MIX AI Chat with SWR mutation, caching, and exponential backoff
 */
export function useMixAIChat() {
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    "/api/chat",
    chatMutationFetcher,
    {
      revalidate: false,
    }
  );

  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  const sendMessage = useCallback(
    async (prompt: string, systemPrompt?: string, mode?: "chat" | "architecture", isPro?: boolean) => {
      try {
        setRateLimitCountdown(null);
        return await trigger({ prompt, systemPrompt, mode, isPro: isPro ?? false });
      } catch (err: any) {
        if (err?.message?.includes("rate limit") || err?.message?.includes("429")) {
          const match = err.message.match(/(\d+)\s*seconds/);
          if (match && match[1]) {
            setRateLimitCountdown(Number(match[1]));
          }
        }
        throw err;
      }
    },
    [trigger]
  );

  return {
    sendMessage,
    data,
    error,
    isLoading: isMutating,
    rateLimitCountdown,
    reset,
  };
}

/**
 * Custom Hook: Wraps MIX AI Topology Blueprint Generator with SWR mutation and caching
 */
export function useMixAIGenerate() {
  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    "/api/generate",
    generateMutationFetcher,
    {
      revalidate: false,
    }
  );

  const generateBlueprint = useCallback(
    async (prompt: string, context?: any) => {
      return await trigger({ prompt, context });
    },
    [trigger]
  );

  return {
    generateBlueprint,
    data,
    error,
    isLoading: isMutating,
    reset,
  };
}

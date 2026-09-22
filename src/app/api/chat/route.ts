import { NextRequest, NextResponse } from "next/server";
import { executeWithLoadBalancer, TaskMode } from "@/lib/ai-balancer";
import { handleApiError } from "@/lib/api-error";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/chat
 * High-performance, load-balanced AI endpoint with round-robin key rotation,
 * strict token enforcement (800 for free chat, 2048 for PRO/code), and
 * cross-provider failover. PRO users get elevated token limits and Groq
 * as primary fallback to reduce Gemini rate-limit collisions.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      systemPrompt,
      mode = "chat",
      primaryProvider = "gemini",
      // Optional PRO hint from the client (does NOT bypass DB quota checks;
      // it only influences token limits and provider priority)
      isPro = false,
    } = body;

    // Validate incoming payload
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const taskMode: TaskMode = mode === "code" ? "code" : "chat";

    // PRO users receive extended token limits (2048) to support longer,
    // more detailed architectural answers. Free users stay at 800 tokens.
    const resolvedMaxTokens = isPro || taskMode === "code" ? 2048 : 800;

    // PRO users get Groq as primary fallback provider since Groq has generous
    // free-tier rate limits, reducing congestion on shared Gemini keys.
    const resolvedPrimaryProvider =
      primaryProvider === "groq"
        ? "groq"
        : isPro
        ? "gemini" // PRO users still prefer Gemini quality; Groq is the failover
        : "gemini";

    // Call load-balanced AI engine
    const response = await executeWithLoadBalancer({
      prompt: prompt.trim(),
      systemPrompt:
        systemPrompt ||
        (taskMode === "code"
          ? "You are an expert full-stack developer. Generate clean, efficient, well-documented code."
          : isPro
          ? "You are MIX AI, an expert Principal Full-Stack Developer and Cloud Architect. Provide crisp, structured, deeply informative technical answers in Markdown format with code snippets, architecture diagrams (ASCII/Markdown), trade-offs, and best practices."
          : "You are a helpful and concise AI assistant."),
      mode: taskMode,
      maxTokens: resolvedMaxTokens,
      primaryProvider: resolvedPrimaryProvider,
    });

    return NextResponse.json({
      success: true,
      text: response.text,
      telemetry: {
        provider: response.provider,
        keyIdentifier: response.keyIdentifier,
        attempts: response.attempts,
        executionTimeMs: response.executionTimeMs,
        tokenLimitApplied: resolvedMaxTokens,
        isPro,
      },
    });
  } catch (error: any) {
    const isExhausted =
      error?.message?.includes("keys exhausted") ||
      error?.message?.includes("All AI Provider");
    if (isExhausted) {
      return NextResponse.json(
        {
          success: true,
          text: "MIX AI is experiencing unprecedented demand. Please try again in 30 seconds.",
          telemetry: {
            provider: "degraded",
            keyIdentifier: "FALLBACK_RATE_LIMIT",
            attempts: 0,
            executionTimeMs: 0,
            tokenLimitApplied: 0,
            isPro: false,
          },
        },
        { status: 200 }
      );
    }

    return handleApiError(
      error,
      "[/api/chat]",
      "Failed to process AI request. Please try again."
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { executeWithLoadBalancer, TaskMode } from "@/lib/ai-balancer";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/chat
 * High-performance, load-balanced AI endpoint with round-robin key rotation,
 * strict token enforcement (800 for chat, 2048 for code), and cross-provider failover.
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
    } = body;

    // Validate incoming payload
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const taskMode: TaskMode = mode === "code" ? "code" : "chat";

    // Call load-balanced AI engine
    const response = await executeWithLoadBalancer({
      prompt: prompt.trim(),
      systemPrompt:
        systemPrompt ||
        (taskMode === "code"
          ? "You are an expert full-stack developer. Generate clean, efficient, well-documented code."
          : "You are a helpful and concise AI assistant."),
      mode: taskMode,
      primaryProvider: primaryProvider === "groq" ? "groq" : "gemini",
    });

    return NextResponse.json({
      success: true,
      text: response.text,
      telemetry: {
        provider: response.provider,
        keyIdentifier: response.keyIdentifier,
        attempts: response.attempts,
        executionTimeMs: response.executionTimeMs,
        tokenLimitApplied: taskMode === "code" ? 2048 : 800,
      },
    });
  } catch (error: any) {
    console.error("[/api/chat] Execution failed:", error);

    const isExhausted = error.message?.includes("keys exhausted");
    return NextResponse.json(
      {
        success: false,
        error: isExhausted
          ? "All AI provider quotas and keys are currently rate-limited. Please try again shortly."
          : error.message || "Failed to process AI request.",
        diagnostics: process.env.NODE_ENV === "development" ? error.allFailures : undefined,
      },
      { status: isExhausted ? 429 : 500 }
    );
  }
}

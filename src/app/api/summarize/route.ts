import { NextRequest, NextResponse } from "next/server";
import { executeWithLoadBalancer } from "@/lib/ai-balancer";
import { handleApiError } from "@/lib/api-error";
import { SummarizeResponse } from "@/types/ai";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ||
  process.env.AI_BACKEND_URL ||
  "http://localhost:8000";

const SYSTEM_PROMPT = `You are MasmSpace AI, an expert meeting analyst and productivity assistant.
You will receive raw whiteboard content from a collaborative session and must produce a structured, actionable JSON summary.

Return ONLY valid JSON — no markdown code fences, no extra text.
The JSON must strictly match this schema:
{
  "summary": "2-4 sentence overview of the session",
  "key_points": ["point 1", "point 2"],
  "action_items": [
    {"task": "task description", "owner": "owner name or null", "due": "date or null", "priority": "high|medium|low"}
  ],
  "decisions": ["decision 1"],
  "next_steps": ["next step 1"],
  "mood": "productive|brainstorming|planning|retrospective"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Try external Python FastAPI backend if reachable (with 3.5s timeout)
    try {
      const res = await fetch(`${AI_BACKEND_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1200),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not running or timed out — seamlessly proceed to native AI balancer fallback
    }

    // 2. Native AI Balancer Execution (Gemini / Groq rotation pool)
    const shapes = body.shapes || [];
    const shapeTexts = shapes
      .map((s: any) => s.text || s.props?.text || s.props?.label || "")
      .filter((t: string) => t.trim().length > 0);

    const canvasText = body.canvas_text || "";
    const combinedContent = [
      canvasText,
      ...shapeTexts,
      body.context ? `User Context: ${body.context}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const boardTitle = body.board_title || "Untitled Whiteboard";

    const prompt = `Board Title: ${boardTitle}\n\nCanvas Content:\n${
      combinedContent || "(Empty whiteboard session)"
    }\n\nGenerate the structured JSON summary now.`;

    const aiRes = await executeWithLoadBalancer({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      maxTokens: 1024,
      temperature: 0.3,
    });

    let parsed: any = {};
    try {
      const cleaned = aiRes.text.replace(/```(?:json)?|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: aiRes.text.slice(0, 300),
        key_points: ["Content processed from active canvas"],
        action_items: [],
        decisions: [],
        next_steps: [],
        mood: "productive",
      };
    }

    const responsePayload: SummarizeResponse = {
      summary: parsed.summary || "Summary generated successfully.",
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
      action_items: Array.isArray(parsed.action_items)
        ? parsed.action_items.map((item: any) => ({
            task: item.task || "Task",
            owner: item.owner || null,
            due: item.due || null,
            priority: item.priority === "high" || item.priority === "low" ? item.priority : "medium",
          }))
        : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
      mood: parsed.mood || "productive",
      model_used: `${aiRes.provider} (${aiRes.keyIdentifier})`,
      processing_time_ms: aiRes.executionTimeMs,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return handleApiError(
      error,
      "[POST /api/summarize]",
      "Failed to process summarization. Please try again."
    );
  }
}

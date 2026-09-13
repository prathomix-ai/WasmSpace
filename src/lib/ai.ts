import { type SummarizeRequest, type SummarizeResponse } from "@/types/ai";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ?? "http://localhost:8000";

/**
 * Calls the MasmSpace FastAPI AI backend to generate a structured
 * meeting summary from the current whiteboard canvas state.
 *
 * @param request - Canvas content + optional metadata
 * @returns Structured SummarizeResponse from the AI model
 * @throws Error with a user-friendly message on failure
 */
export async function summarizeCanvas(
  request: SummarizeRequest
): Promise<SummarizeResponse> {
  let response: Response;

  try {
    response = await fetch(`${AI_BACKEND_URL}/api/summarize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  } catch (netErr) {
    // If direct cross-origin fetch fails (CORS / network), fallback to internal Next.js proxy
    response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
  }

  if (!response.ok) {
    let errorMessage = `AI backend error (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorMessage;
    } catch {
      // response body not JSON — use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<SummarizeResponse>;
}

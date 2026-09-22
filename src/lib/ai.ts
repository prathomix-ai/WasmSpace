import { type SummarizeRequest, type SummarizeResponse } from "@/types/ai";

const AI_BACKEND_URL =
  process.env.NEXT_PUBLIC_AI_BACKEND_URL ?? "http://localhost:8000";

/**
 * Calls the Prathomix FastAPI AI backend to generate a structured
 * meeting summary from the current whiteboard canvas state.
 * Equipped with exponential backoff and retry handling.
 *
 * @param request - Canvas content + optional metadata
 * @returns Structured SummarizeResponse from the AI model
 * @throws Error with a user-friendly message on failure
 */
export async function summarizeCanvas(
  request: SummarizeRequest,
  maxRetries = 2
): Promise<SummarizeResponse> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (response.status === 429 && attempt < maxRetries) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      if (!response.ok) {
        let errorMessage = `AI backend error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail ?? errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as SummarizeResponse;
    } catch (err: any) {
      if (attempt < maxRetries) {
        attempt++;
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error("Failed to summarize canvas after retries.");
}


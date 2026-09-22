/**
 * apiInterceptor.ts
 * Global Client-Side Fetch Interceptor for MasmSpace (Powered by PRATHOMIX).
 *
 * Responsibilities:
 * 1. Intercepts outgoing client HTTP fetch calls to detect 4xx, 5xx, and network drops.
 * 2. Emits friendly, generic Toast notifications (hiding raw internal errors and stack traces).
 * 3. Securely logs sanitized telemetry for diagnostics.
 */

export interface ToastEventDetail {
  message: string;
  type: "info" | "success" | "warning" | "error";
  durationMs?: number;
}

/**
 * Maps raw HTTP status codes and network errors to friendly, customer-first copy.
 */
export function getFriendlyErrorMessage(status?: number, rawError?: string): string {
  if (!status) {
    if (rawError?.toLowerCase().includes("failed to fetch") || rawError?.toLowerCase().includes("networkerror")) {
      return "Network hiccup detected. We're holding your state locally.";
    }
    return "Our servers are taking a quick breather. Try again in a second.";
  }

  switch (status) {
    case 401:
      return "Your session requires verification. Please sign in to continue.";
    case 403:
      return "Access restricted. You don't have permission to perform this action.";
    case 404:
      return "The requested resource could not be located.";
    case 429:
      return "You're moving fast! We're pacing requests to keep things smooth.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Our servers are taking a quick breather. Try again in a second.";
    default:
      if (status >= 500) {
        return "Our servers are taking a quick breather. Try again in a second.";
      }
      return "Something unexpected occurred. Please try again.";
  }
}

/**
 * Dispatches a global toast notification event.
 */
export function emitGlobalToast(
  message: string,
  type: "info" | "success" | "warning" | "error" = "error",
  durationMs = 4500
) {
  if (typeof window === "undefined") return;

  const event = new CustomEvent<ToastEventDetail>("masmspace:toast", {
    detail: { message, type, durationMs },
  });
  window.dispatchEvent(event);
}

let isInterceptorInstalled = false;

/**
 * Initializes the global window.fetch interceptor.
 * Safe to invoke multiple times (idempotent).
 */
export function initGlobalApiInterceptor() {
  if (typeof window === "undefined" || isInterceptorInstalled) return;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // Inspect URL to avoid intercepting external analytics/CDN tracking
      const input = args[0];
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request)?.url || "";
      const isInternalApi =
        url.startsWith("/api") ||
        (typeof window !== "undefined" && url.startsWith(window.location.origin + "/api"));

      if (isInternalApi && !response.ok) {
        // Exclude intentional 404s, webhooks, or quota checks that are non-disruptive
        const isQuotaPolling = url.includes("action=quota");
        const isBackgroundHealthCheck = url.includes("health");

        if (!isQuotaPolling && !isBackgroundHealthCheck) {
          const friendlyMessage = getFriendlyErrorMessage(response.status);

          // Securely log to console without leaking user credentials or auth tokens
          console.warn(`[MasmSpace API Interceptor] HTTP ${response.status} on ${url}`);

          // Emit friendly toast notification
          emitGlobalToast(
            friendlyMessage,
            response.status === 429 ? "warning" : "error"
          );
        }
      }

      return response;
    } catch (networkError: any) {
      const input = args[0];
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request)?.url || "";
      console.warn(`[MasmSpace API Interceptor] Network failure on ${url}:`, networkError?.message);

      const friendlyMessage = getFriendlyErrorMessage(undefined, networkError?.message);
      emitGlobalToast(friendlyMessage, "warning");

      // Re-throw so caller promise handling (e.g. SWR retry logic) continues functioning
      throw networkError;
    }
  };

  isInterceptorInstalled = true;
}

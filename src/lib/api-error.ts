import { NextResponse } from "next/server";

/**
 * Custom application error class for intentional, client-safe error messages.
 * Only errors explicitly marked with `isClientSafe: true` can pass their message to clients.
 */
export class AppClientError extends Error {
  public readonly isClientSafe: boolean;
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppClientError";
    this.isClientSafe = true;
    this.statusCode = statusCode;
  }
}

/**
 * Patterns that indicate internal implementation details, raw database errors,
 * file system paths, or credential leakage that should NEVER be exposed to clients.
 */
export const SENSITIVE_PATTERNS = [
  // Database & ORM internals
  /postgres/i,
  /pg_/i,
  /supabase/i,
  /postgrest/i,
  /pgrst\d+/i,
  /sqlstate/i,
  /\b(?:42P01|23505|23503|28000|08006|22P02)\b/i,
  /syntax error at or near/i,
  /violates (foreign key|unique|not-null|check) constraint/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /table .* does not exist/i,
  /schema .* does not exist/i,
  /permission denied for (table|relation|schema)/i,
  /duplicate key value/i,
  /connection (refused|timeout|reset)/i,
  /pool has been destroyed/i,
  /fetch failed/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /EHOSTUNREACH/i,

  // File system & runtime paths
  /[a-zA-Z]:\\[\w.-]+\\/, // Windows paths: C:\Users\... or p:\...
  /\/(?:home|var|usr|etc|tmp|node_modules|src|app|dist|\.next)\//i, // Unix paths
  /\.tsx?:\d+:\d+/, // Stack trace line:file:col
  /\.jsx?:\d+:\d+/,
  /at (?:async )?[\w.<>]+ \(/, // Stack trace line: "at async ..."
  /node:[a-z_]+/i,
  /internal\/modules/i,

  // Runtime exception names
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /RangeError:/i,
  /UnhandledPromiseRejection/i,

  // Environment variables & Secrets
  /RAZORPAY_/i,
  /SUPABASE_/i,
  /SERVICE_ROLE/i,
  /ANON_KEY/i,
  /CONVERTAPI/i,
  /GEMINI_/i,
  /GROQ_/i,
  /OPENAI_/i,
  /KEY_ID/i,
  /KEY_SECRET/i,
  /bearer\s+[a-zA-Z0-9._-]+/i,
  /api[-_]?key/i,
  /secret/i,
  /private[-_]?key/i,

  // Internal IPs and Ports
  /\b(?:127\.0\.0\.1|localhost|0\.0\.0\.0|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/,
  /:\d{2,5}\b/,
];

/**
 * Checks whether an error message contains sensitive internal information.
 */
export function containsSensitiveInfo(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Sanitizes any raw error message into a user-friendly, safe string.
 * For 500 server errors or unknown exceptions, always falls back to generic text.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again.",
  isInternalServerError = true
): string {
  if (!error) return fallbackMessage;

  // If this is an explicitly designated safe client error, return its message
  if (error instanceof AppClientError && error.isClientSafe) {
    if (!containsSensitiveInfo(error.message)) {
      return error.message;
    }
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : (error as any)?.message || "";

  if (!rawMessage || typeof rawMessage !== "string") {
    return fallbackMessage;
  }

  // If the error message leaks internal paths, SQL, env vars or stack traces, sanitize it
  if (containsSensitiveInfo(rawMessage)) {
    return fallbackMessage;
  }

  // For 500 Internal Server Errors, do not reflect arbitrary unexpected exception text
  if (isInternalServerError) {
    return fallbackMessage;
  }

  // Safe client validation messages (short, non-technical, single line)
  const clean = rawMessage.trim();
  if (clean.length > 0 && clean.length < 120 && !clean.includes("\n")) {
    return clean;
  }

  return fallbackMessage;
}

/**
 * Safe client error translator for React client components (e.g. login, modal, settings).
 * Intercepts Supabase/network errors and maps them to clean user-facing guidance.
 */
export function getSafeClientErrorMessage(
  error: unknown,
  fallbackMessage = "An error occurred. Please try again."
): string {
  if (!error) return fallbackMessage;

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : (error as any)?.message || (error as any)?.error_description || "";

  if (!rawMessage || typeof rawMessage !== "string") {
    return fallbackMessage;
  }

  // If message contains sensitive database or environment info, never show it
  if (containsSensitiveInfo(rawMessage)) {
    return fallbackMessage;
  }

  const lower = rawMessage.toLowerCase();

  // Standard safe Supabase auth mappings
  if (lower.includes("invalid login credentials") || lower.includes("invalid_grant")) {
    return "Invalid email or password. Please verify your credentials.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (lower.includes("user already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a few moments before trying again.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("load failed")) {
    return "Network connection issue. Please check your internet connection.";
  }

  // Safe short validation text
  if (rawMessage.length <= 90 && !rawMessage.includes("\n") && !/[{}[\]\\]/.test(rawMessage)) {
    return rawMessage.trim();
  }

  return fallbackMessage;
}

/**
 * Centralized API Error Handler:
 * - Logs complete error details (stack, context, correlation ID) server-side for debugging.
 * - Returns a generic, sanitized JSON response to the client.
 */
export function handleApiError(
  error: unknown,
  context = "[API]",
  fallbackMessage = "An unexpected error occurred. Please try again.",
  status = 500
): NextResponse {
  const correlationId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  // Full server-side logging for diagnostics
  console.error(
    `[${timestamp}] ${context} [Correlation ID: ${correlationId}]:`,
    error
  );

  if (error instanceof Error && error.stack) {
    console.error(`Stack trace [${correlationId}]:\n${error.stack}`);
  }

  const is500 = status >= 500;
  const clientMessage = sanitizeErrorMessage(error, fallbackMessage, is500);

  return NextResponse.json(
    {
      success: false,
      error: clientMessage,
      errorId: correlationId,
    },
    { status }
  );
}

/**
 * API Key Rotation Utility for Edge API Routes
 * Load balances requests across 5 Gemini keys and 5 Groq keys.
 */

// 1. Arrays Initialization
export const GEMINI_KEYS: string[] = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
  process.env.GEMINI_API_KEY, // Fallback if single key provided
].filter(Boolean) as string[];

export const GROQ_KEYS: string[] = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
  process.env.GROQ_KEY_4,
  process.env.GROQ_KEY_5,
  process.env.GROQ_API_KEY, // Fallback if single key provided
].filter(Boolean) as string[];

export type AIProvider = "gemini" | "groq";

/**
 * Selects an API key using an Edge-safe pseudo-Round-Robin strategy.
 *
 * @param provider - The target provider ('gemini' | 'groq')
 * @returns The selected API key string
 * @throws Error if no active keys are found for the selected provider
 */
export function getNextApiKey(provider: AIProvider): string {
  const keysArray = provider === "gemini" ? GEMINI_KEYS : GROQ_KEYS;

  if (!keysArray || keysArray.length === 0) {
    throw new Error(
      `[apiRotator] No API keys configured for provider: "${provider}". Please ensure GEMINI_KEY_1..5 or GROQ_KEY_1..5 environment variables are set.`
    );
  }

  // Edge-safe pseudo-Round-Robin selection based on microsecond-scale timestamps
  const index = Date.now() % keysArray.length;
  return keysArray[index];
}

// Convenience aliases for backward compatibility across endpoints
export const getRotatedApiKey = (provider: AIProvider = "gemini"): string => getNextApiKey(provider);

export function getRotatedKeyDetails(provider: AIProvider = "gemini") {
  const keysArray = provider === "gemini" ? GEMINI_KEYS : GROQ_KEYS;
  if (!keysArray || keysArray.length === 0) {
    throw new Error(`[apiRotator] No API keys configured for provider: "${provider}"`);
  }
  const index = Date.now() % keysArray.length;
  return {
    key: keysArray[index],
    keyIndex: index + 1,
    totalPoolSize: keysArray.length,
  };
}

export default getNextApiKey;

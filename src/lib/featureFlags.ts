import useSWR from "swr";
import { FeatureFlag } from "@/types/admin";

export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  maintenance_mode: {
    id: "maintenance_mode",
    name: "Global Maintenance Mode",
    description: "Emergency kill-switch: redirects non-admin users to /maintenance and locks public canvas mutations.",
    category: "system",
    enabled: false,
  },
  ai_tools: {
    id: "ai_tools",
    name: "MIX AI CoPilot & Architecture Generator",
    description: "Master kill-switch for MIX AI drawer, blueprint generation, and conversational technical advisor.",
    category: "ai",
    enabled: true,
  },
  live_collaboration: {
    id: "live_collaboration",
    name: "Realtime Multiplayer Collaboration",
    description: "Controls Supabase Realtime multi-cursor sync, live presence, and live room sessions.",
    category: "collaboration",
    enabled: true,
  },
  code_runner: {
    id: "code_runner",
    name: "WebAssembly Python & Universal Code Runner",
    description: "Controls in-browser Pyodide execution and code execution widget on canvas.",
    category: "tools",
    enabled: true,
  },
  pricing_checkout: {
    id: "pricing_checkout",
    name: "Pro Membership & Razorpay Checkout",
    description: "Controls pricing page upgrades, coupon validation, and payment gateways.",
    category: "billing",
    enabled: true,
  },
  document_importer: {
    id: "document_importer",
    name: "Document Dropzone & OCR Converter",
    description: "Controls PDF and image document parsing onto canvas nodes.",
    category: "tools",
    enabled: true,
  },
  export_features: {
    id: "export_features",
    name: "Canvas Vector & PDF Export",
    description: "Controls high-resolution PDF, PNG, and JSON canvas export tools.",
    category: "tools",
    enabled: true,
  },
};

const fetcher = async (url: string): Promise<Record<string, FeatureFlag>> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch feature flags");
  const json = await res.json();
  return json.flags || DEFAULT_FEATURE_FLAGS;
};

/**
 * Client-side SWR Hook to access live feature flags with real-time caching & automatic revalidation.
 */
export function useFeatureFlags() {
  const { data, error, isLoading, mutate } = useSWR<Record<string, FeatureFlag>>(
    "/api/feature-flags",
    fetcher,
    {
      fallbackData: DEFAULT_FEATURE_FLAGS,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    flags: data || DEFAULT_FEATURE_FLAGS,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}

/**
 * Client-side hook to check if a specific feature flag is currently enabled.
 */
export function useFeatureFlag(flagId: string): boolean {
  const { flags } = useFeatureFlags();
  return flags[flagId]?.enabled ?? DEFAULT_FEATURE_FLAGS[flagId]?.enabled ?? true;
}

/**
 * Server-side helper to check if a feature flag is enabled given an active flag map.
 */
export function isFeatureActive(
  flags: Record<string, FeatureFlag> | undefined,
  flagId: string
): boolean {
  if (!flags) return DEFAULT_FEATURE_FLAGS[flagId]?.enabled ?? true;
  return flags[flagId]?.enabled ?? DEFAULT_FEATURE_FLAGS[flagId]?.enabled ?? true;
}

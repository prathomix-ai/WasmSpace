import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getRotatedApiKey, getRotatedKeyDetails } from "@/utils/apiRotator";
import { handleApiError, sanitizeErrorMessage } from "@/lib/api-error";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dynamic Execution & Cache Neutralization (Prevents Multi-Tenant State Bleeding)
// ─────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const runtime = "edge";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Master Scaled AI Generation & Chatbot Endpoint
 * Handles concurrent users with:
 * - Zero multi-tenant cache bleeding (force-dynamic & force-no-store)
 * - Strict Supabase auth verification
 * - Tiered quota enforcement (300 for PRO/24h, 15 for Free lifetime)
 * - Vercel AI SDK readable data stream output
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse Request Payload ─────────────────────────────────────────────
    const body = await req.json();
    const {
      prompt,
      messages,
      systemPrompt,
      isChatBotTask = false,
    } = body;

    // Extract prompt string
    const userPrompt =
      prompt ||
      (Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1]?.content
        : "");

    if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt or message content is required." },
        { status: 400 }
      );
    }

    // ── 2. Initialize Supabase Client ─────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── 3. Strictly Fetch Authenticated User FIRST ─────────────────────────────
    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    // Fallback: parse access token from cookies if Bearer header is missing
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const cookieParts = cookieHeader.split("; ").filter(Boolean);
      for (const part of cookieParts) {
        const [k, ...rest] = part.split("=");
        const v = decodeURIComponent(rest.join("="));
        if (k.includes("-auth-token") || k === "sb-access-token") {
          try {
            const parsed = JSON.parse(v);
            token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : v);
            if (token) break;
          } catch {
            token = v;
            break;
          }
        }
      }
    }

    // Strictly fetch the authenticated user FIRST
    const {
      data: { user },
    } = await supabase.auth.getUser(token || undefined);

    // If no user, return 401 Unauthorized
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Missing user authentication credentials." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── 4. Fetch User-Specific Quota & PRO Status ─────────────────────────────
    // Query STRICTLY filters by current user's ID (.eq('user_id', user.id) with fallback to .eq('id', user.id))
    const { data: initialProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, is_pro, role, tier, subscription_status, ai_usage_count, updated_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    let profile = initialProfile;

    if (profileErr || !profile) {
      const idFallback = await supabase
        .from("profiles")
        .select("id, is_pro, role, tier, subscription_status, ai_usage_count, updated_at, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (idFallback.data) {
        profile = idFallback.data;
      }
    }

    // Auto-create default profile with 0 usage if row does not exist yet (fresh signup)
    if (!profile) {
      const userEmail = user.email || req.headers.get("x-user-email") || "user@Prathomix.app";
      const { data: newProfile } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: userEmail,
            ai_usage_count: 0,
            tier: "free",
            subscription_status: "free",
            is_pro: false,
          },
          { onConflict: "id" }
        )
        .select()
        .maybeSingle();

      profile = newProfile || {
        id: userId,
        is_pro: false,
        role: "user",
        tier: "free",
        subscription_status: "free",
        ai_usage_count: 0,
      };
    }

    const isPro = Boolean(
      profile?.is_pro === true ||
      profile?.role === "pro" ||
      profile?.role === "admin" ||
      profile?.tier === "pro" ||
      profile?.tier === "enterprise" ||
      profile?.subscription_status === "pro" ||
      profile?.subscription_status === "active"
    );

    let currentUsage = typeof profile?.ai_usage_count === "number" ? profile.ai_usage_count : 0;
    const quotaLimit = isPro ? 300 : 15;

    // ── 5. Accurate Tiered AI Quota Logic ────────────────────────────────────
    // Free User: Maximum 15 total lifetime uses
    // Pro User: 300 uses per 24 hours
    if (isPro) {
      // 24-Hour Reset window verification for PRO users
      const lastResetStr = profile?.updated_at || profile?.created_at;
      const lastResetTime = lastResetStr ? new Date(lastResetStr).getTime() : 0;
      const now = Date.now();
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

      if (lastResetTime > 0 && now - lastResetTime > TWENTY_FOUR_HOURS_MS) {
        // 24 hours have elapsed: reset daily usage to 0
        currentUsage = 0;
        await supabase
          .from("profiles")
          .update({
            ai_usage_count: 0,
            updated_at: new Date(now).toISOString(),
          })
          .eq("id", userId);
      }

      if (currentUsage >= 300) {
        return NextResponse.json(
          {
            error: "PRO daily quota reached (300/300 uses). Resets every 24 hours.",
            code: "DAILY_QUOTA_EXCEEDED",
            tier: "pro",
            actions_used: currentUsage,
            action_limit: 300,
            reset_in_hours: Math.max(0, Math.ceil((TWENTY_FOUR_HOURS_MS - (now - lastResetTime)) / (1000 * 60 * 60))),
          },
          { status: 429 }
        );
      }
    } else {
      // Free users: strict lifetime limit of 15 total AI generation uses
      if (currentUsage >= 15) {
        return NextResponse.json(
          {
            error: "Free tier quota exhausted (15/15 total uses). Upgrade to PRO to unlock 300 daily generations.",
            code: "UPGRADE_REQUIRED",
            tier: "free",
            actions_used: currentUsage,
            action_limit: 15,
          },
          { status: 403 }
        );
      }
    }

    // ── 6. Atomic Usage Increment BEFORE Generation (Prevents Race Conditions) ─
    // Call Supabase RPC 'increment_ai_usage'
    let rpcError = null;
    const rpc1 = await supabase.rpc("increment_ai_usage", { p_user_id: userId });
    if (rpc1.error) {
      // Fallback in case parameter name is 'user_id'
      const rpc2 = await supabase.rpc("increment_ai_usage", { user_id: userId });
      if (rpc2.error) {
        rpcError = rpc2.error;
        // Direct SQL update fallback if RPC is not yet executed in database
        await supabase
          .from("profiles")
          .update({ ai_usage_count: currentUsage + 1 })
          .eq("id", userId);
      }
    }

    if (rpcError) {
      console.warn("[/api/generate] RPC increment notice:", rpcError);
    }

    // ── 6. Select Rotated API Key (Edge Pseudo-Round-Robin) ───────────────────
    const keyDetails = getRotatedKeyDetails();
    const apiKey = keyDetails.key || getRotatedApiKey();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No AI API key available in rotation pool." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 7. Configure Vercel AI SDK Google Model ──────────────────────────────
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    // Dynamic prompt engineering based on task type
    const defaultSystemPrompt = isChatBotTask
      ? "You are the MasmSpace Canvas AI Assistant, powered by PRATHOMIX. Provide concise, clear, and high-impact answers regarding system architecture, software engineering, algorithms, and whiteboard workflows."
      : "You are an elite Cloud & Software Systems Architect for MasmSpace (Powered by PRATHOMIX). Generate valid native canvas diagram element geometry in pure JSON format. Adhere strictly to the coordinate plane, connectors, and shapes required.";

    // ── 8. Execute Streaming LLM Generation ──────────────────────────────────
    let result;
    try {
      result = streamText({
        model: google(modelName),
        system: systemPrompt || defaultSystemPrompt,
        prompt: userPrompt.trim(),
        temperature: isChatBotTask ? 0.7 : 0.2,
        headers: {
          "x-ratelimit-limit": String(quotaLimit),
          "x-ratelimit-remaining": String(Math.max(0, quotaLimit - (currentUsage + 1))),
          "x-key-rotated-index": String(keyDetails.keyIndex),
        },
      });

      // Return readable stream directly to prevent 504 gateway timeouts
      if (typeof (result as any).toDataStreamResponse === "function") {
        return (result as any).toDataStreamResponse();
      }
      return result.toTextStreamResponse();
    } catch (streamErr: any) {
      // Gemini safety filter / empty-output error — surface it cleanly
      const msg: string = streamErr?.message || "";
      if (
        msg.includes("model output must contain") ||
        msg.includes("empty response") ||
        msg.includes("finishReason") ||
        msg.includes("SAFETY") ||
        msg.includes("RECITATION")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "The AI model could not generate a response for this prompt (content policy or empty output). Please rephrase and try again.",
            detail: msg,
          }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }
      throw streamErr; // Re-throw other errors to be caught by the outer handler
    }
  } catch (error: any) {
    return handleApiError(
      error,
      "[/api/generate]",
      "Internal server error occurred during AI generation."
    );
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/generate
 * Returns current authenticated user's tiered AI quota status:
 * - Free: 15 lifetime uses
 * - Pro: 300 uses per 24 hours
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let token: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "").trim();
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const cookieParts = cookieHeader.split("; ").filter(Boolean);
      for (const part of cookieParts) {
        const [k, ...rest] = part.split("=");
        const v = decodeURIComponent(rest.join("="));
        if (k.includes("-auth-token") || k === "sb-access-token") {
          try {
            const parsed = JSON.parse(v);
            token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : v);
            if (token) break;
          } catch {
            token = v;
            break;
          }
        }
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token || undefined);

    if (!user || !user.id) {
      return NextResponse.json({
        authenticated: false,
        tier: "free",
        isPro: false,
        used: 0,
        limit: 15,
        remaining: 15,
        formatted: "0/15 Free Uses",
      });
    }

    let { data: profile } = await supabase
      .from("profiles")
      .select("id, is_pro, role, tier, subscription_status, ai_usage_count, updated_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      const idFallback = await supabase
        .from("profiles")
        .select("id, is_pro, role, tier, subscription_status, ai_usage_count, updated_at, created_at")
        .eq("id", user.id)
        .maybeSingle();
      if (idFallback.data) profile = idFallback.data;
    }

    const isPro = Boolean(
      profile?.is_pro === true ||
      profile?.role === "pro" ||
      profile?.role === "admin" ||
      profile?.tier === "pro" ||
      profile?.tier === "enterprise" ||
      profile?.subscription_status === "pro" ||
      profile?.subscription_status === "active"
    );

    let used = typeof profile?.ai_usage_count === "number" ? profile.ai_usage_count : 0;
    const limit = isPro ? 300 : 15;

    // Verify 24h reset cycle & calculate countdown
    const now = Date.now();
    const lastResetStr = profile?.updated_at || profile?.created_at;
    const lastResetTime = lastResetStr ? new Date(lastResetStr).getTime() : 0;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    if (isPro) {
      if (lastResetTime > 0 && now - lastResetTime > TWENTY_FOUR_HOURS_MS) {
        used = 0;
      }
    }

    // Calculate time until next reset (24h from last activity or next midnight)
    let msUntilReset = 0;
    if (lastResetTime > 0) {
      const elapsed = (now - lastResetTime) % TWENTY_FOUR_HOURS_MS;
      msUntilReset = TWENTY_FOUR_HOURS_MS - elapsed;
    } else {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      msUntilReset = Math.max(0, midnight.getTime() - now);
    }

    const nextResetTime = new Date(now + msUntilReset).toISOString();
    const hoursLeft = Math.floor(msUntilReset / (1000 * 60 * 60));
    const minsLeft = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const resetCountdown = `Quota resets in ${hoursLeft}h ${minsLeft}m`;

    const remaining = Math.max(0, limit - used);
    const formatted = isPro ? `${used}/300 Daily Pro Uses` : `${used}/15 Free Uses`;

    return NextResponse.json({
      authenticated: true,
      tier: isPro ? "pro" : "free",
      isPro,
      used,
      limit,
      remaining,
      formatted,
      nextResetTime,
      msUntilReset,
      resetCountdown,
    });
  } catch (error: any) {
    console.error("[/api/generate GET] Error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        tier: "free",
        isPro: false,
        used: 0,
        limit: 15,
        remaining: 15,
        formatted: "0/15 Free Uses",
        error: sanitizeErrorMessage(error, "Failed to retrieve quota status."),
      },
      { status: 200 }
    );
  }
}

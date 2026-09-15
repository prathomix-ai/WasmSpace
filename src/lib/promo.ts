import { createClient } from "@/lib/supabase/client";

export interface RedeemPromoResponse {
  success: boolean;
  message?: string;
  error?: string;
  tier?: string;
  is_pro?: boolean;
  pro_expiry_date?: string;
}

export interface SubscriptionStatusResponse {
  authenticated: boolean;
  active: boolean;
  tier?: string;
  is_pro?: boolean;
  expired?: boolean;
  pro_expiry_date?: string | null;
  message?: string;
}

/**
 * Redeems a promotional access code for the currently authenticated user.
 * Communicates with /api/redeem-promo and updates localStorage caches & broadcast events.
 */
export async function redeemPromoCode(code: string): Promise<RedeemPromoResponse> {
  const cleanCode = code.trim();
  if (!cleanCode) {
    return { success: false, error: "Please enter a promo code." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to an account to redeem this promo code.",
    };
  }

  try {
    const res = await fetch("/api/redeem-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: cleanCode,
        user_id: user.id,
        user_email: user.email,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Failed to activate promo code.",
      };
    }

    // Update local storage session caches for instant UI reactivity
    try {
      const stored =
        localStorage.getItem("masmspace_current_user") ||
        localStorage.getItem("wasmspace_current_user");
      let parsed = stored ? JSON.parse(stored) : {};
      parsed = {
        ...parsed,
        id: user.id,
        email: user.email,
        role: parsed.role === "admin" ? "admin" : "pro",
        tier: "pro",
        is_pro: true,
        subscription_status: "pro",
        pro_expiry_date: data.pro_expiry_date,
      };
      localStorage.setItem("masmspace_current_user", JSON.stringify(parsed));
      localStorage.setItem("wasmspace_current_user", JSON.stringify(parsed));

      // Broadcast subscription state change to all active components
      window.dispatchEvent(
        new CustomEvent("masmspace_subscription_change", {
          detail: { tier: "pro", is_pro: true, pro_expiry_date: data.pro_expiry_date },
        })
      );
    } catch {}

    return {
      success: true,
      message: data.message || "PRO activated for 2 months!",
      tier: "pro",
      is_pro: true,
      pro_expiry_date: data.pro_expiry_date,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error while connecting to promo activation server.",
    };
  }
}

/**
 * Checks if the user's PRO subscription has reached its expiry date.
 * If expired, automatically triggers deactivation and updates client caches.
 */
export async function checkAndDeactivateExpiredPro(): Promise<SubscriptionStatusResponse> {
  try {
    const res = await fetch("/api/check-subscription", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data: SubscriptionStatusResponse = await res.json().catch(() => ({
      authenticated: false,
      active: false,
    }));

    if (data.expired) {
      // Clear PRO privileges from local caches
      try {
        const stored =
          localStorage.getItem("masmspace_current_user") ||
          localStorage.getItem("wasmspace_current_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.role = parsed.role === "admin" ? "admin" : "user";
          parsed.tier = "free";
          parsed.is_pro = false;
          parsed.subscription_status = "free";
          parsed.pro_expiry_date = null;
          localStorage.setItem("masmspace_current_user", JSON.stringify(parsed));
          localStorage.setItem("wasmspace_current_user", JSON.stringify(parsed));
        }

        window.dispatchEvent(
          new CustomEvent("masmspace_subscription_change", {
            detail: { tier: "free", is_pro: false, pro_expiry_date: null },
          })
        );
      } catch {}
    }

    return data;
  } catch {
    return { authenticated: false, active: false };
  }
}

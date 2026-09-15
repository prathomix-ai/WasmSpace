"use client";

import { useEffect } from "react";
import { checkAndDeactivateExpiredPro } from "@/lib/promo";

/**
 * Global Session Subscription Guard:
 * Periodically and upon window focus verifies if the user's PRO access has expired.
 * Automatically deactivates expired subscriptions and refreshes app state.
 */
export function SubscriptionGuard() {
  useEffect(() => {
    // Run immediate check on mount
    checkAndDeactivateExpiredPro();

    // Re-verify on window focus (e.g. user returns to tab)
    const handleFocus = () => {
      checkAndDeactivateExpiredPro();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return null;
}

export default SubscriptionGuard;

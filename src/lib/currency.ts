"use client";

import { useState, useEffect, useCallback } from "react";

export type CurrencyCode = "USD" | "INR";
export type BillingPlan = "monthly" | "yearly";

export interface PlanPricing {
  currency: CurrencyCode;
  symbol: string;
  monthlyAmount: number; // e.g. 5 or 420
  monthlySubunits: number; // e.g. 500 or 42000
  yearlyAmount: number; // e.g. 49 or 4100
  yearlySubunits: number; // e.g. 4900 or 410000
  monthlyPerYear: number; // e.g. 4.08 or 341.67
}

export const PRICING_CONFIG: Record<CurrencyCode, PlanPricing> = {
  USD: {
    currency: "USD",
    symbol: "$",
    monthlyAmount: 5,
    monthlySubunits: 500, // 500 cents ($5.00)
    yearlyAmount: 49,
    yearlySubunits: 4900, // 4900 cents ($49.00)
    monthlyPerYear: 4.08,
  },
  INR: {
    currency: "INR",
    symbol: "₹",
    monthlyAmount: 420,
    monthlySubunits: 42000, // 42000 paise (₹420.00)
    yearlyAmount: 4100,
    yearlySubunits: 410000, // 410000 paise (₹4,100.00)
    monthlyPerYear: 341.67,
  },
};

const STORAGE_KEY = "masmspace_preferred_currency";

/**
 * Checks client-side indicators (timezone and language) to detect if the user is in India.
 */
export function detectClientRegion(): { isIndia: boolean; reason: string } {
  if (typeof window === "undefined") {
    return { isIndia: false, reason: "ssr" };
  }

  try {
    // 1. Check Timezone (very reliable for India)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (
      timeZone === "Asia/Kolkata" ||
      timeZone === "Asia/Calcutta" ||
      timeZone === "IST" ||
      /kolkata|calcutta/i.test(timeZone)
    ) {
      return { isIndia: true, reason: `timezone:${timeZone}` };
    }

    // 2. Check Browser Locales
    const languages = navigator.languages || [navigator.language || ""];
    for (const lang of languages) {
      if (
        lang.toUpperCase().endsWith("-IN") ||
        /^(hi|ta|te|bn|mr|gu|kn|ml|pa|or|as)(-[A-Za-z]+)?$/i.test(lang)
      ) {
        return { isIndia: true, reason: `locale:${lang}` };
      }
    }
  } catch (err) {
    console.warn("Error detecting client region:", err);
  }

  return { isIndia: false, reason: "default" };
}

/**
 * Resolves initial currency from localStorage, or auto-detects from client location.
 */
export function getInitialCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "INR" || saved === "USD") {
      return saved;
    }

    const { isIndia } = detectClientRegion();
    return isIndia ? "INR" : "USD";
  } catch {
    return "USD";
  }
}

/**
 * Returns formatted plan amount and subunits for a plan and currency.
 */
export function getPlanPrice(plan: BillingPlan, currency: CurrencyCode) {
  const config = PRICING_CONFIG[currency] || PRICING_CONFIG.USD;
  const isYearly = plan === "yearly";

  const amount = isYearly ? config.yearlyAmount : config.monthlyAmount;
  const subunits = isYearly ? config.yearlySubunits : config.monthlySubunits;
  const formatted = `${config.symbol}${amount.toLocaleString()}`;

  return {
    plan,
    currency,
    symbol: config.symbol,
    amount,
    subunits,
    formatted,
    label: isYearly
      ? `${formatted}/year`
      : `${formatted}/month`,
    monthlyEquivalent: isYearly
      ? `${config.symbol}${config.monthlyPerYear.toFixed(2)}/mo`
      : null,
  };
}

/**
 * React hook to access and toggle user currency state with automatic India detection.
 */
export function useCurrency() {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initDetection() {
      try {
        // First check explicit user override in localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "INR" || saved === "USD") {
          if (isMounted) {
            setCurrencyState(saved);
            setIsDetecting(false);
          }
          return;
        }

        // Check server-side geo header if available
        try {
          const res = await fetch("/api/detect-currency", {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(2000),
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data?.country) {
              setDetectedCountry(data.country);
              if (data.country === "IN" || data.currency === "INR") {
                setCurrencyState("INR");
                setIsDetecting(false);
                return;
              }
            }
          }
        } catch {
          // Geo header endpoint not reachable or timed out, fall back to client detection
        }

        // Fallback: Client-side timezone and locale heuristics
        const clientCheck = detectClientRegion();
        if (isMounted) {
          if (clientCheck.isIndia) {
            setCurrencyState("INR");
            setDetectedCountry("IN");
          } else {
            setCurrencyState("USD");
            setDetectedCountry("US");
          }
          setIsDetecting(false);
        }
      } catch (err) {
        if (isMounted) {
          setCurrencyState("USD");
          setIsDetecting(false);
        }
      }
    }

    initDetection();

    return () => {
      isMounted = false;
    };
  }, []);

  const setCurrency = useCallback((newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch { }
  }, []);

  const getPlanDetails = useCallback(
    (plan: BillingPlan) => getPlanPrice(plan, currency),
    [currency]
  );

  return {
    currency,
    setCurrency,
    isDetecting,
    detectedCountry,
    pricing: PRICING_CONFIG[currency],
    getPlanDetails,
  };
}

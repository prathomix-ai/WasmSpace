import { CurrencyCode, BillingPlan, getPlanPrice } from "@/lib/currency";

export interface CouponRule {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // e.g., 20 for 20% or fixed amount
  description: string;
  applicablePlans?: BillingPlan[]; // If undefined, applies to all
  maxRedemptions?: number;
  expiresAt?: string; // ISO date string
  isActive: boolean;
}

/**
 * Enterprise In-Memory / Configured Coupons
 * Can also be supplemented by Supabase database query if needed.
 */
export const ACTIVE_COUPONS: Record<string, CouponRule> = {
  MASM20: {
    code: "MASM20",
    discountType: "percentage",
    discountValue: 20,
    description: "20% off all MasmSpace Pro plans",
    isActive: true,
  },
  PRATHOMIX50: {
    code: "PRATHOMIX50",
    discountType: "percentage",
    discountValue: 50,
    description: "50% Founder Special Discount",
    isActive: true,
  },
  STARTUP30: {
    code: "STARTUP30",
    discountType: "percentage",
    discountValue: 30,
    description: "30% off for Startups and Builders",
    isActive: true,
  },
  YEARLY40: {
    code: "YEARLY40",
    discountType: "percentage",
    discountValue: 40,
    description: "40% off MasmSpace Pro Annual Membership",
    applicablePlans: ["yearly"],
    isActive: true,
  },
};

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  error?: string;
  discountType?: "percentage" | "fixed";
  discountPercent?: number;
  originalAmount?: number;
  originalSubunits?: number;
  discountedAmount?: number;
  discountedSubunits?: number;
  savingsAmount?: number;
  currency?: CurrencyCode;
  symbol?: string;
  formattedOriginal?: string;
  formattedDiscounted?: string;
  formattedSavings?: string;
  description?: string;
}

/**
 * Validates a coupon code server-side and calculates exact pricing.
 * Ensures zero client-side manipulation of prices.
 */
export function validateAndApplyCoupon(
  code: string,
  plan: BillingPlan,
  currency: CurrencyCode
): CouponValidationResult {
  const cleanCode = (code || "").trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, error: "Please provide a coupon code." };
  }

  const coupon = ACTIVE_COUPONS[cleanCode];

  if (!coupon || !coupon.isActive) {
    return { valid: false, error: "Invalid or expired coupon code." };
  }

  // Check plan restriction
  if (coupon.applicablePlans && !coupon.applicablePlans.includes(plan)) {
    return {
      valid: false,
      error: `Coupon '${cleanCode}' is only applicable for ${coupon.applicablePlans.join(", ")} plans.`,
    };
  }

  // Check expiration date
  if (coupon.expiresAt) {
    const expiry = new Date(coupon.expiresAt);
    if (new Date() > expiry) {
      return { valid: false, error: "This coupon code has expired." };
    }
  }

  // Calculate base price
  const basePlan = getPlanPrice(plan, currency);
  const baseAmount = basePlan.amount;
  const symbol = basePlan.symbol;

  let discountedAmount = baseAmount;
  let discountPercent = 0;

  if (coupon.discountType === "percentage") {
    discountPercent = Math.min(Math.max(coupon.discountValue, 0), 100);
    const rawDiscount = (baseAmount * discountPercent) / 100;
    discountedAmount = Math.max(1, Math.round(baseAmount - rawDiscount)); // Minimum $1 or ₹1 to avoid zero-amount gateway issues
  } else {
    discountedAmount = Math.max(1, baseAmount - coupon.discountValue);
    discountPercent = Math.round(((baseAmount - discountedAmount) / baseAmount) * 100);
  }

  const savingsAmount = Math.max(0, baseAmount - discountedAmount);
  // Calculate subunits (* 100 for cents/paise)
  const discountedSubunits = discountedAmount * 100;
  const originalSubunits = baseAmount * 100;

  return {
    valid: true,
    code: cleanCode,
    discountType: coupon.discountType,
    discountPercent,
    originalAmount: baseAmount,
    originalSubunits,
    discountedAmount,
    discountedSubunits,
    savingsAmount,
    currency,
    symbol,
    formattedOriginal: `${symbol}${baseAmount.toLocaleString()}`,
    formattedDiscounted: `${symbol}${discountedAmount.toLocaleString()}`,
    formattedSavings: `${symbol}${savingsAmount.toLocaleString()}`,
    description: coupon.description,
  };
}

export type UserRole = "user" | "admin" | "superadmin";

export type SubscriptionStatus = "free" | "pro" | "enterprise";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string;
}

export interface SiteSettings {
  id: string;
  hero_headline: string;
  hero_subheadline: string;
  cta_text: string;
  pro_price_monthly: number;
  pro_price_yearly: number;
  announcement_banner?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  category: "system" | "ai" | "collaboration" | "tools" | "billing";
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeProMembers: number;
  freeTierUsers: number;
  dailyActiveUsers: number;
  mrr: number;
  growthRatePercentage: number;
  proConversionRate: number;
  recentUsers: Array<{
    id: string;
    email: string;
    role: string;
    tier: string;
    created_at: string;
  }>;
}

export interface AdminStats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  mrr: number;
}


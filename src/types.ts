export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export type BillingFrequency = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type SubscriptionCategory = 
  | 'Entertainment'
  | 'Software'
  | 'Productivity'
  | 'Cloud'
  | 'Health & Gym'
  | 'Utilities'
  | 'Music & Audio'
  | 'Gaming'
  | 'Finance'
  | 'Education'
  | 'Other';

export type ReminderTiming = 'on_day' | '1_day_before' | '3_days_before' | '1_week_before';

export type ThemeMode = 'dark' | 'light';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface SplitMember {
  id: string;
  name: string;
  amount: number;
  hasPaid: boolean;
  paidDate?: string;
  contact?: string; // Phone, email, or handle
  isCurrentUser?: boolean;
}

export interface SplitPlanConfig {
  isShared: boolean;
  totalMembers: number; // Total people splitting the plan including the user
  splitType: 'equal' | 'custom';
  userShare: number; // The amount paid by the user
  members: SplitMember[]; // Other participants sharing the plan
}

export interface BillingHistoryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: CurrencyCode;
  status: 'paid' | 'pending' | 'refunded';
  invoiceNumber?: string;
  note?: string;
}

export interface PriceChangeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  previousCost: number;
  newCost: number;
  currency: CurrencyCode;
  reason?: string;
}

export interface Subscription {
  id: string;
  name: string;
  description?: string;
  cost: number;
  currency: CurrencyCode;
  frequency: BillingFrequency;
  firstBillingDate: string; // YYYY-MM-DD
  nextBillingDate: string; // YYYY-MM-DD
  category: SubscriptionCategory;
  color: string; // Hex color for accents
  iconName?: string; // Lucide icon key
  domain?: string; // e.g. netflix.com
  logoUrl?: string;
  websiteUrl?: string;
  cancelUrl?: string;
  paymentMethod?: string;
  enableNotifications: boolean;
  reminderTiming: ReminderTiming;
  contractTerms?: string;
  status: SubscriptionStatus;
  billingHistory: BillingHistoryRecord[];
  priceHistory?: PriceChangeRecord[];
  splitPlan?: SplitPlanConfig;
  createdAt: string;
  notes?: string;
}

export interface ServicePreset {
  name: string;
  domain: string;
  category: SubscriptionCategory;
  color: string;
  defaultCost: number;
  defaultFrequency: BillingFrequency;
  cancelUrl?: string;
  websiteUrl: string;
  description?: string;
  iconName: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  subscriptionId: string;
  date: string;
  read: boolean;
  type: 'upcoming' | 'paid' | 'price_change' | 'trial_end';
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailDigest: boolean;
  advanceDays: number;
  reminderTime: string; // HH:mm
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  upcomingRenewalsAlert: boolean;
  monthlySummaryAlert: boolean;
}

export interface BackupPackage {
  version: string;
  app: 'SubTrack';
  exportedAt: string; // ISO 8601
  deviceInfo?: string;
  subscriptionsCount: number;
  totalMonthlySpendUSD: number;
  subscriptions: Subscription[];
  notificationSettings?: NotificationSettings;
}

export interface LocalSnapshot {
  id: string;
  timestamp: string;
  subscriptionsCount: number;
  subscriptions: Subscription[];
  reason: string;
}


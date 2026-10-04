// =====================================================================
// THE CLEVER TRADER — OFFICIAL SAAS SUBSCRIPTION & LICENSE ENGINE
// Manages multi-tier subscriptions, license keys, feature entitlements,
// and payment processing for retail quants and institutional hedge funds.
// =====================================================================

export type SubscriptionTier = 'STARTER' | 'PRO' | 'VIP';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number; // monthly equivalent when paid annually
  annualTotal: number;
  popular?: boolean;
  features: string[];
  limits: {
    signalsPerDay: number | 'UNLIMITED';
    mt5Accounts: number | 'UNLIMITED';
    aiWarRoom: boolean;
    autoMt5Execute: boolean;
    voiceCopilot: boolean;
    priorityLatency: boolean;
  };
}

export interface UserSubscription {
  userId: string;
  userName: string;
  userEmail: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  licenseKey: string;
  createdAt: number;
  renewsAt: number;
  connectedMt5Accounts: Array<{
    login: string;
    server: string;
    lastPing: number;
    status: 'ONLINE' | 'OFFLINE';
  }>;
  invoices: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'PAID' | 'PENDING';
    planName: string;
    paymentMethod: 'STRIPE_CARD' | 'CRYPTO_USDT';
  }>;
}

export const SAAS_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  STARTER: {
    id: 'STARTER',
    name: 'Starter Retail',
    tagline: 'Ideal for beginners exploring Smart Money Concepts and paper trading.',
    priceMonthly: 0,
    priceAnnual: 0,
    annualTotal: 0,
    features: [
      '3 High-Quality SMC Signals per day',
      'Full Interactive TradingView & Custom Charts',
      'Manual Paper Trading Simulator ($50K virtual balance)',
      'Basic Economic Calendar (High Impact only)',
      'Community Discord & Telegram Discussions',
      'Standard 15M & 1H Timeframe Analysis'
    ],
    limits: {
      signalsPerDay: 3,
      mt5Accounts: 0,
      aiWarRoom: false,
      autoMt5Execute: false,
      voiceCopilot: false,
      priorityLatency: false
    }
  },
  PRO: {
    id: 'PRO',
    name: 'Pro Trader',
    tagline: 'Engineered for dedicated prop-firm traders and active FX/Crypto quants.',
    priceMonthly: 149,
    priceAnnual: 119,
    annualTotal: 1428,
    popular: true,
    features: [
      'Unlimited SMC & ICT Institutional Setups (92% Win Rate)',
      '1 Connected MetaTrader 5 (MT5) Live Real/Demo Account',
      'JARVIS Roman Urdu Voice Assistant & Audio Copilot',
      'Automated Order Routing with 1-Click Confirmation',
      'Complete Fundamental Suite & Central Bank Reserve Trackers',
      'Pine Script v5/v6 Strategy Generator & Export',
      'Prop-Firm Drawdown Safeguard (Max 3% Daily DD Enforcer)'
    ],
    limits: {
      signalsPerDay: 'UNLIMITED',
      mt5Accounts: 1,
      aiWarRoom: false,
      autoMt5Execute: false,
      voiceCopilot: true,
      priorityLatency: false
    }
  },
  VIP: {
    id: 'VIP',
    name: 'Institutional VIP',
    tagline: 'The ultimate Hedge Fund Operating System with autonomous multi-agent execution.',
    priceMonthly: 399,
    priceAnnual: 319,
    annualTotal: 3828,
    features: [
      'Full AI Studio X Command Center (All 18 Modules)',
      'AI War Room: 7 Neural Quant Agents Multi-Model Consensus',
      'Autonomous Auto-Trader (Khud Trade Lagana — No Confirmation Needed)',
      'Unlimited MetaTrader 5 (MT5) Live Accounts & VPS Sync',
      'Ultra-Low Latency Direct Execution Engine (< 15ms ping)',
      'VIP Telegram Webhook Signals (Instant Push to Mobile)',
      'XAUUSD Daily Briefing Exportable Institutional Reports',
      'Dedicated Quant Strategist Support (24/7 Priority SLA)'
    ],
    limits: {
      signalsPerDay: 'UNLIMITED',
      mt5Accounts: 'UNLIMITED',
      aiWarRoom: true,
      autoMt5Execute: true,
      voiceCopilot: true,
      priorityLatency: true
    }
  }
};

// Default pre-seeded Institutional VIP subscriber
export const DEFAULT_USER_SUBSCRIPTION: UserSubscription = {
  userId: 'usr-hedgefund-994102',
  userName: 'Shaheen Quant Trader',
  userEmail: 'shaheen.trader@clevertrader.io',
  tier: 'VIP',
  billingCycle: 'MONTHLY',
  status: 'ACTIVE',
  licenseKey: 'CT-VIP-894102-X',
  createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
  renewsAt: Date.now() + 28 * 24 * 60 * 60 * 1000,  // 28 days left
  connectedMt5Accounts: [
    { login: '50192842', server: 'MetaQuotes-Demo', lastPing: Date.now() - 12000, status: 'ONLINE' },
    { login: '89410294', server: 'Exness-Real2', lastPing: Date.now() - 45000, status: 'ONLINE' }
  ],
  invoices: [
    {
      id: 'INV-2026-089',
      date: 'Aug 08, 2026',
      amount: 399.00,
      status: 'PAID',
      planName: 'Institutional VIP (Monthly)',
      paymentMethod: 'STRIPE_CARD'
    },
    {
      id: 'INV-2026-074',
      date: 'Jul 08, 2026',
      amount: 399.00,
      status: 'PAID',
      planName: 'Institutional VIP (Monthly)',
      paymentMethod: 'CRYPTO_USDT'
    }
  ]
};

const STORAGE_KEY = 'clever_trader_saas_user';

/**
 * Get current active subscriber profile
 */
export function getCurrentSubscription(): UserSubscription {
  if (typeof window === 'undefined') return DEFAULT_USER_SUBSCRIPTION;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return DEFAULT_USER_SUBSCRIPTION;
}

/**
 * Update subscriber profile
 */
export function saveSubscription(sub: UserSubscription): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sub));
  } catch (e) {}
}

/**
 * Generate a cryptographically styled MT5 license key
 */
export function generateLicenseKey(tier: SubscriptionTier): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CT-${tier}-${rand}-X`;
}

/**
 * Upgrade or change subscription plan
 */
export function upgradeSubscription(newTier: SubscriptionTier, cycle: BillingCycle, method: 'STRIPE_CARD' | 'CRYPTO_USDT'): UserSubscription {
  const current = getCurrentSubscription();
  const plan = SAAS_PLANS[newTier];
  const cost = cycle === 'ANNUAL' ? plan.annualTotal : plan.priceMonthly;

  const newInvoice = {
    id: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    amount: cost,
    status: 'PAID' as const,
    planName: `${plan.name} (${cycle})`,
    paymentMethod: method
  };

  const updated: UserSubscription = {
    ...current,
    tier: newTier,
    billingCycle: cycle,
    status: 'ACTIVE',
    licenseKey: generateLicenseKey(newTier),
    renewsAt: Date.now() + (cycle === 'ANNUAL' ? 365 : 30) * 24 * 60 * 60 * 1000,
    invoices: [newInvoice, ...current.invoices]
  };

  saveSubscription(updated);
  return updated;
}

/**
 * Verify if a license key is valid
 */
export function verifyLicenseKey(key: string): { valid: boolean; tier?: SubscriptionTier; message: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, message: 'License key is missing or invalid format.' };
  }

  const clean = key.trim().toUpperCase();
  if (clean.startsWith('CT-VIP-')) {
    return { valid: true, tier: 'VIP', message: 'Institutional VIP License Key Verified! Full access granted.' };
  }
  if (clean.startsWith('CT-PRO-')) {
    return { valid: true, tier: 'PRO', message: 'Pro Trader License Key Verified! 1 MT5 slot active.' };
  }
  if (clean.startsWith('CT-STARTER-')) {
    return { valid: true, tier: 'STARTER', message: 'Starter License Key Verified (Manual trading only).' };
  }

  return { valid: false, message: 'Invalid or expired license key. Please check your billing dashboard.' };
}

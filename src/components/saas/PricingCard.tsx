"use client";

import React from "react";
import { SubscriptionPlan, BillingCycle } from "@/lib/saas/subscription";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap, Crown } from "lucide-react";

interface PricingCardProps {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  currentTier?: string;
  onSelectPlan: (planId: SubscriptionPlan["id"]) => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  currentTier,
  onSelectPlan,
}) => {
  const isCurrent = currentTier === plan.id;
  const price = billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly;

  return (
    <div className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 transition-all font-mono backdrop-blur-xl ${
      plan.popular
        ? "bg-gradient-to-b from-[#0a182d] via-[#0b1424] to-[#070d17] border-2 border-cyan-400 shadow-2xl shadow-cyan-950/50 scale-[1.02]"
        : plan.id === "VIP"
        ? "bg-gradient-to-b from-[#1c1407] via-[#100d05] to-[#0a0803] border-2 border-amber-500/60 shadow-2xl shadow-amber-950/40"
        : "bg-surface/80 border border-slate-800 hover:border-slate-700"
    }`}>
      
      {/* Top Banner if Popular */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
          ⭐ MOST POPULAR FOR PROP TRADERS
        </div>
      )}

      {plan.id === "VIP" && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black uppercase tracking-wider shadow-md">
          👑 HEDGE FUND ARCHITECTURE
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {plan.id === "VIP" ? (
              <Crown className="w-5 h-5 text-amber-400" />
            ) : plan.id === "PRO" ? (
              <Zap className="w-5 h-5 text-cyan-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            )}
            <h3 className="text-lg font-black text-white uppercase tracking-tight">
              {plan.name}
            </h3>
          </div>

          {isCurrent && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              ACTIVE PLAN
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-5 min-h-[36px]">
          {plan.tagline}
        </p>

        {/* Pricing Display */}
        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/[0.06]">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              ${price}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / month {billingCycle === "ANNUAL" && "(billed yearly)"}
            </span>
          </div>

          {billingCycle === "ANNUAL" && plan.priceMonthly > 0 ? (
            <div className="mt-1 text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>${plan.annualTotal} billed annually (Save 20% + 2 Months Free)</span>
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-500">
              {plan.priceMonthly === 0 ? "Free forever • No credit card required" : "Flexible monthly billing • Cancel anytime"}
            </div>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mb-6">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            What's included:
          </div>
          <ul className="space-y-2 text-xs">
            {plan.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-slate-300">
                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  plan.id === "VIP" 
                    ? "bg-amber-500/20 text-amber-400" 
                    : plan.id === "PRO" 
                    ? "bg-cyan-500/20 text-cyan-400" 
                    : "bg-slate-800 text-slate-400"
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span className="leading-tight">{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div>
        <button
          onClick={() => onSelectPlan(plan.id)}
          disabled={isCurrent}
          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            isCurrent
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : plan.id === "VIP"
              ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black hover:brightness-110 shadow-amber-950/50"
              : plan.id === "PRO"
              ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 text-black hover:brightness-110 shadow-cyan-950/50"
              : "bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1]"
          }`}
        >
          <span>{isCurrent ? "Currently Subscribed" : plan.priceMonthly === 0 ? "Get Started Free" : `Upgrade to ${plan.name}`}</span>
          {!isCurrent && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { SAAS_PLANS, BillingCycle, SubscriptionTier, getCurrentSubscription, DEFAULT_USER_SUBSCRIPTION, UserSubscription } from "@/lib/saas/subscription";
import { PricingCard } from "@/components/saas/PricingCard";
import Link from "next/link";
import { ArrowLeft, Sparkles, Check, HelpCircle, Shield, Zap, Lock } from "lucide-react";

const CheckoutModal = dynamic(
  () => import("@/components/saas/CheckoutModal").then((mod) => mod.CheckoutModal),
  { ssr: false }
);

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("ANNUAL");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [userSub, setUserSub] = useState<UserSubscription>(DEFAULT_USER_SUBSCRIPTION);

  useEffect(() => {
    setUserSub(getCurrentSubscription());
  }, []);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (licenseKey: string) => {
    setUserSub(getCurrentSubscription());
  };

  return (
    <div className="w-full space-y-10 font-mono py-4">
      
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-3 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-2 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Terminal</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Institutional SaaS Pricing Plans</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase">
          Trade Like An Institutional Hedge Fund
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Choose the quantitative plan engineered for your trading scale. From retail SMC analysis to autonomous multi-agent MetaTrader 5 live execution.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 p-1.5 rounded-2xl shadow-inner mt-4">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-white text-black shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle("ANNUAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              billingCycle === "ANNUAL"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Annual (Save 20%)</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-black/30 text-black uppercase">
              2 Mos Free
            </span>
          </button>
        </div>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <PricingCard
          plan={SAAS_PLANS.STARTER}
          billingCycle={billingCycle}
          currentTier={userSub.tier}
          onSelectPlan={handleSelectPlan}
        />
        <PricingCard
          plan={SAAS_PLANS.PRO}
          billingCycle={billingCycle}
          currentTier={userSub.tier}
          onSelectPlan={handleSelectPlan}
        />
        <PricingCard
          plan={SAAS_PLANS.VIP}
          billingCycle={billingCycle}
          currentTier={userSub.tier}
          onSelectPlan={handleSelectPlan}
        />
      </div>

      {/* Feature Comparison Matrix */}
      <div className="w-full bg-[#080d17] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Feature Entitlements Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-center">Starter ($0)</th>
                <th className="py-3 px-4 text-center text-cyan-300">Pro Trader ($149)</th>
                <th className="py-3 px-4 text-center text-amber-300">Institutional VIP ($399)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Daily SMC & ICT Signals</td>
                <td className="py-3 px-4 text-center text-slate-400">3 per day</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Unlimited VIP</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">MetaTrader 5 (MT5) Real Accounts</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-cyan-400 font-bold">1 Account</td>
                <td className="py-3 px-4 text-center text-amber-400 font-bold">Unlimited Accounts</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">AI War Room & Multi-Agent Consensus</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Included (7 Agents)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Autonomous Direct Auto-Trading</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-slate-400">1-Click Manual</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">100% Fully Autonomous</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">NEXUS AI Voice Copilot</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Included</td>
                <td className="py-3 px-4 text-center text-emerald-400 font-bold">Included (Ultra Fast)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-white">Prop-Firm Drawdown Protection</td>
                <td className="py-3 px-4 text-center text-slate-500">—</td>
                <td className="py-3 px-4 text-center text-cyan-400 font-bold">3% Standard</td>
                <td className="py-3 px-4 text-center text-amber-400 font-bold">Customizable / Multi-firm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="w-full space-y-4 pt-4">
        <h3 className="text-base font-black uppercase text-center text-white tracking-wider flex items-center justify-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Frequently Asked Questions (SaaS)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <h4 className="font-bold text-white">Kya main real account par auto-trade kar sakta hoon?</h4>
            <p className="text-slate-400 leading-relaxed">
              Ji haan! Pro aur VIP tier par hamara compiled <code>CleverTraderBridge.ex5</code> aapke MT5 real account ke sath connect ho kar direct trades execute karta hai.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <h4 className="font-bold text-white">Payment methods kaun se available hain?</h4>
            <p className="text-slate-400 leading-relaxed">
              Aap Credit/Debit Card (Stripe) ya Crypto USDT (TRC20/BEP20 / Binance Pay) se asani se payment kar sakte hain. Payment foran confirm hoti hai.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <h4 className="font-bold text-white">License Key kahan milegi?</h4>
            <p className="text-slate-400 leading-relaxed">
              Checkout mukammal hote hi screen par aapki unique license key show ho jayegi aur aapke <Link href="/billing" className="text-cyan-400 underline">Billing Portal</Link> me hamesha mehfooz rahegi.
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1">
            <h4 className="font-bold text-white">Refund policy kya hai?</h4>
            <p className="text-slate-400 leading-relaxed">
              Hum 14-day no-questions-asked money-back guarantee offer karte hain. Agar aap mutma'in na hon to aik click par refund le sakte hain.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedTier && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          tier={selectedTier}
          billingCycle={billingCycle}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

    </div>
  );
}

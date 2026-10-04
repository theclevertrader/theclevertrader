"use client";

import React, { useState, useEffect } from "react";
import { 
  getCurrentSubscription, saveSubscription, SAAS_PLANS, 
  generateLicenseKey, UserSubscription 
} from "@/lib/saas/subscription";
import { SubscriptionBadge } from "@/components/saas/SubscriptionBadge";
import Link from "next/link";
import { 
  ArrowLeft, Key, Copy, Check, ShieldCheck, Download, 
  Cpu, CreditCard, RefreshCw, Calendar, Sparkles, ExternalLink, Plus
} from "lucide-react";

export default function BillingPage() {
  const [sub, setSub] = useState<UserSubscription>(getCurrentSubscription());
  const [copiedKey, setCopiedKey] = useState(false);
  const [newMt5Login, setNewMt5Login] = useState("");
  const [newMt5Server, setNewMt5Server] = useState("");
  const [isAddingMt5, setIsAddingMt5] = useState(false);

  useEffect(() => {
    setSub(getCurrentSubscription());
  }, []);

  const plan = SAAS_PLANS[sub.tier];

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(sub.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleRegenerateKey = () => {
    if (confirm("Kya aap nayi MetaTrader 5 License Key generate karna chahte hain? Purani key deactivate ho jayegi.")) {
      const updated: UserSubscription = {
        ...sub,
        licenseKey: generateLicenseKey(sub.tier)
      };
      setSub(updated);
      saveSubscription(updated);
    }
  };

  const handleAddMt5Account = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMt5Login || !newMt5Server) return;

    const updated: UserSubscription = {
      ...sub,
      connectedMt5Accounts: [
        ...sub.connectedMt5Accounts,
        {
          login: newMt5Login,
          server: newMt5Server,
          lastPing: Date.now(),
          status: "ONLINE"
        }
      ]
    };
    setSub(updated);
    saveSubscription(updated);
    setNewMt5Login("");
    setNewMt5Server("");
    setIsAddingMt5(false);
  };

  return (
    <div className="w-full space-y-8 font-mono py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Terminal</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Billing & License Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your institutional subscriptions, MetaTrader 5 EA license keys, and payment receipts.
          </p>
        </div>

        <Link
          href="/pricing"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-amber-950/40 self-start sm:self-auto"
        >
          Change Plan / Upgrade ⚡
        </Link>
      </div>

      {/* Grid: Active Plan & License Key */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Active Plan Card (Col 7) */}
        <div className="md:col-span-7 bg-[#090f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Subscription</span>
            <SubscriptionBadge tier={sub.tier} size="md" />
          </div>

          <div>
            <div className="text-xl font-black text-white">{plan.name}</div>
            <p className="text-xs text-slate-400 mt-0.5">{plan.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-xl border border-white/[0.06] text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Billing Cycle:</span>
              <strong className="text-white font-bold">{sub.billingCycle}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Next Renewal:</span>
              <strong className="text-emerald-400 font-bold">28 Days Left (Auto-Renew)</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Monthly Cost:</span>
              <strong className="text-white font-bold">${sub.billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly}.00 USD</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Subscriber Email:</span>
              <span className="text-slate-300 truncate block text-[11px]">{sub.userEmail}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px]">Payment Method: <strong>Stripe Card (•••• 4242)</strong></span>
            <button className="text-cyan-400 hover:underline text-[11px] font-bold">Edit Method</button>
          </div>
        </div>

        {/* License Key Card (Col 5) */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#0e1726] to-[#080e18] border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>MT5 License Key</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              VERIFIED 🟢
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Ye license key aapke MetaTrader 5 Expert Advisor (EA) ko authenticate karti hai taake bot real account par run ho sake:
          </p>

          <div className="bg-black/80 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
            <span className="text-sm font-black text-cyan-300 tracking-wider truncate font-mono">
              {sub.licenseKey}
            </span>
            <button
              onClick={copyLicenseKey}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Slots: <strong>{sub.connectedMt5Accounts.length} / {plan.limits.mt5Accounts} Active</strong></span>
            <button
              onClick={handleRegenerateKey}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate Key</span>
            </button>
          </div>
        </div>

      </div>

      {/* Connected MetaTrader 5 Accounts */}
      <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Connected MetaTrader 5 Terminal Terminals</span>
            </h3>
            <p className="text-xs text-slate-400">Authorized real and demo MT5 account numbers authenticated with your license key.</p>
          </div>

          <button
            onClick={() => setIsAddingMt5(!isAddingMt5)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link New Account</span>
          </button>
        </div>

        {isAddingMt5 && (
          <form onSubmit={handleAddMt5Account} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/50 p-4 rounded-xl border border-cyan-500/30">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">MT5 Login ID</label>
              <input
                type="text"
                required
                placeholder="e.g. 50192842"
                value={newMt5Login}
                onChange={e => setNewMt5Login(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Broker Server Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Exness-Real, ICMarkets-Live"
                value={newMt5Server}
                onChange={e => setNewMt5Server(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400"
              >
                Authorize Slot
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Account Login</th>
                <th className="py-2.5 px-3">Broker Server</th>
                <th className="py-2.5 px-3">Bridge Status</th>
                <th className="py-2.5 px-3">Last Heartbeat</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sub.connectedMt5Accounts.map((acc, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{acc.login}</span>
                  </td>
                  <td className="py-3 px-3">{acc.server}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ONLINE (14ms)
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">Just now</td>
                  <td className="py-3 px-3 text-right">
                    <button className="text-rose-400 hover:underline text-[11px]">Unlink</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Receipts & Payment History */}
      <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wide flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Invoices & Payment History</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sub.invoices.map((inv, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-mono font-bold text-white">{inv.id}</td>
                  <td className="py-3 px-3 text-slate-400">{inv.date}</td>
                  <td className="py-3 px-3">{inv.planName}</td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {inv.paymentMethod === "STRIPE_CARD" ? "Card •••• 4242" : "USDT TRC20"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">${inv.amount.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right">
                    <button 
                      onClick={() => alert(`Invoice ${inv.id} downloaded.`)}
                      className="text-cyan-400 hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                    >
                      <span>PDF</span>
                      <Download className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

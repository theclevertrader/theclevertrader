"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DollarSign, Users, TrendingUp, Cpu, 
  ShieldCheck, Activity, Search, Filter, CheckCircle2, 
  AlertCircle, Download, Sparkles, Server
} from "lucide-react";

export default function SaasAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const subscribers = [
    { name: "Shaheen Quant Trader", email: "shaheen.trader@clevertrader.io", tier: "VIP", mrr: 399, status: "ACTIVE", key: "CT-VIP-894102-X", mt5: "50192842 (MetaQuotes)" },
    { name: "Apex Alpha Capital", email: "quant@apexalpha.ch", tier: "VIP", mrr: 399, status: "ACTIVE", key: "CT-VIP-338194-X", mt5: "99104812 (ICMarkets)" },
    { name: "Tariq Mahmood", email: "tariq.fx@gmail.com", tier: "PRO", mrr: 149, status: "ACTIVE", key: "CT-PRO-774102-X", mt5: "88219401 (Exness)" },
    { name: "London Prop Desk", email: "desk@ldnprop.co.uk", tier: "VIP", mrr: 399, status: "ACTIVE", key: "CT-VIP-914028-X", mt5: "44019283 (FTMO)" },
    { name: "Hamza Saeed", email: "hamza.trader@outlook.com", tier: "PRO", mrr: 149, status: "ACTIVE", key: "CT-PRO-129402-X", mt5: "22019481 (Exness)" },
    { name: "Zubair Khan", email: "zubair.k@yahoo.com", tier: "STARTER", mrr: 0, status: "ACTIVE", key: "CT-STARTER-48201-X", mt5: "Paper Only" },
    { name: "Zurich Quant Partners", email: "invest@zurichquant.ch", tier: "VIP", mrr: 399, status: "ACTIVE", key: "CT-VIP-661029-X", mt5: "77019284 (Dukascopy)" },
  ];

  const filtered = subscribers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              SaaS Business Analytics & Admin
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              EXECUTIVE PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time MRR, ARR, paying quants, active MT5 bridge instances, and platform throughput.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-300 font-bold">TELEMETRY: LIVE</span>
        </div>
      </div>

      {/* 4 Core SaaS Business Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR */}
        <div className="bg-[#090f1a] border border-cyan-500/30 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>MONTHLY RECURRING (MRR)</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">$128,450</div>
            <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% vs last month</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
            Annual Run Rate (ARR): <strong>$1.54M USD</strong>
          </div>
        </div>

        {/* Paying Subscribers */}
        <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>ACTIVE SUBSCRIBERS</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">842</div>
            <div className="text-xs font-semibold text-purple-300 mt-1">
              520 Pro • 322 VIP Quants
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
            Free Retail Accounts: <strong>2,410</strong>
          </div>
        </div>

        {/* Connected MT5 EA Terminals */}
        <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>ACTIVE MT5 NODES</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">1,280</div>
            <div className="text-xs font-semibold text-emerald-300 mt-1">
              Real-Account EA Terminals Online
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
            Execution Latency: <strong>14.2ms avg</strong>
          </div>
        </div>

        {/* Churn & Retention */}
        <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
            <span>CHURN & RETENTION</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-3xl font-black text-amber-300 font-mono tracking-tight">1.2%</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1">
              98.8% Monthly Retention Rate
            </div>
          </div>
          <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-3">
            Average LTV: <strong>$1,820 USD</strong>
          </div>
        </div>

      </div>

      {/* Subscriber Management Table */}
      <div className="bg-[#090f1a] border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm md:text-base font-black uppercase text-white tracking-wide">
              Subscriber Accounts & License Directory
            </h3>
            <p className="text-xs text-slate-400">Search and manage active trader licenses and MetaTrader 5 allocations.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search trader, key, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-black/50 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white pl-8 focus:outline-none focus:border-cyan-400 w-64"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Subscriber</th>
                <th className="py-2.5 px-3">Plan Tier</th>
                <th className="py-2.5 px-3">MRR</th>
                <th className="py-2.5 px-3">License Key</th>
                <th className="py-2.5 px-3">Connected MT5</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((sub, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white">{sub.name}</div>
                    <div className="text-[10px] text-slate-400">{sub.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      sub.tier === "VIP" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                      sub.tier === "PRO" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" :
                      "bg-slate-800 text-slate-400"
                    }`}>
                      {sub.tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">${sub.mrr}/mo</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-cyan-300">{sub.key}</td>
                  <td className="py-3 px-3 text-slate-300">{sub.mt5}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      ACTIVE 🟢
                    </span>
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

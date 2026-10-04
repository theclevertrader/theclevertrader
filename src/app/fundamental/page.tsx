'use client';

import React, { useState, useEffect } from 'react';
import { FundamentalOverviewWidget } from '@/components/fundamental/FundamentalOverviewWidget';
import { EconomicCalendarWidget } from '@/components/fundamental/EconomicCalendarWidget';
import { InstitutionalSourcesMatrix } from '@/components/fundamental/InstitutionalSourcesMatrix';
import { 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Key, 
  Sparkles, 
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { MacroIndicator } from '@/lib/engines/fundamental-engine';

export default function FundamentalAnalysisPage() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [finnhubKey, setFinnhubKey] = useState('');
  const [alphaKey, setAlphaKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/fundamental')
      .then(res => res.json())
      .then(data => {
        if (data.overview?.indicators) {
          setIndicators(data.overview.indicators);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveKeys = async () => {
    try {
      const res = await fetch('/api/fundamental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_keys',
          finnhub: finnhubKey,
          alphaVantage: alphaKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 font-mono w-full">
      {/* 20 Institutional Data Sources Matrix with Free API Key Drawer */}
      <InstitutionalSourcesMatrix />

      {/* Overview Widget (DXY, 10Y Yields, Currency Strength Meter) */}
      <FundamentalOverviewWidget />

      {/* Macro Indicators Detailed Table */}
      <div className="bb-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Institutional Macro Drivers & Asset Impact Table
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Real-Time Institutional Desks Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bb-table">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                <th className="px-3 py-2.5">Indicator</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Current Value</th>
                <th className="px-3 py-2.5">Prior</th>
                <th className="px-3 py-2.5">Trend</th>
                <th className="px-3 py-2.5">Impact on Gold</th>
                <th className="px-3 py-2.5">Impact on USD</th>
                <th className="px-3 py-2.5">Institutional Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
              {indicators.map(ind => (
                <tr key={ind.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 font-bold text-white font-sans">{ind.name}</td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-400">{ind.category}</td>
                  <td className="px-3 py-2.5 font-bold text-white">{ind.value}</td>
                  <td className="px-3 py-2.5 text-slate-400">{ind.prior}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                      ind.trend === 'UP' ? 'text-emerald-400' : (ind.trend === 'DOWN' ? 'text-rose-400' : 'text-slate-400')
                    }`}>
                      {ind.trend === 'UP' ? '▲ UP' : (ind.trend === 'DOWN' ? '▼ DOWN' : '— NEUTRAL')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ind.impactOnGold === 'BULLISH' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : (ind.impactOnGold === 'BEARISH' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-700/20 text-slate-400')
                    }`}>
                      {ind.impactOnGold}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      ind.impactOnUsd === 'BULLISH' 
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                        : (ind.impactOnUsd === 'BEARISH' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-slate-700/20 text-slate-400')
                    }`}>
                      {ind.impactOnUsd}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-400 max-w-xs font-sans">{ind.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded Economic Calendar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Economic Calendar & News Events
          </h3>
        </div>
        <EconomicCalendarWidget />
      </div>

      {/* Free API Keys Manager Card */}
      <div className="bb-card p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Free Fundamental API Keys Integration
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
            OPTIONAL ENHANCEMENT
          </span>
        </div>

        <p className="text-[11px] text-slate-400 font-sans">
          Terminal mein pehle se real-time institutional economic feeds shamil hain. Agar aap apna personal free API key connect karna chahte hain to yahan input karein:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Finnhub Free API Key</label>
              <a
                href="https://finnhub.io/register"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Finnhub.io (Free)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={finnhubKey}
              onChange={e => setFinnhubKey(e.target.value)}
              placeholder="e.g. c89abc123..."
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">Alpha Vantage Free API Key</label>
              <a
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>AlphaVantage.co (Free)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={alphaKey}
              onChange={e => setAlphaKey(e.target.value)}
              placeholder="e.g. ALPHAVANTAGE123..."
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-white focus:outline-none focus:border-amber-400 font-mono text-xs"
            />
          </div>
        </div>

        {savedSuccess && (
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Fundamental API keys saved successfully!</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            onClick={handleSaveKeys}
            className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold font-mono transition-all text-xs"
          >
            Save Fundamental API Keys
          </button>
        </div>
      </div>
    </div>
  );
}

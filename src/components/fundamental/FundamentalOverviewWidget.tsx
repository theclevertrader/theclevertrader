'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Coins, 
  ShieldCheck, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { FundamentalAnalysisOverview } from '@/lib/engines/fundamental-engine';

export const FundamentalOverviewWidget: React.FC = () => {
  const [data, setData] = useState<FundamentalAnalysisOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundamental = async () => {
      try {
        const res = await fetch('/api/fundamental');
        if (res.ok) {
          const json = await res.json();
          setData(json.overview);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFundamental();
  }, []);

  if (loading || !data) {
    return (
      <div className="tv-card p-6 text-center text-[#848e9c] text-xs animate-pulse">
        Loading Institutional Fundamental & Macro Feed...
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Top Macro Metric Cards (DXY, 10Y Yield, Fed Rate, Gold Bias) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="tv-card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
            <span>US Dollar Index (DXY)</span>
            <span className="text-tv-red font-mono font-semibold">{data.dxyChange}%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white font-mono">{data.dxyIndex}</span>
            <span className="text-[10px] text-tv-red font-bold">BEARISH DRIFT</span>
          </div>
          <span className="text-[10px] text-[#5d6573] block">Fed rate cut pricing pressure</span>
        </div>

        <div className="tv-card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
            <span>US 10-Year Bond Yield</span>
            <span className="text-tv-red font-mono font-semibold">-0.19%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white font-mono">{data.us10yYield}%</span>
            <span className="text-[10px] text-tv-green font-bold">YIELDS FALLING</span>
          </div>
          <span className="text-[10px] text-[#5d6573] block">Bullish for Gold & Tech equities</span>
        </div>

        <div className="tv-card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
            <span>10Y-2Y Yield Curve</span>
            <span className="text-tv-green font-mono font-semibold">UN-INVERTING</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white font-mono">+{data.yieldSpread}%</span>
            <span className="text-[10px] text-tv-blue font-bold">NORMALIZING</span>
          </div>
          <span className="text-[10px] text-[#5d6573] block">Economic cycle inflection</span>
        </div>

        <div className="tv-card p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
            <span>XAUUSD (Gold) Macro Bias</span>
            <Coins className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-tv-green font-mono">STRONG BULLISH</span>
          </div>
          <span className="text-[10px] text-slate-400 block">De-dollarization & rate cuts</span>
        </div>
      </div>

      {/* Currency Strength Meter & Roman Urdu Macro Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Currency Strength Meter (2 cols) */}
        <div className="lg:col-span-2 tv-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#242b38] pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-tv-blue" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Institutional Currency Strength Index
              </h4>
            </div>
            <span className="text-[10px] text-[#848e9c] font-mono">Normalized (0 - 10)</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {data.currencyStrengths.map(curr => {
              const pct = (curr.score / 10) * 100;
              const isStrong = curr.bias === 'STRONG';
              const isWeak = curr.bias === 'WEAK';

              return (
                <div key={curr.currency} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white w-10">{curr.currency}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        isStrong 
                          ? 'bg-emerald-500/15 text-tv-green' 
                          : (isWeak ? 'bg-rose-500/15 text-tv-red' : 'bg-slate-700/30 text-[#848e9c]')
                      }`}>
                        {curr.bias}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] ${curr.change24h >= 0 ? 'text-tv-green' : 'text-tv-red'}`}>
                        {curr.change24h >= 0 ? '+' : ''}{curr.change24h}%
                      </span>
                      <span className="font-bold text-white w-8 text-right">{curr.score.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Horizontal Visual Meter */}
                  <div className="h-2 w-full rounded-full bg-[#0c1017] overflow-hidden p-0.5 border border-[#242b38]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isStrong
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : isWeak
                          ? 'bg-gradient-to-r from-rose-600 to-red-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roman Urdu AI Macro Insight */}
        <div className="tv-card p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-tv-blue font-bold">
              <Sparkles className="w-4 h-4 text-tv-green" />
              <span>AI Fundamental Analysis (Roman Urdu)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px] bg-[#0c1017] p-3 rounded-xl border border-[#242b38]">
              {data.romanUrduMacroSummary}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-slate-300 space-y-1">
            <span className="font-bold text-tv-blue block">Key Trading Implication:</span>
            <p className="text-[#848e9c]">
              GBP aur EUR pairs strong hain jabke USD consolidating stage mein hai. DXY breakdown par GBPUSD & Gold buys high-probability trade setups provide karte hain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

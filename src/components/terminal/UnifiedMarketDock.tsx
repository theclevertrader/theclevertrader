'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, ArrowRight, PieChart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMarketTicks } from '@/lib/hooks/useMarketData';

interface MoverItem {
  symbol: string;
  price: string;
  change: number;
}

const DEFAULT_GAINERS: MoverItem[] = [
  { symbol: 'GBPJPY', price: '207.970', change: 9.88 },
  { symbol: 'USDJPY', price: '153.507', change: 5.70 },
  { symbol: 'EURJPY', price: '178.490', change: 5.71 },
  { symbol: 'GBPUSD', price: '1.35484', change: 3.96 },
  { symbol: 'XAUUSD', price: '4,400.31', change: 1.16 },
  { symbol: 'EURUSD', price: '1.16285', change: 0.01 },
];

const DEFAULT_LOSERS: MoverItem[] = [
  { symbol: 'NZDUSD', price: '0.58424', change: -0.28 },
  { symbol: 'EURGBP', price: '0.85820', change: -0.15 },
  { symbol: 'AUDUSD', price: '0.72186', change: -0.03 },
  { symbol: 'USDCHF', price: '0.81020', change: 0.14 },
  { symbol: 'USDCAD', price: '1.38069', change: 0.22 },
  { symbol: 'DXY', price: '104.280', change: 0.13 },
];

interface CalendarEvent {
  currency: string;
  event: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  flag: string;
}

const EVENTS: CalendarEvent[] = [
  { currency: 'USD', event: 'FOMC Member Bowman Speaks', time: '14:30', impact: 'High', flag: '🇺🇸' },
  { currency: 'EUR', event: 'ECB President Lagarde Speaks', time: '16:00', impact: 'Medium', flag: '🇪🇺' },
  { currency: 'USD', event: 'Core PCE Price Index (MoM)', time: '16:30', impact: 'High', flag: '🇺🇸' },
  { currency: 'GBP', event: 'GDP (QoQ)', time: '18:00', impact: 'Medium', flag: '🇬🇧' },
  { currency: 'USD', event: 'Unemployment Claims', time: '20:30', impact: 'Medium', flag: '🇺🇸' },
  { currency: 'USD', event: 'Fed Chair Powell Press Briefing', time: '21:00', impact: 'High', flag: '🇺🇸' },
];

interface UnifiedMarketDockProps {
  onSelectSymbol?: (symbol: string) => void;
  balance?: number;
  todayPnl?: number;
  todayPnlPercent?: number;
  openTrades?: number;
  marginLevel?: number;
  accountLogin?: string | number;
  accountServer?: string;
}

export const UnifiedMarketDock: React.FC<UnifiedMarketDockProps> = ({
  onSelectSymbol,
  balance = 10000.0,
  todayPnl = 0.0,
  todayPnlPercent = 0.0,
  openTrades = 0,
  marginLevel = 0.0,
  accountLogin,
}) => {
  // Top Movers State
  const [tab, setTab] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');
  const [gainers, setGainers] = useState<MoverItem[]>(DEFAULT_GAINERS);
  const [losers, setLosers] = useState<MoverItem[]>(DEFAULT_LOSERS);
  const ticks = useMarketTicks();

  useEffect(() => {
    if (!ticks || Object.keys(ticks).length === 0) return;
    const list: MoverItem[] = Object.entries(ticks).map(([sym, t]: [string, any]) => {
      let formatted = t.price?.toFixed(
        sym === 'USDJPY' || sym === 'EURJPY' || sym === 'GBPJPY' || sym === 'DXY' ? 3 :
        sym === 'XAUUSD' ? 2 : 5
      ) || '0.00';
      if (sym === 'XAUUSD' && t.price) {
        formatted = t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return {
        symbol: sym,
        price: formatted,
        change: t.change ?? 0,
      };
    });

    const sorted = [...list].sort((a, b) => b.change - a.change);
    const g = sorted.filter(x => x.change >= 0).slice(0, 6);
    const l = sorted.filter(x => x.change < 0).reverse().slice(0, 6);

    if (g.length > 0) setGainers(g);
    if (l.length > 0) setLosers(l);
  }, [ticks]);

  const moverItems = tab === 'GAINERS' ? gainers : tab === 'LOSERS' ? losers : gainers;
  const isProfit = todayPnl >= 0;

  return (
    <div className="ronas-card p-0 overflow-hidden bg-[#050813] border border-white/[0.08] rounded-xl shadow-xl transition-all flex-1 min-h-[220px] flex flex-col justify-between">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06] flex-1">
        
        {/* ============================================================== */}
        {/* SECTION 1: TOP MOVERS (4 cols)                                  */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 p-3 flex flex-col justify-between h-full bg-[#050813]/60">
          <div>
            {/* Header & Tabs */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-white tracking-wider uppercase">Top Movers</span>
                <span className="text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.2 rounded">
                  LIVE
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-0.5 bg-black/40 p-0.5 rounded-md border border-white/[0.05]">
                {(['GAINERS', 'LOSERS', 'VOLUME'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono transition-all ${
                      tab === t
                        ? t === 'GAINERS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : t === 'LOSERS'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-0.5">
              {moverItems.slice(0, 5).map((item) => {
                const isUp = item.change >= 0;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => onSelectSymbol?.(item.symbol)}
                    className="w-full flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-white/[0.04] transition-all text-left group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-[10.5px] font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                        {item.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] text-slate-300 font-mono">{item.price}</span>
                      <span className={`text-[9.5px] font-bold font-mono min-w-[50px] text-right ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isUp ? '+' : ''}{item.change.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: ECONOMIC CALENDAR (4 cols)                          */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 p-3 flex flex-col justify-between h-full bg-[#050813]/60">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-black text-white tracking-wider uppercase">Economic Calendar</span>
              </div>
              <Link
                href="/economic-calendar"
                className="text-[9.5px] text-cyan-400 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>

            {/* Events List */}
            <div className="space-y-0.5">
              {EVENTS.map((event, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-white/[0.04] transition-all gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-[46px] shrink-0">
                    <span className="text-xs leading-none">{event.flag}</span>
                    <span className="text-[10px] font-bold text-white font-mono">{event.currency}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[9.5px] text-slate-300 font-mono truncate block" title={event.event}>
                      {event.event}
                    </span>
                  </div>

                  <span className="text-[9.5px] text-slate-400 font-mono shrink-0 pl-1">
                    {event.time}
                  </span>

                  <span className={`text-[7.5px] font-bold uppercase px-1 py-0.2 rounded border shrink-0 ${
                    event.impact === 'High'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {event.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: PORTFOLIO & ACCOUNT (4 cols)                        */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 p-3 flex flex-col justify-between h-full bg-[#050813]/60">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/[0.04]">
              <div className="flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-[11px] font-black text-white tracking-wider uppercase">Portfolio Overview</span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[8.5px] font-mono text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{accountLogin ? `MT5: ${accountLogin}` : 'MT5 Connected'}</span>
              </div>
            </div>

            {/* Balance & Daily PnL */}
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-[9px] text-zinc-400 font-mono block">Total Balance</span>
                <span className="text-base font-black text-white font-mono tracking-tight">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className={`text-[10px] font-bold font-mono flex items-center gap-1 ${
                isProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <TrendingUp className="w-3 h-3" />
                <span>{isProfit ? '+' : ''}${todayPnl.toFixed(2)} ({isProfit ? '+' : ''}{todayPnlPercent.toFixed(2)}%)</span>
              </div>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 gap-1.5 mb-2 p-1.5 rounded-lg bg-black/40 border border-white/[0.04] text-[9.5px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Open Trades:</span>
                <span className="font-bold text-white">{openTrades}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Margin Level:</span>
                <span className="font-bold text-white">{marginLevel > 0 ? `${marginLevel.toFixed(1)}%` : '100%'}</span>
              </div>
            </div>

            {/* Quick Actions & View Portfolio */}
            <div className="flex items-center gap-1.5">
              <div className="grid grid-cols-4 gap-1 flex-1">
                {[
                  { label: 'Trade', icon: '⚡', href: '/' },
                  { label: 'Analytics', icon: '📈', href: '/analytics' },
                  { label: 'Scanner', icon: '🔍', href: '/scanner' },
                  { label: 'Journal', icon: '📝', href: '/journal' },
                ].map(action => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center py-1 px-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/20 transition-all text-center"
                    title={action.label}
                  >
                    <span className="text-[10px]">{action.icon}</span>
                    <span className="text-[7.5px] text-zinc-300 font-mono font-bold tracking-tight">{action.label}</span>
                  </Link>
                ))}
              </div>

              <Link
                href="/portfolio"
                className="flex items-center justify-center gap-1 px-2.5 py-2.5 rounded-lg bg-white/[0.08] hover:bg-white/15 border border-white/20 text-white text-[9.5px] font-bold font-mono transition-all hover:scale-105 shrink-0"
                title="Open Full Institutional Portfolio Terminal"
              >
                <span>HUB</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

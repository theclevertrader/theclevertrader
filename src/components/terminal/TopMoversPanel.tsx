'use client';

import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
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

interface TopMoversPanelProps {
  onSelectSymbol?: (symbol: string) => void;
}

export const TopMoversPanel: React.FC<TopMoversPanelProps> = ({ onSelectSymbol }) => {
  const [tab, setTab] = useState<'GAINERS' | 'LOSERS' | 'VOLUME'>('GAINERS');
  const [gainers, setGainers] = useState<MoverItem[]>(DEFAULT_GAINERS);
  const [losers, setLosers] = useState<MoverItem[]>(DEFAULT_LOSERS);
  const ticks = useMarketTicks();

  useEffect(() => {
    if (!ticks || Object.keys(ticks).length === 0) return;
    const list: MoverItem[] = Object.entries(ticks).map(([sym, t]: [string, any]) => {
      let formatted = t.price.toFixed(
        sym === 'USDJPY' || sym === 'EURJPY' || sym === 'GBPJPY' || sym === 'DXY' ? 3 :
        sym === 'XAUUSD' ? 2 : 5
      );
      if (sym === 'XAUUSD') {
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

  const items = tab === 'LOSERS' ? (losers.length > 0 ? losers : DEFAULT_LOSERS) : (gainers.length > 0 ? gainers : DEFAULT_GAINERS);

  return (
    <div className="ronas-card p-3 flex flex-col bg-[#0c101c] border border-white/[0.08] h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Flame className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-black text-white tracking-wider uppercase">Top Movers</span>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-0.2 rounded">
          LIVE
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-2.5">
        {(['GAINERS', 'LOSERS', 'VOLUME'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold font-mono transition-all ${
              tab === t
                ? t === 'GAINERS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : t === 'LOSERS'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-0.5 flex-1 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const isUp = item.change >= 0;
          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol?.(item.symbol)}
              className="w-full flex items-center justify-between py-1.5 px-1.5 rounded-md hover:bg-white/[0.03] transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="text-[11px] font-bold text-white font-mono">{item.symbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-300 font-mono">{item.price}</span>
                <span className={`text-[10px] font-bold font-mono ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{item.change.toFixed(2)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketTicks } from '@/lib/hooks/useMarketData';

interface TickerData {
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isUp: boolean;
  icon: string;
  iconBg: string;
}

const INITIAL_TICKERS: Record<string, TickerData> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    price: '4,400.31',
    change: '+1.16%',
    changePercent: '+1.16%',
    isUp: true,
    icon: '🥇',
    iconBg: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40',
  },
  EURUSD: {
    symbol: 'EURUSD',
    price: '1.16285',
    change: '+0.01%',
    changePercent: '+0.01%',
    isUp: true,
    icon: '€',
    iconBg: 'from-blue-500/20 to-cyan-500/20 border-blue-500/40',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    price: '1.35484',
    change: '+3.96%',
    changePercent: '+3.96%',
    isUp: true,
    icon: '£',
    iconBg: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40',
  },
  USDJPY: {
    symbol: 'USDJPY',
    price: '153.507',
    change: '+5.70%',
    changePercent: '+5.70%',
    isUp: true,
    icon: '¥',
    iconBg: 'from-rose-500/20 to-pink-500/20 border-rose-500/40',
  },
  DXY: {
    symbol: 'DXY',
    price: '104.280',
    change: '+0.13%',
    changePercent: '+0.13%',
    isUp: true,
    icon: '$',
    iconBg: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
  },
};

interface DashboardTickerStripProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const DashboardTickerStrip: React.FC<DashboardTickerStripProps> = ({
  activeSymbol,
  onSelectSymbol,
}) => {
  const [tickers, setTickers] = useState<Record<string, TickerData>>(INITIAL_TICKERS);
  const ticks = useMarketTicks();

  useEffect(() => {
    if (!ticks || Object.keys(ticks).length === 0) return;
    setTickers(prev => {
      const next = { ...prev };
      for (const sym of ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'DXY']) {
        if (ticks[sym]) {
          const t = ticks[sym];
          const pct = t.changePct !== undefined ? t.changePct : (t.change ?? 0);
          const isUp = pct >= 0;
          let formattedPrice = t.price.toFixed(sym === 'USDJPY' || sym === 'DXY' ? 3 : (sym === 'XAUUSD' ? 2 : 5));
          if (sym === 'XAUUSD') {
            formattedPrice = t.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          next[sym] = {
            ...prev[sym],
            price: formattedPrice,
            change: `${isUp ? '+' : ''}${pct.toFixed(2)}%`,
            changePercent: `${isUp ? '+' : ''}${pct.toFixed(2)}%`,
            isUp,
          };
        }
      }
      return next;
    });
  }, [ticks]);

  const tickerList = Object.values(tickers);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {tickerList.map(ticker => {
        const isActive = activeSymbol === ticker.symbol;
        return (
          <button
            key={ticker.symbol}
            onClick={() => onSelectSymbol(ticker.symbol)}
            className={`ronas-card p-3 flex items-center gap-3 transition-all text-left group ${
              isActive
                ? 'border-cyan-500/50 shadow-[0_0_18px_rgba(0,240,255,0.12)] ring-1 ring-cyan-400/30'
                : 'hover:border-slate-600'
            }`}
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${ticker.iconBg} border flex items-center justify-center text-sm font-bold shrink-0`}>
              {ticker.icon}
            </div>

            {/* Data */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono font-bold tracking-wider">
                <span>{ticker.symbol}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-sm font-black text-white font-mono tracking-tight">{ticker.price}</div>
              <div className={`text-[10px] font-bold font-mono flex items-center gap-1 ${
                ticker.isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {ticker.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{ticker.changePercent}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  Eye, 
  EyeOff, 
  Plus, 
  Sparkles, 
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { useMarketTicks } from '@/lib/hooks/useMarketData';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';

interface MiniTicker {
  symbol: string;
  name: string;
  defaultPrice: string;
  defaultChange: number;
  baseSparkline: number[];
}

const MINI_TICKERS: MiniTicker[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold / USD',
    defaultPrice: '$4,378.34',
    defaultChange: 0.65,
    baseSparkline: [4350, 4358, 4362, 4360, 4370, 4368, 4375, 4372, 4380, 4378],
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / USD',
    defaultPrice: '$1.14859',
    defaultChange: 0.18,
    baseSparkline: [1.1460, 1.1468, 1.1472, 1.1470, 1.1478, 1.1480, 1.1482, 1.1485, 1.1488, 1.1486],
  },
  {
    symbol: 'GBPUSD',
    name: 'GBP / USD',
    defaultPrice: '$1.33932',
    defaultChange: 0.24,
    baseSparkline: [1.3360, 1.3368, 1.3375, 1.3372, 1.3382, 1.3385, 1.3390, 1.3388, 1.3395, 1.3393],
  },
  {
    symbol: 'USDJPY',
    name: 'USD / JPY',
    defaultPrice: '$156.885',
    defaultChange: -0.15,
    baseSparkline: [157.20, 157.10, 157.05, 156.95, 157.00, 156.90, 156.85, 156.92, 156.88, 156.85],
  },
];

interface RonasPortfolioHeroProps {
  balance: number;
  equity: number;
  todayPnl: number;
  todayPnlPercent: number;
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenDeposit?: () => void;
}

export const RonasPortfolioHero: React.FC<RonasPortfolioHeroProps> = ({
  balance,
  equity,
  todayPnl,
  todayPnlPercent,
  activeSymbol,
  onSelectSymbol,
  onOpenDeposit,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'USDT'>('USD');
  const liveTicks = useMarketTicks();

  const isProfit = todayPnl >= 0;

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-3.5 select-none font-sans">
      {/* 1. Main Portfolio Balance Card (Stealth Black / Graphite Hero Block - 5 cols) */}
      <div className="xl:col-span-5 ronas-card p-5 flex flex-col justify-between relative overflow-hidden bg-[#09090d] border border-white/[0.08] shadow-2xl">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Top Label & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Portfolio Value
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-zinc-400 hover:text-white transition-colors p-0.5"
                title={showBalance ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Currency Pill Switcher */}
            <div className="flex items-center bg-[#050508] p-0.5 rounded-lg border border-white/[0.08] text-[10px] font-mono">
              {(['USD', 'EUR', 'USDT'] as const).map(curr => (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2 py-0.5 rounded transition-all font-bold ${
                    selectedCurrency === curr
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Large Hero Amount */}
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {showBalance ? (
                `$${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                '••••••••••'
              )}
            </h1>
            <span className="text-xs font-bold text-zinc-400 font-mono">
              {selectedCurrency}
            </span>
          </div>

          {/* 24h P&L Badge */}
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                isProfit
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isProfit ? '+' : ''}${todayPnl.toFixed(2)} ({isProfit ? '+' : ''}{todayPnlPercent.toFixed(2)}%)
              </span>
            </div>
            <span className="text-[11px] text-zinc-400">Past 24 Hours</span>
          </div>
        </div>

        {/* Action Buttons (Deposit, Withdraw, Transfer) */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-white/[0.08]">
          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-md shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit</span>
          </button>

          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#14141a] hover:bg-[#1f1f26] border border-white/[0.08] text-zinc-200 hover:text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={onOpenDeposit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#14141a] hover:bg-[#1f1f26] border border-white/[0.08] text-zinc-200 hover:text-white text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Repeat className="w-3.5 h-3.5 text-zinc-400" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* 2. Mini Asset Tickers with Live Real-Time Feeds (7 cols) */}
      <div className="xl:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MINI_TICKERS.map(ticker => {
          const isSelected = activeSymbol.toUpperCase().includes(ticker.symbol.replace('USD', ''));
          const tick = liveTicks[ticker.symbol];
          
          let displayPrice = ticker.defaultPrice;
          let change = ticker.defaultChange;
          
          if (tick?.price) {
            if (ticker.symbol === 'XAUUSD') {
              displayPrice = `$${tick.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else if (ticker.symbol === 'USDJPY') {
              displayPrice = `$${tick.price.toFixed(3)}`;
            } else {
              displayPrice = `$${tick.price.toFixed(5)}`;
            }
            if (tick.change !== undefined) {
              change = Number(tick.change.toFixed(2));
            }
          }

          const isUp = change >= 0;

          // Simple SVG sparkline points
          const baseLine = ticker.baseSparkline;
          const maxVal = Math.max(...baseLine);
          const minVal = Math.min(...baseLine);
          const range = maxVal - minVal || 1;
          const points = baseLine
            .map((val, idx) => {
              const x = (idx / (baseLine.length - 1)) * 90;
              const y = 30 - ((val - minVal) / range) * 25;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div
              key={ticker.symbol}
              onClick={() => onSelectSymbol(ticker.symbol)}
              className={`ronas-card p-3.5 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-white/40 bg-[#14141a] shadow-[0_0_15px_rgba(255,255,255,0.06)] ring-1 ring-white/30'
                  : 'hover:border-zinc-700 bg-[#09090d] border border-zinc-800/80 hover:bg-[#0e0e14]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white tracking-wide">
                    {ticker.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {isUp ? '+' : ''}{change}%
                  </span>
                </div>
                <div className="text-base font-black text-white font-mono mt-1">
                  {displayPrice}
                </div>
              </div>

              {/* Sparkline Canvas */}
              <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                <svg className="w-20 h-7 overflow-visible">
                  <polyline
                    fill="none"
                    stroke={isUp ? '#00e87a' : '#f43f5e'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
                <span className="text-[9px] text-zinc-500 font-mono">Live Feed</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

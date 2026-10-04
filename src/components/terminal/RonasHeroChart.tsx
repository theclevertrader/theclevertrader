'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Maximize2, 
  Activity, 
  Layers, 
  Zap, 
  Coins, 
  Sparkles,
  Compass
} from 'lucide-react';
import { TradingViewWidget } from '@/components/charts/TradingViewWidget';
import { TradingChart } from '@/components/charts/TradingChart';
import { INITIAL_CANDLES_MAP } from '@/lib/data/sample-data';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';

interface RonasHeroChartProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const RonasHeroChart: React.FC<RonasHeroChartProps> = ({
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [chartEngine, setChartEngine] = useState<'TRADINGVIEW' | 'SMC_ALGO'>('TRADINGVIEW');
  const [activeTimeframe, setActiveTimeframe] = useState('15m');

  const supportedSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'DXY', 'NAS100'];
  const symbolKey = supportedSymbols.includes(selectedSymbol) ? selectedSymbol : 'XAUUSD';
  const spec = INSTITUTIONAL_SYMBOLS[symbolKey] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const isUp = (spec.change24h ?? 0) >= 0;

  // Sentiment ratio (Long vs Short)
  const longRatio = symbolKey === 'XAUUSD' ? 68 : symbolKey === 'EURUSD' ? 52 : symbolKey === 'USDJPY' ? 34 : 64;
  const shortRatio = 100 - longRatio;

  const timeframes = ['15m', '1H', '4H', '1D', '1W'];

  return (
    <div className="ronas-card p-4 sm:p-5 flex flex-col justify-between space-y-4 font-sans bg-[#0c101c] border border-white/[0.08] shadow-2xl">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        {/* Left: Asset Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {supportedSymbols.map(sym => {
            const isSelected = sym === symbolKey;
            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 font-black'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-white/[0.04]'
                }`}
              >
                <span>{sym}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Engine Switcher & Timeframes */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/[0.08] text-xs font-mono">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                  activeTimeframe === tf
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Engine Switcher */}
          <div className="flex items-center bg-black/50 p-0.5 rounded-xl border border-white/[0.08] text-xs">
            <button
              onClick={() => setChartEngine('TRADINGVIEW')}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                chartEngine === 'TRADINGVIEW'
                  ? 'bg-white/[0.1] text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pro Chart
            </button>
            <button
              onClick={() => setChartEngine('SMC_ALGO')}
              className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                chartEngine === 'SMC_ALGO'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SMC / Order Blocks
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Price Stats Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-1 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Mark Price</span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono flex items-center gap-2">
              <span>${spec.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {isUp ? '+' : ''}{spec.change24h}%
              </span>
            </div>
          </div>

          <div className="hidden sm:block border-l border-white/[0.08] pl-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">24h High</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              ${spec.high24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="hidden sm:block border-l border-white/[0.08] pl-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">24h Low</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              ${spec.low24h.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="hidden md:block border-l border-white/[0.08] pl-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">24h Vol (USD)</span>
            <span className="text-sm font-bold text-blue-300 font-mono">
              $1.42B
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ● FEED LIVE (0.2ms)
          </span>
        </div>
      </div>

      {/* 3. Main Chart Viewport */}
      <div className="w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#070a12] shadow-2xl">
        {chartEngine === 'TRADINGVIEW' ? (
          <TradingViewWidget 
            symbol={symbolKey} 
            timeframe={activeTimeframe}
            height={580} 
          />
        ) : (
          <TradingChart
            symbol={symbolKey}
            timeframe={activeTimeframe}
            onTimeframeChange={setActiveTimeframe}
            candles={INITIAL_CANDLES_MAP[symbolKey] || INITIAL_CANDLES_MAP['XAUUSD']}
          />
        )}
      </div>

      {/* 4. Long vs Short Position Ratio Bar (Ronas IT Signature Fintech Feature) */}
      <div className="p-3 rounded-xl bg-[#080d16] border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">LONG {longRatio}%</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px]">$42.8M Institutional Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">$20.1M Short Volume</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400 font-bold">SHORT {shortRatio}%</span>
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-rose-500/20 flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${longRatio}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-700"
            style={{ width: `${shortRatio}%` }}
          />
        </div>
      </div>
    </div>
  );
};

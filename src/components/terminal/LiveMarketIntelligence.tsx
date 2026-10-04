'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart2, 
  Layers, 
  Coins, 
  Cpu, 
  Globe2, 
  Sparkles,
  Maximize2,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { TradingViewWidget } from '@/components/charts/TradingViewWidget';
import { TradingChart } from '@/components/charts/TradingChart';
import { INITIAL_CANDLES_MAP } from '@/lib/data/sample-data';

interface AssetIntelProfile {
  symbol: string;
  name: string;
  price: number;
  change: number;
  trend: 'STRONG_BULLISH' | 'BULLISH' | 'RANGING' | 'BEARISH' | 'STRONG_BEARISH';
  marketStructure: string;
  liquidity: string;
  volume: string;
  volatility: string;
  technicalScore: number;
  fundamentalScore: number;
  sentimentScore: number;
  cotScore: number;
  aiScore: number;
  overallConfluence: number;
  verdict: string;
}

const ASSET_PROFILES: Record<string, AssetIntelProfile> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    price: 2652.40,
    change: 0.84,
    trend: 'STRONG_BULLISH',
    marketStructure: 'Bullish MSS + FVG Support 2648.50',
    liquidity: 'Asian SSL Raided at 2640.20; Resting BSL 2664.10',
    volume: '+28% Above 20-Day SMA (Institutional Buying)',
    volatility: 'ATR(14): $18.40 (High Expansion Regime)',
    technicalScore: 86,
    fundamentalScore: 92,
    sentimentScore: 78,
    cotScore: 89,
    aiScore: 94,
    overallConfluence: 88,
    verdict: 'STRONG BUY (Accumulate Pullbacks)',
  },
  EURUSD: {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.08420,
    change: -0.18,
    trend: 'RANGING',
    marketStructure: 'Internal Range Liquidity Consolidating',
    liquidity: 'Equal Lows resting at 1.08200; BSL 1.08750',
    volume: '-12% Below 20-Day SMA (Wait for Catalyst)',
    volatility: 'ATR(14): 48 pips (Compression Zone)',
    technicalScore: 52,
    fundamentalScore: 64,
    sentimentScore: 50,
    cotScore: 68,
    aiScore: 58,
    overallConfluence: 58,
    verdict: 'NEUTRAL (Range-Bound Ahead of ECB)',
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    price: 1.29840,
    change: 0.32,
    trend: 'BULLISH',
    marketStructure: 'Daily Bullish Order Block Bounce at 1.2940',
    liquidity: 'Sell-side swept; liquidity resting at 1.3020',
    volume: '+14% Above 20-Day SMA',
    volatility: 'ATR(14): 62 pips (Moderate Momentum)',
    technicalScore: 74,
    fundamentalScore: 78,
    sentimentScore: 72,
    cotScore: 81,
    aiScore: 76,
    overallConfluence: 76,
    verdict: 'MODERATE BUY (Retest of 1.2960)',
  },
  USDJPY: {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    price: 147.650,
    change: -0.45,
    trend: 'BEARISH',
    marketStructure: 'Bearish Break of Structure (BOS) on 4H',
    liquidity: 'Interbank Intervention liquidity defense 148.20',
    volume: '+22% Above 20-Day SMA',
    volatility: 'ATR(14): 98 pips (Elevated Macro Volatility)',
    technicalScore: 78,
    fundamentalScore: 82,
    sentimentScore: 75,
    cotScore: 84,
    aiScore: 80,
    overallConfluence: 80,
    verdict: 'SELL / SHORT (BoJ Rate Hike Bias)',
  },
  DXY: {
    symbol: 'DXY',
    name: 'US Dollar Index',
    price: 100.85,
    change: -0.22,
    trend: 'BEARISH',
    marketStructure: 'Lower Highs and Lower Lows below 101.20',
    liquidity: 'Sell-side liquidity targeting 100.20 psychological',
    volume: 'Average institutional desk participation',
    volatility: 'ATR(14): 0.42 (Dovish Fed Pricing)',
    technicalScore: 72,
    fundamentalScore: 86,
    sentimentScore: 68,
    cotScore: 75,
    aiScore: 75,
    overallConfluence: 75,
    verdict: 'BEARISH SLIDE (Dollar Easing Active)',
  },
  NAS100: {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    price: 19840.5,
    change: 1.12,
    trend: 'STRONG_BULLISH',
    marketStructure: 'All-Time High Discovery Structure',
    liquidity: 'Short squeeze liquidity pools swept higher',
    volume: '+36% Above Average (Tech Institutional Flow)',
    volatility: 'ATR(14): 240 points (Expansion Mode)',
    technicalScore: 88,
    fundamentalScore: 84,
    sentimentScore: 82,
    cotScore: 86,
    aiScore: 85,
    overallConfluence: 85,
    verdict: 'STRONG BUY (Tech Momentum Expansion)',
  },
};

interface LiveMarketIntelligenceProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const LiveMarketIntelligence: React.FC<LiveMarketIntelligenceProps> = ({
  selectedSymbol,
  onSelectSymbol,
}) => {
  const [chartMode, setChartMode] = useState<'TRADINGVIEW' | 'SMC_ENGINE'>('TRADINGVIEW');
  const allowedSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'DXY', 'NAS100'];
  const currentSymbol = allowedSymbols.includes(selectedSymbol) ? selectedSymbol : 'XAUUSD';
  const profile = ASSET_PROFILES[currentSymbol] || ASSET_PROFILES['XAUUSD'];

  const isPos = profile.change >= 0;

  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header & Asset Switcher Pills */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 4 — Live Market Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-terminal-green text-[10px] font-mono font-bold border border-emerald-500/30">
                REAL-TIME STREAM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              6 Core Institutional Assets • 12 Multi-Dimensional Technical & Fundamental Metrics
            </p>
          </div>
        </div>

        {/* 6 Asset Selector Pills */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/[0.08] overflow-x-auto max-w-full">
          {allowedSymbols.map(sym => {
            const symSpec = INSTITUTIONAL_SYMBOLS[sym];
            const isSelected = sym === currentSymbol;
            const symPos = (symSpec?.change24h ?? 0) >= 0;

            return (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-cyan-glow font-black'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <span>{sym}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-black' : symPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {symPos ? '+' : ''}{symSpec?.change24h ?? 0}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 12 Detailed Real-Time Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {/* 1. Price */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Current Price</div>
          <div className="text-base font-black text-white font-mono">{profile.price.toLocaleString()}</div>
          <div className={`text-[10px] font-mono font-bold flex items-center gap-1 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPos ? '+' : ''}{profile.change}% 24h
          </div>
        </div>

        {/* 2. Trend */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Trend Regime</div>
          <div className="text-xs font-black text-emerald-400 font-mono tracking-tight">{profile.trend}</div>
          <div className="text-[10px] text-slate-400 truncate">Higher Timeframe Aligned</div>
        </div>

        {/* 3. Market Structure */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Market Structure</div>
          <div className="text-xs font-bold text-cyan-300 truncate" title={profile.marketStructure}>
            {profile.marketStructure}
          </div>
          <div className="text-[10px] text-slate-400">ICT Orderblock / FVG</div>
        </div>

        {/* 4. Liquidity */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Liquidity Profile</div>
          <div className="text-xs font-bold text-amber-300 truncate" title={profile.liquidity}>
            {profile.liquidity}
          </div>
          <div className="text-[10px] text-slate-400">Interbank Depth</div>
        </div>

        {/* 5. Volume */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Volume Flow</div>
          <div className="text-xs font-bold text-slate-200 truncate" title={profile.volume}>
            {profile.volume}
          </div>
          <div className="text-[10px] text-emerald-400">Net Delta Positive</div>
        </div>

        {/* 6. Volatility */}
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Volatility / ATR</div>
          <div className="text-xs font-bold text-slate-200 truncate" title={profile.volatility}>
            {profile.volatility}
          </div>
          <div className="text-[10px] text-slate-400">Controlled Risk</div>
        </div>
      </div>

      {/* 6 Score Dimensions & Overall Confluence */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-2.5">
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Technical Score</span>
          <span className="text-sm font-black text-cyan-400 font-mono">{profile.technicalScore}/100</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Fundamental Score</span>
          <span className="text-sm font-black text-emerald-400 font-mono">{profile.fundamentalScore}/100</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Sentiment Score</span>
          <span className="text-sm font-black text-purple-400 font-mono">{profile.sentimentScore}/100</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">COT Score</span>
          <span className="text-sm font-black text-amber-400 font-mono">{profile.cotScore}/100</span>
        </div>
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">AI Score</span>
          <span className="text-sm font-black text-teal-400 font-mono">{profile.aiScore}/100</span>
        </div>
        <div className="col-span-2 sm:col-span-3 xl:col-span-2 p-2.5 rounded-lg bg-gradient-to-r from-cyan-950/40 to-emerald-950/40 border border-cyan-500/30 flex items-center justify-between px-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase block">Overall Confluence</span>
            <span className="text-xs font-black text-white font-mono">{profile.verdict}</span>
          </div>
          <span className="text-xl font-black text-terminal-green font-mono">{profile.overallConfluence}%</span>
        </div>
      </div>

      {/* Embedded Chart Workspace Header & Canvas */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">{currentSymbol} Pro Terminal Chart</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/[0.08] text-slate-400 font-mono">
              M15 / H1 / H4 / D1
            </span>
          </div>

          <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setChartMode('TRADINGVIEW')}
              className={`px-3 py-1 rounded-md font-bold transition-all text-xs ${
                chartMode === 'TRADINGVIEW'
                  ? 'bg-white/[0.1] text-terminal-green border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TradingView Institutional
            </button>
            <button
              onClick={() => setChartMode('SMC_ENGINE')}
              className={`px-3 py-1 rounded-md font-bold transition-all text-xs ${
                chartMode === 'SMC_ENGINE'
                  ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SMC / ICT Overlays
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="w-full rounded-lg overflow-hidden border border-white/[0.06] bg-[#070b12]">
          {chartMode === 'TRADINGVIEW' ? (
            <TradingViewWidget symbol={currentSymbol} height={460} />
          ) : (
            <TradingChart
              symbol={currentSymbol}
              candles={INITIAL_CANDLES_MAP[currentSymbol] || INITIAL_CANDLES_MAP['XAUUSD']}
            />
          )}
        </div>
      </div>
    </section>
  );
};

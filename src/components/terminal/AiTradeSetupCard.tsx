'use client';

import React, { useState } from 'react';
import { 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { RiskRewardLadder } from '@/components/visualizations/RiskRewardLadder';

export interface AiSetupItem {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT' | 'NO_TRADE';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: string;
  confidence: number;
  quality: 'HIGH QUALITY' | 'VALID' | 'NO TRADE';
  technical: number;
  fundamental: number;
  cot: number;
  sentiment: number;
  liquidity: number;
  estimatedRiskUsd: number;
  estimatedRewardUsd: number;
  suggestedLotSize: number;
  reasoning: string[];
  romanUrduNotes: string;
}

const DEFAULT_SETUPS: AiSetupItem[] = [
  {
    id: 'setup-xauusd',
    symbol: 'XAUUSD',
    direction: 'LONG',
    entry: 2650.00,
    sl: 2645.00,
    tp1: 2662.00,
    tp2: 2665.00,
    tp3: 2670.00,
    riskReward: '1:3.0',
    confidence: 89,
    quality: 'HIGH QUALITY',
    technical: 84,
    fundamental: 91,
    cot: 89,
    sentiment: 76,
    liquidity: 86,
    estimatedRiskUsd: 3.00,
    estimatedRewardUsd: 9.00,
    suggestedLotSize: 0.01,
    reasoning: [
      '4H higher-timeframe bullish market structure shift confirmed',
      'Asian session sell-side liquidity swept below 2640.20',
      'Unmitigated 15M Bullish Fair Value Gap (FVG) retest at 2648.50',
      'Non-commercial speculative CFTC COT positioning net long',
    ],
    romanUrduNotes: 'Setup high-quality hai: 2640.20 ka Asian low sweep ho chuka hai, FVG support hold ho rahi hai. Target 2665 hai. SL 2645 par lazmi rakhein.',
  },
  {
    id: 'setup-btcusd',
    symbol: 'BTCUSD',
    direction: 'LONG',
    entry: 63800.0,
    sl: 63200.0,
    tp1: 65000.0,
    tp2: 65600.0,
    tp3: 66500.0,
    riskReward: '1:2.8',
    confidence: 82,
    quality: 'HIGH QUALITY',
    technical: 81,
    fundamental: 85,
    cot: 80,
    sentiment: 78,
    liquidity: 84,
    estimatedRiskUsd: 6.00,
    estimatedRewardUsd: 16.80,
    suggestedLotSize: 0.01,
    reasoning: [
      '1H Order Block demand zone reaction',
      'Exchange reserve outflows intensifying',
      'Breakout above previous week value area high',
    ],
    romanUrduNotes: 'BTC par demand zone se volume expansion mila hai. 63,200 invalidation level hai.',
  },
  {
    id: 'setup-eurusd',
    symbol: 'EURUSD',
    direction: 'NO_TRADE',
    entry: 1.08420,
    sl: 1.08650,
    tp1: 1.08000,
    tp2: 1.07800,
    tp3: 1.07500,
    riskReward: '1:1.8',
    confidence: 48,
    quality: 'NO TRADE',
    technical: 50,
    fundamental: 52,
    cot: 62,
    sentiment: 45,
    liquidity: 40,
    estimatedRiskUsd: 2.30,
    estimatedRewardUsd: 4.14,
    suggestedLotSize: 0.01,
    reasoning: [
      'Composite score 48/100 is below 65 institutional threshold',
      'Market in tight sideways consolidation ahead of ECB rate decision',
      'No clean liquidity sweep identified',
    ],
    romanUrduNotes: 'NO TRADE: ECB meeting se pehle consolidation hai. Capital safeguard karne ke liye entry block ki gayi hai.',
  },
];

interface AiTradeSetupCardProps {
  onExecuteTrade?: (setup: AiSetupItem) => void;
  onSelectSymbol?: (symbol: string) => void;
}

export const AiTradeSetupCard: React.FC<AiTradeSetupCardProps> = ({
  onExecuteTrade,
  onSelectSymbol,
}) => {
  const [selectedSetupId, setSelectedSetupId] = useState<string>('setup-xauusd');
  const [isExecuted, setIsExecuted] = useState(false);

  const activeSetup = DEFAULT_SETUPS.find(s => s.id === selectedSetupId) || DEFAULT_SETUPS[0];
  const isLong = activeSetup.direction === 'LONG';
  const isShort = activeSetup.direction === 'SHORT';
  const isNoTrade = activeSetup.direction === 'NO_TRADE';

  const handleExecute = () => {
    setIsExecuted(true);
    onExecuteTrade?.(activeSetup);
    setTimeout(() => setIsExecuted(false), 3000);
  };

  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 5 — AI Trade Setup
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                1:3 RR ENFORCED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Institutional Order-Execution Parameters with Multi-Pillar Confirmation
            </p>
          </div>
        </div>

        {/* Setup Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/[0.08]">
          {DEFAULT_SETUPS.map(setup => (
            <button
              key={setup.id}
              onClick={() => {
                setSelectedSetupId(setup.id);
                onSelectSymbol?.(setup.symbol);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                selectedSetupId === setup.id
                  ? 'bg-amber-400 text-black shadow-sm font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {setup.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Main Trade Setup Card Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (7 Cols): Execution Ticket & Levels */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-black/50 border border-white/[0.06] space-y-3.5 flex flex-col justify-between">
          <div>
            {/* Asset & Direction Badge */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg font-black text-white font-mono tracking-tight">{activeSetup.symbol}</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-black tracking-wider flex items-center gap-1 ${
                  isLong
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isShort
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {isLong && <TrendingUp className="w-3.5 h-3.5" />}
                  {isShort && <TrendingDown className="w-3.5 h-3.5" />}
                  {activeSetup.direction}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                  {activeSetup.quality}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">Risk/Reward:</span>
                <span className="text-xs font-mono font-black text-amber-300">{activeSetup.riskReward}</span>
              </div>
            </div>

            {/* Price Levels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-xs font-mono">
              <div className="p-2 rounded bg-black/60 border border-white/[0.06]">
                <span className="text-[10px] text-slate-400 block font-sans">Entry:</span>
                <span className="font-bold text-white text-xs sm:text-sm">{activeSetup.entry.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block font-sans">Stop Loss:</span>
                <span className="font-bold text-rose-300 text-xs sm:text-sm">{activeSetup.sl.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block font-sans">TP1:</span>
                <span className="font-bold text-emerald-300 text-xs sm:text-sm">{activeSetup.tp1.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded bg-emerald-950/30 border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 block font-sans">TP2:</span>
                <span className="font-bold text-emerald-300 text-xs sm:text-sm">{activeSetup.tp2.toLocaleString()}</span>
              </div>

              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/50">
                <span className="text-[10px] text-cyan-300 block font-sans">TP3:</span>
                <span className="font-bold text-cyan-300 text-xs sm:text-sm">{activeSetup.tp3.toLocaleString()}</span>
              </div>
            </div>

            {/* Reasoning Points */}
            <div className="pt-3 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Confluence Catalysts:
              </span>
              <div className="space-y-1">
                {activeSetup.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-slate-400">
              Risk: <span className="text-rose-400 font-bold">${activeSetup.estimatedRiskUsd.toFixed(2)}</span> | Target: <span className="text-emerald-400 font-bold">${activeSetup.estimatedRewardUsd.toFixed(2)}</span>
            </div>

            <button
              onClick={handleExecute}
              disabled={isNoTrade || isExecuted}
              className={`px-4 py-2 rounded-lg font-mono font-bold text-xs transition-all flex items-center gap-2 ${
                isNoTrade
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : isExecuted
                  ? 'bg-emerald-500 text-black shadow-green-glow font-black'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isExecuted ? 'EXECUTED (0.01 LOT)' : isNoTrade ? 'TRADE LOCKED' : 'EXECUTE PAPER SETUP'}</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 Cols): 5 Pillar Scores & Visual Ladder */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Multi-Pillar Verification Breakdown:
            </span>

            {/* Pillar Scores Grid */}
            <div className="space-y-1.5 text-xs font-mono">
              {[
                { label: 'Technical Score', val: activeSetup.technical },
                { label: 'Fundamental Score', val: activeSetup.fundamental },
                { label: 'COT Institutional Score', val: activeSetup.cot },
                { label: 'Sentiment Score', val: activeSetup.sentiment },
                { label: 'Liquidity Structure Score', val: activeSetup.liquidity },
              ].map(p => (
                <div key={p.label} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{p.label}:</span>
                    <span className="font-bold text-white">{p.val}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${p.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Confidence Pill */}
            <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06] flex items-center justify-between mt-2 text-xs font-mono">
              <span className="text-slate-400">Total Setup Confidence:</span>
              <span className="text-base font-black text-amber-300">{activeSetup.confidence}%</span>
            </div>
          </div>

          {/* Roman Urdu Assistant Note */}
          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-slate-300 font-sans">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block mb-0.5">
              💡 NEXUS AI Advice:
            </span>
            <p className="leading-relaxed">
              {activeSetup.romanUrduNotes}
            </p>
          </div>
        </div>

      </div>

      {/* Mandatory Institutional Disclaimer */}
      <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.08] flex items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300 font-semibold">
            AI-generated analysis — not financial advice.
          </span>
          <span className="hidden md:inline text-slate-500">
            Strict risk allocation of 0.01 lot per $500 balance enforced. Never risk capital without verified stop loss.
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold shrink-0">
          PROTECTION ACTIVE
        </span>
      </div>
    </section>
  );
};

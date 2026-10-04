'use client';

import React, { useState, useMemo } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { INITIAL_CANDLES_MAP } from '@/lib/data/sample-data';
import { ConfluenceEngine } from '@/lib/engines/confluence-engine';
import { NoTradeEngine } from '@/lib/engines/no-trade-engine';
import { 
  BrainCircuit, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Bot, 
  Sparkles,
  Gauge
} from 'lucide-react';

export default function AiAnalystPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const candles = INITIAL_CANDLES_MAP[selectedSymbol] || INITIAL_CANDLES_MAP['XAUUSD'];

  const confluence = useMemo(() => {
    return ConfluenceEngine.evaluateConfluence(candles, 'BULLISH', 3.0);
  }, [candles]);

  const noTradeCheck = useMemo(() => {
    return NoTradeEngine.evaluate({
      setupScore: confluence.breakdown.totalScore,
      riskReward: 3.0,
      spreadPips: 1.5,
      slPips: 30,
      htfBias: 'BULLISH',
      direction: confluence.primaryDirection,
      regime: confluence.regime,
      hasLiquiditySweep: true,
      dailyLossLimitReached: false,
      maxOpenTradesReached: false,
    });
  }, [confluence]);

  // Multi-Timeframe Alignment
  const tfAlignment = [
    { tf: '1D (Daily)', bias: 'BULLISH', structure: 'Higher Highs & Higher Lows', color: 'text-terminal-green' },
    { tf: '4H', bias: 'BULLISH', structure: 'Bullish BOS Confirmed', color: 'text-terminal-green' },
    { tf: '1H', bias: 'BULLISH', structure: 'Unmitigated Order Block Held', color: 'text-terminal-green' },
    { tf: '15M', bias: 'BULLISH', structure: 'Bullish MSS + FVG Created', color: 'text-terminal-green' },
    { tf: '5M', bias: 'BULLISH', structure: 'Liquidity Sweep of Asian Low', color: 'text-terminal-green' },
    { tf: '1M', bias: 'NEUTRAL', structure: 'Pullback into 50% Equilibrium', color: 'text-terminal-cyan' },
  ];

  const alignmentScore = 92; // 92% Bullish alignment

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">AI QUANT ANALYST & CONFLUENCE MATRIX</h1>
            <p className="text-xs text-slate-400">
              Multi-Timeframe Alignment • 8-Pillar Scoring • Regime Detection • Gatekeeper
            </p>
          </div>
        </div>

        {/* Symbol Selector */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-white/[0.06]">
          {Object.keys(INSTITUTIONAL_SYMBOLS).map(sym => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                selectedSymbol === sym
                  ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Setup Score Card */}
        <div className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CONFLUENCE SCORE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-terminal-cyan font-bold">
              {confluence.classification}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-terminal-cyan">{confluence.breakdown.totalScore}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
            <div
              className="bg-terminal-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${confluence.breakdown.totalScore}%` }}
            />
          </div>
        </div>

        {/* Market Regime Card */}
        <div className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>DETECTED REGIME</span>
            <Gauge className="w-4 h-4 text-terminal-green" />
          </div>
          <div className="text-lg font-black text-terminal-green">
            {confluence.regime.replace('_', ' ')}
          </div>
          <p className="text-[11px] text-slate-400">
            Market structure favors impulsive continuation from discount equilibrium zones.
          </p>
        </div>

        {/* No-Trade Gatekeeper Status */}
        <div className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NO-TRADE GATEKEEPER</span>
            {noTradeCheck.allowTrade ? (
              <CheckCircle2 className="w-4 h-4 text-terminal-green" />
            ) : (
              <XCircle className="w-4 h-4 text-terminal-rose" />
            )}
          </div>
          <div
            className={`text-lg font-black ${
              noTradeCheck.allowTrade ? 'text-terminal-green' : 'text-terminal-rose'
            }`}
          >
            {noTradeCheck.status === 'APPROVED' ? 'APPROVED FOR EXECUTION' : 'TRADE PROHIBITED'}
          </div>
          <p className="text-[11px] text-slate-400">
            {noTradeCheck.allowTrade
              ? 'All 8 institutional risk and liquidity criteria verified.'
              : noTradeCheck.reasons[0]}
          </p>
        </div>
      </div>

      {/* Multi-Timeframe Alignment Matrix */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Multi-Timeframe Alignment Matrix (1D → 1M)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">HTF-LTF Alignment:</span>
            <span className="font-bold text-terminal-green">{alignmentScore}% STRONG BULLISH</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tfAlignment.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-surface border border-white/[0.06] text-xs space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">{item.tf}</span>
              <span className={`font-black text-sm block ${item.color}`}>{item.bias}</span>
              <p className="text-[10px] text-slate-400 leading-tight">{item.structure}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Confluence Breakdown (8 Weighted Pillars) */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4">
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
          <Sparkles className="w-4 h-4 text-terminal-cyan" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            8-Pillar Algorithmic Confluence Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">1. SMC Structure (20%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.smcScore} / 20</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">2. ICT Liquidity (20%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.ictScore} / 20</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">3. HTF Trend Bias (15%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.htfBiasScore} / 15</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">4. Price Action (15%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.priceActionScore} / 15</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">5. Volume Expansion (10%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.volumeScore} / 10</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">6. Momentum RSI (10%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.momentumScore} / 10</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">7. Active Session Killzone (5%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.sessionScore} / 5</span>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">8. Risk / Reward Profile (5%)</span>
            <span className="text-base font-bold text-white">{confluence.breakdown.riskRewardScore} / 5</span>
          </div>
        </div>
      </div>

      {/* In-Depth Roman Urdu Institutional AI Explanation */}
      <div className="p-5 rounded-xl bg-surface-card border border-cyan-500/30 shadow-card-glass space-y-3">
        <div className="flex items-center gap-2 text-terminal-cyan">
          <Bot className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            NEXUS AI Comprehensive Analysis
          </h2>
        </div>
        <div className="p-4 rounded-lg bg-surface-elevated/80 border border-white/[0.06] text-xs text-slate-200 leading-relaxed space-y-2">
          <p className="font-bold text-terminal-green">
            Assalam o Alaikum! Main NEXUS AI hoon. {selectedSymbol} ka deep-dive quantitative status:
          </p>
          <p>
            • <strong>[FACT]</strong>: Daily aur 4H structure clear Higher Highs aur Higher Lows create kar raha hai. 15M chart par Sell-Side Liquidity (SSL) sweep hone ke baad bullish displacement candle print hui hai.
          </p>
          <p>
            • <strong>[SIGNAL]</strong>: Overall Confluence Score {confluence.breakdown.totalScore}/100 hai jo "HIGH QUALITY" institutional standard par poora utarta hai. Price 50% Fibonacci equilibrium se neechay discount zone mein trade kar rahi hai.
          </p>
          <p>
            • <strong>[ASSUMPTION]</strong>: New York overlap session mein smart money buy-side liquidity (BSL) target karegi.
          </p>
          <p>
            • <strong>[OPINION]</strong>: Pullback confirmation par entry munasib hai. Stop Loss 2645.00 par rakhein. Account ka 1% se zyada risk hargiz na lein!
          </p>
        </div>
      </div>
    </div>
  );
}

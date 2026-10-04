'use client';

import React from 'react';
import { TradeSetup } from '@/lib/types/trading';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ShieldAlert,
  Bot
} from 'lucide-react';

interface SetupCardProps {
  setup: TradeSetup;
  onTradeSetup?: (setup: TradeSetup) => void;
}

export const SetupCard: React.FC<SetupCardProps> = ({ setup, onTradeSetup }) => {
  const isBuy = setup.direction === 'BUY';
  const isNoTrade = setup.direction === 'NO_TRADE';

  const scoreColor =
    setup.setupScore >= 85
      ? 'text-terminal-green border-green-500/40 bg-green-500/10'
      : setup.setupScore >= 75
      ? 'text-terminal-cyan border-cyan-500/40 bg-cyan-500/10'
      : setup.setupScore >= 65
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-rose-400 border-rose-500/40 bg-rose-500/10';

  return (
    <div className="bg-surface-card border border-terminal-border hover:border-terminal-borderGlow rounded-xl p-4 shadow-card-glass font-mono flex flex-col justify-between transition-all group">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide">{setup.symbol}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                {setup.timeframe}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  isBuy
                    ? 'bg-green-500/20 text-terminal-green border border-green-500/40'
                    : isNoTrade
                    ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                    : 'bg-rose-500/20 text-terminal-rose border border-rose-500/40'
                }`}
              >
                {isBuy ? <TrendingUp className="w-3 h-3" /> : isNoTrade ? null : <TrendingDown className="w-3 h-3" />}
                <span>{setup.direction}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span>HTF: <strong className="text-white">{setup.htfBias}</strong></span>
              <span>•</span>
              <span className="text-terminal-cyan">{setup.regime.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Setup Score Meter */}
          <div className="flex flex-col items-end">
            <div className={`px-2.5 py-1 rounded-lg border text-xs font-black tracking-wider ${scoreColor}`}>
              SCORE {setup.setupScore}/100
            </div>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
              {setup.classification}
            </span>
          </div>
        </div>

        {/* Execution Levels Matrix */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface border border-white/[0.04] text-[11px] mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block">Entry</span>
            <span className="text-white font-bold">{setup.entryPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-400 block">Stop Loss</span>
            <span className="text-rose-400 font-bold">{setup.stopLoss.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 block">TP1 / TP2</span>
            <span className="text-emerald-400 font-bold">
              {setup.takeProfit1.toFixed(2)} / {setup.takeProfit2.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Target Risk / Reward & Micro Scalp Template Details */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
          <span>Config Target: <strong className="text-rose-400">${setup.estimatedRiskUsd}</strong> / <strong className="text-emerald-400">${setup.estimatedRewardUsd}</strong></span>
          <span>R:R: <strong className="text-terminal-cyan">1 : {setup.riskReward}</strong></span>
          <span>Lot: <strong className="text-white">{setup.suggestedLotSize}</strong></span>
        </div>

        {/* Invalidation Level */}
        <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 mb-3">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            <strong>Invalidation: </strong>
            <span>{setup.invalidation}</span>
          </div>
        </div>

        {/* Key Confluence Reasons */}
        <div className="space-y-1 mb-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Confirmations:</span>
          {setup.reasons.slice(0, 4).map((r, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <CheckCircle2 className="w-3 h-3 text-terminal-green shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* ROMAN URDU AI EXPLANATION */}
        <div className="p-3 rounded-lg bg-surface-elevated/90 border border-cyan-500/20 text-[11px] leading-relaxed text-slate-200">
          <div className="flex items-center gap-1.5 text-terminal-cyan font-bold text-[10px] mb-1">
            <Bot className="w-3.5 h-3.5 text-terminal-cyan" />
            <span>NEXUS AI EXPLANATION (ROMAN URDU):</span>
          </div>
          <p className="italic text-slate-300">{setup.romanUrduExplanation}</p>
        </div>
      </div>

      {/* Action Button */}
      {onTradeSetup && !isNoTrade && (
        <button
          onClick={() => onTradeSetup(setup)}
          className="mt-4 w-full py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/40 text-terminal-cyan text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)] flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>LOAD SETUP INTO ORDER TICKET</span>
        </button>
      )}
    </div>
  );
};

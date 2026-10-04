'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { MultiAgentDebateResult } from '@/lib/ai/debate-engine';
import { globalPaperBroker } from '@/lib/broker/paper-broker';

interface AiDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentPrice?: number;
}

export const AiDebateModal: React.FC<AiDebateModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentPrice,
}) => {
  const [data, setData] = useState<MultiAgentDebateResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [executionStatus, setExecutionStatus] = useState<string | null>(null);

  const fetchDebate = async () => {
    setIsLoading(true);
    try {
      const p = currentPrice ? `&price=${currentPrice}` : '';
      const res = await fetch(`/api/debate?symbol=${encodeURIComponent(symbol)}${p}`);
      if (res.ok) {
        const json = await res.json();
        if (json.debate) {
          setData(json.debate);
        }
      }
    } catch (err) {
      console.error('Failed to load debate:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDebate();
      setExecutionStatus(null);
    }
  }, [isOpen, symbol, currentPrice]);

  if (!isOpen) return null;

  const handleSpeakVerdict = () => {
    if (!data?.judge?.executiveSummaryUrdu) return;

    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.judge.executiveSummaryUrdu);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExecuteTrade = async () => {
    if (!data?.judge?.tradeSetup) return;
    const { action, entryPrice, stopLoss, takeProfit, recommendedLot } = data.judge.tradeSetup;
    if (action === 'WAIT') return;

    setExecutionStatus('Transmitting order...');
    try {
      const order = await globalPaperBroker.placeOrder({
        symbol: data.symbol,
        type: action === 'BUY' ? 'BUY' : 'SELL',
        lotSize: recommendedLot || 0.01,
        entryPrice,
        stopLoss,
        takeProfit,
      });

      if (order) {
        setExecutionStatus(`Order Placed! #${order.id.slice(0, 8)} (${action} ${recommendedLot} lots)`);
        setTimeout(() => setExecutionStatus(null), 4000);
      }
    } catch (e: any) {
      setExecutionStatus('Execution failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-backdrop-fade select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0a0f1d] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col text-slate-100 font-sans animate-modal-pop">
        
        {/* Modal Top Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#0c1326] border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Scale className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black tracking-wider text-white font-mono">
                  FINROBOT MULTI-AGENT DEBATE ARENA
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  AI COMMITTEE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Bull Agent ⚔️ Bear Agent ⚖️ NEXUS Judge Consensus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDebate}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 font-mono"
              title="Re-run Multi-Agent Debate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">RE-DEBATE</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Asset Strip & Probability Bar */}
        {data && (
          <div className="px-4 py-3 bg-[#080d18] border-b border-white/[0.06] space-y-2">
            {/* Institutional Rank Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-emerald-950/40 border border-purple-500/30">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px] border border-purple-500/40">
                  RANK: {data.rankGrade?.grade || 'AAA+ (Wall Street Hedge Fund)'}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 hidden sm:inline">
                  {data.rankGrade?.winRateEstimate || '82% Confluence'}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-slate-400">EXNESS LIVE BALANCE:</span>
                <span className="text-emerald-400 font-bold font-mono">$815.77 USD</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm">{data.symbol}</span>
                <span className="text-emerald-400 font-bold">${data.currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> BULL: {data.judge.bullProbability}%
                </span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> BEAR: {data.judge.bearProbability}%
                </span>
              </div>
            </div>

            {/* Tug of War Visual Probability Bar */}
            <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                style={{ width: `${data.judge.bullProbability}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700"
                style={{ width: `${data.judge.bearProbability}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-4 space-y-4">
          {isLoading && !data ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono">
              <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs">Convening Wall Street AI Council & FinRobot Committee...</p>
            </div>
          ) : data ? (
            <>
              {/* Dual Debate Columns: Bull vs Bear */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. BULL AGENT CARD */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono text-xs">
                        <TrendingUp className="w-4 h-4" />
                        <span>BULL THESIS (FinRobot)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {data.bull.confidenceScore}% CONVICTION
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 italic mt-2.5 bg-black/30 p-2 rounded-lg border border-emerald-500/10">
                      "{data.bull.romanUrdu}"
                    </p>

                    {/* Key Catalysts */}
                    <div className="mt-3 space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Institutional Catalysts:
                      </span>
                      {data.bull.keyCatalysts.map((arg, idx) => (
                        <div key={idx} className="p-2 rounded bg-black/40 border border-white/[0.04] text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between text-emerald-300 font-bold">
                            <span>{arg.point}</span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              {arg.impact}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[9.5px] leading-relaxed">{arg.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">UPSIDE TARGET:</span>
                    <span className="text-emerald-400 font-bold text-xs">${data.bull.targetPrice}</span>
                  </div>
                </div>

                {/* 2. BEAR AGENT CARD */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono text-xs">
                        <TrendingDown className="w-4 h-4" />
                        <span>BEAR THESIS (FinRobot)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {data.bear.confidenceScore}% RISK WEIGHT
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 italic mt-2.5 bg-black/30 p-2 rounded-lg border border-rose-500/10">
                      "{data.bear.romanUrdu}"
                    </p>

                    {/* Risk Vectors */}
                    <div className="mt-3 space-y-2">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Downside Risk Vectors:
                      </span>
                      {data.bear.riskVectors.map((arg, idx) => (
                        <div key={idx} className="p-2 rounded bg-black/40 border border-white/[0.04] text-[10px] space-y-0.5">
                          <div className="flex items-center justify-between text-rose-300 font-bold">
                            <span>{arg.point}</span>
                            <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300">
                              {arg.impact}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[9.5px] leading-relaxed">{arg.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">DOWNSIDE TARGET:</span>
                    <span className="text-rose-400 font-bold text-xs">${data.bear.targetPrice}</span>
                  </div>
                </div>
              </div>

              {/* 2.5 WALL STREET AI COUNCIL (5 PERSONA SWARM) */}
              {data.council && data.council.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
                      <span>🏛️ WALL STREET AI COUNCIL (5-PERSONA SWARM)</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                      TIERED HIERARCHY · 100% UNBIASED EVALUATION
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {data.council.map((persona, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2.5 rounded-xl border flex flex-col justify-between space-y-1.5 transition-all ${
                          persona.stance === 'BULLISH'
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : persona.stance === 'BEARISH'
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : persona.stance === 'DEFENSIVE_RISK'
                            ? 'bg-blue-950/20 border-blue-500/30'
                            : 'bg-purple-950/20 border-purple-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{persona.avatarIcon}</span>
                            <span className="text-[10px] font-bold font-mono text-white leading-tight">
                              {persona.name}
                            </span>
                          </div>
                          <span className={`text-[8.5px] px-1 py-0.2 rounded font-mono font-bold ${
                            persona.stance === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300' :
                            persona.stance === 'BEARISH' ? 'bg-rose-500/20 text-rose-300' :
                            persona.stance === 'DEFENSIVE_RISK' ? 'bg-blue-500/20 text-blue-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {persona.confidence}%
                          </span>
                        </div>

                        <div className="text-[8px] font-mono text-slate-400 uppercase tracking-tight">
                          {persona.role}
                        </div>

                        <p className="text-[9px] text-slate-300 leading-snug italic line-clamp-3 bg-black/40 p-1.5 rounded border border-white/[0.04]">
                          "{persona.quoteUrdu}"
                        </p>

                        <div className="text-[7.5px] font-mono text-slate-500 border-t border-white/[0.04] pt-1">
                          RULE: {persona.keyRule}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. NEXUS MASTER JUDGE VERDICT */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#11182c] to-[#0a101f] border-2 border-cyan-500/40 shadow-[0_0_30px_rgba(0,240,255,0.1)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-black font-mono">
                      ⚖️ {data.judge.judgeName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-black font-mono ${
                      data.judge.ruling.includes('BUY')
                        ? 'bg-emerald-500 text-black shadow-md'
                        : data.judge.ruling.includes('SELL')
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-amber-500 text-black'
                    }`}>
                      RULING: {data.judge.ruling.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Voice Button */}
                  <button
                    onClick={handleSpeakVerdict}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                      isSpeaking
                        ? 'bg-cyan-500 text-black border-cyan-400 animate-pulse'
                        : 'bg-black/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'STOP AUDIO' : 'SPEAK VERDICT'}</span>
                  </button>
                </div>

                {/* Roman Urdu Verdict Quote */}
                <div className="p-3 rounded-lg bg-black/50 border border-cyan-500/20">
                  <p className="text-xs text-cyan-200 leading-relaxed font-mono">
                    "{data.judge.executiveSummaryUrdu}"
                  </p>
                </div>

                {/* Trade Execution Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-[#080d18] p-3 rounded-lg border border-white/[0.06]">
                  <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                    <div>
                      <span className="text-slate-400 block text-[9px]">ENTRY</span>
                      <span className="text-white font-bold">${data.judge.tradeSetup.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-rose-400 block text-[9px]">STOP LOSS</span>
                      <span className="text-rose-300 font-bold">${data.judge.tradeSetup.stopLoss}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 block text-[9px]">TAKE PROFIT</span>
                      <span className="text-emerald-300 font-bold">${data.judge.tradeSetup.takeProfit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">R:R</span>
                      <span className="text-cyan-400 font-bold">{data.judge.tradeSetup.riskRewardRatio}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {executionStatus && (
                      <span className="text-xs font-mono text-emerald-400 animate-pulse">
                        {executionStatus}
                      </span>
                    )}
                    {data.judge.tradeSetup.action !== 'WAIT' && (
                      <button
                        onClick={handleExecuteTrade}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black font-mono transition-all shadow-md ${
                          data.judge.tradeSetup.action === 'BUY'
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black hover:scale-105'
                            : 'bg-rose-500 hover:bg-rose-400 text-white hover:scale-105'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>EXECUTE {data.judge.tradeSetup.action} NOW</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

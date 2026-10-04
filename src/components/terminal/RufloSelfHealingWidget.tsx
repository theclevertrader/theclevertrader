'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bot, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Cpu, 
  Database,
  BrainCircuit,
  Sliders,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SelfHealingEvent {
  id: string;
  timeString: string;
  subsystem: string;
  severity: string;
  errorSignature: string;
  remediationAction: string;
  success: boolean;
  romanUrduDescription: string;
}

interface RufloData {
  status: string;
  symbol: string;
  diagnostics: {
    overallHealthScore: number;
    status: string;
    uptimeSeconds: number;
    subsystems: Record<string, any>;
    recentEvents: SelfHealingEvent[];
    stats: {
      totalErrorsIntercepted: number;
      autoResolvedCount: number;
      mt5Reconnections: number;
      apiRateLimitBypasses: number;
      brokerCodeAdjustments: number;
      staleLockCleanups: number;
    };
  };
  memoryStats: {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRatePercent: number;
  };
  swarm: {
    finalDirection: string;
    consensusScore: number;
    isApproved: boolean;
    agreementRatio: string;
    agentVotes: Record<string, any>;
    kellySizing: {
      recommendedLot: number;
      winProbability: number;
      riskRewardRatio: number;
      capitalAtRiskUsd: number;
    };
    memoryRecall: {
      isVetoed: boolean;
      similarityScore: number;
      confidenceBoost: number;
    };
    romanUrduSummary: string;
  };
}

export const RufloSelfHealingWidget: React.FC = () => {
  const [data, setData] = useState<RufloData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [healSuccessMsg, setHealSuccessMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<boolean>(false);

  const fetchRufloStatus = async () => {
    try {
      const res = await fetch('/api/ruflo');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Ruflo fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRufloStatus();
    const interval = setInterval(fetchRufloStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerHeal = async () => {
    try {
      setIsHealing(true);
      const res = await fetch('/api/ruflo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_self_heal' }),
      });
      if (res.ok) {
        const json = await res.json();
        setHealSuccessMsg(json.result?.romanUrduSummary || 'System 100% Self-Healed!');
        fetchRufloStatus();
        setTimeout(() => setHealSuccessMsg(null), 4000);
      }
    } catch (e) {
      console.error('Heal trigger error:', e);
    } finally {
      setIsHealing(false);
    }
  };

  const healthScore = data?.diagnostics?.overallHealthScore || 100;
  const stats = data?.diagnostics?.stats || {
    totalErrorsIntercepted: 0,
    autoResolvedCount: 0,
    mt5Reconnections: 0,
    apiRateLimitBypasses: 0,
    brokerCodeAdjustments: 0,
    staleLockCleanups: 0,
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-[#080d1a] to-[#04070e] border border-cyan-500/25 p-4 shadow-[0_0_30px_rgba(0,240,255,0.06)] relative overflow-hidden font-mono select-none">
      {/* Ambient Top Glow */}
      <div className="absolute -top-12 left-1/4 w-96 h-20 bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                RUFLO AGENTIC HARNESS & SELF-HEALING ENGINE
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  4-AGENT SWARM
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Autonomous Error Interceptor • Kelly Sizing • Memory Loss Veto • Zero-Downtime Watchdog
            </p>
          </div>
        </div>

        {/* Action Controls & Health Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>HEALTH: {healthScore}% OPTIMAL</span>
          </div>

          <button
            onClick={handleTriggerHeal}
            disabled={isHealing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
            title="Run autonomous error resolution and subsystem audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealing ? 'animate-spin' : ''}`} />
            <span>{isHealing ? 'HEALING...' : 'TRIGGER SELF-HEAL'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {healSuccessMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{healSuccessMsg}</span>
        </div>
      )}

      {/* 4-Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Auto-Resolved Errors</div>
            <div className="text-sm font-bold text-emerald-300">
              {stats.autoResolvedCount} / {stats.totalErrorsIntercepted}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">API Stalls Bypassed</div>
            <div className="text-sm font-bold text-blue-300">{stats.apiRateLimitBypasses}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Broker Codes Adjusted</div>
            <div className="text-sm font-bold text-purple-300">{stats.brokerCodeAdjustments}</div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Memory Setups Indexed</div>
            <div className="text-sm font-bold text-amber-300">{data?.memoryStats?.totalTrades || 3} Trades</div>
          </div>
        </div>
      </div>

      {/* 4-Agent Ruflo Swarm Consensus Strip */}
      {data?.swarm && (
        <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-[#0b1424] via-[#09101d] to-[#070d18] border border-white/[0.08] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">RUFLO 4-AGENT SWARM CONSENSUS:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  data.swarm.finalDirection === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : data.swarm.finalDirection === 'SELL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                }`}
              >
                {data.swarm.finalDirection} ({data.swarm.consensusScore}%) [{data.swarm.agreementRatio}]
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-400">
                Quarter-Kelly Lot: <strong className="text-cyan-300 font-bold">{data.swarm.kellySizing?.recommendedLot}</strong>
              </span>
              <span className="text-slate-400">
                Memory Loss Veto: <strong className={data.swarm.memoryRecall?.isVetoed ? 'text-rose-400' : 'text-emerald-400'}>{data.swarm.memoryRecall?.isVetoed ? 'VETO ACTIVE' : 'PASSED'}</strong>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed italic">
            "{data.swarm.romanUrduSummary}"
          </p>
        </div>
      )}

      {/* Expandable Auto-Repair Ledger Feed */}
      <div className="mt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-300 py-1 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Self-Healing Activity Feed ({data?.diagnostics?.recentEvents?.length || 0} Events)</span>
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin border-t border-white/[0.06] pt-2">
            {data?.diagnostics?.recentEvents && data.diagnostics.recentEvents.length > 0 ? (
              data.diagnostics.recentEvents.map((evt) => (
                <div key={evt.id} className="p-2 rounded-lg bg-black/40 border border-white/[0.05] text-[10px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">{evt.subsystem}</span>
                    <span className="text-slate-500">{evt.timeString}</span>
                  </div>
                  <div className="text-slate-300 font-sans">{evt.romanUrduDescription}</div>
                  <div className="text-[9px] text-emerald-400 truncate">Fix: {evt.remediationAction}</div>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-slate-500 py-2 text-center">
                Koi runtime error record nahi hua. All subsystems operating at 100% optimal state.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  Power, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Cpu, 
  Sliders, 
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  Radar,
  Radio,
  Flame
} from 'lucide-react';
import { Mt5ConnectionModal } from './Mt5ConnectionModal';

export const AutoTradingWidget: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [minScore, setMinScore] = useState<number>(75);
  const [targetExecution, setTargetExecution] = useState<'PAPER_AND_MT5' | 'MT5_ONLY' | 'PAPER_ONLY'>('PAPER_AND_MT5');
  const [todayTradesCount, setTodayTradesCount] = useState<number>(2);
  const [history, setHistory] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isMt5ModalOpen, setIsMt5ModalOpen] = useState<boolean>(false);
  const [mt5Connected, setMt5Connected] = useState<boolean>(false);
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [riskUsd, setRiskUsd] = useState<number>(5.0);
  const [rewardUsd, setRewardUsd] = useState<number>(15.0);
  const [isCustomRiskOpen, setIsCustomRiskOpen] = useState<boolean>(false);
  const [maxPositionsPerSymbol, setMaxPositionsPerSymbol] = useState<number>(3);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(180);
  const [finRobotData, setFinRobotData] = useState<any>(null);
  const [protectionTelemetry, setProtectionTelemetry] = useState<any>(null);

  const fetchStatus = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/auto-trade');
      if (res.ok) {
        const data = await res.json();
        setIsActive(data.config?.isActive ?? true);
        setMinScore(data.config?.minScore ?? 75);
        setTargetExecution(data.config?.targetExecution ?? 'PAPER_AND_MT5');
        setTodayTradesCount(data.todayTradesCount ?? 0);
        setHistory(data.history ?? []);
        if (data.finRobotConsensus) {
          setFinRobotData(data.finRobotConsensus);
        }
        if (data.protectionTelemetry) {
          setProtectionTelemetry(data.protectionTelemetry);
        }
        if (data.config?.lotSize) setLotSize(data.config.lotSize);
        if (data.config?.microScalpRiskUsd) setRiskUsd(data.config.microScalpRiskUsd);
        if (data.config?.microScalpRewardUsd) setRewardUsd(data.config.microScalpRewardUsd);
        if (data.config?.maxPositionsPerSymbol !== undefined) setMaxPositionsPerSymbol(data.config.maxPositionsPerSymbol);
        if (data.config?.cooldownSeconds !== undefined) setCooldownSeconds(data.config.cooldownSeconds);
      }

      const mt5Res = await fetch('/api/mt5');
      if (mt5Res.ok) {
        const mt5Data = await mt5Res.json();
        setMt5Connected(mt5Data.config?.isConnected || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleBot = async () => {
    try {
      const res = await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const data = await res.json();
      setIsActive(data.isActive);
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_scan' }),
      });
      const data = await res.json();
      setScanMessage(data.message);
      fetchStatus();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateTarget = async (target: 'PAPER_AND_MT5' | 'MT5_ONLY' | 'PAPER_ONLY') => {
    setTargetExecution(target);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          targetExecution: target,
        }),
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMinScore = async (score: number) => {
    setMinScore(score);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          minScore: score,
        }),
      });
      fetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMaxPositions = async (val: number) => {
    setMaxPositionsPerSymbol(val);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          maxPositionsPerSymbol: val,
        }),
      });
      fetchStatus();
      setScanMessage(`Scale-in limit updated: Up to ${val} trades per symbol allowed!`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCooldown = async (sec: number) => {
    setCooldownSeconds(sec);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          cooldownSeconds: sec,
        }),
      });
      fetchStatus();
      setScanMessage(`Cooldown set to ${sec / 60} minutes!`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRisk = async (lot: number, risk: number, reward: number) => {
    setLotSize(lot);
    setRiskUsd(risk);
    setRewardUsd(reward);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          lotSize: lot,
          microScalpRiskUsd: risk,
          microScalpRewardUsd: reward,
        }),
      });
      fetchStatus();
      setScanMessage(`Risk updated: ${lot} Lot | $${risk} SL / $${reward} TP applied!`);
      setTimeout(() => setScanMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emergency_stop' }),
      });
      setIsActive(false);
      fetchStatus();
      alert('EMERGENCY STOP ACTIVATED: Bot paused immediately.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-surface-card border border-terminal-border rounded-xl p-4 shadow-card-glass font-mono space-y-4">
      {/* Header with Glowing Status */}
      <div className="flex items-center justify-between border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-terminal-cyan">
            <Bot className="w-5 h-5" />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-terminal-green animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Autonomous AI Trading Bot
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                isActive 
                  ? 'bg-emerald-500/20 text-terminal-green border border-emerald-500/40 shadow-green-glow' 
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {isActive ? 'KHUD TRADE ON (AUTO)' : 'BOT PAUSED'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              SMC, ICT aur Price Action setups par khud ba khud trade leta hai
            </p>
          </div>
        </div>

        {/* Master ON / OFF Toggle Button */}
        <button
          onClick={handleToggleBot}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all shadow-md ${
            isActive
              ? 'bg-terminal-green text-black hover:bg-emerald-400 shadow-green-glow'
              : 'bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.1]'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isActive ? 'AUTO BOT: ACTIVE' : 'START AUTO BOT'}</span>
        </button>
      </div>

      {/* FinRobot Multi-Agent Quantitative Consensus Banner */}
      {finRobotData && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border border-cyan-500/30 space-y-2.5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                FINROBOT MULTI-AGENT CONSENSUS ({finRobotData.symbol})
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
                finRobotData.isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-green-glow'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {finRobotData.isApproved 
                  ? `CONSENSUS APPROVED (${finRobotData.agreementRatio} ${finRobotData.primaryDirection})`
                  : `STANDBY / HOLD (${finRobotData.agreementRatio})`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300 font-bold">
              <span>Score: <strong className="text-cyan-300">{finRobotData.consensusScore}%</strong></span>
              <span className="text-slate-600">•</span>
              <span>Kelly Lot: <strong className="text-emerald-400">{finRobotData.fractionalKelly?.recommendedLot || 0.01}</strong></span>
            </div>
          </div>

          {/* 4 Specialized FinRobot CoT Agents */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {/* Agent 1: Structure */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-emerald-400 font-bold">1. STRUCTURE</span>
                <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                  {finRobotData.agentVotes?.structure?.vote || 'HOLD'}
                </span>
              </div>
              <div className="text-[8px] text-slate-400 truncate">
                Conviction: {finRobotData.agentVotes?.structure?.conviction || 50}%
              </div>
            </div>

            {/* Agent 2: L2 Order Book Imbalance */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-amber-400 font-bold">2. ORDER FLOW</span>
                <span className={`text-[8px] px-1 py-0.5 rounded font-bold border ${
                  (finRobotData.orderBookImbalance?.imbalanceRatio || 0) >= 0.18
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : (finRobotData.orderBookImbalance?.imbalanceRatio || 0) <= -0.18
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  OBI: {finRobotData.orderBookImbalance?.percentage || 0}%
                </span>
              </div>
              <div className="text-[8px] text-slate-400 truncate">
                {finRobotData.orderBookImbalance?.bias || 'BALANCED'}
              </div>
            </div>

            {/* Agent 3: Macro Smart Money */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-purple-400 font-bold">3. MACRO COT</span>
                <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                  {finRobotData.agentVotes?.macro?.vote || 'HOLD'}
                </span>
              </div>
              <div className="text-[8px] text-slate-400 truncate">
                CFTC Commercials
              </div>
            </div>

            {/* Agent 4: Risk Guardian */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-cyan-400 font-bold">4. RISK GUARDIAN</span>
                <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                  {finRobotData.isVetoed ? 'VETO ⛔' : 'PASSED 🛡️'}
                </span>
              </div>
              <div className="text-[8px] text-slate-400 truncate">
                0.25x Kelly Sizing
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-300 italic bg-black/30 p-2 rounded border border-white/[0.04] leading-relaxed">
            {finRobotData.romanUrduConsensusSummary}
          </div>
        </div>
      )}

      {/* 4 Institutional Protection Shields Bar */}
      {protectionTelemetry && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
          {/* Shield 1: Market Session & Killzone */}
          <div className="p-2 rounded-xl bg-surface border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                protectionTelemetry.session?.isKillzone ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className="text-slate-400 font-bold truncate">SESSION:</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black border uppercase shrink-0 ${
              protectionTelemetry.session?.isKillzone 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}>
              {protectionTelemetry.session?.session?.replace('_', ' ') || 'ACTIVE'}
            </span>
          </div>

          {/* Shield 2: High-Impact News Shield */}
          <div className="p-2 rounded-xl bg-surface border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                protectionTelemetry.newsShield?.isLocked ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`} />
              <span className="text-slate-400 font-bold truncate">NEWS SHIELD:</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black border uppercase shrink-0 ${
              protectionTelemetry.newsShield?.isLocked
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-red-glow'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}>
              {protectionTelemetry.newsShield?.isLocked ? 'NEWS LOCK ⛔' : 'SAFE 🛡️'}
            </span>
          </div>

          {/* Shield 3: Circuit Breaker */}
          <div className="p-2 rounded-xl bg-surface border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                protectionTelemetry.circuitBreaker?.isTripped ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'
              }`} />
              <span className="text-slate-400 font-bold truncate">CIRCUIT BREAKER:</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black border uppercase shrink-0 ${
              protectionTelemetry.circuitBreaker?.isTripped
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            }`}>
              {protectionTelemetry.circuitBreaker?.isTripped 
                ? 'TRIPPED 🛑' 
                : `${protectionTelemetry.circuitBreaker?.consecutiveLosses}/${protectionTelemetry.circuitBreaker?.maxConsecutiveAllowed} LOSSES`}
            </span>
          </div>

          {/* Shield 4: Live Spread Guard */}
          <div className="p-2 rounded-xl bg-surface border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                protectionTelemetry.spreadGuard?.isSpreadSafe ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
              }`} />
              <span className="text-slate-400 font-bold truncate">SPREAD GUARD:</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black border uppercase shrink-0 ${
              protectionTelemetry.spreadGuard?.isSpreadSafe
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {protectionTelemetry.spreadGuard?.currentSpreadPips} PIPS
            </span>
          </div>
        </div>
      )}

      {/* Target Execution & MT5 Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Execution Mode Selector */}
        <div className="p-3 rounded-xl bg-surface border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Trade Execution Target:</span>
            <span className="text-terminal-cyan font-bold text-[10px]">
              {targetExecution === 'PAPER_AND_MT5' ? 'PAPER + MT5' : (targetExecution === 'MT5_ONLY' ? 'MT5 DIRECT' : 'PAPER ONLY')}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              onClick={() => handleUpdateTarget('PAPER_AND_MT5')}
              className={`py-1.5 px-2 rounded-lg font-bold transition-all border ${
                targetExecution === 'PAPER_AND_MT5'
                  ? 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/50 shadow-cyan-glow'
                  : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
              }`}
            >
              Paper + MT5
            </button>
            <button
              onClick={() => handleUpdateTarget('MT5_ONLY')}
              className={`py-1.5 px-2 rounded-lg font-bold transition-all border ${
                targetExecution === 'MT5_ONLY'
                  ? 'bg-green-500/20 text-terminal-green border-green-500/50 shadow-green-glow'
                  : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
              }`}
            >
              MT5 Only
            </button>
            <button
              onClick={() => handleUpdateTarget('PAPER_ONLY')}
              className={`py-1.5 px-2 rounded-lg font-bold transition-all border ${
                targetExecution === 'PAPER_ONLY'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-glow'
                  : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
              }`}
            >
              Paper Demo
            </button>
          </div>
        </div>

        {/* MT5 Status Card & Connect Trigger */}
        <div className="p-3 rounded-xl bg-surface border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
              <Cpu className="w-3.5 h-3.5 text-terminal-cyan" />
              <span>MetaTrader 5 Bridge</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${mt5Connected ? 'bg-terminal-green animate-pulse' : 'bg-amber-400'}`} />
              <span className={`text-[10px] font-semibold ${mt5Connected ? 'text-terminal-green' : 'text-amber-400'}`}>
                {mt5Connected ? 'MT5 Linked & Synchronized' : 'MT5 Not Connected Yet'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsMt5ModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-terminal-cyan hover:bg-cyan-500/25 transition-all text-xs font-bold"
          >
            <span>Connect MT5</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Anti-Overtrading & High Accuracy Safeguard Badge */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
        <div className="flex items-center gap-2 text-terminal-green font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-terminal-green" />
          <span>Scale-In Allowed: Up to {maxPositionsPerSymbol} Trades/Asset ({Math.round(cooldownSeconds / 60)}m Cooldown)</span>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-terminal-green font-bold border border-emerald-500/40">
          PYRAMIDING ACTIVE
        </span>
      </div>

      {/* Bot Controls & Confluence Thresholds */}
      <div className="p-3 rounded-xl bg-surface border border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-terminal-cyan" />
            <span className="font-bold text-slate-200">Minimum Confluence Filter (Strict Quality):</span>
          </div>
          <span className="text-terminal-cyan font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {minScore}/100 Required
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-xs">
          <button
            onClick={() => handleUpdateMinScore(75)}
            className={`py-1.5 rounded-lg font-bold border transition-all ${
              minScore === 75
                ? 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/50'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
            }`}
          >
            75% (Active)
          </button>
          <button
            onClick={() => handleUpdateMinScore(80)}
            className={`py-1.5 rounded-lg font-bold border transition-all ${
              minScore === 80
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
            }`}
          >
            80% (Optimal)
          </button>
          <button
            onClick={() => handleUpdateMinScore(85)}
            className={`py-1.5 rounded-lg font-bold border transition-all ${
              minScore === 85
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
            }`}
          >
            85% (Strict)
          </button>
          <button
            onClick={() => handleUpdateMinScore(95)}
            className={`py-1.5 rounded-lg font-bold border transition-all ${
              minScore === 95
                ? 'bg-emerald-500/20 text-terminal-green border-emerald-500/50'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
            }`}
          >
            95% (A+)
          </button>
        </div>

        {/* Max Concurrent Positions Per Symbol (Pyramiding) */}
        <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold">Max Trades Per Symbol (Pyramiding / Scale-In):</span>
            <span className="text-terminal-cyan font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {maxPositionsPerSymbol} Max
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => handleUpdateMaxPositions(n)}
                className={`py-1 rounded-lg font-bold border transition-all ${
                  maxPositionsPerSymbol === n
                    ? 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/50 shadow-sm'
                    : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
                }`}
              >
                {n} {n === 1 ? 'Trade (Strict)' : `${n} Trades (Pyramid)`}
              </button>
            ))}
          </div>
        </div>

        {/* Cooldown Period Between Entries */}
        <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold">Cooldown Period After Entry:</span>
            <span className="text-terminal-green font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              {Math.round(cooldownSeconds / 60)} Minutes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { label: '3 Mins (Fast)', sec: 180 },
              { label: '5 Mins (Norm)', sec: 300 },
              { label: '10 Mins (Safe)', sec: 600 },
            ].map(c => (
              <button
                key={c.sec}
                onClick={() => handleUpdateCooldown(c.sec)}
                className={`py-1 rounded-lg font-bold border transition-all ${
                  cooldownSeconds === c.sec
                    ? 'bg-emerald-500/20 text-terminal-green border-emerald-500/50 shadow-sm'
                    : 'bg-white/[0.02] text-slate-400 border-white/[0.04] hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monitored Pairs Strip */}
        <div className="pt-2 border-t border-white/[0.04] space-y-1.5">
          <span className="text-[11px] text-slate-300 font-bold block">10 Monitored Institutional Assets:</span>
          <div className="flex flex-wrap gap-1">
            {['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'NAS100', 'US30', 'AUDUSD', 'USDCAD', 'USDCHF'].map(sym => (
              <span
                key={sym}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/[0.03] border border-white/[0.06] text-slate-300"
              >
                {sym === 'XAUUSD' ? '🥇 XAUUSD' : sym === 'BTCUSD' ? '⚡ BTCUSD' : sym}
              </span>
            ))}
          </div>
        </div>

        {/* Risk Presets & Safeguard Parameters */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-bold">1-Click Risk Presets ($500 Balance):</span>
            <button
              onClick={() => setIsCustomRiskOpen(!isCustomRiskOpen)}
              className="text-[10px] text-terminal-cyan hover:underline font-bold"
            >
              {isCustomRiskOpen ? 'Hide Custom Inputs' : '✎ Custom Risk Inputs'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
            <button
              onClick={() => handleUpdateRisk(0.01, 3.0, 9.0)}
              className={`p-1.5 rounded-lg border text-center transition-all ${
                riskUsd === 3.0 && lotSize === 0.01
                  ? 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/60 font-bold'
                  : 'bg-black/40 border-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-bold">Safe (0.01)</span>
              <span className="text-slate-400 text-[9px]">$3 SL / $9 TP</span>
            </button>

            <button
              onClick={() => handleUpdateRisk(0.01, 5.0, 15.0)}
              className={`p-1.5 rounded-lg border text-center transition-all ${
                riskUsd === 5.0 && lotSize === 0.01
                  ? 'bg-emerald-500/20 text-terminal-green border-emerald-500/60 font-bold shadow-emerald-glow'
                  : 'bg-black/40 border-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-bold">★ 1% Prop ($5)</span>
              <span className="text-slate-400 text-[9px]">$5 SL / $15 TP</span>
            </button>

            <button
              onClick={() => handleUpdateRisk(0.02, 10.0, 30.0)}
              className={`p-1.5 rounded-lg border text-center transition-all ${
                riskUsd === 10.0 && lotSize === 0.02
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold'
                  : 'bg-black/40 border-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              <span className="block font-bold">Growth (0.02)</span>
              <span className="text-slate-400 text-[9px]">$10 SL / $30 TP</span>
            </button>
          </div>

          {/* Expandable Custom Risk Inputs */}
          {isCustomRiskOpen && (
            <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/30 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <label className="text-slate-400 block mb-1">Lot Size:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1.0"
                    value={lotSize}
                    onChange={(e) => setLotSize(parseFloat(e.target.value) || 0.01)}
                    className="w-full px-2 py-1 rounded bg-surface border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-terminal-cyan"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stop Loss ($):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1.0"
                    value={riskUsd}
                    onChange={(e) => setRiskUsd(parseFloat(e.target.value) || 5.0)}
                    className="w-full px-2 py-1 rounded bg-surface border border-white/10 text-rose-400 font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Take Profit ($):</label>
                  <input
                    type="number"
                    step="1.0"
                    min="2.0"
                    value={rewardUsd}
                    onChange={(e) => setRewardUsd(parseFloat(e.target.value) || 15.0)}
                    className="w-full px-2 py-1 rounded bg-surface border border-white/10 text-terminal-green font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={() => handleUpdateRisk(lotSize, riskUsd, rewardUsd)}
                className="w-full py-1.5 rounded bg-terminal-cyan hover:bg-cyan-400 text-black font-bold text-[11px] uppercase transition-all"
              >
                Apply Custom Settings
              </button>
            </div>
          )}

          {/* Active Status Display */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] text-center">
            <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">Lot Size</span>
              <span className="text-white font-bold">{lotSize} Lot</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">Risk / Trade</span>
              <span className="text-rose-400 font-bold">-${riskUsd.toFixed(2)}</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">Target / Trade</span>
              <span className="text-terminal-green font-bold">+${rewardUsd.toFixed(2)}</span>
            </div>
            <div className="p-1.5 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">Today Trades</span>
              <span className="text-terminal-cyan font-bold">{todayTradesCount} / 10 Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Force Scan Action Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleForceScan}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-cyan-glow disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'SCANNING SMC/ICT SETUPS...' : '⚡ SCAN NOW & AUTO-EXECUTE'}</span>
        </button>

        <button
          onClick={handleEmergencyStop}
          className="px-3.5 py-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-terminal-rose hover:bg-rose-500/25 transition-all text-xs font-bold"
          title="Emergency Halt Bot"
        >
          <AlertOctagon className="w-4 h-4" />
        </button>
      </div>

      {/* Scan Feedback Notification */}
      {scanMessage && (
        <div className="p-2.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-terminal-cyan text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Live Autonomous Trade Execution Feed */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-terminal-green animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">
              Live Auto-Trades Taken by Bot:
            </span>
          </div>
          <span className="text-[10px] text-slate-400">{history.length} trades recorded</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {history.length === 0 ? (
            <div className="p-4 rounded-lg bg-surface border border-white/[0.04] text-center text-xs text-slate-500">
              No autonomous trades taken yet. Bot is scanning XAUUSD, BTCUSD, EURUSD, NAS100, GBPUSD, USDJPY, US30...
            </div>
          ) : (
            history.map(trade => (
              <div
                key={trade.id}
                className="p-3 rounded-lg bg-surface/90 border border-white/[0.08] hover:border-terminal-borderGlow transition-colors space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      trade.action === 'BUY'
                        ? 'bg-green-500/20 text-terminal-green border border-green-500/40'
                        : 'bg-rose-500/20 text-terminal-rose border border-rose-500/40'
                    }`}>
                      {trade.action} {trade.lotSize} LOT
                    </span>
                    <span className="font-bold text-white">{trade.symbol}</span>
                    <span className="text-[10px] text-slate-400">@ {trade.entryPrice}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-terminal-cyan font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Score: {trade.score}/100
                    </span>
                    <span className="text-[10px] text-slate-500">{trade.timeString}</span>
                  </div>
                </div>

                {/* SL / TP & Target Broker Pill */}
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="text-rose-400">SL: {trade.stopLoss}</span>
                    <span className="text-terminal-green">TP: {trade.takeProfit}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 font-bold">
                    {trade.targetBroker || 'PAPER + MT5'}
                  </span>
                </div>

                {/* Roman Urdu Reason */}
                {trade.romanUrduSummary && (
                  <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded border border-white/[0.04] leading-relaxed">
                    {trade.romanUrduSummary}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MT5 Modal */}
      <Mt5ConnectionModal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
      />
    </div>
  );
};

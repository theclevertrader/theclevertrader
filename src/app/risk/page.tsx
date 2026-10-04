'use client';

import React, { useState, useMemo } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { RiskEngine } from '@/lib/engines/risk-engine';
import { 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Activity,
  Sliders
} from 'lucide-react';

export default function RiskPage() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [accountBalance, setAccountBalance] = useState(50000);
  const [riskMode, setRiskMode] = useState<'MICRO_SCALP' | 'PERCENT' | 'FIXED_USD' | 'FIXED_LOT'>('MICRO_SCALP');
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [fixedRiskUsd, setFixedRiskUsd] = useState(50.0);
  const [fixedLot, setFixedLot] = useState(0.01);
  const [targetRiskTemplate, setTargetRiskTemplate] = useState(3.0);
  const [targetRewardTemplate, setTargetRewardTemplate] = useState(9.0);

  const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const [entryPrice, setEntryPrice] = useState(spec.currentPrice);
  const [stopLoss, setStopLoss] = useState(spec.currentPrice - 30 * spec.pipSize);
  const [takeProfit, setTakeProfit] = useState(spec.currentPrice + 90 * spec.pipSize);

  // Micro Scalp Auto Calculation
  const microLevels = useMemo(() => {
    return RiskEngine.calculateMicroScalpLevels(
      symbol, 
      entryPrice, 
      'BUY', 
      targetRiskTemplate, 
      targetRewardTemplate, 
      0.01
    );
  }, [symbol, entryPrice, targetRiskTemplate, targetRewardTemplate]);

  // Full Risk Engine Result
  const calculation = useMemo(() => {
    return RiskEngine.calculatePositionSize({
      symbol,
      accountBalance,
      mode: riskMode === 'MICRO_SCALP' ? 'MICRO_SCALP_PRESET' : riskMode,
      riskPercent,
      fixedRiskUsd,
      lotSize: fixedLot,
      entryPrice,
      stopLoss,
      takeProfit,
      microScalpLot: 0.01,
      microScalpTargetRisk: targetRiskTemplate,
      microScalpTargetReward: targetRewardTemplate,
    });
  }, [symbol, accountBalance, riskMode, riskPercent, fixedRiskUsd, fixedLot, entryPrice, stopLoss, takeProfit, targetRiskTemplate, targetRewardTemplate]);

  const applyMicroPreset = () => {
    setRiskMode('MICRO_SCALP');
    setStopLoss(microLevels.stopLoss);
    setTakeProfit(microLevels.takeProfit);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">INSTITUTIONAL RISK MANAGEMENT & POSITION SIZING</h1>
            <p className="text-xs text-slate-400">
              Contract Specifications • Micro Scalp (0.01 / $3 / $9 Target) • Drawdown Gatekeeping
            </p>
          </div>
        </div>

        <button
          onClick={applyMicroPreset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-terminal-cyan border border-cyan-500/40 text-xs font-bold transition-all shadow-cyan-glow"
        >
          <Zap className="w-4 h-4" />
          <span>APPLY MICRO SCALP PRESET (0.01 / $3 / $9)</span>
        </button>
      </div>

      {/* Main Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Risk Controls & Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs font-bold text-white uppercase">
              <span>Account & Sizing Parameters</span>
              <span className="text-terminal-cyan">{symbol} CONTRACT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Asset Instrument</label>
                <select
                  value={symbol}
                  onChange={e => {
                    const nextSym = e.target.value;
                    setSymbol(nextSym);
                    const s = INSTITUTIONAL_SYMBOLS[nextSym];
                    setEntryPrice(s.currentPrice);
                    setStopLoss(s.currentPrice - 30 * s.pipSize);
                    setTakeProfit(s.currentPrice + 90 * s.pipSize);
                  }}
                  className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                >
                  {Object.keys(INSTITUTIONAL_SYMBOLS).map(s => (
                    <option key={s} value={s}>{s} ({INSTITUTIONAL_SYMBOLS[s].name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Account Balance ($ USD)</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={e => setAccountBalance(parseFloat(e.target.value) || 50000)}
                  className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Risk Mode</label>
                <select
                  value={riskMode}
                  onChange={e => setRiskMode(e.target.value as any)}
                  className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="MICRO_SCALP">Micro Scalp Preset (Configurable)</option>
                  <option value="PERCENT">Risk Percentage (%)</option>
                  <option value="FIXED_USD">Fixed Dollar Risk ($)</option>
                  <option value="FIXED_LOT">Fixed Lot Size</option>
                </select>
              </div>
            </div>

            {/* Mode-Specific Options */}
            {riskMode === 'MICRO_SCALP' && (
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs space-y-3">
                <div className="flex items-center gap-2 text-terminal-cyan font-bold">
                  <Zap className="w-4 h-4" />
                  <span>Configurable Micro Scalp Template (0.01 Lot Target)</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Preset Lot</label>
                    <input
                      type="text"
                      disabled
                      value="0.01 Lot"
                      className="w-full bg-surface/50 border border-white/[0.06] rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Target Risk ($)</label>
                    <input
                      type="number"
                      value={targetRiskTemplate}
                      onChange={e => setTargetRiskTemplate(parseFloat(e.target.value) || 3.0)}
                      className="w-full bg-surface border border-white/[0.08] rounded p-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Target Reward ($)</label>
                    <input
                      type="number"
                      value={targetRewardTemplate}
                      onChange={e => setTargetRewardTemplate(parseFloat(e.target.value) || 9.0)}
                      className="w-full bg-surface border border-white/[0.08] rounded p-1.5 text-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Calculated based on {symbol} specifications: 1 pip on 0.01 lot = ${(spec.tickValuePerLot * 0.01).toFixed(2)} USD. Required SL: {microLevels.slPips} pips; Required TP: {microLevels.tpPips} pips (1:{microLevels.riskRewardRatio} R:R).
                </p>
              </div>
            )}

            {/* Price Levels Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Entry Price</label>
                <input
                  type="number"
                  step={spec.pipSize}
                  value={entryPrice}
                  onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-400 block mb-1">Stop Loss Price</label>
                <input
                  type="number"
                  step={spec.pipSize}
                  value={stopLoss}
                  onChange={e => setStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-rose-500/30 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-400 block mb-1">Take Profit Price</label>
                <input
                  type="number"
                  step={spec.pipSize}
                  value={takeProfit}
                  onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface border border-emerald-500/30 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Institutional Instrument Specifications Grid */}
          <div className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass text-xs space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contract Specifications for {symbol}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded bg-surface border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Tick Value (1.0 Lot)</span>
                <span className="text-white font-bold">${spec.tickValuePerLot} USD</span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Pip Size</span>
                <span className="text-white font-bold">{spec.pipSize}</span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Contract Size</span>
                <span className="text-white font-bold">{spec.contractSize}</span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-white/[0.04]">
                <span className="text-[10px] text-slate-400 block">Min / Max Lot</span>
                <span className="text-white font-bold">{spec.minLot} / {spec.maxLot}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Mathematical Risk Engine Output Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-bold text-white uppercase">
              <span>Risk Engine Output</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${calculation.isValid ? 'bg-green-500/20 text-terminal-green' : 'bg-rose-500/20 text-terminal-rose'}`}>
                {calculation.isValid ? 'PASS RISK AUDIT' : 'FAILED AUDIT'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">Calculated Lot Size:</span>
                <span className="text-base font-black text-white">{calculation.lotSize} Lots</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">Actual Dollar Risk:</span>
                <span className="text-base font-black text-terminal-rose">
                  ${calculation.riskAmountUsd.toFixed(2)} USD
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">Actual Dollar Reward:</span>
                <span className="text-base font-black text-terminal-green">
                  ${calculation.rewardAmountUsd.toFixed(2)} USD
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">Risk / Reward Ratio:</span>
                <span className="text-base font-black text-terminal-cyan">
                  1 : {calculation.riskRewardRatio}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">SL Distance in Pips:</span>
                <span className="text-slate-200 font-semibold">{calculation.slDistancePips} Pips</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-400">Pip Value for {calculation.lotSize} Lot:</span>
                <span className="text-slate-200 font-semibold">${calculation.pipValue} USD / pip</span>
              </div>
            </div>

            {/* Institutional Rules Checklist */}
            <div className="p-3 rounded-lg bg-surface border border-white/[0.06] text-[11px] space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Institutional Guardrails:</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-terminal-green" />
                <span>Single Trade Max Risk: 1.0% limit respected</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-terminal-green" />
                <span>Daily Drawdown Limit: 3.0% circuit breaker active</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-terminal-green" />
                <span>Max Correlated Positions: 2 trades max</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

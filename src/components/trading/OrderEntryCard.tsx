'use client';

import React, { useState, useMemo } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { RiskEngine } from '@/lib/engines/risk-engine';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

interface OrderEntryCardProps {
  symbol: string;
  onOrderPlaced?: () => void;
}

export const OrderEntryCard: React.FC<OrderEntryCardProps> = ({
  symbol,
  onOrderPlaced,
}) => {
  const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [mode, setMode] = useState<'MICRO_SCALP' | 'PERCENT' | 'CUSTOM'>('MICRO_SCALP');
  const [lotSize, setLotSize] = useState<number>(0.01);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [entryPrice, setEntryPrice] = useState<number>(spec.currentPrice);
  const [stopLoss, setStopLoss] = useState<number>(
    Number((spec.currentPrice - (direction === 'BUY' ? 30 * spec.pipSize : -30 * spec.pipSize)).toFixed(spec.priceDigits))
  );
  const [takeProfit, setTakeProfit] = useState<number>(
    Number((spec.currentPrice + (direction === 'BUY' ? 90 * spec.pipSize : -90 * spec.pipSize)).toFixed(spec.priceDigits))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Micro-Scalp 0.01 / $3 / $9 Target Calculation
  const applyMicroScalpPreset = () => {
    setMode('MICRO_SCALP');
    setLotSize(0.01);
    const levels = RiskEngine.calculateMicroScalpLevels(symbol, entryPrice, direction, 3.0, 9.0, 0.01);
    setStopLoss(levels.stopLoss);
    setTakeProfit(levels.takeProfit);
  };

  // Instant risk calculation
  const riskResult = useMemo(() => {
    return RiskEngine.calculatePositionSize({
      symbol,
      accountBalance: 50000,
      mode: mode === 'MICRO_SCALP' ? 'MICRO_SCALP_PRESET' : (mode === 'PERCENT' ? 'PERCENT' : 'FIXED_LOT'),
      riskPercent,
      lotSize,
      entryPrice,
      stopLoss,
      takeProfit,
      microScalpLot: 0.01,
      microScalpTargetRisk: 3.0,
      microScalpTargetReward: 9.0,
    });
  }, [symbol, mode, lotSize, riskPercent, entryPrice, stopLoss, takeProfit]);

  const handleExecute = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await globalPaperBroker.placeOrder({
        symbol,
        type: direction,
        lotSize: riskResult.lotSize,
        entryPrice,
        stopLoss,
        takeProfit,
      });

      setSuccessMessage(`Order Executed! ${direction} ${riskResult.lotSize} Lot ${symbol} @ ${entryPrice}`);
      onOrderPlaced?.();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Execution error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-card border border-terminal-border rounded-xl p-4 shadow-card-glass font-mono flex flex-col space-y-4">
      {/* Header & Direction Switcher */}
      <div className="flex items-center justify-between border-b border-terminal-border pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-terminal-cyan" />
          <span className="font-bold text-white text-xs">ORDER EXECUTION & RISK SIZING</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-terminal-cyan font-semibold">
          {symbol}
        </span>
      </div>

      {/* Direction Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            setDirection('BUY');
            const levels = RiskEngine.calculateMicroScalpLevels(symbol, entryPrice, 'BUY', 3.0, 9.0, lotSize);
            setStopLoss(levels.stopLoss);
            setTakeProfit(levels.takeProfit);
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            direction === 'BUY'
              ? 'bg-terminal-green text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
              : 'bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>BUY (LONG)</span>
        </button>

        <button
          onClick={() => {
            setDirection('SELL');
            const levels = RiskEngine.calculateMicroScalpLevels(symbol, entryPrice, 'SELL', 3.0, 9.0, lotSize);
            setStopLoss(levels.stopLoss);
            setTakeProfit(levels.takeProfit);
          }}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
            direction === 'SELL'
              ? 'bg-terminal-rose text-white shadow-[0_0_15px_rgba(255,51,102,0.4)]'
              : 'bg-white/[0.04] text-slate-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>SELL (SHORT)</span>
        </button>
      </div>

      {/* Presets Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface border border-white/[0.06] text-[11px]">
        <button
          onClick={applyMicroScalpPreset}
          className={`flex-1 py-1.5 px-2 rounded font-bold transition-all text-center flex items-center justify-center gap-1 ${
            mode === 'MICRO_SCALP'
              ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3 h-3 text-terminal-cyan" />
          <span>MICRO SCALP (0.01 / $3 / $9)</span>
        </button>

        <button
          onClick={() => setMode('PERCENT')}
          className={`py-1.5 px-3 rounded font-bold transition-all ${
            mode === 'PERCENT'
              ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          1% Risk
        </button>

        <button
          onClick={() => setMode('CUSTOM')}
          className={`py-1.5 px-3 rounded font-bold transition-all ${
            mode === 'CUSTOM'
              ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Numerical Inputs */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Lot Size</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={mode === 'MICRO_SCALP' ? 0.01 : lotSize}
            onChange={e => setLotSize(parseFloat(e.target.value) || 0.01)}
            disabled={mode === 'MICRO_SCALP'}
            className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Entry Price</label>
          <input
            type="number"
            step={spec.pipSize}
            value={entryPrice}
            onChange={e => setEntryPrice(parseFloat(e.target.value) || spec.currentPrice)}
            className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div>
          <label className="text-[10px] text-rose-400 block mb-1">Stop Loss</label>
          <input
            type="number"
            step={spec.pipSize}
            value={stopLoss}
            onChange={e => setStopLoss(parseFloat(e.target.value) || 0)}
            className="w-full bg-surface border border-rose-500/30 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-rose-500/60"
          />
        </div>

        <div>
          <label className="text-[10px] text-emerald-400 block mb-1">Take Profit</label>
          <input
            type="number"
            step={spec.pipSize}
            value={takeProfit}
            onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)}
            className="w-full bg-surface border border-emerald-500/30 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Live Risk Breakdown Box */}
      <div className="p-3 rounded-lg bg-surface border border-white/[0.06] text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span>Est. Dollar Risk:</span>
          <span className="text-terminal-rose font-bold">${riskResult.riskAmountUsd.toFixed(2)} USD</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Est. Dollar Reward:</span>
          <span className="text-terminal-green font-bold">${riskResult.rewardAmountUsd.toFixed(2)} USD</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Risk / Reward Ratio:</span>
          <span className="text-terminal-cyan font-bold">1 : {riskResult.riskRewardRatio}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>SL Distance:</span>
          <span className="text-slate-300 font-medium">{riskResult.slDistancePips} pips</span>
        </div>
      </div>

      {/* Warning if invalid */}
      {riskResult.warningMessage && (
        <div className="flex items-center gap-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{riskResult.warningMessage}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 p-2 rounded bg-emerald-500/15 border border-emerald-500/40 text-terminal-green text-[11px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isSubmitting || !riskResult.isValid}
        className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
          direction === 'BUY'
            ? 'bg-terminal-green hover:bg-emerald-400 text-black shadow-green-glow disabled:opacity-50'
            : 'bg-terminal-rose hover:bg-rose-500 text-white shadow-rose-glow disabled:opacity-50'
        }`}
      >
        {isSubmitting ? 'EXECUTING ORDER...' : `EXECUTE PAPER ${direction}`}
      </button>
    </div>
  );
};

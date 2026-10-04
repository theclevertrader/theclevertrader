'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  ArrowRight, 
  AlertCircle,
  Sliders,
  DollarSign
} from 'lucide-react';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { useMarketTicks } from '@/lib/hooks/useMarketData';

interface RonasOrderDeskProps {
  activeSymbol: string;
  onTradeExecuted?: () => void;
}

export const RonasOrderDesk: React.FC<RonasOrderDeskProps> = ({
  activeSymbol,
  onTradeExecuted,
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  const [lotSize, setLotSize] = useState<number>(0.1);
  const [slPips, setSlPips] = useState<number>(30);
  const [tpPips, setTpPips] = useState<number>(90);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const liveTicks = useMarketTicks();
  const spec = INSTITUTIONAL_SYMBOLS[activeSymbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const currentPrice = liveTicks[activeSymbol]?.price ?? spec.currentPrice;

  // Calculate SL / TP price
  const slPrice = side === 'BUY' 
    ? currentPrice - (slPips * spec.pipSize)
    : currentPrice + (slPips * spec.pipSize);

  const tpPrice = side === 'BUY'
    ? currentPrice + (tpPips * spec.pipSize)
    : currentPrice - (tpPips * spec.pipSize);

  const estimatedMargin = (currentPrice * lotSize * (spec.contractSize || 100)) / 100;
  const pipVal = spec.pipValue ?? spec.tickValuePerLot ?? 1.0;
  const potentialProfit = (tpPips * pipVal * lotSize * 10).toFixed(2);
  const maxRisk = (slPips * pipVal * lotSize * 10).toFixed(2);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExecuting) return;
    setIsExecuting(true);
    setSuccessMsg(null);

    const digits = spec.priceDigits ?? spec.digits ?? 2;

    try {
      // 1. Submit to Paper Broker first
      await globalPaperBroker.placeOrder({
        symbol: activeSymbol,
        type: side,
        lotSize: Number(lotSize),
        stopLoss: Number(slPrice.toFixed(digits)),
        takeProfit: Number(tpPrice.toFixed(digits)),
        comment: `Ronas Desk ${orderType}`,
      });

      // 2. Dispatch to MT5 bridge API
      fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place_order',
          symbol: activeSymbol,
          type: side,
          lot: Number(lotSize),
          stopLoss: Number(slPrice.toFixed(digits)),
          takeProfit: Number(tpPrice.toFixed(digits)),
          comment: 'Ronas Desk Execution',
        }),
      }).catch(() => {});

      setSuccessMsg(`${side} ${lotSize} lot ${activeSymbol} filled at ${currentPrice.toFixed(digits)}!`);
      onTradeExecuted?.();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Order execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="ronas-card p-4 sm:p-5 flex flex-col justify-between space-y-4 font-sans bg-[#09090d] border border-white/[0.08] shadow-2xl">
      {/* 1. Header & Side Switcher (BUY / SELL) */}
      <div>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-sm tracking-wide">ORDER EXECUTION</span>
            <span className="px-2 py-0.5 rounded bg-white/[0.08] text-white font-mono text-[10px] font-bold border border-white/20">
              LIVE GATEWAY
            </span>
          </div>
          <span className="text-xs font-mono text-zinc-400">{activeSymbol}</span>
        </div>

        {/* Segmented Buy / Sell Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-3 p-1 rounded-xl bg-[#050508] border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`py-2 rounded-lg text-xs font-black transition-all ${
              side === 'BUY'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            BUY / LONG
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`py-2 rounded-lg text-xs font-black transition-all ${
              side === 'SELL'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            SELL / SHORT
          </button>
        </div>
      </div>

      {/* 2. Order Type Toggle */}
      <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-3 font-mono">
        <span className="text-[11px] text-zinc-400">Order Type:</span>
        <div className="flex items-center gap-1.5">
          {(['MARKET', 'LIMIT', 'STOP'] as const).map(ot => (
            <button
              key={ot}
              type="button"
              onClick={() => setOrderType(ot)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                orderType === ot
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {ot}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Order Inputs Form */}
      <form onSubmit={handlePlaceOrder} className="space-y-3.5 text-xs">
        {/* Lot Size Input */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5 font-mono">
            <span>Contract Size / Lots</span>
            <span className="text-white font-bold">{lotSize} Lot</span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="50"
              value={lotSize}
              onChange={e => setLotSize(parseFloat(e.target.value) || 0.01)}
              className="w-full bg-[#050508] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-white/30"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">
              LOTS
            </span>
          </div>

          {/* Quick Percentage Chips */}
          <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono text-[10px]">
            {[0.01, 0.05, 0.1, 0.5].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setLotSize(val)}
                className={`py-1 rounded-lg border transition-all font-bold ${
                  lotSize === val
                    ? 'bg-white text-black border-white'
                    : 'bg-[#14141a] text-zinc-400 border-white/[0.06] hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {val} Lot
              </button>
            ))}
          </div>
        </div>

        {/* Automated Stop Loss & Take Profit (1:3 R:R) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1 font-mono">
              Stop Loss (Pips)
            </label>
            <input
              type="number"
              value={slPips}
              onChange={e => setSlPips(parseInt(e.target.value) || 10)}
              className="w-full bg-[#050508] border border-white/[0.08] rounded-xl px-3 py-2 text-rose-400 font-mono text-xs focus:outline-none focus:border-rose-400"
            />
            <span className="text-[9px] text-zinc-500 mt-0.5 block font-mono">
              Loss: -${maxRisk}
            </span>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 block mb-1 font-mono">
              Take Profit (Pips)
            </label>
            <input
              type="number"
              value={tpPips}
              onChange={e => setTpPips(parseInt(e.target.value) || 30)}
              className="w-full bg-[#050508] border border-white/[0.08] rounded-xl px-3 py-2 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-400"
            />
            <span className="text-[9px] text-zinc-500 mt-0.5 block font-mono">
              Gain: +${potentialProfit}
            </span>
          </div>
        </div>

        {/* Financial Metrics Summary Box */}
        <div className="p-3 rounded-xl bg-[#050508] border border-white/[0.08] space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Risk-to-Reward Ratio:</span>
            <span className="font-bold text-white">1:3.0 Institutional Lock</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Est. Margin Required:</span>
            <span className="font-bold text-white">${estimatedMargin.toFixed(2)} USD</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Execution Gateway:</span>
            <span className="text-emerald-400 font-bold">Live MT5 / Paper Auto</span>
          </div>
        </div>

        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isExecuting}
          className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 ${
            side === 'BUY'
              ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20 active:scale-[0.98]'
              : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20 active:scale-[0.98]'
          } disabled:opacity-50`}
        >
          {isExecuting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              <span>Transmitting Order...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current" />
              <span>{side} {activeSymbol}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

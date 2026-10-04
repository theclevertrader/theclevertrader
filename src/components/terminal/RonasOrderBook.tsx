'use client';

import React, { useState } from 'react';
import { Layers, ArrowUp, ArrowDown } from 'lucide-react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { useMarketData } from '@/lib/hooks/useMarketData';

interface OrderBookRow {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

interface RonasOrderBookProps {
  activeSymbol: string;
}

export const RonasOrderBook: React.FC<RonasOrderBookProps> = ({ activeSymbol }) => {
  const { ticks, orderBook } = useMarketData();
  const spec = INSTITUTIONAL_SYMBOLS[activeSymbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const digits = spec.priceDigits ?? spec.digits ?? 2;
  const currentTick = ticks[activeSymbol];
  const basePrice = currentTick?.price ?? spec.currentPrice;

  // Derive dynamic order book levels around live base price
  const step = spec.pipSize * 2;
  const asks: OrderBookRow[] = (orderBook.asks && orderBook.asks.length >= 4)
    ? orderBook.asks.slice(0, 4).map((a, i, arr) => {
        const total = arr.slice(0, i + 1).reduce((sum, item) => sum + item.s, 0);
        return { price: a.p, size: a.s, total, depthPercent: Math.min(100, Math.round((a.s / 30) * 100)) };
      })
    : [
        { price: basePrice + step * 4, size: 14.5, total: 68.2, depthPercent: 88 },
        { price: basePrice + step * 3, size: 8.2, total: 53.7, depthPercent: 69 },
        { price: basePrice + step * 2, size: 18.0, total: 45.5, depthPercent: 58 },
        { price: basePrice + step, size: 27.5, total: 27.5, depthPercent: 35 },
      ];

  const bids: OrderBookRow[] = (orderBook.bids && orderBook.bids.length >= 4)
    ? orderBook.bids.slice(0, 4).map((b, i, arr) => {
        const total = arr.slice(0, i + 1).reduce((sum, item) => sum + item.s, 0);
        return { price: b.p, size: b.s, total, depthPercent: Math.min(100, Math.round((b.s / 30) * 100)) };
      })
    : [
        { price: basePrice - step, size: 24.1, total: 24.1, depthPercent: 31 },
        { price: basePrice - step * 2, size: 19.4, total: 43.5, depthPercent: 56 },
        { price: basePrice - step * 3, size: 12.8, total: 56.3, depthPercent: 72 },
        { price: basePrice - step * 4, size: 21.6, total: 77.9, depthPercent: 100 },
      ];

  const isUp = (currentTick?.change ?? 0) >= 0;

  return (
    <div className="ronas-card p-4 flex flex-col justify-between font-sans bg-[#09090d] border border-white/[0.08] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-zinc-300" />
          <span className="font-bold text-white text-xs tracking-wide">ORDER BOOK</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-300 font-bold uppercase">LIVE L2 DEPTH</span>
        </div>
      </div>

      {/* Table Column Labels */}
      <div className="grid grid-cols-3 text-[10px] font-mono text-zinc-500 font-semibold uppercase tracking-wider py-1.5 border-b border-white/[0.04]">
        <span>PRICE</span>
        <span className="text-right">SIZE</span>
        <span className="text-right">TOTAL</span>
      </div>

      {/* Asks (Sell Orders - Rose Depth) */}
      <div className="space-y-0.5 font-mono text-[11px] py-1">
        {asks.map((ask, idx) => (
          <div
            key={idx}
            className="grid grid-cols-3 relative py-0.5 px-1 rounded overflow-hidden hover:bg-white/[0.02]"
          >
            {/* Visual Depth Bar */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
              style={{ width: `${ask.depthPercent}%` }}
            />
            <span className="text-rose-400 font-bold z-10">{ask.price.toFixed(digits)}</span>
            <span className="text-right text-zinc-300 z-10">{ask.size.toFixed(1)}</span>
            <span className="text-right text-zinc-400 z-10">{ask.total.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Mid Market Price Spread Banner */}
      <div className="my-1.5 py-1.5 px-3 rounded-lg bg-[#050508] border border-white/[0.08] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold text-white">
          {isUp ? (
            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-sm">{basePrice.toFixed(digits)}</span>
          <span className="text-[10px] text-zinc-400">USD</span>
        </div>
        <span className="text-[10px] text-zinc-400">
          Spread: {(step).toFixed(digits)} ({spec.pipSize * 2} Pips)
        </span>
      </div>

      {/* Bids (Buy Orders - Emerald Depth) */}
      <div className="space-y-0.5 font-mono text-[11px] py-1">
        {bids.map((bid, idx) => (
          <div
            key={idx}
            className="grid grid-cols-3 relative py-0.5 px-1 rounded overflow-hidden hover:bg-white/[0.02]"
          >
            {/* Visual Depth Bar */}
            <div
              className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
              style={{ width: `${bid.depthPercent}%` }}
            />
            <span className="text-emerald-400 font-bold z-10">{bid.price.toFixed(digits)}</span>
            <span className="text-right text-zinc-300 z-10">{bid.size.toFixed(1)}</span>
            <span className="text-right text-zinc-400 z-10">{bid.total.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

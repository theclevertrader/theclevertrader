"use client";

import React, { useState, useEffect, memo } from "react";
import { INSTITUTIONAL_SYMBOLS } from "@/lib/constants/symbols";
import { useBiquoteSignalR } from "@/lib/hooks/useBiquoteSignalR";
import { useMarketTicks } from "@/lib/hooks/useMarketData";

interface MarketTickerProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

const TRACKED_SYMBOLS = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'DXY', 'NAS100', 'US30'];

export const MarketTicker: React.FC<MarketTickerProps> = memo(({
  activeSymbol,
  onSelectSymbol,
}) => {
  const [symbols, setSymbols] = useState(INSTITUTIONAL_SYMBOLS);
  const { ticks: wsTicks, connectionStatus } = useBiquoteSignalR(TRACKED_SYMBOLS);

  // 1. Real-time sub-second WebSocket updates from Biquote SignalR hub
  useEffect(() => {
    if (!wsTicks || Object.keys(wsTicks).length === 0) return;
    setSymbols(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [sym, tick] of Object.entries(wsTicks)) {
        if (next[sym] && (tick.mid || tick.bid)) {
          const price = tick.mid || tick.bid;
          const change = tick.dayDiffPercent !== undefined ? tick.dayDiffPercent : next[sym].change24h;
          if (next[sym].currentPrice !== price) {
            changed = true;
            next[sym] = {
              ...next[sym],
              currentPrice: Number(price.toFixed(next[sym].priceDigits)),
              change24h: Number(change.toFixed(2)),
            };
          }
        }
      }
      return changed ? next : prev;
    });
  }, [wsTicks]);

  // 2. Fast reactive sync from local MetaTrader 5 Bridge
  const mt5Ticks = useMarketTicks();
  useEffect(() => {
    if (!mt5Ticks || Object.keys(mt5Ticks).length === 0) return;

    setSymbols(prev => {
      let changed = false;
      const next = { ...prev };
      for (const [sym, tick] of Object.entries(mt5Ticks as Record<string, any>)) {
        if (next[sym] && tick.price) {
          if (next[sym].currentPrice !== tick.price) {
            changed = true;
            next[sym] = {
              ...next[sym],
              currentPrice: Number(tick.price.toFixed(next[sym].priceDigits)),
              change24h: tick.change !== undefined ? Number(tick.change.toFixed(2)) : next[sym].change24h,
            };
          }
        }
      }
      return changed ? next : prev;
    });
  }, [mt5Ticks]);

  const REQUIRED_TICKERS = TRACKED_SYMBOLS;
  const symbolsList = REQUIRED_TICKERS.map(sym => symbols[sym]).filter(Boolean);

  const renderTickerButton = (s: any, prefix: string) => {
    const isPos = s.change24h >= 0;
    const isSelected = s.symbol === activeSymbol;
    // Calculate approximate absolute change from price and percent change
    const absChange = ((s.currentPrice * s.change24h) / 100);
    const formattedAbs = isPos ? `+${absChange.toFixed(s.priceDigits === 5 ? 4 : 2)}` : absChange.toFixed(s.priceDigits === 5 ? 4 : 2);

    return (
      <button
        key={`${prefix}-${s.symbol}`}
        onClick={() => onSelectSymbol(s.symbol)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md transition-all shrink-0 border ${
          isSelected
            ? "bg-cyan-500/20 text-terminal-cyan border-cyan-500/50 shadow-[0_0_8px_rgba(0,240,255,0.25)]"
            : "text-slate-300 hover:text-white hover:bg-white/[0.06] border-white/[0.04]"
        }`}
      >
        <span className="font-bold text-white tracking-tight font-mono text-xs">{s.symbol}</span>
        
        {/* Price */}
        <span className="font-mono-numbers font-medium text-slate-100 min-w-[58px] text-right inline-block text-xs">
          {s.currentPrice.toLocaleString(undefined, { minimumFractionDigits: s.priceDigits, maximumFractionDigits: s.priceDigits })}
        </span>

        {/* Change */}
        <span className={`text-[10px] font-mono-numbers font-semibold min-w-[46px] text-right inline-block ${
          isPos ? "text-emerald-400" : "text-rose-400"
        }`}>
          {formattedAbs}
        </span>

        {/* Percentage Change */}
        <span className={`text-[10px] font-mono-numbers font-bold min-w-[48px] text-right inline-block ${
          isPos ? "text-emerald-400" : "text-rose-400"
        }`}>
          {isPos ? "▲ +" : "▼ "}{s.change24h.toFixed(2)}%
        </span>

        {/* Bullish / Bearish status badge */}
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black tracking-wider uppercase ${
          isPos 
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
        }`}>
          {isPos ? "BULL" : "BEAR"}
        </span>
      </button>
    );
  };

  return (
    <div className="flex items-center border-b border-white/[0.06] px-3 py-1 text-xs font-mono bg-[#06080d] overflow-x-auto scrollbar-none select-none relative">
      
      {/* Fixed Institutional Left Badge */}
      <div className="flex items-center gap-2 pr-3 text-[11px] font-bold uppercase tracking-wider shrink-0 z-20 bg-[#06080d] border-r border-white/[0.08] mr-2 shadow-[4px_0_10px_rgba(0,0,0,0.6)]">
        <div className="relative flex items-center justify-center">
          <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus === 'LIVE_CONNECTED' ? 'bg-terminal-green animate-ping' : 'bg-amber-400 animate-pulse'} absolute opacity-75`} />
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'LIVE_CONNECTED' ? 'bg-terminal-green' : 'bg-amber-400'} relative`} />
        </div>
        <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
          LIVE TICKER
        </span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border transition-colors ${
          connectionStatus === 'LIVE_CONNECTED'
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        }`}>
          {connectionStatus === 'LIVE_CONNECTED' ? '⚡ WS LIVE' : (connectionStatus === 'CONNECTING' ? 'CONNECTING...' : connectionStatus)}
        </span>
      </div>

      {/* Horizontally scrollable & animated marquee viewport */}
      <div className="flex-1 overflow-x-auto ticker-fade-mask relative">
        <div className="animate-ticker-continuous flex items-center">
          {/* Track 1 */}
          <div className="flex items-center gap-3 pr-3 shrink-0">
            {symbolsList.map(s => renderTickerButton(s, 't1'))}
          </div>

          {/* Track 2 (Duplicate for Seamless Loop) */}
          <div className="flex items-center gap-3 pr-3 shrink-0" aria-hidden="true">
            {symbolsList.map(s => renderTickerButton(s, 't2'))}
          </div>
        </div>
      </div>

    </div>
  );
});

MarketTicker.displayName = "MarketTicker";


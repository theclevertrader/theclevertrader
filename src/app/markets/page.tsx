'use client';

import React, { useState } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { CleverGeoRadar } from '@/components/trading/CleverGeoRadar';

export default function MarketsPage() {
  const [activeSymbol, setActiveSymbol] = useState('XAUUSD');
  const spec = INSTITUTIONAL_SYMBOLS[activeSymbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];

  return (
    <div className="space-y-4 font-mono w-full">
      {/* Full-Width Main Area: Clever Geo-Radar */}
      <div className="w-full space-y-4">
        <CleverGeoRadar
          activeSymbol={activeSymbol}
          onSelectSymbol={(sym) => setActiveSymbol(sym)}
        />

        {/* Instrument Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#09090d] border border-white/[0.08] text-xs shadow-xl">
          <div>
            <span className="text-[10px] text-zinc-400 block">Active Instrument</span>
            <span className="text-white font-bold">{spec.symbol} ({spec.name})</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Contract Size</span>
            <span className="text-white font-bold">{spec.contractSize.toLocaleString()} Units</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">Live Spread</span>
            <span className="text-emerald-400 font-bold">{spec.spreadPips} Pips</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block">24h High / Low</span>
            <span className="text-white font-bold">
              {spec.low24h.toFixed(spec.priceDigits)} - {spec.high24h.toFixed(spec.priceDigits)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

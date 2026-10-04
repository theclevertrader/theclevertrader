'use client';

import React from 'react';
import { CotPositionBreakdown } from '@/lib/engines/cftc-cot-engine';

interface CotPositioningBarsProps {
  cotList: CotPositionBreakdown[];
  activeCurrency?: string;
  onSelectCurrency?: (ccy: string) => void;
}

export const CotPositioningBars: React.FC<CotPositioningBarsProps> = ({
  cotList = [],
  activeCurrency = 'EUR',
  onSelectCurrency,
}) => {
  // Find maximum absolute contract value to scale bars relative to 100%
  const maxContracts = Math.max(...cotList.map(c => Math.max(c.nonCommercialLong, c.nonCommercialShort)), 300000);

  return (
    <div className="space-y-2 select-none font-sans">
      <div className="grid grid-cols-12 gap-2 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-white/[0.06] pb-1.5 px-2">
        <span className="col-span-2">CCY</span>
        <span className="col-span-7 text-center">Institutional Net Positioning (Short vs Long)</span>
        <span className="col-span-3 text-right">3Y %ile</span>
      </div>

      <div className="space-y-1.5">
        {cotList.map(c => {
          const isSelected = activeCurrency === c.currency;
          const isLong = c.nonCommercialNet >= 0;
          const absNet = Math.abs(c.nonCommercialNet);
          const barWidthPercent = Math.min(100, Math.round((absNet / maxContracts) * 100 * 1.8));

          return (
            <div
              key={c.currency}
              onClick={() => onSelectCurrency && onSelectCurrency(c.currency)}
              className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-400/50 shadow-sm'
                  : 'bb-panel border-white/[0.04] hover:border-slate-500 hover:bg-white/[0.02]'
              }`}
            >
              {/* Currency Badge */}
              <div className="col-span-2 flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] ${
                  isSelected ? 'bg-amber-400 text-black' : 'bg-white/[0.08] text-white'
                }`}>
                  {c.currency}
                </span>
                <span className="text-xs font-bold text-white hidden sm:inline">{c.currency}</span>
              </div>

              {/* Center Diverging Bar */}
              <div className="col-span-7 relative flex items-center h-4 bg-slate-900/80 rounded border border-white/[0.06] overflow-hidden">
                {/* Center Divider Zero Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-500 z-10" />

                {/* Left (Short) Fill */}
                {!isLong && (
                  <div
                    className="absolute right-1/2 h-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-l transition-all duration-500"
                    style={{ width: `${barWidthPercent / 2}%` }}
                  />
                )}

                {/* Right (Long) Fill */}
                {isLong && (
                  <div
                    className="absolute left-1/2 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-r transition-all duration-500"
                    style={{ width: `${barWidthPercent / 2}%` }}
                  />
                )}

                {/* Metric Label Overlay */}
                <span className="relative z-20 w-full text-center font-mono text-[9px] font-bold text-white tracking-wider px-1 truncate">
                  {isLong ? '+' : ''}{(c.nonCommercialNet / 1000).toFixed(1)}k contracts
                </span>
              </div>

              {/* 3Y Percentile */}
              <div className="col-span-3 flex items-center justify-end gap-1.5 font-mono text-[10px]">
                <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                  <div
                    className={`h-full rounded-full ${
                      c.positionPercentile >= 75 ? 'bg-emerald-400' : c.positionPercentile <= 25 ? 'bg-rose-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${c.positionPercentile}%` }}
                  />
                </div>
                <span className="font-bold text-white min-w-[28px] text-right">
                  {c.positionPercentile}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

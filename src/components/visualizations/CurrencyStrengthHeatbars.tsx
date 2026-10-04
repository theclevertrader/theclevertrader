'use client';

import React from 'react';
import { CurrencyStrengthScore } from '@/lib/engines/currency-strength-engine';

interface CurrencyStrengthHeatbarsProps {
  strengths: CurrencyStrengthScore[];
  activePair?: string;
}

export const CurrencyStrengthHeatbars: React.FC<CurrencyStrengthHeatbarsProps> = ({
  strengths = [],
  activePair = 'EURUSD',
}) => {
  // Sort descending by strength
  const sorted = [...strengths].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-2 select-none font-sans">
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-white/[0.06] pb-1.5">
        <span>8-Currency Strength Rank</span>
        <span className="text-amber-400">Strongest vs Weakest Delta</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sorted.map((item, idx) => {
          const isTop = idx === 0;
          const isBottom = idx === sorted.length - 1;

          let barColor = 'bg-slate-500';
          if (item.score >= 70) barColor = 'bg-emerald-400';
          else if (item.score >= 55) barColor = 'bg-cyan-400';
          else if (item.score <= 35) barColor = 'bg-rose-400';
          else if (item.score <= 45) barColor = 'bg-amber-400';

          return (
            <div key={item.currency} className="bb-panel p-2 rounded-lg space-y-1 border border-white/[0.04]">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                  <span className="text-white">{item.currency}</span>
                  {isTop && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      LEADER
                    </span>
                  )}
                  {isBottom && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                      LAGGARD
                    </span>
                  )}
                </div>
                <span className="font-bold text-white tabular-nums">{item.score}/100</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

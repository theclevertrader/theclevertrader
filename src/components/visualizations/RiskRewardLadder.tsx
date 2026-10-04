'use client';

import React from 'react';
import { ShieldCheck, Target, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface RiskRewardLadderProps {
  currentPrice?: number;
  entryPrice?: number;
  stopLossPips?: number;
  takeProfitPips?: number;
  maxRiskUsd?: number;
  targetProfitUsd?: number;
  lotSize?: number;
}

export const RiskRewardLadder: React.FC<RiskRewardLadderProps> = ({
  currentPrice = 1.08419,
  entryPrice = 1.08419,
  stopLossPips = 15,
  takeProfitPips = 45,
  maxRiskUsd = 3.00,
  targetProfitUsd = 9.00,
  lotSize = 0.01,
}) => {
  const rrRatio = (takeProfitPips / Math.max(1, stopLossPips)).toFixed(1);

  return (
    <div className="bb-panel p-3 rounded-lg space-y-2.5 font-sans border border-white/[0.07] select-none">
      <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-1.5">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="uppercase text-[11px] tracking-wider">Quant Risk-To-Reward Guard</span>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
          1:{rrRatio} RR RATIO
        </span>
      </div>

      {/* Visual Dynamic 1:3 Proportion Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-rose-400 font-bold flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            <span>MAX RISK: -${maxRiskUsd.toFixed(2)}</span>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span>TARGET: +${targetProfitUsd.toFixed(2)}</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Visual Dual-Colored Split Bar */}
        <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-900 border border-white/[0.08]">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-rose-500 transition-all"
            style={{ width: '25%' }}
            title={`Stop Loss: -${stopLossPips} pips (-$${maxRiskUsd})`}
          />
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all flex-1"
            title={`Take Profit: +${takeProfitPips} pips (+$${targetProfitUsd})`}
          />
        </div>

        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>SL: -{stopLossPips} pips</span>
          <span className="font-bold text-white">ALLOCATION: {lotSize} LOT</span>
          <span>TP: +{takeProfitPips} pips</span>
        </div>
      </div>
    </div>
  );
};

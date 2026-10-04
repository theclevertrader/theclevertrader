'use client';

import React from 'react';
import { Crown } from 'lucide-react';

export const MotivationalCard: React.FC = () => {
  return (
    <div className="ronas-card p-3 flex flex-col items-center justify-center bg-gradient-to-br from-[#0e1424] via-[#0c101c] to-[#0d1424] border border-amber-500/20 text-center relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <Crown className="w-8 h-8 text-amber-400 mb-2" />
      <div className="text-[13px] font-black text-amber-300 tracking-wider uppercase leading-tight mb-1">
        DISCIPLINE
      </div>
      <div className="text-[13px] font-black text-white tracking-wider uppercase leading-tight mb-1">
        BUILDS
      </div>
      <div className="text-[13px] font-black text-amber-300 tracking-wider uppercase leading-tight">
        WEALTH
      </div>
      <div className="text-[9px] text-slate-500 font-mono mt-2">
        — The Clever Trader
      </div>
    </div>
  );
};

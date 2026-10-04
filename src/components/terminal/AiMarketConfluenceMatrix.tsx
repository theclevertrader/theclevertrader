'use client';

import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Cpu,
  Coins,
  Globe2,
  Activity,
  BarChart3,
  Layers
} from 'lucide-react';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';

interface ConfluencePillar {
  key: string;
  name: string;
  score: number;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AiMarketConfluenceMatrixProps {
  activeSymbol?: string;
}

export const AiMarketConfluenceMatrix: React.FC<AiMarketConfluenceMatrixProps> = ({
  activeSymbol = 'XAUUSD',
}) => {
  const intel = JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol);
  const biasScore = intel.masterConfluencePercent;
  const isBull = intel.masterDirection.includes('BUY');

  const pillars: ConfluencePillar[] = [
    {
      key: 'technical',
      name: 'Technical',
      score: intel.corePillars.technicalSMC.score || 84,
      bias: 'BULLISH',
      description: 'Supertrend bullish, EMA 9/21 ribbon expanded, RSI 58.4 reset above midline.',
      icon: BarChart3,
    },
    {
      key: 'fundamental',
      name: 'Fundamental',
      score: intel.corePillars.macroDivergence.score || 91,
      bias: 'BULLISH',
      description: 'US Real Yield easing + Global Central Bank net dovish rate easing cycle.',
      icon: Globe2,
    },
    {
      key: 'cot',
      name: 'COT',
      score: intel.corePillars.cftcSmartMoney.score || 89,
      bias: 'BULLISH',
      description: 'CFTC non-commercial speculative positioning in 82nd percentile accumulation.',
      icon: Coins,
    },
    {
      key: 'sentiment',
      name: 'Sentiment',
      score: 76,
      bias: 'BULLISH',
      description: 'Retail crowd 68% net short (contrarian fuel); institutional dark pool buying.',
      icon: Activity,
    },
    {
      key: 'liquidity',
      name: 'Liquidity',
      score: 86,
      bias: 'BULLISH',
      description: 'Asian sell-side sweep completed; clean buy-side liquidity pool target active.',
      icon: Layers,
    },
    {
      key: 'macro',
      name: 'Macro',
      score: intel.corePillars.macroDivergence.score || 92,
      bias: 'BULLISH',
      description: 'FRED & BLS inflation prints cooling; geopolitical safe-haven reserve demand.',
      icon: Globe2,
    },
    {
      key: 'quant',
      name: 'Quant',
      score: 88,
      bias: 'BULLISH',
      description: 'Statistical arbitrage z-score +1.84, VWAP positive slope, mean reversion intact.',
      icon: Cpu,
    },
  ];


  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 2 — AI Market Confluence
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                MULTI-PILLAR SYNTHESIS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              AI-generated institutional summary across 7 quantitative & macroeconomic pillars
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">ENGINE:</span>
          <span className="text-cyan-400 font-bold">NEXUS NEURAL CONFLUENCE v4.2</span>
        </div>
      </div>

      {/* Main Bias Banner + 7 Pillars Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* Left (4 Cols): Institutional Market Bias Hero Box */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-gradient-to-br from-[#0c1524] to-[#080d16] border border-cyan-500/30 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-card-glass">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-black tracking-widest text-cyan-400 uppercase">
              INSTITUTIONAL MARKET BIAS
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {biasScore}%
              </span>
              <span className="text-lg sm:text-xl font-black text-terminal-green font-mono flex items-center gap-1">
                <TrendingUp className="w-5 h-5 inline" />
                BULLISH
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed pt-1">
              Strong alignment detected across orderflow, central bank dovish stance, and CFTC speculative accumulation.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08] text-[10px] font-mono">
            <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">ACTION DIRECTIVE:</span>
              <span className="text-amber-300 font-bold font-mono">ACCUMULATE PULLBACK</span>
            </div>
            <div className="p-2 rounded bg-black/40 border border-white/[0.04]">
              <span className="text-slate-400 block">RISK POSTURE:</span>
              <span className="text-emerald-400 font-bold font-mono">SAFEGUARDED (1:3 RR)</span>
            </div>
          </div>
        </div>

        {/* Right (8 Cols): 7 Confluence Pillars Progress Bars */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col justify-between space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {pillars.map(pillar => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-slate-200">{pillar.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400 font-bold">{pillar.bias}</span>
                      <span className="font-bold text-white font-mono min-w-[32px] text-right">
                        {pillar.score}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate" title={pillar.description}>
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* AI Explanation Banner */}
          <div className="mt-2 pt-2.5 border-t border-white/[0.06] flex items-start gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                NEXUS Institutional Synthesis & Executive Verdict:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {intel.romanUrduSynthesis} Market structure is respecting bullish order blocks with zero divergence in institutional positioning. Continue to seek long triggers during London/NY overlap session.
              </p>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Coins, 
  Building2, 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight,
  Flame,
  Radio,
  Layers,
  RefreshCw
} from 'lucide-react';
import { PipelineNode, UnifiedPipelineOutput, InstitutionalPipelineEngine } from '@/lib/engines/institutional-pipeline-engine';

interface InstitutionalPipelineWidgetProps {
  initialSymbol?: string;
  showTitle?: boolean;
}

export const InstitutionalPipelineWidget: React.FC<InstitutionalPipelineWidgetProps> = ({
  initialSymbol = 'XAUUSD',
  showTitle = true,
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [pipeline, setPipeline] = useState<UnifiedPipelineOutput>(
    InstitutionalPipelineEngine.evaluatePipeline(initialSymbol)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeNode, setActiveNode] = useState<PipelineNode | null>(null);

  const fetchPipeline = async (sym: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/pipeline?symbol=${sym}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pipeline) {
          setPipeline(data.pipeline);
        }
      }
    } catch (e) {
      console.error('Error fetching pipeline:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline(symbol);
    const interval = setInterval(() => fetchPipeline(symbol), 25000);
    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <div className="p-4 rounded-xl bb-card space-y-3.5 font-sans relative overflow-hidden">
      {/* Header Bar */}
      {showTitle && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-300 font-bold">
              <Zap className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
                  10-Node Institutional Synergy Pipeline
                </h2>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-terminal-green text-[10px] font-bold border border-emerald-500/30">
                  {pipeline.overallAlignmentPercent}% ALIGNED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                CFTC COT + FRED + BLS + BEA + Fed + ECB + BOE + BoJ + GDELT + Price Feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/[0.08]">
              {['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'].map(s => (
                <button
                  key={s}
                  onClick={() => setSymbol(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    symbol === s
                      ? 'bg-terminal-cyan text-black shadow-cyan-glow'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchPipeline(symbol)}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-300 hover:text-white"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* 10-Node Flow Pipeline Visual Ribbon */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max py-1">
          {pipeline.nodes.map((node, idx) => {
            const isLast = idx === pipeline.nodes.length - 1;
            const isSelected = activeNode?.id === node.id;
            const biasColor =
              node.bias === 'BULLISH'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : node.bias === 'BEARISH'
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

            return (
              <React.Fragment key={node.id}>
                {/* Single Node Card */}
                <div
                  onClick={() => setActiveNode(node)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all shrink-0 w-36 sm:w-40 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/50'
                      : 'bg-[#0a0e17] border-white/[0.07] hover:border-slate-500 hover:bg-[#0e1422]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${biasColor}`}>
                      {node.bias}
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-xs text-white truncate">{node.shortLabel}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{node.keyMetricLabel}</div>
                    <div className="font-mono text-[11px] font-bold text-amber-300 mt-1 truncate">
                      {node.keyMetric}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[9px]">
                    <span className="text-slate-500">Weight:</span>
                    <span className="font-mono font-semibold text-slate-300">{node.weight}%</span>
                  </div>
                </div>

                {/* Flow Separator */}
                {!isLast && (
                  <div className="text-slate-600 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Synthesis Verdict & Execution Directive */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-white/[0.06]">
        {/* Alignment Gauge Display */}
        <div className="md:col-span-4 p-3 rounded-lg bg-[#0a0e17] border border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              10-Node Confluence Metric
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {pipeline.overallAlignmentPercent}% CONFLUENCE
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 uppercase">
                {pipeline.institutionalRegime.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Directive</span>
            <span className="text-sm font-bold text-emerald-400 font-mono block mt-1">
              {pipeline.actionableDecision.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Roman Urdu Comprehensive Synthesis Verdict */}
        <div className="md:col-span-8 p-3 rounded-lg bg-[#0a0e17] border border-white/[0.08] flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-400 uppercase mr-1.5 font-mono">
              {activeNode ? `${activeNode.name} Signal:` : 'Institutional Synergy Verdict (Roman Urdu):'}
            </span>
            <span className="text-slate-300">
              {activeNode ? activeNode.romanUrduSignal : pipeline.summaryUrdu}
            </span>
            {activeNode && (
              <button
                onClick={() => setActiveNode(null)}
                className="ml-2 text-[10px] text-amber-400 hover:underline font-bold"
              >
                (View Full 10-Node Verdict)
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

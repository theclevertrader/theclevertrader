"use client";

import React from "react";
import AiStudioX from "@/components/trading/AiStudioX";
import { InstitutionalPipelineWidget } from "@/components/trading/InstitutionalPipelineWidget";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AiStudioPage() {
  return (
    <div className="w-full space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hedge Fund Terminal</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/forex-matrix"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <span>🧮 100% Forex Matrix</span>
          </Link>
          <Link
            href="/xauusd-briefing"
            className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <span>🏅 XAUUSD Daily Briefing</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multi-Agent Consensus Active</span>
          </div>
        </div>
      </div>

      {/* 10-Node Institutional Synergy Pipeline */}
      <InstitutionalPipelineWidget initialSymbol="XAUUSD" showTitle={true} />

      <AiStudioX />
    </div>
  );
}

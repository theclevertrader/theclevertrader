'use client';

import React from 'react';
import { ForexQuantMatrixDashboard } from '@/components/trading/ForexQuantMatrixDashboard';
import { InstitutionalPipelineWidget } from '@/components/trading/InstitutionalPipelineWidget';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function ForexMatrixPage() {
  return (
    <div className="w-full space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Terminal</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/fundamental"
            className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-500/20 transition-all"
          >
            <span>🌐 20 Institutional Sources</span>
          </Link>
          <Link
            href="/ai-studio"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Studio X</span>
          </Link>
        </div>
      </div>

      {/* 10-Node Institutional Synergy Pipeline */}
      <InstitutionalPipelineWidget initialSymbol="EURUSD" showTitle={true} />

      <ForexQuantMatrixDashboard />
    </div>
  );
}

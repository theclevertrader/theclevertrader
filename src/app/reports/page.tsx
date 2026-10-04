'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Bot, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = (format: string) => {
    const filename = `THE_CLEVER_TRADER_${reportPeriod}_REPORT.${format.toLowerCase()}`;
    const reportData = {
      brand: 'THE CLEVER TRADER — Institutional AI Hedge Fund Terminal',
      period: reportPeriod,
      generatedAt: new Date().toISOString(),
      accountSummary: {
        initialBalance: 50000,
        currentEquity: 50094,
        netReturn: '+0.19%',
        winRate: '68.4%',
        profitFactor: 2.74,
        maxDrawdown: '1.2%',
      },
      topPerformingPair: 'XAUUSD (+2.8R Average)',
      optimalSession: 'London Kill Zone (78% Win Rate)',
      aiReviewRomanUrdu: 'Hedge fund performance stable hai. XAUUSD par liquidity sweeps aur FVG retests ne sab se zyada expectancy deliver ki. Risk control 1.0% parameter ke mutabiq strictly follow hua.',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    setExportNotice(`Exported institutional report (${format}) successfully!`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">INSTITUTIONAL PERFORMANCE REPORTS</h1>
            <p className="text-xs text-slate-400">
              Audit-Ready Documentation • Strategy Breakdown • PDF / CSV / JSON Export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-white/[0.08] hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-white/[0.08] hover:border-cyan-500/30 text-xs text-slate-300 hover:text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleExport('JSON')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-terminal-cyan border border-cyan-500/40 text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-terminal-green text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Period Selector Bar */}
      <div className="flex items-center gap-2 bg-surface-card p-1.5 rounded-xl border border-terminal-border text-xs w-fit">
        {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(p => (
          <button
            key={p}
            onClick={() => setReportPeriod(p)}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all ${
              reportPeriod === p
                ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p} AUDIT
          </button>
        ))}
      </div>

      {/* Formatted Report Sheet Preview */}
      <div className="p-8 rounded-2xl bg-surface-card border border-terminal-border shadow-card-glass space-y-6 text-xs w-full">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h2 className="text-lg font-black text-white">THE CLEVER TRADER — {reportPeriod} PERFORMANCE AUDIT</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Report Reference: CT-AUDIT-{Date.now().toString().slice(-6)}</p>
          </div>
          <span className="text-[11px] text-terminal-green px-3 py-1 rounded bg-green-500/10 border border-green-500/30 font-bold">
            STATUS: APPROVED
          </span>
        </div>

        {/* Core Financials */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Starting Capital</span>
            <span className="text-base font-bold text-white">$50,000.00</span>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Current Balance</span>
            <span className="text-base font-bold text-terminal-cyan">$50,094.00</span>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Win Rate</span>
            <span className="text-base font-bold text-terminal-green">68.4%</span>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Profit Factor</span>
            <span className="text-base font-bold text-white">2.74</span>
          </div>
        </div>

        {/* AI Performance Evaluation */}
        <div className="p-4 rounded-xl bg-surface-elevated/70 border border-cyan-500/20 space-y-2">
          <div className="flex items-center gap-2 text-terminal-cyan font-bold text-xs">
            <Bot className="w-4 h-4" />
            <span>NEXUS Quantitative Audit:</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-xs">
            "Is period ke dauran portfolio ne institutional parameters par disciplined execution maintain ki hai. Sab se behtareen setups XAUUSD aur BTCUSD par London session mein Sell-Side sweeps ke baad trigger hue. Stop loss violation zero rahi aur maximum drawdown 1.2% par control raha jo safe limit (3%) ke andar hai."
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingDown, 
  Activity, 
  PieChart, 
  Percent,
  Lock,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface RiskMetric {
  id: string;
  label: string;
  value: string;
  limit: string;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'ALERT';
  description: string;
}

export const InstitutionalRiskPanel: React.FC = () => {
  const riskMetrics: RiskMetric[] = [
    {
      id: 'portfolio-risk',
      label: 'Portfolio Risk',
      value: '0.85%',
      limit: 'Max 2.00%',
      percentage: 42.5,
      status: 'SAFE',
      description: 'Aggregate capital at active stop loss exposure.',
    },
    {
      id: 'daily-drawdown',
      label: 'Daily Drawdown',
      value: '0.12%',
      limit: 'Max 3.00%',
      percentage: 4.0,
      status: 'SAFE',
      description: 'Session P&L drawdown relative to starting equity.',
    },
    {
      id: 'total-exposure',
      label: 'Gross Exposure',
      value: '$1,250.00',
      limit: 'Max $10,000',
      percentage: 12.5,
      status: 'SAFE',
      description: 'Notional market value across open positions.',
    },
    {
      id: 'margin-usage',
      label: 'Margin Usage',
      value: '1.60%',
      limit: 'Max 20.00%',
      percentage: 8.0,
      status: 'SAFE',
      description: '$800.00 used margin out of $50,000 account balance.',
    },
    {
      id: 'open-risk',
      label: 'Open Risk (USD)',
      value: '$3.00',
      limit: 'Max $9.00',
      percentage: 33.3,
      status: 'SAFE',
      description: '0.01 lot micro allocation with $3 hard SL.',
    },
    {
      id: 'correlation-risk',
      label: 'Correlation Risk',
      value: '0.18 Beta',
      limit: 'Max 0.70 Beta',
      percentage: 25.7,
      status: 'SAFE',
      description: 'Low asset co-dependence across Gold & FX holdings.',
    },
    {
      id: 'max-risk-trade',
      label: 'Maximum Risk / Trade',
      value: '1.00%',
      limit: 'Hard Cap 1.00%',
      percentage: 100,
      status: 'SAFE',
      description: 'Enforced institutional rule: max 1% loss per setup.',
    },
    {
      id: 'var-99',
      label: 'Value at Risk (VaR 99%)',
      value: '$48.20 / 24h',
      limit: 'Parametric 1D',
      percentage: 16.0,
      status: 'SAFE',
      description: '99% confidence interval historical simulation.',
    },
    {
      id: 'volatility-regime',
      label: 'Historical Volatility',
      value: '11.2% Ann.',
      limit: 'HV 14-Day',
      percentage: 38.0,
      status: 'SAFE',
      description: 'Normal institutional dispersion regime.',
    },
    {
      id: 'risk-score',
      label: 'Overall Risk Score',
      value: '96 / 100',
      limit: 'INSTITUTIONAL SAFE',
      percentage: 96,
      status: 'SAFE',
      description: 'Complete systemic drawdown immunity active.',
    },
  ];

  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 6 — Institutional Risk Engine
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                10 RISK NODES MONITORED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Quantitative Portfolio Health, VaR Parametric Bounds, and Micro-Lot Drawdown Safety
            </p>
          </div>
        </div>

        {/* Global Safety Badge */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="font-bold">SYSTEMIC CIRCUIT BREAKER: ARMED</span>
        </div>
      </div>

      {/* 10 Risk Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {riskMetrics.map(metric => (
          <div
            key={metric.id}
            className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-2 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <span className="truncate" title={metric.label}>{metric.label}</span>
                <span className="text-emerald-400 text-[9px] font-black">{metric.status}</span>
              </div>
              <div className="text-base font-black text-white font-mono mt-1">
                {metric.value}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Threshold: {metric.limit}
              </div>
            </div>

            {/* Micro Progress Indicator */}
            <div className="space-y-1 pt-1 border-t border-white/[0.04]">
              <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    metric.percentage > 70 
                      ? 'bg-rose-500' 
                      : metric.percentage > 40 
                      ? 'bg-amber-400' 
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 truncate" title={metric.description}>
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional Safeguard Footer */}
      <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 text-[11px]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Hedge Fund Risk Mandate: <strong className="text-white">Strict 0.01 Lot ($3 Risk / $9 Reward)</strong> per individual setup. All positions automatically protected with server-side hard stop loss.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Max Concurrent Trades: <strong className="text-white font-mono">3</strong></span>
          <span>•</span>
          <span>Max Daily Loss Limit: <strong className="text-rose-400 font-mono">-$15.00</strong></span>
        </div>
      </div>
    </section>
  );
};

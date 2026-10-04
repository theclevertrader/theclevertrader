'use client';

import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Percent, 
  Calendar, 
  Activity, 
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface PerformanceKpi {
  id: string;
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  benchmark?: string;
}

export const InstitutionalPerformanceAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'YTD' | 'ALL'>('30D');

  const kpis: PerformanceKpi[] = [
    { id: 'daily-pnl', label: 'Daily P&L', value: '+$94.00', change: '+0.19%', isPositive: true, benchmark: 'Target +$60/day' },
    { id: 'weekly-pnl', label: 'Weekly P&L', value: '+$642.50', change: '+1.28%', isPositive: true, benchmark: '4 Wins / 1 Loss' },
    { id: 'monthly-pnl', label: 'Monthly P&L', value: '+$2,840.00', change: '+5.68%', isPositive: true, benchmark: 'Tracked Net Profit' },
    { id: 'win-rate', label: 'Win Rate', value: '73.4%', change: '108W / 40L', isPositive: true, benchmark: 'Institutional > 65%' },
    { id: 'profit-factor', label: 'Profit Factor', value: '2.42', change: 'Gross $6,820 / $2,810', isPositive: true, benchmark: 'Target > 2.0' },
    { id: 'avg-r', label: 'Average R', value: '2.65 R', change: '1:3 Rule', isPositive: true, benchmark: '+$7.95 Avg Winner' },
    { id: 'max-drawdown', label: 'Max Drawdown', value: '1.80%', change: '-$900 Peak-Valley', isPositive: true, benchmark: 'Hard Cap 3.0%' },
    { id: 'sharpe-ratio', label: 'Sharpe Ratio', value: '2.84', change: 'Annualized Risk-Adj', isPositive: true, benchmark: 'Top Hedge Tier' },
    { id: 'expectancy', label: 'Expectancy', value: '+1.45 R', change: 'Per Executed Trade', isPositive: true, benchmark: 'Positive Expectancy' },
    { id: 'total-trades', label: 'Total Trades', value: '148', change: '0.01 Lots', isPositive: true, benchmark: '100% Documented' },
  ];

  // SVG Equity curve coordinate points
  const equityPoints = [
    { day: 'D1', val: 50000 },
    { day: 'D5', val: 50320 },
    { day: 'D10', val: 50840 },
    { day: 'D15', val: 51210 },
    { day: 'D20', val: 51090 },
    { day: 'D25', val: 52100 },
    { day: 'D30', val: 52840 },
  ];

  const minVal = 49800;
  const maxVal = 53200;
  const svgWidth = 600;
  const svgHeight = 160;

  const pointsString = equityPoints
    .map((p, idx) => {
      const x = (idx / (equityPoints.length - 1)) * (svgWidth - 40) + 20;
      const y = svgHeight - 20 - ((p.val - minVal) / (maxVal - minVal)) * (svgHeight - 40);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 9 — Institutional Performance Analytics
              </h2>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                AUDITED P&L
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Quantitative Hedge-Fund Attribution • 10 Key Risk & Return Indicators
            </p>
          </div>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
          {(['30D', '90D', 'YTD', 'ALL'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                timeframe === tf
                  ? 'bg-emerald-500 text-black font-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* 10 Institutional KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {kpis.map(kpi => (
          <div
            key={kpi.id}
            className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1"
          >
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
              {kpi.label}
            </div>
            <div className="text-base font-black text-white font-mono flex items-center gap-1.5">
              <span className={kpi.isPositive ? 'text-emerald-400' : 'text-slate-100'}>
                {kpi.value}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/[0.04]">
              <span className="text-emerald-400">{kpi.change}</span>
              <span className="text-slate-500 truncate" title={kpi.benchmark}>{kpi.benchmark}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional Equity Curve Chart Viewport */}
      <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-xs border-b border-white/[0.06] pb-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">Cumulative Portfolio Equity Curve</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
              +$2,840.00 (+5.68%)
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">Compounded 1:3 RR Growth</span>
        </div>

        {/* SVG Curve */}
        <div className="w-full overflow-hidden pt-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-36 stroke-current text-emerald-400"
            fill="none"
          >
            {/* Subtle Grid Lines */}
            <line x1="20" y1="30" x2={svgWidth - 20} y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="80" x2={svgWidth - 20} y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="20" y1="130" x2={svgWidth - 20} y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Gradient Fill under curve */}
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Fill path */}
            <polygon
              points={`20,${svgHeight - 20} ${pointsString} ${svgWidth - 20},${svgHeight - 20}`}
              fill="url(#equityGrad)"
            />

            {/* Main Curve */}
            <polyline
              points={pointsString}
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Marker Points */}
            {equityPoints.map((p, idx) => {
              const x = (idx / (equityPoints.length - 1)) * (svgWidth - 40) + 20;
              const y = svgHeight - 20 - ((p.val - minVal) / (maxVal - minVal)) * (svgHeight - 40);
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-black stroke-emerald-400 stroke-2"
                />
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between px-4 text-[10px] font-mono text-slate-500 pt-1">
            {equityPoints.map(p => (
              <span key={p.day}>{p.day}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

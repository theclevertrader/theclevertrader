'use client';

import React, { useState, useMemo } from 'react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { INITIAL_CANDLES_MAP, generateCandles } from '@/lib/data/sample-data';
import { BacktestEngine } from '@/lib/engines/backtest-engine';
import { BacktestSummary } from '@/lib/types/trading';
import { 
  History, 
  Play, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  BarChart2, 
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export default function BacktestingPage() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [strategy, setStrategy] = useState<'SMC_ICT_CONFLUENCE' | 'LIQUIDITY_SWEEP_MSS' | 'ORDER_BLOCK_FVG_RETEST' | 'EMA_TREND_PULLBACK'>('SMC_ICT_CONFLUENCE');
  const [initialBalance, setInitialBalance] = useState(50000);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [spreadPips, setSpreadPips] = useState(1.0);
  const [commission, setCommission] = useState(5.0);
  const [slippage, setSlippage] = useState(0.5);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [customCandles, setCustomCandles] = useState<any[] | null>(null);

  // Run backtest computation
  const summary: BacktestSummary = useMemo(() => {
    const candlesToUse = customCandles || INITIAL_CANDLES_MAP[symbol] || generateCandles(symbol, 150, 15);
    return BacktestEngine.runBacktest({
      symbol,
      strategy,
      initialBalance,
      riskPercent,
      spreadPips,
      commissionPerLot: commission,
      slippagePips: slippage,
      candles: candlesToUse,
    });
  }, [symbol, strategy, initialBalance, riskPercent, spreadPips, commission, slippage, customCandles]);

  // Handle CSV Upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const parsedCandles = [];
      // Expected CSV format: Time, Open, High, Low, Close, Volume
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 5) {
          const time = isNaN(Date.parse(parts[0])) ? Date.now() - (lines.length - i) * 60000 * 15 : new Date(parts[0]).getTime();
          parsedCandles.push({
            time,
            open: parseFloat(parts[1]) || 0,
            high: parseFloat(parts[2]) || 0,
            low: parseFloat(parts[3]) || 0,
            close: parseFloat(parts[4]) || 0,
            volume: parseFloat(parts[5]) || 500,
          });
        }
      }

      if (parsedCandles.length > 30) {
        setCustomCandles(parsedCandles);
      }
    };
    reader.readAsText(file);
  };

  const isProfit = summary.netProfit >= 0;

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">QUANTITATIVE BACKTESTING ENGINE</h1>
            <p className="text-xs text-slate-400">
              Zero Lookahead Bias • Real Market Friction • Historical CSV Importer • Full Statistical Metrics
            </p>
          </div>
        </div>

        {/* CSV Import Button */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-white/[0.08] hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-terminal-cyan" />
            <span>{csvFileName ? `CSV: ${csvFileName}` : 'Import Historical CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Backtest Parameters Controls */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4">
        <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/[0.06] pb-2">
          Backtest Simulation Parameters
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Symbol</label>
            <select
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              {Object.keys(INSTITUTIONAL_SYMBOLS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Strategy</label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as any)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              <option value="SMC_ICT_CONFLUENCE">SMC / ICT Confluence</option>
              <option value="LIQUIDITY_SWEEP_MSS">Liquidity Sweep + MSS</option>
              <option value="ORDER_BLOCK_FVG_RETEST">OB & FVG Retest</option>
              <option value="EMA_TREND_PULLBACK">EMA Trend Pullback</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Initial Balance ($)</label>
            <input
              type="number"
              value={initialBalance}
              onChange={e => setInitialBalance(parseFloat(e.target.value) || 50000)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
            </input>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Risk % Per Trade</label>
            <input
              type="number"
              step="0.5"
              value={riskPercent}
              onChange={e => setRiskPercent(parseFloat(e.target.value) || 1.0)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Spread (Pips)</label>
            <input
              type="number"
              step="0.1"
              value={spreadPips}
              onChange={e => setSpreadPips(parseFloat(e.target.value) || 1.0)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Commission ($/Lot)</label>
            <input
              type="number"
              step="1"
              value={commission}
              onChange={e => setCommission(parseFloat(e.target.value) || 5.0)}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      {/* KPI Performance Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Profit</span>
          <span className={`text-lg font-black ${isProfit ? 'text-terminal-green' : 'text-terminal-rose'}`}>
            {isProfit ? '+' : ''}${summary.netProfit.toLocaleString()} USD
          </span>
          <span className="text-[10px] text-slate-500 block">Final: ${summary.finalBalance.toLocaleString()}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Win Rate</span>
          <span className="text-lg font-black text-terminal-cyan">{summary.winRate}%</span>
          <span className="text-[10px] text-slate-500 block">{summary.winningTrades}W / {summary.losingTrades}L ({summary.totalTrades} Trades)</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Profit Factor</span>
          <span className="text-lg font-black text-white">{summary.profitFactor}</span>
          <span className="text-[10px] text-slate-500 block">Gross: +${summary.grossProfit} / -${summary.grossLoss}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Max Drawdown</span>
          <span className="text-lg font-black text-terminal-rose">-{summary.maxDrawdownPercent}%</span>
          <span className="text-[10px] text-slate-500 block">-${summary.maxDrawdownUsd} Peak Drop</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sharpe Ratio</span>
          <span className="text-lg font-black text-white">{summary.sharpeRatio}</span>
          <span className="text-[10px] text-slate-500 block">Sortino: {summary.sortinoRatio}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average R:R</span>
          <span className="text-lg font-black text-terminal-cyan">1 : {summary.averageRiskReward}</span>
          <span className="text-[10px] text-slate-500 block">Expectancy: ${summary.expectancy}/trade</span>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Institutional Simulation Equity Curve
            </h2>
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.startDate} → {summary.endDate}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summary.equityCurve}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1b253b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b111e',
                  borderColor: '#00f0ff33',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="#00f0ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="bg-surface-card border border-terminal-border rounded-xl shadow-card-glass overflow-hidden">
        <div className="px-4 py-3 border-b border-terminal-border bg-surface-elevated/70 text-xs font-bold text-white flex items-center justify-between">
          <span>SIMULATED EXECUTIONS AUDIT ({summary.trades.length} TRADES)</span>
          <span className="text-[10px] text-slate-400">Spread & Commission Deducted</span>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/[0.06] sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Trade ID</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Entry</th>
                <th className="px-3 py-2.5">Exit</th>
                <th className="px-3 py-2.5">R-Multiple</th>
                <th className="px-3 py-2.5">Net P&L ($)</th>
                <th className="px-4 py-2.5 text-right">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {summary.trades.map(trade => {
                const isWin = trade.result === 'WIN';
                return (
                  <tr key={trade.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2 font-bold text-white">{trade.id}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${trade.type === 'BUY' ? 'text-terminal-green' : 'text-terminal-rose'}`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300">{trade.entryPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-300">{trade.exitPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-terminal-cyan font-bold">{trade.rMultiple}R</td>
                    <td className={`px-3 py-2 font-bold ${isWin ? 'text-terminal-green' : 'text-terminal-rose'}`}>
                      {isWin ? '+' : ''}${trade.profitUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right text-[10px] text-slate-400">{trade.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

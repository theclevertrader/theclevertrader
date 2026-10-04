'use client';

import React from 'react';
import { Wallet, TrendingUp, ArrowRight, PieChart } from 'lucide-react';
import Link from 'next/link';

interface PortfolioOverviewProps {
  balance?: number;
  todayPnl?: number;
  todayPnlPercent?: number;
  openTrades?: number;
  marginLevel?: number;
  accountLogin?: string | number;
  accountServer?: string;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  balance = 10000.00,
  todayPnl = 0.00,
  todayPnlPercent = 0.00,
  openTrades = 0,
  marginLevel = 0.00,
  accountLogin,
  accountServer,
}) => {
  const isProfit = todayPnl >= 0;

  return (
    <div className="ronas-card p-3 flex flex-col bg-[#09090d] border border-white/[0.08] h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-[11px] font-black text-white tracking-wider uppercase">Portfolio Overview</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono text-emerald-300 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{accountLogin ? `MT5: ${accountLogin}` : 'MT5 Live Feed'}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        <div className="text-[10px] text-zinc-400 font-mono mb-0.5">Total Balance</div>
        <div className="text-xl font-black text-white font-mono tracking-tight">
          $ {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className={`text-[11px] font-bold font-mono mt-0.5 flex items-center gap-1 ${
          isProfit ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <TrendingUp className="w-3 h-3" />
          {isProfit ? '+' : ''}${todayPnl.toFixed(2)} ({isProfit ? '+' : ''}{todayPnlPercent.toFixed(2)}%)
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Today&apos;s P/L</span>
          <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : ''}${todayPnl.toFixed(2)} ({isProfit ? '+' : ''}{todayPnlPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Open Trades</span>
          <span className="font-bold text-white">{openTrades}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-400">Margin Level</span>
          <span className="font-bold text-white">{marginLevel > 0 ? `${marginLevel.toFixed(2)}%` : '100.00%'}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-white/[0.06] pt-2.5 mb-2.5">
        <div className="text-[10px] text-zinc-400 font-mono mb-2">▼ Quick Actions</div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Trade', icon: '📊', href: '/' },
            { label: 'Analysis', icon: '📈', href: '/analytics' },
            { label: 'Scanner', icon: '🔍', href: '/scanner' },
            { label: 'Journal', icon: '📝', href: '/journal' },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg bg-[#14141a] hover:bg-[#1f1f26] border border-white/[0.06] hover:border-white/20 transition-all text-center"
            >
              <span className="text-sm">{action.icon}</span>
              <span className="text-[8px] text-zinc-400 font-mono font-bold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* View Portfolio Button */}
      <Link
        href="/portfolio"
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold shadow-md shadow-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <span>View Portfolio</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

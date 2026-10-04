'use client';

import React from 'react';
import { CompleteVolumeAnalysis } from '@/lib/volume/volume-types';
import { Activity, BarChart2, Zap, ShieldAlert, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface VolumeStatsProps {
  analysis: CompleteVolumeAnalysis | null;
  loading?: boolean;
}

export const VolumeStats: React.FC<VolumeStatsProps> = ({ analysis, loading }) => {
  if (loading || !analysis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-3 bg-surface-card border border-terminal-border rounded-xl animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/[0.03] rounded-lg"></div>
        ))}
      </div>
    );
  }

  const { currentProfile, vwap, delta, spike, absorption, confluence, newsLockActive, dataQuality } = analysis;

  const isPositiveDelta = delta.delta >= 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Top Warning Banner if News Lock Active */}
      {newsLockActive && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>NO-TRADE NEWS LOCK ACTIVE: High-impact release window. Volume execution paused.</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 uppercase tracking-widest">
            SAFETY GATE
          </span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 font-mono text-xs">
        {/* 1. POC (Point of Control) */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>POC (MAX VOL)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-sm font-bold text-amber-300 mt-1">
            {currentProfile.poc ? currentProfile.poc.toFixed(currentProfile.tickSize < 0.01 ? 5 : 2) : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Vol: {currentProfile.totalVolume.toLocaleString()}
          </div>
        </div>

        {/* 2. Value Area (VAH / VAL) */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>VALUE AREA 70%</span>
            <span className="text-cyan-400 text-[9px]">VAH/VAL</span>
          </div>
          <div className="text-xs font-bold text-cyan-300 mt-1 flex items-center justify-between">
            <span>H: {currentProfile.vah ? currentProfile.vah.toFixed(currentProfile.tickSize < 0.01 ? 5 : 2) : '—'}</span>
            <span>L: {currentProfile.val ? currentProfile.val.toFixed(currentProfile.tickSize < 0.01 ? 5 : 2) : '—'}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Dev POC: {currentProfile.developingPoc ? currentProfile.developingPoc.toFixed(currentProfile.tickSize < 0.01 ? 5 : 2) : '—'}
          </div>
        </div>

        {/* 3. VWAP & StdDev */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>SESSION VWAP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          </div>
          <div className="text-sm font-bold text-purple-300 mt-1">
            {vwap.vwap ? vwap.vwap.toFixed(currentProfile.tickSize < 0.01 ? 5 : 2) : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
            <span>±1σ: {vwap.upperBand1 ? vwap.upperBand1.toFixed(currentProfile.tickSize < 0.01 ? 4 : 1) : '—'}</span>
            <span>±2σ: {vwap.upperBand2 ? vwap.upperBand2.toFixed(currentProfile.tickSize < 0.01 ? 4 : 1) : '—'}</span>
          </div>
        </div>

        {/* 4. Order Flow Delta (Proxy/Estimated) */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>DELTA (PROXY)</span>
            {isPositiveDelta ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-400" />
            )}
          </div>
          <div className={`text-sm font-bold mt-1 ${isPositiveDelta ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositiveDelta ? `+${delta.delta}` : delta.delta}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
            <span className="text-emerald-400">{Math.round(delta.buyRatio * 100)}% B</span>
            <span className="text-slate-500 font-mono text-[9px]">{delta.methodology === 'ESTIMATED_QUOTE_RULE_PROXY' ? 'Quote Proxy' : 'Tick Proxy'}</span>
            <span className="text-red-400">{Math.round(delta.sellRatio * 100)}% S</span>
          </div>
        </div>

        {/* 5. Volume Spike Z-Score */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>VOL Z-SCORE</span>
            <span className={`px-1 rounded text-[8px] font-bold ${
              spike.classification === 'EXTREME' || spike.classification === 'SPIKE'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/10 text-emerald-300'
            }`}>
              {spike.classification}
            </span>
          </div>
          <div className="text-sm font-bold text-white mt-1">
            {spike.volumeZScore ? `${spike.volumeZScore > 0 ? '+' : ''}${spike.volumeZScore}σ` : '0.0σ'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {spike.isSpike ? '⚡ Spike Anomaly' : 'Normal Liquidity'}
          </div>
        </div>

        {/* 6. Institutional Confluence */}
        <div className="p-2.5 rounded-lg bg-surface border border-white/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>CONFLUENCE</span>
            <span className="text-[9px] text-terminal-cyan font-bold">{dataQuality.primarySource}</span>
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1 flex items-center gap-1">
            <span>{confluence.confluenceScore}/100</span>
            <span className="text-[10px] font-normal text-slate-400">({confluence.bias.replace('_', ' ')})</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {absorption.type !== 'NONE' ? `🚨 ${absorption.type.replace('_', ' ')}` : 'Order Flow Balanced'}
          </div>
        </div>
      </div>
    </div>
  );
};

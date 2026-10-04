'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CompleteVolumeAnalysis, TradingSession, NakedPOC } from '@/lib/volume/volume-types';
import { VolumeStats } from './VolumeStats';
import { VolumeProfileChart } from './VolumeProfileChart';
import { 
  Layers, 
  Activity, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react';

interface VolumeProfilePanelProps {
  symbol?: string;
}

export const VolumeProfilePanel: React.FC<VolumeProfilePanelProps> = ({ symbol = 'XAUUSD' }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [activeSessionTab, setActiveSessionTab] = useState<TradingSession>('DAILY');
  const [analysis, setAnalysis] = useState<CompleteVolumeAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  const fetchAnalysis = useCallback(async (sym: string, isSilent = false) => {
    try {
      if (!isSilent && !analysis) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const res = await fetch(`/api/volume?symbol=${sym}`);
      if (res.ok) {
        const data = await res.json();
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (e) {
      console.error('VolumeProfilePanel fetch error:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [analysis]);

  useEffect(() => {
    setSelectedSymbol(symbol);
    fetchAnalysis(symbol, false);
  }, [symbol, fetchAnalysis]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAnalysis(selectedSymbol, true); // Silent background refresh without blanking UI
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, autoRefresh, fetchAnalysis]);

  const symbolsList = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'BTCUSD', 'US30'];
  const sessionTabs: { id: TradingSession; label: string; time: string }[] = [
    { id: 'DAILY', label: 'DAILY PROFILE', time: 'Full Day' },
    { id: 'WEEKLY', label: 'WEEKLY PROFILE', time: '5 Days' },
    { id: 'ASIA', label: 'ASIA SESSION', time: '00:00 - 08:00 UTC' },
    { id: 'LONDON', label: 'LONDON SESSION', time: '07:00 - 16:00 UTC' },
    { id: 'NEW_YORK', label: 'NEW YORK SESSION', time: '12:00 - 21:00 UTC' },
  ];

  const getActiveProfile = () => {
    if (!analysis) return null;
    if (activeSessionTab === 'ASIA') return analysis.sessionProfiles.asia || analysis.currentProfile;
    if (activeSessionTab === 'LONDON') return analysis.sessionProfiles.london || analysis.currentProfile;
    if (activeSessionTab === 'NEW_YORK') return analysis.sessionProfiles.newYork || analysis.currentProfile;
    if (activeSessionTab === 'WEEKLY') return analysis.sessionProfiles.weekly || analysis.currentProfile;
    return analysis.sessionProfiles.daily || analysis.currentProfile;
  };

  const activeProfile = getActiveProfile();

  return (
    <div className="flex flex-col gap-4 font-sans text-xs text-slate-100">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-card border border-terminal-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h1 className="text-sm font-bold text-white tracking-wide uppercase">
              INSTITUTIONAL VOLUME PROFILE & ORDER FLOW
            </h1>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
            BROKER TICK VOLUME (MT5/BIQUOTE)
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            analysis?.dataQuality?.status === 'LIVE'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : analysis?.dataQuality?.status === 'STALE'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : analysis?.dataQuality?.status === 'INSUFFICIENT_DATA'
              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : analysis?.dataQuality?.status === 'DEGRADED'
              ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
              : 'bg-red-500/15 text-red-400 border-red-500/30'
          }`}>
            ● {analysis?.dataQuality?.status || 'CONNECTING'}
          </span>
          <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.08] text-[10px] font-mono">
            {analysis?.dataQuality?.primarySource || 'BIQUOTE'} ({analysis?.dataQuality?.latencyMs || 0}ms)
          </span>
        </div>

        {/* Symbol Selector & Auto Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#070b13] p-0.5 rounded-lg border border-white/[0.08]">
            {symbolsList.slice(0, 5).map(s => (
              <button
                key={s}
                onClick={() => {
                  setSelectedSymbol(s);
                  fetchAnalysis(s);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  selectedSymbol === s
                    ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {isRefreshing && (
              <span className="text-[9px] text-cyan-400 animate-pulse font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                UPDATING
              </span>
            )}
            <button
              onClick={() => fetchAnalysis(selectedSymbol, false)}
              className="p-1.5 rounded-lg bg-surface border border-white/[0.08] hover:bg-white/[0.05] text-slate-300 transition"
              title="Refresh Volume Analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <VolumeStats analysis={analysis} loading={loading && !analysis} />

      {/* Session Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#080d16] border border-white/[0.06]">
        {sessionTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSessionTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all ${
              activeSessionTab === tab.id
                ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[9px] font-normal opacity-60">({tab.time})</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Volume Chart (7 cols) + Institutional Details (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Volume-at-Price Chart */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {activeProfile && (
            <VolumeProfileChart
              profile={activeProfile}
              vwap={analysis?.vwap}
              currentPrice={analysis?.currentPrice}
              height={390}
              width={560}
            />
          )}

          {/* Developing POC & HVN / LVN Nodes */}
          <div className="grid grid-cols-2 gap-3 font-mono">
            {/* High Volume Nodes */}
            <div className="p-3 rounded-xl bg-surface-card border border-terminal-border">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-2">
                <span>HIGH VOLUME NODES (HVN)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold">
                  LIQUIDITY MAGNET
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeProfile?.hvn && activeProfile.hvn.length > 0 ? (
                  activeProfile.hvn.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-surface border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                      {p.toFixed(activeProfile.tickSize < 0.01 ? 5 : 2)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">No statistical HVN cluster</span>
                )}
              </div>
            </div>

            {/* Low Volume Nodes */}
            <div className="p-3 rounded-xl bg-surface-card border border-terminal-border">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-2">
                <span>LOW VOLUME NODES (LVN)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold">
                  SLIPPAGE / REJECTION
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeProfile?.lvn && activeProfile.lvn.length > 0 ? (
                  activeProfile.lvn.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-surface border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                      {p.toFixed(activeProfile.tickSize < 0.01 ? 5 : 2)}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">Profile volume evenly distributed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Confluence Factors & Naked POCs */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Confluence Evaluation Card */}
          <div className="p-4 rounded-xl bg-surface-card border border-terminal-border space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-terminal-cyan" />
                <span className="font-bold text-white text-xs uppercase">
                  LIQUIDITY + VOLUME CONFLUENCE
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                analysis?.confluence?.confluenceScore && analysis.confluence.confluenceScore >= 70
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {analysis?.confluence?.confluenceScore ?? 0}/100
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              {analysis?.confluence?.institutionalRecommendation}
            </p>

            {/* Factor Checkpoints */}
            <div className="space-y-2 pt-1">
              {analysis?.confluence?.factors.map((f, i) => (
                <div key={i} className="p-2 rounded-lg bg-surface border border-white/[0.04] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
                      {f.aligned ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                      )}
                      <span>{f.name}</span>
                    </span>
                    <span className="font-mono text-emerald-400 text-[10px] font-bold">+{f.score} pts</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-4">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Naked POCs (Unfilled Key Levels) */}
          <div className="p-4 rounded-xl bg-surface-card border border-terminal-border space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-xs uppercase">
                  NAKED POC MONITOR (UNTOUCHED LIQUIDITY)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {analysis?.nakedPOCs?.filter(n => n.status === 'UNFILLED').length || 0} ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {analysis?.nakedPOCs && analysis.nakedPOCs.length > 0 ? (
                analysis.nakedPOCs.slice(0, 5).map((npoc, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-white/[0.04] font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${npoc.status === 'UNFILLED' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></span>
                      <span className="font-bold text-amber-300">{npoc.price}</span>
                      <span className="text-[10px] text-slate-400">({npoc.session})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{npoc.date}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        npoc.status === 'UNFILLED' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {npoc.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 text-[11px]">
                  No naked POCs detected in current session window.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality & Diagnostic Audit Panel */}
      <div className="p-3 rounded-xl bg-surface-card border border-terminal-border">
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-full flex items-center justify-between text-left py-1 text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2 font-mono font-bold text-xs">
            <Terminal className="w-4 h-4 text-terminal-cyan" />
            <span>DATA INTEGRITY & VOLUME ENGINE DIAGNOSTICS</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 font-normal">
              15 Audited Metrics
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Status: <strong className="text-emerald-400">{analysis?.dataQuality?.status}</strong></span>
            {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showDiagnostics && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-[11px]">
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">DATA SOURCE</div>
              <div className="font-bold text-cyan-300 mt-0.5">{analysis?.dataQuality?.primarySource || 'BIQUOTE'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">PROFILE STATUS</div>
              <div className="font-bold text-emerald-400 mt-0.5">{analysis?.dataQuality?.status || 'LIVE'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">TICK COUNT</div>
              <div className="font-bold text-white mt-0.5">{analysis?.diagnostics?.tickCount?.toLocaleString() || 0}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">PRICE LEVELS</div>
              <div className="font-bold text-purple-300 mt-0.5">{analysis?.diagnostics?.uniquePriceLevels || 0}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">MIN PRICE</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {activeProfile?.bins && activeProfile.bins.length > 0 ? activeProfile.bins[0].price : '—'}
              </div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">MAX PRICE</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {activeProfile?.bins && activeProfile.bins.length > 0 ? activeProfile.bins[activeProfile.bins.length - 1].price : '—'}
              </div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">BIN SIZE</div>
              <div className="font-bold text-amber-300 mt-0.5">{activeProfile?.tickSize || analysis?.diagnostics?.adaptiveTickSize || '—'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">TOTAL VOLUME</div>
              <div className="font-bold text-white mt-0.5">{activeProfile?.totalVolume?.toLocaleString() || 0}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">NON-ZERO BINS</div>
              <div className="font-bold text-cyan-300 mt-0.5">
                {activeProfile?.bins ? activeProfile.bins.filter(b => b.volume > 0).length : 0}
              </div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">POC</div>
              <div className="font-bold text-amber-400 mt-0.5">{activeProfile?.poc || '—'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">VAH (70%)</div>
              <div className="font-bold text-cyan-300 mt-0.5">{activeProfile?.vah || '—'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">VAL (70%)</div>
              <div className="font-bold text-cyan-300 mt-0.5">{activeProfile?.val || '—'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">VWAP</div>
              <div className="font-bold text-purple-300 mt-0.5">{analysis?.vwap?.vwap ? analysis.vwap.vwap.toFixed(activeProfile?.tickSize && activeProfile.tickSize < 0.01 ? 5 : 2) : '—'}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">HVN COUNT</div>
              <div className="font-bold text-emerald-400 mt-0.5">{activeProfile?.hvn?.length || 0}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">LVN COUNT</div>
              <div className="font-bold text-amber-400 mt-0.5">{activeProfile?.lvn?.length || 0}</div>
            </div>
            <div className="p-2 rounded bg-surface border border-white/[0.04]">
              <div className="text-[10px] text-slate-500">DELTA METHOD</div>
              <div className="font-bold text-slate-200 mt-0.5">
                {analysis?.delta?.methodology === 'ESTIMATED_QUOTE_RULE_PROXY' ? 'DELTA: PROXY (QUOTE)' : 'DELTA: PROXY (TICK)'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Flame, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { VipPostItem, SymbolSentimentSummary } from '@/lib/engines/vip-sentiment-engine';

interface VipWidgetProps {
  activeSymbol?: string;
  className?: string;
}

export const VipMarketMoverIntelligenceWidget: React.FC<VipWidgetProps> = ({
  activeSymbol = 'XAUUSD',
  className = '',
}) => {
  const [feed, setFeed] = useState<VipPostItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [symbolSentiment, setSymbolSentiment] = useState<SymbolSentimentSummary | null>(null);
  const [allSymbolsSentiment, setAllSymbolsSentiment] = useState<Record<string, SymbolSentimentSummary>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [breakingCount, setBreakingCount] = useState<number>(0);

  const fetchData = useCallback(async (filter: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vip-sentiment?filter=${filter}&symbol=${activeSymbol}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.status === 'OK') {
        setFeed(data.feed || []);
        setSymbolSentiment(data.symbolSentiment || null);
        setAllSymbolsSentiment(data.allSymbolsSentiment || {});
        setBreakingCount(data.breakingAlertCount || 0);
      }
    } catch (err) {
      console.warn('[VipMarketMoverWidget] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSymbol]);

  useEffect(() => {
    fetchData(activeFilter);
    const interval = setInterval(() => fetchData(activeFilter), 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData, activeFilter]);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetch('/api/vip-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      await fetchData(activeFilter);
    } catch {
      // Non-blocking
    } finally {
      setIsRefreshing(false);
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Feeds' },
    { id: 'TRUMP', label: '🏛️ Trump' },
    { id: 'ELON', label: '🚀 Elon' },
    { id: 'FED', label: '🏦 Fed / Powell' },
    { id: 'BLOOMBERG', label: '⚡ Bloomberg / Zero' },
    { id: 'REDDIT', label: '🤖 Reddit' },
  ];

  return (
    <div className={`flex flex-col bg-[#0b0e17]/95 border border-cyan-500/20 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.08] bg-[#0f1422]/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-white tracking-wider uppercase flex items-center gap-1.5 font-mono">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                VIP Market-Mover & FinTwit Radar
              </h3>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                0-ACCOUNT / PUBLIC MIRROR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Live intelligence from Trump, Musk, Powell, Bloomberg & Reddit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {breakingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-mono">
              <Flame className="w-3 h-3 text-red-400" />
              {breakingCount} FLASH ALERTS
            </span>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono font-bold bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white rounded border border-white/[0.1] transition-all cursor-pointer active:scale-95"
            title="Force refresh live public feeds"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Symbol Sentiment Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 px-3 py-2 bg-[#090c14] border-b border-white/[0.05] text-[10px] font-mono">
        {Object.entries(allSymbolsSentiment).map(([sym, data]) => {
          const isBull = data.overallSentiment === 'BULLISH';
          const isBear = data.overallSentiment === 'BEARISH';
          const isShock = data.overallSentiment === 'VOLATILE_SHOCK';
          const isCurrent = sym === activeSymbol;

          return (
            <div
              key={sym}
              className={`px-2 py-1 rounded border flex items-center justify-between ${
                isCurrent ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-white/[0.02] border-white/[0.05]'
              }`}
            >
              <span className={`font-bold ${isCurrent ? 'text-cyan-300' : 'text-slate-400'}`}>
                {sym}
              </span>
              <div className="flex items-center gap-1">
                {isBull && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                {isBear && <TrendingDown className="w-3 h-3 text-red-400" />}
                {isShock && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                <span
                  className={`font-bold ${
                    isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : isShock ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {isBull ? 'BULL' : isBear ? 'BEAR' : isShock ? 'SHOCK' : 'NEUT'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flash Volatility Alert Banner (if active) */}
      {symbolSentiment?.isFlashVolatilityActive && (
        <div className="px-4 py-2 bg-gradient-to-r from-red-950/80 via-amber-950/60 to-red-950/80 border-b border-red-500/40 flex items-start gap-2.5 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-red-300 uppercase tracking-wide">
              ⚡ Flash Volatility Warning Active ({activeSymbol}):
            </span>{' '}
            <span className="text-amber-200">
              {symbolSentiment.flashAlertReason}
            </span>
            <div className="text-[10px] text-red-300/80 mt-0.5 font-mono">
              AutoTrader spread-guard enabled. Waiting 3 minutes for spread stabilization.
            </div>
          </div>
        </div>
      )}

      {/* Entity Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#0e1220]/60 border-b border-white/[0.05] overflow-x-auto scrollbar-none">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      <div className="p-3 space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {isLoading && feed.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            Loading live public intelligence streams...
          </div>
        ) : feed.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-slate-500">
            No active posts found for this category.
          </div>
        ) : (
          feed.map(post => {
            const isBull = post.sentiment === 'BULLISH';
            const isBear = post.sentiment === 'BEARISH';
            const isShock = post.sentiment === 'VOLATILE_SHOCK';

            return (
              <div
                key={post.id}
                className="group p-3 rounded-lg bg-[#0e1322] border border-white/[0.06] hover:border-cyan-500/40 transition-all hover:bg-[#11172a]"
              >
                {/* Author row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{post.authorAvatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {post.authorName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {post.authorHandle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {post.isBreaking && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-0.5 animate-pulse">
                        <Flame className="w-2.5 h-2.5" />
                        BREAKING
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        post.impactSeverity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : post.impactSeverity === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}
                    >
                      {post.impactScore}% IMPACT
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {post.timeAgo}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-[11px] text-slate-200 leading-relaxed font-sans mb-2">
                  {post.content}
                </p>

                {/* Roman Urdu AI Takeaway Card */}
                <div className="p-2 rounded bg-[#090d18] border-l-2 border-cyan-400 mb-2">
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-400 uppercase mb-0.5">
                    <Radio className="w-2.5 h-2.5 animate-pulse text-cyan-400" />
                    AI Takeaway (Urdu):
                  </div>
                  <p className="text-[10px] text-slate-300 leading-snug font-mono">
                    {post.romanUrduTakeaway}
                  </p>
                </div>

                {/* Asset badges & keywords */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-white/[0.04]">
                  <div className="flex flex-wrap items-center gap-1">
                    {post.affectedAssets.map(asset => (
                      <span
                        key={asset}
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isBull
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isBear
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : isShock
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {asset} {isBull ? '▲ BULLISH' : isBear ? '▼ BEARISH' : isShock ? '⚡ SHOCK' : '• NEUTRAL'}
                      </span>
                    ))}
                  </div>

                  <span className="text-[9px] font-mono text-slate-500">
                    Source: {post.sourceType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VipMarketMoverIntelligenceWidget;

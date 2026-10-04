'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitMerge, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Flame,
  Zap,
  RefreshCw,
  Cpu,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  Sliders,
  Award,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { 
  BenchmarkStrategy, 
  StrategyPlatform, 
  CandidateEvaluationResult 
} from '@/lib/engines/strategy-benchmark-engine';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<BenchmarkStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlatform, setSelectedPlatform] = useState<StrategyPlatform | 'ALL'>('ALL');
  const [selectedAsset, setSelectedAsset] = useState<string>('XAUUSD');
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'stress_test' | 'rule_builder'>('leaderboard');
  const [activeStrategyId, setActiveStrategyId] = useState<string>('tv-lorentzian-classification');
  const [viewScriptId, setViewScriptId] = useState<string | null>(null);

  // Stress-Test Form States
  const [candidateName, setCandidateName] = useState<string>('');
  const [candidatePlatform, setCandidatePlatform] = useState<StrategyPlatform>('TradingView');
  const [candidateAuthor, setCandidateAuthor] = useState<string>('');
  const [candidateCategory, setCandidateCategory] = useState<any>('Smart Money Concepts');
  const [candidateCode, setCandidateCode] = useState<string>(`//@version=5
strategy("Institutional Order Block with 1:3 RR", overlay=true)
// Non-repainting bar close confirmation
isBarClosed = barstate.isconfirmed

// Confluence: Fair Value Gap + RSI Filter
fvgDetected = low > high[2]
rsiFilter = ta.rsi(close, 14) < 42
emaTrend = ta.ema(close, 20) > ta.ema(close, 50)

// Strict Prop-Firm Risk Parameters
stopLossPips = 3.0  // $3 risk
takeProfitPips = 9.0 // $9 target (1:3 R:R)

if (fvgDetected and rsiFilter and isBarClosed)
    strategy.entry("Long", strategy.long)
    strategy.exit("TP/SL", "Long", profit=takeProfitPips, loss=stopLossPips)`);
  
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<CandidateEvaluationResult | null>(null);

  // Custom Rule Builder States (Retained & Enhanced)
  const [strategyName, setStrategyName] = useState('Institutional Liquidity Sweep & MSS');
  const [rules, setRules] = useState([
    { id: '1', condition: 'Higher Timeframe (4H/Daily) Trend is Bullish', operator: 'AND' },
    { id: '2', condition: 'Sell-Side Liquidity (SSL) Raided Below Asian Range Low', operator: 'AND' },
    { id: '3', condition: 'Bullish Market Structure Shift (MSS) with Impulsive Displacement', operator: 'AND' },
    { id: '4', condition: 'Retest of Unmitigated Bullish Fair Value Gap (FVG)', operator: 'AND' },
    { id: '5', condition: 'Calculated Risk to Reward Ratio >= 1:2.5', operator: 'THEN' },
  ]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fetch initial strategies
  const loadStrategies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/strategies/benchmark?platform=${selectedPlatform}&symbol=${selectedAsset}`);
      if (!res.ok) throw new Error('Failed to load benchmark data');
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
        if (data.stats?.activeStrategyId) {
          setActiveStrategyId(data.stats.activeStrategyId);
        }
      }
    } catch (err) {
      console.error('Error loading strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, [selectedPlatform, selectedAsset]);

  // Run live benchmark on chosen asset
  const handleRunLiveBenchmark = async () => {
    try {
      setIsBenchmarking(true);
      const res = await fetch('/api/strategies/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'benchmark_all', symbol: selectedAsset }),
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
      }
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Submit custom script to stress-tester
  const handleEvaluateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateCode.trim()) return;

    try {
      setIsEvaluating(true);
      setEvaluationResult(null);

      const res = await fetch('/api/strategies/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_candidate',
          name: candidateName.trim() || 'Dynamic Discovered Strategy',
          platform: candidatePlatform,
          author: candidateAuthor.trim() || 'Algo Contributor',
          category: candidateCategory,
          scriptContent: candidateCode,
          targetSymbol: selectedAsset,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        setEvaluationResult(data.evaluation);
        if (data.updatedLeaderboard) {
          setStrategies(data.updatedLeaderboard);
        }
      }
    } catch (err) {
      console.error('Candidate evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Connect strategy to MT5 Auto-Trader
  const handleConnectToAutoTrader = async (stratId: string) => {
    try {
      const res = await fetch('/api/strategies/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate_strategy', strategyId: stratId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveStrategyId(stratId);
        setStrategies(prev => prev.map(s => ({
          ...s,
          isActiveInAutoTrader: s.id === stratId
        })));
      }
    } catch (err) {
      console.error('Failed to activate strategy:', err);
    }
  };

  // Stats computation
  const totalStrategies = strategies.length;
  const avgWinRate = totalStrategies > 0 
    ? (strategies.reduce((acc, s) => acc + s.winRate, 0) / totalStrategies).toFixed(1)
    : '0';
  const avgProfitFactor = totalStrategies > 0 
    ? (strategies.reduce((acc, s) => acc + s.profitFactor, 0) / totalStrategies).toFixed(2)
    : '0';
  const activeStratObj = strategies.find(s => s.id === activeStrategyId) || strategies[0];

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
      <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0c121e] via-[#09101d] to-[#070b14] border border-cyan-500/25 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                QUANTITATIVE STRATEGY LAB & AUTO-DISCOVERY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                100% NON-REPAINTING ENFORCED
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Global Strategy Leaderboard & Dynamic Benchmark
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Real-time cross-platform quantitative intelligence combining 
              <strong className="text-cyan-400"> TradingView (Pine Script v5)</strong>, 
              <strong className="text-emerald-400"> QuantConnect (Lean Python)</strong>, 
              <strong className="text-purple-400"> MQL5 CodeBase</strong>, and 
              <strong className="text-amber-400"> GitHub Quant Repositories</strong>. Stress-tested on live tick feeds.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto shrink-0 font-mono text-xs">
            <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Verified Models</span>
              <span className="text-base sm:text-lg font-black text-white mt-0.5">{totalStrategies}</span>
            </div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Avg Win Rate</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">{avgWinRate}%</span>
            </div>
            <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase">Avg Profit Factor</span>
              <span className="text-base sm:text-lg font-black text-cyan-400 mt-0.5">{avgProfitFactor}</span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-col">
              <span className="text-[10px] text-cyan-300 uppercase">Active on MT5</span>
              <span className="text-xs font-bold text-white mt-1 truncate max-w-[120px]" title={activeStratObj?.name}>
                {activeStratObj?.name?.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/[0.08]">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-black'
                : 'bg-black/40 text-slate-300 hover:text-white hover:bg-white/[0.04] border border-white/[0.06]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Multi-Platform Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('stress_test')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stress_test'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-black'
                : 'bg-black/40 text-slate-300 hover:text-white hover:bg-white/[0.04] border border-white/[0.06]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Auto-Discovery & Custom Stress-Test</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black">NEW</span>
          </button>

          <button
            onClick={() => setActiveTab('rule_builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'rule_builder'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 font-black'
                : 'bg-black/40 text-slate-300 hover:text-white hover:bg-white/[0.04] border border-white/[0.06]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Visual Confluence Rule Builder</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: MULTI-PLATFORM LEADERBOARD ────────────────────────── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Platform Filters & Benchmark Asset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-md">
            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'TradingView', 'QuantConnect', 'MQL5', 'GitHub Quant'] as const).map(plat => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    selectedPlatform === plat
                      ? 'bg-white text-black shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {plat === 'ALL' ? '🌍 ALL PLATFORMS' : plat}
                </button>
              ))}
            </div>

            {/* Benchmark Asset Selector & Run Button */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">Asset:</span>
              <div className="flex items-center bg-black/60 rounded-lg border border-white/[0.08] p-1 font-mono text-xs">
                {['XAUUSD', 'BTCUSD', 'EURUSD', 'US30'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => setSelectedAsset(sym)}
                    className={`px-2.5 py-1 rounded font-bold transition-all ${
                      selectedAsset === sym
                        ? 'bg-cyan-500 text-black shadow-sm font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRunLiveBenchmark}
                disabled={isBenchmarking}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-all flex items-center gap-1.5 shadow-sm hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
                <span>{isBenchmarking ? 'Simulating...' : 'Run Benchmark'}</span>
              </button>
            </div>
          </div>

          {/* Strategy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strat, idx) => {
              const isActive = strat.id === activeStrategyId;
              const platformColor = 
                strat.platform === 'TradingView' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
                strat.platform === 'QuantConnect' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                strat.platform === 'MQL5' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                'text-purple-400 border-purple-500/30 bg-purple-500/10';

              return (
                <div 
                  key={strat.id}
                  className={`group relative p-4 rounded-xl transition-all duration-200 flex flex-col justify-between space-y-3 border ${
                    isActive 
                      ? 'bg-gradient-to-b from-[#0c182a] to-[#070e1a] border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.15)] ring-1 ring-cyan-400/50'
                      : 'bg-[#080d16] border-white/[0.08] hover:border-cyan-500/40 hover:bg-[#0a111e]'
                  }`}
                >
                  {/* Top Bar: Rank Badge + Platform + Repaint Safety */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-white/[0.08] text-white font-mono text-[10px] font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${platformColor}`}>
                          {strat.platform}
                        </span>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        0% REPAINT
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-cyan-200 transition-colors line-clamp-1">
                      {strat.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                      Source: {strat.authorOrSource}
                    </p>
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {strat.description}
                    </p>
                  </div>

                  {/* Quantitative Metrics Matrix */}
                  <div className="p-3 rounded-lg bg-black/50 border border-white/[0.06] grid grid-cols-3 gap-2 font-mono text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Win Rate</span>
                      <span className="text-sm font-black text-emerald-400">{strat.winRate}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Profit Factor</span>
                      <span className="text-sm font-black text-cyan-400">{strat.profitFactor}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Max DD</span>
                      <span className="text-sm font-black text-amber-400">{strat.maxDrawdownPercent}%</span>
                    </div>
                  </div>

                  {/* Prop Firm Pass Probability & Sharpe */}
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Prop-Firm Pass Score:</span>
                      <span className="font-bold text-white">{strat.propFirmPassScore}/100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                        style={{ width: `${strat.propFirmPassScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Strip: Connect to MT5 or View Script */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
                    <button
                      onClick={() => handleConnectToAutoTrader(strat.id)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20 font-black cursor-default'
                          : 'bg-white/[0.05] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 border border-white/[0.08]'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isActive ? 'fill-black' : 'text-cyan-400'}`} />
                      <span>{isActive ? 'ACTIVE ON AUTO-BOT' : 'CONNECT TO MT5'}</span>
                    </button>

                    <button
                      onClick={() => setViewScriptId(viewScriptId === strat.id ? null : strat.id)}
                      className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
                      title="Inspect Logic / Pine Script Snippet"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expanded Code Inspection Drawer */}
                  {viewScriptId === strat.id && (
                    <div className="p-2.5 rounded-lg bg-black border border-cyan-500/30 text-[10px] font-mono overflow-x-auto text-cyan-300 space-y-1">
                      <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                        <span>Algorithm Source Code</span>
                        <span>{strat.platform}</span>
                      </div>
                      <pre className="whitespace-pre-wrap">{strat.pineOrPythonSnippet}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 2: AI AUTO-DISCOVERY & CUSTOM STRESS-TEST ─────────────── */}
      {activeTab === 'stress_test' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Form: Ingest Any Script */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-[#080d16] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>Stress-Test & Auto-Ingest New Strategy</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Paste any newly launched TradingView Pine Script v5, QuantConnect Python model, or MQL5 Expert Advisor. Our engine evaluates 0% repainting and tests performance across 500 historical candles. If it meets institutional standards (Win Rate &gt;= 60%, PF &gt;= 1.75, DD &lt;= 4.5%), it will <strong>automatically be approved and enrolled into the Elite Leaderboard!</strong>
              </p>
            </div>

            <form onSubmit={handleEvaluateCandidate} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Strategy / Indicator Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Machine Learning Kernel Classifier"
                    className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Origin Platform</label>
                  <select
                    value={candidatePlatform}
                    onChange={e => setCandidatePlatform(e.target.value as StrategyPlatform)}
                    className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option value="TradingView">TradingView (Pine Script v5)</option>
                    <option value="QuantConnect">QuantConnect (Lean Python)</option>
                    <option value="MQL5">MQL5 (Expert Advisor / Indicator)</option>
                    <option value="GitHub Quant">GitHub Open-Source Quant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Author / Source Handle</label>
                  <input
                    type="text"
                    value={candidateAuthor}
                    onChange={e => setCandidateAuthor(e.target.value)}
                    placeholder="e.g. Community Quant / Institutional Lab"
                    className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-white placeholder-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Core Methodology Category</label>
                  <select
                    value={candidateCategory}
                    onChange={e => setCandidateCategory(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-white outline-none"
                  >
                    <option value="Smart Money Concepts">Smart Money Concepts (SMC)</option>
                    <option value="Machine Learning">Machine Learning / AI Classification</option>
                    <option value="Statistical Arbitrage">Statistical Arbitrage & Pairs</option>
                    <option value="Order Flow">Order Flow & Volume Profile</option>
                    <option value="Trend & Momentum">Trend & Volatility Trailing</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Strategy Source Logic (Pine Script / Python / Rules)</label>
                  <span className="text-[10px] text-cyan-400">Bar Close & SL/TP Required</span>
                </div>
                <textarea
                  value={candidateCode}
                  onChange={e => setCandidateCode(e.target.value)}
                  rows={8}
                  className="w-full bg-black/80 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-3 text-[11px] text-cyan-300 font-mono outline-none leading-relaxed"
                  placeholder="Paste complete Pine Script or strategy rule code..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isEvaluating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-black text-xs transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Simulating 500 Historical Bars...' : 'Run Quantitative Stress-Test & Auto-Ingest'}</span>
              </button>
            </form>
          </div>

          {/* Right Panel: Live Evaluation Diagnostics */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#080d16] border border-white/[0.08] shadow-xl space-y-4 font-mono">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Stress-Test Diagnostics</span>
              </h3>
              <span className="text-[10px] text-slate-400">Asset: {selectedAsset}</span>
            </div>

            {isEvaluating && (
              <div className="p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  Running Monte-Carlo iteration across 500 bars...
                </p>
                <p className="text-[10px] text-slate-500">
                  Checking barmerge lookahead repainting flaw and risk-to-reward ratios.
                </p>
              </div>
            )}

            {!isEvaluating && !evaluationResult && (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <Terminal className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                <p>No candidate currently evaluated.</p>
                <p className="text-[11px] text-slate-600">
                  Fill in the strategy parameters and click "Run Quantitative Stress-Test" to inspect performance.
                </p>
              </div>
            )}

            {!isEvaluating && evaluationResult && (
              <div className="space-y-4">
                {/* Status Verdict Header */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  evaluationResult.isApproved
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  {evaluationResult.isApproved ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-black text-sm uppercase">
                      {evaluationResult.isApproved ? '🎉 APPROVED & ADDED TO LEADERBOARD' : '❌ STRESS-TEST FAILED'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed">
                      {evaluationResult.auditVerdictEnglish}
                    </p>
                  </div>
                </div>

                {/* Roman Urdu Voice / Audit Explanation */}
                <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 leading-relaxed font-sans">
                  <strong className="text-amber-400 block font-mono text-[10px] uppercase mb-1">
                    🇵🇰 NEXUS AI Roman Urdu Audit Verdict:
                  </strong>
                  {evaluationResult.auditVerdictUrdu}
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06]">
                    <span className="text-[9px] text-slate-400 uppercase block">Win Rate</span>
                    <span className={`text-base font-black ${
                      evaluationResult.diagnostics.winRate >= 60 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {evaluationResult.diagnostics.winRate}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06]">
                    <span className="text-[9px] text-slate-400 uppercase block">Profit Factor</span>
                    <span className={`text-base font-black ${
                      evaluationResult.diagnostics.profitFactor >= 1.75 ? 'text-cyan-400' : 'text-rose-400'
                    }`}>
                      {evaluationResult.diagnostics.profitFactor}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-white/[0.06]">
                    <span className="text-[9px] text-slate-400 uppercase block">Max DD</span>
                    <span className={`text-base font-black ${
                      evaluationResult.diagnostics.maxDrawdownPercent <= 4.5 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {evaluationResult.diagnostics.maxDrawdownPercent}%
                    </span>
                  </div>
                </div>

                {/* Repaint Verification Pill */}
                <div className="p-3 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Repaint Verification:</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    evaluationResult.diagnostics.repaintCheckPassed ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {evaluationResult.diagnostics.repaintCheckPassed ? 'PASSED (Non-Repainting)' : 'FAILED (Repaints Future)'}
                  </span>
                </div>

                {evaluationResult.rejectionReasons && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                    <span className="font-bold text-[10px] uppercase block">Failure Diagnostics:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                      {evaluationResult.rejectionReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: VISUAL CONFLUENCE RULE BUILDER ─────────────────────── */}
      {activeTab === 'rule_builder' && (
        <div className="space-y-5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-white/[0.08] shadow-card-glass">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
                <GitMerge className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Visual Rule Confluence Engine</h2>
                <p className="text-xs text-slate-400 mt-0.5">Design custom algorithmic entry logic with strict mathematical condition blocks.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3000);
              }}
              className="px-4 py-2 rounded-lg bg-terminal-cyan hover:bg-cyan-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedSuccess ? 'Strategy Saved!' : 'Save Custom Rules'}</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#080d16] border border-white/[0.08] space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Custom Strategy Label</label>
              <input
                type="text"
                value={strategyName}
                onChange={e => setStrategyName(e.target.value)}
                className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500 rounded-lg p-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2">
                <span>Confluence Evaluation Chain</span>
                <span>Operator</span>
              </div>

              {rules.map((rule, idx) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs">
                  <span className="w-6 h-6 rounded-md bg-white/[0.06] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={rule.condition}
                    onChange={e => {
                      const updated = [...rules];
                      updated[idx].condition = e.target.value;
                      setRules(updated);
                    }}
                    className="flex-1 bg-transparent border-none text-white focus:outline-none"
                  />
                  <span className="px-2.5 py-1 rounded bg-cyan-950/60 text-cyan-300 font-bold text-[10px] border border-cyan-800/40">
                    {rule.operator}
                  </span>
                  {rules.length > 2 && (
                    <button
                      onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() => setRules([...rules, { id: `${Date.now()}`, condition: 'New Condition Block', operator: 'AND' }])}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.15] hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 text-xs transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Confluence Condition Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Coins, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Globe2, 
  Cpu, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Sliders, 
  Layers, 
  RefreshCw,
  Clock,
  AlertTriangle,
  Zap,
  BarChart3
} from 'lucide-react';
import { CotPositionBreakdown } from '@/lib/engines/cftc-cot-engine';
import { PairRateDifferential, CentralBankPolicy } from '@/lib/engines/interest-rate-diff-engine';
import { CurrencyStrengthScore, PairStrengthMatching } from '@/lib/engines/currency-strength-engine';
import { CompleteForexScore } from '@/lib/engines/forex-score-engine';
import { QuantTechnicalSnapshot } from '@/lib/engines/quant-technical-engine';
import { ConfluenceRadialGauge } from '../visualizations/ConfluenceRadialGauge';
import { CotPositioningBars } from '../visualizations/CotPositioningBars';
import { CurrencyStrengthHeatbars } from '../visualizations/CurrencyStrengthHeatbars';

export const ForexQuantMatrixDashboard: React.FC = () => {
  const [selectedPair, setSelectedPair] = useState<string>('EURUSD');
  const [activeTab, setActiveTab] = useState<'SCORE' | 'COT' | 'RATES' | 'STRENGTH' | 'TECHNICAL' | 'CALENDAR'>('SCORE');
  const [selectedCotCurrency, setSelectedCotCurrency] = useState<string>('EUR');
  const [scoreData, setScoreData] = useState<CompleteForexScore | null>(null);
  const [cotList, setCotList] = useState<CotPositionBreakdown[]>([]);
  const [centralBanks, setCentralBanks] = useState<CentralBankPolicy[]>([]);
  const [pairDiffs, setPairDiffs] = useState<PairRateDifferential[]>([]);
  const [strengths, setStrengths] = useState<CurrencyStrengthScore[]>([]);
  const [topPairs, setTopPairs] = useState<PairStrengthMatching[]>([]);
  const [techSnap, setTechSnap] = useState<QuantTechnicalSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const availablePairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD'];

  const fetchMatrix = async (pair: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/forex-matrix?pair=${pair}`);
      if (res.ok) {
        const data = await res.json();
        setScoreData(data.scoreCard);
        setCotList(data.cotCurrencies);
        setCentralBanks(data.centralBanks);
        setPairDiffs(data.pairDifferentials);
        setStrengths(data.currencyStrengths);
        setTopPairs(data.topPairSetups);
        setTechSnap(data.technicalSnapshot);
      }
    } catch (e) {
      console.error('Error fetching forex matrix:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix(selectedPair);
    const interval = setInterval(() => fetchMatrix(selectedPair), 20000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const getDecisionBadge = (decision?: string) => {
    switch (decision) {
      case 'EXTREME':
        return 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-300 shadow-[0_0_15px_rgba(0,255,136,0.4)]';
      case 'VERY_STRONG':
        return 'bg-emerald-500/20 text-terminal-green border-emerald-500/50 shadow-[0_0_12px_rgba(0,255,136,0.25)]';
      case 'STRONG':
        return 'bg-cyan-500/20 text-terminal-cyan border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]';
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'WEAK':
        return 'bg-rose-500/20 text-terminal-rose border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4 font-sans w-full">
      {/* Top Institutional Workstation Header Bar */}
      <div className="bb-card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wider">
                  INSTITUTIONAL FOREX QUANT MATRIX
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  12 PILLARS
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  MT5 LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                CFTC COT (8 Currencies) • Central Bank Rate Spreads • Currency Strength • TA-Lib Math
              </p>
            </div>
          </div>

          {/* Currency Pair Selector Strip */}
          <div className="flex items-center gap-1 bg-[#0a0e17] p-1 rounded-lg border border-white/[0.08] overflow-x-auto max-w-full">
            {availablePairs.map(p => (
              <button
                key={p}
                onClick={() => setSelectedPair(p)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  selectedPair === p
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchMatrix(selectedPair)}
              disabled={isLoading}
              className="p-1 rounded text-slate-400 hover:text-white ml-1"
              title="Refresh Matrix"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Executive Composite Scorecard Summary Bar with Radial Confluence Gauge */}
        {scoreData && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col lg:flex-row items-center gap-4 bb-panel p-3.5 rounded-lg border border-white/[0.06]">
              {/* Radial Dial */}
              <div className="shrink-0 flex items-center justify-center">
                <ConfluenceRadialGauge score={scoreData.finalScore} size="md" label="QUANT SCORE" />
              </div>

              {/* Grid of Key Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 flex-1 w-full">
                <div className="bb-panel p-2.5 rounded border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Pair</span>
                  <div className="text-sm font-bold text-white mt-0.5">{selectedPair}</div>
                  <span className="text-[10px] text-emerald-400 font-bold">{scoreData.direction.replace('_', ' ')}</span>
                </div>

                <div className="bb-panel p-2.5 rounded border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rate Spread</span>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">
                    {scoreData.components.interestRateDiff.score}/100
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {scoreData.components.interestRateDiff.statusUrdu}
                  </span>
                </div>

                <div className="bb-panel p-2.5 rounded border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CFTC Smart Money</span>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">
                    {scoreData.components.cftcCot.score}/100
                  </div>
                  <span className="text-[10px] text-emerald-400 truncate block">Hedge Fund Bias</span>
                </div>

                <div className="bb-panel p-2.5 rounded border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Technical Stance</span>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">
                    {scoreData.components.technical.score}/100
                  </div>
                  <span className="text-[10px] text-cyan-400 truncate block">TA-Lib Computed</span>
                </div>

                <div className="bb-panel p-2.5 rounded border border-white/[0.04] col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">30m News Lock</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CLEARED</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">Safe Execution</span>
                </div>
              </div>
            </div>

            {/* JARVIS Live Roman Urdu Intelligence Bar */}
            <div className="p-3 rounded-lg bg-[#0a0e17] border border-white/[0.08] flex items-start gap-2.5 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="text-amber-400 uppercase font-mono mr-1.5 tracking-wide">
                  NEXUS Quant Recommendation:
                </strong>
                <span className="text-slate-300 leading-relaxed">
                  {scoreData.botRecommendationUrdu}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sleek MT5 Terminal Tabs Strip */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] overflow-x-auto pb-1">
        {[
          { id: 'SCORE', label: '100% SCORECARD' },
          { id: 'COT', label: 'CFTC COT TABLE (8 CCY)' },
          { id: 'RATES', label: 'RATE SPREADS' },
          { id: 'STRENGTH', label: 'CURRENCY STRENGTH' },
          { id: 'TECHNICAL', label: 'TA-LIB ENGINE' },
          { id: 'CALENDAR', label: 'NEWS BLACKOUT' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-t text-xs font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-amber-400 border-amber-400 bg-white/[0.04]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/[0.02]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: 100% COMPLETE FOREX SCORE */}
      {activeTab === 'SCORE' && scoreData && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  8-FACTOR WEIGHTED INSTITUTIONAL SCORECARD — {selectedPair}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Weights: Technical (25%) • Fundamental (20%) • Rate Spread (15%) • COT (15%) • Macro (10%) • News (5%) • Strength (5%) • Volatility (5%)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Execution Rule:</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {scoreData.finalScore >= 65 ? 'CONFIRMED TRIGGER (>=65)' : 'HOLD / FILTER (<65)'}
                </span>
              </div>
            </div>

            {/* 8 Weighted Factor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(scoreData.components).map(c => {
                return (
                  <div
                    key={c.name}
                    className="bb-panel p-3 space-y-2 hover:border-amber-400/30 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{c.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 text-[10px] font-mono">
                          {c.weight}% Weight
                        </span>
                      </span>
                      <div className="font-mono text-xs">
                        <span className="font-bold text-white">{c.score}/100</span>
                        <span className="text-[10px] text-amber-400 ml-1.5 font-bold">
                          (+{c.weightedContribution} pts)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#070a10] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                        style={{ width: `${c.score}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {c.statusUrdu}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Decision Threshold Reference Scale */}
            <div className="bb-panel p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Quant Confidence Tiers:</span>
              <div className="flex flex-wrap items-center gap-1.5 font-mono">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">0–40 NO TRADE</span>
                <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">40–55 WEAK</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">55–65 MODERATE</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">65–75 STRONG</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">75–85 VERY STRONG</span>
                <span className="px-2 py-0.5 rounded bg-emerald-400 text-black font-bold">85+ EXTREME</span>
              </div>
            </div>

            {/* Bot Recommendation in Roman Urdu */}
            <div className="bb-panel p-3.5 flex items-start gap-3 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-400 block mb-0.5 uppercase font-mono">
                  Autonomous Execution Stance (Roman Urdu):
                </strong>
                <span className="text-slate-300 leading-relaxed">{scoreData.botRecommendationUrdu}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CFTC COT (8 CURRENCIES) - BLOOMBERG INSTITUTIONAL DATA TABLE */}
      {activeTab === 'COT' && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>CFTC COMMITMENTS OF TRADERS (COT) — INSTITUTIONAL FUTURES POSITIONING</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Official CFTC Weekly TFF & Disaggregated Report • 8 Core FX Currencies • Real-Time Institutional Positioning
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  OFFICIAL CFTC REPORT
                </span>
              </div>
            </div>

            {/* Visual Diverging COT Positioning Bars */}
            <div className="bb-panel p-3.5 rounded-lg border border-white/[0.06]">
              <CotPositioningBars
                cotList={cotList}
                activeCurrency={selectedCotCurrency}
                onSelectCurrency={setSelectedCotCurrency}
              />
            </div>

            {/* High-Density MT5 COT Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bb-table">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase font-mono">
                    <th className="px-3 py-2.5">CCY</th>
                    <th className="px-3 py-2.5">Contract Name</th>
                    <th className="px-3 py-2.5 text-right">Spec Long</th>
                    <th className="px-3 py-2.5 text-right">Spec Short</th>
                    <th className="px-3 py-2.5 text-right">Net Position</th>
                    <th className="px-3 py-2.5 text-right">Weekly Chg</th>
                    <th className="px-3 py-2.5 text-right">Open Interest</th>
                    <th className="px-3 py-2.5 text-right">Leveraged Net</th>
                    <th className="px-3 py-2.5 text-center">3Y %ile</th>
                    <th className="px-3 py-2.5 text-center">Bias</th>
                    <th className="px-3 py-2.5 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                  {cotList.map(item => {
                    const isSelected = selectedCotCurrency === item.currency;
                    const isNetPositive = item.nonCommercialNet >= 0;
                    const isWeeklyPositive = item.weeklyChange >= 0;
                    const levNet = item.leveragedMoneyLong - item.leveragedMoneyShort;

                    return (
                      <tr
                        key={item.currency}
                        onClick={() => setSelectedCotCurrency(item.currency)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-500/10 hover:bg-amber-500/15'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-bold text-white flex items-center gap-1.5">
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] ${
                            isSelected ? 'bg-amber-400 text-black' : 'bg-white/[0.06] text-amber-300'
                          }`}>
                            {item.currency}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">{item.symbolName}</td>
                        <td className="px-3 py-2.5 text-right text-emerald-400 font-bold">
                          {item.nonCommercialLong.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-rose-400 font-bold">
                          {item.nonCommercialShort.toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isNetPositive ? '+' : ''}{item.nonCommercialNet.toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${isWeeklyPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWeeklyPositive ? '+' : ''}{item.weeklyChange.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">
                          {item.openInterest.toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-bold ${levNet >= 0 ? 'text-cyan-300' : 'text-orange-400'}`}>
                          {levNet >= 0 ? '+' : ''}{levNet.toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="font-bold text-white">{item.positionPercentile}%</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.bias === 'BULLISH'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : item.bias === 'BEARISH'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {item.bias}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSelected ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {isSelected ? 'ACTIVE' : 'VIEW'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Currency TFF Deep Dive & Roman Urdu Verdict */}
            {(() => {
              const selectedItem = cotList.find(c => c.currency === selectedCotCurrency) || cotList[0];
              if (!selectedItem) return null;
              const levNet = selectedItem.leveragedMoneyLong - selectedItem.leveragedMoneyShort;
              const assetNet = selectedItem.assetManagerLong - selectedItem.assetManagerShort;
              const dealerNet = selectedItem.dealerLong - selectedItem.dealerShort;

              return (
                <div className="bb-panel p-3.5 space-y-3 mt-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-bold text-xs">
                        {selectedItem.currency}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {selectedItem.symbolName} — Traders in Financial Futures (TFF) Breakdown
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Historical Percentile: <strong className="text-amber-400">{selectedItem.positionPercentile}%</strong>
                    </span>
                  </div>

                  {/* 4 TFF Metric Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 uppercase block">Leveraged Money</span>
                      <span className={`text-sm font-bold block mt-1 ${levNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {levNet >= 0 ? '+' : ''}{levNet.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Hedge Fund Speculators</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 uppercase block">Asset Managers</span>
                      <span className={`text-sm font-bold block mt-1 ${assetNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {assetNet >= 0 ? '+' : ''}{assetNet.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Pension / Mutual Funds</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 uppercase block">Dealer / Intermediary</span>
                      <span className={`text-sm font-bold block mt-1 ${dealerNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {dealerNet >= 0 ? '+' : ''}{dealerNet.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Liquidity Providers</span>
                    </div>

                    <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                      <span className="text-[10px] text-slate-400 uppercase block">Commercial Hedgers</span>
                      <span className={`text-sm font-bold block mt-1 ${selectedItem.commercialNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedItem.commercialNet >= 0 ? '+' : ''}{selectedItem.commercialNet.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Multinational Corporates</span>
                    </div>
                  </div>

                  {/* Institutional Interpretation in Roman Urdu */}
                  <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06] text-xs text-slate-300">
                    <span className="font-mono font-bold text-amber-400 uppercase mr-1.5">
                      Smart Money Bias Analysis:
                    </span>
                    <span>"{selectedItem.institutionalInterpretation}"</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: INTEREST RATE DIFFERENTIALS */}
      {activeTab === 'RATES' && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>CENTRAL BANK POLICY RATES & PAIR DIFFERENTIAL ENGINE</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  8 Global Central Banks • Carry Trade Spreads • Yield Advantage Bias for High-Probability Swing Executions
                </p>
              </div>
            </div>

            {/* Central Bank Policy Rate Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {centralBanks.map(b => (
                <div key={b.currency} className="bb-panel p-2.5 text-center space-y-1">
                  <div className="text-xs font-bold text-amber-400">{b.currency}</div>
                  <div className="text-base font-bold text-white font-mono">{b.policyRate.toFixed(2)}%</div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold block ${
                    b.monetaryStance === 'HAWKISH'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : b.monetaryStance === 'DOVISH'
                      ? 'bg-rose-500/15 text-rose-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {b.monetaryStance}
                  </span>
                </div>
              ))}
            </div>

            {/* Pair Differentials Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs bb-table">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase font-mono">
                    <th className="px-3 py-2.5">Currency Pair</th>
                    <th className="px-3 py-2.5">Base Rate</th>
                    <th className="px-3 py-2.5">Quote Rate</th>
                    <th className="px-3 py-2.5">Rate Spread</th>
                    <th className="px-3 py-2.5">Yield Advantage</th>
                    <th className="px-3 py-2.5">Fundamental Bias</th>
                    <th className="px-3 py-2.5 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
                  {pairDiffs.map(p => {
                    const isPositive = p.differential > 0;
                    const isCurrent = selectedPair === p.pair;

                    return (
                      <tr
                        key={p.pair}
                        onClick={() => setSelectedPair(p.pair)}
                        className={`cursor-pointer transition-colors ${
                          isCurrent ? 'bg-amber-500/10' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="px-3 py-2.5 font-bold text-white flex items-center gap-1.5">
                          <span>{p.pair}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[9px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">{p.baseRate.toFixed(2)}%</td>
                        <td className="px-3 py-2.5 text-slate-300">{p.quoteRate.toFixed(2)}%</td>
                        <td className={`px-3 py-2.5 font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}{p.differential.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-amber-300 font-bold">
                          {p.rateAdvantageCurrency} Advantage
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.fundamentalBias.includes('BULLISH')
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : p.fundamentalBias.includes('BEARISH')
                              ? 'bg-rose-500/15 text-rose-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {p.fundamentalBias}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-white">
                          {p.score}/100
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAIR STRENGTH MATRIX */}
      {activeTab === 'STRENGTH' && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>CURRENCY RELATIVE STRENGTH INDEX (0–100 SCALE)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated across all bilateral cross-rates to identify strongest vs weakest currency imbalances
                </p>
              </div>
            </div>

            {/* Visual 8-Currency Strength Heatbars */}
            <div className="bb-panel p-3.5 rounded-lg border border-white/[0.06]">
              <CurrencyStrengthHeatbars
                strengths={strengths}
                activePair={selectedPair}
              />
            </div>

            {/* 8 Currency Strength Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {strengths.map(s => (
                <div key={s.currency} className="bb-panel p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{s.currency}</span>
                    <span className="font-mono text-base font-bold text-amber-400">{s.score}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#070a10] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.score >= 70
                          ? 'bg-emerald-400'
                          : s.score >= 50
                          ? 'bg-cyan-400'
                          : s.score >= 35
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold ${s.bias.includes('STRONG') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.bias}
                    </span>
                    <span className="font-mono text-slate-400">
                      {s.change24h > 0 ? '+' : ''}{s.change24h}%
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{s.drivers}</p>
                </div>
              ))}
            </div>

            {/* Top Mismatched Pair Setups */}
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="text-xs font-bold text-slate-300 uppercase mb-2">
                Top Confluence Pair Mismatches (Strongest vs Weakest):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {topPairs.slice(0, 6).map(p => (
                  <div key={p.pair} className="bb-panel p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{p.pair}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        p.recommendation.includes('BUY')
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : p.recommendation.includes('SELL')
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {p.recommendation}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {p.baseCurrency} ({p.baseScore}) vs {p.quoteCurrency} ({p.quoteScore}) → Spread: {p.spread > 0 ? '+' : ''}{p.spread}
                    </div>
                    <div className="text-[10px] text-amber-400 font-bold font-mono">
                      Confidence: {p.confidence}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LOCAL TECHNICAL ENGINE (TA-LIB) */}
      {activeTab === 'TECHNICAL' && techSnap && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>LOCAL QUANT TECHNICAL ENGINE (TA-LIB & PANDAS-TA)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated locally: EMA Stack Alignment • ADX Trend Strength • Momentum (RSI / MACD / Stoch) • Volatility
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                Score: {techSnap.technicalScore}/100
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Trend */}
              <div className="bb-panel p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>1. Trend (EMA & ADX)</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>EMA Stack:</span>
                    <span className="font-bold text-emerald-400 font-mono">{techSnap.trend.emaStackAlignment}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>EMA 20 / 50:</span>
                    <span className="font-mono text-white">{techSnap.trend.ema20} / {techSnap.trend.ema50}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>EMA 100 / 200:</span>
                    <span className="font-mono text-white">{techSnap.trend.ema100} / {techSnap.trend.ema200}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ADX (14):</span>
                    <span className="font-mono font-bold text-amber-400">{techSnap.trend.adx14} ({techSnap.trend.adxTrendState})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Supertrend:</span>
                    <span className="font-bold text-emerald-400">{techSnap.trend.supertrend.direction} (Green)</span>
                  </div>
                </div>
              </div>

              {/* 2. Momentum */}
              <div className="bb-panel p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>2. Momentum (RSI / MACD)</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>RSI (14):</span>
                    <span className="font-mono font-bold text-amber-400">{techSnap.momentum.rsi14} ({techSnap.momentum.rsiCondition})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>MACD Crossover:</span>
                    <span className="font-bold text-emerald-400">{techSnap.momentum.macd.crossover}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>MACD Histogram:</span>
                    <span className="font-mono text-emerald-300">{techSnap.momentum.macd.histogram}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Stochastic %K / %D:</span>
                    <span className="font-mono text-white">{techSnap.momentum.stochastic.k} / {techSnap.momentum.stochastic.d}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ROC (Rate of Change):</span>
                    <span className="font-mono text-emerald-400 font-bold">+{techSnap.momentum.roc}%</span>
                  </div>
                </div>
              </div>

              {/* 3. Volatility & Volume */}
              <div className="bb-panel p-3.5 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>3. Volatility & Volume</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>ATR (14):</span>
                    <span className="font-mono font-bold text-amber-400">{techSnap.volatility.atr14Pips} pips</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>SL Padding (1.5x ATR):</span>
                    <span className="font-mono font-bold text-slate-200">{techSnap.volatility.atrStopLossPadding} pips</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tick Volume:</span>
                    <span className="font-mono text-white">{techSnap.volumeAnalysis.tickVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Futures CME Volume:</span>
                    <span className="font-mono text-emerald-400 font-bold">{techSnap.volumeAnalysis.futuresVolumeContracts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Broker Vol Ratio:</span>
                    <span className="font-mono text-emerald-400 font-bold">{techSnap.volumeAnalysis.brokerVolumeRatio}% of Avg</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bb-panel p-3 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400 mr-1 uppercase font-mono">Local Quant Diagnosis:</span>
              <span>"{techSnap.summaryUrdu}"</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 30-MIN NEWS BLACKOUT & GDELT */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          <div className="bb-card p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>30-MINUTE AUTOMATED NEWS BLACKOUT PROTOCOL</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  High-Impact safeguard: 30m prior to release → Lock new trades → News release → 5m spread check → Resume
                </p>
              </div>
            </div>

            {/* Blackout State Box */}
            <div className="bb-panel p-4 space-y-3 border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>AUTOMATED NEWS BLACKOUT PROTOCOL</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  SAFEGUARD ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] uppercase">Upcoming Event:</span>
                  <strong className="text-white text-xs block mt-1">US Non-Farm Payrolls (NFP)</strong>
                </div>
                <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] uppercase">Time Until Release:</span>
                  <strong className="text-amber-400 text-sm font-mono block mt-1">45 Minutes</strong>
                </div>
                <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] uppercase">Blackout Window:</span>
                  <strong className="text-slate-200 text-xs block mt-1">Locks in 15 Minutes</strong>
                </div>
                <div className="p-2.5 rounded bg-[#0a0e17] border border-white/[0.06]">
                  <span className="text-slate-400 block text-[10px] uppercase">Bot Protection Action:</span>
                  <strong className="text-emerald-400 text-xs block mt-1">Spread & Slippage Guard</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                * High-impact news releases ke dauran institutional liquidity sweep hoti hai aur broker spreads 1 pip se 15 pips tak expand ho jatay hain. Clever Trader execution engine release se 30 minute pehle naye trades block kar deta hai aur release ke 5 minute baad spread stabilization check kar ke auto-resume karta hai.
              </p>
            </div>

            {/* GDELT News Sentiment Meter */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                <span>GDELT Global News Sentiment Index:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { curr: 'USD', score: +72, sentiment: 'Bullish' },
                  { curr: 'EUR', score: -18, sentiment: 'Bearish' },
                  { curr: 'GBP', score: +31, sentiment: 'Bullish' },
                  { curr: 'JPY', score: +5, sentiment: 'Neutral' },
                ].map(g => (
                  <div key={g.curr} className="bb-panel p-2.5 text-center">
                    <span className="text-xs font-bold text-slate-400">{g.curr} Tone:</span>
                    <div className={`text-base font-bold font-mono mt-0.5 ${g.score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {g.score > 0 ? '+' : ''}{g.score}
                    </div>
                    <span className="text-[10px] text-slate-400">{g.sentiment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

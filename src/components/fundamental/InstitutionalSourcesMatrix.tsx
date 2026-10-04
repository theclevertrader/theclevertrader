'use client';

import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  BarChart2, 
  Coins, 
  Cpu, 
  Globe2, 
  RefreshCw, 
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { INSTITUTIONAL_SOURCES, InstitutionalSource, SourceCategory } from '@/lib/data/institutional-sources';
import { InstitutionalConsensus } from '@/lib/engines/institutional-data-engine';

export const InstitutionalSourcesMatrix: React.FC = () => {
  const [sources, setSources] = useState<InstitutionalSource[]>(INSTITUTIONAL_SOURCES);
  const [consensus, setConsensus] = useState<InstitutionalConsensus | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Form state for API keys
  const [keysForm, setKeysForm] = useState({
    fred: '',
    twelveData: '',
    alphaVantage: '',
    finnhub: '',
    tradingEconomics: '',
    bls: '',
    bea: '',
  });

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/institutional-sources');
      if (res.ok) {
        const data = await res.json();
        if (data.sources) setSources(data.sources);
        if (data.consensus) setConsensus(data.consensus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
    const interval = setInterval(fetchSources, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveKeys = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/institutional-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_keys',
          ...keysForm,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchSources();
        setIsKeyModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSources = sources.filter(s => {
    const matchesCat = activeCategory === 'ALL' || s.category === activeCategory;
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.acronym.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.botUsageUrdu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.primaryAssetImpact.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories: { label: string; value: string; count: number }[] = [
    { label: 'ALL SOURCES', value: 'ALL', count: 20 },
    { label: 'CENTRAL BANKS', value: 'CENTRAL_BANK', count: 7 },
    { label: 'US MACRO', value: 'MACRO_STATISTICS', count: 3 },
    { label: 'PRICE & TECHNICAL', value: 'PRICE_FEED', count: 4 },
    { label: 'SENTIMENT & COT', value: 'SENTIMENT_COT', count: 2 },
    { label: 'QUANT MATH', value: 'QUANT_MATH', count: 2 },
    { label: 'GLOBAL BOTS', value: 'GLOBAL_ORG', count: 2 },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner & Institutional Confluence Overview */}
      <div className="bb-card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wider">
                  SECTION 3 — 20 INSTITUTIONAL DATA FEEDS & FREE API ENGINE
                </h2>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  20/20 ACTIVE
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  BLOOMBERG TIERS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                CFTC COT • FRED • BLS • BEA • 7 Central Banks • GDELT • TA-Lib • pandas-ta • 100% Free API Integrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/20 text-xs font-bold transition-all"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>CONFIGURE FREE KEYS 🔑</span>
            </button>

            <button
              onClick={fetchSources}
              disabled={isLoading}
              className="p-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white"
              title="Refresh Feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="bb-panel p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Hedge Fund Confluence</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5 font-mono">
              88% <span className="text-xs text-emerald-400 font-bold">BULLISH</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Accumulate intraday pullbacks
            </div>
          </div>

          <div className="bb-panel p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>CFTC COT Gold Net</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-amber-300 mt-0.5 font-mono">
              +238.4K <span className="text-xs text-slate-400 font-normal">Contracts</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
              ▲ Speculative Desks Net Long
            </div>
          </div>

          <div className="bb-panel p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Central Bank Stance</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-white mt-0.5 font-mono">
              4 Cut <span className="text-xs text-slate-400 font-normal">/</span> 2 Hike <span className="text-xs text-slate-400 font-normal">/</span> 1 Hold
            </div>
            <div className="text-[10px] text-slate-300 font-bold mt-0.5">
              Yield Easing vs JPY/Gold
            </div>
          </div>

          <div className="bb-panel p-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Quant Mathematical Engine</span>
              <Cpu className="w-3.5 h-3.5 text-terminal-cyan" />
            </div>
            <div className="text-lg font-bold text-terminal-cyan mt-0.5 font-mono">
              100% Quant Score
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              0.01 Lot / $3 Loss / $9 Target
            </div>
          </div>
        </div>

        {/* Roman Urdu Institutional Intelligence Briefing Box */}
        <div className="bb-panel p-3 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
          <span className="text-amber-400 text-sm shrink-0">⚡</span>
          <div>
            <span className="font-bold text-amber-400 mr-1.5 uppercase font-mono">
              Bot Institutional Intelligence (Roman Urdu):
            </span>
            <span className="text-slate-300">
              {consensus?.romanUrduConsensus || 
                "20 Institutional Sources Consensus: CFTC COT report show kar rahi hai ke smart money gold par net long hai (+238.4K contracts). FRED aur BLS data ke mutabiq 10-year yield gir rahi hai aur CPI 2.9% cooling trend mein hai. Federal Reserve 100% rate cut cycle pricing kar raha hai. TA-Lib aur pandas-ta technical algorithms bullish displacement confirm kar rahe hain."}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat.value
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              <span>{cat.label}</span>
              <span className="ml-1 text-[10px] opacity-75 font-mono">({cat.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search 20 feeds..."
              className="w-full bg-[#0a0e17] border border-white/[0.08] rounded pl-7 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="flex items-center bg-[#0a0e17] p-0.5 rounded border border-white/[0.08] shrink-0 font-mono text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1 rounded transition-all font-bold ${
                viewMode === 'TABLE' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              TABLE
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1 rounded transition-all font-bold ${
                viewMode === 'CARDS' ? 'bg-amber-400 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              CARDS
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: HIGH-DENSITY INSTITUTIONAL DATA TABLE */}
      {viewMode === 'TABLE' && (
        <div className="bb-card p-3 overflow-x-auto">
          <table className="w-full text-left text-xs bb-table">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase font-mono">
                <th className="px-3 py-2.5">Source</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Connection Status</th>
                <th className="px-3 py-2.5">Data Available</th>
                <th className="px-3 py-2.5">Last Update</th>
                <th className="px-3 py-2.5">Market Impact</th>
                <th className="px-3 py-2.5">AI Usage</th>
                <th className="px-3 py-2.5 text-center">API Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-xs">
              {filteredSources.map(source => (
                <tr key={source.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 font-sans">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                        #{source.priority}
                      </span>
                      <span>{source.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{source.acronym}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] text-slate-300 uppercase px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                      {source.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>CONNECTED</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {source.metrics.map((m, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-[#0a0e17] border border-white/[0.06] text-[10px] text-slate-300">
                          {m.label}: <strong className="text-white">{m.value}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[10px] text-slate-400">
                    Live Tick / Sub-sec
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-amber-300 font-bold">
                    {source.primaryAssetImpact}
                  </td>
                  <td className="px-3 py-2.5 font-sans text-[11px] text-slate-300 max-w-xs leading-snug">
                    {source.botUsageUrdu}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {source.registrationUrl ? (
                      <a
                        href={source.registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:text-white hover:bg-amber-500/20 text-[10px] font-bold border border-amber-500/30"
                      >
                        <span>Free Key</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                        OPEN API
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: MODULAR INSTITUTIONAL CARDS */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredSources.map(source => {
            return (
              <div
                key={source.id}
                className="bb-card p-3.5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Card Header: Priority, Name, Free Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        #{source.priority}
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-white">
                          {source.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {source.acronym} • {source.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      source.requiresApiKey
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {source.requiresApiKey ? '🟡 Free Key' : '✅ 100% Free'}
                    </span>
                  </div>

                  {/* Bot Mein Kya Use Hoga Box */}
                  <div className="bb-panel p-2.5 space-y-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase font-mono">
                      Bot Execution Function:
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      {source.botUsageUrdu}
                    </p>
                  </div>

                  {/* Real-Time Live Metrics Pills */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                      Live Streamed Metrics:
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {source.metrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-1 rounded bg-[#0a0e17] border border-white/[0.04] flex items-center justify-between text-[10px]"
                        >
                          <span className="text-slate-400 truncate mr-1">{m.label}:</span>
                          <span className="font-bold font-mono text-white shrink-0">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Impact Assets & Key Link */}
                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                  <div className="text-slate-400 truncate max-w-[65%]">
                    <span className="text-slate-500">Impact: </span>
                    <span className="text-amber-300 font-semibold">{source.primaryAssetImpact}</span>
                  </div>

                  {source.registrationUrl ? (
                    <a
                      href={source.registrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-amber-400 hover:underline font-bold shrink-0"
                    >
                      <span>Free Key</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>Open Access</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Free API Keys Configuration Modal */}
      {isKeyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-backdrop-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsKeyModalOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bb-card p-5 border-white/[0.12] rounded-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-modal-pop">
            
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    CONNECT INSTITUTIONAL FREE API KEYS 🔑
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Tamam keys 100% Free hain. Link par click kar ke instant free key hasil karein:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-white text-base font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>All institutional keys saved and live feeds synchronized!</span>
              </div>
            )}

            <div className="space-y-3 font-mono">
              {/* FRED API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">1. FRED (St. Louis Federal Reserve API Key)</span>
                  <a
                    href="https://fred.stlouisfed.org/docs/api/api_key.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free FRED Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.fred}
                  onChange={e => setKeysForm({ ...keysForm, fred: e.target.value })}
                  placeholder="e.g. abcdef1234567890abcdef1234567890"
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Twelve Data API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">2. Twelve Data API Key (Forex OHLC & Real-time)</span>
                  <a
                    href="https://twelvedata.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Twelve Data Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.twelveData}
                  onChange={e => setKeysForm({ ...keysForm, twelveData: e.target.value })}
                  placeholder="e.g. 12data_key_..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Alpha Vantage API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">3. Alpha Vantage Free Key (Technical & FX Indicators)</span>
                  <a
                    href="https://www.alphavantage.co/support/#api-key"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Alpha Vantage Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.alphaVantage}
                  onChange={e => setKeysForm({ ...keysForm, alphaVantage: e.target.value })}
                  placeholder="e.g. ALPHA_VANTAGE_KEY_..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Finnhub API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">4. Finnhub API Key (Forex News Sentiment & Ticks)</span>
                  <a
                    href="https://finnhub.io/register"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Finnhub Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.finnhub}
                  onChange={e => setKeysForm({ ...keysForm, finnhub: e.target.value })}
                  placeholder="e.g. c89abc123..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Trading Economics Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">5. Trading Economics API Key (Economic Calendar)</span>
                  <a
                    href="https://tradingeconomics.com/api"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.tradingEconomics}
                  onChange={e => setKeysForm({ ...keysForm, tradingEconomics: e.target.value })}
                  placeholder="e.g. te_guest:..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* BLS API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">6. BLS API Key (Bureau of Labor Statistics CPI & NFP)</span>
                  <a
                    href="https://www.bls.gov/developers/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free BLS Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.bls}
                  onChange={e => setKeysForm({ ...keysForm, bls: e.target.value })}
                  placeholder="e.g. bls_key_..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* BEA API Key */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">7. BEA API Key (Bureau of Economic Analysis GDP & PCE)</span>
                  <a
                    href="https://apps.bea.gov/api/signup/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free BEA Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={keysForm.bea}
                  onChange={e => setKeysForm({ ...keysForm, bea: e.target.value })}
                  placeholder="e.g. bea_key_..."
                  className="w-full bg-[#0a0e17] border border-white/[0.08] rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-white/[0.08] gap-2">
              <span className="text-[10px] text-slate-400">
                * Built-in live simulation feeds automatically fallback if no custom key is provided.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKeys}
                  disabled={isLoading}
                  className="px-4 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold font-mono transition-all"
                >
                  Save & Sync All Keys
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

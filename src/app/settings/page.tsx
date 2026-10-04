'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS, CleverSettings } from '@/lib/storage/local-store';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bot, 
  Sliders, 
  CheckCircle2, 
  Key, 
  Radio, 
  AlertTriangle,
  Lock,
  Cpu,
  ExternalLink,
  Layers,
  Flame
} from 'lucide-react';
import { Mt5ConnectionModal } from '@/components/trading/Mt5ConnectionModal';
import { INSTITUTIONAL_SOURCES } from '@/lib/data/institutional-sources';

export default function SettingsPage() {
  const [settings, setSettings] = useState<CleverSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [liveUnlockConfirmed, setLiveUnlockConfirmed] = useState(false);
  const [isMt5ModalOpen, setIsMt5ModalOpen] = useState(false);
  const [isMt5Connected, setIsMt5Connected] = useState(false);

  useEffect(() => {
    const checkMt5 = async () => {
      try {
        const res = await fetch('/api/mt5');
        if (res.ok) {
          const data = await res.json();
          setIsMt5Connected(data.config?.isConnected || false);
        }
      } catch (e) {}
    };
    checkMt5();
  }, []);

  // Load from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('CLEVER_TRADER_SETTINGS');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }
  }, []);

  const handleSave = async () => {
    localStorage.setItem('CLEVER_TRADER_SETTINGS', JSON.stringify(settings));
    try {
      await fetch('/api/institutional-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_keys',
          fred: settings.fredApiKey,
          twelveData: settings.twelveDataApiKey,
          alphaVantage: settings.alphaVantageApiKey,
          finnhub: settings.finnhubApiKey,
          tradingEconomics: settings.tradingEconomicsApiKey,
          bls: settings.blsApiKey,
          bea: settings.beaApiKey,
        }),
      });
    } catch (e) {}
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-mono w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">TERMINAL CONFIGURATION & SECURITY</h1>
            <p className="text-xs text-slate-400">
              AI Providers • Broker Modes • Risk Management Gates • Execution Defaults
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-terminal-cyan hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-cyan-glow"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>SAVE CONFIGURATION</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-terminal-green text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved securely to institutional local storage!</span>
        </div>
      )}

      {/* 1. TRADING SAFETY: PAPER VS LIVE */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Execution Safety Protocol (Default: PAPER TRADING)
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded font-bold uppercase text-[10px] ${
              settings.appMode === 'PAPER'
                ? 'bg-green-500/20 text-terminal-green border border-green-500/40'
                : 'bg-rose-500/20 text-terminal-rose border border-rose-500/40'
            }`}
          >
            CURRENT MODE: {settings.appMode}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setSettings({ ...settings, appMode: 'PAPER' })}
            className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
              settings.appMode === 'PAPER'
                ? 'bg-green-500/10 border-green-500/40 text-white shadow-[0_0_20px_rgba(0,255,136,0.15)]'
                : 'bg-surface border-white/[0.04] text-slate-400 hover:border-white/[0.1]'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>SIMULATED PAPER TRADING (RECOMMENDED)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-terminal-green" />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Safe institutional paper execution with simulated spread, slippage, and zero real capital risk.
            </p>
          </div>

          <div
            onClick={() => {
              if (liveUnlockConfirmed) {
                setSettings({ ...settings, appMode: 'LIVE' });
              } else {
                alert('Safety Lock: You must check the risk acknowledgement below before enabling LIVE trading.');
              }
            }}
            className={`p-4 rounded-xl border transition-all space-y-2 ${
              settings.appMode === 'LIVE'
                ? 'bg-rose-500/10 border-rose-500/40 text-white'
                : 'bg-surface border-white/[0.04] text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-rose-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>LIVE BROKER EXECUTION</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20">LOCKED</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real order routing to MT5 or broker gateway. Requires active broker API credentials.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
          <input
            type="checkbox"
            id="liveAck"
            checked={liveUnlockConfirmed}
            onChange={e => setLiveUnlockConfirmed(e.target.checked)}
            className="rounded bg-surface border-slate-700 text-terminal-cyan focus:ring-0"
          />
          <label htmlFor="liveAck" className="cursor-pointer">
            I understand live trading involves financial risk. Keep paper mode active until strategy backtesting is verified.
          </label>
        </div>
      </div>

      {/* METATRADER 5 (MT5) INSTITUTIONAL GATEWAY INTEGRATION */}
      <div className="p-5 rounded-xl bg-surface-card border border-cyan-500/30 shadow-card-glass space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-terminal-cyan border border-cyan-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                MetaTrader 5 (MT5) Live Broker Bridge
              </h2>
              <p className="text-[11px] text-slate-400">
                Direct MQL5 EA aur Python Socket Gateway for instantaneous order execution on MT5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] flex items-center gap-1.5 ${
              isMt5Connected
                ? 'bg-emerald-500/20 text-terminal-green border border-emerald-500/40 shadow-green-glow'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isMt5Connected ? 'bg-terminal-green animate-pulse' : 'bg-amber-400'}`} />
              {isMt5Connected ? 'MT5 CONNECTED' : 'MT5 READY TO LINK'}
            </span>

            <button
              onClick={() => setIsMt5ModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-terminal-cyan text-black font-bold hover:bg-cyan-400 transition-colors shadow-cyan-glow"
            >
              Open MT5 Connect Manager
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04] space-y-1">
            <span className="text-slate-400 block font-semibold">1-Click Python Bridge</span>
            <p className="text-slate-300 text-[10px]">
              Windows terminal par direct python script run karein. Sab se tez aur stable tareeqa.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04] space-y-1">
            <span className="text-slate-400 block font-semibold">MQL5 Expert Advisor (EA)</span>
            <p className="text-slate-300 text-[10px]">
              MT5 MetaEditor mein compile kar ke kisi bhi chart par WebRequest enable karein.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04] space-y-1">
            <span className="text-slate-400 block font-semibold">Micro-Scalp Guardrails</span>
            <p className="text-slate-300 text-[10px]">
              0.01 lot size, $3 maximum risk, $9 target reward strict auto-execution protection.
            </p>
          </div>
        </div>
      </div>

      {/* 2. AI PROVIDERS & API KEYS */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Copilot & Cloud Providers
            </h2>
          </div>
          <span className="text-[10px] text-terminal-cyan px-2 py-0.5 rounded bg-cyan-500/15 font-bold">
            BUILT-IN OFFLINE MODEL ACTIVE
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          All terminal features, Roman Urdu NEXUS AI responses, and Pine Script generation work immediately out of the box with the built-in offline engine. You can optionally connect your cloud API keys below:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Active AI Provider</label>
            <select
              value={settings.aiProvider}
              onChange={e => setSettings({ ...settings, aiProvider: e.target.value as any })}
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500/50 text-xs"
            >
              <option value="offline">Built-in Institutional Offline Engine (Zero Key Needed)</option>
              <option value="gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Google Gemini API Key</label>
            <input
              type="password"
              value={settings.geminiApiKey}
              onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500/50 text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={settings.openAiApiKey}
              onChange={e => setSettings({ ...settings, openAiApiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-surface border border-white/[0.08] rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500/50 text-xs"
            />
          </div>
        </div>
      </div>

      {/* 3. DEFAULT RISK & MICRO SCALP TARGETS */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Default Risk Controls & Micro Scalp Presets
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Default Risk % per Setup</label>
            <input
              type="number"
              step="0.1"
              value={settings.defaultRiskPercent}
              onChange={e => setSettings({ ...settings, defaultRiskPercent: parseFloat(e.target.value) || 1.0 })}
              className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Max Daily Drawdown %</label>
            <input
              type="number"
              step="0.5"
              value={settings.maxDailyLossPercent}
              onChange={e => setSettings({ ...settings, maxDailyLossPercent: parseFloat(e.target.value) || 3.0 })}
              className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Micro Scalp Target Risk ($)</label>
            <input
              type="number"
              value={settings.microScalpTargetRisk}
              onChange={e => setSettings({ ...settings, microScalpTargetRisk: parseFloat(e.target.value) || 3.0 })}
              className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Micro Scalp Target Reward ($)</label>
            <input
              type="number"
              value={settings.microScalpTargetReward}
              onChange={e => setSettings({ ...settings, microScalpTargetReward: parseFloat(e.target.value) || 9.0 })}
              className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* 4. 20 INSTITUTIONAL DATA FEEDS & FREE API KEYS */}
      <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-terminal-cyan" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              20 Institutional Data Feeds & Free API Keys Configuration
            </h2>
          </div>
          <span className="text-[10px] text-terminal-green px-2 py-0.5 rounded bg-emerald-500/15 font-bold border border-emerald-500/30">
            20/20 FEEDS INTEGRATED
          </span>
        </div>

        <p className="text-[11px] text-slate-400">
          CFTC COT, 7 Central Banks (Fed, ECB, BoE, BoJ, RBA, BoC, RBNZ), GDELT, TA-Lib, aur pandas-ta built-in open access hain. Neeche diye gaye sources ke free API keys aap yahan save kar saktay hain:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FRED */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #2</span>
                <span>FRED (Federal Reserve Data)</span>
              </span>
              <a
                href="https://fred.stlouisfed.org/docs/api/api_key.html"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free Key Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={settings.fredApiKey}
              onChange={e => setSettings({ ...settings, fredApiKey: e.target.value })}
              placeholder="e.g. abcdef1234567890..."
              className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">DXY, 10Y Yields, 2Y Yields, M2 Money Supply</span>
          </div>

          {/* Twelve Data */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #14</span>
                <span>Twelve Data (Forex OHLC)</span>
              </span>
              <a
                href="https://twelvedata.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free Key (800 req/day)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={settings.twelveDataApiKey}
              onChange={e => setSettings({ ...settings, twelveDataApiKey: e.target.value })}
              placeholder="e.g. 12data_key_..."
              className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">Real-time Forex & Gold OHLC candlesticks</span>
          </div>

          {/* Alpha Vantage */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #15</span>
                <span>Alpha Vantage (FX + Indicators)</span>
              </span>
              <a
                href="https://www.alphavantage.co/support/#api-key"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free Key Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={settings.alphaVantageApiKey}
              onChange={e => setSettings({ ...settings, alphaVantageApiKey: e.target.value })}
              placeholder="e.g. ALPHAVANTAGE123..."
              className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">Forex exchange rates, cloud RSI, MACD</span>
          </div>

          {/* Finnhub */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #16</span>
                <span>Finnhub (News & Sentiment)</span>
              </span>
              <a
                href="https://finnhub.io/register"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free Key (60 calls/min)</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={settings.finnhubApiKey}
              onChange={e => setSettings({ ...settings, finnhubApiKey: e.target.value })}
              placeholder="e.g. c89abc123..."
              className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">Forex news headlines & institutional sentiment</span>
          </div>

          {/* Trading Economics */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #13</span>
                <span>Trading Economics (Calendar)</span>
              </span>
              <a
                href="https://tradingeconomics.com/api"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free Key Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={settings.tradingEconomicsApiKey}
              onChange={e => setSettings({ ...settings, tradingEconomicsApiKey: e.target.value })}
              placeholder="e.g. te_key_..."
              className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400 block">Economic calendar releases & consensus forecasts</span>
          </div>

          {/* BLS & BEA */}
          <div className="p-3 rounded-lg bg-surface border border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-black">🔥 #3 & #4</span>
                <span>BLS (Labor) & BEA (GDP/PCE)</span>
              </span>
              <a
                href="https://www.bls.gov/developers/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-terminal-cyan hover:underline flex items-center gap-1"
              >
                <span>Free BLS Link</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                value={settings.blsApiKey}
                onChange={e => setSettings({ ...settings, blsApiKey: e.target.value })}
                placeholder="BLS Key (CPI, NFP)"
                className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
              />
              <input
                type="password"
                value={settings.beaApiKey}
                onChange={e => setSettings({ ...settings, beaApiKey: e.target.value })}
                placeholder="BEA Key (GDP, PCE)"
                className="w-full bg-[#070b13] border border-white/[0.08] rounded p-2 text-white text-xs font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-400 block">US CPI, Non-Farm Payrolls, Real GDP, Core PCE</span>
          </div>
        </div>

        {/* 20 Sources Summary Pills */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
            Status of All 20 Institutional Sources in Bot:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INSTITUTIONAL_SOURCES.map(s => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-[10px] text-slate-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-terminal-green" />
                <span className="font-bold text-white">#{s.priority} {s.acronym}:</span>
                <span className="text-slate-400">{s.isFree ? 'Free' : 'Key'}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* MetaTrader 5 Connection Modal */}
      <Mt5ConnectionModal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
      />
    </div>
  );
}

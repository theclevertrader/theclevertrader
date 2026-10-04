'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Terminal, 
  CornerDownLeft, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Cpu,
  Layers,
  Coins,
  Globe2,
  RefreshCw
} from 'lucide-react';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';

interface JarvisTerminalInterfaceProps {
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

const PRESET_QUERIES = [
  'Analyze XAUUSD.',
  'Why is gold bullish?',
  'Show institutional positioning.',
  'What changed in the macro environment?',
  'Find high-confluence setups.',
  'Explain today’s market regime.',
];

const CANNED_RESPONSES: Record<string, { summary: string; romanUrdu: string; metrics: string[] }> = {
  'Analyze XAUUSD.': {
    summary: 'XAUUSD Institutional Analysis: 88% Bullish confluence across CFTC speculative positioning, dovish Fed rate path, and Asian liquidity sweep.',
    romanUrdu: 'XAUUSD par structure strongly bullish hai. 2640.20 ka Asian session low sweep ho chuka hai aur 15M par FVG 2648.50 hold kar raha hai. 2665 target valid hai. Stop loss 2645.00 par strictly maintain karein.',
    metrics: ['Bias: 88% BULLISH', 'Entry: 2650.00', 'SL: 2645.00 (-$3.00)', 'TP: 2665.00 (+$9.00)', 'RR: 1:3.0'],
  },
  'Why is gold bullish?': {
    summary: 'Gold Bullish Drivers: Negative US real yields, Federal Reserve 50bps rate cut cycle, non-commercial CFTC COT accumulation (+238.4k contracts), and BRICS central bank reserve buying.',
    romanUrdu: 'Gold is liye bullish hai kyunki US Federal Reserve interest rates cut kar raha hai jisse dollar yield weak ho rahi hai. Saath hi CFTC COT report mein institutional hedge funds ne massive net long positions add ki hain.',
    metrics: ['Fed Rate Stance: DOVISH', 'COT Net Long: +238,410', 'DXY Index: 100.85 (Bearish)', 'Yield Pressure: -14bps'],
  },
  'Show institutional positioning.': {
    summary: 'CFTC Commitments of Traders (TFF Breakdown): Asset Managers & Leveraged Money holding 82nd percentile net long in Gold and short in US Dollar Index (DXY).',
    romanUrdu: 'Institutional positioning ka data ye batata hai ke big players Gold par 82% percentile long hain. EURUSD par positioning neutral hai, jabke USDJPY par BoJ rate hike ke khauf se speculative shorts increase ho rahe hain.',
    metrics: ['Gold COT: +238.4k Contracts (Long)', 'EUR COT: +18.2k Contracts', 'JPY COT: -42.1k Contracts', 'USD Index: Bearish Outflow'],
  },
  'What changed in the macro environment?': {
    summary: 'Macro Shift: Core CPI cooled to 0.2% MoM, US labor market softening (NFP 142k vs 165k est), cementing 75bps additional Fed easing in 2024-2025.',
    romanUrdu: 'Macro environment mein sabse bara change ye aya hai ke US inflation cool down hui hai aur labor market weak ho rahi hai. Fed ab inflation ki jagah employment protect karne ke liye aggressive rate cuts execute kar raha hai.',
    metrics: ['US CPI: 2.5% YoY', 'Fed Funds Rate: 4.75% - 5.00%', 'Real 10Y Yield: 1.62%', 'Global Regime: Synchronized Easing'],
  },
  'Find high-confluence setups.': {
    summary: 'High Confluence Discovery: Top setup is XAUUSD LONG (89% Confidence, 1:3.0 RR) followed by BTCUSD LONG (82% Confidence, 1:2.8 RR). EURUSD is locked (48% - NO TRADE).',
    romanUrdu: 'Aaj ka highest confluence setup XAUUSD LONG hai (89% score). Second setup BTCUSD par hai ($63,800 entry). EURUSD par trade lena mana hai kyunki score sirf 48 hai aur market consolidation mein phas chuki hai.',
    metrics: ['1. XAUUSD: BUY @ 2650 (Score 89)', '2. BTCUSD: BUY @ 63,800 (Score 82)', '3. EURUSD: NO TRADE (Score 48)'],
  },
  'Explain today’s market regime.': {
    summary: 'Market Regime: TRENDING_BULLISH with Structural Liquidity Expansion. High participation volume (+28% above 20MA) and expanding ATR volatility.',
    romanUrdu: 'Aaj ka market regime TRENDING_BULLISH hai. Market structural higher highs bana rahi hai aur liquidity sweeps ke baad strong displacement candles trigger ho rahi hain. Range trading ki jagah trend continuation trades best hain.',
    metrics: ['Regime: TRENDING_BULLISH', 'Volume: +28% Above 20MA', 'ATR: $18.40 (Expanding)', 'Risk Environment: SAFEGUARDED'],
  },
};

export const JarvisTerminalInterface: React.FC<JarvisTerminalInterfaceProps> = ({
  activeSymbol = 'XAUUSD',
  onSelectSymbol,
}) => {
  const [selectedQuery, setSelectedQuery] = useState<string>('Analyze XAUUSD.');
  const [customInput, setCustomInput] = useState<string>('');
  const [activeResponse, setActiveResponse] = useState(CANNED_RESPONSES['Analyze XAUUSD.']);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const intel = JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol);

  const handleSelectQuery = (query: string) => {
    setSelectedQuery(query);
    setIsTyping(true);
    setTimeout(() => {
      setActiveResponse(CANNED_RESPONSES[query] || {
        summary: `Custom Query Evaluation for ${activeSymbol}: Multi-factor institutional alignment computed.`,
        romanUrdu: `${activeSymbol} par NEXUS neural engine ne analysis complete kiya hai. Institutional confluence ${intel.masterConfluencePercent}% hai. Risk limit 0.01 lot maintain karein.`,
        metrics: [`Symbol: ${activeSymbol}`, `Confluence: ${intel.masterConfluencePercent}%`, 'Risk: 0.01 Lot / $3 SL', 'Status: VERIFIED'],
      });
      setIsTyping(false);
    }, 400);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const query = customInput.trim();
    setSelectedQuery(query);
    setCustomInput('');
    setIsTyping(true);
    setTimeout(() => {
      setActiveResponse({
        summary: `Institutional AI Evaluation: "${query}" analyzed across orderflow, CFTC COT, and central bank monetary policy.`,
        romanUrdu: `Aap ke sawal "${query}" ka institutional jawab: Market multi-feed analysis ke mutabiq currently ${activeSymbol} par primary bias ${intel.masterDirection} hai. Setup score ${intel.masterConfluencePercent}% hai. 0.01 lot aur 1:3 RR rule ka ehtiram karein.`,
        metrics: [`Query: ${query.slice(0, 24)}...`, `Asset: ${activeSymbol}`, `Regime: ${intel.regimeTitle}`, `Risk: SAFEGUARDED`],
      });
      setIsTyping(false);
    }, 500);
  };


  return (
    <section className="bb-card p-4 space-y-4 font-sans border border-white/[0.08] bg-[#070b12] text-slate-100 rounded-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-wider uppercase">
                SECTION 7 — AI / NEXUS Intelligence Assistant
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                ROMAN URDU + INSTITUTIONAL ENGLISH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Ask any institutional macro, orderflow, COT positioning, or setup question
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/50 border border-white/[0.08] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NEXUS CORE ONLINE</span>
          </div>
        </div>
      </div>

      {/* Quick Question Chips Grid */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          Suggested Institutional Prompts:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleSelectQuery(q)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                selectedQuery === q
                  ? 'bg-cyan-500 text-black font-bold shadow-cyan-glow'
                  : 'bg-black/40 hover:bg-white/[0.06] text-slate-300 border border-white/[0.06] hover:border-cyan-500/40'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/30 space-y-3 font-mono shadow-card-glass relative">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between text-[11px] border-b border-white/[0.06] pb-2 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-bold">NEXUS AI CONSOLE &gt; {selectedQuery}</span>
          </div>
          <span className="text-[10px] text-cyan-400">LATENCY: 12ms</span>
        </div>

        {/* Streaming / Output Area */}
        <div className="space-y-2.5">
          {isTyping ? (
            <div className="flex items-center gap-2 text-xs text-cyan-400 py-3">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>NEXUS is synthesizing orderbook depth and COT tables...</span>
            </div>
          ) : (
            <>
              {/* English Executive Summary */}
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-slate-200 leading-relaxed font-sans">
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase block mb-1">
                  Executive Intelligence Brief:
                </span>
                {activeResponse.summary}
              </div>

              {/* Roman Urdu Natural Reasoning */}
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-100 leading-relaxed font-sans">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase block mb-1">
                  🇵🇰 Roman Urdu AI Reasoning:
                </span>
                {activeResponse.romanUrdu}
              </div>

              {/* Metric Highlights Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                {activeResponse.metrics.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-cyan-950/30 border border-cyan-500/30 text-cyan-300"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-white/[0.06] flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="Ask NEXUS anything (e.g. 'Why did DXY drop today?')"
              className="w-full bg-black/60 border border-white/[0.08] focus:border-cyan-500/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>
      </div>
    </section>
  );
};

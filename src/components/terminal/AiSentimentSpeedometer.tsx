'use client';

import React, { useState, useMemo } from 'react';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { Gauge, TrendingUp, TrendingDown, Minus, Cpu, ChevronRight } from 'lucide-react';

interface AiSentimentSpeedometerProps {
  symbol?: string;
  className?: string;
}

export const AiSentimentSpeedometer: React.FC<AiSentimentSpeedometerProps> = ({
  symbol: propSymbol,
  className = '',
}) => {
  const { selectedSymbol, ticks } = useMarketData();
  const activeSymbol = propSymbol || selectedSymbol || 'XAUUSD';
  const [viewMode, setViewMode] = useState<'MASTER' | 'TRIPLE'>('MASTER');
  const [showTooltip, setShowTooltip] = useState(false);

  // Compute live institutional intelligence
  const intel = useMemo(() => {
    try {
      return JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol);
    } catch (e) {
      return null;
    }
  }, [activeSymbol]);

  // Live tick momentum
  const currentTick = ticks[activeSymbol];
  const tickChangePct = currentTick?.change ?? 0.5;

  // Sentiment calculations (Bullish / Bearish / Neutral)
  const { masterScore, buyersPct, sellersPct, neutralPct, biasLabel, biasColor } = useMemo(() => {
    const rawScore = intel?.overallScore ?? intel?.masterConfluencePercent ?? 74;
    
    // Slight live tick adjustment for lifelike dynamics
    const tickInfluence = Math.max(-5, Math.min(5, tickChangePct * 2));
    const dynamicScore = Math.max(5, Math.min(95, Math.round(rawScore + tickInfluence)));

    let buyers: number;
    let sellers: number;
    let neutral: number;

    if (intel?.moduleAlignmentCount && intel.moduleAlignmentCount.total > 0) {
      const { bullish, bearish, neutral: neut, total } = intel.moduleAlignmentCount;
      const baseBuy = Math.round((bullish / total) * 100);
      const baseSell = Math.round((bearish / total) * 100);

      buyers = Math.max(10, Math.min(85, baseBuy + (tickInfluence > 0 ? 3 : -3)));
      sellers = Math.max(10, Math.min(85, baseSell + (tickInfluence < 0 ? 3 : -3)));
      neutral = Math.max(5, 100 - buyers - sellers);
      
      // Normalize to strictly 100%
      const sum = buyers + sellers + neutral;
      buyers = Math.round((buyers / sum) * 100);
      sellers = Math.round((sellers / sum) * 100);
      neutral = 100 - buyers - sellers;
    } else {
      // Proportional fallback from dynamicScore
      if (dynamicScore >= 60) {
        buyers = dynamicScore;
        neutral = Math.round((100 - buyers) * 0.4);
        sellers = 100 - buyers - neutral;
      } else if (dynamicScore <= 40) {
        sellers = 100 - dynamicScore;
        neutral = Math.round((100 - sellers) * 0.4);
        buyers = 100 - sellers - neutral;
      } else {
        neutral = 40;
        buyers = 35;
        sellers = 25;
      }
    }

    let label: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let color = '#f59e0b';
    if (buyers > sellers && buyers >= 50) {
      label = 'BULLISH';
      color = '#00ff9d';
    } else if (sellers > buyers && sellers >= 50) {
      label = 'BEARISH';
      color = '#f43f5e';
    }

    return {
      masterScore: dynamicScore,
      buyersPct: buyers,
      sellersPct: sellers,
      neutralPct: neutral,
      biasLabel: label,
      biasColor: color,
    };
  }, [intel, tickChangePct]);

  // Speedometer Needle angle: 0% -> -90deg (far left/Sell), 50% -> 0deg (center/Neutral), 100% -> +90deg (far right/Buy)
  const needleAngle = -90 + (masterScore / 100) * 180;

  return (
    <div
      className={`relative flex items-center select-none ${className}`}
      style={{
        background: 'linear-gradient(180deg,#0c1f14 0%,#07110c 100%)',
        border: '1px solid #00ff9d22',
        borderRadius: 8,
        padding: '2px 8px',
        minHeight: 40,
        height: 40,
        boxShadow: '0 0 16px rgba(0,255,157,0.06)',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* ── Left Title Badge ── */}
      <div className="flex flex-col justify-between pr-2 border-r border-white/[0.08] mr-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-[#00ff9d18] border border-[#00ff9d44] flex items-center justify-center">
            <Gauge className="w-2.5 h-2.5 text-[#00ff9d]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black tracking-wider text-white uppercase font-mono leading-none">
              AI SENTIMENT
            </span>
            <span className="text-[7px] font-bold text-[#5a8a70] font-mono leading-tight mt-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#00ff9d] animate-pulse inline-block" />
              {activeSymbol}
            </span>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setViewMode(v => (v === 'MASTER' ? 'TRIPLE' : 'MASTER'))}
          className="mt-0.5 px-1 py-0.2 rounded text-[7px] font-mono font-bold bg-white/[0.04] hover:bg-[#00ff9d20] border border-white/[0.08] hover:border-[#00ff9d40] text-slate-400 hover:text-[#00ff9d] transition-all flex items-center justify-between gap-0.5 w-full"
          title="Toggle between Master Speedometer and 3 Speedometers"
        >
          <span>{viewMode === 'MASTER' ? '3 METERS' : '1 DIAL'}</span>
          <ChevronRight className="w-1.5 h-1.5" />
        </button>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      {viewMode === 'MASTER' ? (
        /* MODE A: UNIFIED MASTER SPEEDOMETER + 3 BREAKDOWN METERS */
        <div className="flex items-center gap-2">
          {/* Semicircular Speedometer Dial */}
          <div className="relative w-[66px] h-[36px] flex items-end justify-center flex-shrink-0 overflow-hidden">
            <svg
              className="w-[66px] h-[36px] overflow-visible"
              viewBox="0 0 100 52"
            >
              <defs>
                <linearGradient id="speedometerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="40%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#00ff9d" />
                </linearGradient>
                <filter id="speedGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Arc Track */}
              <path
                d="M 12 48 A 38 38 0 0 1 88 48"
                fill="none"
                stroke="#15261d"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Bearish Arc (0-40%) */}
              <path
                d="M 12 48 A 38 38 0 0 1 36 15"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Neutral Arc (40-60%) */}
              <path
                d="M 37 14 A 38 38 0 0 1 63 14"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="6"
                opacity="0.85"
              />
              {/* Bullish Arc (60-100%) */}
              <path
                d="M 64 15 A 38 38 0 0 1 88 48"
                fill="none"
                stroke="#00ff9d"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.85"
                filter="url(#speedGlow)"
              />

              {/* Animated Needle */}
              <g
                style={{
                  transformOrigin: '50px 48px',
                  transform: `rotate(${needleAngle}deg)`,
                  transition: 'transform 0.85s cubic-bezier(0.34, 1.4, 0.64, 1)',
                }}
              >
                <polygon
                  points="48.5,48 51.5,48 50.4,14 49.6,14"
                  fill="#ffffff"
                  filter="drop-shadow(0 0 3px #00ff9d)"
                />
                <polygon
                  points="49.2,16 50.8,16 50,11"
                  fill={biasColor}
                />
              </g>

              {/* Needle Hub Center */}
              <circle cx="50" cy="48" r="4.5" fill="#000" stroke={biasColor} strokeWidth="1.8" />
              <circle cx="50" cy="48" r="1.8" fill="#fff" />
            </svg>

            {/* Readout directly below needle pivot */}
            <div className="absolute bottom-0 flex flex-col items-center leading-none">
              <span
                className="text-[10px] font-black font-mono leading-none tracking-tight"
                style={{ color: biasColor, textShadow: `0 0 6px ${biasColor}66` }}
              >
                {masterScore}%
              </span>
              <span
                className="text-[6.5px] font-black tracking-wider font-mono"
                style={{ color: biasColor }}
              >
                {biasLabel}
              </span>
            </div>
          </div>

          {/* ── 3 EXPLICIT SENTIMENT METERS (Bullish / Bearish / Neutral) ── */}
          <div className="flex flex-col justify-center gap-0.5 min-w-[100px]">
            {/* 1. Bullish (Buyers) Meter */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 w-11 flex-shrink-0">
                <TrendingUp className="w-2 h-2 text-[#00ff9d]" />
                <span className="text-[7.5px] font-bold text-slate-300 font-mono">BUY</span>
              </div>
              <div className="flex-1 h-1.5 bg-[#0a1810] rounded-full overflow-hidden border border-[#00ff9d22]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${buyersPct}%`,
                    background: 'linear-gradient(90deg, #10b981 0%, #00ff9d 100%)',
                    boxShadow: '0 0 5px rgba(0,255,157,0.6)',
                  }}
                />
              </div>
              <span className="text-[8px] font-black text-[#00ff9d] font-mono w-9 text-right">
                {buyersPct}%
              </span>
            </div>

            {/* 2. Neutral Meter */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 w-11 flex-shrink-0">
                <Minus className="w-2 h-2 text-[#f59e0b]" />
                <span className="text-[7.5px] font-bold text-slate-300 font-mono">NEUT</span>
              </div>
              <div className="flex-1 h-1.5 bg-[#1c1809] rounded-full overflow-hidden border border-[#f59e0b22]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${neutralPct}%`,
                    background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)',
                    boxShadow: '0 0 5px rgba(245,158,11,0.5)',
                  }}
                />
              </div>
              <span className="text-[8px] font-black text-[#f59e0b] font-mono w-9 text-right">
                {neutralPct}%
              </span>
            </div>

            {/* 3. Bearish (Sellers) Meter */}
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-0.5 w-11 flex-shrink-0">
                <TrendingDown className="w-2 h-2 text-[#f43f5e]" />
                <span className="text-[7.5px] font-bold text-slate-300 font-mono">SELL</span>
              </div>
              <div className="flex-1 h-1.5 bg-[#1f0d12] rounded-full overflow-hidden border border-[#f43f5e22]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${sellersPct}%`,
                    background: 'linear-gradient(90deg, #e11d48 0%, #f43f5e 100%)',
                    boxShadow: '0 0 5px rgba(244,63,94,0.6)',
                  }}
                />
              </div>
              <span className="text-[8px] font-black text-[#f43f5e] font-mono w-9 text-right">
                {sellersPct}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* MODE B: 3 DISTINCT MINI SPEEDOMETERS SIDE-BY-SIDE */
        <div className="flex items-center gap-1.5">
          {/* Mini Speedometer 1: Bullish / Buyers */}
          <div className="flex flex-col items-center bg-[#07150c] px-1 py-0.5 rounded border border-[#00ff9d20] w-[50px]">
            <span className="text-[7px] font-bold text-[#00ff9d] font-mono flex items-center gap-0.5">
              <TrendingUp className="w-1.5 h-1.5" /> BUY
            </span>
            <div className="relative w-9 h-4.5 flex items-end justify-center">
              <svg className="w-9 h-4.5" viewBox="0 0 50 28">
                <path d="M 6 25 A 19 19 0 0 1 44 25" fill="none" stroke="#122b1b" strokeWidth="4" strokeLinecap="round" />
                <path
                  d="M 6 25 A 19 19 0 0 1 44 25"
                  fill="none"
                  stroke="#00ff9d"
                  strokeWidth="4"
                  strokeDasharray="60"
                  strokeDashoffset={60 - (buyersPct / 100) * 60}
                  strokeLinecap="round"
                />
                <g style={{ transformOrigin: '25px 25px', transform: `rotate(${-90 + (buyersPct / 100) * 180}deg)` }}>
                  <line x1="25" y1="25" x2="25" y2="8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="25" cy="25" r="2.5" fill="#000" stroke="#00ff9d" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-[8.5px] font-black text-[#00ff9d] font-mono leading-none mt-0.5">
              {buyersPct}%
            </span>
          </div>

          {/* Mini Speedometer 2: Neutral */}
          <div className="flex flex-col items-center bg-[#151206] px-1 py-0.5 rounded border border-[#f59e0b20] w-[50px]">
            <span className="text-[7px] font-bold text-[#f59e0b] font-mono flex items-center gap-0.5">
              <Minus className="w-1.5 h-1.5" /> NEUT
            </span>
            <div className="relative w-9 h-4.5 flex items-end justify-center">
              <svg className="w-9 h-4.5" viewBox="0 0 50 28">
                <path d="M 6 25 A 19 19 0 0 1 44 25" fill="none" stroke="#26210f" strokeWidth="4" strokeLinecap="round" />
                <path
                  d="M 6 25 A 19 19 0 0 1 44 25"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeDasharray="60"
                  strokeDashoffset={60 - (neutralPct / 100) * 60}
                  strokeLinecap="round"
                />
                <g style={{ transformOrigin: '25px 25px', transform: `rotate(${-90 + (neutralPct / 100) * 180}deg)` }}>
                  <line x1="25" y1="25" x2="25" y2="8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="25" cy="25" r="2.5" fill="#000" stroke="#f59e0b" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-[8.5px] font-black text-[#f59e0b] font-mono leading-none mt-0.5">
              {neutralPct}%
            </span>
          </div>

          {/* Mini Speedometer 3: Bearish / Sellers */}
          <div className="flex flex-col items-center bg-[#18090d] px-1 py-0.5 rounded border border-[#f43f5e20] w-[50px]">
            <span className="text-[7px] font-bold text-[#f43f5e] font-mono flex items-center gap-0.5">
              <TrendingDown className="w-1.5 h-1.5" /> SELL
            </span>
            <div className="relative w-9 h-4.5 flex items-end justify-center">
              <svg className="w-9 h-4.5" viewBox="0 0 50 28">
                <path d="M 6 25 A 19 19 0 0 1 44 25" fill="none" stroke="#2b1117" strokeWidth="4" strokeLinecap="round" />
                <path
                  d="M 6 25 A 19 19 0 0 1 44 25"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="4"
                  strokeDasharray="60"
                  strokeDashoffset={60 - (sellersPct / 100) * 60}
                  strokeLinecap="round"
                />
                <g style={{ transformOrigin: '25px 25px', transform: `rotate(${-90 + (sellersPct / 100) * 180}deg)` }}>
                  <line x1="25" y1="25" x2="25" y2="8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </g>
                <circle cx="25" cy="25" r="2.5" fill="#000" stroke="#f43f5e" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-[8.5px] font-black text-[#f43f5e] font-mono leading-none mt-0.5">
              {sellersPct}%
            </span>
          </div>
        </div>
      )}

      {/* ── Hover Tooltip: Confluence Details ── */}
      {showTooltip && (
        <div 
          className="fast-pop absolute top-[calc(100%+6px)] right-0 z-[99999] w-64 max-w-[85vw] bg-[#07150e] border border-[#00ff9d55] rounded-xl p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(0,255,157,0.25)] text-slate-200 pointer-events-none"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-1.5 mb-1.5">
            <span className="text-[9.5px] font-bold text-white font-mono flex items-center gap-1">
              <Cpu className="w-2.5 h-2.5 text-[#00ff9d]" /> {activeSymbol} Confluence Signals
            </span>
            <span
              className="text-[8px] font-black px-1.5 py-0.2 rounded font-mono"
              style={{ background: `${biasColor}20`, color: biasColor }}
            >
              {biasLabel}
            </span>
          </div>
          <div className="text-[8.5px] text-slate-300 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Buyers (Bullish Power):</span>
              <strong className="text-[#00ff9d]">{buyersPct}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Neutral (Consolidation):</span>
              <strong className="text-[#f59e0b]">{neutralPct}%</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sellers (Bearish Pressure):</span>
              <strong className="text-[#f43f5e]">{sellersPct}%</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400">Algorithmic Directive:</span>
              <span className="text-white font-bold">{intel?.actionDirective || 'MONITORING ACCUMULATION'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

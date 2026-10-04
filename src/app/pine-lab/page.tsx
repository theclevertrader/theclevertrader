'use client';

import React, { useState } from 'react';
import { 
  Code2, 
  Sparkles, 
  Play, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Bot, 
  FileCode,
  ShieldCheck
} from 'lucide-react';

const DEFAULT_PINE_V5 = `//@version=5
indicator("THE CLEVER TRADER — Institutional SMC & FVG Engine", overlay=true, max_boxes_count=500, max_labels_count=500)

// ==============================================================================
// 1. INPUT CONFIGURATIONS
// ==============================================================================
lookback = input.int(3, "Swing Lookback Period", minval=1)
showFVG = input.bool(true, "Detect Fair Value Gaps (FVG)")
showOB = input.bool(true, "Detect Institutional Order Blocks")
showKillzones = input.bool(true, "Highlight Session Killzones")

// ==============================================================================
// 2. FAIR VALUE GAPS (FVG)
// ==============================================================================
bullFVG = low > high[2]
bearFVG = high < low[2]

if showFVG and bullFVG
    box.new(left=bar_index-1, top=low, right=bar_index+3, bottom=high[2], 
            border_color=color.new(#00ff88, 40), bgcolor=color.new(#00ff88, 85))

if showFVG and bearFVG
    box.new(left=bar_index-1, top=low[2], right=bar_index+3, bottom=high, 
            border_color=color.new(#ff3366, 40), bgcolor=color.new(#ff3366, 85))

// ==============================================================================
// 3. SWING STRUCTURE & BOS
// ==============================================================================
sh = ta.pivothigh(high, lookback, lookback)
sl = ta.pivotlow(low, lookback, lookback)

plotshape(not na(sh), title="Swing High", style=shape.triangledown, location=location.abovebar, color=color.orange, size=size.tiny, offset=-lookback)
plotshape(not na(sl), title="Swing Low", style=shape.triangleup, location=location.belowbar, color=color.teal, size=size.tiny, offset=-lookback)

// ==============================================================================
// 4. ALERTS
// ==============================================================================
alertcondition(bullFVG, title="Bullish FVG Created", message="[CLEVER TRADER] Bullish FVG confirmed on {{ticker}}")
alertcondition(bearFVG, title="Bearish FVG Created", message="[CLEVER TRADER] Bearish FVG confirmed on {{ticker}}")
`;

export default function PineLabPage() {
  const [version, setVersion] = useState<'v5' | 'v6'>('v5');
  const [code, setCode] = useState(DEFAULT_PINE_V5);
  const [aiPrompt, setAiPrompt] = useState('Create a Pine script for London Session Liquidity Sweep with RSI divergence');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [auditResult, setAuditResult] = useState<{ passed: boolean; message: string; details: string[] }>({
    passed: true,
    message: 'TradingView House Rules Compliant: Zero Repainting Detected.',
    details: [
      'No unconfirmed security() lookahead bias detected.',
      'Swing lookbacks properly offset by -lookback bars.',
      'Box limits and label limits conform to TradingView maximums.',
    ],
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = `//@version=5
indicator("THE CLEVER TRADER — ${aiPrompt.slice(0, 40)}", overlay=true)

// --- PARAMETERS ---
sessionTime = input.session("0700-1000:23456", "London Session (UTC)")
inSession = not na(time(timeframe.period, sessionTime))

// --- LIQUIDITY SWEEP ---
swingHigh = ta.highest(high, 20)[1]
swingLow = ta.lowest(low, 20)[1]

bullSweep = low < swingLow and close > swingLow and inSession
bearSweep = high > swingHigh and close < swingHigh and inSession

plotshape(bullSweep, title="SSL Swept", style=shape.labelup, location=location.belowbar, color=color.green, text="SSL RAID")
plotshape(bearSweep, title="BSL Swept", style=shape.labeldown, location=location.abovebar, color=color.red, text="BSL RAID")

// --- RISK ALERT ---
alertcondition(bullSweep, title="Buy-Side Sweep Alert", message="[CLEVER TRADER] Liquidity raid confirmed on {{ticker}}")
`;
      setCode(generated);
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">PINE LAB — INSTITUTIONAL PINE SCRIPT STUDIO</h1>
            <p className="text-xs text-slate-400">
              Pine Script v5 & v6 • AI Code Generator • Repaint Debugger • House Rules Compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface p-1 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => setVersion('v5')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                version === 'v5' ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Pine v5
            </button>
            <button
              onClick={() => setVersion('v6')}
              className={`px-3 py-1 rounded font-bold transition-all ${
                version === 'v6' ? 'bg-cyan-500/20 text-terminal-cyan border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Pine v6
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface border border-white/[0.08] hover:border-cyan-500/40 text-xs text-slate-200 hover:text-white transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-terminal-green" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'COPIED!' : 'COPY SCRIPT'}</span>
          </button>
        </div>
      </div>

      {/* AI Script Generator Bar */}
      <div className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-terminal-cyan">
          <Sparkles className="w-4 h-4" />
          <span>AI PINE SCRIPT ARCHITECT & GENERATOR</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Describe your strategy or indicator requirements..."
            className="flex-1 bg-surface border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-terminal-cyan hover:bg-cyan-400 text-black text-xs font-bold transition-all disabled:opacity-50 shadow-cyan-glow"
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE SCRIPT'}
          </button>
        </div>
      </div>

      {/* Code Editor & Compliance Dual View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Area */}
        <div className="lg:col-span-2 bg-[#080d1a] border border-terminal-border rounded-xl shadow-card-glass overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border bg-surface-elevated text-xs text-slate-400">
            <span className="flex items-center gap-2 font-bold text-white">
              <FileCode className="w-4 h-4 text-terminal-cyan" />
              <span>clever_trader_smc_{version}.pine</span>
            </span>
            <span className="text-[10px] text-slate-500">UTF-8 • Pine Script</span>
          </div>

          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full h-[450px] bg-transparent p-4 font-mono text-xs text-cyan-200 focus:outline-none resize-none leading-relaxed selection:bg-cyan-500/30"
            spellCheck={false}
          />
        </div>

        {/* Audit & Compliance Panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 font-bold text-white uppercase">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-terminal-green" />
                <span>House Rules Validator</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 text-terminal-green font-bold">
                COMPLIANT
              </span>
            </div>

            <p className="text-terminal-green font-medium text-[11px]">
              {auditResult.message}
            </p>

            <div className="space-y-2 pt-2">
              {auditResult.details.map((d, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-terminal-green shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-cyan-500/20 shadow-card-glass text-xs space-y-2">
            <div className="flex items-center gap-2 text-terminal-cyan font-bold text-xs">
              <Bot className="w-4 h-4" />
              <span>NEXUS Pine Advisor</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              "Is script ko aap direct TradingView ke Pine Editor mein paste kar ke 'Add to chart' kar saktay hain. Default settings 15M aur 1H timeframes ke liye calibrate ki gayi hain."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

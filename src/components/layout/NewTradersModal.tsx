'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  Bot,
  Cpu,
  ShieldCheck,
  Compass,
  ArrowRight,
  TrendingUp,
  Layers,
  BookOpen,
  CheckCircle2,
  Zap,
  Target
} from 'lucide-react';

interface NewTradersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMt5: () => void;
  onOpenJarvis?: () => void;
  onToggleBot?: () => void;
  isBotActive?: boolean;
}

export const NewTradersModal: React.FC<NewTradersModalProps> = ({
  isOpen,
  onClose,
  onOpenMt5,
  onOpenJarvis,
  onToggleBot,
  isBotActive = false,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'QUICK_START' | 'STRATEGIES' | 'RISK_RULES'>('QUICK_START');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#091510] border border-[#00ff9d44] rounded-2xl shadow-[0_0_50px_rgba(0,255,157,0.15)] flex flex-col overflow-hidden font-sans text-white animate-modal-pop">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#00ff9d22] bg-[#060f0b]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff9d18] border border-[#00ff9d55] flex items-center justify-center text-[#00ff9d] shadow-[0_0_15px_#00ff9d33]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  New Traders Institutional Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00ff9d22] text-[#00ff9d] border border-[#00ff9d44]">
                  FAST TRACK
                </span>
              </div>
              <p className="text-xs text-[#7adbbe] mt-0.5">
                Naye traders ke liye 1-click setup, institutional strategies aur risk rules
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#00ff9d18] bg-[#07130d] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('QUICK_START')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'QUICK_START'
                ? 'text-[#00ff9d] border-[#00ff9d]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>1-Click Launchpad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STRATEGIES')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'STRATEGIES'
                ? 'text-[#00ff9d] border-[#00ff9d]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>SMC / ICT Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('RISK_RULES')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'RISK_RULES'
                ? 'text-[#00ff9d] border-[#00ff9d]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk Safeguard</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {activeTab === 'QUICK_START' && (
            <div className="space-y-4">
              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Auto Trader Card */}
                <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d33] flex flex-col justify-between gap-3 hover:border-[#00ff9d88] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[#00ff9d15] text-[#00ff9d] border border-[#00ff9d33]">
                      <Bot className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isBotActive ? 'bg-[#00ff9d22] text-[#00ff9d]' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isBotActive ? 'ACTIVE' : 'READY'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Autonomous AI Auto-Trader</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      0.01 micro-lot par smart order block FVG setups scan aur auto execute karein.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleBot?.();
                    }}
                    className={`w-full py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                      isBotActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-[#00ff9d] text-black font-extrabold hover:bg-[#20ffac]'
                    }`}
                  >
                    <span>{isBotActive ? 'Pause Auto-Trader' : 'Activate Auto-Trader'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* MT5 Connect Card */}
                <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d33] flex flex-col justify-between gap-3 hover:border-[#00ff9d88] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[#00ff9d15] text-[#00ff9d] border border-[#00ff9d33]">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      LIVE / DEMO
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Connect MetaTrader 5</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Exness, FTMO ya kisi bhi broker ka MT5 account sync karein.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMt5();
                    }}
                    className="w-full py-2 rounded-lg text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open MT5 Gateway</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Roman Urdu JARVIS Card */}
                <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d33] flex flex-col justify-between gap-3 hover:border-[#00ff9d88] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[#00ff9d15] text-[#00ff9d] border border-[#00ff9d33]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      ROMAN URDU
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">NEXUS AI Copilot</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Apni zaban mein Roman Urdu audio ya text se live analysis aur signal puchen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenJarvis?.();
                    }}
                    className="w-full py-2 rounded-lg text-xs font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Talk to JARVIS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Live Scanner & Charts */}
                <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d33] flex flex-col justify-between gap-3 hover:border-[#00ff9d88] transition-all">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-[#00ff9d15] text-[#00ff9d] border border-[#00ff9d33]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      INSTITUTIONAL
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Multi-Asset Market Scanner</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gold (XAUUSD), Bitcoin, EURUSD ke high-probability setups instant dekhein.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push('/scanner');
                    }}
                    className="w-full py-2 rounded-lg text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Scanner</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4-Step Checklist */}
              <div className="p-4 rounded-xl bg-[#081810] border border-[#00ff9d22] space-y-2.5">
                <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider font-mono">
                  New Trader 4-Step Action Checklist:
                </h4>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff9d] shrink-0" />
                    <span><strong>Step 1:</strong> MetaTrader 5 connect karein ya built-in paper trading use karein.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff9d] shrink-0" />
                    <span><strong>Step 2:</strong> Lot size hamesha <strong>0.01</strong> rakhein ($3 SL aur $9 TP).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff9d] shrink-0" />
                    <span><strong>Step 3:</strong> Auto-Trader ON karein ya Scanner se high-confluence setups choose karein.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff9d] shrink-0" />
                    <span><strong>Step 4:</strong> Kisi bhi waqt JARVIS se Roman Urdu mein live market guidance lein.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'STRATEGIES' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d22]">
                <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider mb-1">
                  1. Smart Money Concepts (SMC) & Liquidity
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Retail traders support/resistance par trade karte hain jahan banks unka Stop Loss hunt karte hain. THE CLEVER TRADER terminal liquidity sweep (BSL/SSL) identify kar ke bank foot-prints ke sath trade karta hai.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d22]">
                <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider mb-1">
                  2. Order Block (OB) & Fair Value Gap (FVG)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Institutional orders hamesha imbalance (FVG) create karte hain. Price jab wapis FVG ya mitigation order block par aati hai to high-reward entry trigger hoti hai.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d22]">
                <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider mb-1">
                  3. Market Structure Shift (MSS / CHoCH)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  BOS (Break of Structure) aur CHoCH (Change of Character) confirmation ke baghair entry nahi li jaati. Hamara scanner yeh confirmation automatic detect karta hai.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/strategies');
                }}
                className="w-full py-2.5 rounded-xl bg-[#00ff9d] text-black font-extrabold text-xs hover:bg-[#25ffaf] transition-all flex items-center justify-center gap-2"
              >
                <span>Full Strategies Lab Dekhein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeTab === 'RISK_RULES' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0c2217] border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Golden Rule: 1% Risk & 0.01 Micro-Lot</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Naye traders account tab wash karte hain jab woh bara lot size (0.10 ya 1.00) use karte hain. THE CLEVER TRADER ke Live Safe Guard system par 0.01 lot recommended hai taake aap ka risk strictly 30 pips ($3) rahe aur profit 90 pips ($9) ho.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c2217] border border-[#00ff9d22]">
                <h4 className="text-xs font-bold text-[#00ff9d] uppercase tracking-wider mb-1">
                  Daily Loss Cut-Off ($10 Limit)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Agar ek din mein 3 trades loss mein jayein to terminal automatic trading pause kar deta hai taake revenge trading na ho sakay.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/risk');
                }}
                className="w-full py-2.5 rounded-xl bg-[#00ff9d] text-black font-extrabold text-xs hover:bg-[#25ffaf] transition-all flex items-center justify-center gap-2"
              >
                <span>Risk Management Settings Kholein</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#00ff9d18] bg-[#060f0b] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse" />
            Live Institutional Safety: ACTIVE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-mono text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

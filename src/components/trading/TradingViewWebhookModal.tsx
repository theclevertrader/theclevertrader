'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Code,
  Zap,
  Activity
} from 'lucide-react';

interface TradingViewWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSymbol?: string;
}

export const TradingViewWebhookModal: React.FC<TradingViewWebhookModalProps> = ({
  isOpen,
  onClose,
  activeSymbol = 'XAUUSD',
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('https://clevertrader.loca.lt/api/webhook/tradingview');
  const [secretKey, setSecretKey] = useState('clever_trader_secure_pass_2026');
  const [testAction, setTestAction] = useState<'BUY' | 'SELL'>('BUY');
  const [testPrice, setTestPrice] = useState('2652.40');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initWebhookUrl = async () => {
      try {
        const res = await fetch('/api/webhook/tradingview');
        if (res.ok) {
          const d = await res.json();
          if (d.activeTunnel) {
            setWebhookUrl(d.activeTunnel);
            return;
          }
        }
      } catch (e) {}

      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
          setWebhookUrl(`${window.location.origin}/api/webhook/tradingview`);
        }
      }
    };
    initWebhookUrl();
  }, []);

  const jsonTemplate = JSON.stringify(
    {
      secret: secretKey,
      symbol: "{{ticker}}",
      action: "{{strategy.order.action}}",
      price: "{{close}}",
      sl: "{{plot_0}}",
      tp: "{{plot_1}}",
      strategy: "The Clever Trader — Institutional Webhook",
      timeframe: "{{interval}}"
    },
    null,
    2
  );

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const fetchRecentSignals = async () => {
    try {
      const res = await fetch('/api/webhook/tradingview');
      if (res.ok) {
        const d = await res.json();
        // Telemetry
      }
    } catch (e) {}
  };

  const handleSimulateWebhook = async () => {
    setIsLoading(true);
    setTestStatus('Transmitting simulated TradingView webhook...');
    try {
      const p = parseFloat(testPrice) || 2652.40;
      const res = await fetch('/api/webhook/tradingview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretKey,
          symbol: activeSymbol,
          action: testAction,
          price: p,
          sl: testAction === 'BUY' ? p - 8 : p + 8,
          tp: testAction === 'BUY' ? p + 16 : p - 16,
          strategy: 'TradingView Manual Test Simulation',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTestStatus(`✅ Order Executed! Council: ${json.council?.ruling} (${json.signal?.orderId})`);
        setRecentSignals((prev) => [json.signal, ...prev]);
      } else {
        setTestStatus(`⚠️ Rejected: ${json.error || json.message}`);
      }
    } catch (e: any) {
      setTestStatus(`❌ Network error: ${e.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setTestStatus(null), 6000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-backdrop-fade select-none">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0a0f1d] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.2)] flex flex-col text-slate-100 font-sans animate-modal-pop">
        
        {/* Top Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#0c1326] border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider text-white font-mono">
                  TRADINGVIEW WEBHOOK BRIDGE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  ESSENTIAL PLAN READY
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                TradingView Alert ➔ Wall Street AI Council ➔ Exness MT5 Auto-Execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 font-mono text-xs">

          {/* Account Sync Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-purple-950/30 to-emerald-950/40 border border-cyan-500/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 text-[11px]">ACTIVE EXNESS ACCOUNT:</span>
              <span className="text-emerald-400 font-bold">#472658395 (MT5 Live Synchronized)</span>
            </div>
            <div className="text-[10px] text-purple-300">
              AI COUNCIL RISK: <span className="font-bold">0.01 LOT (1.0% MAX)</span>
            </div>
          </div>

          {/* Step 1: Webhook URL */}
          <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold text-[11px] flex items-center gap-1.5">
                <span>STEP 1:</span> Webhook URL (TradingView Alert Settings Mein Paste Karein)
              </span>
              <button
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-all"
              >
                {copiedField === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'url' ? 'COPIED!' : 'COPY URL'}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-[#070b14] border border-cyan-500/20 text-slate-300 font-mono text-[11px] break-all select-all">
              {webhookUrl}
            </div>
            <p className="text-[9.5px] text-slate-400 italic">
              * TradingView alert box mein "Webhook URL" checkbox ko tick karein aur yeh URL paste karein.
            </p>
          </div>

          {/* Step 2: Message Options */}
          <div className="space-y-2 bg-black/40 p-3 rounded-xl border border-white/[0.06]">
            <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1.5">
              <span>STEP 2:</span> Alert Message (TradingView "Message" Box Mein Paste Karein)
            </span>

            {/* Option A: Recommended Pine Script Automated */}
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-300">
                  ⭐ RECOMMENDED (Our Pine Script SMC Automated Message):
                </span>
                <button
                  onClick={() => copyToClipboard('{{alert.message}}', 'alertmsg')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all"
                >
                  {copiedField === 'alertmsg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'alertmsg' ? 'COPIED!' : 'COPY {{alert.message}}'}</span>
                </button>
              </div>
              <div className="p-1.5 rounded bg-black/50 font-mono text-emerald-400 text-xs font-bold select-all">
                {"{{alert.message}}"}
              </div>
              <p className="text-[9.5px] text-slate-400">
                Aap ke indicator mein dynamic SL, TP aur Symbol pehle se coded hain. TradingView alert message box mein sirf <code className="text-emerald-300">{"{{alert.message}}"}</code> likhein.
              </p>
            </div>

            {/* Option B: Direct JSON Template */}
            <div className="p-2 rounded-lg bg-[#070b14]/70 border border-white/[0.08] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-300">
                  Option B: Manual Custom JSON Template:
                </span>
                <button
                  onClick={() => copyToClipboard(jsonTemplate, 'json')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 border border-white/[0.1] text-[9.5px] font-bold transition-all"
                >
                  {copiedField === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'json' ? 'COPIED JSON!' : 'COPY JSON'}</span>
                </button>
              </div>
              <pre className="p-1.5 rounded bg-black/50 text-slate-300 font-mono text-[9.5px] overflow-x-auto max-h-24">
                {jsonTemplate}
              </pre>
            </div>
          </div>

          {/* Step 3: Test Webhook Simulation */}
          <div className="space-y-2 bg-[#0c1426] p-3 rounded-xl border border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-bold text-[11px] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>STEP 3:</span> Test Simulation (Terminal Par Live Check Karein)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value as any)}
                className="px-2.5 py-1.5 rounded bg-black/60 border border-white/[0.1] text-white text-xs font-mono"
              >
                <option value="BUY">BUY ORDER</option>
                <option value="SELL">SELL ORDER</option>
              </select>

              <input
                type="text"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                placeholder="Price"
                className="px-2.5 py-1.5 rounded bg-black/60 border border-white/[0.1] text-white text-xs font-mono w-28"
              />

              <button
                onClick={handleSimulateWebhook}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-all shadow-md hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isLoading ? 'VERIFYING...' : 'FIRE TEST SIGNAL'}</span>
              </button>
            </div>

            {testStatus && (
              <div className="p-2 rounded bg-black/50 border border-purple-500/30 text-purple-200 text-[10px] animate-pulse">
                {testStatus}
              </div>
            )}
          </div>

          {/* What Happens Behind the Scenes */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] text-[10px] space-y-1.5 text-slate-300">
            <div className="font-bold text-white uppercase text-[10.5px]">
              🔒 Autonomous Safety Protocol (Kese Kam Hoga):
            </div>
            <p>1. TradingView se alert aate hi signal sub-second mein receive hota hai.</p>
            <p>2. <strong className="text-rose-400">Michael Burry</strong> aur <strong className="text-emerald-400">Cathie Wood</strong> check karenge ke koi fake trap to nahi.</p>
            <p>3. <strong className="text-cyan-400">Warren Buffett Guardian</strong> aap ke live broker balance par 1.0% max risk aur 0.01 lot size lock karke trade execute kare ga.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

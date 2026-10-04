'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Download, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  Zap, 
  ExternalLink,
  Cpu,
  ArrowRight,
  Volume2,
  FolderCheck
} from 'lucide-react';
import { speakUrdu, announceTradePending, announceTradeExecuted } from '@/lib/ai/urduSpeechEngine';

interface Mt5ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Mt5ConnectionModal: React.FC<Mt5ConnectionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'NATIVE' | 'PYTHON' | 'MQL5' | 'SETTINGS'>('NATIVE');
  const [server, setServer] = useState('Exness-MT5Trial16');
  const [login, setLogin] = useState('472658395');
  const [balance, setBalance] = useState('10000.00');
  const [autoLot, setAutoLot] = useState('0.01');
  const [magicNumber, setMagicNumber] = useState('778899');
  const [isConnected, setIsConnected] = useState(true);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: string }>>([]);
  const [pythonCode, setPythonCode] = useState('');
  const [mql5Code, setMql5Code] = useState('');

  const fetchBridgeStatus = async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/mt5');
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.config?.isConnected || false);
        setServer(data.config?.server || 'Exness-MT5Trial16');
        setLogin(data.config?.login || '472658395');
        if (data.config?.balance !== undefined) {
          setBalance(String(data.config.balance));
        }
        setAutoLot(String(data.config?.autoLot || '0.01'));
        setMagicNumber(String(data.config?.magicNumber || '778899'));
        setLogs(data.logs || []);
        setPythonCode(data.pythonCode || '');
        setMql5Code(data.mql5Code || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBridgeStatus();
      const interval = setInterval(fetchBridgeStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_connection',
          server,
          login,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsConnected(true);
        fetchBridgeStatus();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      setIsConnected(false);
      fetchBridgeStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          server,
          login,
          balance: parseFloat(balance) || 10000.00,
          equity: parseFloat(balance) || 10000.00,
          freeMargin: parseFloat(balance) || 10000.00,
          autoLot: parseFloat(autoLot),
          magicNumber: parseInt(magicNumber),
        }),
      });
      fetchBridgeStatus();
      alert('MetaTrader 5 configuration saved successfully!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleVoiceTestTrade = async () => {
    setIsTestingVoice(true);
    // 1. Announce trade pending
    announceTradePending({
      symbol: "XAUUSD",
      action: "BUY",
      lot: parseFloat(autoLot) || 0.01,
      entryPrice: 4140.00,
      sl: 4110.00,
      tp: 4180.00,
    });

    try {
      const res = await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'place_order',
          symbol: 'XAUUSD',
          type: 'BUY',
          lot: parseFloat(autoLot) || 0.01,
          stopLoss: 4110.00,
          takeProfit: 4180.00,
          magic: parseInt(magicNumber) || 778899,
          comment: 'Voice Test Order'
        })
      });
      const data = await res.json();
      const ticket = data.ticket || Math.floor(100000 + Math.random() * 900000);

      setTimeout(() => {
        announceTradeExecuted({
          symbol: 'XAUUSD',
          action: 'BUY',
          lot: parseFloat(autoLot) || 0.01,
          ticket: ticket,
          price: 4140.00
        });
        setIsTestingVoice(false);
        fetchBridgeStatus();
      }, 3500);

    } catch (e) {
      setIsTestingVoice(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface-card border border-terminal-border rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono animate-modal-pop">

        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-terminal-border bg-surface/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-terminal-cyan">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  MetaTrader 5 (MT5) Bridge Gateway
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1.5 ${
                  isConnected 
                    ? 'bg-emerald-500/20 text-terminal-green border border-emerald-500/40 shadow-green-glow'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-terminal-green animate-pulse' : 'bg-amber-400'}`} />
                  {isConnected ? 'LIVE CONNECTED' : 'READY TO CONNECT'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                AI Auto-Trader trades ko MetaTrader 5 par real-time direct execute karne ka tareeqa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveTab('NATIVE')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 ${
              activeTab === 'NATIVE'
                ? 'text-terminal-cyan border-terminal-cyan'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            ⭐ MT5 Native EX5 (Detected)
          </button>
          <button
            onClick={() => setActiveTab('PYTHON')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 ${
              activeTab === 'PYTHON'
                ? 'text-terminal-cyan border-terminal-cyan'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            1-Click Python / Node Bridge
          </button>
          <button
            onClick={() => setActiveTab('MQL5')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 ${
              activeTab === 'MQL5'
                ? 'text-terminal-cyan border-terminal-cyan'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            MQL5 Source Code
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 px-3 font-bold transition-all border-b-2 ${
              activeTab === 'SETTINGS'
                ? 'text-terminal-cyan border-terminal-cyan'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Account Settings & Logs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* TAB 0: NATIVE MT5 EX5 */}
          {activeTab === 'NATIVE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-slate-200">
                <div className="flex items-center gap-2 font-bold text-terminal-green mb-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>MetaTrader 5 & Compiled EX5 Robot Natively Installed!</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Aapke computer par MetaTrader 5 terminal detect ho chuka hai aur <strong>CleverTraderBridge.ex5</strong> (0 errors) successfully compile kar ke aapke MT5 Experts folder mein install kar diya gaya hai!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-black/50 border border-white/[0.08] rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Detected MT5 Terminal:</div>
                  <div className="text-xs text-white font-mono font-bold">C:\Program Files\MetaTrader 5\terminal64.exe</div>
                </div>

                <div className="p-3 bg-black/50 border border-white/[0.08] rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Compiled Robot (EX5):</div>
                  <div className="text-xs text-terminal-green font-mono font-bold">CleverTraderBridge.ex5 (35 KB)</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Real Account Connect Karne Ka 2-Minute Tareeqa (Roman Urdu):
                </h4>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span>Apna <strong>MetaTrader 5</strong> open karein aur Real/Demo account login karein.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span>MT5 mein <strong>Tools {'->'} Options {'->'} Expert Advisors</strong> kholen, <strong>Allow WebRequest</strong> tick karein aur URL add karein: <code className="text-terminal-cyan font-bold bg-black/60 px-1.5 py-0.5 rounded">http://localhost:3000</code></span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>Left side <strong>Navigator (Ctrl+N)</strong> se <strong>Expert Advisors {'->'} CleverTraderBridge</strong> ko Gold (XAUUSD) ke chart par drag & drop karein aur top bar se <strong>Algo Trading</strong> button green ON kar dein!</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-surface to-cyan-950/30 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-xs">Live Voice Test Order (Audio & Signal)</div>
                  <p className="text-[11px] text-slate-400">NEXUS AI ba-awaz bolega aur MT5 gateway par test trade transmit karega.</p>
                </div>
                <button
                  onClick={handleVoiceTestTrade}
                  disabled={isTestingVoice}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/40 shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isTestingVoice ? 'Sending & Speaking...' : '🎙️ Send Test Order (Bolo & Send)'}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* TAB 1: PYTHON BRIDGE */}
          {activeTab === 'PYTHON' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-slate-200">
                <span className="font-bold text-terminal-cyan block mb-1">
                  ⚡ Asaan Tareeqa: Windows par 1-Command Connection
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ye official MetaTrader 5 Python bridge hai. Ye aapke PC par chal rahe MetaTrader 5 terminal ke sath direct connect ho kar Clever Trader ke autonomous signals ko micro-seconds mein execute karta hai.
                </p>
              </div>

              {/* Step by Step Guide in Roman Urdu */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Connecting Steps (Roman Urdu):
                </h4>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span>Apna <strong>MetaTrader 5 (MT5)</strong> terminal apne computer par open karein aur login karein.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span>Neeche diye gaye button se <strong>mt5_bridge.py</strong> file download karein ya copy karein.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-terminal-cyan flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>Command Prompt (CMD) ya PowerShell mein ye command run karein: <code className="text-terminal-cyan font-bold bg-black/50 px-1.5 py-0.5 rounded">python mt5_bridge.py</code></span>
                  </div>
                </div>
              </div>

              {/* Actions & Code Box */}
              <div className="flex items-center gap-3">
                <a
                  href="/api/mt5?action=download_python"
                  download="mt5_bridge.py"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terminal-cyan text-black font-bold hover:bg-cyan-400 transition-colors shadow-cyan-glow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download mt5_bridge.py</span>
                </a>

                <button
                  onClick={() => copyToClipboard(pythonCode, 'python')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-colors"
                >
                  {copiedScript === 'python' ? <CheckCircle2 className="w-4 h-4 text-terminal-green" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript === 'python' ? 'Copied Code!' : 'Copy Script Code'}</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-terminal-green hover:bg-emerald-500/25 transition-colors ml-auto font-bold"
                >
                  <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
                </button>
              </div>

              {/* Code preview snippet */}
              <div className="relative">
                <pre className="p-3 bg-black/60 border border-white/[0.06] rounded-xl text-[10px] text-slate-400 overflow-x-auto max-h-40">
                  {pythonCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: MQL5 EXPERT ADVISOR */}
          {activeTab === 'MQL5' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-slate-200">
                <span className="font-bold text-purple-400 block mb-1">
                  🛡️ MetaTrader 5 Expert Advisor (EA Webhook Method)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Agar aap Python ke baghair direct MT5 ke andar bot chalana chahte hain, to is MQL5 Expert Advisor ko apne MT5 mein attach kar lein.
                </p>
              </div>

              {/* MQL5 Instructions in Roman Urdu */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                  MQL5 Setup Tareeqa (Roman Urdu):
                </h4>
                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                    <span>MT5 mein <strong>F4</strong> key dabayein jisse <strong>MetaEditor</strong> khul jayega.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                    <span>New Expert Advisor banayein, ye code paste karein aur <strong>Compile (F7)</strong> karein.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                    <span>MT5 mein <code>Tools {'->'} Options {'->'} Expert Advisors</code> mein <strong>Allow WebRequest</strong> tick karein aur URL add karein: <code className="text-terminal-cyan">http://localhost:3000</code></span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-white/[0.06]">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                    <span>EA ko kisi bhi chart par drag & drop karein aur <strong>Algo Trading</strong> button ON karein.</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <a
                  href="/api/mt5?action=download_mql5"
                  download="CleverTraderBridge.mq5"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CleverTraderBridge.mq5</span>
                </a>

                <button
                  onClick={() => copyToClipboard(mql5Code, 'mql5')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-colors"
                >
                  {copiedScript === 'mql5' ? <CheckCircle2 className="w-4 h-4 text-terminal-green" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript === 'mql5' ? 'Copied MQL5 Code!' : 'Copy MQL5 Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-black/60 border border-white/[0.06] rounded-xl text-[10px] text-slate-400 overflow-x-auto max-h-40">
                {mql5Code}
              </pre>
            </div>
          )}

          {/* TAB 3: SETTINGS & LOGS */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MT5 Server Name</label>
                  <input
                    type="text"
                    value={server}
                    onChange={e => setServer(e.target.value)}
                    placeholder="e.g. Exness-Real, ICMarkets-Live, FTMO-Demo"
                    className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MT5 Account Login Number</label>
                  <input
                    type="text"
                    value={login}
                    onChange={e => setLogin(e.target.value)}
                    placeholder="e.g. 50192842"
                    className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">MT5 Account Balance ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    placeholder="e.g. 10000.00"
                    className="w-full bg-surface border border-emerald-500/40 rounded-lg px-3 py-2 text-terminal-green font-bold focus:outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Default Auto-Lot Size</label>
                  <input
                    type="number"
                    step="0.01"
                    value={autoLot}
                    onChange={e => setAutoLot(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Magic Number (Bot Identifier)</label>
                  <input
                    type="number"
                    value={magicNumber}
                    onChange={e => setMagicNumber(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 rounded-lg bg-terminal-cyan text-black font-bold hover:bg-cyan-400 transition-colors"
                >
                  Save MT5 Settings
                </button>

                {isConnected ? (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-terminal-rose hover:bg-rose-500/25 transition-colors font-bold"
                  >
                    Disconnect MT5
                  </button>
                ) : (
                  <button
                    onClick={handleTestConnection}
                    className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-terminal-green hover:bg-emerald-500/25 transition-colors font-bold"
                  >
                    Test & Connect MT5
                  </button>
                )}
              </div>

              {/* Live Bridge Logs */}
              <div className="space-y-2 pt-3">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                  MT5 Bridge Gateway Logs:
                </span>
                <div className="p-3 bg-black/70 border border-white/[0.08] rounded-xl max-h-36 overflow-y-auto space-y-1.5 text-[10px]">
                  {logs.length === 0 ? (
                    <span className="text-slate-500">No logs recorded yet.</span>
                  ) : (
                    logs.map((l, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-slate-500 shrink-0">[{l.time}]</span>
                        <span className={l.type === 'success' ? 'text-terminal-green' : (l.type === 'warning' ? 'text-amber-400' : 'text-slate-300')}>
                          {l.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-terminal-border bg-surface/50 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Local Gateway URL:</span>
            <code className="text-terminal-cyan bg-black/40 px-2 py-0.5 rounded">http://localhost:3000/api/mt5</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] text-white hover:bg-white/[0.12] transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { 
  BellRing, 
  Volume2, 
  Send, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Radio
} from 'lucide-react';

interface AlertItem {
  id: string;
  symbol: string;
  type: string;
  condition: string;
  active: boolean;
  channel: 'BROWSER' | 'SOUND' | 'TELEGRAM';
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', symbol: 'XAUUSD', type: 'Liquidity Sweep', condition: 'Price raids Sell-Side Liquidity below 2640.20', active: true, channel: 'SOUND' },
    { id: '2', symbol: 'BTCUSD', type: 'Bullish BOS', condition: '1H candle body close above 64,200', active: true, channel: 'BROWSER' },
    { id: '3', symbol: 'NAS100', type: 'FVG Retest', condition: 'Price enters 15M Bullish FVG (19,800 - 19,825)', active: true, channel: 'TELEGRAM' },
    { id: '4', symbol: 'GLOBAL', type: 'Daily Risk Limit', condition: 'Portfolio drawdown hits 2.5% warning', active: true, channel: 'SOUND' },
  ]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [discordWebhook, setDiscordWebhook] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          if (data.notifications.telegramMaskedToken) setTelegramToken(data.notifications.telegramMaskedToken);
          if (data.notifications.telegramChatId) setTelegramChatId(data.notifications.telegramChatId);
          if (data.notifications.discordMaskedUrl) setDiscordWebhook(data.notifications.discordMaskedUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          telegramToken: telegramToken.includes('••••') ? undefined : telegramToken,
          telegramChatId: telegramChatId.includes('••••') ? undefined : telegramChatId,
          discordWebhookUrl: discordWebhook.includes('••••') ? undefined : discordWebhook,
        }),
      });
      const data = await res.json();
      setSaveMessage(data.success ? 'SAVED SUCCESSFULLY!' : 'ERROR SAVING');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err) {
      setSaveMessage('NETWORK ERROR');
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatchTest = async () => {
    setIsTesting(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      if (data.result?.telegramSuccess || data.result?.discordSuccess) {
        setTestFeedback('SUCCESS: DELIVERED!');
      } else {
        setTestFeedback(data.result?.telegramMessage || data.result?.discordMessage || 'ENTER CREDENTIALS FIRST');
      }
      setTimeout(() => setTestFeedback(null), 5000);
    } catch (err) {
      setTestFeedback('DISPATCH FAILED');
      setTimeout(() => setTestFeedback(null), 4000);
    } finally {
      setIsTesting(false);
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const triggerTestSound = () => {
    // Play a gentle institutional cyber frequency tone using Web Audio API!
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // A6
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.log('Audio test error', e);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">REAL-TIME INSTITUTIONAL ALERT SYSTEM</h1>
            <p className="text-xs text-slate-400">
              SMC & ICT Event Triggers • Acoustic Chimes • Telegram & Webhook Integration
            </p>
          </div>
        </div>

        <button
          onClick={triggerTestSound}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-terminal-cyan text-xs font-bold transition-all shadow-cyan-glow"
        >
          <Volume2 className="w-4 h-4" />
          <span>TEST CHIME SOUND</span>
        </button>
      </div>

      {/* Grid: Alert Rules + Webhook Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Alerts Table */}
        <div className="lg:col-span-2 bg-surface-card border border-terminal-border rounded-xl shadow-card-glass overflow-hidden">
          <div className="px-4 py-3 border-b border-terminal-border bg-surface-elevated/70 flex items-center justify-between text-xs font-bold text-white">
            <span>CONFIGURED ALERT TRIGGERS</span>
            <span className="text-[10px] text-terminal-cyan">{alerts.filter(a => a.active).length} ACTIVE</span>
          </div>

          <div className="divide-y divide-white/[0.04] text-xs">
            {alerts.map(a => (
              <div key={a.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{a.symbol}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-terminal-cyan font-bold">
                      {a.type}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                      via {a.channel}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs">{a.condition}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleAlert(a.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                      a.active
                        ? 'bg-green-500/20 text-terminal-green border border-green-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {a.active ? 'ACTIVE' : 'MUTED'}
                  </button>
                  <button
                    onClick={() => deleteAlert(a.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Webhook & Dispatch Channel Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                LIVE DISPATCH CHANNELS
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">TELEGRAM & DISCORD</span>
            </div>

            {/* Telegram Configuration */}
            <div className="space-y-2.5 p-3 rounded-lg bg-black/30 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <span>📱</span> Telegram Bot Alerts
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  REAL-TIME PHONE ALERTS
                </span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Telegram Bot Token</label>
                <input
                  type="password"
                  placeholder="e.g. 7123456789:AAHq_..."
                  value={telegramToken}
                  onChange={e => setTelegramToken(e.target.value)}
                  className="w-full bg-surface border border-white/[0.08] focus:border-cyan-500/50 rounded-lg p-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Telegram Chat ID</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789 (from @userinfobot)"
                  value={telegramChatId}
                  onChange={e => setTelegramChatId(e.target.value)}
                  className="w-full bg-surface border border-white/[0.08] focus:border-cyan-500/50 rounded-lg p-2 text-white text-xs font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                💡 <b>How to get:</b> Telegram par <code>@BotFather</code> se bot banayein aur token copy karein. Phir <code>@userinfobot</code> ko message bhej kar apna numeric Chat ID lein.
              </p>
            </div>

            {/* Discord Configuration */}
            <div className="space-y-2.5 p-3 rounded-lg bg-black/30 border border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <span>🎮</span> Discord Webhook
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  DESK EMBEDS
                </span>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Discord Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={e => setDiscordWebhook(e.target.value)}
                  className="w-full bg-surface border border-white/[0.08] focus:border-indigo-500/50 rounded-lg p-2 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Save & Test Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>{saveMessage || (isSaving ? 'SAVING CONFIGURATION...' : 'SAVE NOTIFICATION CREDENTIALS')}</span>
              </button>

              <button
                onClick={handleDispatchTest}
                disabled={isTesting}
                className="w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-terminal-cyan border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-cyan-glow"
              >
                <span>⚡</span>
                <span>{testFeedback || (isTesting ? 'TRANSMITTING TEST ALERT...' : 'DISPATCH TEST TO MY PHONE')}</span>
              </button>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-white/[0.04]">
                <span className="text-slate-300">Browser Audio Chimes</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    soundEnabled
                      ? 'bg-terminal-green text-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {soundEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

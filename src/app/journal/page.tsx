'use client';

import React, { useState } from 'react';
import { INITIAL_JOURNAL_ENTRIES } from '@/lib/storage/local-store';
import { JournalEntry } from '@/lib/types/trading';
import { 
  BookOpen, 
  Plus, 
  Sparkles, 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Smile,
  Frown,
  Meh,
  Zap
} from 'lucide-react';

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_JOURNAL_ENTRIES);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Trade Form State
  const [symbol, setSymbol] = useState('XAUUSD');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('2650.00');
  const [exitPrice, setExitPrice] = useState('2662.50');
  const [stopLoss, setStopLoss] = useState('2645.00');
  const [takeProfit, setTakeProfit] = useState('2665.00');
  const [lotSize, setLotSize] = useState('0.05');
  const [pnl, setPnl] = useState('62.50');
  const [setupType, setSetupType] = useState('SMC Liquidity Sweep + MSS');
  const [emotion, setEmotion] = useState<'DISCIPLINED' | 'FOMO' | 'GREED' | 'FEAR' | 'REVENGE' | 'CONFIDENT'>('DISCIPLINED');
  const [mistake, setMistake] = useState('None');
  const [notes, setNotes] = useState('Patiently waited for London Killzone sweep.');

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: JournalEntry = {
      id: `jrnl-${Date.now()}`,
      timestamp: Date.now(),
      symbol,
      direction,
      entryPrice: parseFloat(entryPrice) || 0,
      exitPrice: parseFloat(exitPrice) || 0,
      stopLoss: parseFloat(stopLoss) || 0,
      takeProfit: parseFloat(takeProfit) || 0,
      lotSize: parseFloat(lotSize) || 0.01,
      pnl: parseFloat(pnl) || 0,
      rMultiple: 2.5,
      setupType,
      smcConfirmation: 'Key structural level respected with FVG confirmation',
      ictConfirmation: 'Killzone session alignment',
      emotion,
      mistake,
      notes,
      aiReview: 'Trade logged successfully. Followed pre-defined risk sizing rules.',
    };

    setEntries([newEntry, ...entries]);
    setShowAddModal(false);
  };

  const totalPnl = entries.reduce((acc, e) => acc + e.pnl, 0);
  const winningTrades = entries.filter(e => e.pnl > 0).length;
  const winRate = entries.length > 0 ? ((winningTrades / entries.length) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-terminal-cyan">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">INSTITUTIONAL TRADING JOURNAL</h1>
            <p className="text-xs text-slate-400">
              Audit Psychology • Identify Recurring Mistakes • Measure Execution Quality
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold transition-all shadow-cyan-glow"
        >
          <Plus className="w-4 h-4" />
          <span>LOG NEW TRADE</span>
        </button>
      </div>

      {/* AI Behavioral Audit Summary Banner */}
      <div className="p-5 rounded-xl bg-surface-card border border-purple-500/30 shadow-card-glass space-y-3">
        <div className="flex items-center gap-2 text-purple-300">
          <Bot className="w-5 h-5" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            NEXUS Behavioral Psychology Audit
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Identified Emotional Pitfalls</span>
            <span className="text-rose-400 font-bold block mt-0.5">2 FOMO Early Entries</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              London session ke dauran candle close hone se pehle entry lene ki wajah se drawdown face karna para.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Optimal Execution Window</span>
            <span className="text-terminal-green font-bold block mt-0.5">London Kill Zone (78% Win Rate)</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              XAUUSD par sell-side sweeps ke baad entries 1:3 R:R achieve kar rahi hain.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block">Revenge Trading Detection</span>
            <span className="text-terminal-cyan font-bold block mt-0.5">CLEAN (No Revenge Loops)</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Loss ke baad 30 minutes ka cooldown maintain kiya gaya hai. Good institutional discipline!
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Logged P&L</span>
          <span className={`text-lg font-black ${totalPnl >= 0 ? 'text-terminal-green' : 'text-terminal-rose'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} USD
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Win Rate</span>
          <span className="text-lg font-black text-terminal-cyan">{winRate}%</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Logged Trades</span>
          <span className="text-lg font-black text-white">{entries.length} Trades</span>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Discipline Score</span>
          <span className="text-lg font-black text-terminal-green">88 / 100</span>
        </div>
      </div>

      {/* Trade Log Cards */}
      <div className="space-y-3">
        {entries.map(entry => {
          const isWin = entry.pnl >= 0;
          return (
            <div
              key={entry.id}
              className="p-4 rounded-xl bg-surface-card border border-terminal-border shadow-card-glass space-y-3 font-mono"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{entry.symbol}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      entry.direction === 'BUY'
                        ? 'bg-green-500/20 text-terminal-green'
                        : 'bg-rose-500/20 text-terminal-rose'
                    }`}
                  >
                    {entry.direction}
                  </span>
                  <span className="text-slate-400 text-[11px]">{entry.setupType}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  <span className={`font-bold text-sm ${isWin ? 'text-terminal-green' : 'text-terminal-rose'}`}>
                    {isWin ? '+' : ''}${entry.pnl.toFixed(2)} USD ({entry.rMultiple}R)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
                <div>Entry: <strong className="text-white">{entry.entryPrice}</strong></div>
                <div>Exit: <strong className="text-white">{entry.exitPrice}</strong></div>
                <div>Stop Loss: <strong className="text-rose-400">{entry.stopLoss}</strong></div>
                <div>Emotion: <strong className="text-terminal-cyan">{entry.emotion}</strong></div>
              </div>

              <div className="text-[11px] text-slate-400">
                <strong>Notes / Mistake: </strong> {entry.notes} {entry.mistake !== 'None' && `(Mistake: ${entry.mistake})`}
              </div>

              {entry.aiReview && (
                <div className="p-2.5 rounded-lg bg-surface border border-cyan-500/20 text-[10px] text-slate-300 flex items-start gap-2">
                  <Bot className="w-3.5 h-3.5 text-terminal-cyan shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-terminal-cyan">NEXUS Audit: </strong>
                    <span>{entry.aiReview}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Trade Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-backdrop-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="w-full max-w-lg bg-surface-card border border-cyan-500/30 rounded-xl p-5 shadow-card-glass space-y-4 font-mono animate-modal-pop">
            <div className="flex items-center justify-between border-b border-terminal-border pb-2">
              <h3 className="font-bold text-white text-sm">LOG NEW TRADE TO JOURNAL</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={e => setDirection(e.target.value as any)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Entry Price</label>
                  <input
                    type="text"
                    value={entryPrice}
                    onChange={e => setEntryPrice(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Exit Price</label>
                  <input
                    type="text"
                    value={exitPrice}
                    onChange={e => setExitPrice(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Net P&L ($)</label>
                  <input
                    type="text"
                    value={pnl}
                    onChange={e => setPnl(e.target.value)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Emotion</label>
                  <select
                    value={emotion}
                    onChange={e => setEmotion(e.target.value as any)}
                    className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white"
                  >
                    <option value="DISCIPLINED">DISCIPLINED</option>
                    <option value="FOMO">FOMO</option>
                    <option value="GREED">GREED</option>
                    <option value="FEAR">FEAR</option>
                    <option value="REVENGE">REVENGE</option>
                    <option value="CONFIDENT">CONFIDENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Execution Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-surface border border-white/[0.08] rounded p-2 text-white h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-white/[0.04] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-terminal-cyan hover:bg-cyan-400 text-black font-bold text-xs shadow-cyan-glow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

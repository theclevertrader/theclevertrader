'use client';

import React, { useSyncExternalStore, useEffect, useState } from "react";
import { vortexEngine, fmtNum } from "@/lib/vortex/vortex-engine";
import { Panel, Tag, Label, Stat } from "./VortexUI";
import { VortexSphere } from "./VortexSphere";
import { CandleChart } from "./CandleChart";
import { SignalMesh } from "./SignalMesh";
import { AreaCurve, DrawdownChart, DepthLadder } from "./VortexCharts";
import { ExecutionStream } from "./ExecutionStream";
import { AgentLedger } from "./AgentLedger";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { ArrowLeft, Maximize2, RefreshCw, Pencil, Wallet, X, Check, FlipVertical2 } from "lucide-react";
import { JarvisIntelligenceBrain } from "@/lib/ai/jarvis-brain";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function useTerminal() {
  return useSyncExternalStore(
    vortexEngine.subscribe,
    vortexEngine.getSnapshot,
    vortexEngine.getServerSnapshot
  );
}

function MiniStat({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "up" | "down" | "accent";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className={cn(
          "text-[11px] leading-tight tabular-nums font-mono font-bold",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "accent" && "text-accent",
          tone === "ink" && "text-ink"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Header({ isEmbedded, activeSymbol = 'XAUUSD' }: { isEmbedded?: boolean; activeSymbol?: string }) {
  const s = useTerminal();
  const [isExecuting, setIsExecuting] = useState(false);
  const [execMsg, setExecMsg] = useState<string | null>(null);
  const [isBotToggling, setIsBotToggling] = useState(false);

  const mt5 = s.mt5Status;
  const isConnected = mt5?.isConnected ?? false;
  const jarvisAgent = s.agents.find(a => a.id === "JARVIS");
  const swarmDirection = jarvisAgent?.statusText?.includes("SELL") ? "SELL" : "BUY";

  const handleToggleBot = async () => {
    setIsBotToggling(true);
    try {
      const res = await fetch('/api/vortex/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_bot' }),
      });
      const data = await res.json();
      if (data.success) {
        setExecMsg(`Autonomous Swarm Bot ${data.isActive ? 'ACTIVATED' : 'PAUSED'}`);
        setTimeout(() => setExecMsg(null), 3500);
      }
    } catch (e) {
      console.warn('Bot toggle error:', e);
    } finally {
      setIsBotToggling(false);
    }
  };

  const handleExecuteSwarm = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/vortex/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_swarm_signal',
          symbol: activeSymbol,
          direction: swarmDirection,
          lot: 0.01,
          comment: 'VORTEX_SWARM_LIVE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExecMsg(`✅ Executed ${swarmDirection} 0.01 ${activeSymbol} into MT5 Bridge!`);
        setTimeout(() => setExecMsg(null), 4500);
      }
    } catch (e) {
      setExecMsg('Execution failed');
      setTimeout(() => setExecMsg(null), 3000);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <header className="flex flex-col gap-2 border border-line bg-panel px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center border border-ink bg-ink text-[13px] font-bold tracking-tight text-paper">
            CT
            <span className="absolute -right-[3px] -bottom-[3px] h-[6px] w-[6px] bg-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[13px] font-bold tracking-[0.24em] text-ink">THE CLEVER TRADER</h1>
              <span className="text-[10px] tracking-[0.16em] text-ink-faint">/ VORTEX TERMINAL</span>
              {isEmbedded ? (
                <Link
                  href="/vortex"
                  prefetch={true}
                  className="ml-2 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all font-mono"
                  title="Open Fullscreen Vortex Terminal"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span>FULLSCREEN</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  prefetch={true}
                  className="ml-2 flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-ink/5 border border-line-strong text-ink-soft hover:text-ink hover:bg-ink/10 transition-all font-mono"
                  title="Return to Main Command Center"
                >
                  <ArrowLeft className="w-2.5 h-2.5" />
                  <span>COMMAND CENTER</span>
                </Link>
              )}
            </div>
            <div className="mt-[2px] flex items-center gap-2 text-[8.5px] tracking-[0.2em] text-ink-faint uppercase font-mono">
              <span>six agents · real-time mt5 telemetry</span>
              <span className="text-accent">·</span>
              <span className={isConnected ? "text-up font-bold flex items-center gap-1" : "text-ink-faint"}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${isConnected ? "bg-up ct-pulse" : "bg-ink-faint"}`} />
                {isConnected ? `LIVE MT5 (${mt5?.server || 'EXNESS'})` : 'MT5 BRIDGE READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Controls: Swarm Bot Toggle + 1-Click Order Execution */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <button
            type="button"
            onClick={handleToggleBot}
            disabled={isBotToggling}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded transition-all border",
              s.botActive
                ? "bg-up/15 border-up/40 text-up hover:bg-up/25 shadow-[0_0_10px_rgba(0,255,157,0.2)]"
                : "bg-ink/5 border-line-strong text-ink-soft hover:text-ink hover:bg-ink/10"
            )}
            title="Toggle Autonomous Swarm Execution"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.botActive ? "bg-up animate-ping" : "bg-ink-faint"}`} />
            <span>SWARM BOT: {s.botActive ? "ACTIVE" : "PAUSED"}</span>
          </button>

          <button
            type="button"
            onClick={handleExecuteSwarm}
            disabled={isExecuting}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold rounded transition-all shadow-sm border",
              swarmDirection === "BUY"
                ? "bg-up/20 border-up/50 text-up hover:bg-up/30 shadow-[0_0_12px_rgba(0,255,157,0.25)]"
                : "bg-down/20 border-down/50 text-down hover:bg-down/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
            )}
            title={`Direct 1-Click Execution of ${swarmDirection} into MT5`}
          >
            <span>{isExecuting ? "SENDING..." : `⚡ EXECUTE ${swarmDirection} 0.01`}</span>
          </button>

          <div className="hidden items-center gap-3 md:flex border-l border-line pl-3">
            <MiniStat label="REGIME" value={s.regime} tone="accent" />
            <MiniStat label="SHARPE" value={s.sharpe.toFixed(2)} />
            <MiniStat label="MAX DD" value={`${s.maxDd.toFixed(2)}%`} tone={s.maxDd > 5 ? "down" : "ink"} />
            <MiniStat label="CLOCK" value={s.clock} />
          </div>

          <div className="flex items-center gap-2 border-l border-line pl-3">
            <div className="text-right">
              <Label>MT5 BALANCE / EQUITY</Label>
              <div className="text-[13px] leading-none font-bold tabular-nums text-ink font-mono">
                ${fmtNum(mt5?.balance ?? s.gross, 2)}
                <span className="ml-1.5 text-[11px] font-semibold text-accent">
                  (Eq: ${fmtNum(mt5?.equity ?? (mt5?.balance ?? s.gross), 2)})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {execMsg && (
        <div className="flex items-center justify-between px-3 py-1 text-[10px] font-mono rounded bg-accent/15 border border-accent/40 text-accent animate-fade-in">
          <span>{execMsg}</span>
          <span className="text-[9px] text-ink-faint">DISPATCHED TO MT5 BRIDGE</span>
        </div>
      )}
    </header>
  );
}

function Ticker() {
  const s = useTerminal();
  const bal = s.mt5Status?.balance ?? s.gross;
  const floatPnl = s.mt5Status?.floatingProfit ?? s.netPnl;
  const items = [
    `REAL-TIME MT5 SWARM FEED`,
    `ACCOUNT ${s.mt5Status?.isConnected ? 'ONLINE' : 'STANDBY'}`,
    `BALANCE $${fmtNum(bal, 2)}`,
    `FLOATING ${floatPnl >= 0 ? '+' : ''}$${fmtNum(floatPnl, 2)}`,
    `SIX AGENTS ENGAGED 06/06`,
    `${s.symbol || 'XAUUSD'} ${fmtNum(s.price, s.price > 1000 ? 2 : 4)}`,
    `SPREAD ${((s.asks[0]?.p ?? 0) - (s.bids[0]?.p ?? 0)).toFixed(s.price > 1000 ? 2 : 5)}`,
    `SWARM WIN RATE ${s.winRate.toFixed(1)}%`,
    `VORTEX VELOCITY ${s.vortexVelocity.toFixed(2)}`,
    `EXECUTION VENUE: EXNESS MT5 RAW`,
  ];
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span
          key={i}
          className="flex items-center gap-3 px-4 text-[9.5px] tracking-[0.16em] whitespace-nowrap text-ink-soft uppercase font-mono"
        >
          <span className="h-[4px] w-[4px] bg-accent/60" />
          {it}
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border border-line bg-panel py-[5px]">
      <div className="ct-marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}

function KpiRow() {
  const s = useTerminal();
  const mt5 = s.mt5Status;
  const bal = mt5?.balance ?? s.gross;
  const eq = mt5?.equity ?? bal;
  const floatPnl = mt5?.floatingProfit ?? s.netPnl;
  const openCount = mt5?.openPositionsCount ?? 0;
  const isConnected = mt5?.isConnected ?? false;

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [editBalance, setEditBalance] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [balanceToast, setBalanceToast] = useState<string | null>(null);

  // Restore saved customized balance on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ct_mt5_balance');
      if (saved && parseFloat(saved) > 0) {
        const savedVal = parseFloat(saved);
        fetch('/api/mt5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_balance',
            balance: savedVal,
            equity: savedVal,
          }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const handleOpenBalanceModal = () => {
    setEditBalance(String(bal));
    setIsBalanceModalOpen(true);
  };

  const handleSaveBalance = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = parseFloat(editBalance);
    if (isNaN(val) || val < 0) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/mt5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_balance',
          balance: val,
          equity: val + (mt5?.floatingProfit || 0),
          freeMargin: val,
          server: mt5?.server || 'Exness-MT5Trial16',
          login: mt5?.login || '472658395',
        }),
      });
      if (res.ok) {
        try {
          localStorage.setItem('ct_mt5_balance', String(val));
        } catch {}
        vortexEngine.syncLiveTelemetry({
          mt5: {
            ...mt5,
            balance: val,
            equity: val + (mt5?.floatingProfit || 0),
            freeMargin: val,
          }
        });
        setBalanceToast(`Balance updated to $${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        setTimeout(() => setBalanceToast(null), 3500);
        setIsBalanceModalOpen(false);
      }
    } catch (err) {
      console.error('Balance update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const PRESETS = [500, 1000, 3000, 5000, 10000, 25000, 50000];

  return (
    <>
      <div className="relative grid grid-cols-2 border border-line bg-panel sm:grid-cols-3 xl:grid-cols-6 font-mono">
        {/* Interactive Account Balance Card */}
        <div 
          onClick={handleOpenBalanceModal}
          className="cursor-pointer group relative transition-all hover:bg-accent/10 select-none"
          title="Click to Edit & Synchronize MT5 Account Balance"
        >
          <Stat
            label="MT5 ACCOUNT BALANCE"
            value={`$${fmtNum(bal, 2)}`}
            sub={isConnected ? `EQUITY $${fmtNum(eq, 2)} · ${mt5?.server || 'EXNESS'}` : "BRIDGE READY"}
            accessory={
              <span className="flex items-center gap-1 text-[8.5px] px-1.5 py-0.5 rounded border border-line bg-panel group-hover:border-accent/60 group-hover:text-accent group-hover:bg-accent/10 transition-all text-ink-faint shadow-sm">
                <Pencil className="w-2.5 h-2.5 text-accent" />
                <span className="font-bold">EDIT</span>
              </span>
            }
          />
        </div>

        <Stat
          label="MT5 FLOATING P&L"
          value={`${floatPnl >= 0 ? "+" : "−"}$${fmtNum(Math.abs(floatPnl), 2)}`}
          tone={floatPnl >= 0 ? "up" : "down"}
          sub={`${s.dayPct >= 0 ? "+" : ""}${s.dayPct.toFixed(2)}% ON EQUITY`}
        />
        <Stat
          label="SWARM WIN RATE"
          value={`${s.winRate.toFixed(1)}%`}
          tone="accent"
          sub={`${openCount} OPEN POSITIONS · LIVE MT5`}
        />
        <Stat
          label="MAX ACCOUNT DD"
          value={`${s.maxDd.toFixed(2)}%`}
          tone={s.maxDd > 5 ? "down" : "accent"}
          sub="PEAK-TO-TROUGH DRAWDOWN"
        />
        <Stat
          label="SWARM STATUS"
          value={s.botActive ? "AUTONOMOUS ON" : "MANUAL MODE"}
          tone={s.botActive ? "up" : "ink"}
          sub="AI MULTI-AGENT SWARM"
        />
        <Stat
          label="EXECUTION VENUE"
          value={isConnected ? "MT5 LIVE BRIDGE" : "EXNESS RAW"}
          tone={isConnected ? "up" : "down"}
          sub={isConnected ? `LOGIN #${mt5?.login || '472658395'}` : "EXNESS MT5 TRIAL"}
        />
      </div>

      {/* Floating Success Toast */}
      {balanceToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-up/40 bg-black/95 backdrop-blur-md text-up text-xs font-mono font-bold shadow-[0_10px_30px_rgba(0,255,157,0.25)] animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-up" />
          <span>{balanceToast}</span>
        </div>
      )}

      {/* Quick Balance Update Modal */}
      {isBalanceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBalanceModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-accent/40 bg-[#070b09] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,255,157,0.15)] font-mono text-ink animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 text-accent shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                  <Wallet className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-ink uppercase">
                    UPDATE MT5 ACCOUNT BALANCE
                  </h3>
                  <p className="text-[10px] text-ink-faint">
                    Exness Login #{mt5?.login || '472658395'} · {mt5?.server || 'Exness-MT5Trial16'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBalanceModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-faint hover:bg-ink/10 hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveBalance} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-ink-soft mb-1.5">
                  Account Balance ($ USD)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-accent font-bold text-base">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    placeholder="10000.00"
                    className="w-full rounded-lg border border-accent/40 bg-[#020503] pl-8 pr-3 py-2.5 text-base font-bold text-ink tabular-nums focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="block text-[9px] font-semibold text-ink-faint uppercase mb-1.5">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditBalance(String(preset))}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded border transition-all",
                        parseFloat(editBalance) === preset
                          ? "bg-accent/25 border-accent text-accent shadow-[0_0_10px_rgba(0,255,157,0.2)]"
                          : "bg-ink/5 border-line-strong text-ink-soft hover:border-accent/40 hover:text-ink hover:bg-accent/5"
                      )}
                    >
                      ${preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Projected Stats Preview */}
              <div className="rounded-lg border border-line bg-[#030704] p-3 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-faint">PROJECTED BALANCE:</span>
                  <span className="font-bold text-ink">${fmtNum(parseFloat(editBalance) || 0, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint">PROJECTED EQUITY:</span>
                  <span className="font-bold text-accent">
                    ${fmtNum((parseFloat(editBalance) || 0) + (mt5?.floatingProfit || 0), 2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-faint">FLOATING P&L:</span>
                  <span className={floatPnl >= 0 ? "text-up font-bold" : "text-down font-bold"}>
                    {floatPnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(floatPnl), 2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="px-3 py-2 text-[11px] font-bold rounded-lg border border-line-strong text-ink-soft hover:bg-ink/10 hover:text-ink transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editBalance || isNaN(parseFloat(editBalance))}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold rounded-lg border border-accent/60 bg-accent text-black hover:bg-[#00e68c] shadow-[0_0_18px_rgba(0,255,157,0.35)] transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>SAVING...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>SAVE & SYNC BALANCE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function VortexPanel() {
  const s = useTerminal();
  const intel = JarvisIntelligenceBrain.getCentralIntelligence(s.symbol || 'XAUUSD', s.price, s.candles);
  const isBull = intel.masterDirection === 'STRONG_BUY' || intel.masterDirection === 'BUY';
  const isBear = intel.masterDirection === 'STRONG_SELL' || intel.masterDirection === 'SELL';
  const regimeTag = isBull ? "BULLISH EXPANSION" : isBear ? "BEARISH BREAKDOWN" : "COMPRESSION / COILING";
  const regimeTone: "up" | "down" | "accent" = isBull ? "up" : isBear ? "down" : "accent";

  return (
    <Panel
      title="THE VORTEX"
      tag={regimeTag}
      tagTone={regimeTone}
      className="h-[330px] xl:h-[360px]"
      bodyClassName="relative h-[290px] xl:h-[320px] overflow-hidden ct-grid-bg"
    >
      <VortexSphere />
      <div className="pointer-events-none absolute inset-0 p-2.5 font-mono text-[9px]">
        {/* Top Header Information */}
        <div className="flex justify-between items-start">
          <div>
            <Label>CHARGE SPIRAL / TOTAL SYNTHESIS</Label>
            <div className="mt-[2px] flex items-center gap-2 text-[8.5px] text-ink-soft">
              <span>6 STRAND WEAVE · 156 NODES</span>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" title="NEXUS AI" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" title="SMC" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" title="COT" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" title="VOL" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" title="GEMINI" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#ec4899]" title="RISK" />
              </div>
            </div>
          </div>
          <div className="text-right">
            <Label>TENSION</Label>
            <div className="text-[11px] tabular-nums text-ink font-bold">
              {(s.vortexVelocity * 2.4 + 0.6).toFixed(3)}
            </div>
          </div>
        </div>

        {/* Floating HUD: Angular Velocity (Left with Cyan Accent Border) */}
        <div className="absolute bottom-7 left-2.5 border border-line border-l-2 border-l-accent bg-panel/90 px-2 py-1 backdrop-blur-md shadow-sm">
          <Label>ANGULAR VELOCITY</Label>
          <div className="text-[12px] tabular-nums text-accent font-bold">
            {s.vortexVelocity.toFixed(2)} rad/s
          </div>
        </div>

        {/* Floating HUD: Coil Status (Right with Amber Accent Border) */}
        <div className="absolute right-2.5 bottom-7 border border-line border-l-2 border-l-amber-500 bg-panel/90 px-2 py-1 text-right backdrop-blur-md shadow-sm">
          <Label>COIL STATUS</Label>
          <div className="text-[12px] tabular-nums text-ink font-bold">
            {s.coilStatus.toFixed(2)} u
          </div>
        </div>

        {/* Bottom Continuous Feed Footer */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2.5 py-1 text-[8px] tracking-[0.12em] text-ink-faint border-t border-line/40 bg-panel/40 uppercase">
          <span>{isBull ? "BULLISH EXPANSION / GREEN MOMENTUM" : isBear ? "BEARISH BREAKDOWN / RED PRESSURE" : "COILING ENERGY / NEUTRAL RANGE"}</span>
          <span>CONTINUOUS FEED</span>
        </div>
      </div>
    </Panel>
  );
}

function PricePanel({
  activeSymbol,
  activeTimeframe = '15m',
  onTimeframeChange,
  onSymbolChange,
  candles,
  livePrice,
}: {
  activeSymbol?: string;
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onSymbolChange?: (sym: string) => void;
  candles?: any[];
  livePrice?: number;
}) {
  const s = useTerminal();
  const lastC = candles && candles.length > 0 ? Number(candles[candles.length - 1].c ?? candles[candles.length - 1].close ?? 0) : 0;
  const currentPrice = (livePrice && livePrice > 0) ? livePrice : (lastC > 0 ? lastC : s.price);
  const first = candles && candles.length > 0 ? Number(candles[0]?.o ?? candles[0]?.open ?? currentPrice) : (s.candles[0]?.o ?? currentPrice);
  const chg = first > 0 ? ((currentPrice - first) / first) * 100 : 0;
  const up = currentPrice >= (s.prevPrice || currentPrice);
  const cleanSym = (activeSymbol || 'XAUUSD').toUpperCase();
  const title = `${cleanSym} / USD`;
  const [isChartFlipped, setIsChartFlipped] = useState(false);

  return (
    <Panel
      title={title}
      tag="REAL-TIME FEED"
      tagTone={up ? "up" : "down"}
      right={
        <div className="flex items-center gap-2">
          {/* 1-Click Asset Switcher */}
          <div className="flex items-center gap-0.5 bg-black/60 rounded p-0.5 border border-line">
            {['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'USDJPY', 'NAS100'].map((sym) => {
              const isSel = cleanSym === sym;
              return (
                <button
                  key={sym}
                  onClick={() => onSymbolChange?.(sym)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all ${
                    isSel
                      ? 'bg-accent text-black font-extrabold shadow-sm'
                      : 'text-ink-faint hover:text-white hover:bg-white/10'
                  }`}
                >
                  {sym}
                </button>
              );
            })}
          </div>
          <span className="text-[9px] tracking-[0.14em] text-ink-faint font-mono hidden sm:inline">
            {activeTimeframe.toUpperCase()} · EXNESS MT5
          </span>
          {/* ⇅ FLIP CHART VERTICALLY (IC Invert Toggle) */}
          <button
            onClick={() => setIsChartFlipped(prev => !prev)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold transition-all border ${
              isChartFlipped
                ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-black/40 text-ink-faint hover:text-white border-line hover:bg-white/10'
            }`}
            title={isChartFlipped ? 'Chart FLIPPED ⇅ — Click to Reset' : 'Flip Chart Vertically ⇅ (IC Invert)'}
          >
            <FlipVertical2 className={`w-3 h-3 transition-transform duration-300 ${isChartFlipped ? 'rotate-180 text-amber-400' : ''}`} />
            <span>{isChartFlipped ? '⊖' : '⊕'} FLIP</span>
          </button>
        </div>
      }
      className="h-[330px] xl:h-[360px]"
      bodyClassName="relative h-[290px] xl:h-[320px] overflow-hidden flex flex-col"
    >
      <div className="flex items-end justify-between border-b border-line px-3 py-1.5 font-mono">
        <div className="flex items-baseline gap-3">
          <div
            className={cn(
              "text-[26px] leading-none font-bold tabular-nums",
              up ? "text-up" : "text-down"
            )}
          >
            {fmtNum(currentPrice, currentPrice > 1000 ? 2 : currentPrice > 100 ? 2 : 4)}
          </div>
          <div className={cn("text-[11px] tabular-nums font-semibold", chg >= 0 ? "text-up" : "text-down")}>
            {chg >= 0 ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}%
          </div>
        </div>
        <div className="hidden gap-4 text-right sm:flex">
          <div>
            <Label>24H HIGH</Label>
            <div className="text-[10px] tabular-nums text-ink font-semibold">
              {(() => {
                const highs = (candles && candles.length > 0 ? candles : s.candles).map((c: any) => c.h ?? c.high).filter((v: any) => typeof v === 'number' && !isNaN(v) && v > 0);
                const val = highs.length ? Math.max(...highs, currentPrice) : currentPrice;
                return fmtNum(val, currentPrice > 1000 ? 1 : 4);
              })()}
            </div>
          </div>
          <div>
            <Label>24H LOW</Label>
            <div className="text-[10px] tabular-nums text-ink font-semibold">
              {(() => {
                const lows = (candles && candles.length > 0 ? candles : s.candles).map((c: any) => c.l ?? c.low).filter((v: any) => typeof v === 'number' && !isNaN(v) && v > 0);
                const val = lows.length ? Math.min(...lows, currentPrice) : currentPrice;
                return fmtNum(val, currentPrice > 1000 ? 1 : 4);
              })()}
            </div>
          </div>
          <div>
            <Label>SPREAD</Label>
            <div className="text-[10px] tabular-nums text-ink font-semibold">
              {((s.asks[0]?.p ?? 0) - (s.bids[0]?.p ?? 0)).toFixed(currentPrice > 1000 ? 2 : 5)}
            </div>
          </div>
        </div>
      </div>
      <div className={`min-h-0 flex-1 transition-transform duration-500 ease-in-out ${isChartFlipped ? 'scale-y-[-1]' : ''}`}>
        <CandleChart
          candles={candles}
          timeframe={activeTimeframe}
          onTimeframeChange={onTimeframeChange}
          symbol={cleanSym}
          livePrice={currentPrice}
        />
      </div>
    </Panel>
  );
}

function Footer() {
  const s = useTerminal();
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border border-line bg-panel px-3 py-[5px] text-[9px] tracking-[0.14em] text-ink-faint uppercase font-mono">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-up font-bold">
          <span className="h-[6px] w-[6px] rounded-full bg-up ct-pulse" /> SYSTEM NOMINAL
        </span>
        <span>KERNEL v4.18 · SUB-10MS TAPE</span>
        <span>PRIME BROKER: EXNESS MT5 TRIAL</span>
        <span>SESSION {s.clock}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>THE CLEVER TRADER QUANT TERMINAL · MT5 LIVE MULTI-AGENT SWARM</span>
      </div>
    </footer>
  );
}

export interface VortexTerminalProps {
  isEmbedded?: boolean;
  activeSymbol?: string;
  activeTimeframe?: string;
  onTimeframeChange?: (tf: string) => void;
  onSymbolChange?: (sym: string) => void;
  candles?: any[];
  livePrice?: number;
}

export function VortexTerminal({
  isEmbedded = false,
  activeSymbol,
  activeTimeframe = '15m',
  onTimeframeChange,
  onSymbolChange,
  candles,
  livePrice,
}: VortexTerminalProps) {
  const s = useTerminal();
  const navLast = s.navSeries[s.navSeries.length - 1];
  const navPrev = s.navSeries[s.navSeries.length - 30] ?? navLast;

  return (
    <div className="w-full bg-paper p-2 font-mono text-ink select-none md:p-3">
      <div className="flex w-full flex-col gap-2">
        <Header isEmbedded={isEmbedded} activeSymbol={activeSymbol} />
        <Ticker />
        <KpiRow />

        {/* Middle Grid: Left (Vortex + Signal Mesh) + Right (Candles + Depth + Exposure) */}
        <div className="grid gap-2 xl:grid-cols-12">
          <div className="flex flex-col gap-2 xl:col-span-5">
            <VortexPanel />
            <Panel
              title="THE KERNEL / SIGNAL MESH"
              tag="LIVE MULTI-AGENT"
              tagTone="accent"
              className="h-[132px]"
              bodyClassName="relative"
            >
              <SignalMesh
                symbol={activeSymbol || 'XAUUSD'}
                livePrice={livePrice}
                candles={candles}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-2 py-1 text-[8.5px] tracking-[0.12em] text-ink-faint font-mono">
                <span>CONFLUENCE {(() => {
                  const intel = JarvisIntelligenceBrain.getCentralIntelligence(activeSymbol || 'XAUUSD', livePrice, candles);
                  return `${intel.masterConfluencePercent}% ${intel.masterDirection.replace('_', ' ')}`;
                })()}</span>
                <span>NODES 42 SYNAPSES</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="inline-block h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                  LATENCY &lt; 8MS MT5
                </span>
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-2 xl:col-span-7">
            <PricePanel
              activeSymbol={activeSymbol}
              activeTimeframe={activeTimeframe}
              onTimeframeChange={onTimeframeChange}
              onSymbolChange={onSymbolChange}
              candles={candles}
              livePrice={livePrice}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Panel title="ORDER BOOK / AGG DEPTH" tag="L2" className="h-[132px]">
                <div className="flex items-center justify-between border-b border-line px-1.5 py-[2px] text-[8.5px] tracking-[0.12em] text-ink-faint font-mono">
                  <span>BID</span>
                  <span>ASK</span>
                </div>
                <DepthLadder bids={s.bids} asks={s.asks} />
              </Panel>
              <Panel title="AGENT EXPOSURE MAP" tag="AI MODELS" className="h-[132px]">
                <div className="flex h-full flex-col justify-center gap-[5px] px-2.5">
                  {s.agents.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <span className="w-20 text-[8.5px] tracking-[0.05em] font-bold truncate" style={{ color: a.color }}>
                        {a.name || a.id}
                      </span>
                      <div className="h-[5px] flex-1 bg-line/70 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-[width] duration-300 rounded-full"
                          style={{ width: `${Math.min(100, (a.exposure / 48) * 100)}%`, background: a.color }}
                        />
                      </div>
                      <span className="px-1 py-[0.5px] rounded text-[7.5px] font-bold border border-line bg-panel/80 text-accent">
                        {a.state}
                      </span>
                      <span className="w-7 text-right text-[8.5px] tabular-nums font-bold text-ink-soft">
                        {a.exposure.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>

        {/* Lower Grid: Combined Project + Hesitation Track + Execution Stream */}
        <div className="grid gap-2 xl:grid-cols-12">
          <Panel
            title="COMBINED PROJECT"
            tag={navLast >= navPrev ? "COMPOUNDING" : "GIVEBACK"}
            tagTone={navLast >= navPrev ? "up" : "down"}
            className="h-[168px] xl:col-span-3"
            bodyClassName="flex flex-col"
          >
            <div className="px-2.5 pt-1.5 font-mono">
              <div
                className={cn(
                  "text-[17px] leading-none font-bold tabular-nums",
                  navLast >= 0 ? "text-up" : "text-down"
                )}
              >
                {navLast >= 0 ? "+" : "−"}${fmtNum(Math.abs(navLast), 0)}
              </div>
              <div className="mt-[2px] text-[8.5px] tracking-[0.12em] text-ink-faint">
                EQUITY CURVE · SESSION TO DATE
              </div>
            </div>
            <div className="min-h-0 flex-1 px-1 pb-1">
              <AreaCurve data={s.navSeries} />
            </div>
          </Panel>

          <Panel
            title="HESITATION TRACK"
            tag={`DD ${s.maxDd.toFixed(2)}%`}
            tagTone="down"
            className="h-[168px] xl:col-span-3"
            bodyClassName="flex flex-col"
          >
            <div className="px-2.5 pt-1.5 text-[8.5px] tracking-[0.12em] text-ink-faint font-mono">
              PEAK-TO-TROUGH GIVEBACK PER CYCLE
            </div>
            <div className="min-h-0 flex-1 px-1 pb-1">
              <DrawdownChart data={s.drawdown} />
            </div>
          </Panel>

          <Panel
            title="EXECUTION STREAM"
            tag={`${s.fills.length} ROWS`}
            tagTone="accent"
            className="h-[168px] xl:col-span-6"
            bodyClassName="overflow-hidden"
          >
            <ExecutionStream fills={s.fills} />
          </Panel>
        </div>

        {/* The Six / Agent Ledger */}
        <div className="flex items-center justify-between px-[2px] pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] font-bold text-ink">THE SIX / AGENT LEDGER</span>
            <Tag tone="neutral">SHARED P&L BOOK</Tag>
          </div>
          <span className="text-[8.5px] tracking-[0.14em] text-ink-faint uppercase font-mono">
            live execution stream · sub-10ms tape
          </span>
        </div>

        <AgentLedger agents={s.agents} />
        <Footer />
      </div>
    </div>
  );
}

export default VortexTerminal;

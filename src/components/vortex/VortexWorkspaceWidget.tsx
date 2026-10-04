'use client';

import React, { useSyncExternalStore, useState, useEffect } from 'react';
import Link from 'next/link';
import { vortexEngine, fmtNum } from '@/lib/vortex/vortex-engine';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { CandleData } from './CandleChart';
import { JarvisIntelligenceBrain } from '@/lib/ai/jarvis-brain';
import { calculateWeightedOrderBookImbalance } from '@/lib/data/real-orderbook';
import { VortexSphere } from './VortexSphere';
import { CandleChart } from './CandleChart';
import { SignalMesh } from './SignalMesh';
import { DepthLadder } from './VortexCharts';
import { Panel, Label, Tag } from './VortexUI';
import { Maximize2, Activity, Cpu } from 'lucide-react';
import { AiDebateModal } from '../jarvis/AiDebateModal';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';

function useTerminal() {
  return useSyncExternalStore(
    vortexEngine.subscribe,
    vortexEngine.getSnapshot,
    vortexEngine.getServerSnapshot
  );
}

interface VortexWorkspaceWidgetProps {
  symbol?: string;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

export function VortexWorkspaceWidget({
  symbol = 'BTCUSD',
  timeframe = '15m',
  onTimeframeChange,
}: VortexWorkspaceWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const s = useTerminal();
  const { ticks } = useMarketData();
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isDebateOpen, setIsDebateOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSym = symbol.toUpperCase();
  const currentTick = ticks[activeSym];

  const [orderBook, setOrderBook] = useState<{
    bids: { p: number; s: number }[];
    asks: { p: number; s: number }[];
    spread?: number;
    source?: string;
  }>({ bids: [], asks: [] });

  // Map timeframe string to minutes
  const getTfMinutes = (tf?: string): number => {
    if (!tf) return 15;
    const t = tf.toLowerCase();
    if (t === '30s') return 0.5;
    if (t === '1m') return 1;
    if (t === '5m') return 5;
    if (t === '15m') return 15;
    if (t === '30m') return 30;
    if (t === '1h' || t === '60m') return 60;
    if (t === '4h' || t === '240m') return 240;
    if (t === '1d' || t === 'd') return 1440;
    return 15;
  };

  // Determine decimal digits
  const getDigits = (sym: string, p: number) => {
    if (sym.includes('JPY')) return 3;
    if (sym.includes('EUR') || sym.includes('GBP') || sym.includes('AUD') || sym.includes('NZD') || sym.includes('CAD') || sym.includes('CHF')) return 4;
    if (p > 1000) return 2;
    if (p > 100) return 2;
    return 4;
  };

  // Fetch real-time live candles & real L2 order book for the selected market asset
  useEffect(() => {
    let isMounted = true;
    const tfMinutes = getTfMinutes(timeframe);

    const fetchLiveCandles = async () => {
      try {
        const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(activeSym)}&timeframe=${tfMinutes}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.candles && Array.isArray(data.candles) && data.candles.length > 0) {
          setCandles(data.candles);
          const liveP = data.spec?.currentPrice ?? data.candles[data.candles.length - 1].close;
          vortexEngine.setMarketData(activeSym, liveP, data.candles, timeframe);
        }

        if (data.orderBook && data.orderBook.bids && data.orderBook.asks) {
          setOrderBook(data.orderBook);
        }
      } catch (err) {
        console.warn('Vortex live candle fetch error:', err);
      }
    };

    fetchLiveCandles();
    const interval = setInterval(fetchLiveCandles, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSym, timeframe]);

  // Push immediate live tick updates to the engine and order book
  useEffect(() => {
    if (currentTick?.price && currentTick.price > 0) {
      vortexEngine.setMarketData(activeSym, currentTick.price);
    }
  }, [activeSym, currentTick?.price]);

  // Keep top of order book and real spread in exact sync with real MT5 / Biquote ticks
  useEffect(() => {
    if (currentTick?.bid && currentTick?.ask && currentTick.bid > 0 && currentTick.ask > 0) {
      setOrderBook(prev => {
        if (!prev.bids.length) return prev;
        const newBids = [...prev.bids];
        const newAsks = [...prev.asks];
        newBids[0] = { p: currentTick.bid, s: newBids[0]?.s ?? 2.5 };
        newAsks[0] = { p: currentTick.ask, s: newAsks[0]?.s ?? 3.2 };
        return {
          ...prev,
          bids: newBids,
          asks: newAsks,
          spread: Number((currentTick.ask - currentTick.bid).toFixed(getDigits(activeSym, currentTick.bid))),
        };
      });
    }
  }, [currentTick?.bid, currentTick?.ask, activeSym]);

  const livePrice = currentTick?.price ?? (candles.length > 0 ? (candles[candles.length - 1].close ?? candles[candles.length - 1].c ?? s.price) : s.price);
  const up = livePrice >= (s.prevPrice || livePrice);
  const digits = getDigits(activeSym, livePrice);

  const intel = JarvisIntelligenceBrain.getCentralIntelligence(activeSym, livePrice, candles, orderBook);
  const isBull = intel.masterDirection === 'STRONG_BUY' || intel.masterDirection === 'BUY';
  const isBear = intel.masterDirection === 'STRONG_SELL' || intel.masterDirection === 'SELL';
  const regimeTag = isBull ? "BULLISH EXPANSION" : isBear ? "BEARISH BREAKDOWN" : "COMPRESSION / COILING";
  const regimeTone: "up" | "down" | "accent" = isBull ? "up" : isBear ? "down" : "accent";

  const obi = calculateWeightedOrderBookImbalance(orderBook, 5);

  const aiAgents = [
    {
      id: 'FINROBOT',
      name: 'FINROBOT AI',
      role: 'CONSENSUS',
      color: '#00f0ff',
      exposure: Math.min(100, Math.max(20, intel.masterConfluencePercent)),
      status: intel.masterDirection.replace('_', ' '),
      tagColor: intel.masterDirection.includes('BUY') ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    },
    {
      id: 'SMC_ICT',
      name: 'SMC / ICT',
      role: 'STRUCTURE',
      color: '#10b981',
      exposure: Math.min(100, Math.max(20, intel.corePillars.technicalSMC.score)),
      status: intel.corePillars.technicalSMC.structure,
      tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    },
    {
      id: 'VOL_L2',
      name: 'L2 ORDER FLOW',
      role: 'MICROSTRUCTURE',
      color: '#f59e0b',
      exposure: Math.min(98, Math.max(30, Math.round(50 + Math.abs(obi.imbalanceRatio) * 45))),
      status: obi.imbalanceRatio >= 0.18 ? `BID +${obi.percentage}%` : obi.imbalanceRatio <= -0.18 ? `ASK ${obi.percentage}%` : 'BALANCED',
      tagColor: obi.imbalanceRatio >= 0.18 ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' : obi.imbalanceRatio <= -0.18 ? 'text-rose-400 border-rose-500/40 bg-rose-500/10' : 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    },
    {
      id: 'CFTC_COT',
      name: 'CFTC COT',
      role: 'SMART MONEY',
      color: '#a855f7',
      exposure: Math.min(100, Math.max(20, intel.corePillars.cftcSmartMoney.score)),
      status: intel.corePillars.cftcSmartMoney.bias,
      tagColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    },
    {
      id: 'KELLY_RISK',
      name: 'KELLY RISK',
      role: 'GUARDIAN',
      color: '#3b82f6',
      exposure: Math.min(95, Math.max(40, intel.masterConfluencePercent - 4)),
      status: '0.25x SAFE',
      tagColor: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
    },
  ];

  return (
    <div className="w-full bg-paper text-ink p-2 sm:p-3 font-mono select-none rounded-b-lg transition-colors duration-200">
      {/* Top Embedded Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-line">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-ink text-paper text-[10px] font-bold tracking-wider">
            <span>CT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-widest text-ink">
            VORTEX QUANT ENGINE
          </span>
          <Tag tone="accent">SWARM v4.18</Tag>
          <span className="text-[9px] text-ink-soft hidden sm:inline">
            6 AGENTS · 1 BOOK · LIVE QUANT TAPE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-[10px]">
            <div>
              <span className="text-ink-faint">REGIME: </span>
              <span className="font-bold text-accent">{s.regime}</span>
            </div>
            <div>
              <span className="text-ink-faint">VELOCITY: </span>
              <span className="font-bold text-accent">{s.vortexVelocity.toFixed(2)} rad/s</span>
            </div>
            <div>
              <span className="text-ink-faint">SHARPE: </span>
              <span className="font-bold text-ink">{s.sharpe.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => setIsDebateOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-[10px] font-bold transition-all shadow-sm"
            title="Open FinRobot Multi-Agent Bull vs Bear Debate"
          >
            <span>⚖️ AI DEBATE</span>
          </button>

          <Link
            href="/vortex"
            prefetch={true}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-accent hover:opacity-90 text-white text-[10px] font-bold transition-all shadow-sm"
            title="Open Fullscreen Vortex Arena Dashboard"
          >
            <Maximize2 className="w-3 h-3" />
            <span>EXPAND ARENA VIEW</span>
          </Link>
        </div>
      </div>

      {/* Main Dual View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        {/* Left: 3D Vortex Coil + Signal Mesh */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <Panel
            title="THE VORTEX"
            tag={regimeTag}
            tagTone={regimeTone}
            className="h-[330px]"
            bodyClassName="relative h-[295px] overflow-hidden ct-grid-bg"
          >
            <VortexSphere />
            <div className="pointer-events-none absolute inset-0 p-2 font-mono text-[8.5px]">
              <div className="flex justify-between items-start">
                <div>
                  <Label>CHARGE SPIRAL / TOTAL SYNTHESIS</Label>
                  <div className="mt-[2px] flex items-center gap-1.5 text-[8px] text-ink-soft">
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
                  <div className="font-bold text-ink text-[10px]">{(s.vortexVelocity * 2.4 + 0.6).toFixed(3)}</div>
                </div>
              </div>

              <div className="absolute bottom-5 left-2 border border-line border-l-2 border-l-accent bg-panel/90 px-1.5 py-0.5 backdrop-blur-md shadow-sm">
                <Label>ANGULAR VELOCITY</Label>
                <div className="text-accent font-bold text-[11px]">{s.vortexVelocity.toFixed(2)} rad/s</div>
              </div>
              <div className="absolute bottom-5 right-2 border border-line border-l-2 border-l-amber-500 bg-panel/90 px-1.5 py-0.5 text-right backdrop-blur-md shadow-sm">
                <Label>COIL STATUS</Label>
                <div className="font-bold text-ink text-[11px]">{s.coilStatus.toFixed(2)} u</div>
              </div>

              <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 py-0.5 text-[7.5px] tracking-wider text-ink-faint border-t border-line/40 bg-panel/40 uppercase">
                <span>{isBull ? "BULLISH EXPANSION / GREEN MOMENTUM" : isBear ? "BEARISH BREAKDOWN / RED PRESSURE" : "COILING ENERGY / NEUTRAL RANGE"}</span>
                <span>CONTINUOUS FEED</span>
              </div>
            </div>
          </Panel>

          <Panel
            title="THE KERNEL / SIGNAL MESH"
            tag="LIVE MULTI-AGENT"
            tagTone="accent"
            className="h-[126px]"
            bodyClassName="relative h-[94px] overflow-hidden"
          >
            <SignalMesh symbol={activeSym} livePrice={livePrice} candles={candles} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-2 py-0.5 text-[8px] text-ink-faint">
              <span>CONFLUENCE {intel.masterConfluencePercent}% {intel.masterDirection.replace('_', ' ')}</span>
              <span>VERTICES 42 SYNAPSES</span>
              <span>LIVE MT5 L2</span>
            </div>
          </Panel>
        </div>

        {/* Right: Candlestick Tape + Order Book + Exposure */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          {(() => {
            const marketInfo = SessionFilterEngine.isMarketOpen(activeSym);
            return (
              <Panel
                title={`${activeSym} / QUANT TAPE [${timeframe}]`}
                tag={marketInfo.isOpen ? "LIVE" : "CLOSED"}
                tagTone={marketInfo.isOpen ? (up ? "up" : "down") : "down"}
                right={
                  <div className="flex items-center gap-2 text-[10px]" suppressHydrationWarning>
                    <span suppressHydrationWarning className={marketInfo.isOpen ? (up ? "text-up font-bold animate-pulse" : "text-down font-bold animate-pulse") : "text-ink-soft font-bold"}>
                      {fmtNum(livePrice, digits)}
                    </span>
                    {!marketInfo.isOpen && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold text-[8.5px]">
                        {marketInfo.label}
                      </span>
                    )}
                    <span suppressHydrationWarning className="text-ink-faint">
                      | SPREAD {(orderBook.spread ?? (((s.asks[0]?.p ?? 0) - (s.bids[0]?.p ?? 0)) || (livePrice * 0.0002))).toFixed(digits > 2 ? 4 : 2)}
                    </span>
                  </div>
                }
                className="h-[330px]"
                bodyClassName="relative h-[295px] overflow-hidden"
              >
                <CandleChart
                  candles={candles}
                  livePrice={livePrice}
                  symbol={activeSym}
                  priceDigits={digits}
                  timeframe={timeframe}
                  onTimeframeChange={onTimeframeChange}
                />
              </Panel>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Panel
              title="ORDER BOOK / AGG DEPTH"
              tag={orderBook.source ? (orderBook.source.includes('BINANCE') ? 'BINANCE L2' : 'MT5 L2') : 'LIVE L2'}
              tagTone="accent"
              className="h-[126px]"
            >
              <div className="flex items-center justify-between border-b border-line px-1.5 py-0.5 text-[8px] text-ink-faint">
                <span className="text-up font-bold">BID (LOTS)</span>
                <span className="text-down font-bold">ASK (LOTS)</span>
              </div>
              <DepthLadder
                bids={orderBook.bids.length ? orderBook.bids : s.bids}
                asks={orderBook.asks.length ? orderBook.asks : s.asks}
                priceDigits={digits}
              />
            </Panel>

            <Panel
              title="AGENT EXPOSURE MAP"
              tag="AI MODELS"
              tagTone="accent"
              className="h-[126px]"
              bodyClassName="p-2 overflow-hidden"
            >
              <div className="flex h-full flex-col justify-between gap-1">
                {aiAgents.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-1.5 text-[9px] font-mono leading-none">
                    <div className="flex items-center gap-1 w-20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: a.color }} />
                      <span className="font-bold truncate text-[8.5px]" style={{ color: a.color }}>
                        {a.name}
                      </span>
                    </div>
                    <div className="h-[4px] flex-1 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${a.exposure}%`, backgroundColor: a.color }}
                      />
                    </div>
                    <div className="flex items-center gap-1 min-w-[78px] justify-end shrink-0">
                      <span className={`px-1 py-[1px] rounded text-[7.5px] font-black border tracking-tight ${a.tagColor}`}>
                        {a.status}
                      </span>
                      <span className="w-7 text-right text-[8.5px] font-bold tabular-nums text-ink-soft">
                        {a.exposure.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <AiDebateModal
        isOpen={isDebateOpen}
        onClose={() => setIsDebateOpen(false)}
        symbol={activeSym}
        currentPrice={livePrice}
      />
    </div>
  );
}

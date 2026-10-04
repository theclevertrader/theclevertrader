/**
 * THE CLEVER TRADER — Vortex Terminal Engine
 * Quantitative multi-agent execution & telemetry engine.
 * Supports deterministic simulation + optional live tick integration.
 */

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type AgentId = "JARVIS" | "SMC_ICT" | "CFTC_COT" | "VOL_L2" | "GEMINI" | "RISK_AI";

export type Agent = {
  id: AgentId;
  name: string;
  role: string;
  mandate: string;
  color: string;
  pnl: number;
  series: number[];
  exposure: number;
  conviction: number;
  hitRate: number;
  fills: number;
  latency: number;
  state: "ENGAGED" | "SCANNING" | "COOLING" | "HEDGING" | "OPTIMAL" | "ACTIVE" | "SAFE";
  statusText?: string;
};

export type Fill = {
  id: number;
  time: string;
  agent: AgentId;
  side: "BUY" | "SELL";
  venue: string;
  strategy: string;
  size: number;
  price: number;
  pnl: number;
  isOpen?: boolean;
  ticket?: number;
};

export type ActiveTrade = {
  id: string | number;
  ticket?: number;
  symbol: string;
  side: "BUY" | "SELL";
  size: number;
  entryPrice: number;
  currentPrice?: number;
  sl?: number;
  tp?: number;
  pnl: number;
  time?: number | string;
  source: "MT5" | "BOT" | "MANUAL";
};

export type Snapshot = {
  version: number;
  clock: string;
  symbol: string;
  price: number;
  prevPrice: number;
  candles: Candle[];
  liveTrail: number[];
  agents: Agent[];
  fills: Fill[];
  activeTrades: ActiveTrade[];
  navSeries: number[];
  drawdown: number[];
  gross: number;
  netPnl: number;
  dayPct: number;
  winRate: number;
  signals: number;
  signalsPerMin: number;
  activeAgents: number;
  latency: number;
  eventRate: number;
  bookDepth: number;
  vortexVelocity: number;
  coilStatus: number;
  regime: "TREND" | "CHOP" | "SQUEEZE" | "REVERSION";
  risk: number;
  sharpe: number;
  maxDd: number;
  turnover: number;
  bids: { p: number; s: number }[];
  asks: { p: number; s: number }[];
  mt5Status?: {
    isConnected: boolean;
    balance: number;
    equity: number;
    freeMargin: number;
    server: string;
    login: string;
    floatingProfit: number;
    openPositionsCount: number;
  };
  botActive?: boolean;
};

const VENUES = ["EXNESS RAW", "EXNESS ZERO", "MT5 BRIDGE", "INTERBANK L2", "FIX PROTOCOL", "CT CORE ECN"];
const STRATS = [
  "ICT OB SWEEP",
  "FVG MITIGATION",
  "TURTLE SOUP",
  "COT SMART MONEY",
  "MICROSTRUCTURE DELTA",
  "KELLY LOT SIZING",
  "BREAK OF STRUCTURE",
  "LIQUIDITY RUN",
];

function rnd(): number {
  return Math.random();
}

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function pick<T>(a: T[]): T {
  return a[Math.floor(rnd() * a.length)];
}

const AGENT_SEED: Omit<
  Agent,
  "pnl" | "series" | "exposure" | "conviction" | "hitRate" | "fills" | "latency" | "state"
>[] = [
  { id: "JARVIS", name: "NEXUS AI", role: "MASTER", mandate: "Neural confluence & Roman Urdu reasoning", color: "#00f0ff" },
  { id: "SMC_ICT", name: "SMC / ICT", role: "STRUCTURE", mandate: "Order blocks, FVG & liquidity sweeps", color: "#10b981" },
  { id: "CFTC_COT", name: "CFTC COT", role: "SMART MONEY", mandate: "Institutional commercial positioning", color: "#8b5cf6" },
  { id: "VOL_L2", name: "VOL L2", role: "ORDER BOOK", mandate: "Real-time MT5 tick & depth flow", color: "#f59e0b" },
  { id: "GEMINI", name: "GEMINI AI", role: "VISION", mandate: "Multimodal visual pattern classifier", color: "#3b82f6" },
  { id: "RISK_AI", name: "RISK GUARD", role: "SAFEGUARD", mandate: "Capital preservation & news lockouts", color: "#ec4899" },
];

function createDeterministicRnd(seed = 123456789) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

class TerminalEngine {
  private listeners = new Set<() => void>();
  private snap: Snapshot;
  private timer: number | null = null;
  private refs = 0;
  private fillSeq = 1;
  private tickCount = 0;
  private drift = 0.35;
  private vol = 26;
  private regimeCountdown = 60;
  private currentSymbol = "XAUUSD";
  private hasLiveData = false;
  private lastLivePrice = 0;
  private liveCandles: Candle[] = [];

  constructor() {
    const detRnd = createDeterministicRnd(42);
    const detGauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = detRnd();
      while (v === 0) v = detRnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const detPick = <T>(a: T[]): T => a[Math.floor(detRnd() * a.length)];

    const candles: Candle[] = [];
    let p = 4346.00;
    const baseTime = 1710000000000;
    for (let i = 0; i < 90; i++) {
      const o = p;
      const driftVal = Math.sin(i / 9) * 3.5 + detGauss() * 2.2;
      const c = o + driftVal;
      const h = Math.max(o, c) + detRnd() * 2.8;
      const l = Math.min(o, c) - detRnd() * 2.8;
      candles.push({ t: baseTime + i * 60_000, o, h, l, c, v: 40 + detRnd() * 160 });
      p = c;
    }

    const agents: Agent[] = AGENT_SEED.map((a, i) => {
      const base = (detRnd() - 0.32) * 3200;
      const series: number[] = [];
      let v = 0;
      for (let k = 0; k < 60; k++) {
        v += detGauss() * 140 + base / 90;
        series.push(v);
      }
      return {
        ...a,
        pnl: series[series.length - 1],
        series,
        exposure: 8 + detRnd() * 26,
        conviction: 0.3 + detRnd() * 0.65,
        hitRate: 0.48 + detRnd() * 0.24,
        fills: 40 + Math.floor(detRnd() * 220),
        latency: 3 + detRnd() * 12,
        state: (["ENGAGED", "SCANNING", "HEDGING", "COOLING"] as const)[i % 4],
      };
    });

    const navSeries: number[] = [];
    let nav = 0;
    for (let i = 0; i < 120; i++) {
      nav += detGauss() * 210 + 78;
      navSeries.push(nav);
    }
    const dd = TerminalEngine.computeDd(navSeries);

    const fills: Fill[] = [];
    for (let i = 0; i < 14; i++) {
      const a = detPick(agents);
      const side: "BUY" | "SELL" = detRnd() > 0.5 ? "BUY" : "SELL";
      fills.push({
        id: this.fillSeq++,
        time: "12:00:00",
        agent: a.id,
        side,
        venue: detPick(VENUES),
        strategy: detPick(STRATS),
        size: Number((0.05 + detRnd() * 3.4).toFixed(2)),
        price: p + detGauss() * (p > 1000 ? 24 : 0.4),
        pnl: detGauss() * 260 + 42,
      });
    }

    this.snap = {
      version: 0,
      clock: "12:00:00",
      symbol: "XAUUSD",
      price: Number(p.toFixed(2)),
      prevPrice: Number(p.toFixed(2)),
      candles,
      liveTrail: [Number(p.toFixed(2))],
      agents,
      fills,
      activeTrades: [],
      navSeries,
      drawdown: dd,
      gross: 181_043_790,
      netPnl: 8812.86,
      dayPct: 16.89,
      winRate: 51.2,
      signals: 186_889,
      signalsPerMin: 1274,
      activeAgents: 5,
      latency: 7.4,
      eventRate: 1280,
      bookDepth: 76.1,
      vortexVelocity: 0.42,
      coilStatus: 2.04,
      regime: "TREND",
      risk: 0.553,
      sharpe: 3.42,
      maxDd: 1.18,
      turnover: 8.4,
      bids: [],
      asks: [],
    };
    this.rebuildBook(true);
  }

  private static stamp(): string {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");
  }

  private static computeDd(series: number[]): number[] {
    let peak = -Infinity;
    return series.map((v) => {
      peak = Math.max(peak, v);
      return peak === 0 ? 0 : -Math.abs(peak - v);
    });
  }

  private makeFill(price: number, agents: Agent[]): Fill {
    const a = pick(agents);
    const side: "BUY" | "SELL" = rnd() > 0.5 ? "BUY" : "SELL";
    return {
      id: this.fillSeq++,
      time: TerminalEngine.stamp(),
      agent: a.id,
      side,
      venue: pick(VENUES),
      strategy: pick(STRATS),
      size: Number((0.05 + rnd() * 3.4).toFixed(2)),
      price: price + gauss() * (price > 1000 ? 24 : 0.4),
      pnl: gauss() * 260 + 42,
    };
  }

  private rebuildBook(deterministic = false) {
    const p = this.snap.price;
    const step = p > 10000 ? 5 : p > 1000 ? 0.5 : p > 100 ? 0.05 : 0.0001;
    const rFn = deterministic ? (i: number) => ((i * 17) % 10) / 10 : () => rnd();
    this.snap.bids = Array.from({ length: 9 }, (_, i) => ({
      p: Number((p - (i + 1) * (step + rFn(i) * step)).toFixed(p > 100 ? 2 : 5)),
      s: Number((rFn(i + 3) * 9 + 0.4).toFixed(2)),
    }));
    this.snap.asks = Array.from({ length: 9 }, (_, i) => ({
      p: Number((p + (i + 1) * (step + rFn(i + 5) * step)).toFixed(p > 100 ? 2 : 5)),
      s: Number((rFn(i + 7) * 9 + 0.4).toFixed(2)),
    }));
  }

  private currentTimeframe: string = '15m';
  private lastBarBucket: number = 0;

  private getTimeframeMs(tf: string): number {
    const lower = (tf || '15m').toLowerCase().trim();
    if (lower === '30s') return 30_000;
    if (lower === '1m') return 60_000;
    if (lower === '5m') return 300_000;
    if (lower === '15m') return 900_000;
    if (lower === '30m') return 1_800_000;
    if (lower === '1h' || lower === '60m') return 3_600_000;
    if (lower === '4h' || lower === '240m') return 14_400_000;
    if (lower === '1d' || lower === 'd') return 86_400_000;
    return 900_000;
  }

  public setMarketData(symbol: string, livePrice?: number, candles?: any[], timeframe?: string) {
    this.currentSymbol = symbol;
    this.snap.symbol = symbol;
    if (timeframe && this.currentTimeframe !== timeframe.toLowerCase()) {
      this.currentTimeframe = timeframe.toLowerCase();
      this.lastBarBucket = 0;
    }

    const is30s = this.currentTimeframe === '30s';

    if (candles && candles.length > 0) {
      const rawLast = candles[candles.length - 1];
      const rawLastC = Number(rawLast.c ?? rawLast.close ?? 0);
      let basisShift = 0;
      if (livePrice && livePrice > 0 && rawLastC > 0) {
        const gapPct = Math.abs(livePrice - rawLastC) / livePrice;
        if (gapPct > 0.002) {
          basisShift = livePrice - rawLastC;
        }
      }

      let parsedCandles: Candle[] = [];

      if (is30s) {
        // Expand 1m or standard candles into smooth 30-second bars
        for (const c of candles) {
          const o = Number(c.o ?? c.open ?? livePrice ?? 0) + basisShift;
          const h = Number(c.h ?? c.high ?? livePrice ?? o) + basisShift;
          const l = Number(c.l ?? c.low ?? livePrice ?? o) + basisShift;
          const cl = Number(c.c ?? c.close ?? livePrice ?? o) + basisShift;
          const t = Number(c.t ?? c.time ?? Date.now());
          const v = Math.round(Number(c.v ?? c.volume ?? 100) / 2);

          const mid = Number(((o + cl) / 2).toFixed(symbol.includes('JPY') ? 3 : symbol === 'XAUUSD' ? 2 : 5));
          parsedCandles.push({
            t,
            o,
            h: Math.max(o, mid, (o + h) / 2),
            l: Math.min(o, mid, (o + l) / 2),
            c: mid,
            v,
          });
          parsedCandles.push({
            t: t + 30_000,
            o: mid,
            h,
            l,
            c: cl,
            v,
          });
        }
        parsedCandles = parsedCandles.slice(-240);
      } else {
        parsedCandles = candles.map((c: any) => {
          const o = Number(c.o ?? c.open ?? livePrice ?? 0) + basisShift;
          const h = Number(c.h ?? c.high ?? livePrice ?? o) + basisShift;
          const l = Number(c.l ?? c.low ?? livePrice ?? o) + basisShift;
          const cl = Number(c.c ?? c.close ?? livePrice ?? o) + basisShift;
          const t = Number(c.t ?? c.time ?? Date.now());
          const v = Number(c.v ?? c.volume ?? 100);
          return { t, o, h, l, c: cl, v };
        });
      }

      this.liveCandles = parsedCandles;
      this.snap.candles = this.liveCandles.map(c => ({ ...c }));
      const last = this.liveCandles[this.liveCandles.length - 1];
      if (last) {
        this.snap.prevPrice = this.snap.price;
        const fallbackPrice = last.c || this.snap.price;
        const realPrice = (livePrice && !isNaN(livePrice) && livePrice > 0) ? livePrice : fallbackPrice;
        this.snap.price = realPrice;
        this.lastLivePrice = realPrice;
        this.hasLiveData = true;
      }
    } else if (livePrice && livePrice > 0) {
      this.snap.prevPrice = this.snap.price;
      this.snap.price = livePrice;
      this.lastLivePrice = livePrice;
      this.hasLiveData = true;

      const candles = this.snap.candles;
      if (candles && candles.length > 0) {
        const last = candles[candles.length - 1];
        const now = Date.now();
        const barMs = this.getTimeframeMs(this.currentTimeframe);
        const currentBucket = Math.floor(now / barMs);

        if (this.lastBarBucket === 0) {
          this.lastBarBucket = currentBucket;
        }

        // Only roll over candle when real-clock bucket actually advances (:00 or :30)!
        if (currentBucket > this.lastBarBucket) {
          this.lastBarBucket = currentBucket;
          const newBarTime = currentBucket * barMs;
          this.snap.candles = [
            ...this.snap.candles.slice(-239),
            {
              t: newBarTime,
              o: livePrice,
              h: livePrice,
              l: livePrice,
              c: livePrice,
              v: 15,
            },
          ];
        } else {
          // Update in-progress candle smoothly with live ticks
          const gapPct = Math.abs(livePrice - last.c) / livePrice;
          if (gapPct > 0.005) {
            const shift = livePrice - last.c;
            this.snap.candles = this.snap.candles.map(c => ({
              ...c,
              o: c.o + shift,
              h: c.h + shift,
              l: c.l + shift,
              c: c.c + shift,
            }));
          } else {
            last.c = livePrice;
            last.h = Math.max(last.h, livePrice);
            last.l = Math.min(last.l, livePrice);
            last.v = (last.v || 50) + 1;
          }
        }
      }
    }

    this.rebuildBook();
    this.notify(true);
  }

  public syncLiveTelemetry(data: any) {
    if (!data) return;
    this.hasLiveData = true;
    const s = this.snap;

    if (data.symbol) {
      this.currentSymbol = data.symbol;
      s.symbol = data.symbol;
    }

    // 1. Live Price & Tick
    if (data.tick?.price && data.tick.price > 0) {
      s.prevPrice = s.price;
      s.price = data.tick.price;
      this.lastLivePrice = data.tick.price;
      s.liveTrail = [...s.liveTrail.slice(-160), data.tick.price];
    }

    // 2. MT5 Account Synchronization
    if (data.mt5) {
      s.mt5Status = {
        isConnected: Boolean(data.mt5.isConnected),
        balance: Number(data.mt5.balance ?? 10000),
        equity: Number(data.mt5.equity ?? 10000),
        freeMargin: Number(data.mt5.freeMargin ?? 10000),
        server: data.mt5.server || 'Exness-MT5Trial16',
        login: data.mt5.login || '472658395',
        floatingProfit: Number(data.mt5.floatingProfit ?? 0),
        openPositionsCount: Number(data.mt5.openPositionsCount ?? 0),
      };

      // Real Account KPIs
      s.gross = Number(s.mt5Status.balance.toFixed(2));
      const floatPnl = Number(s.mt5Status.floatingProfit.toFixed(2));
      s.netPnl = floatPnl;
      const dayReturnPct = s.mt5Status.balance > 0 ? (floatPnl / s.mt5Status.balance) * 100 : 0;
      s.dayPct = Number(dayReturnPct.toFixed(2));

      // Real Drawdown
      const dd = s.mt5Status.balance > 0 && s.mt5Status.equity < s.mt5Status.balance
        ? ((s.mt5Status.balance - s.mt5Status.equity) / s.mt5Status.balance) * 100
        : 0;
      s.maxDd = Number(dd.toFixed(2));
    }

    // 3. Bot status & win rate
    if (data.bot) {
      s.botActive = Boolean(data.bot.isActive);
      if (data.bot.analytics?.winRate !== undefined) {
        s.winRate = Number(data.bot.analytics.winRate.toFixed(1));
      }
    }

    // 4. Real Active Trades on Chart (Entry, SL, TP Overlay)
    const activeTrades: ActiveTrade[] = [];
    if (data.mt5?.positions && Array.isArray(data.mt5.positions)) {
      for (const pos of data.mt5.positions) {
        const entryP = Number(pos.openPrice || pos.currentPrice || s.price);
        let sl = pos.sl ? Number(pos.sl) : 0;
        let tp = pos.tp ? Number(pos.tp) : 0;
        const sym = pos.symbol || s.symbol;
        const side = (pos.type || 'BUY').toUpperCase() as "BUY" | "SELL";

        // Provide smart visual bracket if broker sl/tp not explicitly set
        if ((!sl || sl === 0) && entryP > 0) {
          const slOffset = entryP > 1000 ? 5.5 : entryP * 0.0015;
          sl = Number((side === 'BUY' ? entryP - slOffset : entryP + slOffset).toFixed(entryP > 100 ? 2 : 5));
        }
        if ((!tp || tp === 0) && entryP > 0) {
          const tpOffset = entryP > 1000 ? 12.0 : entryP * 0.0035;
          tp = Number((side === 'BUY' ? entryP + tpOffset : entryP - tpOffset).toFixed(entryP > 100 ? 2 : 5));
        }

        activeTrades.push({
          id: pos.ticket || `mt5-${Math.random().toString(36).slice(2, 7)}`,
          ticket: Number(pos.ticket),
          symbol: sym,
          side,
          size: Number(pos.volume || 0.01),
          entryPrice: entryP,
          currentPrice: Number(pos.currentPrice || s.price),
          sl,
          tp,
          pnl: Number(pos.profit || 0),
          time: pos.time,
          source: 'MT5',
        });
      }
    }

    // Also check recent active bot trades if no MT5 positions currently open
    if (activeTrades.length === 0 && data.bot?.history && Array.isArray(data.bot.history)) {
      const recent = data.bot.history[0];
      if (recent && recent.symbol && recent.entryPrice) {
        const sym = recent.symbol;
        const entryP = Number(recent.entryPrice);
        const side = (recent.action || recent.type || 'BUY').toUpperCase() as "BUY" | "SELL";
        let sl = recent.stopLoss ? Number(recent.stopLoss) : (side === 'BUY' ? entryP - 5.5 : entryP + 5.5);
        let tp = recent.takeProfit ? Number(recent.takeProfit) : (side === 'BUY' ? entryP + 12.0 : entryP - 12.0);
        const currentP = s.price || entryP;
        const pnl = side === 'BUY' ? (currentP - entryP) * (recent.lotSize || 0.01) * 100 : (entryP - currentP) * (recent.lotSize || 0.01) * 100;

        activeTrades.push({
          id: recent.id || 'bot-active-1',
          symbol: sym,
          side,
          size: Number(recent.lotSize || 0.01),
          entryPrice: entryP,
          currentPrice: currentP,
          sl: Number(sl.toFixed(entryP > 100 ? 2 : 5)),
          tp: Number(tp.toFixed(entryP > 100 ? 2 : 5)),
          pnl: Number(pnl.toFixed(2)),
          time: recent.timestamp || Date.now(),
          source: 'BOT',
        });
      }
    }
    s.activeTrades = activeTrades;

    // 5. Real Fills (Execution Stream) from MT5 Open Positions + Bot Closed Trades
    const realFills: Fill[] = [];

    // Add real open MT5 positions FIRST (with live status)
    if (data.mt5?.positions && Array.isArray(data.mt5.positions)) {
      for (const pos of data.mt5.positions) {
        realFills.push({
          id: Number(pos.ticket || this.fillSeq++),
          time: new Date(pos.time ? (pos.time > 1e11 ? pos.time : pos.time * 1000) : Date.now()).toLocaleTimeString(),
          agent: "JARVIS",
          side: (pos.type || 'BUY').toUpperCase() as "BUY" | "SELL",
          venue: "EXNESS MT5",
          strategy: "LIVE SWARM POSITION",
          size: Number(pos.volume || 0.01),
          price: Number(pos.openPrice || pos.currentPrice || s.price),
          pnl: Number(pos.profit || 0),
          isOpen: true,
          ticket: Number(pos.ticket),
        });
      }
    }

    // Add recent completed bot trades
    if (data.bot?.history && Array.isArray(data.bot.history)) {
      for (const h of data.bot.history.slice(0, 15)) {
        realFills.push({
          id: this.fillSeq++,
          time: new Date(h.timestamp || Date.now()).toLocaleTimeString(),
          agent: h.strategy?.includes("ICT") ? "SMC_ICT" : h.strategy?.includes("COT") ? "CFTC_COT" : "JARVIS",
          side: (h.type || h.direction || 'BUY').toUpperCase() as "BUY" | "SELL",
          venue: h.broker === 'MT5' ? 'EXNESS MT5' : 'CT ECN',
          strategy: h.strategy || 'AI CONFLUENCE',
          size: Number(h.lot || h.volume || 0.01),
          price: Number(h.entryPrice || h.price || s.price),
          pnl: Number(h.pnl || h.profit || 0),
          isOpen: false,
        });
      }
    }

    if (realFills.length > 0) {
      s.fills = realFills;
    }

    // 5. Update The Six Agents from real Strategy Engines
    if (data.agents?.votes) {
      const votes = data.agents.votes;
      const consensusScore = data.agents.consensusScore || 75;

      s.agents = s.agents.map((a) => {
        if (a.id === "JARVIS") {
          return {
            ...a,
            conviction: Number((consensusScore / 100).toFixed(2)),
            hitRate: 0.78,
            state: data.agents.isApproved ? "OPTIMAL" : "ACTIVE",
            statusText: `${data.agents.primaryDirection || 'BULLISH'} (${data.agents.agreementRatio || '4/4'})`,
            mandate: data.agents.romanUrduSummary || a.mandate,
          };
        }
        if (a.id === "SMC_ICT" && votes.structure) {
          const v = votes.structure;
          return {
            ...a,
            conviction: Number(((v.conviction || 72) / 100).toFixed(2)),
            state: v.vote === 'HOLD' ? "SCANNING" : "ENGAGED",
            statusText: `${v.vote} · ICT STRUCTURE`,
            mandate: v.romanUrduReason || a.mandate,
          };
        }
        if (a.id === "CFTC_COT" && votes.macro) {
          const v = votes.macro;
          return {
            ...a,
            conviction: Number(((v.conviction || 70) / 100).toFixed(2)),
            state: v.vote === 'HOLD' ? "COOLING" : "ENGAGED",
            statusText: `${v.vote} · COT SMART MONEY`,
            mandate: v.romanUrduReason || a.mandate,
          };
        }
        if (a.id === "VOL_L2" && votes.orderFlow) {
          const v = votes.orderFlow;
          return {
            ...a,
            conviction: Number(((v.conviction || 68) / 100).toFixed(2)),
            state: "ENGAGED",
            statusText: `${v.vote} · L2 MICROSTRUCTURE`,
            mandate: v.romanUrduReason || a.mandate,
          };
        }
        if (a.id === "RISK_AI" && votes.riskGuardian) {
          const v = votes.riskGuardian;
          return {
            ...a,
            conviction: Number(((v.conviction || 85) / 100).toFixed(2)),
            state: v.isVeto ? "HEDGING" : "SAFE",
            statusText: v.isVeto ? "VETO ACTIVE" : "RISK CLEAR",
            mandate: v.romanUrduReason || a.mandate,
          };
        }
        if (a.id === "GEMINI") {
          const isSafe = data.protection?.newsShield?.isSafe ?? true;
          return {
            ...a,
            conviction: isSafe ? 0.88 : 0.45,
            state: isSafe ? "ACTIVE" : "COOLING",
            statusText: isSafe ? "NEWS FILTER SAFE" : "NEWS LOCKOUT",
          };
        }
        return a;
      });
    }

    // 6. Real Order Book from MT5 / Binance
    if (data.orderBook?.bids && data.orderBook?.asks && data.orderBook.bids.length > 0) {
      s.bids = data.orderBook.bids;
      s.asks = data.orderBook.asks;
    } else {
      this.rebuildBook(true);
    }

    // Update NAV curve with real account equity
    if (data.mt5?.equity) {
      const eq = Number(data.mt5.equity);
      s.navSeries = [...s.navSeries.slice(-239), eq];
      s.drawdown = TerminalEngine.computeDd(s.navSeries.slice(-240));
    }

    s.clock = TerminalEngine.stamp();
    s.version++;
    this.notify(true);
  }

  public setSymbol(symbol: string, livePrice?: number) {
    this.setMarketData(symbol, livePrice);
  }

  public getHasLiveData(): boolean {
    return this.hasLiveData;
  }

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    this.refs++;
    if (this.timer === null && typeof window !== "undefined") {
      this.timer = window.setInterval(() => this.tick(), 600);
    }
    return () => {
      this.listeners.delete(cb);
      this.refs--;
      if (this.refs <= 0 && this.timer !== null && typeof window !== "undefined") {
        window.clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  getSnapshot = (): Snapshot => this.snap;

  getServerSnapshot = (): Snapshot => this.snap;

  peek = (): Snapshot => this.snap;

  private lastNotify = 0;
  private notify(force = false) {
    const now = Date.now();
    if (!force && now - this.lastNotify < 300) return;
    this.lastNotify = now;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private tick() {
    this.tickCount++;
    const s = this.snap;

    if (this.tickCount % 240 === 0) {
      const regimes: Snapshot["regime"][] = ["TREND", "CHOP", "SQUEEZE", "REVERSION"];
      s.regime = pick(regimes);
      this.drift = (rnd() - 0.5) * 0.9;
      this.vol = 14 + rnd() * 32;
    }

    // Price dynamics — use REAL price when live data is active, simulate only when no live feed
    let next: number;
    let move: number;
    const prev = s.price;
    const scale = prev > 10000 ? 2 : prev > 1000 ? 0.25 : prev > 100 ? 0.02 : 0.0001;

    if (this.hasLiveData && this.lastLivePrice > 0) {
      // LIVE MODE: Keep the real market price, don't overwrite with random walks
      next = this.lastLivePrice;
      move = next - prev;
      s.prevPrice = prev;
      s.price = next;
      s.liveTrail = [...s.liveTrail.slice(-160), next];
    } else {
      // SIMULATION MODE: Generate synthetic price movement (no live data)
      move = (gauss() * this.vol * 0.2 + this.drift * (rnd() - 0.25) * 2) * scale;
      next = Math.max(0.0001, prev + move);
      s.prevPrice = prev;
      s.price = Number(next.toFixed(prev > 100 ? 2 : 5));
      s.liveTrail = [...s.liveTrail.slice(-160), next];

      // Candles — only simulate when no live data
      const last = s.candles[s.candles.length - 1];
      if (last) {
        last.c = next;
        last.h = Math.max(last.h, next);
        last.l = Math.min(last.l, next);
        last.v += rnd() * 4;
        if (this.tickCount % 18 === 0) {
          s.candles = [
            ...s.candles.slice(-119),
            { t: last.t + 60_000, o: next, h: next, l: next, c: next, v: 20 + rnd() * 60 },
          ];
        } else {
          s.candles = [...s.candles.slice(0, -1), { ...last }];
        }
      }
    }

    // Multi-agent execution tracking
    const pnlDelta = (move / (scale || 1)) * 3.4;

    // In SIMULATION mode, generate synthetic fills and PnL:
    if (!this.hasLiveData) {
      s.agents = s.agents.map((a, i) => {
        const bias = Math.sin((this.tickCount + i * 37) / 45) * 0.6;
        const d = gauss() * 90 + pnlDelta * (a.conviction - 0.4) * (i % 2 === 0 ? 1 : -0.7) + bias * 30;
        const pnl = a.pnl + d;
        const series = [...a.series.slice(-79), pnl];
        const conviction = Math.min(0.99, Math.max(0.05, a.conviction + gauss() * 0.03));
        const states: Agent["state"][] = ["ENGAGED", "SCANNING", "HEDGING", "COOLING"];
        const state = rnd() > 0.972 ? pick(states) : a.state;
        return {
          ...a,
          pnl,
          series,
          conviction,
          exposure: Math.min(48, Math.max(2, a.exposure + gauss() * 0.6)),
          hitRate: Math.min(0.92, Math.max(0.32, a.hitRate + gauss() * 0.004)),
          fills: a.fills + (rnd() > 0.78 ? 1 : 0),
          latency: Math.min(40, Math.max(1.4, a.latency + gauss() * 0.5)),
          state,
        };
      });

      if (rnd() > 0.4) {
        const f = this.makeFill(next, s.agents);
        s.fills = [f, ...s.fills].slice(0, 40);
        s.signals += Math.floor(rnd() * 4) + 1;
      }

      const navLast = s.navSeries[s.navSeries.length - 1];
      const nav = navLast + pnlDelta * 0.55 + gauss() * 120 + 26;
      s.navSeries = [...s.navSeries.slice(-239), nav];
      s.drawdown = TerminalEngine.computeDd(s.navSeries.slice(-240));

      s.netPnl = s.agents.reduce((sum, a) => sum + a.pnl, 0);
      s.gross = 181_043_790 + s.netPnl * 3.2 + Math.sin(this.tickCount / 60) * 40_000;
      s.dayPct = (s.netPnl / 4_100_000) * 100;
      s.winRate = Math.min(
        88,
        Math.max(38, (s.agents.reduce((x, a) => x + a.hitRate, 0) / s.agents.length) * 100),
      );
    }

    // Dynamic 3D Coil Animation parameters (runs in both live and sim for smooth 60fps canvas visual)
    s.vortexVelocity = Math.min(
      1,
      Math.max(0.04, Math.abs(move) / (70 * scale) + s.vortexVelocity * 0.72),
    );
    s.coilStatus = Math.max(0.4, Math.min(3.2, s.coilStatus + (rnd() - 0.5) * 0.02));
    s.clock = TerminalEngine.stamp();
    if (this.tickCount % 8 === 0 && !this.hasLiveData) this.rebuildBook();

    s.version++;
    this.snap = { ...s };
    this.notify();
  }
}

export const vortexEngine = new TerminalEngine();

export function fmtMoney(n: number, digits = 2): string {
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    "$" +
    Math.abs(n).toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  );
}

export function fmtSigned(n: number, digits = 2): string {
  return (n >= 0 ? "+" : "-") + fmtMoney(Math.abs(n), digits).replace("-", "");
}

export function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

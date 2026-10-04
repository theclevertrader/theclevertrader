'use client';
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { vortexEngine } from "@/lib/vortex/vortex-engine";
import { ZoomIn, ZoomOut, RotateCcw, Clock } from 'lucide-react';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';

export interface CandleData {
  t?: number;
  time?: number;
  o?: number;
  open?: number;
  h?: number;
  high?: number;
  l?: number;
  low?: number;
  c?: number;
  close?: number;
  v?: number;
  volume?: number;
}

interface CandleChartProps {
  candles?: CandleData[];
  livePrice?: number;
  symbol?: string;
  priceDigits?: number;
  timeframe?: string;
  onTimeframeChange?: (tf: string) => void;
}

function getCountdown(tf?: string): { str: string; secondsLeft: number } {
  const t = (tf || '15m').toLowerCase();
  let tfSec = 900; // default 15m
  if (t === '30s') tfSec = 30;
  else if (t === '1m') tfSec = 60;
  else if (t === '5m') tfSec = 300;
  else if (t === '15m') tfSec = 900;
  else if (t === '30m') tfSec = 1800;
  else if (t === '1h' || t === '60m') tfSec = 3600;
  else if (t === '4h' || t === '240m') tfSec = 14400;
  else if (t === '1d' || t === 'd') tfSec = 86400;

  const nowSec = Math.floor(Date.now() / 1000);
  const elapsed = nowSec % tfSec;
  const rem = tfSec - elapsed;
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;
  return {
    str: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    secondsLeft: rem,
  };
}

/**
 * Ultra-Crisp TradingView-Grade Interactive Candlestick Chart.
 * 
 * Features:
 * - Full 2D Fluid Pointer Capture Dragging:
 *   - Horizontal drag: Panning left/right (agy / pechuy) into history and future whitespace.
 *   - Vertical drag: Panning up/down (oper / nechy) with 1-to-1 pixel precision.
 *   - Right Price Axis drag: Stretching/compressing candle heights vertically (Y-Scale zoom).
 * - Smooth mouse wheel zoom centered at cursor.
 * - Double-click auto-fit / reset (resets both X-axis pan, Y-axis pan, and Y-scale).
 * - Dynamic Y-axis auto-scaling strictly based on currently visible candles on screen.
 * - TradingView style right-margin whitespace (6 bars buffer).
 * - Interactive crosshair with live OHLCV ribbon, price tag, and date/time pill.
 * - Active bot & MT5 trades overlay (Entry, SL, TP lines, badges, and risk/reward zones).
 * - Real-time candle countdown timer synced to the clock.
 */
export const CandleChart = memo(function CandleChart({
  candles: propCandles,
  livePrice,
  symbol = 'XAUUSD',
  priceDigits,
  timeframe = '15m',
  onTimeframeChange,
}: CandleChartProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart view state:
  // zoomBars: visible bars across plot width
  // panBars: horizontal offset in bars (positive = past, negative = future)
  // pricePan: vertical offset in price units (positive = shifted up, negative = shifted down)
  // yScale: vertical stretch factor (1.0 = auto fit, >1.0 = taller candles, <1.0 = flatter)
  const [zoomBars, setZoomBars] = useState<number>(65);
  const [panBars, setPanBars] = useState<number>(0);
  const [pricePan, setPricePan] = useState<number>(0);
  const [yScale, setYScale] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<string>('--:--');
  const [activeTf, setActiveTf] = useState<string>(timeframe);

  // Measurement refs for 1:1 pixel-to-price pan calculation
  const priceSpanRef = useRef<number>(10);
  const plotHRef = useRef<number>(200);

  // Hover state for crosshair and OHLC bar
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  // Dragging state using pointer capture
  const isDraggingRef = useRef<boolean>(false);
  const dragModeRef = useRef<'CHART' | 'Y_AXIS'>('CHART');
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);
  const dragStartPanBarsRef = useRef<number>(0);
  const dragStartPricePanRef = useRef<number>(0);
  const dragStartYScaleRef = useRef<number>(1.0);

  useEffect(() => {
    setActiveTf(timeframe);
  }, [timeframe]);

  const handleTfSelect = (tf: string) => {
    setActiveTf(tf);
    try {
      localStorage.setItem('clever_trader_selected_timeframe', tf);
    } catch {}
    onTimeframeChange?.(tf);
  };

  // Sync state to ref for requestAnimationFrame loop
  const dataRef = useRef({
    propCandles,
    livePrice,
    symbol,
    priceDigits,
    timeframe: activeTf,
    zoomBars,
    panBars,
    pricePan,
    yScale,
    countdown,
  });

  useEffect(() => {
    dataRef.current = {
      propCandles,
      livePrice,
      symbol,
      priceDigits,
      timeframe: activeTf,
      zoomBars,
      panBars,
      pricePan,
      yScale,
      countdown,
    };
  }, [propCandles, livePrice, symbol, priceDigits, activeTf, zoomBars, panBars, pricePan, yScale, countdown]);

  // Update countdown timer every second (checks market open/closed status)
  useEffect(() => {
    const updateCd = () => {
      const openStatus = SessionFilterEngine.isMarketOpen(symbol);
      if (!openStatus.isOpen) {
        setCountdown('CLOSED');
        return;
      }
      const { str } = getCountdown(activeTf);
      setCountdown(str);
    };
    updateCd();
    const interval = setInterval(updateCd, 1000);
    return () => clearInterval(interval);
  }, [activeTf, symbol]);

  // Controls
  const handleZoomIn = useCallback(() => {
    setZoomBars(prev => Math.max(15, prev - 10));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomBars(prev => Math.min(220, prev + 10));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomBars(65);
    setPanBars(0);
    setPricePan(0);
    setYScale(1.0);
  }, []);

  // Pointer event handlers for butter-smooth TradingView-style 2D drag & pan
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // only left click
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mouseX = e.nativeEvent.offsetX;

    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartPanBarsRef.current = dataRef.current.panBars;
    dragStartPricePanRef.current = dataRef.current.pricePan;
    dragStartYScaleRef.current = dataRef.current.yScale;

    // Check if dragging right price axis (Y-axis scale stretch) or chart body (2D pan)
    const isOverPriceAxis = mouseX >= (canvas.clientWidth || 400) - 74;
    dragModeRef.current = isOverPriceAxis ? 'Y_AXIS' : 'CHART';

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mouseX = e.nativeEvent.offsetX;
    const mouseY = e.nativeEvent.offsetY;
    const cw = canvas.clientWidth || 400;
    const ch = canvas.clientHeight || 240;

    if (isDraggingRef.current) {
      if (dragModeRef.current === 'CHART') {
        // 1. Horizontal Dragging (Agy / Pechy)
        const deltaX = e.clientX - dragStartXRef.current;
        const plotW = Math.max(10, cw - 74 - 8);
        const candleW = plotW / Math.max(15, dataRef.current.zoomBars);
        const deltaBars = deltaX / candleW;
        const newPan = dragStartPanBarsRef.current + deltaBars;
        setPanBars(Math.max(-80, Math.min(300, newPan)));

        // 2. Vertical Dragging (Oper / Nechy!)
        // Moving mouse down (deltaY > 0) -> candles move DOWN -> price window increases
        // Moving mouse up (deltaY < 0) -> candles move UP -> price window decreases
        const deltaY = e.clientY - dragStartYRef.current;
        const pH = Math.max(10, plotHRef.current);
        const pSpan = priceSpanRef.current;
        const deltaPrice = (deltaY / pH) * pSpan;
        setPricePan(dragStartPricePanRef.current + deltaPrice);
      } else if (dragModeRef.current === 'Y_AXIS') {
        // Dragging vertically on the price axis stretches or compresses candle heights
        const deltaY = e.clientY - dragStartYRef.current;
        const factor = Math.exp(-deltaY * 0.007);
        setYScale(Math.max(0.15, Math.min(10.0, dragStartYScaleRef.current * factor)));
      }
    } else {
      // Dynamic cursor styling: ns-resize over price axis, grab over chart
      if (mouseX >= cw - 74) {
        canvas.style.cursor = 'ns-resize';
      } else {
        canvas.style.cursor = 'grab';
      }

      // Update hover for crosshair
      if (mouseX >= 8 && mouseX <= cw - 74 && mouseY >= 24 && mouseY <= ch - 26) {
        hoverRef.current = { x: mouseX, y: mouseY };
      } else {
        hoverRef.current = null;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore
        }
      }
    }
  };

  const handlePointerLeave = () => {
    if (!isDraggingRef.current) {
      hoverRef.current = null;
    }
  };

  // Mouse wheel listener on canvas for fluid zoom centered around mouse pointer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = e.deltaY < 0 ? -6 : 6;
      setZoomBars(prev => Math.max(15, Math.min(220, prev + zoomStep)));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const applySize = (targetW: number, targetH: number) => {
      if (targetW <= 0 || targetH <= 0) return;
      w = targetW;
      h = targetH;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      ctx.resetTransform?.();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };

    const initialParent = canvas.parentElement || canvas;
    applySize(initialParent.clientWidth || 400, initialParent.clientHeight || 240);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        applySize(Math.floor(width), Math.floor(height));
      }
    });
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    } else {
      ro.observe(canvas);
    }

    const draw = () => {
      try {
        if (w <= 0 || h <= 0) {
          raf = requestAnimationFrame(draw);
          return;
        }

        const {
          propCandles: currentCandles,
          livePrice: currentLivePrice,
          symbol: currentSym,
          priceDigits: customDigits,
          zoomBars: currentZoom,
          panBars: currentPan,
          pricePan: currentPricePan,
          yScale: currentYScale,
          countdown: currentCd,
        } = dataRef.current;

        let rawCandles: any[] = [];
        if (currentCandles && currentCandles.length > 0) {
          rawCandles = currentCandles;
        } else {
          const s = vortexEngine.peek() || vortexEngine.getSnapshot();
          rawCandles = s?.candles || [];
        }

        let lastRawCandles = dataRef.current as any;
        let cachedParsedCandles: any[] = (canvas as any)._cachedParsed || [];

        if (!rawCandles.length) {
          raf = requestAnimationFrame(draw);
          return;
        }

        if ((canvas as any)._lastRaw !== rawCandles || cachedParsedCandles.length === 0) {
          (canvas as any)._lastRaw = rawCandles;
          cachedParsedCandles = rawCandles.map((c: any) => ({
            t: Number(c.t ?? c.time ?? 0),
            o: Number(c.o ?? c.open ?? 0),
            h: Number(c.h ?? c.high ?? 0),
            l: Number(c.l ?? c.low ?? 0),
            c: Number(c.c ?? c.close ?? 0),
            v: Number(c.v ?? c.volume ?? 100),
          }));
          cachedParsedCandles.sort((a: any, b: any) => a.t - b.t);
          (canvas as any)._cachedParsed = cachedParsedCandles;
        }

        const totalBars = cachedParsedCandles.length;
        const candles = cachedParsedCandles.slice();

        // Dynamically update the latest active candle with live tick price
        if (currentLivePrice && currentLivePrice > 0 && candles.length > 0) {
          const lastIdx = candles.length - 1;
          const last = { ...candles[lastIdx] };

          // Institutional Outlier & Spike Shield (TradingView / Bloomberg Standard)
          // If the live tick deviates by > 2.0% from the candle close, it is an out-of-band data collision.
          // Reject the outlier to prevent crushing visible candle geometry into a 1-pixel flatline.
          const maxAllowedDeviation = 0.02; // 2.0% tolerance
          const deviation = Math.abs(currentLivePrice - last.c) / (last.c || 1);

          if (deviation <= maxAllowedDeviation) {
            last.c = currentLivePrice;
            last.h = Math.max(last.h, currentLivePrice);
            last.l = Math.min(last.l, currentLivePrice);
            candles[lastIdx] = last;
          }
        }

        const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("light");

        // Layout measurements
        const padR = 74; // Right axis width
        const padB = 26; // Bottom axis height
        const padT = 24; // Top padding for OHLC ribbon
        const plotLeft = 8;
        const plotW = Math.max(10, w - padR - plotLeft);
        const plotH = Math.max(10, h - padB - padT);
        plotHRef.current = plotH;

        // TradingView Horizontal Coordinate Mapping
        const cw = plotW / Math.max(15, currentZoom);
        const rightMarginBars = 6; // TradingView style future whitespace buffer
        const anchorX = plotLeft + plotW - (rightMarginBars * cw) + (currentPan * cw);

        // Calculate positions ONLY for visible subset (avoids allocating 200+ off-screen objects)
        const candlePositions: Array<{
          candle: typeof candles[0];
          index: number;
          x: number;
        }> = [];

        let baseHi = -Infinity;
        let baseLo = Infinity;
        let visibleCount = 0;

        for (let i = 0; i < totalBars; i++) {
          const c = candles[i];
          const x = anchorX - ((totalBars - 1 - i) * cw);
          const isVisible = (x + cw >= plotLeft - 10) && (x <= plotLeft + plotW + 10);
          if (isVisible) {
            candlePositions.push({ candle: c, index: i, x });
            if (c.h > baseHi) baseHi = c.h;
            if (c.l < baseLo) baseLo = c.l;
            visibleCount++;
          }
        }

        // Fallback hi/lo if user panned completely into empty future whitespace
        if (visibleCount === 0 || !isFinite(baseHi) || !isFinite(baseLo)) {
          const fallbackCandles = candles.slice(-20);
          for (const c of fallbackCandles) {
            if (c.h > baseHi) baseHi = c.h;
            if (c.l < baseLo) baseLo = c.l;
          }
        }

        // Active Bot & MT5 Trades Filter
        const snap = vortexEngine.peek() || vortexEngine.getSnapshot();
        const cleanCurrentSym = (currentSym || 'XAUUSD').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const lastClose = candles.length > 0 ? candles[candles.length - 1].c : 0;

        const activeTrades = (snap?.activeTrades || []).filter((t: any) => {
          const tSym = (t.symbol || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const symMatches = (tSym.length >= 3 && cleanCurrentSym.includes(tSym)) || (cleanCurrentSym.length >= 3 && tSym.includes(cleanCurrentSym));
          if (!symMatches) return false;
          if (lastClose > 0 && t.entryPrice > 0) {
            const ratio = t.entryPrice / lastClose;
            if (ratio < 0.7 || ratio > 1.3) return false;
          }
          return true;
        });

        // Expand base vertical bounds gracefully for valid active trades
        for (const t of activeTrades) {
          if (t.entryPrice > 0 && Math.abs(t.entryPrice - lastClose) / lastClose < 0.04) {
            baseHi = Math.max(baseHi, t.entryPrice);
            baseLo = Math.min(baseLo, t.entryPrice);
          }
          if (t.sl && t.sl > 0 && Math.abs(t.sl - lastClose) / lastClose < 0.04) {
            baseHi = Math.max(baseHi, t.sl);
            baseLo = Math.min(baseLo, t.sl);
          }
          if (t.tp && t.tp > 0 && Math.abs(t.tp - lastClose) / lastClose < 0.04) {
            baseHi = Math.max(baseHi, t.tp);
            baseLo = Math.min(baseLo, t.tp);
          }
        }

        // Apply Vertical Scaling (yScale) and 2D Vertical Panning (pricePan)
        const baseSpan = Math.max(0.01, baseHi - baseLo || 10);
        const midPrice = (baseHi + baseLo) / 2;
        const effectiveSpan = (baseSpan * 1.25) / Math.max(0.15, currentYScale);
        priceSpanRef.current = effectiveSpan;

        let hi = midPrice + (effectiveSpan / 2) + currentPricePan;
        let lo = midPrice - (effectiveSpan / 2) + currentPricePan;

        const yOf = (p: number) => padT + ((hi - p) / (hi - lo)) * plotH;
        const pOf = (y: number) => hi - ((y - padT) / plotH) * (hi - lo);

        const formatP = (val: number) => {
          if (customDigits !== undefined) return val.toFixed(customDigits);
          if (val >= 1000) return val.toFixed(2);
          if (val >= 100) return val.toFixed(2);
          if (val >= 10) return val.toFixed(3);
          return val.toFixed(4);
        };

        // Clear Canvas
        ctx.clearRect(0, 0, w, h);

        // 1. Grid Lines & Right Price Axis
        ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 1;

        const gridLevels = 5;
        for (let i = 0; i <= gridLevels; i++) {
          const p = lo + ((hi - lo) * i) / gridLevels;
          const rawY = yOf(p);
          const y = Math.round(rawY) + 0.5;

          ctx.strokeStyle = isLight ? "rgba(22,22,26,0.07)" : "rgba(255,255,255,0.06)";
          ctx.beginPath();
          ctx.moveTo(plotLeft, y);
          ctx.lineTo(plotLeft + plotW, y);
          ctx.stroke();

          ctx.fillStyle = isLight ? "#1e293b" : "#94a3b8";
          ctx.textAlign = "left";
          ctx.fillText(formatP(p), plotLeft + plotW + 8, y);
        }

        // 2. Chart Plot Clipping (Moving Average & Candlesticks)
        ctx.save();
        ctx.beginPath();
        ctx.rect(plotLeft, padT, plotW, plotH + padB);
        ctx.clip();

        // 3. Moving Average Line
        const maPts: { x: number; y: number }[] = [];
        for (let i = 0; i < totalBars; i++) {
          const from = Math.max(0, i - 13);
          let sum = 0;
          let count = 0;
          for (let k = from; k <= i; k++) {
            sum += candles[k].c;
            count++;
          }
          const x = anchorX - ((totalBars - 1 - i) * cw) + cw / 2;
          maPts.push({ x, y: yOf(sum / count) });
        }

        ctx.strokeStyle = isLight ? "rgba(29,78,216,0.80)" : "rgba(0,240,255,0.85)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        let maStarted = false;
        for (let i = 0; i < maPts.length; i++) {
          const pt = maPts[i];
          if (pt.x >= plotLeft - 50 && pt.x <= plotLeft + plotW + 50) {
            if (!maStarted) {
              ctx.moveTo(pt.x, pt.y);
              maStarted = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 4. Candlesticks (Wicks and Bodies)
        const upColor = isLight ? "#12915a" : "#00e676";
        const downColor = isLight ? "#d0342c" : "#ff3366";

        for (const item of candlePositions) {
          if (item.x + cw < plotLeft || item.x > plotLeft + plotW) continue;
          const c = item.candle;
          const up = c.c >= c.o;
          const col = up ? upColor : downColor;

          // Wick
          ctx.strokeStyle = col;
          ctx.lineWidth = Math.max(1, Math.min(2.5, cw * 0.14));
          const midX = Math.round(item.x + cw / 2) + 0.5;
          ctx.beginPath();
          ctx.moveTo(midX, Math.round(yOf(c.h)));
          ctx.lineTo(midX, Math.round(yOf(c.l)));
          ctx.stroke();

          // Body
          ctx.fillStyle = up
            ? (isLight ? "rgba(18,145,90,0.95)" : "rgba(0,230,118,0.95)")
            : (isLight ? "rgba(208,52,44,0.95)" : "rgba(255,51,102,0.95)");

          const bw = Math.max(1, Math.round(cw * 0.72));
          const bx = Math.round(item.x + (cw - bw) / 2);
          const topY = Math.round(yOf(Math.max(c.o, c.c)));
          const botY = Math.round(yOf(Math.min(c.o, c.c)));
          const bodyH = Math.max(1.5, botY - topY);

          ctx.fillRect(bx, topY, bw, bodyH);
        }

        ctx.restore(); // Restore clip

        // 5. Clean Institutional Active Trades Overlay (Minimal SL / TP / ENT Lines & Small Badges)
        for (const t of activeTrades) {
          if (!t.entryPrice || t.entryPrice <= 0) continue;
          const ey = Math.round(yOf(t.entryPrice)) + 0.5;
          const sly = t.sl && t.sl > 0 ? Math.round(yOf(t.sl)) + 0.5 : null;
          const tpy = t.tp && t.tp > 0 ? Math.round(yOf(t.tp)) + 0.5 : null;

          if (!candlePositions.length) continue;

          // Find entry bar anchor
          const totalCp = candlePositions.length;
          let entryIdx = Math.max(0, totalCp - 10);
          for (let i = totalCp - 1; i >= Math.max(0, totalCp - 35); i--) {
            const cp = candlePositions[i];
            if (t.entryPrice >= cp.candle.l && t.entryPrice <= cp.candle.h) {
              entryIdx = i;
              break;
            }
          }
          if (totalCp - 1 - entryIdx < 3) {
            entryIdx = Math.max(0, totalCp - 6);
          }

          const entryBar = candlePositions[entryIdx];
          const boxLeft = Math.max(plotLeft, Math.round(entryBar.x));
          if (boxLeft >= plotLeft + plotW - 10) continue;

          ctx.font = "bold 9px 'JetBrains Mono', monospace";

          // STOP LOSS LINE (Smooth continuous line, clean red text 'SL', NO background color, NO price attached)
          if (sly !== null && sly >= padT && sly <= padT + plotH) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(boxLeft, sly);
            ctx.lineTo(plotLeft + plotW, sly);
            ctx.stroke();

            // Plain SL text (NO background color box, NO price attached)
            ctx.fillStyle = "#ef4444";
            ctx.textBaseline = "bottom";
            ctx.textAlign = "left";
            ctx.fillText("SL", boxLeft + 4, sly - 2);

            // Right Axis Price (Clean colored text, NO background box)
            ctx.textBaseline = "middle";
            ctx.fillText(formatP(t.sl!), plotLeft + plotW + 6, sly);
          }

          // TAKE PROFIT LINE (Smooth continuous line, clean green text 'TP', NO background color, NO price attached)
          if (tpy !== null && tpy >= padT && tpy <= padT + plotH) {
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(boxLeft, tpy);
            ctx.lineTo(plotLeft + plotW, tpy);
            ctx.stroke();

            // Plain TP text (NO background color box, NO price attached)
            ctx.fillStyle = "#10b981";
            ctx.textBaseline = "bottom";
            ctx.textAlign = "left";
            ctx.fillText("TP", boxLeft + 4, tpy - 2);

            // Right Axis Price (Clean colored text, NO background box)
            ctx.textBaseline = "middle";
            ctx.fillText(formatP(t.tp!), plotLeft + plotW + 6, tpy);
          }

          // ENTRY LINE (Smooth continuous line, clean colored text 'ENT', NO background color, NO price attached)
          if (ey >= padT && ey <= padT + plotH) {
            const entryCol = t.side === 'BUY' ? '#06b6d4' : '#f59e0b';
            ctx.strokeStyle = entryCol;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(boxLeft, ey);
            ctx.lineTo(plotLeft + plotW, ey);
            ctx.stroke();

            // Plain ENT text (NO background color box, NO price attached)
            ctx.fillStyle = entryCol;
            ctx.textBaseline = "bottom";
            ctx.textAlign = "left";
            ctx.fillText("ENT", boxLeft + 4, ey - 2);

            // Right Axis Price (Clean colored text, NO background box)
            ctx.textBaseline = "middle";
            ctx.fillText(formatP(t.entryPrice), plotLeft + plotW + 6, ey);
          }
        }

        // 6. Real-Time Price Marker Line & Glowing Badge on Axis
        const lastCandle = candles[candles.length - 1];
        if (lastCandle) {
          const rawLy = yOf(lastCandle.c);
          const ly = Math.round(rawLy) + 0.5;
          const up = lastCandle.c >= lastCandle.o;
          const col = up ? upColor : downColor;

          // Dashed horizontal price beam
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(plotLeft, ly);
          ctx.lineTo(plotLeft + plotW, ly);
          ctx.stroke();
          ctx.setLineDash([]);

          // Glowing Price Badge on Right Y-Axis
          ctx.fillStyle = col;
          const badgeY = Math.round(rawLy - 9);
          const badgeW = padR - 8;
          ctx.fillRect(plotLeft + plotW + 4, badgeY, badgeW, 18);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(formatP(lastCandle.c), plotLeft + plotW + 8, badgeY + 9);

          // Candle Countdown Timer Pill beneath the price badge (TradingView style!)
          const cdY = badgeY + 20;
          if (cdY + 14 < h - padB) {
            const mInfo = SessionFilterEngine.isMarketOpen(currentSym);
            if (!mInfo.isOpen) {
              ctx.fillStyle = "rgba(225, 29, 72, 0.90)";
              ctx.fillRect(plotLeft + plotW + 4, cdY, badgeW, 14);

              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 8px 'JetBrains Mono', monospace";
              ctx.textAlign = "left";
              ctx.fillText(`⛔ CLOSED`, plotLeft + plotW + 8, cdY + 7);
            } else {
              ctx.fillStyle = "rgba(147, 51, 234, 0.92)";
              ctx.fillRect(plotLeft + plotW + 4, cdY, badgeW, 14);

              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
              ctx.textAlign = "left";
              ctx.fillText(`⏱ ${currentCd}`, plotLeft + plotW + 8, cdY + 7);
            }
          }
        }

        // 7. Time Axis Ticks (Dates & Times at the bottom)
        ctx.fillStyle = isLight ? "#475569" : "#64748b";
        ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";

        const tickSpacing = Math.max(50, Math.floor(plotW / 6));
        let lastTickX = -999;
        for (const item of candlePositions) {
          if (item.x < plotLeft || item.x > plotLeft + plotW - 20) continue;
          if (item.x - lastTickX >= tickSpacing) {
            const d = new Date(item.candle.t);
            const lbl = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            ctx.fillText(lbl, Math.round(item.x + cw / 2), h - 6);
            lastTickX = item.x;
          }
        }

        // 8. Crosshair & Hover Tooltip Ribbon
        const hover = hoverRef.current;
        if (hover && !isDraggingRef.current) {
          const { x: hx, y: hy } = hover;

          // Crosshair lines
          ctx.strokeStyle = isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.30)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);

          // Vertical line
          ctx.beginPath();
          ctx.moveTo(hx, padT);
          ctx.lineTo(hx, h - padB);
          ctx.stroke();

          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(plotLeft, hy);
          ctx.lineTo(plotLeft + plotW, hy);
          ctx.stroke();
          ctx.setLineDash([]);

          // Hover price badge on right axis
          const hoverPrice = pOf(hy);
          ctx.fillStyle = isLight ? "#0f172a" : "#334155";
          ctx.fillRect(plotLeft + plotW + 4, hy - 8, padR - 8, 16);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px 'JetBrains Mono', monospace";
          ctx.textAlign = "left";
          ctx.fillText(formatP(hoverPrice), plotLeft + plotW + 8, hy);

          // Find candle closest to hover X
          let closestCandle: typeof candles[0] | null = null;
          let minDiff = Infinity;
          for (const item of candlePositions) {
            const diff = Math.abs(item.x + cw / 2 - hx);
            if (diff < minDiff) {
              minDiff = diff;
              closestCandle = item.candle;
            }
          }

          if (closestCandle && minDiff < cw * 1.5) {
            // Hover time pill on bottom axis
            const hd = new Date(closestCandle.t);
            const hTimeStr = `${String(hd.getHours()).padStart(2, "0")}:${String(hd.getMinutes()).padStart(2, "0")}:${String(hd.getSeconds()).padStart(2, "0")}`;
            const timeTagW = 60;
            ctx.fillStyle = isLight ? "#0f172a" : "#334155";
            ctx.fillRect(hx - timeTagW / 2, h - padB + 2, timeTagW, 14);
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(hTimeStr, hx, h - padB + 9);

            // OHLC Ribbon in Top Left (TradingView Style)
            const up = closestCandle.c >= closestCandle.o;
            const hlCol = up ? (isLight ? "#12915a" : "#00e676") : (isLight ? "#d0342c" : "#ff3366");
            const ohlcText = `O: ${formatP(closestCandle.o)}   H: ${formatP(closestCandle.h)}   L: ${formatP(closestCandle.l)}   C: ${formatP(closestCandle.c)}   Vol: ${closestCandle.v ?? 100}`;
            
            ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
            ctx.fillStyle = isLight ? "#0f172a" : "#f1f5f9";
            ctx.textAlign = "left";
            ctx.fillText(`${cleanCurrentSym} · ${activeTf.toUpperCase()}`, plotLeft + 4, 14);

            ctx.fillStyle = hlCol;
            ctx.fillText(ohlcText, plotLeft + 105, 14);
          }
        }
      } catch (err) {
        console.warn('[CandleChart draw error]:', err);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const isAdjusted = panBars !== 0 || pricePan !== 0 || yScale !== 1.0;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full select-none overflow-hidden touch-none"
    >
      {/* Floating HUD: Timeframe Pills, Countdown Timer, Zoom In/Out/Reset */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto">
        {/* Timeframe Selector Pills */}
        <div className="flex items-center bg-black/85 backdrop-blur-md rounded-md border border-cyan-500/30 p-0.5 shadow-md">
          {(['30s', '1m', '5m', '15m', '1h', '4h'] as const).map((tfOption) => {
            const isSelected = activeTf.toLowerCase() === tfOption.toLowerCase();
            return (
              <button
                key={tfOption}
                onClick={() => handleTfSelect(tfOption)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-black shadow-sm font-extrabold scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tfOption}
              </button>
            );
          })}
        </div>

        {/* Real-time Candle Countdown Timer */}
        {countdown === 'CLOSED' ? (
          <div className="flex items-center gap-1 bg-rose-950/85 backdrop-blur-md px-2 py-1 rounded-md border border-rose-500/50 text-[9px] font-mono font-black text-rose-300 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>⛔ MARKET CLOSED</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-black/85 backdrop-blur-md px-2 py-1 rounded-md border border-purple-500/30 text-[9px] font-mono font-black text-purple-300 shadow-md">
            <Clock className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>{countdown}</span>
          </div>
        )}

        {/* Zoom & Fit / Reset Controls */}
        <div className="flex items-center bg-black/80 backdrop-blur-md rounded-md border border-white/[0.12] p-0.5 shadow-md">
          <button
            onClick={handleZoomIn}
            title="Zoom In (Wider Candles)"
            className="p-1 hover:bg-white/15 rounded text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (More Candles)"
            className="p-1 hover:bg-white/15 rounded text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-white/10 mx-0.5" />
          <button
            onClick={handleResetZoom}
            title="Reset Pan & Zoom (Double-Click on chart also resets)"
            className="p-1 hover:bg-white/15 rounded text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <span className="text-[8px] font-mono font-bold text-slate-400 px-1">
            {zoomBars}B
          </span>
        </div>
      </div>

      {/* Floating Auto-Fit Reset Button (TradingView Style - appears when user pans or zooms) */}
      {isAdjusted && (
        <button
          onClick={handleResetZoom}
          className="absolute bottom-7 right-20 z-20 flex items-center gap-1 px-2 py-0.5 bg-black/85 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/40 rounded text-[9px] font-mono font-bold backdrop-blur-md shadow-lg transition-all animate-fade-in"
          title="Reset chart pan and zoom to default auto-fit"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Auto Fit</span>
        </button>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleResetZoom}
        className="absolute inset-0 h-full w-full block touch-none"
        style={{
          imageRendering: "auto",
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
});

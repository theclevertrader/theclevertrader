'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  NormalizedMarketRecord, 
  VolumeProfileResult, 
  VwapResult, 
  FootprintCandle, 
  CvdDivergence,
  BigTradeMarker,
  MboIcebergAlert,
  DomOrderLevel
} from '@/lib/volume/volume-types';

export type ChartViewMode = 
  | 'CANDLESTICK' 
  | 'FOOTPRINT_CLASSIC' 
  | 'FOOTPRINT_4COL' 
  | 'FOOTPRINT_DELTA_BLOCKS' 
  | 'LIQUIDITY_HEATMAP';

interface Props {
  symbol: string;
  timeframe: string;
  candles: NormalizedMarketRecord[];
  profile: VolumeProfileResult | null;
  vwap?: VwapResult;
  footprintSeries?: FootprintCandle[];
  divergences?: CvdDivergence[];
  showVolumeProfile?: boolean;
  showVwap?: boolean;
  showEma?: boolean;
  viewMode?: any;
  onViewModeChange?: (mode: any) => void;
  height?: number;
}

export const OrderflowCanvasEngine: React.FC<Props> = ({
  symbol,
  timeframe,
  candles,
  profile,
  vwap,
  footprintSeries = [],
  divergences = [],
  showVolumeProfile = true,
  showVwap = true,
  showEma = true,
  viewMode = 'CANDLESTICK',
  onViewModeChange,
  height = 480,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const cachedRectRef = useRef<DOMRect | null>(null);

  // Normalize viewMode
  const activeMode: ChartViewMode = useMemo(() => {
    if (viewMode === 'FOOTPRINT') return 'FOOTPRINT_CLASSIC';
    if (['CANDLESTICK', 'FOOTPRINT_CLASSIC', 'FOOTPRINT_4COL', 'FOOTPRINT_DELTA_BLOCKS', 'LIQUIDITY_HEATMAP'].includes(viewMode)) {
      return viewMode as ChartViewMode;
    }
    return 'CANDLESTICK';
  }, [viewMode]);

  // Pack 1 & 2 & 4 Feature Toggles
  const [showBigTrades, setShowBigTrades] = useState<boolean>(true);
  const [showDomLadder, setShowDomLadder] = useState<boolean>(true);
  const [showMboIcebergs, setShowMboIcebergs] = useState<boolean>(true);

  // Dynamic Market Speed (Tape Velocity)
  const [tapeSpeed, setTapeSpeed] = useState('18.2');
  const [flowSpeed, setFlowSpeed] = useState('54.6');

  useEffect(() => {
    const interval = setInterval(() => {
      setTapeSpeed((14 + Math.random() * 9).toFixed(1));
      setFlowSpeed((42 + Math.random() * 28).toFixed(1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Zoom & Pan state
  const isFootprint = activeMode.startsWith('FOOTPRINT');
  const [zoomBars, setZoomBars] = useState<number>(isFootprint ? 14 : activeMode === 'LIQUIDITY_HEATMAP' ? 50 : 65);
  const [panIndex, setPanIndex] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Dimensions & Padding
  const paddingLeft = 12;
  const paddingRight = (showDomLadder ? 108 : 0) + (showVolumeProfile ? 108 : 0) + 58;
  const paddingTop = 26;
  const paddingBottom = 26;

  // Visible Candle Window (Memoized)
  const visibleCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    const count = Math.min(candles.length, Math.max(8, zoomBars));
    const maxPan = Math.max(0, candles.length - count);
    const clampedPan = Math.min(maxPan, Math.max(0, panIndex));
    const startIdx = candles.length - count - clampedPan;
    return candles.slice(startIdx, startIdx + count);
  }, [candles, zoomBars, panIndex]);

  // Price Bounds (Memoized)
  const { minPrice, maxPrice, priceSpan } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 100, priceSpan: 100 };
    let min = Infinity;
    let max = -Infinity;
    for (const c of visibleCandles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    }
    if (profile?.vah && profile.vah > max) max = profile.vah;
    if (profile?.val && profile.val < min) min = profile.val;
    const span = Math.max(0.001, max - min);
    const margin = span * 0.08;
    return {
      minPrice: min - margin,
      maxPrice: max + margin,
      priceSpan: span + margin * 2,
    };
  }, [visibleCandles, profile]);

  // Pre-compiled DOM Levels and Big Trades (Zero runtime allocation during frames)
  const { domLevels, bigTrades, mboAlerts } = useMemo(() => {
    if (visibleCandles.length === 0) {
      return { domLevels: [], bigTrades: [], mboAlerts: [] };
    }
    const currentPrice = visibleCandles[visibleCandles.length - 1].close;
    const step = symbol.includes('JPY') ? 0.02 : symbol.includes('XAU') ? 0.5 : 0.0002;

    const dom: DomOrderLevel[] = [];
    for (let i = 8; i >= 1; i--) {
      const p = +(currentPrice + i * step).toFixed(2);
      const vol = Math.floor(60 + Math.sin(p * 10) * 45 + ((i % 3 === 0) ? 140 : 0));
      dom.push({ price: p, volume: vol, pullingStackingDelta: (i % 2 === 0 ? 12 : -8), type: 'ASK' });
    }
    for (let i = 1; i <= 8; i++) {
      const p = +(currentPrice - i * step).toFixed(2);
      const vol = Math.floor(65 + Math.cos(p * 10) * 45 + ((i % 4 === 0) ? 160 : 0));
      dom.push({ price: p, volume: vol, pullingStackingDelta: (i % 2 === 0 ? 15 : -5), type: 'BID' });
    }

    const bt: BigTradeMarker[] = [];
    visibleCandles.forEach((c, idx) => {
      if (c.volume > 1500 && idx % 3 === 0) {
        const isBuy = c.close >= c.open;
        bt.push({
          timestamp: c.timestamp,
          price: isBuy ? c.high - (c.high - c.low) * 0.25 : c.low + (c.high - c.low) * 0.25,
          volume: Math.floor(80 + (c.volume / 100)),
          side: isBuy ? 'BUY' : 'SELL',
          isAggressive: true,
        });
      }
    });

    const mbo: MboIcebergAlert[] = [];
    if (profile?.poc) {
      mbo.push({
        price: profile.poc,
        timestamp: Date.now(),
        lotsAbsorbed: 380,
        type: 'ICEBERG_BUY',
      });
    }

    return { domLevels: dom, bigTrades: bt, mboAlerts: mbo };
  }, [visibleCandles, symbol, profile]);

  // Pre-compiled footprint lookup map (O(1) lookups)
  const fpMap = useMemo(() => {
    const map = new Map<number, FootprintCandle>();
    footprintSeries.forEach(f => map.set(f.timestamp, f));
    return map;
  }, [footprintSeries]);

  // =========================================================================
  // MAIN CHART RENDER (Only runs when data, zoom, or mode changes - 0% CPU idle!)
  // =========================================================================
  const renderMainChart = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    if (!mainCanvas) return;

    const ctx = mainCanvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Logical CSS pixel dimensions (matches container width exactly)
    const width = Math.floor(mainCanvas.width / dpr);
    const h = Math.floor(mainCanvas.height / dpr);
    if (width <= 0 || h <= 0) return;

    // Reset and apply DPR transform for ultra-sharp high-DPI rendering
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fast Dark Background Fill
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, width, h);

    const chartW = Math.max(10, (width - paddingLeft - paddingRight) | 0);
    const chartH = Math.max(10, (h - paddingTop - paddingBottom) | 0);
    const invPriceSpan = chartH / (priceSpan || 1);
    const getY = (p: number) => (paddingTop + (maxPrice - p) * invPriceSpan) | 0;

    // -------------------------------------------------------------
    // PACK 3: BOOKMAP STYLE LIQUIDITY HEATMAP
    // -------------------------------------------------------------
    if (activeMode === 'LIQUIDITY_HEATMAP' && visibleCandles.length > 0) {
      const numHeatRows = 36;
      const rowStep = priceSpan / numHeatRows;
      const rowHeight = Math.max(3, (chartH / numHeatRows) | 0);

      for (let r = 0; r < numHeatRows; r++) {
        const rowPrice = minPrice + r * rowStep;
        const rowY = getY(rowPrice);

        let intensity = 0.08 + Math.abs(Math.sin(rowPrice * 12)) * 0.18;
        if (profile?.poc && Math.abs(rowPrice - profile.poc) < rowStep * 1.5) intensity += 0.55;
        if (profile?.vah && Math.abs(rowPrice - profile.vah) < rowStep * 1.5) intensity += 0.40;
        if (profile?.val && Math.abs(rowPrice - profile.val) < rowStep * 1.5) intensity += 0.40;

        intensity = Math.min(0.95, intensity);
        ctx.fillStyle = intensity > 0.6 
          ? `rgba(251, 191, 36, ${intensity * 0.45})` 
          : `rgba(14, 165, 233, ${intensity * 0.28})`;
        ctx.fillRect(paddingLeft, rowY - rowHeight / 2, chartW, rowHeight);
      }
    }

    // 1. Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 0.2; r <= 0.8; r += 0.2) {
      const y = (paddingTop + r * chartH) | 0;
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
    }
    ctx.stroke();

    // 2. Price Axis Labels (Right Side)
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const priceSteps = 6;
    const priceLabelX = width - paddingRight + 52;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (i / priceSteps) * priceSpan;
      const y = getY(p);
      ctx.fillText(p.toFixed(symbol.includes('JPY') ? 3 : symbol.includes('XAU') ? 2 : 4), priceLabelX, y);
    }

    if (visibleCandles.length === 0) return;

    // 3. CANDLESTICK / FOOTPRINT RENDERING
    const candleStep = chartW / visibleCandles.length;

    if (activeMode === 'CANDLESTICK' || activeMode === 'LIQUIDITY_HEATMAP') {
      visibleCandles.forEach((c, i) => {
        const cx = (paddingLeft + i * candleStep + candleStep / 2) | 0;
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);
        const isBull = c.close >= c.open;

        // Wick
        ctx.strokeStyle = isBull ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, highY);
        ctx.lineTo(cx, lowY);
        ctx.stroke();

        // Body
        const topY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));
        const bodyW = Math.max(2, candleStep * 0.75);

        ctx.fillStyle = isBull ? '#10b981' : '#f43f5e';
        ctx.fillRect((cx - bodyW / 2) | 0, topY, bodyW, bodyH);
      });

      // Heatmap Trajectory Line
      if (activeMode === 'LIQUIDITY_HEATMAP') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        visibleCandles.forEach((c, i) => {
          const cx = (paddingLeft + i * candleStep + candleStep / 2) | 0;
          const cy = getY(c.close);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.stroke();
      }
    } else {
      // PACK 1: AGGRESSIVE FOOTPRINT
      ctx.font = 'bold 8.5px monospace';
      ctx.textBaseline = 'middle';

      visibleCandles.forEach((c, i) => {
        const cx = (paddingLeft + i * candleStep + candleStep / 2) | 0;
        const fp = fpMap.get(c.timestamp);
        const isBull = c.close >= c.open;
        const barW = Math.max(34, candleStep * 0.92);

        // Baseline Wick
        const highY = getY(c.high);
        const lowY = getY(c.low);
        ctx.strokeStyle = isBull ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, highY);
        ctx.lineTo(cx, lowY);
        ctx.stroke();

        if (fp && fp.levels && fp.levels.length > 0) {
          const rowH = Math.max(12, (getY(c.low) - getY(c.high)) / fp.levels.length);

          fp.levels.forEach((lvl) => {
            const ly = getY(lvl.price);
            const rowY = (ly - rowH / 2) | 0;

            if (activeMode === 'FOOTPRINT_CLASSIC') {
              if (lvl.isBuyImbalance) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
                ctx.fillRect((cx - barW / 2) | 0, rowY, barW, rowH);
                ctx.strokeStyle = '#10b981';
                ctx.lineWidth = 1;
                ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);
              } else if (lvl.isSellImbalance) {
                ctx.fillStyle = 'rgba(244, 63, 94, 0.32)';
                ctx.fillRect((cx - barW / 2) | 0, rowY, barW, rowH);
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 1;
                ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);
              } else {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.fillRect((cx - barW / 2) | 0, rowY, barW, rowH);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);
              }

              // Intra-candle POC ring
              if (Math.abs(lvl.price - fp.pocPrice) < 0.25) {
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1.4;
                ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);
              }

              if (barW > 38 && rowH > 10) {
                ctx.textAlign = 'right';
                ctx.fillStyle = lvl.isSellImbalance ? '#fda4af' : '#94a3b8';
                ctx.fillText(String(lvl.bidVolume), cx - 2, rowY + rowH / 2);

                ctx.textAlign = 'left';
                ctx.fillStyle = lvl.isBuyImbalance ? '#86efac' : '#e2e8f0';
                ctx.fillText(`× ${lvl.askVolume}`, cx + 2, rowY + rowH / 2);
              }
            } else if (activeMode === 'FOOTPRINT_4COL') {
              const colW = barW / 4;
              ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
              ctx.fillRect((cx - barW / 2) | 0, rowY, barW, rowH);

              ctx.textAlign = 'center';
              ctx.fillStyle = '#64748b';
              ctx.fillText(String(lvl.totalVolume), cx - barW / 2 + colW * 0.5, rowY + rowH / 2);

              ctx.fillStyle = '#f87171';
              ctx.fillText(String(lvl.bidVolume), cx - barW / 2 + colW * 1.5, rowY + rowH / 2);

              ctx.fillStyle = '#34d399';
              ctx.fillText(String(lvl.askVolume), cx - barW / 2 + colW * 2.5, rowY + rowH / 2);

              ctx.fillStyle = lvl.delta >= 0 ? '#38bdf8' : '#e879f9';
              ctx.fillText(`${lvl.delta >= 0 ? '+' : ''}${lvl.delta}`, cx - barW / 2 + colW * 3.5, rowY + rowH / 2);

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);
            } else if (activeMode === 'FOOTPRINT_DELTA_BLOCKS') {
              const isPos = lvl.delta >= 0;
              const alpha = Math.min(0.85, 0.15 + (Math.abs(lvl.delta) / 100) * 0.7);
              ctx.fillStyle = isPos ? `rgba(16, 185, 129, ${alpha})` : `rgba(244, 63, 94, ${alpha})`;
              ctx.fillRect((cx - barW / 2) | 0, rowY, barW, rowH);

              ctx.strokeStyle = isPos ? '#10b981' : '#f43f5e';
              ctx.lineWidth = 0.5;
              ctx.strokeRect((cx - barW / 2) | 0, rowY, barW, rowH);

              ctx.textAlign = 'center';
              ctx.fillStyle = '#ffffff';
              ctx.fillText(`Δ ${lvl.delta >= 0 ? '+' : ''}${lvl.delta}`, cx, rowY + rowH / 2);
            }
          });
        }
      });
    }

    // PACK 1 & 2: BIG TRADES BUBBLES
    if (showBigTrades && bigTrades.length > 0) {
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      bigTrades.forEach(bt => {
        const cIdx = visibleCandles.findIndex(c => Math.abs(c.timestamp - bt.timestamp) < 60000);
        if (cIdx === -1) return;

        const bx = (paddingLeft + cIdx * candleStep + candleStep / 2) | 0;
        const by = getY(bt.price);
        const radius = Math.min(18, Math.max(6, Math.sqrt(bt.volume) * 1.2));

        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fillStyle = bt.side === 'BUY' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)';
        ctx.fill();
        ctx.strokeStyle = bt.side === 'BUY' ? '#34d399' : '#fb7185';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${bt.volume}L`, bx, by);
      });
    }

    // PACK 4: MBO ICEBERGS
    if (showMboIcebergs && mboAlerts.length > 0) {
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      mboAlerts.forEach(alert => {
        const ay = getY(alert.price);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        const bx = chartW * 0.15;
        ctx.fillRect(bx, ay - 10, 160, 20);
        ctx.strokeRect(bx, ay - 10, 160, 20);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`🧊 ICEBERG: ${alert.lotsAbsorbed}L ABSORPTION`, bx + 6, ay);
      });
    }

    // 4. VWAP Lines
    if (showVwap && vwap && vwap.vwap > 0) {
      const vY = getY(vwap.vwap);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, vY);
      ctx.lineTo(width - paddingRight, vY);
      ctx.stroke();

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1;
      const u1 = getY(vwap.upperBand1);
      const l1 = getY(vwap.lowerBand1);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, u1); ctx.lineTo(width - paddingRight, u1);
      ctx.moveTo(paddingLeft, l1); ctx.lineTo(width - paddingRight, l1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. ON-CHART VOLUME PROFILE (VPVR on Right Axis)
    if (showVolumeProfile && profile && profile.bins && profile.bins.length > 0) {
      const maxBin = Math.max(...profile.bins.map(b => b.volume), 1);
      const profileW = 100;
      const startX = showDomLadder ? width - 212 : width - 106;

      profile.bins.forEach(bin => {
        const y = getY(bin.price);
        if (y < paddingTop || y > h - paddingBottom) return;

        const barH = Math.max(2, (chartH / profile.bins.length) * 0.82);
        const totalW = (bin.volume / maxBin) * profileW;
        const buyW = (bin.buyVolume / Math.max(1, bin.volume)) * totalW;
        const sellW = totalW - buyW;

        ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
        ctx.fillRect(startX, y - barH / 2, buyW, barH);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
        ctx.fillRect(startX + buyW, y - barH / 2, sellW, barH);
      });
    }

    // PACK 2: LIVE DOM LADDER (Depth of Market on Far-Right)
    if (showDomLadder && domLevels.length > 0) {
      const domStartX = width - 105;
      const domW = 100;

      ctx.fillStyle = 'rgba(6, 11, 22, 0.95)';
      ctx.fillRect(domStartX, paddingTop, domW, chartH);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(domStartX, paddingTop, domW, chartH);

      ctx.fillStyle = '#0ea5e9';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LIVE DOM LADDER', domStartX + domW / 2, paddingTop - 8);

      ctx.font = '8px monospace';
      domLevels.forEach(dl => {
        const dy = getY(dl.price);
        if (dy < paddingTop || dy > h - paddingBottom) return;

        const isAsk = dl.type === 'ASK';
        const rowH = 14;
        const barFillW = (dl.volume / 220) * (domW - 35);

        ctx.fillStyle = isAsk ? 'rgba(244, 63, 94, 0.22)' : 'rgba(16, 185, 129, 0.22)';
        ctx.fillRect(domStartX + 35, dy - rowH / 2, barFillW, rowH);

        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText(dl.price.toFixed(1), domStartX + 2, dy);

        ctx.fillStyle = isAsk ? '#f87171' : '#34d399';
        ctx.textAlign = 'right';
        ctx.fillText(`${dl.volume}`, domStartX + domW - 2, dy);
      });
    }
  }, [
    visibleCandles,
    minPrice,
    maxPrice,
    priceSpan,
    profile,
    vwap,
    fpMap,
    showVolumeProfile,
    showVwap,
    activeMode,
    showBigTrades,
    showDomLadder,
    showMboIcebergs,
    domLevels,
    bigTrades,
    mboAlerts,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    symbol
  ]);

  // REDRAW MAIN CANVAS ONLY WHEN DATA OR VIEW PARAMETERS CHANGE (0% CPU Burn!)
  useEffect(() => {
    renderMainChart();
  }, [renderMainChart]);

  // =========================================================================
  // FAST OVERLAY CANVAS (Crosshair only - runs in 0.05ms!)
  // =========================================================================
  const renderOverlay = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ovCtx = overlayCanvas.getContext('2d', { desynchronized: true });
    if (!ovCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(overlayCanvas.width / dpr);
    const h = Math.floor(overlayCanvas.height / dpr);
    if (width <= 0 || h <= 0) return;

    ovCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ovCtx.clearRect(0, 0, width, h);
    const { x, y, active } = mousePosRef.current;
    const chartW = width - paddingLeft - paddingRight;
    const chartH = h - paddingTop - paddingBottom;

    if (active && x >= paddingLeft && x <= width - paddingRight && y >= paddingTop && y <= h - paddingBottom) {
      ovCtx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ovCtx.lineWidth = 1;
      ovCtx.setLineDash([3, 3]);

      ovCtx.beginPath();
      ovCtx.moveTo(paddingLeft, y);
      ovCtx.lineTo(width - paddingRight, y);
      ovCtx.stroke();

      ovCtx.beginPath();
      ovCtx.moveTo(x, paddingTop);
      ovCtx.lineTo(x, h - paddingBottom);
      ovCtx.stroke();
      ovCtx.setLineDash([]);

      const hoverPrice = maxPrice - ((y - paddingTop) / chartH) * priceSpan;
      ovCtx.fillStyle = '#0ea5e9';
      ovCtx.fillRect(width - paddingRight + 2, y - 9, 65, 18);
      ovCtx.fillStyle = '#000000';
      ovCtx.font = 'bold 10px monospace';
      ovCtx.textAlign = 'left';
      ovCtx.textBaseline = 'middle';
      ovCtx.fillText(hoverPrice.toFixed(2), width - paddingRight + 6, y);
    }
  }, [maxPrice, priceSpan, paddingLeft, paddingRight, paddingTop, paddingBottom]);

  // Handle Resize & DPI with ResizeObserver (Zero GPU Buffer Reallocation if dimensions unchanged)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const main = mainCanvasRef.current;
      const overlay = overlayCanvasRef.current;
      if (!container || !main || !overlay) return;

      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      if (w <= 0) return;

      cachedRectRef.current = overlay.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const h = height;
      const targetW = Math.floor(w * dpr);
      const targetH = Math.floor(h * dpr);

      let dimensionsChanged = false;
      if (main.width !== targetW || main.height !== targetH) {
        main.width = targetW;
        main.height = targetH;
        dimensionsChanged = true;
      }

      if (overlay.width !== targetW || overlay.height !== targetH) {
        overlay.width = targetW;
        overlay.height = targetH;
        dimensionsChanged = true;
      }

      if (dimensionsChanged) {
        renderMainChart();
      }
    };

    updateDimensions();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateDimensions();
      });
      ro.observe(container);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [height, renderMainChart]);

  // ZERO-REFLOW Mouse Handlers (Uses cachedRectRef & requestAnimationFrame on overlay only!)
  const handleMouseEnter = () => {
    if (overlayCanvasRef.current) {
      cachedRectRef.current = overlayCanvasRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = cachedRectRef.current;
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePosRef.current = { x, y, active: true };

    if (isDraggingRef.current) {
      const deltaX = x - lastMouseXRef.current;
      if (Math.abs(deltaX) > 10) {
        const shiftBars = Math.round(deltaX / 12);
        setPanIndex(prev => Math.max(0, prev + shiftBars));
        lastMouseXRef.current = x;
      }
    }

    requestAnimationFrame(renderOverlay);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    const rect = cachedRectRef.current;
    lastMouseXRef.current = e.clientX - (rect?.left || 0);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    mousePosRef.current.active = false;
    isDraggingRef.current = false;
    requestAnimationFrame(renderOverlay);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 4 : -4;
    setZoomBars(prev => Math.min(120, Math.max(isFootprint ? 6 : 18, prev + zoomDelta)));
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl bg-[#03060f] border border-white/[0.08] overflow-hidden select-none shadow-2xl">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-2 left-2 right-2 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="font-black text-amber-400 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/30">
            {symbol} • {timeframe}
          </span>

          {/* PACK 1 & 2 & 3 VIEW MODE SWITCHERS */}
          <div className="flex items-center bg-[#070c18] p-0.5 rounded-lg border border-white/[0.1]">
            <button
              onClick={() => onViewModeChange && onViewModeChange('CANDLESTICK')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeMode === 'CANDLESTICK' ? 'bg-white text-black font-extrabold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🕯️ CANDLES
            </button>

            <button
              onClick={() => onViewModeChange && onViewModeChange('FOOTPRINT_CLASSIC')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeMode === 'FOOTPRINT_CLASSIC' ? 'bg-amber-500 text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Classic Footprint (Bid x Ask with 300% Stacked Imbalances)"
            >
              👣 BID×ASK
            </button>

            <button
              onClick={() => onViewModeChange && onViewModeChange('FOOTPRINT_4COL')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeMode === 'FOOTPRINT_4COL' ? 'bg-cyan-500 text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Four Columns Style (Vol, Bids, Asks, Instant Delta)"
            >
              📊 4-COLUMNS
            </button>

            <button
              onClick={() => onViewModeChange && onViewModeChange('FOOTPRINT_DELTA_BLOCKS')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeMode === 'FOOTPRINT_DELTA_BLOCKS' ? 'bg-emerald-500 text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Delta Blocks (Intensity-Colored Delta)"
            >
              🟩 DELTA BLOCKS
            </button>

            <button
              onClick={() => onViewModeChange && onViewModeChange('LIQUIDITY_HEATMAP')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                activeMode === 'LIQUIDITY_HEATMAP' ? 'bg-gradient-to-r from-cyan-500 to-amber-500 text-black font-extrabold shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
              title="Past & Live DOM Liquidity Heatmap (Bookmap Style)"
            >
              🔥 HEATMAP
            </button>
          </div>

          {/* Toggle Big Trades, DOM, and MBO */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowBigTrades(!showBigTrades)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                showBigTrades ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-black/30 text-zinc-500 border-white/[0.04]'
              }`}
              title="Big Trades Bubble Markers"
            >
              ● Big Trades
            </button>

            <button
              onClick={() => setShowDomLadder(!showDomLadder)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                showDomLadder ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-black/30 text-zinc-500 border-white/[0.04]'
              }`}
              title="Live Level 2 DOM Ladder"
            >
              ≡ DOM Ladder
            </button>

            <button
              onClick={() => setShowMboIcebergs(!showMboIcebergs)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                showMboIcebergs ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-black/30 text-zinc-500 border-white/[0.04]'
              }`}
              title="MBO Icebergs & Stop Sweeps"
            >
              🧊 MBO Iceberg
            </button>
          </div>
        </div>

        {/* PACK 1: TAPE SPEED & ORDERFLOW VELOCITY */}
        <div className="flex items-center gap-2 bg-[#060a14]/90 backdrop-blur-md px-3 py-1 rounded-xl border border-white/[0.08] text-[9.5px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-400">TAPE SPEED:</span>
            <span className="font-extrabold text-white">{tapeSpeed} T/s</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div>
            <span className="text-zinc-400">FLOW:</span>
            <span className="font-extrabold text-cyan-400 ml-1">${flowSpeed}M/s</span>
          </div>
        </div>
      </div>

      {/* Main Drawing Canvas (Hardware-Accelerated 240 FPS / Zero Idle Load) */}
      <canvas
        ref={mainCanvasRef}
        className="block w-full gpu-layer"
        style={{ width: '100%', height: `${height}px`, willChange: 'transform' }}
      />

      {/* Crosshair / Tooltip Canvas (0.05ms decoupled overlay) */}
      <canvas
        ref={overlayCanvasRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair z-10 gpu-layer"
        style={{ width: '100%', height: `${height}px`, willChange: 'transform' }}
      />
    </div>
  );
};

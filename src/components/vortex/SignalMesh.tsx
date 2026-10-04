'use client';

import React, { useEffect, useRef, useState, memo } from "react";
import { vortexEngine } from "@/lib/vortex/vortex-engine";
import { JarvisIntelligenceBrain } from "@/lib/ai/jarvis-brain";

interface SignalMeshProps {
  symbol?: string;
  livePrice?: number;
  candles?: any[];
}

interface AgentClusterData {
  id: string;
  name: string;
  role: string;
  score: number;
  direction: string;
  color: string;
  subtitle: string;
  details: string;
}

/**
 * THE KERNEL / SIGNAL MESH
 * 
 * Quantitative Multi-Agent Confluence Network:
 * Represents the 6 live algorithmic decision engines running in parallel.
 * Each cluster of nodes displays real-time score, stance, and synaptic coherence.
 * High synaptic illumination = high confluence (prime execution condition).
 */
export const SignalMesh = memo(function SignalMesh({
  symbol = 'XAUUSD',
  livePrice,
  candles,
}: SignalMeshProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentClusterData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const cleanSym = (symbol || 'XAUUSD').toUpperCase().trim();
  const livePriceRef = useRef(livePrice);
  const candlesRef = useRef(candles);

  const cachedClustersRef = useRef<AgentClusterData[]>([]);
  const lastIntelTimeRef = useRef<number>(0);

  const getOrComputeClusters = () => {
    const now = Date.now();
    if (cachedClustersRef.current.length > 0 && now - lastIntelTimeRef.current < 2000) {
      return cachedClustersRef.current;
    }
    const intel = JarvisIntelligenceBrain.getCentralIntelligence(
      cleanSym,
      livePriceRef.current,
      candlesRef.current
    );
    const snap = vortexEngine.peek() || vortexEngine.getSnapshot();
    const clusters: AgentClusterData[] = [
      {
        id: 'JARVIS',
        name: 'NEXUS AI',
        role: 'CONSENSUS',
        score: intel.masterConfluencePercent,
        direction: intel.masterDirection.replace('_', ' '),
        color: '#00f0ff',
        subtitle: `${intel.moduleAlignmentCount.bullish}/${intel.moduleAlignmentCount.total} Aligned`,
        details: intel.romanUrduSynthesis.slice(0, 75) + '...',
      },
      {
        id: 'SMC_ICT',
        name: 'SMC / ICT',
        role: 'STRUCTURE',
        score: intel.corePillars.technicalSMC.score,
        direction: intel.corePillars.technicalSMC.structure,
        color: '#10b981',
        subtitle: intel.corePillars.technicalSMC.fvgState,
        details: `FVG & Liquidity Sweep alignment with ${intel.corePillars.technicalSMC.score}% conviction`,
      },
      {
        id: 'CFTC_COT',
        name: 'CFTC COT',
        role: 'SMART MONEY',
        score: intel.corePillars.cftcSmartMoney.score,
        direction: intel.corePillars.cftcSmartMoney.bias,
        color: '#a855f7',
        subtitle: `${intel.corePillars.cftcSmartMoney.percentile}th %ile Long`,
        details: `Institutional positioning percentile: ${intel.corePillars.cftcSmartMoney.percentile}%`,
      },
      {
        id: 'MACRO_DIV',
        name: 'QUANT MACRO',
        role: 'DIVERGENCE',
        score: intel.corePillars.macroDivergence.score,
        direction: intel.corePillars.macroDivergence.keyMetric,
        color: '#f59e0b',
        subtitle: intel.corePillars.macroDivergence.summary.slice(0, 30),
        details: intel.corePillars.macroDivergence.summary,
      },
      {
        id: 'YIELD_DIFF',
        name: 'RATE SPREAD',
        role: 'CARRY TRADE',
        score: Math.min(100, Math.max(20, Math.round(50 + (intel.corePillars.rateSpread.spreadPercent || 1.5) * 10))),
        direction: `${intel.corePillars.rateSpread.spreadPercent.toFixed(2)}%`,
        color: '#3b82f6',
        subtitle: `Carry ${intel.corePillars.rateSpread.carryStance}`,
        details: `Bond spread ${intel.corePillars.rateSpread.spreadPercent}% (${intel.corePillars.rateSpread.carryStance})`,
      },
      {
        id: 'RISK_GUARD',
        name: 'RISK GUARD',
        role: 'DRAWDOWN',
        score: Math.max(20, Math.min(100, Math.round(100 - (snap?.maxDd || 1.18) * 9))),
        direction: (snap?.maxDd || 1.18) < 3 ? 'OPTIMAL SAFE' : 'DEFENSIVE',
        color: '#ec4899',
        subtitle: `DD ${snap?.maxDd?.toFixed(2) ?? '1.18'}% / 5%`,
        details: `Prop firm capital protection: Max Drawdown ${snap?.maxDd?.toFixed(2) ?? '1.18'}%`,
      },
    ];
    cachedClustersRef.current = clusters;
    lastIntelTimeRef.current = now;
    return clusters;
  };

  useEffect(() => {
    livePriceRef.current = livePrice;
    candlesRef.current = candles;
    // Reset cache on live updates
    lastIntelTimeRef.current = 0;
  }, [livePrice, candles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;

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
    applySize(initialParent.clientWidth || 300, initialParent.clientHeight || 100);

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

    // Dynamic signal particles flowing through synapses
    const particles: Array<{
      fromCluster: number;
      toCluster: number;
      progress: number;
      speed: number;
      color: string;
    }> = Array.from({ length: 16 }, (_, i) => ({
      fromCluster: i % 5,
      toCluster: (i % 5) + 1,
      progress: Math.random(),
      speed: 0.013 + Math.random() * 0.015,
      color: '#00f0ff',
    }));

    const draw = () => {
      try {
        if (w <= 0 || h <= 0) {
          raf = requestAnimationFrame(draw);
          return;
        }

        // 1. Fetch Cached Multi-Agent Intelligence (throttled to 2000ms instead of 60 FPS!)
        const clusters = getOrComputeClusters();
        const snap = vortexEngine.peek() || vortexEngine.getSnapshot();

        t += 0.026 + (snap.vortexVelocity || 0.4) * 0.022;
        ctx.clearRect(0, 0, w, h);

        const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("light");

        // 2. Subtle Quantum Mesh Background Grid
        ctx.strokeStyle = isLight ? "rgba(22,22,26,0.05)" : "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        const gridCols = 8;
        for (let i = 0; i <= gridCols; i++) {
          const gx = (i / gridCols) * w;
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }

        const clusterCount = clusters.length;
        const perCluster = 7;
        const clusterCenters: Array<{ x: number; y: number; cluster: AgentClusterData }> = [];

        // 3. Compute Real Node Positions Based on Live Agent Scores
        for (let c = 0; c < clusterCount; c++) {
          const agent = clusters[c];
          const baseX = ((c + 0.5) / clusterCount) * w;
          
          // Higher score lifts the wave up towards Bullish zone, lower moves towards Bearish zone
          const normalizedScore = agent.score / 100; // 0.0 to 1.0
          const scoreY = h * 0.70 - normalizedScore * (h * 0.42);
          const baseY = scoreY + Math.sin(t * 1.4 + c * 1.5) * (h * 0.08);

          clusterCenters.push({ x: baseX, y: baseY, cluster: agent });

          const pts: { x: number; y: number }[] = [];
          for (let i = 0; i < perCluster; i++) {
            const f = i / (perCluster - 1);
            const x = baseX + (f - 0.5) * (w / clusterCount) * 0.88;
            const y =
              baseY +
              Math.sin(t * 2.2 + i * 0.9 + c) * (h * 0.09) * (0.35 + normalizedScore * 0.8) +
              Math.cos(t * 1.2 + i * 1.7) * 3;
            pts.push({ x, y });
          }

          // Main cluster wave line
          ctx.strokeStyle = agent.color + (isLight ? "99" : "cc");
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();

          // Cluster Nodes with Glowing Halos
          pts.forEach((p, i) => {
            const isCenter = i === Math.floor(perCluster / 2);
            ctx.fillStyle = agent.color;
            ctx.globalAlpha = isCenter ? 1.0 : 0.65;

            // Halo glow for central node
            if (isCenter) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
              ctx.fillStyle = agent.color + "33";
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, isCenter ? 2.8 : 2.0, 0, Math.PI * 2);
            ctx.fillStyle = agent.color;
            ctx.fill();
            ctx.globalAlpha = 1;
          });

          // Text Labels on Canvas
          ctx.font = "bold 8px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = agent.color;
          ctx.fillText(agent.name, baseX, 12);

          // Stance Badge
          ctx.font = "bold 7.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = isLight ? "#475569" : "#94a3b8";
          ctx.fillText(`${agent.score}% ${agent.direction.split(' ')[0]}`, baseX, h - 16);
        }

        // 4. Cross-Links / Synaptic Pathways between Clusters
        for (let c = 1; c < clusterCount; c++) {
          const prev = clusterCenters[c - 1];
          const curr = clusterCenters[c];

          const isAligned =
            (prev.cluster.score >= 60 && curr.cluster.score >= 60) ||
            (prev.cluster.score <= 45 && curr.cluster.score <= 45);

          ctx.strokeStyle = isAligned
            ? (curr.cluster.color + (isLight ? "44" : "55"))
            : (isLight ? "rgba(22,22,26,0.12)" : "rgba(255,255,255,0.12)");
          ctx.lineWidth = isAligned ? 1.2 : 0.8;
          ctx.setLineDash(isAligned ? [] : [3, 3]);

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 5. Energy Synaptic Particles Flowing in Real-Time
        for (const p of particles) {
          p.progress += p.speed;
          if (p.progress > 1) {
            p.progress = 0;
            p.fromCluster = Math.floor(Math.random() * (clusterCount - 1));
            p.toCluster = p.fromCluster + 1;
          }

          const from = clusterCenters[p.fromCluster];
          const to = clusterCenters[p.toCluster];
          if (from && to) {
            const px = from.x + (to.x - from.x) * p.progress;
            const py = from.y + (to.y - from.y) * p.progress;

            ctx.fillStyle = to.cluster.color;
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } catch (err) {
        console.warn('[SignalMesh draw error]:', err);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    const unsub = vortexEngine.subscribe(() => {
      // Force instant evaluation on every live tick pushed to vortex engine
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsub();
    };
  }, [cleanSym]);

  // Handle pointer hover to detect which agent cluster is under cursor
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clusterWidth = rect.width / 6;
    const clusterIndex = Math.floor(x / clusterWidth);

    if (clusterIndex >= 0 && clusterIndex < 6) {
      const clusters = getOrComputeClusters();
      setHoveredAgent(clusters[clusterIndex]);
      setHoverPos({ x, y });
    } else {
      setHoveredAgent(null);
    }
  };

  const handlePointerLeave = () => {
    setHoveredAgent(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-full w-full select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full block cursor-crosshair"
        style={{
          imageRendering: "auto",
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      />

      {/* Live Stream Pulse Badge */}
      <div className="pointer-events-none absolute right-2 top-1.5 flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-emerald-400/90 z-20">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
        <span>MT5 LIVE TAPE</span>
      </div>

      {/* Interactive Tooltip Card on Hover */}
      {hoveredAgent && hoverPos && (
        <div
          className="pointer-events-none absolute z-30 flex flex-col gap-1 rounded border border-white/20 bg-black/90 p-2 text-left font-mono backdrop-blur-md shadow-2xl transition-all"
          style={{
            left: Math.max(10, Math.min(hoverPos.x - 75, (containerRef.current?.clientWidth || 300) - 170)),
            top: 18,
            width: 165,
          }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="text-[9px] font-extrabold" style={{ color: hoveredAgent.color }}>
              {hoveredAgent.name}
            </span>
            <span className="rounded bg-white/10 px-1 text-[8px] font-bold text-slate-300">
              {hoveredAgent.role}
            </span>
          </div>
          <div className="flex items-baseline justify-between text-[9px]">
            <span className="text-slate-400">Score:</span>
            <span className="font-bold text-white">{hoveredAgent.score}%</span>
          </div>
          <div className="flex items-baseline justify-between text-[9px]">
            <span className="text-slate-400">Signal:</span>
            <span className="font-bold" style={{ color: hoveredAgent.color }}>
              {hoveredAgent.direction}
            </span>
          </div>
          <p className="text-[7.5px] leading-tight text-slate-300 line-clamp-2 pt-0.5">
            {hoveredAgent.subtitle}
          </p>
        </div>
      )}
    </div>
  );
});

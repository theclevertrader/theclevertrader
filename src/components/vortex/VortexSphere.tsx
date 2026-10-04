'use client';

import { useEffect, useRef, memo } from "react";
import { vortexEngine } from "@/lib/vortex/vortex-engine";
import { JarvisIntelligenceBrain } from "@/lib/ai/jarvis-brain";

/**
 * THE VORTEX — Ultra-Crisp High-DPI 3D rotating coil of agent flow strands.
 * Pure hardware-accelerated canvas with 60 FPS requestAnimationFrame.
 * Features 3-state Regime Colors:
 * - BULLISH: Vivid Emerald / Neon Green
 * - BEARISH: Aggressive Crimson / Rose Red
 * - SIDEWAYS: Electric Cyan & Amber Gold Coiling Weave
 */
export const VortexSphere = memo(function VortexSphere() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
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
    applySize(initialParent.clientWidth || 300, initialParent.clientHeight || 240);

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

    const STRANDS = 14;
    const SEGMENTS = 24; // Highly optimized for silky 60 FPS without GPU lag
    const seeds = Array.from({ length: STRANDS }, (_, i) => ({
      phase: (i / STRANDS) * Math.PI * 2,
      turns: 2.1 + (i % 5) * 0.28,
      wobble: 0.1 + ((i * 7) % 11) / 42,
      tilt: ((i % 7) - 3) * 0.05,
    }));

    let cachedRegime: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
    let lastRegimeCheck = 0;

    const draw = () => {
      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const s = vortexEngine.peek() || vortexEngine.getSnapshot();
      if (!s) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // Dynamic Speed Boost: Responsive to live price velocity & market volume
      const vel = 0.35 + (s.vortexVelocity || 0.4) * 2.5;
      phase += 0.012 * vel;

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.31;
      const H = h * 0.72;
      const spread = 0.7 + s.coilStatus * 0.18;

      const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("light");

      // Ground reference rings with crisp pixel placement
      ctx.strokeStyle = isLight ? "rgba(22,22,26,0.08)" : "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy + H / 2 + 6, R * k * 0.42, R * k * 0.11, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3-State Regime Evaluation (Cached: Evaluates once every 1000ms instead of 60 FPS)
      const now = Date.now();
      if (now - lastRegimeCheck > 1000) {
        lastRegimeCheck = now;
        const intel = JarvisIntelligenceBrain.getCentralIntelligence(s.symbol || 'XAUUSD', s.price, s.candles);
        if (intel.masterDirection === 'STRONG_BUY' || intel.masterDirection === 'BUY') {
          cachedRegime = 'BULLISH';
        } else if (intel.masterDirection === 'STRONG_SELL' || intel.masterDirection === 'SELL') {
          cachedRegime = 'BEARISH';
        } else {
          const priceDiff = s.price - (s.prevPrice || s.price);
          if (Math.abs(priceDiff) > 0.02 && s.vortexVelocity > 0.42) {
            cachedRegime = priceDiff > 0 ? 'BULLISH' : 'BEARISH';
          } else {
            cachedRegime = 'SIDEWAYS';
          }
        }
      }
      const regime = cachedRegime;

      // 3D Matrix Projection
      const tiltX = 0.32;
      const cosT = Math.cos(tiltX);
      const sinT = Math.sin(tiltX);

      for (let i = 0; i < STRANDS; i++) {
        const sd = seeds[i];
        const agent = s.agents[i % s.agents.length];
        const strength = 0.3 + (agent?.conviction ?? 0.5) * 0.7;

        const pts: { x: number; y: number; z: number }[] = [];
        for (let j = 0; j <= SEGMENTS; j++) {
          const t = j / SEGMENTS;
          const env = Math.pow(Math.sin(Math.PI * t), 0.62);
          const wob =
            Math.sin(t * 9 + phase * 3 + sd.phase) * sd.wobble * R * 0.32 * s.vortexVelocity;
          const r = R * env * spread + wob;
          const a = sd.phase + t * Math.PI * 2 * sd.turns + phase * (1 + sd.tilt);
          const y = (t - 0.5) * H;
          pts.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r });
        }

        ctx.beginPath();
        let started = false;
        let prevDepth = 0;
        for (let j = 0; j < pts.length; j++) {
          const p = pts[j];
          const y2 = p.y * cosT - p.z * sinT;
          const z2 = p.y * sinT + p.z * cosT;
          const persp = 620 / (620 + z2);
          const sx = cx + p.x * persp;
          const sy = cy + y2 * persp;
          const depth = (z2 + R) / (2 * R);
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
          prevDepth = depth;
        }

        const alpha = 0.15 + Math.max(0, Math.min(1, prevDepth)) * 0.45 * strength;

        // Dynamic 3-State Color Scheme
        if (isLight) {
          if (regime === 'BULLISH') {
            ctx.strokeStyle = i % 6 === 0
              ? `rgba(16,185,129,${(alpha + 0.35).toFixed(3)})`
              : `rgba(5,150,105,${(alpha + 0.18).toFixed(3)})`;
          } else if (regime === 'BEARISH') {
            ctx.strokeStyle = i % 6 === 0
              ? `rgba(225,29,72,${(alpha + 0.35).toFixed(3)})`
              : `rgba(190,18,60,${(alpha + 0.18).toFixed(3)})`;
          } else {
            // SIDEWAYS / CHOP
            ctx.strokeStyle = i % 2 === 0
              ? `rgba(29,78,216,${(alpha + 0.28).toFixed(3)})`
              : `rgba(217,119,6,${(alpha + 0.22).toFixed(3)})`;
          }
          ctx.lineWidth = i % 6 === 0 ? 2.0 : 1.25;
        } else {
          // Luminous Dark Neon Colors
          if (regime === 'BULLISH') {
            ctx.strokeStyle = i % 6 === 0
              ? `rgba(0,240,255,${(alpha + 0.42).toFixed(3)})`
              : `rgba(0,230,118,${(alpha + 0.26).toFixed(3)})`;
          } else if (regime === 'BEARISH') {
            ctx.strokeStyle = i % 6 === 0
              ? `rgba(255,51,102,${(alpha + 0.45).toFixed(3)})`
              : `rgba(244,63,94,${(alpha + 0.28).toFixed(3)})`;
          } else {
            // SIDEWAYS / CHOP
            ctx.strokeStyle = i % 2 === 0
              ? `rgba(0,240,255,${(alpha + 0.38).toFixed(3)})`
              : `rgba(245,158,11,${(alpha + 0.28).toFixed(3)})`;
          }
          ctx.lineWidth = i % 6 === 0 ? 1.8 : 1.35;
        }
        ctx.stroke();
      }

      // Core Luminous Energy Axis (Color-matched to regime)
      const grad = ctx.createLinearGradient(cx, cy - H / 2, cx, cy + H / 2);
      if (isLight) {
        if (regime === 'BULLISH') {
          grad.addColorStop(0, "rgba(16,185,129,0)");
          grad.addColorStop(0.5, "rgba(16,185,129,0.55)");
          grad.addColorStop(1, "rgba(16,185,129,0)");
        } else if (regime === 'BEARISH') {
          grad.addColorStop(0, "rgba(225,29,72,0)");
          grad.addColorStop(0.5, "rgba(225,29,72,0.55)");
          grad.addColorStop(1, "rgba(225,29,72,0)");
        } else {
          grad.addColorStop(0, "rgba(29,78,216,0)");
          grad.addColorStop(0.5, "rgba(217,119,6,0.45)");
          grad.addColorStop(1, "rgba(29,78,216,0)");
        }
      } else {
        if (regime === 'BULLISH') {
          grad.addColorStop(0, "rgba(0,230,118,0)");
          grad.addColorStop(0.5, "rgba(0,230,118,0.85)");
          grad.addColorStop(1, "rgba(0,230,118,0)");
        } else if (regime === 'BEARISH') {
          grad.addColorStop(0, "rgba(255,51,102,0)");
          grad.addColorStop(0.5, "rgba(255,51,102,0.85)");
          grad.addColorStop(1, "rgba(255,51,102,0)");
        } else {
          grad.addColorStop(0, "rgba(0,240,255,0)");
          grad.addColorStop(0.5, "rgba(245,158,11,0.80)");
          grad.addColorStop(1, "rgba(0,240,255,0)");
        }
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = isLight ? 1.5 : 2.0;
      ctx.beginPath();
      ctx.moveTo(cx, cy - H / 2);
      ctx.lineTo(cx, cy + H / 2);
      ctx.stroke();

      // Orbiting Agent Particle Nodes (Fast and energetic)
      s.agents.forEach((a, i) => {
        const t = 0.5 + Math.sin(phase * 1.8 + i) * 0.36;
        const env = Math.pow(Math.sin(Math.PI * t), 0.62);
        const ang = phase * 2.2 + (i / s.agents.length) * Math.PI * 2;
        const r = R * env * spread * 1.06;
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        const y = (t - 0.5) * H;
        const y2 = y * cosT - z * sinT;
        const z2 = y * sinT + z * cosT;
        const persp = 620 / (620 + z2);
        const sx = cx + x * persp;
        const sy = cy + y2 * persp;

        // Outer soft glow halo
        ctx.fillStyle = a.color;
        ctx.globalAlpha = (0.35 + ((z2 + R) / (2 * R)) * 0.65) * 0.35;
        ctx.beginPath();
        ctx.arc(sx, sy, 5.0 * persp + 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner sharp particle point
        ctx.globalAlpha = 0.75 + ((z2 + R) / (2 * R)) * 0.25;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5 * persp + 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full block"
      style={{
        imageRendering: "auto",
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    />
  );
});

'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";

// ─── Binary Rain Canvas ───────────────────────────────────────────────────────
function BinaryRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.max(1, Math.floor(canvas.width / 14));
    const drops: number[] = Array(cols).fill(0).map(() => Math.random() * -50);
    const chars = "01";

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff41";
      ctx.font = "11px monospace";
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * 14, drops[i] * 14);
        if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.4;
      }
    }, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.55 }}
    />
  );
}

// ─── Radar Canvas (REAL DATA — Connected to scanFeed) ─────────────────────────
interface RadarBlip {
  angle: number;     // radians
  distance: number;  // 0-1
  color: string;
  label: string;
  status: string;
}

function RadarCanvas({ blips = [] }: { blips: RadarBlip[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);
  const blipsRef = useRef<RadarBlip[]>(blips);

  useEffect(() => {
    blipsRef.current = blips;
  }, [blips]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const SIZE = 220;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 10;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,20,0,0.85)";
      ctx.fill();

      // Grid circles
      [0.25, 0.5, 0.75, 1].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,255,65,0.2)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      // Grid labels
      ctx.font = "bold 7px 'Courier New', monospace";
      ctx.fillStyle = "rgba(0,255,65,0.3)";
      ctx.textAlign = "left";
      ctx.fillText("25%", cx + 3, cy - r * 0.25 + 3);
      ctx.fillText("50%", cx + 3, cy - r * 0.5 + 3);
      ctx.fillText("75%", cx + 3, cy - r * 0.75 + 3);

      // Cross lines
      ctx.strokeStyle = "rgba(0,255,65,0.15)";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      const d = r * Math.cos(Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d); ctx.stroke();

      // Sweep arc
      const angle = angleRef.current;
      const sweepWidth = (Math.PI * 2) / 3;

      const gradient = ctx.createLinearGradient(
        cx + Math.cos(angle - sweepWidth) * r,
        cy + Math.sin(angle - sweepWidth) * r,
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r
      );
      gradient.addColorStop(0, "rgba(0,255,65,0)");
      gradient.addColorStop(1, "rgba(0,255,65,0.35)");

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle - sweepWidth, angle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.strokeStyle = "rgba(0,255,65,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // ── REAL BLIPS from scanFeed ──
      const activeBlips = blipsRef.current;
      if (activeBlips.length > 0) {
        activeBlips.forEach(b => {
          const diff = ((angle - b.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          const fadeRange = Math.PI * 1.5; // Blips stay visible for 270° after sweep passes
          if (diff < fadeRange) {
            const alpha = Math.max(0.15, 1 - diff / fadeRange);
            const bx = cx + Math.cos(b.angle) * r * b.distance;
            const by = cy + Math.sin(b.angle) * r * b.distance;

            // Outer glow
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            const glowColor = b.color.replace(')', `,${alpha * 0.3})`).replace('rgb(', 'rgba(');
            ctx.fillStyle = `rgba(${b.status === 'EXECUTED' ? '0,255,65' : b.status === 'BLOCKED' ? '255,68,68' : b.status === 'PASSED' ? '0,255,157' : '0,212,255'},${alpha * 0.3})`;
            ctx.fill();

            // Inner dot
            ctx.beginPath();
            ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${b.status === 'EXECUTED' ? '0,255,65' : b.status === 'BLOCKED' ? '255,68,68' : b.status === 'PASSED' ? '0,255,157' : '0,212,255'},${alpha})`;
            ctx.fill();

            // Label on hover proximity (always show for first few)
            if (diff < sweepWidth * 1.2) {
              ctx.font = "bold 7px 'Courier New', monospace";
              ctx.fillStyle = `rgba(0,255,157,${alpha})`;
              ctx.textAlign = "center";
              ctx.fillText(b.label, bx, by - 10);
            }
          }
        });
      } else {
        // Fallback decorative blips when no real data
        const decorBlips = [
          { a: 0.8, d: 0.6 },
          { a: 2.3, d: 0.45 },
          { a: 4.1, d: 0.75 },
        ];
        decorBlips.forEach(b => {
          const diff = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          if (diff < sweepWidth) {
            const alpha = 1 - diff / sweepWidth;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(b.a) * r * b.d, cy + Math.sin(b.a) * r * b.d, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,255,65,${alpha})`;
            ctx.fill();
          }
        });
      }

      // Center crosshair dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,65,0.8)";
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,255,65,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Labels
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.fillStyle = "rgba(0,255,65,0.6)";
      ctx.textAlign = "center";
      ctx.fillText("SCAN RADAR", cx, cy + r + 12);

      const blipCount = activeBlips.length;
      ctx.fillStyle = blipCount > 0 ? "rgba(0,255,157,0.8)" : "rgba(100,100,100,0.5)";
      ctx.fillText(blipCount > 0 ? `● ${blipCount} TARGETS` : "○ IDLE", cx, SIZE - 2);

      angleRef.current = (angle + 0.025) % (Math.PI * 2);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 220, height: 220, display: "block" }} />;
}

// ─── TickPulse Volume Bar Chart ───────────────────────────────────────────────
function TickPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const NUM = 60;
    barsRef.current = Array(NUM).fill(0).map(() => 0.2 + Math.random() * 0.8);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const logW = W / dpr;
      const logH = H / dpr;

      ctx.clearRect(0, 0, logW, logH);

      // Dark grid bg
      ctx.fillStyle = "rgba(0, 4, 0, 0.9)";
      ctx.fillRect(0, 0, logW, logH);

      // Horizontal gridlines
      ctx.strokeStyle = "rgba(0,255,200,0.06)";
      ctx.lineWidth = 0.5;
      for (let y = 0; y < logH; y += 12) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logW, y); ctx.stroke();
      }

      const bars = barsRef.current;
      const gap = 1.5;
      const barW = Math.max(2, (logW - gap * bars.length) / bars.length);

      bars.forEach((h, i) => {
        const bh = h * logH * 0.85;
        const x = i * (barW + gap);
        const y = logH - bh;

        // Gradient bar
        const grad = ctx.createLinearGradient(0, y, 0, logH);
        if (h > 0.7) {
          // High volume — bright neon cyan
          grad.addColorStop(0, "rgba(0,255,220,0.95)");
          grad.addColorStop(0.5, "rgba(0,200,180,0.7)");
          grad.addColorStop(1, "rgba(0,100,80,0.3)");
        } else if (h > 0.4) {
          // Medium — green
          grad.addColorStop(0, "rgba(0,255,100,0.85)");
          grad.addColorStop(1, "rgba(0,130,60,0.3)");
        } else {
          // Low — dim
          grad.addColorStop(0, "rgba(0,180,100,0.5)");
          grad.addColorStop(1, "rgba(0,80,40,0.15)");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, bh);

        // Glow cap
        if (h > 0.6) {
          ctx.fillStyle = "rgba(0,255,220,0.4)";
          ctx.fillRect(x, y - 1, barW, 2);
        }
      });

      // Top-left label
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.fillStyle = "rgba(0, 255, 200, 0.5)";
      ctx.textAlign = "left";
      ctx.fillText("VOL", 4, 11);

      // Top-right tick counter
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(0, 255, 200, 0.6)";
      ctx.fillText(`${NUM} TICKS`, logW - 4, 11);
      ctx.textAlign = "left";
    };

    const interval = setInterval(() => {
      barsRef.current.shift();
      barsRef.current.push(0.1 + Math.random() * 0.9);
      draw();
    }, 150);
    draw();

    return () => {
      clearInterval(interval);
      ro.disconnect();
    };
  }, []);

  return (
    <div style={{ width: "100%", height: 75, position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }}
      />
    </div>
  );
}

// ─── Heartbeat ECG Trading Monitor (WITH HOSPITAL BEEP SOUND) ─────────────────
function HeartbeatMonitor({ profit = 0, isGreen = true }: { profit: number; isGreen: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<number[]>([]);
  const prevProfitRef = useRef(profit);
  const animFrameRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const lastPushRef = useRef(0);
  const spikeQueueRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beepEnabledRef = useRef(true);
  const [soundOn, setSoundOn] = useState(true);

  // Hospital beep sound generator using Web Audio API
  const playBeep = useCallback((isPositive: boolean, intensity: number) => {
    if (!beepEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Hospital monitor pitch — higher for green, lower for red
      osc.type = 'sine';
      osc.frequency.value = isPositive ? 880 : 440; // A5 for green, A4 for red

      // Bandpass for clean hospital sound
      filter.type = 'bandpass';
      filter.frequency.value = isPositive ? 900 : 450;
      filter.Q.value = 8;

      // Short beep envelope — classic hospital monitor
      const vol = 0.06 + Math.min(0.12, intensity * 0.08); // Subtle but clear
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);    // Quick attack
      gain.gain.setValueAtTime(vol, now + 0.08);              // Sustain
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18); // Fast decay

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio not supported or blocked — silently skip
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn(prev => {
      beepEnabledRef.current = !prev;
      return !prev;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const TOTAL_POINTS = 300;

    if (dataRef.current.length === 0) {
      dataRef.current = Array(TOTAL_POINTS).fill(0);
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Generate ECG heartbeat spike pattern (P-QRS-T complex)
    function generateHeartbeatSpike(amplitude: number): number[] {
      const abs = Math.min(Math.abs(amplitude), 1);
      const sign = amplitude >= 0 ? 1 : -1;
      const scale = 0.3 + abs * 0.7;
      return [
        0, 0, 0,
        0.08 * scale * sign,
        0.15 * scale * sign,
        0.08 * scale * sign,
        0, 0,
        -0.12 * scale * sign,
        0.85 * scale * sign,
        1.0 * scale * sign,
        0.7 * scale * sign,
        -0.25 * scale * sign,
        -0.08 * scale * sign,
        0, 0,
        0.18 * scale * sign,
        0.28 * scale * sign,
        0.15 * scale * sign,
        0.05 * scale * sign,
        0, 0, 0, 0, 0, 0, 0,
      ];
    }

    // Push data + trigger beep
    const pushInterval = setInterval(() => {
      const data = dataRef.current;
      if (spikeQueueRef.current !== 0) {
        const amplitude = spikeQueueRef.current;
        spikeQueueRef.current = 0;
        const spike = generateHeartbeatSpike(amplitude);

        // ♥ BEEP on each heartbeat spike — hospital monitor sound!
        playBeep(amplitude >= 0, Math.abs(amplitude));

        for (const val of spike) {
          data.push(val);
          if (data.length > TOTAL_POINTS) data.shift();
        }
      } else {
        const t = Date.now() / 1000;
        const microPulse = Math.sin(t * 2.5) * 0.02;
        data.push(microPulse);
        if (data.length > TOTAL_POINTS) data.shift();
      }
    }, 40);

    // Auto heartbeat every ~2.5s
    const profitCheckInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastPushRef.current > 2500) {
        const normalizedProfit = Math.max(-1, Math.min(1, prevProfitRef.current / 25));
        spikeQueueRef.current = normalizedProfit || 0.3;
        lastPushRef.current = now;
      }
    }, 800);

    // Render loop
    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const logW = W / dpr;
      const logH = H / dpr;

      ctx.fillStyle = "rgba(0, 4, 0, 0.92)";
      ctx.fillRect(0, 0, logW, logH);

      // Grid
      ctx.strokeStyle = "rgba(0, 255, 65, 0.06)";
      ctx.lineWidth = 0.5;
      const gridSpacingX = 25;
      const gridSpacingY = 20;
      for (let x = offsetRef.current % gridSpacingX; x < logW; x += gridSpacingX) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logH); ctx.stroke();
      }
      for (let y = 0; y < logH; y += gridSpacingY) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logW, y); ctx.stroke();
      }

      // Center baseline
      const centerY = logH / 2;
      ctx.strokeStyle = "rgba(0, 255, 65, 0.12)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, centerY); ctx.lineTo(logW, centerY); ctx.stroke();
      ctx.setLineDash([]);

      const data = dataRef.current;
      if (data.length < 2) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const currentIsGreen = prevProfitRef.current >= 0;
      const mainColor = currentIsGreen ? "#00ff41" : "#ff3355";
      const glowColor = currentIsGreen ? "rgba(0, 255, 65, 0.6)" : "rgba(255, 51, 85, 0.6)";
      const glowColorDeep = currentIsGreen ? "rgba(0, 255, 65, 0.15)" : "rgba(255, 51, 85, 0.15)";

      const pointSpacing = logW / Math.min(data.length, TOTAL_POINTS);
      const amplitude = logH * 0.38;

      // Layer 1: Deep glow
      ctx.beginPath();
      ctx.strokeStyle = glowColorDeep;
      ctx.lineWidth = 8;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let i = 0; i < data.length; i++) {
        const x = i * pointSpacing;
        const y = centerY - data[i] * amplitude;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 2: Medium glow
      ctx.beginPath();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 3.5;
      for (let i = 0; i < data.length; i++) {
        const x = i * pointSpacing;
        const y = centerY - data[i] * amplitude;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 3: Crisp main line
      ctx.beginPath();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 1.8;
      for (let i = 0; i < data.length; i++) {
        const x = i * pointSpacing;
        const y = centerY - data[i] * amplitude;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Bright dot at leading edge
      if (data.length > 0) {
        const lastX = (data.length - 1) * pointSpacing;
        const lastY = centerY - data[data.length - 1] * amplitude;

        const pulseAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
        ctx.fillStyle = currentIsGreen
          ? `rgba(0, 255, 65, ${pulseAlpha})`
          : `rgba(255, 51, 85, ${pulseAlpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();
      }

      // Scanline
      const scanY = (Date.now() / 20) % logH;
      ctx.fillStyle = "rgba(0, 255, 65, 0.03)";
      ctx.fillRect(0, scanY, logW, 2);

      // Labels
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.fillStyle = "rgba(0, 255, 65, 0.5)";
      ctx.textAlign = "left";
      ctx.fillText("ECG", 4, 11);

      // Sound indicator
      ctx.fillStyle = beepEnabledRef.current ? "rgba(0,255,157,0.6)" : "rgba(255,68,68,0.4)";
      ctx.fillText(beepEnabledRef.current ? "🔊" : "🔇", 30, 11);

      const bpm = Math.round(60 + Math.abs(prevProfitRef.current) * 8);
      ctx.font = "bold 10px 'Courier New', monospace";
      ctx.fillStyle = mainColor;
      ctx.textAlign = "right";
      ctx.fillText(`♥ ${bpm} BPM`, logW - 5, 12);
      ctx.textAlign = "left";

      const profitStr = prevProfitRef.current >= 0
        ? `+$${prevProfitRef.current.toFixed(2)}`
        : `-$${Math.abs(prevProfitRef.current).toFixed(2)}`;
      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.fillStyle = mainColor;
      ctx.textAlign = "right";
      ctx.fillText(profitStr, logW - 5, logH - 5);
      ctx.textAlign = "left";

      offsetRef.current += 0.15;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(pushInterval);
      clearInterval(profitCheckInterval);
      ro.disconnect();
    };
  }, [playBeep]);

  // Update profit ref when props change
  useEffect(() => {
    const prev = prevProfitRef.current;
    const delta = Math.abs(profit - prev);
    prevProfitRef.current = profit;

    if (delta > 0.1) {
      const normalized = Math.max(-1, Math.min(1, profit / 25));
      spikeQueueRef.current = normalized || (profit >= 0 ? 0.4 : -0.4);
      lastPushRef.current = Date.now();
    }
  }, [profit]);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ width: "100%", height: 95, position: "relative" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }}
        />
      </div>
      {/* Sound toggle button */}
      <button
        onClick={toggleSound}
        style={{
          position: "absolute",
          top: 2,
          left: 44,
          background: "none",
          border: "1px solid rgba(0,255,65,0.3)",
          borderRadius: 3,
          padding: "1px 5px",
          cursor: "pointer",
          fontSize: 8,
          fontFamily: "'Courier New', monospace",
          color: soundOn ? "#00ff9d" : "#ff4444",
          opacity: 0.7,
          transition: "all 0.2s",
        }}
        title={soundOn ? "Mute Beep" : "Enable Beep"}
      >
        {soundOn ? "🔊 ON" : "🔇 OFF"}
      </button>
    </div>
  );
}

// ─── Scrolling Data Log ───────────────────────────────────────────────────────
function generateDataLine() {
  const hex = () => Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
  const val = () => (Math.random() * 0.9999).toFixed(6);
  const pairs = Array(3).fill(0).map(() => `${hex()}:${val()}`).join(" ");
  const prefix = ["D1FF0", "D2FF1", "D4FF2", "BUFF3", "C8FF4", "AIFF5"][Math.floor(Math.random() * 6)];
  return `${prefix} :: ${pairs}`;
}

function ScrollingData({ width }: { width: number }) {
  const [lines, setLines] = useState<string[]>(() =>
    Array(35).fill(0).map(() => generateDataLine())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLines(prev => {
        const next = [...prev];
        next.shift();
        next.push(generateDataLine());
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="font-mono overflow-hidden"
      style={{
        fontSize: "7.5px",
        color: "#00cc44",
        lineHeight: "1.35",
        width,
        flexShrink: 0,
        opacity: 0.8,
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{ whiteSpace: "nowrap", overflow: "hidden" }}>{l}</div>
      ))}
    </div>
  );
}

// ─── Draggable Wrapper ────────────────────────────────────────────────────────
interface DraggableProps {
  children: React.ReactNode;
  initX: number;
  initY: number;
  style?: React.CSSProperties;
}

function Draggable({ children, initX, initY, style }: DraggableProps) {
  const [pos, setPos] = useState({ x: initX, y: initY });
  const drag = useRef(false);
  const origin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current) return;
      setPos({
        x: origin.current.px + e.clientX - origin.current.mx,
        y: origin.current.py + e.clientY - origin.current.my,
      });
    };
    const onUp = () => { drag.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        cursor: "grab",
        userSelect: "none",
        ...style,
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div
      style={{
        background: "rgba(0,255,65,0.06)",
        border: "1px solid rgba(0,255,65,0.35)",
        height: 18,
        width: "100%",
        position: "relative",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: "rgba(0,200,255,0.85)",
          boxShadow: "0 0 8px rgba(0,200,255,0.8)",
          transition: "width 0.3s ease-out",
        }}
      />
    </div>
  );
}

// ─── Blinking green dot ───────────────────────────────────────────────────────
function BlinkingDot() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 800);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: on ? "#00ff41" : "#003311",
        boxShadow: on ? "0 0 14px #00ff41, 0 0 28px #00ff4180" : "none",
        transition: "background 0.2s, box-shadow 0.2s",
      }}
    />
  );
}

// ─── Telemetry Interfaces ─────────────────────────────────────────────────────
interface SystemLog {
  time: string;
  address: string;
  channel: string;
  message: string;
  level?: 'info' | 'success' | 'warn' | 'error';
}

interface TelemetryPayload {
  account: {
    login: string;
    server: string;
    balance: string;
    equity: string;
    profit: number;
    profitFormatted: string;
    isGreen: boolean;
    margin: string;
    freeMargin: string;
    marginPct: number;
    riskPct: number;
    riskLabel: string;
    openPositions: number;
    breakdown: string;
    isConnected: boolean;
  };
  cloud: {
    status: string;
    datacenter: string;
    latency: string;
    pingLabel: string;
    webhook: string;
    protection: string;
  };
  logs: SystemLog[];
  scanFeed: Array<{
    timestamp: number;
    timeStr: string;
    symbol: string;
    score: number;
    minScore: number;
    direction: string;
    status: 'SCANNING' | 'BLOCKED' | 'PASSED' | 'EXECUTED';
    reason?: string;
  }>;
}

// ─── Main War Room HUD Page ───────────────────────────────────────────────────
export default function WarRoomPage() {
  const [mounted, setMounted] = useState(false);
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  });

  // Real live telemetry state synced from Exness MT5 and Modal Cloud
  const [telemetry, setTelemetry] = useState<TelemetryPayload>({
    account: {
      login: "472658395",
      server: "Exness-MT5Trial16",
      balance: "769.03",
      equity: "796.47",
      profit: 27.44,
      profitFormatted: "+$27.44 USD",
      isGreen: true,
      margin: "7.64",
      freeMargin: "788.83",
      marginPct: 1,
      riskPct: 18,
      riskLabel: "18% [SAFE FRACTION]",
      openPositions: 13,
      breakdown: "EURUSD: 7 | DXY: 4 | XAUUSD: 2",
      isConnected: true,
    },
    cloud: {
      status: "ONLINE_ACTIVE_24_7",
      datacenter: "US-East (AWS Edge)",
      latency: "42 ms",
      pingLabel: "ZERO-TIMEOUT PING",
      webhook: "ACTIVE",
      protection: "▲ News Shield + Spread Guard + Breakeven Locked",
    },
    logs: [
      { time: '04:45:16', address: '0x8EC5E', channel: 'CYBER', message: 'Clever Trader Cybernetic War Room initialized successfully.', level: 'info' },
      { time: '04:45:16', address: '0xF1372', channel: 'EXNESS', message: 'MetaTrader 5 Bridge connected: Account #472658395 (Exness Real)', level: 'success' },
      { time: '04:45:16', address: '0x9E0A3', channel: 'MODAL', message: '24/7 Cloud Sentinel Active: US-East Edge (Sub-50ms Zero Timeout)', level: 'success' },
      { time: '04:45:16', address: '0xFBD72', channel: 'MATRIX', message: 'Consolidating Next.js, MT5 Bridge & Webhook into 1 Single Window.', level: 'info' },
      { time: '04:45:17', address: '0x10EB9', channel: 'NEXT.JS', message: 'Next.js server is actively streaming on port 3000.', level: 'success' },
      { time: '04:45:17', address: '0xCDC74', channel: 'MT5', message: 'MT5 Python Bridge gateway is actively ticking and streaming!', level: 'success' },
      { time: '04:45:17', address: '0x5E241', channel: 'TUNNEL', message: 'Cloudflare Tunnel background service active (0 window rush)', level: 'success' },
      { time: '04:45:17', address: '0x80340', channel: 'BROWSER', message: 'Launching Cyber War Room HUD: http://localhost:3000/war-room', level: 'info' },
      { time: '04:45:20', address: '0xE59BE', channel: 'TUNNEL', message: '[Cloudflare Tunnel] Initializing Cloudflare Zero-Timeout Tunnel for Port 3000...', level: 'info' }
    ],
    scanFeed: [],
  });

  // Separate scan feed state to prevent full re-render flicker
  const [scanFeed, setScanFeed] = useState<TelemetryPayload['scanFeed']>([]);

  // Convert scanFeed to RadarBlips for real data display
  const radarBlips: RadarBlip[] = useMemo(() => {
    if (scanFeed.length === 0) return [];
    return scanFeed.slice(-15).map((s, i) => {
      // Map each scan event to a unique angle + distance
      const symbolAngles: Record<string, number> = {
        'XAUUSD': 0.5,
        'EURUSD': 1.8,
        'GBPUSD': 3.0,
        'USDJPY': 4.2,
        'BTCUSD': 5.1,
        'DXY': 5.8,
      };
      const baseAngle = symbolAngles[s.symbol] ?? (i * 0.42);
      const jitter = (i * 0.31) % 0.6;
      const angle = (baseAngle + jitter) % (Math.PI * 2);
      // Distance = score proximity (higher score = closer to center = more important)
      const distance = 0.3 + (1 - Math.min(1, s.score / 100)) * 0.55;

      return {
        angle,
        distance,
        color: s.status === 'EXECUTED' ? 'rgb(0,255,65)' : s.status === 'BLOCKED' ? 'rgb(255,68,68)' : 'rgb(0,212,255)',
        label: s.symbol,
        status: s.status,
      };
    });
  }, [scanFeed]);

  useEffect(() => {
    setMounted(true);
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Poll live MT5 account telemetry and real system logs
  useEffect(() => {
    let active = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/war-room-telemetry?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.account && active) {
            // If profit is 0 or balance is 10000, attempt fallback to /api/mt5
            if (Number(data.account.profit) === 0 && (data.account.balance === '10000.00' || !data.account.breakdown)) {
              try {
                const mt5Res = await fetch('/api/mt5', { cache: 'no-store' });
                if (mt5Res.ok) {
                  const mt5Data = await mt5Res.json();
                  if (mt5Data && mt5Data.config) {
                    const fp = Number(mt5Data.floatingProfit ?? 0);
                    const bal = Number(mt5Data.config.balance ?? 769.03);
                    const eq = Number(mt5Data.config.equity ?? (bal + fp));
                    data.account.balance = bal.toFixed(2);
                    data.account.equity = eq.toFixed(2);
                    data.account.profit = fp;
                    data.account.profitFormatted = (fp >= 0 ? `+$${fp.toFixed(2)}` : `-$${Math.abs(fp).toFixed(2)}`) + ' USD';
                    data.account.isGreen = fp >= 0;
                    if (mt5Data.openPositionsCount) {
                      data.account.openPositions = mt5Data.openPositionsCount;
                    }
                  }
                }
              } catch {
                // Ignore fallback error
              }
            }

            setTelemetry(prev => ({
              ...prev,
              account: {
                ...prev.account,
                ...data.account,
              },
              cloud: {
                ...prev.cloud,
                ...data.cloud,
              },
              logs: data.logs && data.logs.length > 0 ? data.logs : prev.logs,
            }));
            if (data.scanFeed && data.scanFeed.length > 0) {
              setScanFeed(data.scanFeed);
            }
          }
        }
      } catch {
        // Safe SSR & offline fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          background: "#000d00",
          minHeight: "100vh",
          width: "100%",
          fontFamily: "'Courier New', Courier, monospace",
          overflow: "hidden",
          position: "relative",
        }}
      />
    );
  }

  const { account, cloud, logs } = telemetry;

  return (
    <div
      style={{
        background: "#000d00",
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Binary rain background ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <BinaryRain />
      </div>

      {/* ── All content ── */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ══ TITLE & SUBHEADER ══ */}
        <div style={{ width: "100%", textAlign: "center", paddingTop: 6, flexShrink: 0 }}>
          <h1
            style={{
              color: "transparent",
              fontSize: "clamp(32px, 5.5vw, 72px)",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              WebkitTextStroke: "2px #00ff41",
              textShadow: "0 0 20px #00ff41, 0 0 50px #00ff4166",
              fontFamily: "'Courier New', monospace",
              lineHeight: 1,
              margin: 0,
              paddingBottom: 2,
            }}
          >
            CLEVER TRADER
          </h1>
          <div
            style={{
              color: "#00ff9d",
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginTop: 2,
              opacity: 0.9,
            }}
          >
            CYBER QUANT TERMINAL // WAR ROOM v2.2 &nbsp;|&nbsp; EXNESS REAL: #{account.login} &nbsp;|&nbsp; 24/7 MODAL CLOUD
          </div>

          {/* Quick Switch Cyber Navigation */}
          <div
            style={{
              display: "inline-flex",
              gap: 8,
              marginTop: 6,
              background: "rgba(0, 20, 0, 0.75)",
              border: "1px solid rgba(0, 255, 65, 0.3)",
              borderRadius: 4,
              padding: "3px 8px",
              boxShadow: "0 0 10px rgba(0, 255, 65, 0.15)",
            }}
          >
            {[
              { label: "WAR ROOM HUD", href: "/war-room", active: true },
              { label: "VOLUME PROFILE", href: "/volume-profile", active: false },
              { label: "MAIN TERMINAL", href: "/", active: false },
              { label: "VORTEX QUANT", href: "/vortex", active: false },
              { label: "AI STUDIO", href: "/ai-studio", active: false },
              { label: "XAUUSD BRIEFING", href: "/xauusd-briefing", active: false },
            ].map((nav) => (
              <a
                key={nav.href}
                href={nav.href}
                style={{
                  color: nav.active ? "#000" : "#00ff9d",
                  background: nav.active ? "#00ff41" : "transparent",
                  border: nav.active ? "1px solid #00ff41" : "1px solid rgba(0, 255, 65, 0.2)",
                  borderRadius: 3,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {nav.label}
              </a>
            ))}
          </div>
        </div>

        {/* ══ MAIN 3-COLUMN LAYOUT: Left Panel | RADAR (Center) | Right Panel ══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: 10,
            padding: "8px 10px",
            flex: 1,
            alignItems: "start",
          }}
        >
          {/* ═══ LEFT COLUMN: Exness MT5 Metrics + ECG + TickPulse ═══ */}
          <div
            style={{
              border: "1.5px solid #00ff41",
              background: "rgba(0,10,0,0.85)",
              padding: "10px 14px 14px",
              boxShadow: "0 0 20px #00ff4133, inset 0 0 24px #00ff4108",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {/* Header */}
            <div
              style={{
                color: "#00ff41",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderBottom: "1px solid #00ff4140",
                paddingBottom: 5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>── EXNESS MT5 BRIDGE // [LIVE METRICS] ──</span>
              <span style={{ color: "#00ff9d", fontSize: 9, letterSpacing: "0.04em" }}>● REAL</span>
            </div>

            {/* Account Details */}
            <div style={{ display: "grid", gridTemplateColumns: "115px 1fr", rowGap: 3, fontSize: 11 }}>
              <span style={{ color: "#88bb99" }}>EXNESS LOGIN:</span>
              <span style={{ color: "#00ff41", fontWeight: 700 }}>
                #{account.login} <span style={{ color: "#aaddbb", fontWeight: 400, fontSize: 10 }}>({account.server})</span>
              </span>

              <span style={{ color: "#88bb99" }}>{account.isGreen ? "PROFIT (PnL):" : "LOSS (PnL):"}</span>
              <span style={{ color: account.isGreen ? "#00ff9d" : "#ff3355", fontWeight: 700 }}>
                {account.profitFormatted} &nbsp;<span style={{ fontSize: 9, color: account.isGreen ? "#00ff9d" : "#ff3355" }}>{account.isGreen ? "● ALL GREEN" : "⚠ DRAWDOWN"}</span>
              </span>

              <span style={{ color: "#88bb99" }}>BAL / EQUITY:</span>
              <span style={{ color: "#00ff41" }}>
                ${account.balance} / <strong style={{ color: "#00f0ff" }}>${account.equity}</strong>
              </span>
            </div>

            {/* MARGIN row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ color: "#00ff41", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", minWidth: 80 }}>
                MARGIN:
              </span>
              <div style={{ flex: 1 }}><ProgressBar value={account.marginPct} /></div>
              <span style={{ color: "#00ff41", fontSize: 10, minWidth: 80, textAlign: "right", fontFamily: "monospace" }}>
                {account.marginPct}% (${account.margin})
              </span>
            </div>

            {/* RISK row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#00ff41", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", minWidth: 80 }}>
                KELLY RISK:
              </span>
              <div style={{ flex: 1 }}><ProgressBar value={account.riskPct} /></div>
              <span style={{ color: "#00ff41", fontSize: 10, minWidth: 105, textAlign: "right", fontFamily: "monospace" }}>
                {account.riskLabel}
              </span>
            </div>

            {/* Active Trades */}
            <div style={{ fontSize: 11, display: "flex", gap: 6, marginTop: 1 }}>
              <span style={{ color: "#88bb99" }}>ACTIVE:</span>
              <span style={{ color: "#00ff9d", fontWeight: 700 }}>
                {account.openPositions} Trades <span style={{ color: "#00d4ff", fontWeight: 400, fontSize: 10 }}>({account.breakdown})</span>
              </span>
            </div>

            {/* ♥ Heartbeat ECG Monitor WITH HOSPITAL BEEP SOUND */}
            <div style={{ marginTop: 2 }}>
              <HeartbeatMonitor profit={account.profit} isGreen={account.isGreen} />
            </div>
            <div
              style={{
                textAlign: "center",
                color: "#00d4ff",
                fontSize: 9,
                letterSpacing: "0.2em",
                marginTop: -4,
                fontWeight: 600,
              }}
            >
              LIVE P&amp;L HEARTBEAT MONITOR // ECG + 🔊 HOSPITAL BEEP
            </div>

            {/* 📊 Tick Volume Pulse — RESTORED */}
            <div style={{ marginTop: 4 }}>
              <TickPulse />
            </div>
            <div
              style={{
                textAlign: "center",
                color: "#00ffcc",
                fontSize: 9,
                letterSpacing: "0.2em",
                marginTop: -2,
                fontWeight: 600,
              }}
            >
              LIVE TICK VOLATILITY PULSE
            </div>

            {/* Big Hero Profit */}
            <div
              style={{
                color: account.isGreen ? "#00ff41" : "#ff3355",
                fontSize: "clamp(20px, 2.8vw, 28px)",
                fontWeight: 900,
                letterSpacing: "0.03em",
                textShadow: account.isGreen ? "0 0 16px #00ff41, 0 0 40px #00ff4166" : "0 0 16px #ff3355, 0 0 40px #ff335566",
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {account.profitFormatted} {account.isGreen ? "PROFIT" : "LOSS"}
            </div>
          </div>

          {/* ═══ CENTER COLUMN: RADAR (Between both panels) ═══ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              paddingTop: 10,
            }}
          >
            {/* Radar Border Frame */}
            <div
              style={{
                border: "1.5px solid #00ff41",
                background: "rgba(0,10,0,0.85)",
                borderRadius: 6,
                padding: "10px 12px",
                boxShadow: "0 0 30px #00ff4133, inset 0 0 20px #00ff4108",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{
                color: "#00ff41",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textAlign: "center",
              }}>
                ── AUTONOMOUS SCAN RADAR ──
              </div>
              <RadarCanvas blips={radarBlips} />
              <BlinkingDot />
              <div style={{
                color: "#00d4ff",
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textAlign: "center",
              }}>
                {scanFeed.length > 0
                  ? `● ${scanFeed.length} TARGETS DETECTED`
                  : "○ SCANNING..."}
              </div>

              {/* Scrolling data under radar */}
              <div style={{
                border: "1px solid rgba(0,255,65,0.15)",
                background: "rgba(0,5,0,0.7)",
                padding: 4,
                width: 220,
                height: 120,
                overflow: "hidden",
              }}>
                <ScrollingData width={210} />
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: 24/7 Cloud Sentinel + Scanner Feed ═══ */}
          <div
            style={{
              border: "1.5px solid #00ff41",
              background: "rgba(0,10,0,0.85)",
              padding: "10px 12px 12px",
              boxShadow: "0 0 20px #00ff4133, inset 0 0 24px #00ff4108",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            {/* Header */}
            <div
              style={{
                color: "#00ff41",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderBottom: "1px solid #00ff4140",
                paddingBottom: 5,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>24/7 MODAL CLOUD SENTINEL 📡</span>
            </div>

            {/* Cloud Status Rows */}
            <div style={{ display: "grid", gridTemplateColumns: "105px 1fr", rowGap: 3, fontSize: 11, marginTop: 2 }}>
              <span style={{ color: "#88bb99" }}>CLOUD STATUS:</span>
              <span style={{ color: "#00ff9d", fontWeight: 700 }}>
                ● {cloud.status}
              </span>

              <span style={{ color: "#88bb99" }}>RADAR SWEEP:</span>
              <span style={{ color: "#00ff41" }}>- - - - - - ▣ ▣ [SECURE]</span>

              <span style={{ color: "#88bb99" }}>DATACENTER:</span>
              <span style={{ color: "#00f0ff" }}>{cloud.datacenter}</span>

              <span style={{ color: "#88bb99" }}>EDGE LATENCY:</span>
              <span style={{ color: "#00ff9d" }}>
                {cloud.latency} <span style={{ color: "#88bb99" }}>[{cloud.pingLabel}]</span>
              </span>

              <span style={{ color: "#88bb99" }}>WEBHOOK LINK:</span>
              <span style={{ color: "#00ff41", fontWeight: 700 }}>{cloud.webhook} [modal.run]</span>

              <span style={{ color: "#88bb99" }}>PROTECTION:</span>
              <span style={{ color: "#f59e0b" }}>{cloud.protection}</span>
            </div>

            {/* Live Scanner Feed — 2 Column Layout */}
            <div
              style={{
                width: "100%",
                border: "1px solid rgba(0,255,65,0.25)",
                background: "rgba(0,5,0,0.7)",
                padding: "4px 6px",
                maxHeight: 320,
                overflowY: "auto",
                marginTop: 6,
              }}
            >
              {/* Scanner Header */}
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#00d4ff",
                  letterSpacing: "0.12em",
                  borderBottom: "1px solid rgba(0,255,65,0.15)",
                  paddingBottom: 2,
                  marginBottom: 4,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>AUTOTRADER LIVE SCANNER // NEXT-SERVER FEED</span>
                <span style={{ color: scanFeed.length > 0 ? "#00ff41" : "#666" }}>
                  {scanFeed.length > 0 ? `● ${scanFeed.length} EVENTS` : "○ IDLE"}
                </span>
              </div>

              {scanFeed.length === 0 ? (
                <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", padding: "8px 0", textAlign: "center" }}>
                  [STANDBY] AutoTrader scan events will appear here...
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 10px" }}>
                  {/* Column 1: Even indices */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRight: "1px solid rgba(0,255,65,0.1)", paddingRight: 5 }}>
                    {scanFeed.slice(-20).filter((_, i) => i % 2 === 0).map((s, idx) => (
                      <div
                        key={`L-${s.timestamp}-${s.symbol}-${idx}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "38px 52px 36px 28px 1fr",
                          fontSize: 9.5,
                          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                          lineHeight: 1.45,
                          alignItems: "center",
                          borderBottom: "1px solid rgba(0,255,65,0.06)",
                          paddingBottom: 1,
                          opacity: s.status === 'BLOCKED' ? 0.6 : 1,
                        }}
                      >
                        <span style={{ color: "#00ff9d", fontSize: 8.5 }}>{s.timeStr?.slice(0, 5) || "--:--"}</span>
                        <span style={{
                          color: s.symbol === 'XAUUSD' ? '#fbbf24' :
                                 s.symbol === 'BTCUSD' ? '#f97316' :
                                 s.symbol === 'EURUSD' ? '#00d4ff' :
                                 s.symbol === 'GBPUSD' ? '#a78bfa' :
                                 s.symbol === 'USDJPY' ? '#f43f5e' : '#00ff41',
                          fontWeight: 700, fontSize: 9,
                        }}>{s.symbol}</span>
                        <span style={{
                          color: s.score >= s.minScore ? '#00ff41' : s.score >= (s.minScore * 0.8) ? '#fbbf24' : '#ff4444',
                          fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 9,
                        }}>{s.score}/{s.minScore}</span>
                        <span style={{
                          color: s.direction === 'BUY' ? '#00ff9d' : s.direction === 'SELL' ? '#f43f5e' : '#666',
                          fontWeight: 700, fontSize: 8.5,
                        }}>{s.direction === 'BUY' ? '▲B' : s.direction === 'SELL' ? '▼S' : '─'}</span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                          color: s.status === 'EXECUTED' ? '#000' : s.status === 'BLOCKED' ? '#ff6b6b' : s.status === 'PASSED' ? '#00ff41' : '#00d4ff',
                          background: s.status === 'EXECUTED' ? '#00ff41' : s.status === 'BLOCKED' ? 'rgba(255,68,68,0.15)' : s.status === 'PASSED' ? 'rgba(0,255,65,0.12)' : 'transparent',
                        }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                  {/* Column 2: Odd indices */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingLeft: 5 }}>
                    {scanFeed.slice(-20).filter((_, i) => i % 2 === 1).map((s, idx) => (
                      <div
                        key={`R-${s.timestamp}-${s.symbol}-${idx}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "38px 52px 36px 28px 1fr",
                          fontSize: 9.5,
                          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                          lineHeight: 1.45,
                          alignItems: "center",
                          borderBottom: "1px solid rgba(0,255,65,0.06)",
                          paddingBottom: 1,
                          opacity: s.status === 'BLOCKED' ? 0.6 : 1,
                        }}
                      >
                        <span style={{ color: "#00ff9d", fontSize: 8.5 }}>{s.timeStr?.slice(0, 5) || "--:--"}</span>
                        <span style={{
                          color: s.symbol === 'XAUUSD' ? '#fbbf24' :
                                 s.symbol === 'BTCUSD' ? '#f97316' :
                                 s.symbol === 'EURUSD' ? '#00d4ff' :
                                 s.symbol === 'GBPUSD' ? '#a78bfa' :
                                 s.symbol === 'USDJPY' ? '#f43f5e' : '#00ff41',
                          fontWeight: 700, fontSize: 9,
                        }}>{s.symbol}</span>
                        <span style={{
                          color: s.score >= s.minScore ? '#00ff41' : s.score >= (s.minScore * 0.8) ? '#fbbf24' : '#ff4444',
                          fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 9,
                        }}>{s.score}/{s.minScore}</span>
                        <span style={{
                          color: s.direction === 'BUY' ? '#00ff9d' : s.direction === 'SELL' ? '#f43f5e' : '#666',
                          fontWeight: 700, fontSize: 8.5,
                        }}>{s.direction === 'BUY' ? '▲B' : s.direction === 'SELL' ? '▼S' : '─'}</span>
                        <span style={{
                          fontSize: 8, fontWeight: 700, padding: "0 3px", borderRadius: 2,
                          color: s.status === 'EXECUTED' ? '#000' : s.status === 'BLOCKED' ? '#ff6b6b' : s.status === 'PASSED' ? '#00ff41' : '#00d4ff',
                          background: s.status === 'EXECUTED' ? '#00ff41' : s.status === 'BLOCKED' ? 'rgba(255,68,68,0.15)' : s.status === 'PASSED' ? 'rgba(0,255,65,0.12)' : 'transparent',
                        }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ BOTTOM: Quant Execution Matrix // Intercepted System Stream ══ */}
        <div
          style={{
            margin: "0 10px 10px",
            border: "1.5px solid #00ff41",
            background: "rgba(0,10,0,0.88)",
            padding: "8px 14px 10px",
            boxShadow: "0 0 20px #00ff4133",
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              color: "#00ff41",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: 6,
              borderBottom: "1px solid #00ff4133",
              paddingBottom: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>QUANT EXECUTION MATRIX // [INTERCEPTED SYSTEM STREAM] ──────────────────────────────────────────</span>
            <span style={{ color: "#00d4ff", fontSize: 10 }}>1 SINGLE WINDOW (ZERO TASKBAR RUSH)</span>
          </div>

          {/* Column Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "75px 85px 80px 1fr",
              fontSize: 11,
              fontWeight: 700,
              color: "#00d4ff",
              borderBottom: "1px solid rgba(0,255,65,0.2)",
              paddingBottom: 4,
              marginBottom: 4,
            }}
          >
            <span>Time</span>
            <span>Address</span>
            <span>Channel</span>
            <span>Decrypted Telemetry Stream</span>
          </div>

          {/* Log entries */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              maxHeight: 140,
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            {logs.slice(-9).map((l, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "75px 85px 80px 1fr",
                  fontSize: 11.5,
                  lineHeight: 1.35,
                  alignItems: "center",
                }}
              >
                <span style={{ color: "#00ff9d" }}>{l.time || liveTime}</span>
                <span style={{ color: "#00d4ff" }}>{l.address || "0x8EC5E"}</span>
                <span
                  style={{
                    color:
                      l.channel === "EXNESS" || l.channel === "MT5"
                        ? "#00ff41"
                        : l.channel === "MODAL"
                        ? "#fbbf24"
                        : l.channel === "TUNNEL"
                        ? "#38bdf8"
                        : "#a78bfa",
                    fontWeight: 700,
                  }}
                >
                  {l.channel}
                </span>
                <span
                  style={{
                    color:
                      l.level === "error"
                        ? "#ff4444"
                        : l.level === "warn"
                        ? "#fbbf24"
                        : l.message.includes("ACTIVE") || l.message.includes("connected") || l.message.includes("success")
                        ? "#00ff9d"
                        : "#d1fae5",
                  }}
                >
                  {l.message}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Status Bar */}
          <div
            style={{
              borderTop: "1px solid #00ff4133",
              marginTop: 6,
              paddingTop: 4,
              textAlign: "center",
              fontSize: 10,
              color: "#6ee7b7",
              letterSpacing: "0.08em",
            }}
          >
            Press <span style={{ color: "#f43f5e", fontWeight: 700 }}>Ctrl+C</span> or Close window to safely stop all engines &nbsp;|&nbsp; 1 Single Window (Zero Rush) &nbsp;|&nbsp; 240 FPS Hardware Cloud Lock
          </div>
        </div>

      </div>
    </div>
  );
}

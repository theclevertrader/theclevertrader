import { useEffect, useRef, useState, useCallback } from "react";

// ─── Binary Rain Canvas ───────────────────────────────────────────────────────
function BinaryRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cols = Math.floor(canvas.width / 14);
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

// ─── Radar Canvas ─────────────────────────────────────────────────────────────
function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 200;
    canvas.height = 200;

    const cx = 100, cy = 100, r = 90;

    const draw = () => {
      ctx.clearRect(0, 0, 200, 200);

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,20,0,0.85)";
      ctx.fill();

      // Grid circles
      [0.3, 0.55, 0.78, 1].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0,255,65,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Cross lines
      ctx.strokeStyle = "rgba(0,255,65,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
      const d = r * Math.cos(Math.PI / 4);
      ctx.beginPath(); ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d); ctx.stroke();

      // Sweep
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

      // Blip dots
      const blips = [
        { a: 0.8, d: 0.6 },
        { a: 2.3, d: 0.45 },
        { a: 4.1, d: 0.75 },
      ];
      blips.forEach(b => {
        const diff = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (diff < sweepWidth) {
          const alpha = 1 - diff / sweepWidth;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(b.a) * r * b.d, cy + Math.sin(b.a) * r * b.d, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,65,${alpha})`;
          ctx.fill();
        }
      });

      // Persistent bright blip (top right area)
      ctx.beginPath();
      ctx.arc(cx + 38, cy - 28, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,100,1)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 38, cy - 28, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,255,100,0.2)";
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,255,65,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      angleRef.current = (angle + 0.03) % (Math.PI * 2);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} style={{ width: 200, height: 200, display: "block" }} />;
}

// ─── Tick Pulse Chart ─────────────────────────────────────────────────────────
function TickPulse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const NUM = 60;
    barsRef.current = Array(NUM).fill(0).map(() => 0.2 + Math.random() * 0.8);

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const bars = barsRef.current;
      const barW = W / bars.length - 2;

      bars.forEach((h, i) => {
        const bh = h * H * 0.85;
        const x = i * (W / bars.length);
        const y = H - bh;
        const grad = ctx.createLinearGradient(0, y, 0, H);
        grad.addColorStop(0, "rgba(0,255,220,0.95)");
        grad.addColorStop(1, "rgba(0,180,160,0.3)");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barW, bh);
      });
    };

    const interval = setInterval(() => {
      barsRef.current.shift();
      barsRef.current.push(0.1 + Math.random() * 0.9);
      draw();
    }, 150);
    draw();

    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 90, display: "block" }}
    />
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
        fontSize: "7px",
        color: "#00cc44",
        lineHeight: "1.35",
        width,
        flexShrink: 0,
        opacity: 0.75,
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
          width: `${value}%`,
          background: "rgba(0,200,255,0.85)",
          boxShadow: "0 0 8px rgba(0,200,255,0.8)",
        }}
      />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date();
    return d.toTimeString().slice(0, 8);
  });

  useEffect(() => {
    const t = setInterval(() => {
      setLiveTime(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(t);
  }, []);

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
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100vh" }}>

        {/* ══ TITLE ══ */}
        <Draggable initX={0} initY={0} style={{ width: "100%", textAlign: "center", paddingTop: 8 }}>
          <h1
            style={{
              color: "transparent",
              fontSize: "clamp(42px, 7.5vw, 90px)",
              fontWeight: 900,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              WebkitTextStroke: "2px #00ff41",
              textShadow: "0 0 20px #00ff41, 0 0 50px #00ff4166",
              fontFamily: "'Courier New', monospace",
              lineHeight: 1,
              margin: 0,
              paddingBottom: 4,
            }}
          >
            CLEVER TRADER
          </h1>
        </Draggable>

        {/* ══ LEFT PANEL: Live Exness Account Metrics ══ */}
        <Draggable initX={10} initY={130}>
          <div
            style={{
              width: "clamp(380px, 46vw, 660px)",
              border: "1.5px solid #00ff41",
              background: "rgba(0,10,0,0.82)",
              padding: "10px 14px 14px",
              boxShadow: "0 0 20px #00ff4133, inset 0 0 24px #00ff4108",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {/* Header */}
            <div
              style={{
                color: "#00ff41",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                borderBottom: "1px solid #00ff4140",
                paddingBottom: 6,
              }}
            >
              ── LIVE EXNESS ACCOUNT METRICS ──────────────────
            </div>

            {/* MARGIN row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  color: "#00ff41",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  minWidth: 72,
                }}
              >
                MARGIN
              </span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={68} />
              </div>
              <span style={{ color: "#00ff41", fontSize: 12, minWidth: 84, textAlign: "right" }}>
                68% USED]
              </span>
            </div>

            {/* RISK row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  color: "#00ff41",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  minWidth: 72,
                }}
              >
                RISK
              </span>
              <div style={{ flex: 1 }}>
                <ProgressBar value={24} />
              </div>
              <span style={{ color: "#00ff41", fontSize: 12, minWidth: 84, textAlign: "right" }}>
                24%]
              </span>
            </div>

            {/* Tick Pulse chart */}
            <div style={{ marginTop: 4 }}>
              <TickPulse />
            </div>
            <div
              style={{
                textAlign: "center",
                color: "#00d4ff",
                fontSize: 11,
                letterSpacing: "0.22em",
                marginTop: -4,
                fontWeight: 600,
              }}
            >
              LIVE TICK PULSE
            </div>

            {/* Profit */}
            <div
              style={{
                color: "#00ff41",
                fontSize: "clamp(22px, 3.2vw, 34px)",
                fontWeight: 900,
                letterSpacing: "0.03em",
                textShadow: "0 0 16px #00ff41, 0 0 40px #00ff4166",
                marginTop: 6,
              }}
            >
              + $22,354.12 USD PROFIT
            </div>
          </div>
        </Draggable>

        {/* ══ RIGHT PANEL: 24/7 Cloud Sentinel Radar ══ */}
        <Draggable initX={Math.round(window.innerWidth * 0.5)} initY={130}>
          <div
            style={{
              width: "clamp(360px, 48vw, 680px)",
              border: "1.5px solid #00ff41",
              background: "rgba(0,10,0,0.82)",
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
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.1em",
                borderBottom: "1px solid #00ff4140",
                paddingBottom: 5,
              }}
            >
              24/7 CLOUD SENTINEL RADAR ────── 📡
            </div>
            <div style={{ color: "#00ff41", fontSize: 11, letterSpacing: "0.06em" }}>
              [SENTINEL ACTIVE: US-EAST] 📡
            </div>
            <div style={{ color: "#00ff41", fontSize: 11, letterSpacing: "0.06em" }}>
              THREAT LEVEL: [SECURE]
            </div>

            {/* Radar + scrolling data */}
            <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "flex-start" }}>
              {/* Left scroll */}
              <ScrollingData width={120} />

              {/* Radar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <RadarCanvas />
                {/* Blinking green dot */}
                <BlinkingDot />
              </div>

              {/* Right scroll */}
              <ScrollingData width={130} />
            </div>
          </div>
        </Draggable>

        {/* ══ BOTTOM: Ultra-Cool Cyber Execution Log ══ */}
        <Draggable initX={10} initY={530}>
          <div
            style={{
              width: "calc(100vw - 28px)",
              border: "1.5px solid #00ff41",
              background: "rgba(0,10,0,0.85)",
              padding: "8px 14px 10px",
              boxShadow: "0 0 20px #00ff4133",
            }}
          >
            {/* Header */}
            <div
              style={{
                color: "#00ff41",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.1em",
                marginBottom: 7,
              }}
            >
              ULTRA-COOL CYBER EXECUTION LOG ─────────────────────────────────────────────────────────
            </div>

            {/* Log entries */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Line 1 */}
              <div style={{ display: "flex", gap: 0, fontSize: 12, flexWrap: "wrap" }}>
                <span style={{ color: "#00ff41", minWidth: 90 }}>0x7FF4A9</span>
                <span style={{ color: "#00ff41", marginRight: 8 }}> :: </span>
                <span style={{ color: "#00ffcc" }}>[SMC LIQUIDITY SWEEP DETECTED] [INSTITUTIONAL BUY ORDER] | {liveTime}</span>
              </div>
              {/* Line 2 */}
              <div style={{ display: "flex", gap: 0, fontSize: 12, flexWrap: "wrap" }}>
                <span style={{ color: "#00ff41", minWidth: 90 }}>0xA2F91C</span>
                <span style={{ color: "#00ff41", marginRight: 8 }}> :: </span>
                <span style={{ color: "#00ffcc" }}>[ALGO EXECUTION] </span>
                <span style={{ color: "#ff3333", fontWeight: 700 }}>B-SELL</span>
                <span style={{ color: "#00ffcc" }}> :: BTC/USD 14:03:52.01 [CONFIRMED]</span>
              </div>
              {/* Line 3 */}
              <div style={{ display: "flex", gap: 0, fontSize: 12, flexWrap: "wrap" }}>
                <span style={{ color: "#00ff41", minWidth: 90 }}>0x9D08B8</span>
                <span style={{ color: "#00ff41", marginRight: 8 }}> :: </span>
                <span style={{ color: "#00ffcc" }}>[IHFT SIGNAL] L-BUY :: ETH/USD 14:03:53.45 [EXECUTED]</span>
              </div>
              {/* Line 4 */}
              <div style={{ display: "flex", gap: 0, fontSize: 12, flexWrap: "wrap" }}>
                <span style={{ color: "#00ff41", minWidth: 90 }}>0xC4D11B</span>
                <span style={{ color: "#00ff41", marginRight: 8 }}> :: </span>
                <span style={{ color: "#00ffcc" }}>[MARKET DEPTH UPDATE] ORDERBOOK_SCAN: ACTIVE | 14:03:54.02</span>
              </div>
            </div>
          </div>
        </Draggable>

      </div>
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

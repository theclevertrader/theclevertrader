import React from "react";

function buildPath(data: number[], w: number, h: number, pad = 2) {
  if (data.length < 2) return { line: "", area: "", min: 0, max: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = i * step;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return { line, area, min, max };
}

export function Sparkline({
  data,
  color,
  height = 34,
  fill = true,
  strokeWidth = 1.1,
}: {
  data: number[];
  color: string;
  height?: number;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const w = 100;
  const { line, area } = buildPath(data, w, height, 2);
  const id = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      style={{ height }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaCurve({
  data,
  color = "#1d4ed8",
  grid = true,
}: {
  data: number[];
  color?: string;
  grid?: boolean;
}) {
  const w = 300;
  const h = 100;
  const { line, area } = buildPath(data, w, h, 4);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="ac-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {grid &&
        [0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={w}
            y1={h * f}
            y2={h * f}
            stroke="var(--vortex-line, rgba(255,255,255,0.08))"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      <path d={area} fill="url(#ac-grad)" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DrawdownChart({ data }: { data: number[] }) {
  const w = 300;
  const h = 100;
  const min = Math.min(...data, -1);
  const step = w / Math.max(1, data.length - 1);
  const pts = data
    .map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(2)},${((v / min) * (h - 8) + 4).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <line x1="0" x2={w} y1="4" y2="4" stroke="var(--vortex-line-strong, rgba(255,255,255,0.15))" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={`${pts} L${w},4 L0,4 Z`} fill="rgba(244,63,94,0.12)" />
      <path d={pts} fill="none" stroke="var(--vortex-down, #f43f5e)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function DepthLadder({
  bids,
  asks,
  priceDigits,
}: {
  bids: { p: number; s: number }[];
  asks: { p: number; s: number }[];
  priceDigits?: number;
}) {
  const max = Math.max(...bids.map((b) => b.s), ...asks.map((a) => a.s), 1);
  const formatPrice = (p: number) => {
    if (priceDigits !== undefined) return p.toFixed(priceDigits);
    if (p >= 1000) return p.toFixed(2);
    if (p >= 100) return p.toFixed(2);
    if (p >= 10) return p.toFixed(3);
    return p.toFixed(5);
  };
  const Row = ({ p, s, side }: { p: number; s: number; side: "bid" | "ask" }) => (
    <div className="relative flex items-center justify-between px-1.5 py-[1.5px] text-[9.5px] tabular-nums font-mono">
      <div
        className="absolute inset-y-0 right-0 pointer-events-none"
        style={{
          width: `${Math.min(100, (s / max) * 100)}%`,
          background: side === "bid" ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.18)",
        }}
      />
      <span className={side === "bid" ? "relative text-up font-bold" : "relative text-down font-bold"}>
        {formatPrice(p)}
      </span>
      <span className="relative text-ink-soft text-[8.5px]">{s.toFixed(2)}</span>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-px">
      <div className="flex flex-col">
        {bids.slice(0, 7).map((b, i) => (
          <Row key={i} p={b.p} s={b.s} side="bid" />
        ))}
      </div>
      <div className="flex flex-col">
        {asks.slice(0, 7).map((a, i) => (
          <Row key={i} p={a.p} s={a.s} side="ask" />
        ))}
      </div>
    </div>
  );
}

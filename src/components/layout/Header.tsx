'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { useTheme } from '@/lib/theme/ThemeContext';
import { AiSentimentSpeedometer } from '../terminal/AiSentimentSpeedometer';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const Mt5ConnectionModal = dynamic(
  () => import('../trading/Mt5ConnectionModal').then((mod) => mod.Mt5ConnectionModal),
  { ssr: false }
);

const NewTradersModal = dynamic(
  () => import('./NewTradersModal').then((mod) => mod.NewTradersModal),
  { ssr: false }
);

/* ─────────────────────────── live clock (isolated memoized) ─────────────────────────── */
const HeaderClock = React.memo(function HeaderClock() {
  const [mounted, setMounted] = useState(false);
  const [t, setT] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    setT(new Date());
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = mounted && t ? fmtTime(t) : '--:--:-- --';

  return (
    <div style={{ ...BOX, minWidth: 90, padding: '0 6px', gap: 4 }} suppressHydrationWarning>
      <IClock />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }} suppressHydrationWarning>
        <span
          suppressHydrationWarning
          style={{
            color: G,
            fontWeight: 900,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em',
          }}
        >
          {timeStr}
        </span>
        <span style={{ color: '#5a8a70', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.12em' }}>
          PKT
        </span>
      </div>
    </div>
  );
});

function fmtTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes(), s = d.getSeconds();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} ${ap}`;
}

/* ─────────────────────────── toggle (from latest zip) ────────────────────────────── */
function Toggle({ on, set }: { on: boolean; set: () => void }) {
  return (
    <button
      type="button"
      onClick={set}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 32,
        height: 18,
        borderRadius: 999,
        background: on ? '#00ff9d' : '#112a1c',
        border: `1.5px solid ${on ? '#00ff9d' : '#00ff9d55'}`,
        boxShadow: on ? '0 0 8px #00ff9daa' : 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: '#000',
          transition: 'transform .25s',
          transform: on ? 'translateX(16px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

/* ─────────────────────────── icons (from latest zip) ─────────────────────────────── */
const G = '#00ff9d';
const stroke = { fill: 'none', stroke: G, strokeWidth: 1.5 } as const;

const INewTraders = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <circle cx={9} cy={7} r={4} />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <line x1={19} y1={8} x2={19} y2={14} />
    <line x1={16} y1={11} x2={22} y2={11} />
  </svg>
);

const ICharts = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IScanner = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <circle cx={11} cy={11} r={8} />
    <line x1={21} y1={21} x2={16.65} y2={16.65} />
    <line x1={8} y1={11} x2={14} y2={11} />
    <line x1={11} y1={8} x2={11} y2={14} />
  </svg>
);

const ICalendar = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
    <line x1={16} y1={2} x2={16} y2={6} />
    <line x1={8} y1={2} x2={8} y2={6} />
    <line x1={3} y1={10} x2={21} y2={10} />
  </svg>
);

const INews = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9" />
  </svg>
);

const IClock = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" {...stroke}>
    <circle cx={12} cy={12} r={10} />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ISun = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke}>
    <circle cx={12} cy={12} r={5} />
    <line x1={12} y1={1} x2={12} y2={3} />
    <line x1={12} y1={21} x2={12} y2={23} />
    <line x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
    <line x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
    <line x1={1} y1={12} x2={3} y2={12} />
    <line x1={21} y1={12} x2={23} y2={12} />
    <line x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
    <line x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
  </svg>
);

const IGear = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" {...stroke}>
    <circle cx={12} cy={12} r={3} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IShield = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" {...stroke}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ICrown = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" {...stroke}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
  </svg>
);

const IChevron = () => (
  <svg width={11} height={11} viewBox="0 0 24 24" {...stroke}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IBrain = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" {...stroke}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54z" />
  </svg>
);

const IBot = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" {...stroke}>
    <rect x={3} y={11} width={18} height={10} rx={2} />
    <circle cx={12} cy={5} r={2} />
    <path d="M12 7v4" />
    <line x1={8} y1={16} x2={8} y2={16} />
    <line x1={16} y1={16} x2={16} y2={16} />
  </svg>
);

const ICoins = () => (
  <svg width={15} height={15} viewBox="0 0 24 24" {...stroke}>
    <circle cx={8} cy={8} r={6} />
    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" />
    <path d="M16.7 13.8l.7.7" />
  </svg>
);

const IRefresh = () => (
  <svg width={10} height={10} viewBox="0 0 24 24" {...stroke}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IDblArrow = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" {...stroke}>
    <polyline points="13 17 18 12 13 7" />
    <polyline points="6 17 11 12 6 7" />
  </svg>
);

/* ─────────────────────────── reusable box style ──────────────────────────────────── */
const BOX: React.CSSProperties = {
  background: '#040d08',
  border: '1px solid #00ff9d22',
  borderRadius: 8,
  height: 40,
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  gap: 5,
  flexShrink: 0,
};

/* ─────────────────────────── dropdown (fast, GPU-accelerated) ──────────────────────────── */
function Drop({
  open,
  items,
  right = false,
  activeLabel,
}: {
  open: boolean;
  items: { label: string; action: () => void; icon?: React.ReactNode }[];
  right?: boolean;
  activeLabel?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fast-pop"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [right ? 'right' : 'left']: 0,
        border: '1.5px solid #00ff9d55',
        borderRadius: 10,
        padding: '5px',
        zIndex: 99999,
        boxShadow: '0 16px 45px rgba(0,0,0,0.95), 0 0 20px rgba(0,255,157,0.25)',
        minWidth: 155,
        backdropFilter: 'blur(12px)',
      }}
    >
      {items.map((it, idx) => {
        const isSelected = activeLabel && it.label.toLowerCase().includes(activeLabel.toLowerCase());
        return (
          <button
            key={idx}
            type="button"
            onClick={it.action}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              fontSize: 11.5,
              fontWeight: isSelected ? 800 : 600,
              color: isSelected ? '#00ff9d' : '#8af5d0',
              background: isSelected ? '#00ff9d15' : 'none',
              border: isSelected ? '1px solid #00ff9d33' : '1px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all .15s ease',
              marginBottom: idx === items.length - 1 ? 0 : 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00ff9d';
              e.currentTarget.style.background = '#00ff9d20';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = isSelected ? '#00ff9d' : '#8af5d0';
              e.currentTarget.style.background = isSelected ? '#00ff9d15' : 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {it.icon}
              <span>{it.label}</span>
            </div>
            {isSelected && (
              <span style={{ color: '#00ff9d', fontSize: 12, fontWeight: 900 }}>✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────── mini sparkline (from latest zip) ────────────────────────── */
function Spark({ up, points, width = 48, height = 18 }: { up: boolean; points: string; width?: number; height?: number }) {
  const color = up ? '#00ff9d' : '#f87171';
  return (
    <svg width={width} height={height} viewBox="0 0 80 28" style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg${up ? 1 : 0}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={points + ' 80,28 0,28'} fill={`url(#sg${up ? 1 : 0})`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ─────────────────────── ticker card (ultra-compact institutional) ───────────────────────────── */
interface TickerItem {
  sym: string;
  price: string;
  change: string;
  pct: string;
  up: boolean;
  spark: string;
  flag: React.ReactNode;
}

function TickerCard({
  item,
  isActive = false,
  onSelect,
}: {
  item: TickerItem;
  isActive?: boolean;
  onSelect?: (symbol: string) => void;
}) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<string>(item.price);
  const marketStatus = SessionFilterEngine.isMarketOpen(item.sym);
  const isOpen = marketStatus.isOpen;
  const isCrypto = item.sym.includes('BTC') || item.sym.includes('ETH');

  useEffect(() => {
    if (!isOpen) return; // Do not flash if market is closed
    if (prevPriceRef.current !== item.price) {
      setFlash(item.up ? 'up' : 'down');
      prevPriceRef.current = item.price;
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
  }, [item.price, item.up, isOpen]);

  const color = !isOpen ? '#94a3b8' : item.up ? '#00e87a' : '#f87171';
  const arrow = !isOpen ? '■' : item.up ? '▲' : '▼';

  const flashBg = flash === 'up'
    ? 'rgba(0, 255, 157, 0.16)'
    : flash === 'down'
    ? 'rgba(239, 68, 68, 0.16)'
    : 'transparent';

  return (
    <div
      onClick={() => {
        onSelect?.(item.sym);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 8px',
        minWidth: 142,
        height: 38,
        flex: '0 0 auto',
        background: isActive
          ? 'linear-gradient(180deg,#152019 0%,#09110d 100%)'
          : flash !== null
          ? flashBg
          : 'linear-gradient(180deg,#0c100e 0%,#030604 100%)',
        border: isActive
          ? '1.5px solid #00ff9d'
          : flash === 'up'
          ? '1px solid rgba(0,255,157,0.5)'
          : flash === 'down'
          ? '1px solid rgba(239,68,68,0.5)'
          : !isOpen
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 0 10px #00ff9d33' : 'none',
        borderRadius: 6,
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      title={`${item.sym} (${isOpen ? (isCrypto ? 'Crypto 24/7 Live' : 'Market Open') : 'Market Closed - Weekend'}) - Click to switch terminal`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        {/* Top: Flag + Symbol + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{item.flag}</span>
          <span style={{ color: isActive ? '#00ff9d' : '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '0.03em' }}>
            {item.sym}
          </span>
          <span
            style={{
              fontSize: 7,
              padding: '0 3px',
              borderRadius: 2.5,
              fontWeight: 800,
              letterSpacing: '0.03em',
              background: isOpen ? 'rgba(0, 255, 157, 0.12)' : 'rgba(239, 68, 68, 0.18)',
              color: isOpen ? '#00ff9d' : '#f87171',
              border: `1px solid ${isOpen ? 'rgba(0, 255, 157, 0.3)' : 'rgba(239, 68, 68, 0.35)'}`,
            }}
          >
            {isOpen ? (isCrypto ? '24/7' : 'LIVE') : 'CLOSED'}
          </span>
        </div>

        {/* Bottom: Price + Change % */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              color: !isOpen ? '#cbd5e1' : flash === 'up' ? '#00ff9d' : flash === 'down' ? '#fca5a5' : '#fff',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.01em',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'monospace, ui-monospace, sans-serif',
              transition: 'color 0.3s ease',
            }}
          >
            {item.price}
          </span>
          <span style={{ color, fontSize: 8.5, fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
            {isOpen ? `${arrow}${item.pct}` : 'CLOSED'}
          </span>
        </div>
      </div>

      {/* Right: Sparkline */}
      <Spark up={item.up} points={item.spark} width={46} height={18} />
    </div>
  );
}

function formatTickerPrice(sym: string, price?: number): string {
  if (price === undefined || isNaN(price)) {
    if (sym === 'XAUUSD') return '4,267.05';
    if (sym === 'EURUSD') return '1.14680';
    if (sym === 'GBPUSD') return '1.33830';
    if (sym === 'BTCUSD') return '76,288.00';
    if (sym === 'USOIL') return '96.40';
    if (sym === 'USDJPY') return '156.315';
    if (sym === 'NAS100') return '28,987.00';
    if (sym === 'DXY') return '100.300';
    if (sym === 'US10Y') return '5.006%';
    if (sym === 'ETHUSD') return '2,447.00';
    if (sym === 'US30') return '51,790.00';
    if (sym === 'US500' || sym === 'SPX500') return '7,641.50';
    if (sym === 'XAGUSD') return '65.42';
    return '0.00';
  }

  if (sym === 'US10Y') return `${price.toFixed(3)}%`;
  if (sym === 'BTCUSD' || sym === 'NAS100' || sym === 'US30' || sym === 'US500' || sym === 'SPX500') {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (sym === 'XAUUSD' || sym === 'ETHUSD' || sym === 'USOIL' || sym === 'XAGUSD') {
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (sym === 'USDJPY' || sym === 'DXY' || sym === 'EURJPY' || sym === 'GBPJPY') {
    return price.toFixed(3);
  }
  return price.toFixed(5);
}

function formatChange(sym: string, tick?: any): { change: string; pct: string; up: boolean } {
  if (!tick) {
    return { change: '+0.00', pct: '+0.00%', up: true };
  }

  const changePct = tick.changePct !== undefined ? tick.changePct : (typeof tick.change === 'number' ? tick.change : 0);
  const isUp = changePct >= 0;
  const sign = isUp ? '+' : '';
  const pctStr = `${sign}${Number(changePct).toFixed(2)}%`;

  let changeVal = tick.change ?? 0;
  if (sym === 'US10Y') {
    return { change: `${sign}${Number(changeVal).toFixed(3)}`, pct: pctStr, up: isUp };
  }
  if (sym === 'USOIL') {
    return { change: `${sign}${Number(changeVal).toFixed(2)}`, pct: pctStr, up: isUp };
  }
  if (sym === 'EURUSD' || sym === 'GBPUSD' || sym === 'AUDUSD' || sym === 'NZDUSD' || sym === 'USDCHF' || sym === 'USDCAD') {
    return { change: `${sign}${Number(changeVal).toFixed(4)}`, pct: pctStr, up: isUp };
  }
  return { change: `${sign}${Number(changeVal).toFixed(2)}`, pct: pctStr, up: isUp };
}

/* ─────────────────────── ticker bar (from latest zip) ────────────────────────────── */
function TickerBar({
  ticks,
  activeSymbol = 'XAUUSD',
  onSelectSymbol,
}: {
  ticks?: Record<string, any>;
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}) {
  const xauTick = ticks?.['XAUUSD'];
  const eurTick = ticks?.['EURUSD'];
  const gbpTick = ticks?.['GBPUSD'];
  const btcTick = ticks?.['BTCUSD'];
  const usoilTick = ticks?.['USOIL'];
  const usdjpyTick = ticks?.['USDJPY'];
  const nasTick = ticks?.['NAS100'] || ticks?.['USTEC'];
  const dxyTick = ticks?.['DXY'];
  const us10yTick = ticks?.['US10Y'];
  const ethTick = ticks?.['ETHUSD'];
  const us30Tick = ticks?.['US30'];
  const us500Tick = ticks?.['US500'] || ticks?.['SPX500'];
  const xagTick = ticks?.['XAGUSD'];

  const SYMBOLS = [
    { sym: 'XAUUSD', flag: '🪙', tick: xauTick, defaultSpark: '0,22 10,18 20,20 30,14 40,16 50,10 60,13 70,7 80,5' },
    { sym: 'EURUSD', flag: '🇪🇺', tick: eurTick, defaultSpark: '0,20 10,19 20,17 30,18 40,14 50,13 60,11 70,9 80,8' },
    { sym: 'GBPUSD', flag: '🇬🇧', tick: gbpTick, defaultSpark: '0,21 10,19 20,18 30,15 40,16 50,12 60,10 70,8 80,6' },
    { sym: 'BTCUSD', flag: '₿', tick: btcTick, defaultSpark: '0,24 10,20 20,18 30,14 40,12 50,10 60,7 70,5 80,2' },
    { sym: 'USOIL', flag: '🛢️', tick: usoilTick, defaultSpark: '0,18 10,16 20,15 30,17 40,14 50,12 60,10 70,8 80,6' },
    { sym: 'USDJPY', flag: '🇯🇵', tick: usdjpyTick, defaultSpark: '0,18 10,16 20,17 30,13 40,15 50,11 60,9 70,8 80,4' },
    { sym: 'NAS100', flag: '📊', tick: nasTick, defaultSpark: '0,20 10,18 20,15 30,16 40,12 50,9 60,11 70,6 80,3' },
    { sym: 'DXY', flag: '💲', tick: dxyTick, defaultSpark: '0,6 10,8 20,10 30,12 40,13 50,16 60,18 70,21 80,24' },
    { sym: 'US10Y', flag: '🇺🇸', tick: us10yTick, defaultSpark: '0,5 10,7 20,9 30,11 40,14 50,16 60,19 70,22 80,25' },
    { sym: 'ETHUSD', flag: '⟠', tick: ethTick, defaultSpark: '0,22 10,19 20,16 30,18 40,13 50,11 60,9 70,7 80,4' },
    { sym: 'US30', flag: '🏛️', tick: us30Tick, defaultSpark: '0,19 10,17 20,18 30,14 40,15 50,11 60,8 70,6 80,4' },
    { sym: 'US500', flag: '📈', tick: us500Tick, defaultSpark: '0,18 10,16 20,17 30,13 40,15 50,10 60,9 70,6 80,3' },
    { sym: 'XAGUSD', flag: '⚪', tick: xagTick, defaultSpark: '0,21 10,18 20,19 30,14 40,16 50,12 60,10 70,7 80,5' },
  ];

  const items: TickerItem[] = SYMBOLS.map(({ sym, flag, tick, defaultSpark }) => {
    const { change, pct, up } = formatChange(sym, tick);
    return {
      sym,
      price: formatTickerPrice(sym, tick?.price),
      change,
      pct,
      up,
      flag,
      spark: tick?.spark || defaultSpark,
    };
  });

  return (
    <div
      style={{
        width: '100%',
        background: '#020302',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '3px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        boxSizing: 'border-box',
        flexShrink: 0,
        height: 44,
      }}
      className="scrollbar-none"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {items.map((item) => (
          <TickerCard
            key={item.sym}
            item={item}
            isActive={activeSymbol === item.sym}
            onSelect={onSelectSymbol}
          />
        ))}
      </div>
    </div>
  );
}

interface HeaderProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenJarvis?: () => void;
  onToggleDesktopSidebar?: () => void;
  isDesktopSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeSymbol,
  onSelectSymbol,
  onOpenCommandPalette,
  onToggleMobileSidebar,
  onOpenJarvis,
  onToggleDesktopSidebar,
  isDesktopSidebarCollapsed = false,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [bot, setBot] = useState(true);
  const [tOpen, setTO] = useState(false);
  const [uOpen, setUO] = useState(false);
  const [pOpen, setPO] = useState(false);
  const [lotOpen, setLotOpen] = useState(false);
  const [lotSize, setLotSize] = useState(0.01);
  const [customLot, setCustomLot] = useState('0.01');
  const lotPresets = [0.01, 0.02, 0.05, 0.10, 0.50, 1.00];

  const [isMt5ModalOpen, setIsMt5ModalOpen] = useState(false);
  const [isNewTradersModalOpen, setIsNewTradersModalOpen] = useState(false);
  const { isMt5Connected, ticks } = useMarketData();
  const { theme, setTheme } = useTheme();

  // Collapsible Ticker Bar state with localStorage persistence
  const [showTickerBar, setShowTickerBar] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('clever_trader_show_ticker_bar');
      if (saved !== null) {
        setShowTickerBar(saved === 'true');
      }
    } catch {}
  }, []);

  const handleToggleTickerBar = () => {
    setShowTickerBar((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('clever_trader_show_ticker_bar', String(next));
      } catch {}
      return next;
    });
  };

  // Close dropdowns on outside click (robust check)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-dropdown="theme"]')) setTO(false);
      if (!target.closest('[data-dropdown="user"]')) setUO(false);
      if (!target.closest('[data-dropdown="plans"]')) setPO(false);
      if (!target.closest('[data-dropdown="lot"]')) setLotOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll auto trader
  useEffect(() => {
    fetch('/api/auto-trade')
      .then((r) => r.json())
      .then((data) => {
        if (data.config?.isActive !== undefined) setBot(data.config.isActive);
        if (data.config?.lotSize) {
          setLotSize(data.config.lotSize);
          setCustomLot(String(data.config.lotSize));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleBot = async () => {
    const n = !bot;
    setBot(n);
    try {
      const res = await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', isActive: n }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isActive !== undefined) setBot(data.isActive);
      }
    } catch (e) {}
  };

  const handleUpdateLot = async (l: number) => {
    if (l <= 0) return;
    setLotSize(l);
    setCustomLot(String(l));
    setLotOpen(false);
    try {
      await fetch('/api/auto-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_lot_size', lotSize: l }),
      });
    } catch (e) {}
  };

  const nav = [
    { label: 'New Traders', icon: <INewTraders />, action: () => setIsNewTradersModalOpen(true) },
    { label: 'Charts', icon: <ICharts />, href: '/markets' },
    { label: 'Scanner', icon: <IScanner />, href: '/scanner' },
    { label: 'Calendar', icon: <ICalendar />, href: '/economic-calendar' },
    { label: 'News', icon: <INews />, href: '/xauusd-briefing' },
  ];

  const switchTheme = (t: 'dark' | 'light' | 'grey') => {
    setTheme(t);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, userSelect: 'none', position: 'relative', zIndex: 50 }}>
      {/* ══════════════════════════ NAVBAR (from latest zip) ══════════════════════════ */}
      <header
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '0 8px',
          height: 56,
          background: '#000000',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.85)',
          boxSizing: 'border-box',
          flexShrink: 0,
          position: 'relative',
          zIndex: 60,
          overflow: 'visible',
        }}
      >
        {/* ── SIDEBAR TOGGLE BUTTON (Desktop & Mobile) ── */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              onToggleMobileSidebar?.();
            } else {
              onToggleDesktopSidebar?.();
            }
          }}
          title={isDesktopSidebarCollapsed ? "Open Sidebar Menu [Ctrl+B or []" : "Collapse Sidebar [Ctrl+B or []"}
          style={{
            ...BOX,
            padding: '0 10px',
            gap: 6,
            cursor: 'pointer',
            background: isDesktopSidebarCollapsed ? 'rgba(0, 255, 157, 0.14)' : '#040d08',
            border: `1.5px solid ${isDesktopSidebarCollapsed ? '#00ff9d88' : '#00ff9d33'}`,
            boxShadow: isDesktopSidebarCollapsed ? '0 0 14px rgba(0,255,157,0.25)' : 'none',
            color: '#00ff9d',
            transition: 'all 0.18s ease',
          }}
        >
          {isDesktopSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#00ff9d]" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[#00ff9d]" />
          )}
          <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'monospace' }}>
            {isDesktopSidebarCollapsed ? 'OPEN MENU' : 'SIDEBAR'}
          </span>
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: 3,
              background: isDesktopSidebarCollapsed ? 'rgba(0, 255, 157, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              color: isDesktopSidebarCollapsed ? '#00ff9d' : '#888',
            }}
          >
            {isDesktopSidebarCollapsed ? '▶' : '◀'}
          </span>
        </button>

        {/* ── DESKTOP BRAND LOGO (Shown when sidebar is collapsed so logo is never lost) ── */}
        {isDesktopSidebarCollapsed && (
          <Link
            href="/"
            className="hidden lg:flex items-center gap-2 px-2.5 mr-1 flex-shrink-0 border-r border-[#00ff9d22] h-full cursor-pointer no-underline"
            title="THE CLEVER TRADER"
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(145deg,#0f2f1e,#07160e)',
                border: '1.5px solid #00ff9d55',
                boxShadow: '0 0 12px #00ff9d2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: G, fontWeight: 900, fontSize: 14, fontStyle: 'italic' }}>CT</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '0.1em' }}>
                CLEVER<span style={{ color: G }}>TRADER</span>
              </span>
              <span style={{ color: '#5a8a70', fontSize: 7.5, letterSpacing: '0.05em' }}>
                Institutional AI
              </span>
            </div>
          </Link>
        )}


        {/* ── LOGO (Mobile Only — Hidden on desktop to keep single unified logo) ── */}
        <Link
          href="/"
          className="flex lg:hidden items-center gap-2.5 pr-3 mr-1 flex-shrink-0 border-r border-[#00ff9d18] h-full cursor-pointer no-underline"
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              flexShrink: 0,
              background: 'linear-gradient(145deg,#0f2f1e,#07160e)',
              border: '1.5px solid #00ff9d55',
              boxShadow: '0 0 15px #00ff9d2a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: G, fontWeight: 900, fontSize: 16, fontStyle: 'italic' }}>CT</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '0.12em' }}>
              CLEVER<span style={{ color: G }}>TRADER</span>
            </span>
            <span style={{ color: '#5a8a70', fontSize: 8, letterSpacing: '0.05em' }}>
              Institutional AI
            </span>
          </div>
        </Link>

        {/* ── LIVE MT5 (from latest zip) ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setIsMt5ModalOpen(true)}
          style={{
            ...BOX,
            flexDirection: 'column',
            alignItems: 'flex-start',
            minWidth: 100,
            gap: 2,
            padding: '3px 8px',
            cursor: 'pointer',
          }}
          title="Click to Connect MetaTrader 5"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {/* animated conic dot */}
            <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: '#00ff9d',
                  opacity: 0.5,
                  animation: 'ping 1.4s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'conic-gradient(#ff3c3c,#ffcc00,#00ff9d,#3b9fff,#c040fb,#ff3c3c)',
                }}
              />
            </span>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 10.5, letterSpacing: '0.12em' }}>
              LIVE MT5
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#6a9a80', fontSize: 8.5 }}>Feed:</span>
            <span
              style={{
                color: isMt5Connected ? '#00ff9d' : '#f87171',
                fontWeight: 900,
                fontSize: 8.5,
                letterSpacing: '0.1em',
              }}
            >
              {isMt5Connected ? 'CONNECTED' : 'DISCONNECT'}
            </span>
            <IRefresh />
          </div>
        </button>

        {/* ── NAV ITEMS (from latest zip) ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 2px', flexShrink: 0 }}>
          {nav.map((n) => {
            const on = pathname === n.href;
            const content = (
              <>
                {n.icon}
                <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                  {n.label}
                </span>
              </>
            );

            const itemStyle: React.CSSProperties = {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '3px 6px',
              borderRadius: 7,
              cursor: 'pointer',
              color: on ? G : '#6acca0',
              background: on ? '#00ff9d13' : 'transparent',
              border: `1px solid ${on ? '#00ff9d44' : 'transparent'}`,
              boxShadow: on ? '0 0 12px #00ff9d15' : 'none',
              transition: 'all .2s',
              textDecoration: 'none',
            };

            if (n.href) {
              return (
                <Link key={n.label} href={n.href} style={itemStyle}>
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={n.label}
                type="button"
                onClick={n.action}
                style={itemStyle}
              >
                {content}
              </button>
            );
          })}
        </div>

        {/* ── CLEVER COMMAND ─────────────────────────────────────── */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 10px',
            height: 40,
            borderRadius: 9,
            flexShrink: 0,
            minWidth: 135,
            overflow: 'hidden',
            cursor: 'pointer',
            background: 'linear-gradient(135deg,#004d2e,#006840,#004d2e)',
            border: `1.5px solid ${G}`,
            boxShadow: `0 0 16px #00ff9d33, inset 0 0 16px #00ff9d0a`,
          }}
          title="Launch CLEVER COMMAND Palette (Ctrl+K)"
        >
          {/* shimmer */}
          <span
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'linear-gradient(90deg,transparent,#00ff9d25,transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
          />
          <IBrain />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 1 }}>
            <span style={{ color: G, fontWeight: 900, fontSize: 10.5, letterSpacing: '0.12em' }}>
              CLEVER COMMAND
            </span>
            <span style={{ color: '#8af5d0', fontSize: 7.5, letterSpacing: '0.08em', fontWeight: 600 }}>
              AI ASSISTANT
            </span>
          </div>
          <span style={{ marginLeft: 'auto', zIndex: 1 }}>
            <IDblArrow />
          </span>
        </button>

        {/* ── AUTO BOT (from latest zip) ───────────────────────────────────────────── */}
        <div
          onClick={handleToggleBot}
          style={{ ...BOX, gap: 6, padding: '0 8px', cursor: 'pointer', transition: 'all .2s' }}
          title="Click to toggle Autonomous AI Auto-Trader"
        >
          <IBot />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 9, letterSpacing: '0.14em' }}>
              AUTO BOT
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: bot ? G : '#555', fontWeight: 900, fontSize: 8.5, letterSpacing: '0.1em' }}>
                {bot ? 'ON' : 'OFF'}
              </span>
              <Toggle on={bot} set={handleToggleBot} />
            </div>
          </div>
        </div>

        {/* ── LOT (from latest zip) ────────────────────────────────────────────────── */}
        <div data-dropdown="lot" style={{ ...BOX, padding: '0 8px', position: 'relative', cursor: 'pointer', zIndex: lotOpen ? 70 : 1 }}>
          <div
            onClick={() => setLotOpen(prev => !prev)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ICoins />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left' }}>
              <span style={{ color: '#5a8a70', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em' }}>
                LOT
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 13 }}>{lotSize.toFixed(2)}</span>
                <span style={{ color: G }}>
                  <IChevron />
                </span>
              </div>
            </div>
          </div>

          {/* Lot Selector Dropdown */}
          {lotOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fast-pop"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 185,
                background: '#040d08',
                border: '1.5px solid #00ff9d66',
                borderRadius: 10,
                padding: '12px',
                zIndex: 99999,
                boxShadow: '0 16px 45px rgba(0,0,0,0.95), 0 0 20px rgba(0,255,157,0.25)',
              }}
            >
              <div style={{ color: '#8af5d0', fontSize: 10, fontWeight: 800, marginBottom: 6 }}>
                MODIFY LOT SIZE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
                {lotPresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleUpdateLot(p)}
                    style={{
                      padding: '4px 6px',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: lotSize === p ? '#00ff9d' : '#0e2a1c',
                      color: lotSize === p ? '#000' : '#8af5d0',
                      border: `1px solid ${lotSize === p ? '#00ff9d' : '#00ff9d33'}`,
                    }}
                  >
                    {p.toFixed(2)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={customLot}
                  onChange={(e) => setCustomLot(e.target.value)}
                  style={{
                    width: 60,
                    padding: '3px 6px',
                    borderRadius: 4,
                    background: '#000',
                    border: '1px solid #00ff9d44',
                    color: '#fff',
                    fontSize: 11,
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = parseFloat(customLot);
                    if (!isNaN(val) && val > 0) handleUpdateLot(val);
                  }}
                  style={{
                    flex: 1,
                    background: '#00ff9d',
                    color: '#000',
                    border: 'none',
                    borderRadius: 4,
                    fontWeight: 900,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CLOCK (hydration-safe isolated memo) ───────────────────────────────── */}
        <HeaderClock />

        {/* ── THEME (from latest zip) ──────────────────────────────────────────────── */}
        <div data-dropdown="theme" style={{ position: 'relative', flexShrink: 0, zIndex: tOpen ? 70 : 1 }}>
          <button
            type="button"
            onClick={() => setTO(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 7px',
              borderRadius: 8,
              cursor: 'pointer',
              color: tOpen ? G : '#6acca0',
              background: tOpen ? '#00ff9d10' : 'transparent',
              border: `1px solid ${tOpen ? '#00ff9d33' : 'transparent'}`,
            }}
            title="Click to change Theme (Dark, Grey, Light)"
          >
            <ISun />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>
              {theme === 'dark' || theme === 'grey' ? 'Black' : theme || 'Theme'}
            </span>
            <IChevron />
          </button>
          <Drop
            open={tOpen}
            activeLabel={theme}
            items={[
              { label: 'Pure Black (OLED)', action: () => { switchTheme('dark'); setTO(false); } },
              { label: 'Grey Terminal', action: () => { switchTheme('grey'); setTO(false); } },
              { label: 'Light Mode', action: () => { switchTheme('light'); setTO(false); } },
            ]}
          />
        </div>

        {/* ── SETTINGS (from latest zip) ───────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push('/settings')}
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            cursor: 'pointer',
            color: '#6acca0',
            background: 'transparent',
            border: '1px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = G;
            e.currentTarget.style.background = '#00ff9d10';
            e.currentTarget.style.border = '1px solid #00ff9d33';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6acca0';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid transparent';
          }}
          title="System Settings"
        >
          <IGear />
        </button>

        {/* ── LIVE SAFE GUARD (from latest zip) ────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => router.push('/risk')}
          style={{
            ...BOX,
            gap: 5,
            padding: '0 8px',
            cursor: 'pointer',
            border: '1px solid #00ff9d33',
            background: 'linear-gradient(145deg,#0d2a1a,#071610)',
            transition: 'all .2s',
          }}
          title="Click to manage Live Safe Guard & Risk Limits"
        >
          <IShield />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
            <span style={{ color: '#ccc', fontSize: 8.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
              Safe Guard
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: G,
                  boxShadow: `0 0 6px ${G}`,
                  animation: 'pulse 1.6s ease-in-out infinite',
                  display: 'inline-block',
                }}
              />
              <span style={{ color: G, fontWeight: 900, fontSize: 8, letterSpacing: '0.14em' }}>
                ACTIVE
              </span>
            </div>
          </div>
        </button>

        {/* ── USER (from latest zip) ───────────────────────────────────────────────── */}
        <div data-dropdown="user" style={{ position: 'relative', flexShrink: 0, zIndex: uOpen ? 70 : 1 }}>
          <button
            type="button"
            onClick={() => setUO(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 7px',
              borderRadius: 8,
              cursor: 'pointer',
              color: uOpen ? G : '#6acca0',
              background: uOpen ? '#00ff9d10' : 'transparent',
              border: `1px solid ${uOpen ? '#00ff9d33' : 'transparent'}`,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#00ff9d,#00b870)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 900,
                fontSize: 9,
                flexShrink: 0,
              }}
            >
              S
            </span>
            <span style={{ fontSize: 10, fontWeight: 600 }}>Shaheen</span>
            <IChevron />
          </button>
          <Drop
            open={uOpen}
            items={[
              { label: 'Profile', action: () => { router.push('/billing'); setUO(false); } },
              { label: 'Settings', action: () => { router.push('/settings'); setUO(false); } },
              { label: 'Journal', action: () => { router.push('/journal'); setUO(false); } },
              { label: 'Risk Rules', action: () => { router.push('/risk'); setUO(false); } },
            ]}
            right
          />
        </div>

        {/* ── PLANS (from latest zip) ──────────────────────────────────────────────── */}
        <div data-dropdown="plans" style={{ position: 'relative', flexShrink: 0, zIndex: pOpen ? 70 : 1 }}>
          <button
            type="button"
            onClick={() => setPO(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 7px',
              borderRadius: 8,
              cursor: 'pointer',
              color: pOpen ? G : '#6acca0',
              background: pOpen ? '#00ff9d10' : 'transparent',
              border: `1px solid ${pOpen ? '#00ff9d33' : 'transparent'}`,
            }}
          >
            <ICrown />
            <span style={{ fontSize: 10, fontWeight: 600 }}>Plans</span>
            <IChevron />
          </button>
          <Drop
            open={pOpen}
            items={[
              { label: 'Starter Plan', action: () => { router.push('/pricing'); setPO(false); } },
              { label: 'Professional Plan', action: () => { router.push('/pricing'); setPO(false); } },
              { label: 'Elite Plan', action: () => { router.push('/pricing'); setPO(false); } },
              { label: 'Institutional Plan', action: () => { router.push('/pricing'); setPO(false); } },
            ]}
            right
          />
        </div>

        {/* ── FLIP TICKER BAR BUTTON (Hide / Show Ticker Bar) ────────────────────────── */}
        <button
          type="button"
          onClick={handleToggleTickerBar}
          style={{
            ...BOX,
            padding: '0 8px',
            gap: 5,
            cursor: 'pointer',
            background: showTickerBar ? 'rgba(0, 255, 157, 0.08)' : 'transparent',
            border: `1px solid ${showTickerBar ? 'rgba(0, 255, 157, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: showTickerBar ? '#00ff9d' : '#888',
            transition: 'all 0.2s ease',
          }}
          title={showTickerBar ? 'Collapse Ticker Bar (Flip Up ▲)' : 'Expand Ticker Bar (Flip Down ▼)'}
        >
          <span style={{ fontSize: 9.5, fontWeight: 900 }}>{showTickerBar ? '▲' : '▼'}</span>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em' }}>
            TICKERS
          </span>
        </button>

        {/* ── AI SENTIMENT SPEEDOMETER (Cleanly inset with safe margin so it never clips) ────────────────── */}
        <div style={{ flexShrink: 0, marginLeft: 'auto', marginRight: 16 }}>
          <AiSentimentSpeedometer symbol={activeSymbol} />
        </div>
      </header>

      {/* ════════════════ MARKET TICKER BAR (COLLAPSIBLE / FLIPPABLE) ════════════════ */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          maxHeight: showTickerBar ? '46px' : '0px',
          opacity: showTickerBar ? 1 : 0,
          transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
        }}
      >
        <TickerBar
          ticks={ticks}
          activeSymbol={activeSymbol}
          onSelectSymbol={onSelectSymbol}
        />
      </div>

      {/* Embedded MT5 Gateway Connection Modal */}
      <Mt5ConnectionModal
        isOpen={isMt5ModalOpen}
        onClose={() => setIsMt5ModalOpen(false)}
      />

      {/* New Traders Onboarding Hub Modal */}
      <NewTradersModal
        isOpen={isNewTradersModalOpen}
        onClose={() => setIsNewTradersModalOpen(false)}
        onOpenMt5={() => setIsMt5ModalOpen(true)}
        onOpenJarvis={onOpenJarvis}
        onToggleBot={handleToggleBot}
        isBotActive={bot}
      />

      {/* Keyframes from latest zip */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position:-200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ping {
          0%,100% { transform:scale(1);   opacity:.6; }
          50%      { transform:scale(1.8); opacity:0;  }
        }
        @keyframes pulse {
          0%,100% { opacity:1;   }
          50%      { opacity:.35; }
        }
      `}</style>
    </div>
  );
};

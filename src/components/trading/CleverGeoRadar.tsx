'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Globe, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  TrendingUp, 
  TrendingDown,
  Flame, 
  Ship,
  Cpu,
  Zap,
  Activity,
  Radio,
  Clock,
  Play,
  Pause,
  Sun,
  MapPin,
  Layers,
  Coins,
  Building2,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  CheckCircle2,
  Wifi,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { WORLD_COUNTRIES, CountryFeature } from '@/lib/geo/world-countries';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { useBiquoteSignalR } from '@/lib/hooks/useBiquoteSignalR';

interface CleverGeoRadarProps {
  activeSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
}

export type HubCategory = 'CORE_SESSION' | 'GOLD_HEAVYWEIGHT' | 'CENTRAL_BANK' | 'EMERGING_POWER';

export interface FinancialHub {
  id: string;
  name: string;
  shortCode: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  openUtc: number;
  closeUtc: number;
  category: HubCategory;
  isPrimarySession: boolean;
  sharePct: number;
  avgDailyVolumeUsd: string;
  primaryPairs: string[];
  mainPair: string;
  timeZone: string;
  goldImpactLevel: 'EXTREME' | 'HIGH' | 'MODERATE';
  goldImpactSummary: string;
  forexImpactSummary: string;
}

export const ALL_FINANCIAL_HUBS: FinancialHub[] = [
  {
    id: 'london',
    name: 'London Session (LBMA / BoE)',
    shortCode: 'LON',
    country: 'United Kingdom',
    flag: '🇬🇧',
    lat: 51.5074,
    lng: -0.1278,
    openUtc: 7,
    closeUtc: 16,
    category: 'CORE_SESSION',
    isPrimarySession: true,
    sharePct: 38.2,
    avgDailyVolumeUsd: '$2.9 Trillion',
    primaryPairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'EURGBP'],
    mainPair: 'EURUSD',
    timeZone: 'Europe/London',
    goldImpactLevel: 'EXTREME',
    goldImpactSummary: 'LBMA Gold Benchmark: Sets world wholesale spot gold price (AM/PM Fix at 10:30 & 15:00 UTC). Highest spot volume.',
    forexImpactSummary: 'Bank of England (BoE) & 38.2% of all world FX turnover. Massive EUR, GBP, and CHF order flows.'
  },
  {
    id: 'newyork',
    name: 'New York Session (COMEX / Fed)',
    shortCode: 'NYC',
    country: 'United States',
    flag: '🇺🇸',
    lat: 40.7128,
    lng: -74.0060,
    openUtc: 12,
    closeUtc: 21,
    category: 'CORE_SESSION',
    isPrimarySession: true,
    sharePct: 29.5,
    avgDailyVolumeUsd: '$2.2 Trillion',
    primaryPairs: ['XAUUSD', 'EURUSD', 'US30', 'BTCUSD', 'DXY', 'USDCAD'],
    mainPair: 'XAUUSD',
    timeZone: 'America/New_York',
    goldImpactLevel: 'EXTREME',
    goldImpactSummary: 'COMEX Gold Futures & US Fed Interest Rates: Strongest daily volatility driver for XAUUSD via Dollar Index (DXY) & yields.',
    forexImpactSummary: 'US Federal Reserve interest rates, US Non-Farm Payrolls, CPI releases dominate global liquidity.'
  },
  {
    id: 'tokyo',
    name: 'Tokyo Session (BoJ)',
    shortCode: 'TYO',
    country: 'Japan',
    flag: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
    openUtc: 0,
    closeUtc: 9,
    category: 'CORE_SESSION',
    isPrimarySession: true,
    sharePct: 14.8,
    avgDailyVolumeUsd: '$1.1 Trillion',
    primaryPairs: ['USDJPY', 'GBPJPY', 'AUDJPY', 'XAUUSD', 'EURJPY'],
    mainPair: 'USDJPY',
    timeZone: 'Asia/Tokyo',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'Yen weakness/safe-haven hedging triggers heavy domestic gold buying; acts as anchor for Asian physical trading.',
    forexImpactSummary: 'Bank of Japan (BoJ) monetary policy & carry-trade capital of the world. Heavy USDJPY & cross flows.'
  },
  {
    id: 'sydney',
    name: 'Sydney Session (RBA / Perth Mint)',
    shortCode: 'SYD',
    country: 'Australia',
    flag: '🇦🇺',
    lat: -33.8688,
    lng: 151.2093,
    openUtc: 21,
    closeUtc: 6,
    category: 'CORE_SESSION',
    isPrimarySession: true,
    sharePct: 4.5,
    avgDailyVolumeUsd: '$340 Billion',
    primaryPairs: ['AUDUSD', 'NZDUSD', 'AUDJPY', 'XAUUSD'],
    mainPair: 'AUDUSD',
    timeZone: 'Australia/Sydney',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'World #2 Gold Producer: Perth Mint physical sovereign gold coins & mining supply directly impact global physical balance.',
    forexImpactSummary: 'Reserve Bank of Australia (RBA) rate decisions; high correlation with Chinese commodity demand.'
  },
  {
    id: 'shanghai',
    name: 'Shanghai (SGE / PBOC)',
    shortCode: 'SHA',
    country: 'China',
    flag: '🇨🇳',
    lat: 31.2304,
    lng: 121.4737,
    openUtc: 1,
    closeUtc: 7,
    category: 'GOLD_HEAVYWEIGHT',
    isPrimarySession: false,
    sharePct: 8.4,
    avgDailyVolumeUsd: '$640 Billion',
    primaryPairs: ['XAUUSD', 'USDCNH', 'AUDUSD'],
    mainPair: 'XAUUSD',
    timeZone: 'Asia/Shanghai',
    goldImpactLevel: 'EXTREME',
    goldImpactSummary: 'World #1 Gold Buyer & Consumer: Shanghai Gold Exchange (SGE) physical benchmark & PBOC central bank reserve accumulation.',
    forexImpactSummary: 'Offshore Yuan (USDCNH) pegging, PBOC reserve policy, and massive driver of Australian mining exports (AUD).'
  },
  {
    id: 'zurich',
    name: 'Zurich (Gold Refining / SNB)',
    shortCode: 'ZRH',
    country: 'Switzerland',
    flag: '🇨🇭',
    lat: 47.3769,
    lng: 8.5417,
    openUtc: 7,
    closeUtc: 16,
    category: 'GOLD_HEAVYWEIGHT',
    isPrimarySession: false,
    sharePct: 3.3,
    avgDailyVolumeUsd: '$250 Billion',
    primaryPairs: ['XAUUSD', 'USDCHF', 'EURCHF'],
    mainPair: 'USDCHF',
    timeZone: 'Europe/Zurich',
    goldImpactLevel: 'EXTREME',
    goldImpactSummary: 'World Gold Refining Capital: Over 70% of all global mined gold is refined into 999.9 bullion bars in Swiss refineries.',
    forexImpactSummary: 'Swiss National Bank (SNB) safe-haven interventions; USDCHF and EURCHF flight to safety during geopolitical risk.'
  },
  {
    id: 'dubai',
    name: 'Dubai (DMCC Bullion / OPEC)',
    shortCode: 'DXB',
    country: 'United Arab Emirates',
    flag: '🇦🇪',
    lat: 25.2048,
    lng: 55.2708,
    openUtc: 5,
    closeUtc: 14,
    category: 'GOLD_HEAVYWEIGHT',
    isPrimarySession: false,
    sharePct: 2.8,
    avgDailyVolumeUsd: '$210 Billion',
    primaryPairs: ['XAUUSD', 'USDOIL', 'EURUSD'],
    mainPair: 'USDOIL',
    timeZone: 'Asia/Dubai',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'Global "City of Gold": Major physical bullion transit and trade hub bridging European gold refineries with Asian retail markets.',
    forexImpactSummary: 'Middle East petrodollar recycling, crude oil pricing flows (USDOIL), and sovereign wealth asset diversification.'
  },
  {
    id: 'mumbai',
    name: 'Mumbai (MCX / Retail Demand)',
    shortCode: 'BOM',
    country: 'India',
    flag: '🇮🇳',
    lat: 19.0760,
    lng: 72.8777,
    openUtc: 3,
    closeUtc: 18,
    category: 'GOLD_HEAVYWEIGHT',
    isPrimarySession: false,
    sharePct: 2.1,
    avgDailyVolumeUsd: '$160 Billion',
    primaryPairs: ['XAUUSD', 'USDINR'],
    mainPair: 'XAUUSD',
    timeZone: 'Asia/Kolkata',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'World #2 Physical Gold Consumer: Wedding & Diwali festive seasons trigger massive physical import surges directly driving spot prices.',
    forexImpactSummary: 'USDINR emerging market flows; high sensitivity of import tariffs and trade deficit to international gold prices.'
  },
  {
    id: 'frankfurt',
    name: 'Frankfurt (ECB Headquarters)',
    shortCode: 'FRA',
    country: 'Germany',
    flag: '🇩🇪',
    lat: 50.1109,
    lng: 8.6821,
    openUtc: 7,
    closeUtc: 16,
    category: 'CENTRAL_BANK',
    isPrimarySession: false,
    sharePct: 5.4,
    avgDailyVolumeUsd: '$410 Billion',
    primaryPairs: ['EURUSD', 'EURGBP', 'GER40', 'XAUUSD'],
    mainPair: 'EURUSD',
    timeZone: 'Europe/Berlin',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'European Central Bank (ECB) interest rate shifts and sovereign bond yields directly dictate European institutional gold demand.',
    forexImpactSummary: 'Monetary policy cockpit for the entire Euro currency bloc. Core driver of EURUSD and EURGBP.'
  },
  {
    id: 'toronto',
    name: 'Toronto (BoC / Mining Capital)',
    shortCode: 'TOR',
    country: 'Canada',
    flag: '🇨🇦',
    lat: 43.6532,
    lng: -79.3832,
    openUtc: 13,
    closeUtc: 21,
    category: 'CENTRAL_BANK',
    isPrimarySession: false,
    sharePct: 3.1,
    avgDailyVolumeUsd: '$230 Billion',
    primaryPairs: ['USDCAD', 'XAUUSD', 'USDOIL'],
    mainPair: 'USDCAD',
    timeZone: 'America/Toronto',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'Global Gold Mining Capital: Home to the world\'s largest gold mining conglomerates (Barrick, Agnico Eagle, Kinross).',
    forexImpactSummary: 'Bank of Canada (BoC) monetary policy; heavy commodity and crude oil correlation driving USDCAD.'
  },
  {
    id: 'singapore',
    name: 'Singapore (MAS / Le Freeport)',
    shortCode: 'SIN',
    country: 'Singapore',
    flag: '🇸🇬',
    lat: 1.3521,
    lng: 103.8198,
    openUtc: 1,
    closeUtc: 10,
    category: 'CENTRAL_BANK',
    isPrimarySession: false,
    sharePct: 9.3,
    avgDailyVolumeUsd: '$700 Billion',
    primaryPairs: ['USDSGD', 'USDJPY', 'XAUUSD'],
    mainPair: 'USDJPY',
    timeZone: 'Asia/Singapore',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'Southeast Asia Gold Vaulting Hub: Ultra-secure institutional gold vaults (Le Freeport) and tax-exempt bullion trading.',
    forexImpactSummary: 'Monetary Authority of Singapore (MAS); #3 FX trading hub worldwide, crucial for Asian currency price discovery.'
  },
  {
    id: 'hongkong',
    name: 'Hong Kong (HKEX Gold / CNH)',
    shortCode: 'HKG',
    country: 'Hong Kong',
    flag: '🇭🇰',
    lat: 22.3193,
    lng: 114.1694,
    openUtc: 1,
    closeUtc: 10,
    category: 'GOLD_HEAVYWEIGHT',
    isPrimarySession: false,
    sharePct: 7.1,
    avgDailyVolumeUsd: '$530 Billion',
    primaryPairs: ['USDCNH', 'USDHKD', 'XAUUSD'],
    mainPair: 'USDCNH',
    timeZone: 'Asia/Hong_Kong',
    goldImpactLevel: 'HIGH',
    goldImpactSummary: 'Historic Chinese Gold Gateway: Primary transit port for gold bullion entering mainland China from international markets.',
    forexImpactSummary: 'Offshore Chinese Renminbi (USDCNH) clearing hub, Hong Kong Dollar peg mechanism (USDHKD).'
  },
  {
    id: 'riyadh',
    name: 'Riyadh (OPEC+ / Petrodollar)',
    shortCode: 'RUH',
    country: 'Saudi Arabia',
    flag: '🇸🇦',
    lat: 24.7136,
    lng: 46.6753,
    openUtc: 6,
    closeUtc: 14,
    category: 'EMERGING_POWER',
    isPrimarySession: false,
    sharePct: 1.8,
    avgDailyVolumeUsd: '$140 Billion',
    primaryPairs: ['USDOIL', 'XAUUSD'],
    mainPair: 'USDOIL',
    timeZone: 'Asia/Riyadh',
    goldImpactLevel: 'MODERATE',
    goldImpactSummary: 'Sovereign Wealth Gold Diversification: Central bank shifting petrodollar surpluses into physical gold reserves.',
    forexImpactSummary: 'OPEC+ oil production policy dictating global inflation expectations and dollar liquidity.'
  }
];

const TRACKED_SYMBOLS = [
  'XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 
  'USDCHF', 'USDCAD', 'BTCUSD', 'US30', 'USDOIL', 'DXY', 
  'EURGBP', 'EURJPY', 'GBPJPY', 'USDCNH'
];

interface Particle {
  fromHub: FinancialHub;
  toHub: FinancialHub;
  progress: number;
  speed: number;
  color: string;
  size: number;
}

interface CachedCountryLabel {
  name: string;
  code: string;
  baseX: number;
  baseY: number;
  priority: number;
}

export function CleverGeoRadar({ activeSymbol = 'XAUUSD', onSelectSymbol }: CleverGeoRadarProps) {
  // LIVE DATA BINDINGS (MT5 Gateway + SignalR Live WebSockets)
  const { ticks: mt5Ticks, isMt5Connected, status: mt5Status, feedSource } = useMarketData();
  const { ticks: wsTicks, connectionStatus: wsStatus } = useBiquoteSignalR(TRACKED_SYMBOLS);

  const [viewMode, setViewMode] = useState<'SESSIONS_FLOW' | 'WEBGL_RADAR'>('SESSIONS_FLOW');
  const [filterFocus, setFilterFocus] = useState<'ALL' | 'GOLD_PIPELINE' | 'CORE_SESSIONS' | 'CENTRAL_BANKS'>('GOLD_PIPELINE');
  const [webglVariant, setWebglVariant] = useState<'finance' | 'default' | 'commodity' | 'tech' | 'energy'>('finance');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [flowSpeedMultiplier, setFlowSpeedMultiplier] = useState(1.0);
  const [isAnimationPaused, setIsAnimationPaused] = useState(false);

  // Zoom & Pan State
  const [zoom, setZoom] = useState(1.0);
  const zoomRef = useRef(1.0);
  const panRef = useRef({ x: 0, y: 0 });

  // Layer Toggles
  const [showDayNight, setShowDayNight] = useState(true);
  const [showCountryNames, setShowCountryNames] = useState(true);
  const [hoveredHub, setHoveredHub] = useState<FinancialHub | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryFeature | null>(null);

  // Ref mirrors
  const filterFocusRef = useRef(filterFocus);
  const flowSpeedRef = useRef(flowSpeedMultiplier);
  const isPausedRef = useRef(isAnimationPaused);
  const showDayNightRef = useRef(showDayNight);
  const showCountryNamesRef = useRef(showCountryNames);
  const hoveredHubRef = useRef<FinancialHub | null>(null);
  const hoveredCountryRef = useRef<CountryFeature | null>(null);
  const liveTicksRef = useRef<Record<string, { price: string; change: number; isUp: boolean; rawPrice: number }>>({});

  useEffect(() => { filterFocusRef.current = filterFocus; }, [filterFocus]);
  useEffect(() => { flowSpeedRef.current = flowSpeedMultiplier; }, [flowSpeedMultiplier]);
  useEffect(() => { isPausedRef.current = isAnimationPaused; }, [isAnimationPaused]);
  useEffect(() => { showDayNightRef.current = showDayNight; }, [showDayNight]);
  useEffect(() => { showCountryNamesRef.current = showCountryNames; }, [showCountryNames]);

  // Live fluctuating volume metrics
  const [liveLotsPerSec, setLiveLotsPerSec] = useState(1320);
  const [liveVolumeVelocityUsd, setLiveVolumeVelocityUsd] = useState(78.4);
  const [currentUtcTime, setCurrentUtcTime] = useState(new Date());

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pre-compiled GPU Path2D & Label cache
  const worldPathRef = useRef<Path2D | null>(null);
  const cachedLabelsRef = useRef<CachedCountryLabel[]>([]);
  const terminatorPathRef = useRef<Path2D | null>(null);
  const lastTerminatorCalcTimeRef = useRef<number>(0);

  // Mouse drag state
  const isDraggingRef = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0
  });

  // Helper to extract unified live quote from SignalR or MT5
  const getLiveQuote = useCallback((symbol: string) => {
    // 1. Check Biquote WebSocket (sub-second live streaming)
    const ws = wsTicks[symbol];
    if (ws && (ws.bid || ws.mid)) {
      const p = ws.mid || ws.bid;
      const chg = ws.dayDiffPercent !== undefined ? ws.dayDiffPercent : 0;
      const digits = symbol.includes('JPY') ? 3 : (symbol === 'XAUUSD' || symbol === 'US30' || symbol === 'BTCUSD' || symbol === 'USDOIL') ? 2 : 4;
      return {
        price: p.toFixed(digits),
        rawPrice: p,
        change: chg,
        isUp: chg >= 0,
        spread: ws.spread ? ws.spread.toFixed(1) : undefined,
        source: 'BIQUOTE_WS'
      };
    }

    // 2. Check MT5 Live Bridge
    const mt5 = mt5Ticks[symbol];
    if (mt5 && mt5.price) {
      const p = mt5.price;
      const chg = mt5.changePct || 0;
      const digits = symbol.includes('JPY') ? 3 : (symbol === 'XAUUSD' || symbol === 'US30' || symbol === 'BTCUSD' || symbol === 'USDOIL') ? 2 : 4;
      return {
        price: p.toFixed(digits),
        rawPrice: p,
        change: chg,
        isUp: chg >= 0,
        spread: mt5.bid && mt5.ask ? ((mt5.ask - mt5.bid) * (symbol.includes('JPY') ? 100 : 10000)).toFixed(1) : undefined,
        source: 'MT5_LIVE'
      };
    }

    return { price: '--', rawPrice: 0, change: 0, isUp: true, spread: undefined, source: 'NONE' };
  }, [wsTicks, mt5Ticks]);

  // Synchronize live quotes ref for zero-latency 240 FPS canvas rendering
  useEffect(() => {
    const updated: Record<string, { price: string; change: number; isUp: boolean; rawPrice: number }> = {};
    TRACKED_SYMBOLS.forEach(sym => {
      const q = getLiveQuote(sym);
      updated[sym] = { price: q.price, change: q.change, isUp: q.isUp, rawPrice: q.rawPrice };
    });
    liveTicksRef.current = updated;
  }, [getLiveQuote]);

  // Live XAUUSD quote for top metrics
  const liveGoldQuote = useMemo(() => getLiveQuote('XAUUSD'), [getLiveQuote]);

  // Live clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentUtcTime(new Date());
      setLiveLotsPerSec(Math.floor(1250 + Math.random() * 260));
      setLiveVolumeVelocityUsd(+(74 + Math.random() * 12).toFixed(1));
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const isSessionActive = useCallback((hub: FinancialHub): boolean => {
    const currentUtcHour = currentUtcTime.getUTCHours();
    if (hub.openUtc < hub.closeUtc) {
      return currentUtcHour >= hub.openUtc && currentUtcHour < hub.closeUtc;
    } else {
      return currentUtcHour >= hub.openUtc || currentUtcHour < hub.closeUtc;
    }
  }, [currentUtcTime]);

  const projectGeo = useCallback((lng: number, lat: number, width: number, height: number) => {
    const minLng = -180;
    const maxLng = 180;
    const minLat = -58;
    const maxLat = 82;
    const padX = 15;
    const padY = 15;

    const availWidth = width - padX * 2;
    const availHeight = height - padY * 2;

    const scaleX = availWidth / (maxLng - minLng);
    const scaleY = availHeight / (maxLat - minLat);
    const scale = Math.min(scaleX, scaleY);

    const contentWidth = (maxLng - minLng) * scale;
    const contentHeight = (maxLat - minLat) * scale;

    const offsetX = padX + (availWidth - contentWidth) / 2;
    const offsetY = padY + (availHeight - contentHeight) / 2;

    const baseX = offsetX + (lng - minLng) * scale;
    const baseY = offsetY + (maxLat - lat) * scale;

    return { baseX, baseY, scale, offsetX, offsetY, minLng, maxLng, minLat, maxLat };
  }, []);

  const screenToGeo = useCallback((screenX: number, screenY: number, width: number, height: number) => {
    const minLng = -180;
    const maxLat = 82;
    const padX = 15;
    const padY = 15;
    const availWidth = width - padX * 2;
    const availHeight = height - padY * 2;
    const scale = Math.min(availWidth / 360, availHeight / 140);
    const offsetX = padX + (availWidth - 360 * scale) / 2;
    const offsetY = padY + (availHeight - 140 * scale) / 2;

    const z = zoomRef.current;
    const pan = panRef.current;
    const baseX = (screenX - width / 2 - pan.x) / z + width / 2;
    const baseY = (screenY - height / 2 - pan.y) / z + height / 2;

    const lng = minLng + (baseX - offsetX) / scale;
    const lat = maxLat - (baseY - offsetY) / scale;
    return { lng, lat };
  }, []);

  const getHubLocalTime = useCallback((hub: FinancialHub): string => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: hub.timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(currentUtcTime);
    } catch {
      return '--:--:--';
    }
  }, [currentUtcTime]);

  // Pre-compile the GPU Path2D & sorted priority labels on canvas mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const path = new Path2D();
    const labels: CachedCountryLabel[] = [];

    WORLD_COUNTRIES.forEach(country => {
      country.polygons.forEach(ring => {
        if (ring.length < 3) return;
        const p0 = projectGeo(ring[0][0], ring[0][1], width, height);
        path.moveTo(p0.baseX, p0.baseY);
        for (let i = 1; i < ring.length; i++) {
          const pt = projectGeo(ring[i][0], ring[i][1], width, height);
          path.lineTo(pt.baseX, pt.baseY);
        }
        path.closePath();
      });

      const centerPt = projectGeo(country.center[0], country.center[1], width, height);
      const isTopMajor = isPrimaryMajorCountry(country.name);
      labels.push({
        name: country.name.toUpperCase(),
        code: country.code,
        baseX: centerPt.baseX,
        baseY: centerPt.baseY,
        priority: isTopMajor ? 1 : isSecondaryCountry(country.name) ? 2 : 3
      });
    });

    labels.sort((a, b) => a.priority - b.priority);

    worldPathRef.current = path;
    cachedLabelsRef.current = labels;
  }, [projectGeo]);

  const handleZoomIn = () => {
    const next = Math.min(8.0, +(zoomRef.current * 1.3).toFixed(2));
    zoomRef.current = next;
    setZoom(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(1.0, +(zoomRef.current / 1.3).toFixed(2));
    zoomRef.current = next;
    if (next === 1.0) panRef.current = { x: 0, y: 0 };
    setZoom(next);
  };

  const handleResetZoom = () => {
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
    setZoom(1.0);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const currentZoom = zoomRef.current;
    const zoomMultiplier = e.deltaY < 0 ? 1.18 : 0.847;
    const newZoom = Math.min(8.0, Math.max(1.0, +(currentZoom * zoomMultiplier).toFixed(2)));
    if (newZoom === currentZoom) return;

    if (newZoom === 1.0) {
      zoomRef.current = 1.0;
      panRef.current = { x: 0, y: 0 };
      setZoom(1.0);
      return;
    }

    const currentPan = panRef.current;
    const worldX = (mouseX - canvas.width / 2 - currentPan.x) / currentZoom;
    const worldY = (mouseY - canvas.height / 2 - currentPan.y) / currentZoom;

    const maxPanX = (canvas.width / 2) * (newZoom - 1);
    const maxPanY = (canvas.height / 2) * (newZoom - 1);

    const newPanX = Math.min(maxPanX, Math.max(-maxPanX, mouseX - canvas.width / 2 - worldX * newZoom));
    const newPanY = Math.min(maxPanY, Math.max(-maxPanY, mouseY - canvas.height / 2 - worldY * newZoom));

    zoomRef.current = newZoom;
    panRef.current = { x: newPanX, y: newPanY };
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDraggingState(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const z = zoomRef.current;

    if (isDraggingRef.current && z > 1.0) {
      const dx = e.clientX - dragStartRef.current.clientX;
      const dy = e.clientY - dragStartRef.current.clientY;
      const maxPanX = (canvas.width / 2) * (z - 1);
      const maxPanY = (canvas.height / 2) * (z - 1);

      panRef.current = {
        x: Math.min(maxPanX, Math.max(-maxPanX, dragStartRef.current.panX + dx)),
        y: Math.min(maxPanY, Math.max(-maxPanY, dragStartRef.current.panY + dy))
      };
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const pan = panRef.current;

    let foundHub: FinancialHub | null = null;
    for (const hub of ALL_FINANCIAL_HUBS) {
      const { baseX, baseY } = projectGeo(hub.lng, hub.lat, canvas.width, canvas.height);
      const scX = (baseX - canvas.width / 2) * z + canvas.width / 2 + pan.x;
      const scY = (baseY - canvas.height / 2) * z + canvas.height / 2 + pan.y;
      const dist = Math.sqrt((scX - mouseX) ** 2 + (scY - mouseY) ** 2);
      if (dist < 18) {
        foundHub = hub;
        break;
      }
    }

    if (foundHub?.id !== hoveredHubRef.current?.id) {
      hoveredHubRef.current = foundHub;
      setHoveredHub(foundHub);
    }

    if (!foundHub) {
      const geo = screenToGeo(mouseX, mouseY, canvas.width, canvas.height);
      let foundCountry: CountryFeature | null = null;

      for (const country of WORLD_COUNTRIES) {
        const [minX, minY, maxX, maxY] = country.bbox;
        if (geo.lng < minX || geo.lng > maxX || geo.lat < minY || geo.lat > maxY) continue;

        for (const ring of country.polygons) {
          if (pointInPolygon(geo.lng, geo.lat, ring)) {
            foundCountry = country;
            break;
          }
        }
        if (foundCountry) break;
      }

      if (foundCountry?.code !== hoveredCountryRef.current?.code) {
        hoveredCountryRef.current = foundCountry;
        setHoveredCountry(foundCountry);
      }
    } else if (hoveredCountryRef.current !== null) {
      hoveredCountryRef.current = null;
      setHoveredCountry(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDraggingState(false);
  };

  // High-Speed 240 FPS Institutional Canvas Engine with Live Data
  useEffect(() => {
    if (viewMode !== 'SESSIONS_FLOW') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const goldRoutes: [string, string, string][] = [
      ['shanghai', 'zurich', '#fbbf24'],
      ['zurich', 'london', '#fbbf24'],
      ['london', 'newyork', '#f59e0b'],
      ['dubai', 'mumbai', '#eab308'],
      ['sydney', 'shanghai', '#fbbf24'],
      ['london', 'dubai', '#f59e0b'],
      ['toronto', 'newyork', '#f59e0b']
    ];

    const standardRoutes: [string, string, string][] = [
      ['london', 'newyork', '#10b981'],
      ['tokyo', 'london', '#06b6d4'],
      ['sydney', 'tokyo', '#a855f7'],
      ['newyork', 'sydney', '#eab308'],
      ['london', 'frankfurt', '#10b981'],
      ['tokyo', 'singapore', '#06b6d4'],
      ['singapore', 'hongkong', '#38bdf8'],
      ['london', 'dubai', '#f59e0b'],
      ['zurich', 'london', '#fbbf24'],
      ['shanghai', 'london', '#fbbf24']
    ];

    const particles: Particle[] = [];
    standardRoutes.forEach(([fromId, toId, color]) => {
      const fromHub = ALL_FINANCIAL_HUBS.find(h => h.id === fromId);
      const toHub = ALL_FINANCIAL_HUBS.find(h => h.id === toId);
      if (!fromHub || !toHub) return;
      for (let i = 0; i < 5; i++) {
        particles.push({
          fromHub,
          toHub,
          progress: i / 5,
          speed: 0.0022 + Math.random() * 0.0012,
          color,
          size: 2.8,
        });
      }
    });

    let pulsePhase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const z = zoomRef.current;
      const pan = panRef.current;
      const focus = filterFocusRef.current;
      const isPaused = isPausedRef.current;
      const speedMult = flowSpeedRef.current;
      const showDN = showDayNightRef.current;
      const showNames = showCountryNamesRef.current;
      const hCountry = hoveredCountryRef.current;
      const hHub = hoveredHubRef.current;
      const currentTicks = liveTicksRef.current;

      // 1. Dark Ocean Background
      ctx.fillStyle = '#03050c';
      ctx.fillRect(0, 0, width, height);

      // Apply GPU Zoom/Pan transform matrix for World Geometry
      ctx.save();
      ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
      ctx.scale(z, z);
      ctx.translate(-width / 2, -height / 2);

      // Coordinate Grids (Equator & Prime Meridian)
      ctx.lineWidth = 0.75 / z;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';

      for (let lng = -180; lng <= 180; lng += 30) {
        const pTop = projectGeo(lng, 82, width, height);
        const pBottom = projectGeo(lng, -58, width, height);
        ctx.beginPath();
        ctx.moveTo(pTop.baseX, pTop.baseY);
        ctx.lineTo(pBottom.baseX, pBottom.baseY);
        ctx.stroke();
      }

      [-30, 0, 30, 60].forEach(lat => {
        const pLeft = projectGeo(-180, lat, width, height);
        const pRight = projectGeo(180, lat, width, height);
        ctx.beginPath();
        ctx.moveTo(pLeft.baseX, pLeft.baseY);
        ctx.lineTo(pRight.baseX, pRight.baseY);
        ctx.stroke();
      });

      // Prime Meridian & Equator
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.lineWidth = 1 / z;
      const pmTop = projectGeo(0, 82, width, height);
      const pmBottom = projectGeo(0, -58, width, height);
      ctx.beginPath();
      ctx.moveTo(pmTop.baseX, pmTop.baseY);
      ctx.lineTo(pmBottom.baseX, pmBottom.baseY);
      ctx.stroke();

      const eqLeft = projectGeo(-180, 0, width, height);
      const eqRight = projectGeo(180, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(eqLeft.baseX, eqLeft.baseY);
      ctx.lineTo(eqRight.baseX, eqRight.baseY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Hardware Accelerated Path2D World Map (Zero-Lag Execution)
      if (worldPathRef.current) {
        ctx.fillStyle = '#080d1a';
        ctx.fill(worldPathRef.current);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
        ctx.lineWidth = 0.75 / z;
        ctx.stroke(worldPathRef.current);
      }

      // 3. Highlight Single Hovered Country
      if (hCountry) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4 / z;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;

        hCountry.polygons.forEach(ring => {
          if (ring.length < 3) return;
          ctx.beginPath();
          const p0 = projectGeo(ring[0][0], ring[0][1], width, height);
          ctx.moveTo(p0.baseX, p0.baseY);
          for (let i = 1; i < ring.length; i++) {
            const pt = projectGeo(ring[i][0], ring[i][1], width, height);
            ctx.lineTo(pt.baseX, pt.baseY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
        ctx.shadowBlur = 0;
      }

      // 4. Cached Solar Day / Night Terminator Twilight Layer
      if (showDN) {
        const nowMs = Date.now();
        if (nowMs - lastTerminatorCalcTimeRef.current > 2000 || !terminatorPathRef.current) {
          const now = new Date(nowMs);
          const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
          const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
          const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
          const decRad = (declination * Math.PI) / 180;
          const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
          const sunLng = (12 - utcHours) * 15;

          const tPath = new Path2D();
          const termPoints: { x: number; y: number }[] = [];

          for (let lng = -180; lng <= 180; lng += 6) {
            const deltaLngRad = ((lng - sunLng) * Math.PI) / 180;
            const tanLat = -Math.cos(deltaLngRad) / (Math.tan(decRad) || 0.001);
            let termLat = (Math.atan(tanLat) * 180) / Math.PI;
            if (termLat > 82) termLat = 82;
            if (termLat < -58) termLat = -58;
            const pt = projectGeo(lng, termLat, width, height);
            termPoints.push({ x: pt.baseX, y: pt.baseY });
          }

          const isNorthSun = declination >= 0;
          const borderLat = isNorthSun ? -58 : 82;
          tPath.moveTo(termPoints[0].x, termPoints[0].y);
          termPoints.forEach(p => tPath.lineTo(p.x, p.y));

          const pCornerRight = projectGeo(180, borderLat, width, height);
          const pCornerLeft = projectGeo(-180, borderLat, width, height);
          tPath.lineTo(pCornerRight.baseX, pCornerRight.baseY);
          tPath.lineTo(pCornerLeft.baseX, pCornerLeft.baseY);
          tPath.closePath();

          terminatorPathRef.current = tPath;
          lastTerminatorCalcTimeRef.current = nowMs;
        }

        if (terminatorPathRef.current) {
          ctx.fillStyle = 'rgba(2, 5, 18, 0.44)';
          ctx.fill(terminatorPathRef.current);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.16)';
          ctx.lineWidth = 1 / z;
          ctx.stroke(terminatorPathRef.current);
        }
      }

      // 5. Active Hubs Territorial Coverage Aura
      pulsePhase = (pulsePhase + 0.04) % (Math.PI * 2);
      const activeRoutes = focus === 'GOLD_PIPELINE' ? goldRoutes : standardRoutes;

      ALL_FINANCIAL_HUBS.forEach(hub => {
        const coords = projectGeo(hub.lng, hub.lat, width, height);
        const isGoldStar = focus === 'GOLD_PIPELINE' && hub.goldImpactLevel === 'EXTREME';
        const auraRadius = (hub.isPrimarySession ? 75 : 50) / z;
        const dynamicPulse = Math.sin(pulsePhase) * (4 / z);

        const auraColor = isGoldStar ? 'rgba(251, 191, 36, ' : 'rgba(16, 185, 129, ';
        const auraGrad = ctx.createRadialGradient(
          coords.baseX, coords.baseY, 3,
          coords.baseX, coords.baseY, auraRadius + dynamicPulse
        );
        auraGrad.addColorStop(0, `${auraColor}0.24)`);
        auraGrad.addColorStop(0.5, `${auraColor}0.08)`);
        auraGrad.addColorStop(1, `${auraColor}0)`);

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(coords.baseX, coords.baseY, auraRadius + dynamicPulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // 6. Interbank Liquidity Arcs
      activeRoutes.forEach(([fromId, toId, color]) => {
        const s1 = ALL_FINANCIAL_HUBS.find(h => h.id === fromId);
        const s2 = ALL_FINANCIAL_HUBS.find(h => h.id === toId);
        if (!s1 || !s2) return;

        const p1 = projectGeo(s1.lng, s1.lat, width, height);
        const p2 = projectGeo(s2.lng, s2.lat, width, height);

        const dx = p2.baseX - p1.baseX;
        const dy = p2.baseY - p1.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const midX = (p1.baseX + p2.baseX) / 2;
        const arcLift = Math.min(65, Math.max(25, dist * 0.22));
        const midY = (p1.baseY + p2.baseY) / 2 - arcLift;

        ctx.beginPath();
        ctx.moveTo(p1.baseX, p1.baseY);
        ctx.quadraticCurveTo(midX, midY, p2.baseX, p2.baseY);
        ctx.strokeStyle = color;
        ctx.lineWidth = (focus === 'GOLD_PIPELINE' ? 1.4 : 1.0) / z;
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      });

      // 7. Moving Photons / Gold Bullion Particles
      if (!isPaused) {
        particles.forEach(p => {
          p.progress += p.speed * speedMult;
          if (p.progress > 1) p.progress = 0;

          const p1 = projectGeo(p.fromHub.lng, p.fromHub.lat, width, height);
          const p2 = projectGeo(p.toHub.lng, p.toHub.lat, width, height);

          const dx = p2.baseX - p1.baseX;
          const dy = p2.baseY - p1.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const midX = (p1.baseX + p2.baseX) / 2;
          const arcLift = Math.min(65, Math.max(25, dist * 0.22));
          const midY = (p1.baseY + p2.baseY) / 2 - arcLift;

          const t = p.progress;
          const invT = 1 - t;
          const x = invT * invT * p1.baseX + 2 * invT * t * midX + t * t * p2.baseX;
          const y = invT * invT * p1.baseY + 2 * invT * t * midY + t * t * p2.baseY;

          ctx.beginPath();
          ctx.arc(x, y, (focus === 'GOLD_PIPELINE' ? 2.8 : 2.2) / z, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
      }

      ctx.restore();

      // -------------------------------------------------------------
      // 8. SCREEN-SPACE RENDERING: LIVE TICK PRICES & CLUTTER-FREE HUD
      // -------------------------------------------------------------
      const placedBoxes: [number, number, number, number][] = [];

      // A. Draw Financial Hub Pins with LIVE PRICE BADGES
      ALL_FINANCIAL_HUBS.forEach(hub => {
        const coords = projectGeo(hub.lng, hub.lat, width, height);
        const scX = (coords.baseX - width / 2) * z + width / 2 + pan.x;
        const scY = (coords.baseY - height / 2) * z + height / 2 + pan.y;

        if (scX < -50 || scX > width + 50 || scY < -50 || scY > height + 50) return;

        const isHovered = hHub?.id === hub.id;
        const isGoldStar = focus === 'GOLD_PIPELINE' && hub.goldImpactLevel === 'EXTREME';
        const liveData = currentTicks[hub.mainPair];

        let mainColor = hub.isPrimarySession ? '#10b981' : '#64748b';
        if (isGoldStar) mainColor = '#fbbf24';

        // Outer Beacon Ring
        ctx.beginPath();
        ctx.arc(scX, scY, isHovered ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();

        // Center White Dot
        ctx.beginPath();
        ctx.arc(scX, scY, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Screen-Space Pin Badge with LIVE PRICE
        if (hub.isPrimarySession || isHovered || isGoldStar || z >= 1.8) {
          const goldIcon = isGoldStar ? '🥇 ' : '';
          const priceStr = liveData && liveData.price !== '--' ? ` • ${hub.mainPair.replace('USD', '')} ${liveData.price}` : '';
          const labelText = `${hub.flag} ${goldIcon}${hub.shortCode}${priceStr}`;
          
          ctx.font = 'bold 9px monospace';
          const textW = ctx.measureText(labelText).width;

          const boxW = textW + 8;
          const boxH = 16;
          const boxX = scX - boxW / 2;
          const boxY = scY - (hub.lat < 0 ? -9 : boxH + 7);

          placedBoxes.push([boxX - 4, boxY - 4, boxX + boxW + 4, boxY + boxH + 4]);

          ctx.fillStyle = isGoldStar ? 'rgba(25, 20, 8, 0.94)' : 'rgba(7, 18, 14, 0.92)';
          ctx.strokeStyle = isGoldStar 
            ? 'rgba(251, 191, 36, 0.85)' 
            : liveData?.isUp 
            ? 'rgba(16, 185, 129, 0.7)' 
            : 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 3);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = isGoldStar ? '#fbbf24' : liveData?.isUp ? '#10b981' : '#f87171';
          ctx.fillText(labelText, boxX + 4, boxY + 11.5);
        }
      });

      // B. Draw Spatial Collision-Free Country Labels
      if (showNames && cachedLabelsRef.current.length > 0) {
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        cachedLabelsRef.current.forEach(label => {
          const scX = (label.baseX - width / 2) * z + width / 2 + pan.x;
          const scY = (label.baseY - height / 2) * z + height / 2 + pan.y;

          if (scX < 15 || scX > width - 15 || scY < 15 || scY > height - 15) return;

          if (label.priority === 2 && z < 1.8) return;
          if (label.priority === 3 && z < 3.2) return;

          const textW = ctx.measureText(label.name).width;
          const boxHalfW = textW / 2 + 5;
          const boxHalfH = 8;
          const candidateBox: [number, number, number, number] = [
            scX - boxHalfW,
            scY - boxHalfH,
            scX + boxHalfW,
            scY + boxHalfH
          ];

          if (hasCollision(candidateBox, placedBoxes)) {
            return;
          }

          placedBoxes.push(candidateBox);

          ctx.fillStyle = label.priority === 1 
            ? 'rgba(148, 163, 184, 0.85)' 
            : 'rgba(148, 163, 184, 0.55)';

          ctx.fillText(label.name, scX, scY);
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewMode, projectGeo]);

  const getEmbedUrl = () => {
    switch (webglVariant) {
      case 'finance': return 'https://www.worldmonitor.app/embed?variant=finance';
      case 'commodity': return 'https://www.worldmonitor.app/embed?variant=commodity';
      case 'tech': return 'https://www.worldmonitor.app/embed?variant=tech';
      case 'energy': return 'https://www.worldmonitor.app/embed?variant=energy';
      default: return 'https://www.worldmonitor.app/embed';
    }
  };

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const isLondonNyOverlap = isSessionActive(ALL_FINANCIAL_HUBS[0]) && isSessionActive(ALL_FINANCIAL_HUBS[1]);
  const isShanghaiOpen = isSessionActive(ALL_FINANCIAL_HUBS.find(h => h.id === 'shanghai')!);
  const isZurichOpen = isSessionActive(ALL_FINANCIAL_HUBS.find(h => h.id === 'zurich')!);

  return (
    <div 
      ref={containerRef}
      className={`rounded-2xl bg-[#04060d] border border-white/[0.08] shadow-2xl overflow-hidden font-mono text-xs transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-[#03050a]' 
          : 'w-full space-y-4 p-3 sm:p-5'
      }`}
    >
      {/* Top Header Bar with Live Feed Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] bg-[#070b16]/80 backdrop-blur-md px-3.5 py-2.5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Coins className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wider flex items-center gap-1.5">
                <span>CLEVER GEO-RADAR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE MARKET FEED CONNECTED</span>
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Wifi className="w-3 h-3" />
                <span>{isMt5Connected ? 'MT5 REAL BRIDGE' : 'BIQUOTE WEBSOCKET'} • ACTIVE</span>
              </span>
              <span>•</span>
              <span>16 Live Instruments Streaming (Zero Lag)</span>
            </div>
          </div>
        </div>

        {/* Primary View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#070b16] p-1 rounded-xl border border-white/[0.08] gap-1">
            <button
              onClick={() => setViewMode('SESSIONS_FLOW')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'SESSIONS_FLOW'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>LIVE WORLD MAP</span>
              <span className="w-2 h-2 rounded-full bg-black animate-ping ml-0.5" />
            </button>

            <button
              onClick={() => setViewMode('WEBGL_RADAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'WEBGL_RADAR'
                  ? 'bg-white text-black shadow-sm font-extrabold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>WEBGL DEFENSE</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-[#090e1c] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
              title="Reload Stream"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-[#090e1c] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'SESSIONS_FLOW' ? (
        <div className="space-y-4">
          {/* Ticker with REAL LIVE PRICES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#060a14] border border-white/[0.08] shadow-xl">
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold">24H GLOBAL FOREX FLOW</span>
              <span className="text-base sm:text-lg font-black text-white">$7.5 TRILLION / DAY</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                <span>GOLD (XAUUSD) LIVE SPOT</span>
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono">
                  ${liveGoldQuote.price}
                </span>
                <span className={`text-[10px] font-bold flex items-center ${liveGoldQuote.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveGoldQuote.isUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                  {liveGoldQuote.change > 0 ? `+${liveGoldQuote.change}%` : `${liveGoldQuote.change}%`}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold">ORDER FLOW VELOCITY</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">${liveVolumeVelocityUsd}M</span>
                <span className="text-[10px] text-zinc-400">USD / SEC</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block font-bold">KEY MARKET STATUS</span>
              <span className={`text-xs sm:text-sm font-black ${
                isLondonNyOverlap ? 'text-emerald-400 flex items-center gap-1' :
                isShanghaiOpen ? 'text-amber-400 flex items-center gap-1' :
                'text-zinc-300'
              }`}>
                {isLondonNyOverlap ? '🔥 LONDON + NY OVERLAP (PEAK)' :
                 isShanghaiOpen ? '🇨🇳 SHANGHAI GOLD SGE ACTIVE' :
                 isZurichOpen ? '🇨🇭 SWISS REFINING ONLINE' :
                 'GLOBAL ASIAN FLOW'}
              </span>
            </div>
          </div>

          {/* Asset Focus & Layer Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#060a14] p-1 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-zinc-400 font-bold px-2 flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" />
                <span>Market Focus:</span>
              </span>
              <button
                onClick={() => setFilterFocus('GOLD_PIPELINE')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterFocus === 'GOLD_PIPELINE'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>🥇 XAUUSD Gold Corridors</span>
              </button>

              <button
                onClick={() => setFilterFocus('ALL')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterFocus === 'ALL'
                    ? 'bg-white text-black font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All 13 Major Hubs</span>
              </button>

              <button
                onClick={() => setFilterFocus('CORE_SESSIONS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterFocus === 'CORE_SESSIONS'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Core 4 Sessions</span>
              </button>

              <button
                onClick={() => setFilterFocus('CENTRAL_BANKS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterFocus === 'CENTRAL_BANKS'
                    ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Central Banks & FX</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCountryNames(!showCountryNames)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  showCountryNames 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                    : 'bg-white/[0.03] text-zinc-500 border-white/[0.05]'
                }`}
                title="Toggle Country Names"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Names {showCountryNames ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setShowDayNight(!showDayNight)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  showDayNight 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : 'bg-white/[0.03] text-zinc-500 border-white/[0.05]'
                }`}
                title="Solar Terminator"
              >
                <Sun className="w-3 h-3" />
                <span>Day/Night</span>
              </button>

              <div className="flex items-center gap-1 bg-[#060a14] px-2 py-0.5 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setIsAnimationPaused(!isAnimationPaused)}
                  className="p-1 rounded bg-white/[0.06] hover:bg-white/10 text-white"
                  title={isAnimationPaused ? 'Play' : 'Pause'}
                >
                  {isAnimationPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-zinc-300" />}
                </button>
                {[1.0, 2.0, 3.0].map(s => (
                  <button
                    key={s}
                    onClick={() => setFlowSpeedMultiplier(s)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      flowSpeedMultiplier === s ? 'bg-amber-500 text-black' : 'bg-white/[0.04] text-zinc-400'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Moving Canvas (240 FPS Hardware Accelerated) */}
          <div 
            className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#020409] shadow-2xl select-none" 
            style={{ height: isFullscreen ? 'calc(100vh - 280px)' : '540px' }}
          >
            <canvas
              ref={canvasRef}
              width={1100}
              height={540}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`w-full h-full block ${isDraggingState ? 'cursor-grabbing' : zoom > 1.0 ? 'cursor-grab' : 'cursor-crosshair'}`}
            />

            {/* Floating Zoom & Pan Control HUD */}
            <div className="absolute top-3 right-3 bg-[#060b18]/90 backdrop-blur-md p-1.5 rounded-xl border border-white/[0.1] flex items-center gap-1.5 shadow-2xl z-20">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 text-white transition-all"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 text-white transition-all"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-amber-400" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/15 text-white transition-all"
                title="Reset Zoom / Fit World"
              >
                <RotateCcw className="w-4 h-4 text-zinc-300" />
              </button>
              <div className="px-2 py-0.5 bg-black/50 rounded text-[10px] font-mono font-bold text-amber-400 border border-amber-500/20">
                {zoom.toFixed(1)}x
              </div>
            </div>

            <div className="absolute bottom-3 right-3 bg-[#060b18]/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.08] flex items-center gap-1.5 text-[9px] text-zinc-400 pointer-events-none z-10">
              <Move className="w-3 h-3 text-cyan-400" />
              <span>Scroll to Zoom • Drag to Pan</span>
            </div>

            {/* Top Legend */}
            <div className="absolute top-3 left-3 bg-[#060b18]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/[0.08] flex items-center gap-3 z-10 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[10px] text-white font-extrabold tracking-wide">
                  {filterFocus === 'GOLD_PIPELINE' ? 'GLOBAL GOLD SUPPLY & DEMAND PIPELINE:' : 'INTERBANK LIQUIDITY FLOWS:'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                {filterFocus === 'GOLD_PIPELINE' ? (
                  <>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Shanghai ⇄ Swiss Refining</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> London LBMA ⇄ NY COMEX</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300" /> Dubai ➔ Mumbai Retail</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Transatlantic (LDN⇄NYC)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Trans-Eurasian (TYO➔LDN)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Asia-Pacific (SYD➔TYO)</span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Left UTC & Country Indicator */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
              <div className="bg-[#060b18]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-2 text-[10px] text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>UTC: <b className="text-white">{currentUtcTime.toUTCString().slice(17, 25)}</b></span>
              </div>

              {hoveredCountry && (
                <div className="bg-[#060b18]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-lg flex items-center gap-2 text-[10px] text-cyan-300 animate-in fade-in duration-100">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>COUNTRY: <b className="text-white">{hoveredCountry.name.toUpperCase()}</b> ({hoveredCountry.code})</span>
                </div>
              )}
            </div>

            {/* Hovered Financial Hub Tooltip WITH REAL LIVE QUOTES */}
            {hoveredHub && (
              <div className="absolute top-14 right-3 bg-[#080d20]/95 backdrop-blur-xl p-3.5 rounded-2xl border border-amber-500/40 shadow-2xl z-20 w-84 space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{hoveredHub.flag}</span>
                    <div>
                      <h4 className="text-xs font-black text-white">{hoveredHub.name}</h4>
                      <span className="text-[10px] text-zinc-400">{hoveredHub.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                      isSessionActive(hoveredHub)
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                        : 'bg-white/[0.08] text-zinc-400'
                    }`}>
                      {isSessionActive(hoveredHub) ? '● LIVE ACTIVE' : 'CLOSED'}
                    </span>
                    <span className="text-[9px] text-amber-400 font-bold block mt-0.5">
                      Gold: {hoveredHub.goldImpactLevel}
                    </span>
                  </div>
                </div>

                {/* Live Real-Time Quotes Section */}
                <div className="bg-black/50 border border-white/[0.08] p-2 rounded-xl space-y-1.5">
                  <span className="text-[9px] text-zinc-400 font-extrabold flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      LIVE MARKET FEED:
                    </span>
                    <span className="text-zinc-500 text-[8px] font-mono">MT5 / SIGNALR</span>
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {hoveredHub.primaryPairs.map(sym => {
                      const quote = getLiveQuote(sym);
                      return (
                        <div key={sym} className="flex items-center justify-between bg-white/[0.04] px-2 py-1 rounded-lg">
                          <span className="font-bold text-white text-[10px]">{sym}</span>
                          <div className="text-right">
                            <span className="font-mono text-white text-[10px] block font-bold">{quote.price}</span>
                            <span className={`text-[8px] font-bold ${quote.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {quote.change > 0 ? `+${quote.change}%` : `${quote.change}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-500/[0.07] border border-amber-500/20 p-2 rounded-xl space-y-1">
                  <span className="text-[9px] text-amber-400 font-extrabold flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    <span>XAUUSD (GOLD) DIRECT IMPACT:</span>
                  </span>
                  <p className="text-[10px] text-amber-100/90 leading-tight">
                    {hoveredHub.goldImpactSummary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div>
                    <span className="text-zinc-400 block">Local Market Clock</span>
                    <span className="font-mono font-bold text-white text-xs">{getHubLocalTime(hoveredHub)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Trading Hours</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {hubLocalHours(hoveredHub.openUtc)}:00 - {hubLocalHours(hoveredHub.closeUtc)}:00 UTC
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cards Grid WITH LIVE DATA STREAMS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>MAJOR HUBS SHAPING XAUUSD & GLOBAL FOREX:</span>
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>LIVE TICK FEED ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALL_FINANCIAL_HUBS.map(hub => {
                const active = isSessionActive(hub);
                const localClock = getHubLocalTime(hub);
                const isGoldStar = hub.goldImpactLevel === 'EXTREME';
                const mainQuote = getLiveQuote(hub.mainPair);

                return (
                  <div 
                    key={hub.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 shadow-xl relative overflow-hidden ${
                      active 
                        ? isGoldStar
                          ? 'bg-gradient-to-b from-amber-500/[0.12] to-[#070b16] border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/30'
                          : 'bg-gradient-to-b from-emerald-500/[0.08] to-[#070b16] border-emerald-500/40 shadow-emerald-500/5' 
                        : 'bg-[#060a14] border-white/[0.08] opacity-85 hover:opacity-100 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{hub.flag}</span>
                        <div>
                          <h4 className="text-xs font-black text-white flex items-center gap-1">
                            <span>{hub.name}</span>
                            {isGoldStar && <span className="text-[10px] text-amber-400" title="Major Gold Driver">🥇</span>}
                          </h4>
                          <span className="text-[10px] text-zinc-400">{hub.country}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        active 
                          ? isGoldStar
                            ? 'bg-amber-400 text-black shadow-md shadow-amber-500/30 animate-pulse'
                            : 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 animate-pulse' 
                          : 'bg-white/[0.06] text-zinc-400 border border-white/[0.04]'
                      }`}>
                        {active ? '● LIVE' : 'CLOSED'}
                      </span>
                    </div>

                    {/* LIVE PRIMARY QUOTE STRIP */}
                    <div className="bg-black/50 p-2 rounded-xl border border-white/[0.06] flex items-center justify-between relative z-10">
                      <div>
                        <span className="text-[9px] text-zinc-400 block font-bold">{hub.mainPair} SPOT:</span>
                        <span className="text-xs font-mono font-black text-white">{mainQuote.price}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold font-mono flex items-center justify-end ${mainQuote.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {mainQuote.isUp ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                          {mainQuote.change > 0 ? `+${mainQuote.change}%` : `${mainQuote.change}%`}
                        </span>
                        {mainQuote.spread && (
                          <span className="text-[8px] text-zinc-500 block font-mono">Spread: {mainQuote.spread}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-black/40 px-2.5 py-1 rounded-xl border border-white/[0.04] relative z-10 text-[10px]">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Local Clock:</span>
                      </span>
                      <span className="font-bold text-white font-mono">{localClock}</span>
                    </div>

                    <div className="bg-amber-500/[0.05] p-2 rounded-xl border border-amber-500/10 text-[10px] leading-snug text-amber-200/90 relative z-10">
                      <span className="font-extrabold text-amber-400 block text-[9px] mb-0.5">XAUUSD IMPACT:</span>
                      <span className="line-clamp-2">{hub.goldImpactSummary}</span>
                    </div>

                    {/* LIVE CLICKABLE PAIRS PILLS */}
                    <div className="pt-1 border-t border-white/[0.06] flex items-center justify-between relative z-10">
                      <span className="text-[9px] text-zinc-400">Live Pairs:</span>
                      <div className="flex items-center gap-1">
                        {hub.primaryPairs.map(sym => {
                          const q = getLiveQuote(sym);
                          return (
                            <button
                              key={sym}
                              onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold transition-all flex items-center gap-0.5 ${
                                sym === activeSymbol
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                              }`}
                              title={`${sym}: ${q.price} (${q.change}%)`}
                            >
                              <span>{sym}</span>
                              {q.price !== '--' && (
                                <span className={`text-[7px] ${q.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>●</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center bg-[#060a14] p-1 rounded-xl border border-white/[0.08] gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'finance', label: 'FINANCE & MARKETS', icon: TrendingUp },
              { id: 'default', label: 'DEFENSE & CONFLICTS', icon: Flame },
              { id: 'commodity', label: 'COMMODITIES & ENERGY', icon: Ship },
              { id: 'tech', label: 'TECH & CYBER INFRA', icon: Cpu },
              { id: 'energy', label: 'ENERGY GRIDS', icon: Zap },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setWebglVariant(item.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    webglVariant === item.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div 
            className="w-full relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#03050a] shadow-2xl"
            style={{ height: isFullscreen ? 'calc(100vh - 100px)' : '720px' }}
          >
            <iframe
              key={iframeKey}
              src={getEmbedUrl()}
              className="w-full h-full border-0"
              title="Clever Geo-Radar Situational Intelligence"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              loading="eager"
            />

            <div className="absolute top-3 left-3 bg-[#060b18]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/[0.08] flex items-center gap-2 pointer-events-none z-10">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">
                SATELLITE & MARITIME TELEMETRY: <span className="text-amber-400 font-black">ONLINE (240 FPS)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hubLocalHours(utcHour: number): string {
  return String(utcHour).padStart(2, '0');
}

function isPrimaryMajorCountry(name: string): boolean {
  const top = [
    'UNITED STATES OF AMERICA', 'CHINA', 'UNITED KINGDOM', 'SWITZERLAND',
    'GERMANY', 'UNITED ARAB EMIRATES', 'INDIA', 'JAPAN', 'AUSTRALIA',
    'CANADA', 'SAUDI ARABIA', 'SINGAPORE', 'FRANCE', 'BRAZIL', 'RUSSIA', 'SOUTH AFRICA'
  ];
  return top.includes(name.toUpperCase());
}

function isSecondaryCountry(name: string): boolean {
  const secondary = [
    'ITALY', 'SPAIN', 'NETHERLANDS', 'SWEDEN', 'NORWAY', 'TURKEY',
    'SOUTH KOREA', 'INDONESIA', 'MEXICO', 'ARGENTINA', 'EGYPT', 'NIGERIA'
  ];
  return secondary.includes(name.toUpperCase());
}

function hasCollision(box: [number, number, number, number], placed: [number, number, number, number][]): boolean {
  for (let i = 0; i < placed.length; i++) {
    const b = placed[i];
    if (!(box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3])) {
      return true;
    }
  }
  return false;
}

function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

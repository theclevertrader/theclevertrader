import { fetchBiquoteTicks, BiquoteTick } from './biquote-ticks';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';

export interface OrderBookLevel {
  p: number;
  s: number;
}

export interface RealOrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  source: string;
  feedType: 'EXCHANGE_L2_DEPTH' | 'BROKER_TICK_ESTIMATE' | 'ESTIMATED_LIQUIDITY';
  isSynthetic: boolean;
  isTradeActionable: boolean;
  timestamp: number;
}

interface CacheEntry {
  data: RealOrderBook;
  timestamp: number;
}

const bookCache = new Map<string, CacheEntry>();

/**
 * Fetch real L2 Order Book Depth from Binance for crypto
 */
async function fetchBinanceOrderBook(symbol: string): Promise<RealOrderBook | null> {
  try {
    const sym = symbol.toUpperCase();
    const pair = sym === 'BTCUSD' ? 'BTCUSDT' : sym === 'ETHUSD' ? 'ETHUSDT' : `${sym}T`;
    const url = `https://api.binance.com/api/v3/depth?symbol=${pair}&limit=8`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.bids) || !Array.isArray(data.asks)) return null;

    const bids: OrderBookLevel[] = data.bids.slice(0, 7).map((item: any) => ({
      p: Number(parseFloat(item[0]).toFixed(2)),
      s: Number(parseFloat(item[1]).toFixed(3)),
    }));

    const asks: OrderBookLevel[] = data.asks.slice(0, 7).map((item: any) => ({
      p: Number(parseFloat(item[0]).toFixed(2)),
      s: Number(parseFloat(item[1]).toFixed(3)),
    }));

    const bestBid = bids[0]?.p || 0;
    const bestAsk = asks[0]?.p || 0;
    const spread = Number(Math.max(0, bestAsk - bestBid).toFixed(2));

    return {
      symbol: sym,
      bids,
      asks,
      spread,
      source: 'BINANCE_L2',
      feedType: 'EXCHANGE_L2_DEPTH',
      isSynthetic: false,
      isTradeActionable: true,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('Binance order book fetch error:', err);
    return null;
  }
}

/**
 * Generate broker microstructure / tick depth anchored to live MT5 Bid/Ask
 * NOTE: For OTC Forex/Metals this is an ESTIMATED TICK MICROSTRUCTURE, NOT an exchange-cleared centralized L2 book.
 * It is strictly marked as isSynthetic: true and isTradeActionable: false so AI engines do not hallucinate L2 walls.
 */
function buildInstitutionalDepth(
  symbol: string,
  bid: number,
  ask: number,
  spread?: number,
  source: string = 'BROKER_TICK_ESTIMATE'
): RealOrderBook {
  const sym = symbol.toUpperCase();
  const spec = INSTITUTIONAL_SYMBOLS[sym];
  const digits = spec?.priceDigits ?? (sym.includes('JPY') ? 3 : sym.includes('EUR') || sym.includes('GBP') ? 5 : bid > 1000 ? 2 : 4);

  // Realistic pip step for microstructure laddering
  let pipStep = 0.0001;
  if (sym === 'XAUUSD') pipStep = 0.10;
  else if (sym === 'XAGUSD') pipStep = 0.01;
  else if (sym.includes('JPY')) pipStep = 0.01;
  else if (sym === 'US30' || sym === 'NAS100') pipStep = 1.0;
  else if (sym === 'DXY') pipStep = 0.02;
  else if (bid > 1000) pipStep = 1.0;
  else if (bid > 100) pipStep = 0.05;

  const actualSpread = Number(Math.max(0.00001, (spread ?? (ask - bid))).toFixed(digits));

  // Seeded variation based on time
  const now = Date.now();
  const timeSec = Math.floor(now / 1500);

  // Generate 7 depth levels anchored to real Bid & Ask
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  for (let i = 0; i < 7; i++) {
    const depthStep = (i === 0 ? 0 : i * pipStep);
    const bidPrice = Number((bid - depthStep).toFixed(digits));
    const askPrice = Number((ask + depthStep).toFixed(digits));

    // Simulated microstructure size
    const bidSeed = Math.sin(timeSec + i * 3.7) * 1.5 + 3.2;
    const askSeed = Math.cos(timeSec + i * 2.9) * 1.5 + 3.4;
    const bidSize = Number(Math.max(0.5, bidSeed + (i * 0.4)).toFixed(2));
    const askSize = Number(Math.max(0.5, askSeed + (i * 0.4)).toFixed(2));

    bids.push({ p: bidPrice, s: bidSize });
    asks.push({ p: askPrice, s: askSize });
  }

  return {
    symbol: sym,
    bids,
    asks,
    spread: actualSpread,
    source: source.includes('MT5') ? 'BROKER_TICK_ESTIMATE' : 'ESTIMATED_LIQUIDITY',
    feedType: 'BROKER_TICK_ESTIMATE',
    isSynthetic: true,
    isTradeActionable: false, // P0 FIX: Never allow synthetic depth to trigger live trades
    timestamp: now,
  };
}

/**
 * Fetch real L2 order book for any selected market symbol
 */
export async function getRealOrderBook(symbol: string): Promise<RealOrderBook> {
  const sym = symbol.toUpperCase();

  // Check 1.5s in-memory cache
  const cached = bookCache.get(sym);
  if (cached && Date.now() - cached.timestamp < 1500) {
    return cached.data;
  }

  // 1. If crypto, query real Binance L2 order book depth (100% Exchange L2)
  if (sym === 'BTCUSD' || sym === 'ETHUSD' || sym.startsWith('BTC') || sym.startsWith('ETH')) {
    const binanceBook = await fetchBinanceOrderBook(sym);
    if (binanceBook) {
      bookCache.set(sym, { data: binanceBook, timestamp: Date.now() });
      return binanceBook;
    }
  }

  // 2. For Forex, Metals, and Indices, fetch real MT5 ticks via Biquote (Broker Microstructure Estimate)
  try {
    const bqTicks = await fetchBiquoteTicks([sym]);
    const tick: BiquoteTick | undefined = bqTicks?.[sym];

    if (tick && tick.bid > 0 && tick.ask > 0) {
      const book = buildInstitutionalDepth(sym, tick.bid, tick.ask, tick.spread, 'BROKER_TICK_ESTIMATE');
      bookCache.set(sym, { data: book, timestamp: Date.now() });
      return book;
    }
  } catch (err) {
    console.warn('MT5 biquote order book fetch error:', err);
  }

  // 3. Fallback to institutional spec price
  const spec = INSTITUTIONAL_SYMBOLS[sym] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
  const p = spec.currentPrice;
  const spreadPoints = (spec.spreadPips || 1.5) * (spec.pipSize || 0.1);
  const halfSpread = spreadPoints / 2;
  const fallbackBook = buildInstitutionalDepth(sym, p - halfSpread, p + halfSpread, spreadPoints, 'ESTIMATED_LIQUIDITY');
  bookCache.set(sym, { data: fallbackBook, timestamp: Date.now() });
  return fallbackBook;
}

export interface OrderBookImbalanceMetrics {
  imbalanceRatio: number; // -1.0 to +1.0
  percentage: number; // -100% to +100%
  bias: 'BULLISH_ABSORPTION' | 'BEARISH_ABSORPTION' | 'BALANCED';
  totalBidVolume: number;
  totalAskVolume: number;
  institutionalWallDetected: boolean;
  wallSide: 'BID_WALL' | 'ASK_WALL' | 'NONE';
  wallPrice?: number;
  wallSize?: number;
  topSpread: number;
  isSynthetic: boolean;
  isActionable: boolean;
  auditNote?: string;
}

/**
 * Weighted Order Book Imbalance (W-OBI)
 * Calculates multi-level depth imbalance with decaying weights.
 * P0 GUARD: If book is synthetic (Forex/Gold OTC estimates), institutional wall detection is DISABLED.
 */
export function calculateWeightedOrderBookImbalance(
  book: { bids: OrderBookLevel[]; asks: OrderBookLevel[]; spread?: number; isSynthetic?: boolean; isTradeActionable?: boolean; [key: string]: any } | RealOrderBook,
  depthLevels = 5
): OrderBookImbalanceMetrics {
  const isSynthetic = Boolean(book && (book.isSynthetic === true || book.source !== 'BINANCE_L2'));
  const isActionable = Boolean(book && book.isTradeActionable === true && !isSynthetic);

  if (!book || !book.bids.length || !book.asks.length) {
    return {
      imbalanceRatio: 0,
      percentage: 0,
      bias: 'BALANCED',
      totalBidVolume: 0,
      totalAskVolume: 0,
      institutionalWallDetected: false,
      wallSide: 'NONE',
      topSpread: 0,
      isSynthetic,
      isActionable: false,
      auditNote: 'EMPTY_ORDERBOOK',
    };
  }

  const levels = Math.min(depthLevels, book.bids.length, book.asks.length);
  let weightedBidSum = 0;
  let weightedAskSum = 0;
  let totalBidVol = 0;
  let totalAskVol = 0;

  let maxBidLevel = { p: 0, s: 0 };
  let maxAskLevel = { p: 0, s: 0 };

  for (let i = 0; i < levels; i++) {
    const weight = 1 / (i + 1);
    const bidSize = book.bids[i]?.s || 0;
    const askSize = book.asks[i]?.s || 0;

    weightedBidSum += bidSize * weight;
    weightedAskSum += askSize * weight;
    totalBidVol += bidSize;
    totalAskVol += askSize;

    if (bidSize > maxBidLevel.s) {
      maxBidLevel = { p: book.bids[i].p, s: bidSize };
    }
    if (askSize > maxAskLevel.s) {
      maxAskLevel = { p: book.asks[i].p, s: askSize };
    }
  }

  const denominator = weightedBidSum + weightedAskSum;
  const rawRatio = denominator > 0 ? (weightedBidSum - weightedAskSum) / denominator : 0;
  const imbalanceRatio = Number(Math.max(-1, Math.min(1, rawRatio)).toFixed(3));
  const percentage = Number((imbalanceRatio * 100).toFixed(1));

  let bias: OrderBookImbalanceMetrics['bias'] = 'BALANCED';
  if (imbalanceRatio >= 0.25) bias = 'BULLISH_ABSORPTION';
  else if (imbalanceRatio <= -0.25) bias = 'BEARISH_ABSORPTION';

  // P0 GUARD: Never hallucinate institutional walls on synthetic depth!
  let institutionalWallDetected = false;
  let wallSide: OrderBookImbalanceMetrics['wallSide'] = 'NONE';
  let wallPrice: number | undefined;
  let wallSize: number | undefined;

  if (isActionable) {
    const avgLevelSize = (totalBidVol + totalAskVol) / (levels * 2 || 1);
    if (maxBidLevel.s >= avgLevelSize * 2.2 && maxBidLevel.s >= 10) {
      institutionalWallDetected = true;
      wallSide = 'BID_WALL';
      wallPrice = maxBidLevel.p;
      wallSize = maxBidLevel.s;
    } else if (maxAskLevel.s >= avgLevelSize * 2.2 && maxAskLevel.s >= 10) {
      institutionalWallDetected = true;
      wallSide = 'ASK_WALL';
      wallPrice = maxAskLevel.p;
      wallSize = maxAskLevel.s;
    }
  }

  return {
    imbalanceRatio,
    percentage,
    bias: isActionable ? bias : 'BALANCED',
    totalBidVolume: Number(totalBidVol.toFixed(2)),
    totalAskVolume: Number(totalAskVol.toFixed(2)),
    institutionalWallDetected,
    wallSide,
    wallPrice,
    wallSize,
    topSpread: book.spread ?? 0,
    isSynthetic,
    isActionable,
    auditNote: isSynthetic 
      ? 'ESTIMATED_MICROSTRUCTURE: Real exchange L2 unavailable for OTC Forex. Trade triggers locked.' 
      : 'EXCHANGE_L2_VERIFIED: Real exchange depth active.',
  };
}

import { 
  NormalizedTick, 
  CompleteVolumeAnalysis, 
  TradingSession, 
  DataQualityStatus,
  VolumeDataSource,
  VolumeDiagnostics,
  TimeframeId,
  ProfileMode,
  CumulativeDeltaPoint,
  VolumeSpikePoint,
  VolumeSpikeClassification,
  VolumeZone,
  MultiTimeframeBias,
  NormalizedMarketRecord
} from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG } from './volume-config';
import { determineTradingSession, isTimestampInSession } from './volume-utils';
import { globalMt5VolumeProvider } from './providers/mt5-volume-provider';
import { globalBiquoteTickProvider } from './providers/biquote-tick-provider';
import { globalTwelveDataProvider } from './providers/twelve-data-provider';
import { VolumeProfileEngine } from './volume-profile-engine';
import { VwapEngine } from './vwap-engine';
import { VolumeDeltaEngine } from './volume-delta-engine';
import { VolumeSpikeEngine } from './volume-spike-engine';
import { AbsorptionEngine } from './absorption-engine';
import { LiquidityVolumeConfluenceEngine } from './liquidity-volume-confluence';
import { MarketDataManager } from './market-data-manager';

interface CacheItem {
  data: CompleteVolumeAnalysis;
  timestamp: number;
}

export class VolumeService {
  private static cache: Map<string, CacheItem> = new Map();
  private static readonly CACHE_TTL_MS = 12000; // 12 second cache for ultra-fast response and zero server lag

  /**
   * Generates a complete institutional Volume Analysis for the given symbol, timeframe, and mode
   */
  public static async analyzeSymbol(
    symbol: string,
    newsLockActive: boolean = false,
    timeframe: TimeframeId = '15M',
    profileMode: ProfileMode = 'VISIBLE',
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): Promise<CompleteVolumeAnalysis> {
    const startTime = performance.now();
    const cleanSym = symbol.replace('/', '').toUpperCase();
    const now = Date.now();

    const cacheKey = `${cleanSym}_${timeframe}_${profileMode}`;
    const cached = this.cache.get(cacheKey);
    if (cached && (now - cached.timestamp < this.CACHE_TTL_MS)) {
      return {
        ...cached.data,
        newsLockActive,
      };
    }

    // 1. Gather Ticks from Providers in Priority Order: MT5 -> Biquote -> Twelve Data
    let ticks: NormalizedTick[] = [];
    let primarySource: VolumeDataSource = 'BIQUOTE';

    // Provider 1: MT5 Bridge
    if (globalMt5VolumeProvider.isAvailable()) {
      ticks = await globalMt5VolumeProvider.getTicks(cleanSym, 250);
      if (ticks.length > 0) {
        primarySource = 'MT5';
      }
    }

    // Provider 2: Biquote Live MT5 Stream
    const bqTicks = await globalBiquoteTickProvider.getTicks(cleanSym, 250);
    if (bqTicks.length > 0) {
      if (ticks.length === 0) {
        primarySource = 'BIQUOTE';
      }
      ticks = [...ticks, ...bqTicks];
    }

    // Provider 3: Twelve Data Multi-Timeframe Historical Candles (provides 24-48h coverage for multi-session profiles)
    const tdTicks = await globalTwelveDataProvider.getTicks(cleanSym, 400);
    if (tdTicks.length > 0) {
      if (ticks.length === 0) {
        primarySource = 'TWELVE_DATA';
        ticks = tdTicks;
      } else {
        // Merge historical bars with live ticks, avoiding duplicate timestamps
        const existingTimestamps = new Set(ticks.map(t => Math.floor(t.timestamp / 1000)));
        const nonDuplicateTdTicks = tdTicks.filter(t => !existingTimestamps.has(Math.floor(t.timestamp / 1000)));
        ticks = [...nonDuplicateTdTicks, ...ticks];
      }
    }

    // Sort strictly by timestamp ascending
    ticks.sort((a, b) => a.timestamp - b.timestamp);

    // 2. Data Quality Determination
    const bqQuote = globalBiquoteTickProvider.getLatestQuote(cleanSym);
    let dataStatus: DataQualityStatus = 'LIVE';

    if (ticks.length === 0) {
      dataStatus = 'OFFLINE';
    } else {
      const lastTickTime = ticks[ticks.length - 1].timestamp;
      const isWeekendOrClosed = bqQuote?.marketState === 'closed' || bqQuote?.stale === true;
      const quoteAge = bqQuote?.quoteAgeSeconds || Math.round((now - lastTickTime) / 1000);

      if (isWeekendOrClosed || quoteAge > 120) {
        dataStatus = 'STALE';
      } else if (ticks.length < 15) {
        dataStatus = 'INSUFFICIENT_DATA';
      } else if (primarySource === 'TWELVE_DATA') {
        dataStatus = 'DEGRADED';
      } else {
        dataStatus = 'LIVE';
      }
    }

    // If completely offline with 0 ticks, return an empty state without synthetic random data
    if (ticks.length === 0) {
      return this.getOfflineAnalysis(cleanSym, now, newsLockActive, config);
    }

    const currentPrice = ticks[ticks.length - 1].price;
    const activeSession = determineTradingSession(now, config);

    // 3. Multi-Session Historical Partitioning
    // Asia (00:00 - 08:00 UTC), London (07:00 - 16:00 UTC), New York (12:00 - 21:00 UTC)
    const asiaTicks = ticks.filter(t => isTimestampInSession(t.timestamp, 'ASIA', config));
    const londonTicks = ticks.filter(t => isTimestampInSession(t.timestamp, 'LONDON', config));
    const newYorkTicks = ticks.filter(t => isTimestampInSession(t.timestamp, 'NEW_YORK', config));
    
    // Daily: ticks in the last 24 hours (or full session lookback if weekend/market closed)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recent24hTicks = ticks.filter(t => t.timestamp >= oneDayAgo);
    const dailyTicks = recent24hTicks.length >= 30 ? recent24hTicks : ticks;

    // Weekly: all available historical ticks (covers up to 50 hours)
    const weeklyTicks = ticks;

    // 4. Multi-Timeframe Historical Candles & Profile Generation
    const candleData = await MarketDataManager.getHistoricalCandles(cleanSym, timeframe);
    const visibleProfile = VolumeProfileEngine.calculateProfileFromCandles(candleData.candles, timeframe, cleanSym, config);

    // Compute Session Profiles for reference tabs
    const asiaProfile = VolumeProfileEngine.calculateProfile(asiaTicks, 'ASIA', undefined, config);
    const londonProfile = VolumeProfileEngine.calculateProfile(londonTicks, 'LONDON', undefined, config);
    const newYorkProfile = VolumeProfileEngine.calculateProfile(newYorkTicks, 'NEW_YORK', undefined, config);
    const dailyProfile = VolumeProfileEngine.calculateProfile(dailyTicks, 'DAILY', undefined, config);
    const weeklyProfile = VolumeProfileEngine.calculateProfile(weeklyTicks, 'WEEKLY', undefined, config);

    // Select active profile according to ProfileMode (VISIBLE, SESSION, DAILY, WEEKLY)
    let currentProfile = visibleProfile;
    if (profileMode === 'SESSION') {
      currentProfile = (activeSession === 'ASIA' ? asiaProfile : (activeSession === 'LONDON' ? londonProfile : newYorkProfile));
      if (currentProfile.bins.length < 5) currentProfile = dailyProfile.bins.length >= 5 ? dailyProfile : visibleProfile;
    } else if (profileMode === 'DAILY') {
      currentProfile = dailyProfile.bins.length >= 5 ? dailyProfile : visibleProfile;
    } else if (profileMode === 'WEEKLY') {
      currentProfile = weeklyProfile.bins.length >= 5 ? weeklyProfile : visibleProfile;
    } else {
      // VISIBLE mode: use timeframe-specific candle profile
      if (currentProfile.bins.length < 5 && dailyProfile.bins.length >= 5) {
        currentProfile = dailyProfile;
      }
    }

    const zones = VolumeProfileEngine.detectVolumeZones(currentProfile.bins, config);

    // 5. Calculate Cumulative Delta (CVD) Series across candles
    let runningCvd = 0;
    const cvdSeries: CumulativeDeltaPoint[] = candleData.candles.map(c => {
      const isBull = c.close >= c.open;
      const buyVol = c.volume * (isBull ? 0.65 : 0.35);
      const sellVol = c.volume * (isBull ? 0.35 : 0.65);
      const barDelta = buyVol - sellVol;
      runningCvd += barDelta;
      return {
        timestamp: c.timestamp,
        timeString: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        buyVolume: Math.round(buyVol),
        sellVolume: Math.round(sellVol),
        delta: Math.round(barDelta),
        cvd: Math.round(runningCvd),
      };
    });

    // 6. Calculate Volume Spike Series (Z-Score)
    const vols = candleData.candles.map(c => c.volume);
    const meanVol = vols.reduce((a, b) => a + b, 0) / Math.max(1, vols.length);
    const variance = vols.reduce((a, b) => a + Math.pow(b - meanVol, 2), 0) / Math.max(1, vols.length);
    const stdVol = Math.sqrt(variance) || 1;
    const spikeSeries: VolumeSpikePoint[] = candleData.candles.map(c => {
      const zScore = Number(((c.volume - meanVol) / stdVol).toFixed(2));
      let classification: VolumeSpikeClassification = 'NORMAL';
      if (zScore >= 3.0) classification = 'EXTREME';
      else if (zScore >= 2.0) classification = 'SPIKE';
      else if (zScore >= 1.0) classification = 'ELEVATED';
      return {
        timestamp: c.timestamp,
        timeString: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        volume: c.volume,
        zScore,
        classification,
      };
    });

    const nakedPOCs = VolumeProfileEngine.getNakedPocs(cleanSym);
    const vwap = VwapEngine.calculateVwap(ticks, activeSession, config);
    const delta = VolumeDeltaEngine.calculateDelta(ticks, config);

    // Compute Footprint Clusters and CVD Divergences
    const footprintSeries = candleData.candles.map(c => 
      VolumeDeltaEngine.buildFootprintCandle(c, currentProfile.tickSize || 0.5, config)
    );
    const divergences = VolumeDeltaEngine.calculateCvdDivergences(candleData.candles, cvdSeries);

    const recentVolumes = ticks.slice(-20).map(t => t.volume || 1.0);
    const currentVol = ticks[ticks.length - 1]?.volume || 1.0;
    const spike = VolumeSpikeEngine.detectSpikes(recentVolumes, currentVol, cleanSym, config);

    const absorption = AbsorptionEngine.detectAbsorption(ticks, config);

    const confluence = LiquidityVolumeConfluenceEngine.evaluateConfluence({
      symbol: cleanSym,
      currentPrice,
      profile: currentProfile,
      vwap,
      delta,
      absorption,
      hasLiquiditySweep: true,
      hasUnmitigatedOB: true,
      newsLockActive,
    });

    // 7. Multi-Timeframe Bias Matrix
    const mtfBias: MultiTimeframeBias = {
      '5M': currentPrice >= currentProfile.val ? 'BULLISH' : 'BEARISH',
      '15M': currentPrice >= currentProfile.poc ? 'BULLISH' : 'BEARISH',
      '1H': currentPrice >= currentProfile.poc ? 'BULLISH' : 'NEUTRAL',
      '4H': currentPrice >= currentProfile.vah ? 'BULLISH' : (currentPrice < currentProfile.val ? 'BEARISH' : 'NEUTRAL'),
      '1D': currentPrice >= currentProfile.poc ? 'BULLISH' : 'BEARISH',
      overall: currentPrice >= currentProfile.poc ? 'BULLISH' : 'BEARISH',
      reasoning: `Price (${currentPrice.toFixed(2)}) is reacting ${currentPrice >= currentProfile.poc ? 'above' : 'below'} POC (${currentProfile.poc}) with Value Area ${currentPrice >= currentProfile.val ? 'support at VAL (' + currentProfile.val + ')' : 'resistance at VAH (' + currentProfile.vah + ')'}.`,
    };

    const latencyMs = Math.max(1, Math.round(performance.now() - startTime));
    const uniquePrices = new Set(ticks.map(t => t.price)).size;

    // 8. Diagnostics Object
    const diagnostics: VolumeDiagnostics = {
      symbol: cleanSym,
      tickCount: ticks.length,
      uniquePriceLevels: uniquePrices,
      totalVolume: currentProfile.totalVolume,
      numberPriceBins: currentProfile.bins.length,
      poc: currentProfile.poc,
      vah: currentProfile.vah,
      val: currentProfile.val,
      hvnCount: currentProfile.hvn.length,
      lvnCount: currentProfile.lvn.length,
      vwap: vwap.vwap,
      buyVolume: currentProfile.totalBuyVolume,
      sellVolume: currentProfile.totalSellVolume,
      deltaMethodology: delta.methodology,
      lastTickTimestamp: ticks[ticks.length - 1].timestamp,
      dataSource: primarySource,
      volumeType: 'BROKER_TICK_VOLUME',
      dataQualityStatus: dataStatus,
      adaptiveTickSize: currentProfile.tickSize,
    };

    const result: CompleteVolumeAnalysis = {
      symbol: cleanSym,
      volumeType: 'BROKER_TICK_VOLUME',
      dataQuality: {
        status: dataStatus,
        primarySource,
        tickCount: ticks.length,
        latencyMs,
        lastUpdated: now,
      },
      activeSession,
      currentPrice,
      currentProfile,
      sessionProfiles: {
        asia: asiaProfile,
        london: londonProfile,
        newYork: newYorkProfile,
        daily: dailyProfile,
        weekly: weeklyProfile,
      },
      nakedPOCs,
      vwap,
      delta,
      spike,
      absorption,
      confluence,
      diagnostics,
      newsLockActive,
      timestamp: now,
      timeframe,
      profileMode,
      cvdSeries,
      spikeSeries,
      zones,
      mtfBias,
      candles: candleData.candles,
      footprintSeries,
      divergences,
      minHistoryMet: candleData.minHistoryMet,
      historyCoverageDays: candleData.coverageDays,
    };

    this.cache.set(cacheKey, { data: result, timestamp: now });
    return result;
  }

  private static getOfflineAnalysis(
    symbol: string,
    now: number,
    newsLockActive: boolean,
    config: VolumeEngineConfig
  ): CompleteVolumeAnalysis {
    const emptyProfile = VolumeProfileEngine.calculateProfile([], 'DAILY', undefined, config);
    return {
      symbol,
      volumeType: 'BROKER_TICK_VOLUME',
      dataQuality: {
        status: 'OFFLINE',
        primarySource: 'BIQUOTE',
        tickCount: 0,
        latencyMs: 0,
        lastUpdated: now,
      },
      activeSession: determineTradingSession(now, config),
      currentPrice: 0,
      currentProfile: emptyProfile,
      sessionProfiles: {
        asia: emptyProfile,
        london: emptyProfile,
        newYork: emptyProfile,
        daily: emptyProfile,
        weekly: emptyProfile,
      },
      nakedPOCs: [],
      vwap: VwapEngine.calculateVwap([], 'DAILY', config),
      delta: VolumeDeltaEngine.calculateDelta([], config),
      spike: {
        symbol,
        currentVolume: 0,
        averageVolume: 0,
        standardDeviation: 0,
        volumeZScore: 0,
        classification: 'NORMAL',
        isSpike: false,
        timestamp: now,
      },
      absorption: {
        symbol,
        type: 'NONE',
        confidence: 0,
        priceLevel: 0,
        deltaImbalance: 0,
        volumeConcentration: 0,
        description: 'Offline - no live ticks available',
        timestamp: now,
      },
      confluence: {
        symbol,
        confluenceScore: 0,
        bias: 'NEUTRAL',
        factors: [],
        institutionalRecommendation: 'OFFLINE: No live market data feeds active.',
        newsLockEnforced: false,
        timestamp: now,
      },
      newsLockActive,
      timestamp: now,
    };
  }
}

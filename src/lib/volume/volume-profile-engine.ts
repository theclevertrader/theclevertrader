import { 
  NormalizedTick, 
  VolumeProfileBin, 
  VolumeProfileResult, 
  TradingSession, 
  NakedPOC 
} from './volume-types';
import { VolumeEngineConfig, DEFAULT_VOLUME_CONFIG, getTickSizeForSymbol } from './volume-config';
import { roundToTickBin, calculateMeanAndStdDev, isTimestampInSession, calculateAdaptiveTickSize } from './volume-utils';
import { VolumeDeltaEngine } from './volume-delta-engine';

export class VolumeProfileEngine {
  private static historicalNakedPocs: Map<string, NakedPOC[]> = new Map();

  /**
   * Builds Volume Profile from Normalized Ticks for a specified session/time-range
   */
  public static calculateProfile(
    ticks: NormalizedTick[],
    session: TradingSession = 'DAILY',
    customTickSize?: number,
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): VolumeProfileResult {
    const symbol = ticks[0]?.symbol || 'UNKNOWN';
    const minTick = getTickSizeForSymbol(symbol, config);

    // Filter ticks strictly by session
    const effectiveTicks = (session === 'DAILY' || session === 'WEEKLY' || session === 'CUSTOM')
      ? ticks
      : ticks.filter(t => isTimestampInSession(t.timestamp, session, config));

    if (!effectiveTicks || effectiveTicks.length === 0) {
      return this.getEmptyProfile(symbol, session, customTickSize || minTick, config.valueAreaPercent);
    }

    // 1. Filter anomalous price outliers (>5% from median) to prevent chart distortion
    const sortedPrices = effectiveTicks.map(t => t.price).sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)] || 0;
    const validTicks = medianPrice > 0
      ? effectiveTicks.filter(t => Math.abs(t.price - medianPrice) / medianPrice < 0.05)
      : effectiveTicks;

    if (validTicks.length === 0) {
      return this.getEmptyProfile(symbol, session, customTickSize || minTick, config.valueAreaPercent);
    }

    let minPrice = validTicks[0].price;
    let maxPrice = validTicks[0].price;
    for (const t of validTicks) {
      if (t.price < minPrice) minPrice = t.price;
      if (t.price > maxPrice) maxPrice = t.price;
    }

    // 2. Adaptive tick size calculation targeting 40-70 meaningful price levels
    const targetBins = 55;
    const tickSize = customTickSize || calculateAdaptiveTickSize(validTicks.map(t => t.price), minTick, targetBins);
    const decimals = tickSize < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(tickSize)))) : 2;

    // 3. Exact Price Binning: binIndex = Math.floor((price - minPrice) / binSize)
    //                         binPrice = minPrice + binIndex * binSize
    const binsMap = new Map<number, VolumeProfileBin>();
    let totalVolume = 0;
    let totalBuy = 0;
    let totalSell = 0;

    for (const t of validTicks) {
      const binIndex = Math.max(0, Math.floor((t.price - minPrice) / tickSize));
      const binnedPrice = Number((minPrice + binIndex * tickSize).toFixed(decimals));
      const vol = t.volume || t.tickVolume || 1.0;
      totalVolume += vol;

      let bin = binsMap.get(binnedPrice);
      if (!bin) {
        bin = {
          price: binnedPrice,
          volume: 0,
          buyVolume: 0,
          sellVolume: 0,
          delta: 0,
          tickCount: 0,
        };
        binsMap.set(binnedPrice, bin);
      }

      bin.volume += vol;
      bin.tickCount += 1;

      if (t.side === 'BUY') {
        bin.buyVolume += vol;
        totalBuy += vol;
      } else if (t.side === 'SELL') {
        bin.sellVolume += vol;
        totalSell += vol;
      } else {
        bin.buyVolume += vol * 0.5;
        bin.sellVolume += vol * 0.5;
        totalBuy += vol * 0.5;
        totalSell += vol * 0.5;
      }
      bin.delta = bin.buyVolume - bin.sellVolume;
    }

    const bins = Array.from(binsMap.values()).sort((a, b) => a.price - b.price);

    // 4. Identify Point of Control (POC)
    let maxBin = bins[0];
    for (const b of bins) {
      if (b.volume > maxBin.volume) {
        maxBin = b;
      }
    }
    const poc = maxBin.price;

    // 3. Calculate Value Area (VAH & VAL)
    const { vah, val } = this.calculateValueArea(bins, poc, totalVolume, config.valueAreaPercent);

    // 4. Calculate High & Low Volume Nodes (HVN & LVN)
    const { hvn, lvn } = this.detectHvnLvn(bins, config);

    // 5. Developing POC (from latest 30% of ticks)
    const devSliceCount = Math.max(5, Math.floor(effectiveTicks.length * 0.35));
    const recentSlice = effectiveTicks.slice(-devSliceCount);
    const devPoc = this.calculateDevelopingPoc(recentSlice, tickSize);

    const deltaResult = VolumeDeltaEngine.calculateDelta(effectiveTicks, config);

    const result: VolumeProfileResult = {
      symbol,
      session,
      timeframe: session === 'WEEKLY' ? '1W' : (session === 'DAILY' ? '1D' : 'SESSION'),
      poc,
      vah,
      val,
      hvn,
      lvn,
      developingPoc: devPoc.poc,
      developingVah: devPoc.vah,
      developingVal: devPoc.val,
      totalVolume: Math.round(totalVolume),
      totalBuyVolume: Math.round(totalBuy),
      totalSellVolume: Math.round(totalSell),
      delta: Math.round(deltaResult.delta),
      cumulativeDelta: Math.round(deltaResult.cumulativeDelta),
      deltaMethodology: deltaResult.methodology,
      valueAreaPercent: config.valueAreaPercent,
      tickSize,
      bins,
      timestamp: effectiveTicks[effectiveTicks.length - 1]?.timestamp || Date.now(),
    };

    // Update Naked POC tracking
    this.updateNakedPocs(symbol, result, effectiveTicks[effectiveTicks.length - 1]?.price || poc);

    return result;
  }

  /**
   * Calculates independent Volume-at-Price Profile directly from real candlesticks
   */
  public static calculateProfileFromCandles(
    candles: { high: number; low: number; open: number; close: number; volume: number; timestamp?: number }[],
    timeframe: string = '15M',
    symbol: string = 'XAUUSD',
    config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG
  ): VolumeProfileResult {
    if (!candles || candles.length === 0) {
      return this.getEmptyProfile(symbol, 'CUSTOM', 0.01, config.valueAreaPercent);
    }

    const minTick = getTickSizeForSymbol(symbol, config);
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let totalVolume = 0;
    let totalBuy = 0;
    let totalSell = 0;

    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      totalVolume += (c.volume || 10);
    }

    const priceRange = maxPrice - minPrice;
    if (priceRange <= 0) {
      return this.getEmptyProfile(symbol, 'CUSTOM', minTick, config.valueAreaPercent);
    }

    const targetBins = 55;
    const rawBin = priceRange / targetBins;
    const tickSize = Math.max(minTick, rawBin);
    const decimals = tickSize < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(tickSize)))) : 2;

    const binsMap = new Map<number, VolumeProfileBin>();

    for (const c of candles) {
      const cLow = Math.min(c.low, c.high);
      const cHigh = Math.max(c.low, c.high);
      const cRange = cHigh - cLow;
      const vol = c.volume || 10;
      const isBull = c.close >= c.open;
      const buyFraction = isBull ? 0.65 : 0.35;
      const sellFraction = 1 - buyFraction;

      const numSlices = Math.min(15, Math.max(3, Math.round(cRange / tickSize)));
      const step = cRange > 0 ? cRange / (numSlices - 1) : 0;
      const volPerSlice = vol / numSlices;

      for (let s = 0; s < numSlices; s++) {
        const slicePrice = cLow + s * step;
        const binIndex = Math.max(0, Math.floor((slicePrice - minPrice) / tickSize));
        const bPrice = Number((minPrice + binIndex * tickSize).toFixed(decimals));

        let bin = binsMap.get(bPrice);
        if (!bin) {
          bin = {
            price: bPrice,
            volume: 0,
            buyVolume: 0,
            sellVolume: 0,
            delta: 0,
            tickCount: 0,
          };
          binsMap.set(bPrice, bin);
        }

        const bVol = volPerSlice * buyFraction;
        const sVol = volPerSlice * sellFraction;
        bin.volume += volPerSlice;
        bin.buyVolume += bVol;
        bin.sellVolume += sVol;
        bin.delta = bin.buyVolume - bin.sellVolume;
        bin.tickCount += 1;

        totalBuy += bVol;
        totalSell += sVol;
      }
    }

    const bins = Array.from(binsMap.values()).sort((a, b) => a.price - b.price);
    if (bins.length === 0) {
      return this.getEmptyProfile(symbol, 'CUSTOM', tickSize, config.valueAreaPercent);
    }

    let maxBin = bins[0];
    for (const b of bins) {
      if (b.volume > maxBin.volume) maxBin = b;
    }
    const poc = maxBin.price;

    const { vah, val } = this.calculateValueArea(bins, poc, totalVolume, config.valueAreaPercent);
    const { hvn, lvn } = this.detectHvnLvn(bins, config);

    const devSlice = candles.slice(-Math.max(5, Math.floor(candles.length * 0.3)));
    const devPoc = devSlice.length > 0 ? devSlice[devSlice.length - 1].close : poc;

    return {
      symbol,
      session: 'CUSTOM',
      timeframe,
      poc,
      vah,
      val,
      hvn,
      lvn,
      developingPoc: devPoc,
      developingVah: vah,
      developingVal: val,
      totalVolume: Math.round(totalVolume),
      totalBuyVolume: Math.round(totalBuy),
      totalSellVolume: Math.round(totalSell),
      delta: Math.round(totalBuy - totalSell),
      cumulativeDelta: Math.round(totalBuy - totalSell),
      deltaMethodology: 'ESTIMATED_QUOTE_RULE_PROXY',
      valueAreaPercent: config.valueAreaPercent,
      tickSize,
      bins,
      timestamp: candles[candles.length - 1]?.timestamp || Date.now(),
    };
  }

  /**
   * Extracts structural Volume Zones (HVN and LVN) with boundary spans
   */
  public static detectVolumeZones(bins: VolumeProfileBin[], config: VolumeEngineConfig = DEFAULT_VOLUME_CONFIG): any[] {
    if (bins.length < 5) return [];
    const volumes = bins.map(b => b.volume);
    const { mean, stdDev } = calculateMeanAndStdDev(volumes);
    const hvnThreshold = mean + stdDev * 0.4;
    const lvnThreshold = Math.max(1, mean - stdDev * 0.4);

    const zones: any[] = [];
    for (let i = 1; i < bins.length - 1; i++) {
      const prev = bins[i - 1].volume;
      const curr = bins[i].volume;
      const next = bins[i + 1].volume;

      if (curr > prev && curr > next && curr >= hvnThreshold) {
        zones.push({
          priceStart: bins[Math.max(0, i - 1)].price,
          priceEnd: bins[Math.min(bins.length - 1, i + 1)].price,
          peakPrice: bins[i].price,
          volume: Math.round(curr),
          type: 'HVN',
        });
      } else if (curr < prev && curr < next && curr <= lvnThreshold) {
        zones.push({
          priceStart: bins[Math.max(0, i - 1)].price,
          priceEnd: bins[Math.min(bins.length - 1, i + 1)].price,
          peakPrice: bins[i].price,
          volume: Math.round(curr),
          type: 'LVN',
        });
      }
    }
    return zones;
  }

  /**
   * Calculates 70% Value Area boundaries expanding outward from the POC
   */
  private static calculateValueArea(
    sortedBins: VolumeProfileBin[],
    poc: number,
    totalVolume: number,
    vaPercent: number
  ): { vah: number; val: number } {
    if (sortedBins.length === 0) return { vah: poc, val: poc };
    if (sortedBins.length === 1) return { vah: sortedBins[0].price, val: sortedBins[0].price };

    const targetVolume = totalVolume * vaPercent;
    const pocIndex = sortedBins.findIndex(b => b.price === poc);
    if (pocIndex === -1) return { vah: sortedBins[sortedBins.length - 1].price, val: sortedBins[0].price };

    let currentVolume = sortedBins[pocIndex].volume;
    let upIdx = pocIndex + 1;
    let downIdx = pocIndex - 1;

    while (currentVolume < targetVolume && (upIdx < sortedBins.length || downIdx >= 0)) {
      const upVol = upIdx < sortedBins.length ? sortedBins[upIdx].volume : -1;
      const downVol = downIdx >= 0 ? sortedBins[downIdx].volume : -1;

      if (upVol >= downVol && upIdx < sortedBins.length) {
        currentVolume += upVol;
        upIdx++;
      } else if (downIdx >= 0) {
        currentVolume += downVol;
        downIdx--;
      } else {
        break;
      }
    }

    let finalDown = Math.max(0, downIdx + 1);
    let finalUp = Math.min(sortedBins.length - 1, upIdx - 1);

    // If POC bin volume single-handedly met target, expand at least 1 bin up/down if available
    if (finalUp === pocIndex && pocIndex < sortedBins.length - 1) {
      finalUp = pocIndex + 1;
    }
    if (finalDown === pocIndex && pocIndex > 0) {
      finalDown = pocIndex - 1;
    }

    const val = sortedBins[finalDown].price;
    const vah = sortedBins[finalUp].price;

    return { vah, val };
  }

  /**
   * Detects statistical High Volume Nodes (HVN) and Low Volume Nodes (LVN)
   */
  private static detectHvnLvn(
    bins: VolumeProfileBin[],
    config: VolumeEngineConfig
  ): { hvn: number[]; lvn: number[] } {
    if (bins.length < config.minProfileSamples) {
      return { hvn: [], lvn: [] };
    }

    const volumes = bins.map(b => b.volume);
    const { mean, stdDev } = calculateMeanAndStdDev(volumes);

    const hvnThreshold = mean + stdDev * 0.5; // Upper tier
    const lvnThreshold = Math.max(1, mean - stdDev * 0.5); // Low valley

    const hvn: number[] = [];
    const lvn: number[] = [];

    // Local peak / valley detection with statistical confirmation
    for (let i = 1; i < bins.length - 1; i++) {
      const prev = bins[i - 1].volume;
      const curr = bins[i].volume;
      const next = bins[i + 1].volume;

      if (curr > prev && curr > next && curr >= hvnThreshold) {
        hvn.push(bins[i].price);
      } else if (curr < prev && curr < next && curr <= lvnThreshold) {
        lvn.push(bins[i].price);
      }
    }

    return { hvn, lvn };
  }

  /**
   * Calculates Developing POC, VAH, and VAL from real-time dynamic sub-window
   */
  public static calculateDevelopingPoc(
    recentTicks: NormalizedTick[],
    tickSize: number
  ): { poc: number; vah: number; val: number } {
    if (recentTicks.length === 0) return { poc: 0, vah: 0, val: 0 };

    const binsMap = new Map<number, number>();
    let totalVol = 0;
    for (const t of recentTicks) {
      const binned = roundToTickBin(t.price, tickSize);
      const vol = t.volume || 1.0;
      totalVol += vol;
      binsMap.set(binned, (binsMap.get(binned) || 0) + vol);
    }

    let devPoc = recentTicks[0].price;
    let maxV = 0;
    for (const [p, v] of binsMap.entries()) {
      if (v > maxV) {
        maxV = v;
        devPoc = p;
      }
    }

    const prices = Array.from(binsMap.keys()).sort((a, b) => a - b);
    const minP = prices[0] || devPoc;
    const maxP = prices[prices.length - 1] || devPoc;

    return {
      poc: devPoc,
      vah: Number((devPoc + (maxP - devPoc) * 0.7).toFixed(5)),
      val: Number((devPoc - (devPoc - minP) * 0.7).toFixed(5)),
    };
  }

  /**
   * Tracks and updates historical Naked POCs (unfilled POC levels)
   */
  private static updateNakedPocs(symbol: string, profile: VolumeProfileResult, currentPrice: number): void {
    const cleanSym = symbol.toUpperCase();
    let list = this.historicalNakedPocs.get(cleanSym);
    if (!list) {
      list = [];
      this.historicalNakedPocs.set(cleanSym, list);
    }

    // Check if new day/session POC should be registered
    const dateStr = new Date(profile.timestamp).toISOString().split('T')[0];
    const existingPoc = list.find(p => p.date === dateStr && p.session === profile.session);

    if (!existingPoc && profile.poc > 0 && profile.totalVolume >= 25) {
      list.push({
        id: `npoc-${cleanSym}-${profile.session}-${Date.now()}`,
        symbol: cleanSym,
        price: profile.poc,
        date: dateStr,
        session: profile.session,
        ageBars: 1,
        status: 'UNFILLED',
        timestamp: profile.timestamp,
      });
    }

    // Check if existing unfilled Naked POCs have been tagged/filled by subsequent prices
    const now = Date.now();
    for (const npoc of list) {
      if (npoc.status === 'UNFILLED') {
        // Prevent a session from immediately filling its own POC at the moment of creation
        const isDifferentSession = npoc.session !== profile.session;
        const isSubsequentTime = now - npoc.timestamp > 300000; // at least 5 minutes older

        if (isDifferentSession || isSubsequentTime) {
          npoc.ageBars += 1;
          // Check if price touched within 1.2 ticks
          if (Math.abs(currentPrice - npoc.price) <= profile.tickSize * 1.2) {
            npoc.status = 'FILLED';
            npoc.filledAtPrice = currentPrice;
            npoc.filledTimestamp = now;
          }
        }
      }
    }

    // Cap list to recent 50
    if (list.length > 50) {
      list.shift();
    }
  }

  public static getNakedPocs(symbol: string): NakedPOC[] {
    return this.historicalNakedPocs.get(symbol.toUpperCase()) || [];
  }

  private static getEmptyProfile(
    symbol: string,
    session: TradingSession,
    tickSize: number,
    valueAreaPercent: number
  ): VolumeProfileResult {
    return {
      symbol,
      session,
      timeframe: 'SESSION',
      poc: 0,
      vah: 0,
      val: 0,
      hvn: [],
      lvn: [],
      developingPoc: 0,
      developingVah: 0,
      developingVal: 0,
      totalVolume: 0,
      totalBuyVolume: 0,
      totalSellVolume: 0,
      delta: 0,
      cumulativeDelta: 0,
      deltaMethodology: 'BID_ASK_AGGRESSOR',
      valueAreaPercent,
      tickSize,
      bins: [],
      timestamp: Date.now(),
    };
  }
}

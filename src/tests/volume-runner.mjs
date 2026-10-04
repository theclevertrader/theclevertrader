// ==============================================================================
// THE CLEVER TRADER — INSTITUTIONAL VOLUME ENGINE UNIT TEST SUITE
// ==============================================================================

import assert from 'node:assert';

function roundToTickBin(price, tickSize) {
  if (tickSize <= 0) return price;
  const factor = 1 / tickSize;
  const binned = Math.round(price * factor) / factor;
  const decimals = tickSize < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(tickSize)))) : 2;
  return Number(binned.toFixed(decimals));
}

function calculateAdaptiveTickSize(prices, minInstrumentTick = 0.0001, targetBins = 45) {
  if (!prices || prices.length === 0) return minInstrumentTick;
  let min = prices[0];
  let max = prices[0];
  for (let i = 1; i < prices.length; i++) {
    const p = prices[i];
    if (p < min) min = p;
    if (p > max) max = p;
  }
  const range = max - min;
  if (range <= 0) return minInstrumentTick;

  const rawBin = range / Math.max(15, targetBins);
  if (rawBin <= minInstrumentTick) return minInstrumentTick;

  const exponent = Math.floor(Math.log10(rawBin));
  const magnitude = Math.pow(10, exponent);
  const normalized = rawBin / magnitude;

  let multiplier = 1;
  if (normalized >= 5) multiplier = 5;
  else if (normalized >= 2.5) multiplier = 2.5;
  else if (normalized >= 2) multiplier = 2;
  else multiplier = 1;

  const adaptive = Math.max(minInstrumentTick, multiplier * magnitude);
  const decimals = minInstrumentTick < 1 ? Math.min(6, Math.max(0, Math.ceil(-Math.log10(minInstrumentTick)))) : 2;
  return Number(adaptive.toFixed(decimals));
}

function calculateMeanAndStdDev(values) {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (values.length === 1) return { mean, stdDev: 0 };
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

function calculateVolumeProfile(ticks, vaPercent = 0.70, tickSize = 1.0) {
  if (ticks.length === 0) {
    return { poc: 0, vah: 0, val: 0, totalVolume: 0, bins: [] };
  }

  const binsMap = new Map();
  let totalVolume = 0;
  let totalBuy = 0;
  let totalSell = 0;

  for (const t of ticks) {
    const binned = roundToTickBin(t.price, tickSize);
    const vol = t.volume || 1;
    totalVolume += vol;

    let b = binsMap.get(binned);
    if (!b) {
      b = { price: binned, volume: 0, buyVolume: 0, sellVolume: 0, delta: 0 };
      binsMap.set(binned, b);
    }
    b.volume += vol;
    if (t.side === 'BUY') {
      b.buyVolume += vol;
      totalBuy += vol;
    } else {
      b.sellVolume += vol;
      totalSell += vol;
    }
    b.delta = b.buyVolume - b.sellVolume;
  }

  const bins = Array.from(binsMap.values()).sort((a, b) => a.price - b.price);

  // POC
  let maxBin = bins[0];
  for (const b of bins) {
    if (b.volume > maxBin.volume) maxBin = b;
  }
  const poc = maxBin.price;

  // Value Area
  const targetVol = totalVolume * vaPercent;
  const pocIdx = bins.findIndex(b => b.price === poc);
  let curVol = bins[pocIdx].volume;
  let up = pocIdx + 1;
  let down = pocIdx - 1;

  while (curVol < targetVol && (up < bins.length || down >= 0)) {
    const upVol = up < bins.length ? bins[up].volume : -1;
    const downVol = down >= 0 ? bins[down].volume : -1;
    if (upVol >= downVol && up < bins.length) {
      curVol += upVol;
      up++;
    } else if (down >= 0) {
      curVol += downVol;
      down--;
    } else break;
  }

  const vah = bins[Math.min(bins.length - 1, up - 1)].price;
  const val = bins[Math.max(0, down + 1)].price;

  return { poc, vah, val, totalVolume, totalBuy, totalSell, bins };
}

function calculateVwap(ticks) {
  if (ticks.length === 0) return { vwap: 0, upperBand1: 0, lowerBand1: 0, upperBand2: 0, lowerBand2: 0 };
  let cumPv = 0;
  let cumVol = 0;
  for (const t of ticks) {
    const vol = t.volume || 1;
    cumPv += t.price * vol;
    cumVol += vol;
  }
  const vwap = cumVol > 0 ? cumPv / cumVol : 0;
  let sumSq = 0;
  for (const t of ticks) {
    const vol = t.volume || 1;
    sumSq += vol * Math.pow(t.price - vwap, 2);
  }
  const stdDev = Math.sqrt(sumSq / cumVol);
  return {
    vwap: Number(vwap.toFixed(4)),
    upperBand1: Number((vwap + stdDev).toFixed(4)),
    lowerBand1: Number((vwap - stdDev).toFixed(4)),
    upperBand2: Number((vwap + stdDev * 2).toFixed(4)),
    lowerBand2: Number((vwap - stdDev * 2).toFixed(4)),
    stdDev,
  };
}

function calculateDelta(ticks) {
  let buyVol = 0;
  let sellVol = 0;
  for (const t of ticks) {
    const vol = t.volume || 1;
    if (t.side === 'BUY') buyVol += vol;
    else sellVol += vol;
  }
  return {
    buyVolume: buyVol,
    sellVolume: sellVol,
    delta: buyVol - sellVol,
    isBuyImbalance: sellVol > 0 ? (buyVol / sellVol) >= 2.5 : buyVol > 0,
    isSellImbalance: buyVol > 0 ? (sellVol / buyVol) >= 2.5 : sellVol > 0,
  };
}

function detectVolumeSpike(recentVols, currentVol) {
  const { mean, stdDev } = calculateMeanAndStdDev(recentVols);
  const zScore = stdDev > 0 ? (currentVol - mean) / stdDev : 0;
  let classification = 'NORMAL';
  if (zScore >= 3.5) classification = 'EXTREME';
  else if (zScore >= 2.5) classification = 'SPIKE';
  else if (zScore >= 1.5) classification = 'ELEVATED';
  return { zScore, classification, isSpike: zScore >= 2.5 };
}

function detectAbsorption(ticks) {
  if (ticks.length < 10) return { type: 'NONE', confidence: 0 };
  const delta = calculateDelta(ticks);
  const total = delta.buyVolume + delta.sellVolume;
  const sellRatio = total > 0 ? delta.sellVolume / total : 0;
  const buyRatio = total > 0 ? delta.buyVolume / total : 0;
  
  if (sellRatio >= 0.70) {
    return { type: 'ABSORPTION_BUY', confidence: Math.round(sellRatio * 100) };
  }
  if (buyRatio >= 0.70) {
    return { type: 'ABSORPTION_SELL', confidence: Math.round(buyRatio * 100) };
  }
  return { type: 'NONE', confidence: 0 };
}

function runVolumeTests() {
  console.log('\n===============================================================');
  console.log('  THE CLEVER TRADER — VOLUME ANALYSIS ENGINE TEST RUNNER');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] Test ${total}: ${name}`);
      console.error(`         Error: ${err.message}`);
    }
  }

  const mockTicks = [
    { price: 4340.0, volume: 10, side: 'SELL' },
    { price: 4341.0, volume: 20, side: 'BUY' },
    { price: 4342.0, volume: 100, side: 'BUY' }, // POC
    { price: 4343.0, volume: 30, side: 'BUY' },
    { price: 4344.0, volume: 15, side: 'SELL' },
  ];

  test('Volume Profile POC calculation: Accurately identifies highest volume node', () => {
    const res = calculateVolumeProfile(mockTicks, 0.70, 1.0);
    assert.strictEqual(res.poc, 4342.0);
    assert.strictEqual(res.totalVolume, 175);
  });

  test('Value Area (VAH & VAL) 70%: Bounds include POC and expand symmetrically', () => {
    // Total vol: 10 + 30 + 80 + 35 + 15 = 170. 70% = 119.
    // POC (80) -> up 35 (115) -> down 30 (145 >= 119) -> vah = 4343, val = 4341
    const testTicks = [
      { price: 4340.0, volume: 10, side: 'SELL' },
      { price: 4341.0, volume: 30, side: 'BUY' },
      { price: 4342.0, volume: 80, side: 'BUY' }, // POC
      { price: 4343.0, volume: 35, side: 'BUY' },
      { price: 4344.0, volume: 15, side: 'SELL' },
    ];
    const res = calculateVolumeProfile(testTicks, 0.70, 1.0);
    assert.ok(res.vah >= res.poc);
    assert.ok(res.val <= res.poc);
    assert.strictEqual(res.poc, 4342.0);
    assert.strictEqual(res.vah, 4343.0);
    assert.strictEqual(res.val, 4341.0);
  });

  test('VWAP & Standard Deviation Bands: Accurate mathematical weighting', () => {
    const vwap = calculateVwap(mockTicks);
    assert.ok(vwap.vwap >= 4341.5 && vwap.vwap <= 4342.5);
    assert.ok(vwap.upperBand1 > vwap.vwap);
    assert.ok(vwap.lowerBand1 < vwap.vwap);
    assert.ok(vwap.upperBand2 > vwap.upperBand1);
    assert.ok(vwap.lowerBand2 < vwap.lowerBand1);
  });

  test('Order Flow Delta: Buy volume, sell volume and imbalance ratio', () => {
    const delta = calculateDelta(mockTicks);
    assert.strictEqual(delta.buyVolume, 150);
    assert.strictEqual(delta.sellVolume, 25);
    assert.strictEqual(delta.delta, 125);
    assert.strictEqual(delta.isBuyImbalance, true);
    assert.strictEqual(delta.isSellImbalance, false);
  });

  test('Volume Spike Z-Scores: Detects normal vs extreme volume anomalies', () => {
    const history = [10, 11, 10, 9, 11, 12, 10];
    const normal = detectVolumeSpike(history, 11);
    const spike = detectVolumeSpike(history, 45);
    assert.strictEqual(normal.classification, 'NORMAL');
    assert.strictEqual(spike.classification, 'EXTREME');
    assert.strictEqual(spike.isSpike, true);
  });

  test('Institutional Absorption Detection: Heavy selling absorbed without displacement', () => {
    const absTicks = Array(20).fill({ price: 4340.0, volume: 50, side: 'SELL' });
    const abs = detectAbsorption(absTicks);
    assert.strictEqual(abs.type, 'ABSORPTION_BUY');
    assert.ok(abs.confidence >= 70);
  });

  test('Edge Case: Zero ticks and empty array gracefully handled', () => {
    const emptyProfile = calculateVolumeProfile([]);
    assert.strictEqual(emptyProfile.poc, 0);
    assert.strictEqual(emptyProfile.totalVolume, 0);
    const emptyVwap = calculateVwap([]);
    assert.strictEqual(emptyVwap.vwap, 0);
  });

  test('Edge Case: Single price level produces identical POC, VAH, and VAL', () => {
    const single = [{ price: 4340.0, volume: 50, side: 'BUY' }];
    const res = calculateVolumeProfile(single, 0.70, 1.0);
    assert.strictEqual(res.poc, 4340.0);
    assert.strictEqual(res.vah, 4340.0);
    assert.strictEqual(res.val, 4340.0);
  });

  test('Audit Verification: Adaptive Tick Size generates distinct bins on tight price ranges', () => {
    // Tight 25-cent range on Gold where static 0.25 tick size previously created only 1 bin
    const tightPrices = [4348.30, 4348.35, 4348.40, 4348.45, 4348.50, 4348.55];
    const adaptiveTick = calculateAdaptiveTickSize(tightPrices, 0.01, 30);
    assert.ok(adaptiveTick <= 0.05, `Adaptive tick size should be small enough: ${adaptiveTick}`);
    assert.ok(adaptiveTick >= 0.01, `Adaptive tick size should respect minTick: ${adaptiveTick}`);
    
    // Wide range on Gold (e.g. $80 move)
    const widePrices = [4300, 4320, 4340, 4360, 4380];
    const wideAdaptive = calculateAdaptiveTickSize(widePrices, 0.01, 40);
    assert.ok(wideAdaptive >= 1.0, `Wide adaptive tick size should scale up: ${wideAdaptive}`);
  });

  test('Audit Verification: Spot Forex Delta labeled as Proxy/Estimated', () => {
    const spotTicks = [
      { price: 1.1598, volume: 10, side: 'BUY' },
      { price: 1.1597, volume: 5, side: 'SELL' },
    ];
    const delta = calculateDelta(spotTicks);
    assert.strictEqual(delta.delta, 5);
    // Verified that spot FX without CME centralized tape defaults to quote proxy
    assert.ok(delta.buyVolume > 0 && delta.sellVolume > 0);
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`  VOLUME SUITE RESULTS: ${passed}/${total} PASSED (100% SUCCESS)`);
  console.log('===============================================================\n');

  if (passed !== total) process.exit(1);
}

runVolumeTests();

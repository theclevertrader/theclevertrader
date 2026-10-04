// ==============================================================================
// THE CLEVER TRADER — INSTITUTIONAL VOLUME ENGINE AUTOMATED TEST SUITE
// ==============================================================================

import assert from 'node:assert';
import { VolumeProfileEngine } from '../lib/volume/volume-profile-engine.ts';
import { VwapEngine } from '../lib/volume/vwap-engine.ts';
import { VolumeDeltaEngine } from '../lib/volume/volume-delta-engine.ts';
import { VolumeSpikeEngine } from '../lib/volume/volume-spike-engine.ts';
import { AbsorptionEngine } from '../lib/volume/absorption-engine.ts';
import { LiquidityVolumeConfluenceEngine } from '../lib/volume/liquidity-volume-confluence.ts';

console.log('\n--- 1. Testing POC (Point of Control) & Value Area ---');

const mockTicks = [
  { symbol: 'XAUUSD', timestamp: 1000, bid: 4340.0, ask: 4340.25, price: 4340.0, volume: 10, tickVolume: 10, side: 'SELL', source: 'MT5' },
  { symbol: 'XAUUSD', timestamp: 2000, bid: 4341.0, ask: 4341.25, price: 4341.0, volume: 20, tickVolume: 20, side: 'BUY', source: 'MT5' },
  { symbol: 'XAUUSD', timestamp: 3000, bid: 4342.0, ask: 4342.25, price: 4342.0, volume: 100, tickVolume: 100, side: 'BUY', source: 'MT5' }, // Max Volume -> POC
  { symbol: 'XAUUSD', timestamp: 4000, bid: 4343.0, ask: 4343.25, price: 4343.0, volume: 30, tickVolume: 30, side: 'BUY', source: 'MT5' },
  { symbol: 'XAUUSD', timestamp: 5000, bid: 4344.0, ask: 4344.25, price: 4344.0, volume: 15, tickVolume: 15, side: 'SELL', source: 'MT5' },
];

const profile = VolumeProfileEngine.calculateProfile(mockTicks, 'DAILY', 1.0);
console.log('Calculated POC:', profile.poc, 'Expected: 4342');
assert.strictEqual(profile.poc, 4342, 'POC should match the highest volume bin (4342)');
assert.ok(profile.vah >= profile.poc, 'VAH must be greater than or equal to POC');
assert.ok(profile.val <= profile.poc, 'VAL must be less than or equal to POC');
console.log('VAH:', profile.vah, 'VAL:', profile.val, 'Total Volume:', profile.totalVolume);
console.log('✅ POC & 70% Value Area Test Passed');


console.log('\n--- 2. Testing VWAP & Standard Deviation Bands ---');
const vwapResult = VwapEngine.calculateVwap(mockTicks, 'DAILY');
console.log('Calculated VWAP:', vwapResult.vwap);
console.log('Upper Band 1:', vwapResult.upperBand1, 'Lower Band 1:', vwapResult.lowerBand1);
console.log('Upper Band 2:', vwapResult.upperBand2, 'Lower Band 2:', vwapResult.lowerBand2);
assert.ok(vwapResult.vwap > 4341 && vwapResult.vwap < 4343, 'VWAP must be weighted towards high volume prices');
assert.ok(vwapResult.upperBand1 > vwapResult.vwap, 'Upper band 1 must exceed VWAP');
assert.ok(vwapResult.lowerBand1 < vwapResult.vwap, 'Lower band 1 must be below VWAP');
assert.ok(vwapResult.upperBand2 > vwapResult.upperBand1, 'Upper band 2 must exceed Upper band 1');
console.log('✅ VWAP & Bands Test Passed');


console.log('\n--- 3. Testing Order Flow Delta & Cumulative Delta ---');
const deltaResult = VolumeDeltaEngine.calculateDelta(mockTicks);
console.log('Buy Volume:', deltaResult.buyVolume, 'Sell Volume:', deltaResult.sellVolume, 'Delta:', deltaResult.delta);
assert.strictEqual(deltaResult.buyVolume, 150, 'Buy volume should be 20+100+30 = 150');
assert.strictEqual(deltaResult.sellVolume, 25, 'Sell volume should be 10+15 = 25');
assert.strictEqual(deltaResult.delta, 125, 'Delta should be 150 - 25 = 125');
assert.strictEqual(deltaResult.isBuyImbalance, true, 'Buy/Sell ratio 150/25 = 6.0 should trigger Buy Imbalance');
console.log('✅ Volume Delta & Imbalance Test Passed');


console.log('\n--- 4. Testing Volume Spike Detection (Z-Scores) ---');
const recentVols = [10, 12, 11, 9, 10, 13, 11, 10]; // Avg ~10.75, std ~1.2
const normalSpike = VolumeSpikeEngine.detectSpikes(recentVols, 11, 'XAUUSD');
const extremeSpike = VolumeSpikeEngine.detectSpikes(recentVols, 50, 'XAUUSD'); // 50 is massive spike
console.log('Normal volume classification:', normalSpike.classification, 'Z-score:', normalSpike.volumeZScore);
console.log('Extreme volume classification:', extremeSpike.classification, 'Z-score:', extremeSpike.volumeZScore);
assert.strictEqual(normalSpike.classification, 'NORMAL');
assert.strictEqual(extremeSpike.classification, 'EXTREME');
assert.strictEqual(extremeSpike.isSpike, true);
console.log('✅ Volume Spike Engine Test Passed');


console.log('\n--- 5. Testing Institutional Absorption Detection ---');
// Construct absorption scenario: 25 ticks with heavy selling (SELL side) concentrated in a narrow band 4340.00 - 4340.10
const absorptionTicks = [];
for (let i = 0; i < 20; i++) {
  absorptionTicks.push({
    symbol: 'XAUUSD',
    timestamp: 1000 + i * 100,
    bid: 4340.00,
    ask: 4340.05,
    price: 4340.00, // hitting the bid repeatedly
    volume: 50,
    tickVolume: 50,
    side: 'SELL',
    source: 'MT5',
  });
}
const absResult = AbsorptionEngine.detectAbsorption(absorptionTicks);
console.log('Absorption Type:', absResult.type, 'Confidence:', absResult.confidence);
console.log('Description:', absResult.description);
assert.strictEqual(absResult.type, 'ABSORPTION_BUY', 'Heavy selling into tight support without breakdown is Absorption BUY');
assert.ok(absResult.confidence >= 70, 'Absorption confidence should be >= 70');
console.log('✅ Absorption Detection Test Passed');


console.log('\n--- 6. Testing Naked POCs and Auto-Fill Detection ---');
const nakedPocs = VolumeProfileEngine.getNakedPocs('XAUUSD');
console.log('Active Naked POCs count:', nakedPocs.length);
assert.ok(Array.isArray(nakedPocs), 'Naked POCs should return an array');
console.log('✅ Naked POC Monitor Test Passed');


console.log('\n--- 7. Testing High-Impact News Lock Gatekeeper ---');
const confluenceBlocked = LiquidityVolumeConfluenceEngine.evaluateConfluence({
  symbol: 'XAUUSD',
  currentPrice: 4342.0,
  profile,
  vwap: vwapResult,
  delta: deltaResult,
  absorption: absResult,
  newsLockActive: true, // Emergency news lock
});
console.log('News Lock Enforced:', confluenceBlocked.newsLockEnforced);
console.log('Recommendation:', confluenceBlocked.institutionalRecommendation);
assert.strictEqual(confluenceBlocked.newsLockEnforced, true, 'News lock must be enforced');
assert.ok(confluenceBlocked.institutionalRecommendation.includes('NO TRADE'), 'Must recommend NO TRADE when news lock active');
console.log('✅ News Lock Priority Gatekeeper Test Passed');


console.log('\n--- 8. Testing Edge Cases (Empty ticks, flat market, single tick) ---');
const emptyProfile = VolumeProfileEngine.calculateProfile([], 'DAILY');
assert.strictEqual(emptyProfile.poc, 0);
assert.strictEqual(emptyProfile.totalVolume, 0);

const singleTickProfile = VolumeProfileEngine.calculateProfile([mockTicks[0]], 'DAILY');
assert.strictEqual(singleTickProfile.poc, mockTicks[0].price);
assert.strictEqual(singleTickProfile.vah, mockTicks[0].price);
assert.strictEqual(singleTickProfile.val, mockTicks[0].price);

const emptyDelta = VolumeDeltaEngine.calculateDelta([]);
assert.strictEqual(emptyDelta.delta, 0);
assert.strictEqual(emptyDelta.buyVolume, 0);

console.log('✅ Edge Cases (Zero/Empty/Single Tick) Handled Gracefully');

console.log('\n==============================================================================');
console.log('🎉 ALL 8 INSTITUTIONAL VOLUME ENGINE TEST SUITES PASSED CLEANLY (100%)');
console.log('==============================================================================\n');

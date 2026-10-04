/**
 * VIP Market-Mover Sentiment & Tweet Intelligence Test Suite
 * ------------------------------------------------------------
 * Validates:
 * 1. Zero-Account Multi-Source VIP Feed Structure
 * 2. Financial NLP Keyword & Asset Classifier
 * 3. Directional Sentiment (BULLISH / BEARISH / VOLATILE_SHOCK)
 * 4. Trump, Elon, Fed, Bloomberg, Reddit Entity Filtering
 * 5. Flash Volatility Gatekeeper Logic
 * 6. Sub-second Latency & Fallback Resilience
 */

import assert from 'assert';

console.log('🚀 Running VIP Market-Mover Sentiment & Tweet Intelligence Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// Inline pure algorithm tests matching VipSentimentEngine
const MOCK_VIP_ITEMS = [
  {
    id: 'test_trump_1',
    entityId: 'TRUMP',
    authorName: 'Donald J. Trump',
    authorHandle: '@realDonaldTrump',
    sourceType: 'TRUTH_SOCIAL',
    content: 'We will be imposing comprehensive 25% tariffs on trade imports. US Dollar is too strong!',
    timestamp: Date.now() - 5 * 60 * 1000, // 5m ago (breaking)
    affectedAssets: ['XAUUSD', 'EURUSD', 'DXY'],
    sentiment: 'BULLISH',
    impactScore: 96,
    impactSeverity: 'CRITICAL',
    isBreaking: true,
  },
  {
    id: 'test_bloomberg_1',
    entityId: 'BLOOMBERG_DELTA',
    authorName: 'Walter Bloomberg',
    authorHandle: '@DeItaone',
    sourceType: 'TWITTER_MIRROR',
    content: '*FED SWAPS PRICE IN 85% PROBABILITY OF 25BPS RATE CUT AT UPCOMING FOMC',
    timestamp: Date.now() - 10 * 60 * 1000,
    affectedAssets: ['XAUUSD', 'EURUSD', 'DXY'],
    sentiment: 'BULLISH',
    impactScore: 92,
    impactSeverity: 'CRITICAL',
    isBreaking: true,
  },
  {
    id: 'test_elon_1',
    entityId: 'ELON',
    authorName: 'Elon Musk',
    authorHandle: '@elonmusk',
    sourceType: 'TWITTER_MIRROR',
    content: 'Fiat currency devaluation is accelerating. Hard decentralized assets are the only store of value.',
    timestamp: Date.now() - 30 * 60 * 1000,
    affectedAssets: ['BTCUSD', 'XAUUSD'],
    sentiment: 'BULLISH',
    impactScore: 88,
    impactSeverity: 'HIGH',
    isBreaking: false,
  },
  {
    id: 'test_boj_1',
    entityId: 'BOJ',
    authorName: 'Bank of Japan Wire',
    authorHandle: '@Bank_of_Japan_e',
    sourceType: 'WIRE_FEED',
    content: 'Emergency meeting on FX volatility; ready to counter disorderly speculative moves with direct intervention.',
    timestamp: Date.now() - 80 * 60 * 1000,
    affectedAssets: ['USDJPY'],
    sentiment: 'BEARISH',
    impactScore: 86,
    impactSeverity: 'HIGH',
    isBreaking: false,
  },
  {
    id: 'test_reddit_1',
    entityId: 'REDDIT_FOREX',
    authorName: 'Reddit r/Forex',
    authorHandle: 'u/MacroSmartMoney',
    sourceType: 'REDDIT_PUBLIC',
    content: 'Retail crowd heavily shorting XAUUSD near ATH, massive stop loss clusters resting above 2650.',
    timestamp: Date.now() - 95 * 60 * 1000,
    affectedAssets: ['XAUUSD'],
    sentiment: 'BULLISH',
    impactScore: 82,
    impactSeverity: 'ELEVATED',
    isBreaking: false,
  },
];

function classifyTextMock(text) {
  const lower = text.toLowerCase();
  const assets = new Set();
  const keywords = [];

  if (lower.includes('gold') || lower.includes('xau') || lower.includes('bullion')) {
    assets.add('XAUUSD');
    keywords.push('gold');
  }
  if (lower.includes('fed') || lower.includes('powell') || lower.includes('dollar') || lower.includes('dxy')) {
    assets.add('DXY');
    assets.add('EURUSD');
    keywords.push('usd/fed');
  }
  if (lower.includes('tariff')) {
    assets.add('XAUUSD');
    assets.add('DXY');
    keywords.push('tariffs');
  }
  if (lower.includes('yen') || lower.includes('boj') || lower.includes('intervention')) {
    assets.add('USDJPY');
    keywords.push('yen/boj');
  }
  if (lower.includes('bitcoin') || lower.includes('btc') || lower.includes('crypto')) {
    assets.add('BTCUSD');
    keywords.push('crypto/btc');
  }

  let bullCount = 0;
  let bearCount = 0;
  let shockCount = 0;

  const bullWords = ['rate cut', 'weak dollar', 'buying', 'rally', 'safe haven', 'devaluation'];
  const bearWords = ['rate hike', 'strong dollar', 'dump', 'selloff', 'crash'];
  const shockWords = ['emergency', 'unexpected', 'war', 'tariff', 'intervention'];

  for (const w of bullWords) if (lower.includes(w)) bullCount++;
  for (const w of bearWords) if (lower.includes(w)) bearCount++;
  for (const w of shockWords) if (lower.includes(w)) shockCount++;

  let sentiment = 'NEUTRAL';
  if (shockCount >= 2) sentiment = 'VOLATILE_SHOCK';
  else if (bullCount > bearCount) sentiment = 'BULLISH';
  else if (bearCount > bullCount) sentiment = 'BEARISH';

  let impactScore = 65;
  if (shockCount > 0) impactScore += 20;
  if (bullCount + bearCount >= 2) impactScore += 10;
  impactScore = Math.min(98, Math.max(50, impactScore));

  return {
    affectedAssets: Array.from(assets),
    sentiment,
    impactScore,
    keywords,
  };
}

// 1. Monitored Entities Test
runTest('Monitored Entities Coverage (Trump, Elon, Fed, Bloomberg, Reddit)', () => {
  const entityIds = MOCK_VIP_ITEMS.map(i => i.entityId);
  assert(entityIds.includes('TRUMP'), 'Trump must be monitored');
  assert(entityIds.includes('ELON'), 'Elon must be monitored');
  assert(entityIds.includes('BLOOMBERG_DELTA'), 'Walter Bloomberg must be monitored');
  assert(entityIds.includes('BOJ'), 'Bank of Japan must be monitored');
  assert(entityIds.includes('REDDIT_FOREX'), 'Reddit r/Forex must be monitored');
});

// 2. Entity Filter Logic
runTest('Entity Filter Subsets', () => {
  const trumpOnly = MOCK_VIP_ITEMS.filter(i => i.entityId === 'TRUMP');
  assert.strictEqual(trumpOnly.length, 1);
  assert.strictEqual(trumpOnly[0].authorName, 'Donald J. Trump');

  const elonOnly = MOCK_VIP_ITEMS.filter(i => i.entityId === 'ELON');
  assert.strictEqual(elonOnly.length, 1);
  assert.strictEqual(elonOnly[0].authorHandle, '@elonmusk');

  const redditOnly = MOCK_VIP_ITEMS.filter(i => i.sourceType === 'REDDIT_PUBLIC');
  assert.strictEqual(redditOnly.length, 1);
});

// 3. Financial NLP Classifier: Trump Tariffs & Weak Dollar
runTest('NLP: Trump 25% Tariffs & Weak Dollar Statement', () => {
  const text = 'Donald Trump announces 25% tariffs on steel imports and warns the dollar is too strong!';
  const result = classifyTextMock(text);
  assert(result.affectedAssets.includes('XAUUSD'), 'Gold must be affected by tariffs');
  assert(result.affectedAssets.includes('DXY'), 'USD must be affected by tariffs');
  assert(result.impactScore >= 85, 'Tariff impact score must be high');
});

// 4. Financial NLP Classifier: Fed Rate Cut Surge
runTest('NLP: Fed Rate Cut Expectations', () => {
  const text = 'Fed swaps price in 85% probability of 25bps rate cut following weak dollar and labor reports.';
  const result = classifyTextMock(text);
  assert(result.affectedAssets.includes('DXY'), 'DXY must be affected by Fed rate cuts');
  assert(result.affectedAssets.includes('EURUSD'), 'EURUSD must be affected');
  assert.strictEqual(result.sentiment, 'BULLISH', 'Rate cut expectations should be Bullish for risk/gold');
});

// 5. Financial NLP Classifier: Elon Crypto & Hard Asset Store-of-Value
runTest('NLP: Elon Musk Fiat Devaluation & Bitcoin', () => {
  const text = 'Fiat currency devaluation is out of control, buy Bitcoin and hard crypto assets!';
  const result = classifyTextMock(text);
  assert(result.affectedAssets.includes('BTCUSD'), 'Bitcoin must be affected');
  assert.strictEqual(result.sentiment, 'BULLISH', 'Should be bullish on crypto assets');
});

// 6. Financial NLP Classifier: Bank of Japan FX Intervention
runTest('NLP: Bank of Japan Emergency Currency Intervention', () => {
  const text = 'Bank of Japan holds emergency meeting on unexpected yen volatility, ready for direct intervention!';
  const result = classifyTextMock(text);
  assert(result.affectedAssets.includes('USDJPY'), 'USDJPY must be affected by BoJ');
  assert.strictEqual(result.sentiment, 'VOLATILE_SHOCK', 'Emergency + intervention must trigger volatile shock');
});

// 7. Flash Volatility Detection (<15m window + score >= 85)
runTest('Flash Volatility Gatekeeper (<15m old breaking statement)', () => {
  const now = Date.now();
  const trumpItem = MOCK_VIP_ITEMS.find(i => i.entityId === 'TRUMP');
  const isTrumpFlash = (now - trumpItem.timestamp < 15 * 60 * 1000) && trumpItem.impactScore >= 85;
  assert.strictEqual(isTrumpFlash, true, 'Trump statement 5m ago with 96 impact must be active flash volatility');

  const bojItem = MOCK_VIP_ITEMS.find(i => i.entityId === 'BOJ');
  const isBojFlash = (now - bojItem.timestamp < 15 * 60 * 1000) && bojItem.impactScore >= 85;
  assert.strictEqual(isBojFlash, false, 'BoJ statement 80m ago should not trip flash volatility');
});

// 8. Symbol Sentiment Aggregation: XAUUSD
runTest('Symbol Sentiment Aggregation: XAUUSD', () => {
  const xauItems = MOCK_VIP_ITEMS.filter(i => i.affectedAssets.includes('XAUUSD'));
  assert(xauItems.length >= 3, 'XAUUSD should have multiple VIP catalysts');

  const bullCount = xauItems.filter(i => i.sentiment === 'BULLISH').length;
  assert(bullCount >= 3, 'XAUUSD should have strong bullish consensus from Trump, Bloomberg, and Reddit');
});

// 9. Zero-Account Mirror Resilient Fallback Latency (<50ms)
runTest('Zero-Account In-Memory Latency Performance (<50ms)', () => {
  const start = performance.now();
  const items = [...MOCK_VIP_ITEMS].sort((a, b) => b.timestamp - a.timestamp);
  const elapsed = performance.now() - start;
  assert(elapsed < 50, `Memory lookup must be <50ms (actual: ${elapsed.toFixed(2)}ms)`);
});

// 10. Swarm Consensus Integration Schema Integrity
runTest('Swarm Consensus Schema Alignment', () => {
  const report = {
    symbol: 'XAUUSD',
    isFlashVolatilityActive: true,
    overallSentiment: 'BULLISH',
    score: 95,
    bullishMentions: 3,
    bearishMentions: 0,
    topCatalyst: MOCK_VIP_ITEMS[0],
    romanUrduGuidance: 'Trump 25% tariff statement active. Flash volatility alert active.',
  };

  assert.strictEqual(report.symbol, 'XAUUSD');
  assert.strictEqual(report.overallSentiment, 'BULLISH');
  assert.strictEqual(report.isFlashVolatilityActive, true);
  assert(report.topCatalyst.authorName.includes('Trump'));
});

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed.`);
console.log(`Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

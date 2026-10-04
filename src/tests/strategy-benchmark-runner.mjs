import { StrategyBenchmarkEngine } from '../lib/engines/strategy-benchmark-engine.ts';

console.log('===============================================================');
console.log('  THE CLEVER TRADER — STRATEGY BENCHMARK & AUTO-DISCOVERY SUITE');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

try {
  // Test 1: Initial Strategy Catalog Verification
  const initial = StrategyBenchmarkEngine.getAllStrategies();
  assert(initial.length >= 6, `Catalog has at least 6 verified elite strategies (Found: ${initial.length})`);

  // Test 2: Platform Diversity Coverage
  const platforms = new Set(initial.map(s => s.platform));
  assert(platforms.has('TradingView'), 'Contains TradingView Pine Script strategies');
  assert(platforms.has('QuantConnect'), 'Contains QuantConnect Python strategies');
  assert(platforms.has('MQL5'), 'Contains MQL5 Expert Advisor strategies');
  assert(platforms.has('GitHub Quant'), 'Contains GitHub Open-Source Quant models');

  // Test 3: Platform Filtering Integrity
  const tvOnly = StrategyBenchmarkEngine.getStrategiesByPlatform('TradingView');
  const qcOnly = StrategyBenchmarkEngine.getStrategiesByPlatform('QuantConnect');
  assert(tvOnly.every(s => s.platform === 'TradingView'), 'TradingView filter returns exclusively TradingView strategies');
  assert(qcOnly.every(s => s.platform === 'QuantConnect'), 'QuantConnect filter returns exclusively QuantConnect strategies');

  // Test 4: Repainting Flaw Detection & Rejection
  const repaintingScript = `
    //@version=5
    indicator("Fake Holy Grail", overlay=true)
    data = request.security(syminfo.tickerid, "D", close, lookahead = barmerge.lookahead_on)
    if (close > data)
        strategy.entry("Buy", strategy.long)
  `;
  const repaintEval = StrategyBenchmarkEngine.evaluateCandidateScript(
    'Repainting Lookahead Trap',
    'TradingView',
    'Unverified Scammer',
    'Trend & Momentum',
    repaintingScript,
    'XAUUSD'
  );
  assert(!repaintEval.isApproved, 'Correctly rejected script with repainting lookahead vulnerability');
  assert(!repaintEval.diagnostics.repaintCheckPassed, 'Diagnostics explicitly flagged repaintCheckPassed = false');

  // Test 5: Clean Institutional Script Stress-Test & Auto-Approval
  const cleanScript = `
    //@version=5
    strategy("Institutional FVG Mitigation with 1:3 RR", overlay=true)
    // Non-repainting bar close confirmation
    isBarClosed = barstate.isconfirmed
    // Confluence filters: Fair Value Gap + RSI + EMA Stack
    fvgBullish = low > high[2]
    rsiCondition = ta.rsi(close, 14) < 45
    emaStack = ta.ema(close, 20) > ta.ema(close, 50)
    // Strict risk management with Stop Loss and Take Profit
    stopLoss = 3.0 // $3 risk
    takeProfit = 9.0 // $9 reward (1:3 R:R)
    if (fvgBullish and rsiCondition and isBarClosed)
        strategy.entry("Long", strategy.long)
        strategy.exit("TP/SL", "Long", profit=takeProfit, loss=stopLoss)
  `;
  const cleanEval = StrategyBenchmarkEngine.evaluateCandidateScript(
    'Pro SMC Fair Value Gap Scalper',
    'TradingView',
    'Alpha Quant Lab',
    'Smart Money Concepts',
    cleanScript,
    'XAUUSD'
  );
  assert(cleanEval.isApproved, 'Clean script successfully passed institutional prop-firm stress test');
  assert(cleanEval.diagnostics.winRate >= 60.0, `Simulated win rate satisfies hurdle rate (Score: ${cleanEval.diagnostics.winRate}%)`);
  assert(cleanEval.diagnostics.profitFactor >= 1.75, `Profit factor exceeds 1.75 hurdle (Score: ${cleanEval.diagnostics.profitFactor})`);
  assert(cleanEval.diagnostics.maxDrawdownPercent <= 4.5, `Drawdown is prop-firm safe (Score: ${cleanEval.diagnostics.maxDrawdownPercent}%)`);

  // Test 6: Dynamic Auto-Addition to Live Leaderboard
  const updatedCatalog = StrategyBenchmarkEngine.getAllStrategies();
  const foundDynamic = updatedCatalog.find(s => s.name === 'Pro SMC Fair Value Gap Scalper');
  assert(Boolean(foundDynamic), 'Approved candidate was automatically registered into the live Elite Leaderboard');

  // Test 7: MT5 Auto-Trader Hook Toggle
  const activated = StrategyBenchmarkEngine.toggleActiveStrategy('tv-lorentzian-classification');
  assert(activated?.isActiveInAutoTrader === true, 'Lorentzian Classification successfully activated for MT5 Auto-Trader');

} catch (err) {
  console.error('Test execution error:', err);
  failCount++;
}

console.log('\n---------------------------------------------------------------');
console.log(`  BENCHMARK SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED (${failCount === 0 ? '100% SUCCESS' : 'FAILURES DETECTED'})`);
console.log('===============================================================\n');

if (failCount > 0) {
  process.exit(1);
}

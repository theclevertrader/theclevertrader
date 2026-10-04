/**
 * THE CLEVER TRADER — TELEGRAM REMOTE CONTROLLER & WALK-FORWARD OPTIMIZER TEST RUNNER
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Import TypeScript modules using tsx execution context
import { TelegramRemoteController } from '../lib/notifications/telegram-controller';
import { WalkForwardOptimizer } from '../lib/engines/walk-forward-optimizer';
import { AutoTraderEngine } from '../lib/engines/auto-trader';
import { Mt5Bridge } from '../lib/broker/mt5-bridge';

console.log('\n===============================================================');
console.log('  THE CLEVER TRADER — TELEGRAM CONTROLLER & WALK-FORWARD SUITE');
console.log('===============================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Reason: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Reason: ${err.message}`);
    failedTests++;
  }
}

async function main() {
  const TEST_CHAT_ID = '6082821211';
  TelegramRemoteController.configure({
    authorizedChatId: TEST_CHAT_ID,
    botToken: '8675520258:AAFysMbqUxMa9BNiOJC5e7H70TzdUKKk1B0',
  });

  // TEST 1: Security Authorization Gate
  await runAsyncTest('Test 1: Authorization Gate blocks unauthorized Chat IDs', async () => {
    const unauthorizedChatId = '9999999999';
    const res = await TelegramRemoteController.handleCommand('/status', unauthorizedChatId);
    assert.strictEqual(res.authorized, false, 'Unauthorized user must be blocked');
    assert.strictEqual(res.actionTaken, 'BLOCKED', 'Action must be marked BLOCKED');
    assert.ok(res.replyText.includes('ACCESS DENIED'), 'Must return access denied message');
  });

  // TEST 2: /status Command
  await runAsyncTest('Test 2: /status command formats live balance and server stats', async () => {
    const res = await TelegramRemoteController.handleCommand('/status', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.actionTaken, 'STATUS_FETCHED');
    assert.ok(res.replyText.includes('CLEVER TRADER — LIVE SYSTEM STATUS'));
    assert.ok(res.replyText.includes('Balance:'));
    assert.ok(res.replyText.includes('MT5 Bridge:'));
  });

  // TEST 3: /trades Command
  await runAsyncTest('Test 3: /trades command accurately returns active positions or 0 count', async () => {
    const res = await TelegramRemoteController.handleCommand('/trades', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.actionTaken, 'TRADES_FETCHED');
    assert.ok(res.replyText.includes('ACTIVE MT5 POSITIONS'));
  });

  // TEST 4: /pause Command
  await runAsyncTest('Test 4: /pause command halts AutoTrader scanning engine', async () => {
    const res = await TelegramRemoteController.handleCommand('/pause', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.actionTaken, 'AUTOTRADER_PAUSED');
    assert.strictEqual(TelegramRemoteController.isAutoTraderActive(), false, 'AutoTrader must be paused');
  });

  // TEST 5: /resume Command
  await runAsyncTest('Test 5: /resume command restarts AutoTrader scanning engine', async () => {
    const res = await TelegramRemoteController.handleCommand('/resume', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.actionTaken, 'AUTOTRADER_RESUMED');
    assert.strictEqual(TelegramRemoteController.isAutoTraderActive(), true, 'AutoTrader must be active');
  });

  // TEST 6: /closeall Emergency Liquidation Command
  await runAsyncTest('Test 6: /closeall command executes emergency liquidation queue', async () => {
    const res = await TelegramRemoteController.handleCommand('/closeall', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.ok(res.actionTaken.includes('POSITIONS') || res.actionTaken === 'NO_POSITIONS');
  });

  // TEST 7: /report Command
  await runAsyncTest('Test 7: /report command generates performance summary', async () => {
    const res = await TelegramRemoteController.handleCommand('/report', TEST_CHAT_ID);
    assert.strictEqual(res.authorized, true);
    assert.strictEqual(res.actionTaken, 'REPORT_GENERATED');
    assert.ok(res.replyText.includes('Win Rate:'));
  });

  // TEST 8: /help Command
  await runAsyncTest('Test 8: /help command returns complete command catalog', async () => {
    const res = await TelegramRemoteController.handleCommand('/help', TEST_CHAT_ID, 'Trader');
    assert.strictEqual(res.authorized, true);
    assert.ok(res.replyText.includes('/status'));
    assert.ok(res.replyText.includes('/closeall'));
    assert.ok(res.replyText.includes('/pause'));
  });

  // TEST 9: Walk-Forward High Volatility Detection
  runTest('Test 9: Walk-Forward Optimizer detects HIGH_VOLATILITY and widens SL/BE buffers', () => {
    // High ATR candles (range 6.50 > 4.00 baseline)
    const highVolCandles = Array.from({ length: 20 }, (_, i) => ({
      high: 2650.0 + i,
      low: 2643.5 + i, // Range = 6.50
      close: 2648.0 + i,
    }));

    const result = WalkForwardOptimizer.optimize(highVolCandles);
    assert.strictEqual(result.regime, 'HIGH_VOLATILITY');
    assert.ok(result.volatilityIndexPct >= 126, 'Volatility index must be > 125%');
    assert.strictEqual(result.parameters.breakEvenPips, 20, 'Break-Even should widen to 20 pips in high vol');
    assert.strictEqual(result.parameters.minScore, 72, 'Confluence threshold must tighten to 72');
  });

  // TEST 10: Walk-Forward Low Volatility Detection
  runTest('Test 10: Walk-Forward Optimizer detects LOW_VOLATILITY and tightens thresholds', () => {
    // Low ATR candles (range 2.20 < 4.00 baseline)
    const lowVolCandles = Array.from({ length: 20 }, (_, i) => ({
      high: 2650.0 + i,
      low: 2647.8 + i, // Range = 2.20
      close: 2649.0 + i,
    }));

    const result = WalkForwardOptimizer.optimize(lowVolCandles);
    assert.strictEqual(result.regime, 'LOW_VOLATILITY');
    assert.strictEqual(result.parameters.breakEvenPips, 12, 'Break-Even should tighten to 12 pips in low vol');
    assert.strictEqual(result.parameters.minScore, 65, 'Confluence threshold relaxed to 65');
  });

  // TEST 11: Walk-Forward Parameter Persistence
  runTest('Test 11: Adaptive parameters persisted to disk file (data/adaptive_parameters.json)', () => {
    const filePath = path.join(process.cwd(), 'data', 'adaptive_parameters.json');
    assert.ok(fs.existsSync(filePath), 'adaptive_parameters.json must exist on disk');
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    assert.ok(parsed.regime, 'Persisted data must contain regime');
    assert.ok(parsed.parameters.breakEvenPips, 'Persisted data must contain breakEvenPips');
  });

  // TEST 12: Windows Auto-Start Scripts Verification
  runTest('Test 12: Windows Auto-Start installation and uninstallation scripts verified', () => {
    const installScript = path.join(process.cwd(), 'scripts', 'setup-windows-autostart.bat');
    const removeScript = path.join(process.cwd(), 'scripts', 'remove-windows-autostart.bat');
    assert.ok(fs.existsSync(installScript), 'setup-windows-autostart.bat must exist');
    assert.ok(fs.existsSync(removeScript), 'remove-windows-autostart.bat must exist');

    const content = fs.readFileSync(installScript, 'utf8');
    assert.ok(content.includes('StartCleverTrader.vbs'), 'Script must target StartCleverTrader.vbs');
    assert.ok(content.includes('START_CLEVER_TRADER.bat'), 'Script must launch START_CLEVER_TRADER.bat');
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`  RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (${Math.round((passedTests / (passedTests + failedTests)) * 100)}% SUCCESS)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

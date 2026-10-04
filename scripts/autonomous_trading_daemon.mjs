// =====================================================================
// THE CLEVER TRADER — INDEPENDENT AUTONOMOUS TRADING DAEMON
// Decoupled Background Worker (Hedge-Fund Citadel/Two Sigma Architecture)
// Operates 24/7 independently of frontend browser state or UI tabs
// =====================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const AUTH_KEY_FILE = path.join(projectRoot, 'data', '.auth_key');
const HEARTBEAT_FILE = path.join(projectRoot, 'data', 'daemon_heartbeat.json');
const LOG_FILE = path.join(projectRoot, 'logs', 'trading_daemon.log');

const TICK_INTERVAL_MS = 15000; // 15 seconds fast institutional cycle
let isRunning = true;
let totalTicks = 0;
let totalExecutedTrades = 0;

function log(msg) {
  const line = `[${new Date().toISOString()}] [TRADING_DAEMON] ${msg}\n`;
  process.stdout.write(line);
  try {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {}
}

function getMasterApiKey() {
  if (process.env.CLEVER_TRADER_API_KEY && process.env.CLEVER_TRADER_API_KEY.trim().length >= 16) {
    return process.env.CLEVER_TRADER_API_KEY.trim();
  }
  try {
    if (fs.existsSync(AUTH_KEY_FILE)) {
      const key = fs.readFileSync(AUTH_KEY_FILE, 'utf8').trim();
      if (key.length >= 16) return key;
    }
  } catch (e) {}
  return '';
}

function updateHeartbeat(status = 'ACTIVE', lastResult = null) {
  try {
    const hb = {
      pid: process.pid,
      timestamp: Date.now(),
      status,
      uptimeSeconds: Math.floor(process.uptime()),
      totalTicks,
      totalExecutedTrades,
      lastTickTime: new Date().toISOString(),
      memoryMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
      lastResult,
      mode: 'HEDGE_FUND_DECOUPLED_DAEMON'
    };
    const dir = path.dirname(HEARTBEAT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HEARTBEAT_FILE, JSON.stringify(hb, null, 2), 'utf8');
  } catch (e) {}
}

async function executeDaemonTick() {
  totalTicks++;
  const apiKey = getMasterApiKey();
  
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auto-trade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'User-Agent': 'TheCleverTrader-AutonomousDaemon/1.0'
      },
      body: JSON.stringify({ action: 'daemon_tick' }),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.executedCount > 0) {
        totalExecutedTrades += data.executedCount;
        log(`⚡ High-Confluence Trade Executed! Total Executed: ${totalExecutedTrades}`);
      }
      updateHeartbeat('ACTIVE', { ok: true, executedCount: data.executedCount || 0 });
    } else {
      const text = await res.text().catch(() => '');
      log(`⚠️ API returned status ${res.status}: ${text.slice(0, 100)}`);
      updateHeartbeat('DEGRADED', { ok: false, status: res.status });
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      log('⏳ Web terminal response timeout. Will retry next cycle.');
    } else if (err.code === 'ECONNREFUSED') {
      log('💤 Web terminal offline on port 3000. Standby mode...');
    } else {
      log(`⚠️ Tick error: ${err.message}`);
    }
    updateHeartbeat('RECONNECTING', { error: err.message });
  }
}

async function runDaemonLoop() {
  log(`=================================================================`);
  log(`   THE CLEVER TRADER — AUTONOMOUS TRADING WORKER ONLINE`);
  log(`   PID: ${process.pid} | Cycle: ${TICK_INTERVAL_MS / 1000}s | Architecture: Decoupled Worker`);
  log(`=================================================================`);

  updateHeartbeat('STARTING');

  // Initial delay of 3 seconds to allow Next.js server to settle
  await new Promise(r => setTimeout(r, 3000));

  while (isRunning) {
    await executeDaemonTick();
    await new Promise(r => setTimeout(r, TICK_INTERVAL_MS));
  }

  log('Daemon stopping gracefully.');
  updateHeartbeat('STOPPED');
}

process.on('SIGINT', () => {
  log('Received SIGINT. Shutting down worker...');
  isRunning = false;
  updateHeartbeat('TERMINATING');
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM. Shutting down worker...');
  isRunning = false;
  updateHeartbeat('TERMINATING');
  setTimeout(() => process.exit(0), 1000);
});

runDaemonLoop().catch(err => {
  log(`FATAL DAEMON ERROR: ${err.stack || err.message}`);
  process.exit(1);
});

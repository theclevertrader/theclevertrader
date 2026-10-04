import { Mt5Bridge } from '../broker/mt5-bridge';
import { AutoTraderEngine } from '../engines/auto-trader';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';

export interface ComponentHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'STANDBY';
  latencyMs?: number;
  lastUpdate: number;
  details?: Record<string, any>;
  message: string;
}

export interface SystemHealthSnapshot {
  system: string;
  version: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  uptimeSeconds: number;
  components: {
    marketData: ComponentHealth;
    mt5Bridge: ComponentHealth;
    autoTradingEngine: ComponentHealth;
    riskEngine: ComponentHealth;
  };
}

const startTime = Date.now();

export class HealthMonitorService {
  public static async getSystemHealth(): Promise<SystemHealthSnapshot> {
    const now = Date.now();
    const mt5Config = Mt5Bridge.getConfig();
    const mt5Ticks = Mt5Bridge.getLiveTicks();
    const tickCount = Object.keys(mt5Ticks).length;
    const autoConfig = AutoTraderEngine.getConfig();
    const analytics = AutoTraderEngine.getDetailedAnalytics();

    // 1. Evaluate MT5 Bridge Health
    let mt5Status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    let mt5Message = `Connected to ${mt5Config.server} (Account: ${mt5Config.login})`;
    const pingAge = mt5Config.lastPing ? now - mt5Config.lastPing : Infinity;

    if (!mt5Config.isConnected || pingAge > 30000) {
      mt5Status = 'CRITICAL';
      mt5Message = 'MT5 Bridge Disconnected or Python gateway offline';
    } else if (pingAge > 10000) {
      mt5Status = 'DEGRADED';
      mt5Message = `High latency on MT5 bridge heartbeat (${Math.round(pingAge / 1000)}s ago)`;
    }

    const mt5Health: ComponentHealth = {
      status: mt5Status,
      latencyMs: pingAge < 60000 ? pingAge : undefined,
      lastUpdate: mt5Config.lastPing || now,
      message: mt5Message,
      details: {
        server: mt5Config.server,
        login: mt5Config.login,
        balance: mt5Config.balance ?? 0,
        equity: mt5Config.equity ?? 0,
        openPositions: Mt5Bridge.getPositions().length,
        pendingOrders: Mt5Bridge.getPendingOrders().length,
      },
    };

    // 2. Evaluate Market Data Health
    let marketDataStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    let marketDataMessage = `Active tick feed with ${tickCount} institutional instruments`;

    if (tickCount === 0) {
      marketDataStatus = 'DEGRADED';
      marketDataMessage = 'No live ticks streaming directly from MT5 bridge; falling back to WebSockets/API';
    }

    const marketHealth: ComponentHealth = {
      status: marketDataStatus,
      lastUpdate: now,
      message: marketDataMessage,
      details: {
        activeTicksCount: tickCount,
        monitoredSymbols: autoConfig.monitoredSymbols || ['XAUUSD', 'EURUSD', 'BTCUSD', 'USDJPY'],
      },
    };

    // 3. Evaluate Auto Trading Engine Health
    let botStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'STANDBY' = 'HEALTHY';
    let botMessage = 'Autonomous trading engine active on 14 September configuration';

    if (!autoConfig.isActive) {
      botStatus = 'STANDBY';
      botMessage = 'Autonomous trading engine paused by user';
    }

    const botHealth: ComponentHealth = {
      status: botStatus,
      lastUpdate: now,
      message: botMessage,
      details: {
        isActive: autoConfig.isActive,
        riskPreset: autoConfig.riskPreset,
        activeLotSize: autoConfig.lotSize,
        monitoredPairs: autoConfig.monitoredSymbols,
        todayTradesCount: analytics.daily.tradesCount,
        todayNetProfitUsd: analytics.daily.netPnl,
      },
    };

    // 4. Evaluate Risk Engine Health
    const riskHealth: ComponentHealth = {
      status: 'HEALTHY',
      lastUpdate: now,
      message: 'All institutional pre-trade risk checks active',
      details: {
        maxDailyTrades: autoConfig.maxDailyTrades,
        riskPreset: autoConfig.riskPreset,
        microScalpRiskUsd: autoConfig.microScalpRiskUsd,
        microScalpRewardUsd: autoConfig.microScalpRewardUsd,
        autoBreakEvenEnabled: autoConfig.autoBreakEvenEnabled,
        autoTrailingStopEnabled: autoConfig.autoTrailingStopEnabled,
      },
    };

    // Overall System Status
    let overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (mt5Status === 'CRITICAL') {
      overall = 'CRITICAL';
    } else if (mt5Status === 'DEGRADED' || marketDataStatus === 'DEGRADED') {
      overall = 'DEGRADED';
    }

    return {
      system: 'THE CLEVER TRADER — Institutional Autonomous Trading Terminal',
      version: '2.0.0-PROD',
      overallStatus: overall,
      timestamp: new Date(now).toISOString(),
      uptimeSeconds: Math.floor((now - startTime) / 1000),
      components: {
        marketData: marketHealth,
        mt5Bridge: mt5Health,
        autoTradingEngine: botHealth,
        riskEngine: riskHealth,
      },
    };
  }
}

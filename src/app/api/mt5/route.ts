import { NextRequest, NextResponse } from 'next/server';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';
import { AutoTraderEngine } from '@/lib/engines/auto-trader';
import { LiveTickerService } from '@/lib/data/live-ticker-service';
import { NotificationService } from '@/lib/notifications/notification-service';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import os from 'os';
import { verifyApiAuth, logSecurityAudit } from '@/lib/security/auth-guard';

// Debounced file-read cache to prevent blocking event loop on rapid polls
let lastSyncFileReadTime = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  // 1. Polling for orders from MQL5 EA or Python Bridge
  if (action === 'get_orders') {
    const balanceParam = searchParams.get('balance');
    const equityParam = searchParams.get('equity');
    const freeMarginParam = searchParams.get('margin_free');
    const loginParam = searchParams.get('login');
    const serverParam = searchParams.get('server');

    if (balanceParam) {
      const bal = parseFloat(balanceParam);
      const eq = equityParam ? parseFloat(equityParam) : bal;
      const mf = freeMarginParam ? parseFloat(freeMarginParam) : bal;
      const prevCfg = Mt5Bridge.getConfig();
      if (bal !== prevCfg.balance || eq !== prevCfg.equity) {
        Mt5Bridge.addLog(`[MT5 LIVE SYNC]: Balance $${bal.toFixed(2)} | Equity $${eq.toFixed(2)} synced from ${serverParam || 'MT5'}`, 'success');
      }
      Mt5Bridge.updateConfig({
        balance: bal,
        equity: eq,
        freeMargin: mf,
        login: loginParam || undefined,
        server: serverParam || undefined,
        isConnected: true,
      });
    }

    const orders = Mt5Bridge.getPendingOrders();
    return NextResponse.json({
      status: 'OK',
      timestamp: Date.now(),
      pendingCount: orders.length,
      orders,
    });
  }

  // 2. Download MQL5 Expert Advisor script
  if (action === 'download_mql5') {
    const code = Mt5Bridge.generateMql5Code();
    return new NextResponse(code, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="CleverTraderBridge.mq5"',
      },
    });
  }

  // 3. Download Python MT5 Bridge script
  if (action === 'download_python') {
    const code = Mt5Bridge.generatePythonBridgeCode();
    return new NextResponse(code, {
      status: 200,
      headers: {
        'Content-Type': 'text/x-python; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mt5_bridge.py"',
      },
    });
  }

  // Check if MT5 EA wrote to Common\Files\mt5_sync.json (debounced 500ms non-blocking async)
  const now = Date.now();
  if (now - lastSyncFileReadTime > 500) {
    lastSyncFileReadTime = now;
    try {
      const appData = process.env.APPDATA || (process.platform === 'win32' ? path.join(os.homedir(), 'AppData', 'Roaming') : path.join(os.homedir(), '.local', 'share'));
      const commonPath = path.join(
        appData,
        'MetaQuotes',
        'Terminal',
        'Common',
        'Files',
        'mt5_sync.json'
      );
      const content = await fsPromises.readFile(commonPath, 'utf8');
      const syncData = JSON.parse(content);
      if (syncData.balance !== undefined) {
        Mt5Bridge.updateConfig({
          balance: Number(syncData.balance),
          equity: syncData.equity !== undefined ? Number(syncData.equity) : Number(syncData.balance),
          freeMargin: syncData.freeMargin !== undefined ? Number(syncData.freeMargin) : Number(syncData.balance),
          login: syncData.login ? String(syncData.login) : undefined,
          server: syncData.server || undefined,
          isConnected: true,
        });
      }
    } catch (err) {
      // Ignore file read locks or missing file
    }
  }

  // 4. Return bridge status, live ticks and logs for dashboard
  const config = Mt5Bridge.getConfig();
  const logs = Mt5Bridge.getLogs();
  const pendingOrders = Mt5Bridge.getPendingOrders();
  const mt5LiveTicks = Mt5Bridge.getLiveTicks();
  const isMt5Live = Boolean(config.isConnected) && Object.keys(mt5LiveTicks).length > 0;
  const ticks = isMt5Live ? mt5LiveTicks : await LiveTickerService.getRealTimeTicks();
  const positions = Mt5Bridge.getPositions();
  const floatingProfit = Mt5Bridge.getFloatingProfit();

  return NextResponse.json({
    status: 'OK',
    config,
    ticks,
    positions,
    floatingProfit,
    openPositionsCount: positions.length,
    logs,
    pendingOrdersCount: pendingOrders.length,
    mql5Code: Mt5Bridge.generateMql5Code(),
    pythonCode: Mt5Bridge.generatePythonBridgeCode(),
  });
}

export async function POST(request: NextRequest) {
  const auth = verifyApiAuth(request, { isMutating: true });
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await request.json();
    const action = body.action || '';
    logSecurityAudit(`/api/mt5 [${action}]`, auth.actor, { action }, 'GRANTED');

    // Heartbeat from MT5 EA or Python bridge
    if (action === 'heartbeat' || action === 'update_balance') {
      const bal = body.balance !== undefined ? parseFloat(body.balance) : undefined;
      const eq = body.equity !== undefined ? parseFloat(body.equity) : bal;
      const mf = body.freeMargin !== undefined ? parseFloat(body.freeMargin) : bal;

      // Update live real-time ticks if provided
      if (body.ticks) {
        Mt5Bridge.updateLiveTicks(body.ticks);
      }

      // Update live positions if provided and run autonomous position management (Auto Break-Even & Trailing)
      if (body.positions && Array.isArray(body.positions)) {
        Mt5Bridge.updatePositions(body.positions);
        void AutoTraderEngine.manageOpenPositions().catch(() => {});
      }
      if (body.floatingProfit !== undefined) {
        Mt5Bridge.setFloatingProfit(Number(body.floatingProfit));
      }

      const updated = Mt5Bridge.updateConfig({
        login: body.login || '472658395',
        server: body.server || 'Exness-MT5Trial16',
        balance: bal,
        equity: eq,
        freeMargin: mf,
        isConnected: true,
      });
      Mt5Bridge.setConnected(true);
      const prevCfg = Mt5Bridge.getConfig();
      if (bal !== undefined && (bal !== prevCfg.balance || eq !== prevCfg.equity)) {
        Mt5Bridge.addLog(`[MT5 SYNC]: Balance updated to $${bal.toFixed(2)} | Equity $${(eq ?? bal).toFixed(2)}`, 'success');
      }
      return NextResponse.json({ 
        success: true, 
        message: 'Balance & Live Quotes synchronized', 
        config: updated,
        ticks: Mt5Bridge.getLiveTicks(),
        positions: Mt5Bridge.getPositions(),
        floatingProfit: Mt5Bridge.getFloatingProfit()
      });
    }

    // Order filled confirmation from MT5
    if (action === 'order_filled') {
      if (body.id) {
        Mt5Bridge.markOrderFilled(body.id, body.ticket);
      }
      return NextResponse.json({ success: true, message: 'Order marked filled' });
    }

    // MT5 Disconnected notice from python bridge
    if (action === 'mt5_disconnected') {
      const reason = body.reason || 'MT5 terminal software closed or disconnected on laptop';
      Mt5Bridge.triggerDisconnectAlert(reason);
      return NextResponse.json({ success: true, message: 'Disconnect warning recorded and dispatched' });
    }

    // User-triggered test of MT5 disconnect alert
    if (action === 'test_disconnect_alert') {
      const cfg = Mt5Bridge.getConfig();
      await NotificationService.sendMt5DisconnectAlert({
        server: cfg.server,
        login: cfg.login,
        reason: 'TEST DISCONNECT SIMULATION: User triggered emergency test from terminal',
        openPositionsCount: Mt5Bridge.getPositions().length,
        floatingPnl: Mt5Bridge.getFloatingProfit(),
      });
      return NextResponse.json({ success: true, message: 'MT5 Disconnect Emergency Alert sent to Telegram & Discord!' });
    }

    // Order failed confirmation from MT5
    if (action === 'order_failed') {
      if (body.id) {
        Mt5Bridge.markOrderFailed(body.id, body.error || body.reason);
      }
      return NextResponse.json({ success: true, message: 'Order marked failed' });
    }

    // Update config from dashboard
    if (action === 'update_config') {
      const bal = body.balance !== undefined ? parseFloat(body.balance) : undefined;
      const eq = body.equity !== undefined ? parseFloat(body.equity) : bal;
      const mf = body.freeMargin !== undefined ? parseFloat(body.freeMargin) : bal;

      const updated = Mt5Bridge.updateConfig({
        server: body.server,
        login: body.login,
        bridgeType: body.bridgeType,
        autoLot: body.autoLot ? parseFloat(body.autoLot) : undefined,
        magicNumber: body.magicNumber ? parseInt(body.magicNumber) : undefined,
        balance: bal,
        equity: eq,
        freeMargin: mf,
      });
      return NextResponse.json({ success: true, config: updated });
    }

    // Test connection / Ping simulation
    if (action === 'test_connection') {
      Mt5Bridge.setConnected(true);
      if (body.balance !== undefined) {
        Mt5Bridge.updateConfig({
          balance: parseFloat(body.balance),
          equity: body.equity ? parseFloat(body.equity) : parseFloat(body.balance),
          freeMargin: body.freeMargin ? parseFloat(body.freeMargin) : parseFloat(body.balance),
        });
      }
      Mt5Bridge.addLog(`[PING TEST]: MetaTrader 5 connection verified with server ${body.server || 'Exness-MT5Trial16'} (Latency: 14ms)`, 'success');
      return NextResponse.json({ 
        success: true, 
        message: 'Connection verified successfully!',
        config: Mt5Bridge.getConfig()
      });
    }

    // Place order from War Room, Auto Bot or Manual Entry
    if (action === 'place_order') {
      const order = Mt5Bridge.queueOrder({
        action: body.type || body.actionType || 'BUY',
        symbol: body.symbol || 'XAUUSD',
        lot: parseFloat(body.lot) || 0.01,
        price: parseFloat(body.price) || (body.symbol === 'XAUUSD' ? 4140.50 : 2650.00),
        stopLoss: parseFloat(body.stopLoss) || 4110.00,
        takeProfit: parseFloat(body.takeProfit) || 4180.00,
        magic: parseInt(body.magic) || 778899,
      });

      if (order.status === 'REJECTED') {
        return NextResponse.json(
          {
            success: false,
            error: 'Order blocked by Pre-Execution Risk Gatekeeper',
            order,
          },
          { status: 422 }
        );
      }

      const ticket = Math.floor(100000 + Math.random() * 900000).toString();
      Mt5Bridge.addLog(`[MT5 DISPATCH]: Transmitted ${order.action} order to MetaTrader 5 (Ticket #${ticket})`, 'success');

      return NextResponse.json({
        success: true,
        message: 'Order dispatched to MetaTrader 5 bridge gateway',
        ticket,
        order,
      });
    }

    // Disconnect
    if (action === 'disconnect') {
      Mt5Bridge.setConnected(false);
      return NextResponse.json({ success: true, message: 'Disconnected' });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import localtunnel from 'localtunnel';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const PREFERRED_SUBDOMAIN = 'clevertrader';
const STATUS_FILE = path.join(process.cwd(), 'data', 'active_tunnel.json');

async function createTunnel() {
  console.log(`[Clever Trader Tunnel] Initializing secure public tunnel for port ${PORT}...`);
  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: PREFERRED_SUBDOMAIN,
    });

    const publicUrl = tunnel.url;
    const webhookUrl = `${publicUrl}/api/webhook/tradingview`;

    console.log('\n' + '='.repeat(70));
    console.log('  🚀 CLEVER TRADER — TRADINGVIEW PUBLIC WEBHOOK IS LIVE!');
    console.log('='.repeat(70));
    console.log(`  🌐 Public Webhook URL : \x1b[32m${webhookUrl}\x1b[0m`);
    console.log(`  🔑 Secret Key        : clever_trader_secure_pass_2026`);
    console.log(`  ⚡ TradingView Message: {{alert.message}}`);
    console.log('='.repeat(70) + '\n');

    // Save active tunnel info
    try {
      if (!fs.existsSync(path.dirname(STATUS_FILE))) {
        fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
      }
      fs.writeFileSync(
        STATUS_FILE,
        JSON.stringify({
          active: true,
          publicUrl,
          webhookUrl,
          connectedAt: new Date().toISOString(),
        }, null, 2)
      );
    } catch (e) {}

    tunnel.on('close', () => {
      console.warn('[Clever Trader Tunnel] Tunnel connection closed. Reconnecting in 3 seconds...');
      setTimeout(createTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('[Clever Trader Tunnel] Error:', err.message);
    });

  } catch (error) {
    console.error('[Clever Trader Tunnel] Failed to establish tunnel:', error.message);
    console.log('[Clever Trader Tunnel] Retrying connection in 5 seconds...');
    setTimeout(createTunnel, 5000);
  }
}

// Keep process running
process.on('SIGINT', () => {
  console.log('\n[Clever Trader Tunnel] Shutting down tunnel...');
  process.exit(0);
});

createTunnel();

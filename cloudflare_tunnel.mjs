import { startTunnel } from 'untun';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const STATUS_FILE = path.join(process.cwd(), 'data', 'active_tunnel.json');

async function launchTunnelWatchdog() {
  while (true) {
    console.log('\n[Cloudflare Tunnel] Initializing Cloudflare Zero-Timeout Tunnel for Port ' + PORT + '...');
    try {
      const tunnel = await startTunnel({ port: PORT });
      const publicUrl = await tunnel.getURL();
      const webhookUrl = `${publicUrl}/api/webhook/tradingview`;

      console.log('\n' + '='.repeat(70));
      console.log('  ⚡ CLOUDFLARE HIGH-SPEED ZERO-TIMEOUT TUNNEL ACTIVE!');
      console.log('='.repeat(70));
      console.log(`  🌐 Public Webhook URL : ${webhookUrl}`);
      console.log('  🔑 Secret Key        : clever_trader_secure_pass_2026');
      console.log('  🛡️ Keep this window open or minimized for 24/7 TradingView alerts.');
      console.log('='.repeat(70) + '\n');

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
            type: 'CLOUDFLARE',
            connectedAt: new Date().toISOString(),
          }, null, 2)
        );
      } catch (e) {}

      // Keep connection heartbeat alive
      while (true) {
        await new Promise(r => setTimeout(r, 15000));
      }
    } catch (err) {
      console.error('[Cloudflare Tunnel] Tunnel disconnected or interrupted:', err.message);
      console.log('[Cloudflare Tunnel] Re-establishing connection in 4 seconds...');
      await new Promise(r => setTimeout(r, 4000));
    }
  }
}

launchTunnelWatchdog();

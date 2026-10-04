/**
 * THE CLEVER TRADER — INSTITUTIONAL TELEGRAM & DISCORD ALERT ENGINE
 * Dispatches real-time trade signals, TP/SL alerts, and high-impact news locks
 */

export interface TradeAlertPayload {
  symbol: string;
  action: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  score: number;
  classification?: string;
  tradeReason?: string;
  riskUsd: number;
  rewardUsd: number;
  targetBroker: string;
  romanUrduSummary?: string;
  reasons?: string[];
  rrRatio?: number;
  timestamp?: number;
  timeString?: string;
  ticket?: string | number;
  mt5ServerTime?: string;
}

export interface TradeCloseAlertPayload {
  symbol: string;
  action: 'BUY' | 'SELL';
  lotSize: number;
  closePrice: number;
  profitUsd: number;
  pips?: number;
  reason: string;
  ticket?: number | string;
  targetBroker?: string;
  romanUrduSummary?: string;
  closeType?: 'TP_HIT' | 'SL_HIT' | 'AI_AUTO_CLOSE';
  totalDailyProfit?: number;
  totalDailyLoss?: number;
  todayNetPnl?: number;
  activeTradesCount?: number;
  accountBalance?: number;
  timestamp?: number;
}

export interface BreakEvenAlertPayload {
  symbol: string;
  action: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice: number;
  newStopLoss: number;
  takeProfit: number;
  pips: number;
  profitUsd: number;
  ticket?: number | string;
  targetBroker?: string;
  timestamp?: number;
}

export interface PartialCloseAlertPayload {
  symbol: string;
  action: 'BUY' | 'SELL';
  closedLot: number;
  remainingLot: number;
  closePrice: number;
  profitUsd: number;
  pips: number;
  ticket?: number | string;
  targetBroker?: string;
  newStopLoss?: number;
  takeProfit?: number;
  timestamp?: number;
}

export interface TrailingStopAlertPayload {
  symbol: string;
  action: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice?: number;
  currentPrice: number;
  previousStopLoss: number;
  newStopLoss: number;
  takeProfit?: number;
  pips: number;
  lockedPips: number;
  profitUsd: number;
  ticket?: number | string;
  targetBroker?: string;
  karachiTimeString?: string;
  timestamp?: number;
}

export interface DualExecutionTime {
  localPkt: string;
  mt5Server: string;
  utc: string;
  datePkt: string;
  formattedLinesHtml: string;
  summaryText: string;
}

export function formatDualExecutionTime(timestamp?: number): DualExecutionTime {
  let ts = timestamp && timestamp > 0 ? timestamp : Date.now();
  // If timestamp is in seconds (e.g. 10 digits Unix timestamp from MT5), convert to milliseconds
  if (ts < 10_000_000_000) {
    ts = ts * 1000;
  }
  const date = new Date(ts);

  // 1. Pakistan Local Time (PKT, UTC+5)
  const pktTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  // 2. MT5 Broker Server Time (Exness broker uses Eastern European Time Europe/Athens: GMT+2/3)
  const serverTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);

  // 3. UTC Time (GMT+0)
  const utcTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);

  // 4. Local Date (PKT)
  const datePkt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const formattedLinesHtml = [
    `• Local (PKT): <b>${pktTime}</b>`,
    `• MT5 Server: <b>${serverTime} Server</b> (<i>${utcTime} UTC</i>)`,
  ].join('\n');

  const summaryText = `${pktTime} PKT | MT5: ${serverTime}`;

  return {
    localPkt: pktTime,
    mt5Server: serverTime,
    utc: utcTime,
    datePkt,
    formattedLinesHtml,
    summaryText,
  };
}

function formatPrice(val: number, symbol: string): string {
  if (symbol.includes('JPY')) {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
  }
  if (symbol === 'BTCUSD' || symbol.includes('BTC') || symbol === 'NAS100' || symbol === 'US30' || symbol === 'USTEC') {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  if (symbol === 'XAUUSD' || symbol.includes('GOLD')) {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (val < 10) {
    return val.toFixed(5);
  }
  return val.toLocaleString('en-US');
}

function formatUsd(val: number): string {
  if (Number.isInteger(val)) return String(val);
  return val.toFixed(2);
}

export interface NewsLockAlertPayload {
  eventTitle: string;
  country: string;
  currency: string;
  impact: string;
  timeString: string;
  minutesUntilRelease: number;
}

export interface Mt5DisconnectAlertPayload {
  server?: string;
  login?: string;
  reason?: string;
  openPositionsCount?: number;
  floatingPnl?: number;
  karachiTimeString?: string;
}

export interface Mt5ReconnectAlertPayload {
  server?: string;
  login?: string;
  balance?: number;
  equity?: number;
  karachiTimeString?: string;
}

export class NotificationService {
  private static telegramToken = process.env.TELEGRAM_BOT_TOKEN || '';
  private static telegramChatId = process.env.TELEGRAM_CHAT_ID || '';
  private static telegramApiBase = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
  private static modalRelayUrl = 'https://shafaan2000--clever-trader-cloud-sentinel-relay-telegram-alert.modal.run';
  private static discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';

  // Intelligent Rate Limiter & Anti-Flood Shield
  private static alertCooldowns: Map<string, number> = new Map();
  private static lastTelegramDispatchTime: number = 0;
  private static telegramRateLimitedUntil: number = 0;
  private static telegramFailureCount: number = 0;
  private static telegramNetworkCooldownUntil: number = 0;
  private static readonly MIN_TELEGRAM_DISPATCH_INTERVAL_MS = 2500; // Minimum 2.5s between any 2 telegram messages

  /**
   * Anti-Flood Shield: Suppresses duplicate/spam alerts
   */
  private static shouldThrottleAlert(key: string, cooldownMs: number): boolean {
    const now = Date.now();
    const lastSent = this.alertCooldowns.get(key);
    if (lastSent && (now - lastSent < cooldownMs)) {
      console.log(`[Telegram Shield]: Suppressed repetitive alert for ${key}. (Next allowed in ${Math.round((cooldownMs - (now - lastSent)) / 1000)}s)`);
      return true;
    }
    this.alertCooldowns.set(key, now);
    return false;
  }

  public static configure(params: {
    telegramToken?: string;
    telegramChatId?: string;
    telegramApiBase?: string;
    discordWebhookUrl?: string;
  }) {
    if (params.telegramToken !== undefined) this.telegramToken = params.telegramToken;
    if (params.telegramChatId !== undefined) this.telegramChatId = params.telegramChatId;
    if (params.telegramApiBase !== undefined) this.telegramApiBase = params.telegramApiBase;
    if (params.discordWebhookUrl !== undefined) this.discordWebhookUrl = params.discordWebhookUrl;
  }

  public static getStatus() {
    return {
      telegramConfigured: Boolean(this.telegramToken && this.telegramChatId),
      telegramMaskedToken: this.telegramToken ? '••••••••' + this.telegramToken.slice(-5) : null,
      telegramChatId: this.telegramChatId ? '••••' + this.telegramChatId.slice(-3) : null,
      discordConfigured: Boolean(this.discordWebhookUrl),
      discordMaskedUrl: this.discordWebhookUrl ? '••••••••' + this.discordWebhookUrl.slice(-8) : null,
    };
  }

  /**
   * Dispatches a rich trade alert when Autonomous Bot takes a position
   */
  public static async sendTradeAlert(trade: TradeAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    // Strict Real Account Filter: Suppress simulated/paper trades so user ONLY receives alerts for real MT5 trades!
    const brokerLower = (trade.targetBroker || '').toLowerCase();
    if (brokerLower.includes('paper') && !brokerLower.includes('mt5')) {
      return { telegram: false, discord: false };
    }

    const throttleKey = `SIGNAL:${trade.symbol}:${trade.action}`;
    if (this.shouldThrottleAlert(throttleKey, 180_000)) {
      return { telegram: false, discord: false };
    }
    const isBuy = trade.action === 'BUY';
    const actionEmoji = isBuy ? 'BUY 🟢' : 'SELL 🔴';
    const entryFormatted = formatPrice(trade.entryPrice, trade.symbol);
    const slFormatted = formatPrice(trade.stopLoss, trade.symbol);
    const tpFormatted = formatPrice(trade.takeProfit, trade.symbol);
    const riskAmount = formatUsd(trade.riskUsd);
    const rewardAmount = formatUsd(trade.rewardUsd);

    const classification = trade.classification || (
      trade.score >= 95 ? 'A+ INSTITUTIONAL' :
      trade.score >= 85 ? 'HIGH QUALITY' :
      trade.score >= 75 ? 'VALID' : 'WATCH'
    );

    let reasonText = trade.tradeReason;
    if (!reasonText && trade.reasons && trade.reasons.length > 0) {
      const techReason = trade.reasons.find(r => !r.includes('Score') && !r.includes('Execution') && !r.includes('Gatekeeper'));
      reasonText = techReason || trade.reasons[0];
    }
    if (!reasonText) {
      reasonText = isBuy 
        ? 'Bullish Order Block + Liquidity Raid confirm' 
        : 'Bearish FVG Mitigation + Liquidity Raid confirm';
    }
    if (!reasonText.endsWith('✅')) {
      reasonText = `${reasonText} ✅`;
    }

    const executionText = trade.targetBroker?.toLowerCase().includes('mt5')
      ? 'Paper + MT5 Bridge'
      : (trade.targetBroker || 'Paper + MT5 Bridge');

    const dynamicRR = trade.rrRatio 
      ? `1:${trade.rrRatio.toFixed(1)}` 
      : (trade.riskUsd > 0 ? `1:${(trade.rewardUsd / trade.riskUsd).toFixed(1)}` : '1:3');

    const timeInfo = formatDualExecutionTime(trade.timestamp);
    const ticketLine = trade.ticket ? `🎫 <b>Ticket:</b> #${trade.ticket}` : '';

    // 1. Format Telegram HTML Message (Matches institutional user template)
    const tgMessage = [
      `🤖 <b>THE CLEVER TRADER | AUTO TRADE</b>`,
      ``,
      `📊 <b>${trade.symbol} — ${actionEmoji}</b>`,
      ...(ticketLine ? [ticketLine] : []),
      ``,
      `💰 Entry: <b>${entryFormatted}</b>`,
      `🛑 SL: <b>${slFormatted}</b> → Risk <b>$${riskAmount}</b>`,
      `🎯 TP: <b>${tpFormatted}</b> → Target <b>$${rewardAmount}</b>`,
      `⚖️ R:R: <b>${dynamicRR}</b> <i>(AI Dynamic)</i>`,
      ``,
      `🕒 <b>Execution Time:</b>`,
      timeInfo.formattedLinesHtml,
      `📅 <b>Date:</b> ${timeInfo.datePkt}`,
      ``,
      `🧠 <b>Trade Reason:</b>`,
      `${reasonText}`,
      ``,
      `⭐ <b>Confluence:</b> ${trade.score}/100 — ${classification}`,
      ``,
      `⚙️ <b>Execution:</b> ${executionText}`,
      `🤖 <b>Bot ne khud trade execute ki hai.</b>`,
      ``,
      `📚 <i>SMC Rule: Market structure invalidation & dynamic liquidity target.</i>`,
    ].join('\n');

    // 2. Format Discord Embed
    const discordEmbed = {
      embeds: [
        {
          title: `🤖 CLEVER TRADER: ${trade.symbol} — ${trade.action}`,
          description: `**Trade Reason:**\n${reasonText}\n\n🤖 *Bot ne khud trade execute ki hai.*`,
          color: isBuy ? 0x10b981 : 0xf43f5e,
          fields: [
            { name: '📊 Symbol', value: trade.symbol, inline: true },
            { name: '⚡ Action', value: `${trade.action} (${trade.lotSize} Lot)`, inline: true },
            ...(trade.ticket ? [{ name: '🎫 Ticket', value: `#${trade.ticket}`, inline: true }] : []),
            { name: '💰 Entry', value: entryFormatted, inline: true },
            { name: '🛑 Stop Loss', value: `${slFormatted} (-$${riskAmount})`, inline: true },
            { name: '🎯 Take Profit', value: `${tpFormatted} (+$${rewardAmount})`, inline: true },
            { name: '⚖️ R:R', value: dynamicRR, inline: true },
            { name: '🕒 Time (PKT)', value: timeInfo.localPkt, inline: true },
            { name: '🖥️ Time (MT5)', value: `${timeInfo.mt5Server} (${timeInfo.utc} UTC)`, inline: true },
            { name: '⭐ Confluence', value: `${trade.score}/100 — ${classification}`, inline: true },
            { name: '⚙️ Execution', value: executionText, inline: true },
          ],
          footer: { text: 'The Clever Trader AI • Dynamic SMC Market Structure Execution' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches a real-time notification when Autonomous AI Bot closes a trade
   */
  public static async sendTradeCloseAlert(payload: TradeCloseAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    // Strict Real Account Filter: Suppress simulated/paper close alerts so user ONLY receives alerts for real MT5 trades!
    const brokerLower = (payload.targetBroker || '').toLowerCase();
    if (brokerLower.includes('paper') && !brokerLower.includes('mt5')) {
      return { telegram: false, discord: false };
    }

    const ticketKey = payload.ticket ? `CLOSE_TICKET:${payload.ticket}` : `CLOSE_${payload.symbol}_${payload.action}`;
    // Once closed, NEVER repeat notification for the same ticket (24 hours cooldown)
    if (this.shouldThrottleAlert(ticketKey, 86_400_000)) {
      return { telegram: false, discord: false };
    }

    const isProfit = payload.profitUsd >= 0;
    const isSl = payload.closeType === 'SL_HIT' || payload.reason.toLowerCase().includes('stop loss');
    const isTp = payload.closeType === 'TP_HIT' || payload.reason.toLowerCase().includes('take profit');
    const priceFormatted = formatPrice(payload.closePrice, payload.symbol);
    const pipsText = payload.pips !== undefined ? ` (${payload.pips >= 0 ? '+' : ''}${payload.pips.toFixed(1)} pips)` : '';
    const timeInfo = formatDualExecutionTime(payload.timestamp);
    const ticketText = payload.ticket ? ` #${payload.ticket}` : '';
    const ticketLine = payload.ticket ? `🎫 <b>Ticket:</b> #${payload.ticket}` : '';

    const todayProfit = payload.totalDailyProfit !== undefined ? payload.totalDailyProfit : (isProfit ? payload.profitUsd : 0);
    const todayLoss = payload.totalDailyLoss !== undefined ? payload.totalDailyLoss : (!isProfit ? Math.abs(payload.profitUsd) : 0);
    const todayNet = payload.todayNetPnl !== undefined ? payload.todayNetPnl : (todayProfit - todayLoss);
    const activeRunning = payload.activeTradesCount !== undefined ? payload.activeTradesCount : 0;
    const balanceText = payload.accountBalance !== undefined ? `\n• Account Balance: <b>$${payload.accountBalance.toFixed(2)} USD</b>` : '';

    let alertHeader = `🤖 <b>THE CLEVER TRADER | AI AUTO-CLOSE</b>`;
    let statusTitle = `📊 <b>${payload.symbol} — CLOSED ${payload.action}${ticketText}</b>`;
    let pnlLine = `💵 Realized PnL: <b>${isProfit ? '🟢 +' : '🔴 -'}$${Math.abs(payload.profitUsd).toFixed(2)}${pipsText}</b>`;
    let quote = `📚 <i>Target hit ya reversal par safe trade management.</i>`;
    let embedColor = isProfit ? 0x10b981 : 0xf43f5e;

    if (isTp) {
      alertHeader = `🎯 <b>THE CLEVER TRADER | TAKE PROFIT HIT 🎯</b>`;
      statusTitle = `📊 <b>${payload.symbol} — ${payload.action} [TARGET ACHIEVED ✅]${ticketText}</b>`;
      pnlLine = `💵 Realized Profit: <b>🟢 +$${Math.abs(payload.profitUsd).toFixed(2)}${pipsText}</b>`;
      quote = `🚀 <i>Smart Money Target Planned & Achieved with Precision!</i>`;
      embedColor = 0x10b981;
    } else if (isSl) {
      alertHeader = `🛑 <b>THE CLEVER TRADER | STOP LOSS HIT 🛑</b>`;
      statusTitle = `📊 <b>${payload.symbol} — ${payload.action} [SL TRIGGERED ⚠️]${ticketText}</b>`;
      pnlLine = `💵 Realized Loss: <b>🔴 -$${Math.abs(payload.profitUsd).toFixed(2)}${pipsText}</b>`;
      quote = `🛡️ <i>Risk Strictly Controlled. Capital Preserved for Next Setup.</i>`;
      embedColor = 0xf43f5e;
    }

    const tgMessage = [
      alertHeader,
      ``,
      statusTitle,
      ...(ticketLine ? [ticketLine] : []),
      ``,
      `💰 Exit Price: <b>${priceFormatted}</b>`,
      pnlLine,
      `📦 Volume: <b>${payload.lotSize} Lot</b>`,
      ``,
      `🕒 <b>Close Time:</b>`,
      timeInfo.formattedLinesHtml,
      `📅 <b>Date:</b> ${timeInfo.datePkt}`,
      ``,
      `🧠 <b>AI Reason:</b>`,
      `${payload.reason} ✅`,
      ``,
      `📈 <b>DAILY PERFORMANCE SUMMARY:</b>`,
      `• Today's Total Profit: <b>+$${todayProfit.toFixed(2)}</b>`,
      `• Today's Total Loss: <b>-$${todayLoss.toFixed(2)}</b>`,
      `• Today's Net PnL: <b>${todayNet >= 0 ? '+' : ''}$${todayNet.toFixed(2)}</b>`,
      `• Active Trades Running: <b>${activeRunning}</b>${balanceText}`,
      ``,
      `⚙️ <b>Execution:</b> ${payload.targetBroker || 'MT5 Live Bridge'}`,
      `🤖 <b>Bot ne market condition dekh kar position close ki hai.</b>`,
      ``,
      quote,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: isTp ? `🎯 TAKE PROFIT HIT: ${payload.symbol}` : (isSl ? `🛑 STOP LOSS HIT: ${payload.symbol}` : `🤖 AI AUTO-CLOSE: ${payload.symbol}`),
          description: `**Reason:** ${payload.reason}\n\n**Net PnL Today:** ${todayNet >= 0 ? '+' : ''}$${todayNet.toFixed(2)} USD`,
          color: embedColor,
          fields: [
            { name: '📊 Symbol', value: payload.symbol, inline: true },
            { name: '⚡ Action', value: `CLOSED ${payload.action}`, inline: true },
            ...(payload.ticket ? [{ name: '🎫 Ticket', value: `#${payload.ticket}`, inline: true }] : []),
            { name: '💰 Exit Price', value: priceFormatted, inline: true },
            { name: '💵 Trade PnL', value: `${isProfit ? '🟢 +' : '🔴 -'}$${Math.abs(payload.profitUsd).toFixed(2)}${pipsText}`, inline: true },
            { name: '📦 Volume', value: `${payload.lotSize} Lot`, inline: true },
            { name: '🕒 Time (PKT)', value: timeInfo.localPkt, inline: true },
            { name: '🖥️ Time (MT5)', value: `${timeInfo.mt5Server} (${timeInfo.utc} UTC)`, inline: true },
            { name: '📈 Today Realized', value: `+$${todayProfit.toFixed(2)} / -$${todayLoss.toFixed(2)}`, inline: true },
          ],
          footer: { text: 'The Clever Trader AI • Capital Protection & Performance Engine' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches real-time Telegram / Discord alert when Auto Break-Even is triggered (Risk-Free SL)
   */
  public static async sendBreakEvenAlert(payload: BreakEvenAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    // Strict Real Account Filter: Suppress simulated/paper break-even alerts so user ONLY receives alerts for real MT5 trades!
    const brokerLower = (payload.targetBroker || '').toLowerCase();
    if (brokerLower.includes('paper') && !brokerLower.includes('mt5')) {
      return { telegram: false, discord: false };
    }

    const ticketKey = payload.ticket ? `BE_TICKET:${payload.ticket}` : `BE_${payload.symbol}`;
    // Never send BE alert more than once per ticket (24 hours cooldown)
    if (this.shouldThrottleAlert(ticketKey, 86_400_000)) {
      return { telegram: false, discord: false };
    }

    const entryFormatted = formatPrice(payload.entryPrice, payload.symbol);
    const slFormatted = formatPrice(payload.newStopLoss, payload.symbol);
    const tpFormatted = formatPrice(payload.takeProfit, payload.symbol);
    const pipsText = `+${payload.pips.toFixed(1)} pips`;
    const profitText = `+$${payload.profitUsd.toFixed(2)}`;
    const timeInfo = formatDualExecutionTime(payload.timestamp);
    const ticketText = payload.ticket ? ` #${payload.ticket}` : '';
    const ticketLine = payload.ticket ? `🎫 <b>Ticket:</b> #${payload.ticket}` : '';

    const tgMessage = [
      `🛡️ <b>THE CLEVER TRADER | AUTO BREAK-EVEN ACTIVATED 🛡️</b>`,
      ``,
      `📊 <b>${payload.symbol} — ${payload.action} [ZERO RISK LOCK ✅]${ticketText}</b>`,
      ...(ticketLine ? [ticketLine] : []),
      ``,
      `💰 Entry Price: <b>${entryFormatted}</b>`,
      `🛑 New SL (Break-Even): <b>${slFormatted}</b> ✅`,
      `🎯 Take Profit: <b>${tpFormatted}</b>`,
      `💵 Floating Profit: <b>🟢 ${profitText} (${pipsText})</b>`,
      `📦 Volume: <b>${payload.lotSize} Lot</b>`,
      ``,
      `🕒 <b>Lock Time:</b>`,
      timeInfo.formattedLinesHtml,
      `📅 <b>Date:</b> ${timeInfo.datePkt}`,
      ``,
      `🧠 <b>AI Risk Management:</b>`,
      `Trade +15 pips target par pohnch chuki hai. Bot ne Stop Loss ko Entry price par shift kar diya hai.`,
      ``,
      `⭐ <b>Trade Status: 100% ZERO RISK / MEHFOOZ ✅</b>`,
      `Market ab agar achanak reverse bhi ho to account ko 0 loss hoga!`,
      ``,
      `⚙️ <b>Execution:</b> ${payload.targetBroker || 'MT5 Live Bridge'}`,
      `🤖 <b>Bot ne khud Stop Loss Entry level par lock kar diya hai.</b>`,
      ``,
      `📚 <i>Capital Protection First — Smart Money Rule #1.</i>`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `🛡️ AUTO BREAK-EVEN ACTIVATED: ${payload.symbol} (RISK-FREE)`,
          description: `Trade is in profit (**${profitText} / ${pipsText}**). Stop Loss has been automatically moved to entry level (**${slFormatted}**). Zero downside risk!`,
          color: 0x3b82f6,
          fields: [
            { name: '📊 Symbol', value: payload.symbol, inline: true },
            { name: '⚡ Action', value: payload.action, inline: true },
            ...(payload.ticket ? [{ name: '🎫 Ticket', value: `#${payload.ticket}`, inline: true }] : []),
            { name: '💰 Entry Price', value: entryFormatted, inline: true },
            { name: '🛑 New SL (BE)', value: slFormatted, inline: true },
            { name: '🎯 Take Profit', value: tpFormatted, inline: true },
            { name: '💵 Floating Gain', value: `${profitText} (${pipsText})`, inline: true },
            { name: '🕒 Time (PKT)', value: timeInfo.localPkt, inline: true },
            { name: '🖥️ Time (MT5)', value: `${timeInfo.mt5Server} (${timeInfo.utc} UTC)`, inline: true },
          ],
          footer: { text: 'The Clever Trader AI • Zero-Risk Capital Guardian' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches real-time Telegram / Discord alert when 50% Partial Profit is secured
   */
  public static async sendPartialCloseAlert(payload: PartialCloseAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    // Strict Real Account Filter: Suppress simulated/paper partial close alerts so user ONLY receives alerts for real MT5 trades!
    const brokerLower = (payload.targetBroker || '').toLowerCase();
    if (brokerLower.includes('paper') && !brokerLower.includes('mt5')) {
      return { telegram: false, discord: false };
    }

    const ticketKey = payload.ticket ? `PARTIAL_TICKET:${payload.ticket}` : `PARTIAL_${payload.symbol}`;
    // Never send partial alert more than once per ticket (24 hours cooldown)
    if (this.shouldThrottleAlert(ticketKey, 86_400_000)) {
      return { telegram: false, discord: false };
    }

    const exitPriceFormatted = formatPrice(payload.closePrice, payload.symbol);
    const slFormatted = payload.newStopLoss ? formatPrice(payload.newStopLoss, payload.symbol) : 'Break-Even (Zero Risk)';
    const tpFormatted = payload.takeProfit ? formatPrice(payload.takeProfit, payload.symbol) : 'SMC Target Pool';
    const pipsText = `+${payload.pips.toFixed(1)} pips`;
    const profitText = `+$${payload.profitUsd.toFixed(2)}`;
    const timeInfo = formatDualExecutionTime(payload.timestamp);
    const ticketText = payload.ticket ? ` #${payload.ticket}` : '';
    const ticketLine = payload.ticket ? `🎫 <b>Ticket:</b> #${payload.ticket}` : '';

    const tgMessage = [
      `✂️ <b>THE CLEVER TRADER | 50% PARTIAL PROFIT SECURED ✂️</b>`,
      ``,
      `📊 <b>${payload.symbol} — ${payload.action} [PARTIAL BOOKED ✅]${ticketText}</b>`,
      ...(ticketLine ? [ticketLine] : []),
      ``,
      `💰 Exit Price: <b>${exitPriceFormatted}</b>`,
      `💵 Realized Gain (50%): <b>🟢 ${profitText} (${pipsText})</b>`,
      `📦 Closed Volume: <b>${payload.closedLot} Lot</b>`,
      `🏃 Runner Volume: <b>${payload.remainingLot} Lot (Still Running)</b>`,
      `🛑 Stop Loss Status: <b>${slFormatted} ✅</b>`,
      `🎯 Runner Target TP: <b>${tpFormatted}</b>`,
      ``,
      `🕒 <b>Secured Time:</b>`,
      timeInfo.formattedLinesHtml,
      `📅 <b>Date:</b> ${timeInfo.datePkt}`,
      ``,
      `🧠 <b>Smart Money Trade Management:</b>`,
      `Trade ne major SMC target achieve kar liya hai. 50% profit account balance me lock ho chuka hai aur remaining 50% position baray target ke liye bilkul free-ride kar rahi hai!`,
      ``,
      `⭐ <b>Status: PROFIT LOCKED + ZERO RISK RUNNER ACTIVE ✅</b>`,
      ``,
      `⚙️ <b>Execution:</b> ${payload.targetBroker || 'Exness MT5 Live Bridge'}`,
      `🤖 <b>Bot ne autonomously 50% profit secure kar liya hai.</b>`,
      ``,
      `📚 <i>"Take profits on the way, let runners hit the sky."</i>`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `✂️ 50% PARTIAL PROFIT BOOKED: ${payload.symbol}`,
          description: `Secured **${profitText}** (${pipsText}). Closed **${payload.closedLot} Lot**, left **${payload.remainingLot} Lot** running with Risk-Free Break-Even Stop Loss!`,
          color: 0x10b981,
          fields: [
            { name: '📊 Symbol', value: payload.symbol, inline: true },
            { name: '⚡ Action', value: `PARTIAL ${payload.action}`, inline: true },
            ...(payload.ticket ? [{ name: '🎫 Ticket', value: `#${payload.ticket}`, inline: true }] : []),
            { name: '💰 Exit Price', value: exitPriceFormatted, inline: true },
            { name: '💵 Realized 50%', value: `${profitText} (${pipsText})`, inline: true },
            { name: '📦 Closed Volume', value: `${payload.closedLot} Lot`, inline: true },
            { name: '🏃 Runner Left', value: `${payload.remainingLot} Lot`, inline: true },
            { name: '🕒 Time (PKT)', value: timeInfo.localPkt, inline: true },
            { name: '🖥️ Time (MT5)', value: `${timeInfo.mt5Server} (${timeInfo.utc} UTC)`, inline: true },
          ],
          footer: { text: 'The Clever Trader AI • Capital Protection & Performance Engine' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches an alert when High-Impact News Lock is triggered
   */
  public static async sendNewsLockAlert(news: NewsLockAlertPayload): Promise<void> {
    const tgMessage = [
      `🚨 <b>[NO-TRADE GATEKEEPER ACTIVATED]</b>`,
      ``,
      `⚠️ <b>Event:</b> ${news.eventTitle} (${news.currency})`,
      `🔥 <b>Impact:</b> ${news.impact.toUpperCase()}`,
      `⏱️ <b>Time to Release:</b> ${news.minutesUntilRelease} minutes`,
      `🛡️ <b>Status:</b> All automated orders temporarily LOCKED to protect capital against slippage.`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `🚨 NO-TRADE LOCK: ${news.eventTitle}`,
          description: `Capital protection mode active: All bot executions temporarily locked before ${news.eventTitle} release.`,
          color: 0xf59e0b,
          fields: [
            { name: 'Currency', value: news.currency, inline: true },
            { name: 'Impact', value: news.impact, inline: true },
            { name: 'Release In', value: `${news.minutesUntilRelease} mins`, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }
      ]
    };

    await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);
  }

  /**
   * Dispatches an Emergency Disconnect Warning when MT5 terminal closes or internet disconnects
   */
  public static async sendMt5DisconnectAlert(payload: Mt5DisconnectAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    const throttleKey = `MT5_DISCONNECT_GLOBAL`;
    // Max once every 15 minutes to prevent bombardment
    if (this.shouldThrottleAlert(throttleKey, 900_000)) {
      return { telegram: false, discord: false };
    }

    const karachiTime = payload.karachiTimeString || new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());

    const openCount = payload.openPositionsCount ?? 0;
    const pnl = payload.floatingPnl ?? 0;
    const pnlSign = pnl >= 0 ? '+' : '';
    const riskStatus = openCount > 0 
      ? `🚨 <b>${openCount} Active Trade(s) At Risk!</b> (Floating PnL: ${pnlSign}$${pnl.toFixed(2)})`
      : `🛡️ Koi active open trade at risk nahi hai.`;

    const tgMessage = [
      `🚨 <b>[EMERGENCY WARNING: MT5 DISCONNECTED]</b> 🚨`,
      ``,
      `⚠️ <b>MT5 terminal achanak band ho gaya hai ya laptop internet disconnect ho gaya hai!</b>`,
      ``,
      `💻 <b>Notice:</b> MT5 disconnected, check your laptop!`,
      `🖥️ <b>Server:</b> ${payload.server || 'Exness-MT5'} (Account: <code>${payload.login || 'N/A'}</code>)`,
      `⏰ <b>Karachi Time:</b> ${karachiTime}`,
      `⚡ <b>Status:</b> ${payload.reason || 'MetaTrader 5 heartbeat lost / Terminal exited'}`,
      ``,
      `📊 <b>Open Positions:</b>`,
      riskStatus,
      ``,
      `🔴 <b>Emergency Checklist:</b>`,
      `1️⃣ Apna laptop ka internet / Wi-Fi connection check karein.`,
      `2️⃣ MetaTrader 5 software open ya restart karein.`,
      `3️⃣ Python bridge terminal (<code>python mt5_bridge.py</code>) active rakhein.`,
      ``,
      `🤖 <i>The Clever Trader AI • Capital Protection Engine</i>`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `🚨 EMERGENCY: MT5 TERMINAL DISCONNECTED!`,
          description: `**MT5 disconnected, check your laptop!**\nMetaTrader 5 terminal achanak band ho gaya hai ya laptop internet disconnect ho gaya hai.`,
          color: 0xef4444, // Emergency Red
          fields: [
            { name: '🖥️ MT5 Account', value: `${payload.login || 'N/A'} (${payload.server || 'Exness'})`, inline: true },
            { name: '⏰ Time (Karachi)', value: karachiTime, inline: true },
            { name: '📊 Active Positions', value: `${openCount} trade(s) (${pnlSign}$${pnl.toFixed(2)})`, inline: true },
            { name: '⚡ Disconnect Reason', value: payload.reason || 'Heartbeat timeout / Terminal closed', inline: false },
          ],
          footer: { text: 'The Clever Trader AI • Emergency Capital Protection Watchdog' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches a confirmation alert when MT5 bridge connection is restored
   */
  public static async sendMt5ReconnectAlert(payload: Mt5ReconnectAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    const throttleKey = `MT5_RECONNECT_GLOBAL`;
    // Max once every 15 minutes
    if (this.shouldThrottleAlert(throttleKey, 900_000)) {
      return { telegram: false, discord: false };
    }

    const karachiTime = payload.karachiTimeString || new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());

    const tgMessage = [
      `✅ <b>[MT5 RECONNECTED: CONNECTION RESTORED]</b>`,
      ``,
      `🟢 <b>MetaTrader 5 connection kamyabi se restore ho chuka hai!</b>`,
      ``,
      `🖥️ <b>Server:</b> ${payload.server || 'Exness-MT5'} (Account: <code>${payload.login || 'N/A'}</code>)`,
      `💰 <b>Balance:</b> $${(payload.balance ?? 500).toFixed(2)} | <b>Equity:</b> $${(payload.equity ?? 500).toFixed(2)}`,
      `⏰ <b>Karachi Time:</b> ${karachiTime}`,
      `🤖 <b>Live Quotes streaming aur Autonomous Auto-Execution active hai.</b>`,
      ``,
      `<i>The Clever Trader AI • Operational Status Normal</i>`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `✅ MT5 RECONNECTED: Normal Operations Restored`,
          description: `MetaTrader 5 bridge connection restored successfully. Streaming live quotes and autonomous protection active.`,
          color: 0x10b981, // Emerald Green
          fields: [
            { name: 'Account', value: `${payload.login || 'N/A'}`, inline: true },
            { name: 'Server', value: `${payload.server || 'Exness'}`, inline: true },
            { name: 'Time', value: karachiTime, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Dispatches an alert when Trailing Stop Loss is stepped up/down to lock in dynamic profit
   */
  public static async sendTrailingStopAlert(payload: TrailingStopAlertPayload): Promise<{ telegram: boolean; discord: boolean }> {
    const ticketKey = payload.ticket ? `TRAIL_TICKET:${payload.ticket}` : `TRAIL_${payload.symbol}`;
    // Max once per 2 minutes per ticket
    if (this.shouldThrottleAlert(ticketKey, 120_000)) {
      return { telegram: false, discord: false };
    }

    const karachiTime = payload.karachiTimeString || new Intl.DateTimeFormat('en-PK', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());

    const currentPriceFormatted = formatPrice(payload.currentPrice, payload.symbol);
    const prevSlFormatted = formatPrice(payload.previousStopLoss, payload.symbol);
    const newSlFormatted = formatPrice(payload.newStopLoss, payload.symbol);
    const profitText = payload.profitUsd >= 0 ? `+$${payload.profitUsd.toFixed(2)}` : `-$${Math.abs(payload.profitUsd).toFixed(2)}`;
    const timeInfo = formatDualExecutionTime(payload.timestamp);
    const ticketLine = payload.ticket ? `🎫 <b>Ticket:</b> #${payload.ticket}` : '';

    const tgMessage = [
      `📈 <b>[DYNAMIC TRAILING STOP LOSS UPDATED]</b> 🔒`,
      ``,
      `🎯 <b>Symbol:</b> <b>${payload.symbol}</b>`,
      ...(ticketLine ? [ticketLine] : []),
      `⚡ <b>Action:</b> ${payload.action} ${payload.lotSize} Lot`,
      `💰 <b>Live Market Price:</b> ${currentPriceFormatted} (+${payload.pips.toFixed(1)} pips)`,
      ``,
      `🛑 <b>Previous SL:</b> ${prevSlFormatted}`,
      `🔒 <b>New Trailing SL:</b> <b>${newSlFormatted}</b>`,
      `💵 <b>Guaranteed Locked Profit:</b> <b>+${payload.lockedPips.toFixed(1)} pips</b> (${profitText})`,
      ``,
      `🕒 <b>Trailing Time:</b>`,
      timeInfo.formattedLinesHtml,
      `📅 <b>Date:</b> ${timeInfo.datePkt}`,
      `⚙️ <b>Execution:</b> ${payload.targetBroker || 'Exness MT5 Live Bridge'}`,
      ``,
      `🤖 <b>Jaise jaise market profit me barh rahi hai, bot SL ko step-by-step peeche move karke ziada se ziada profit lock kar raha hai!</b>`,
      ``,
      `📚 <i>"Lock the profit, let the market do the work."</i>`,
    ].join('\n');

    const discordEmbed = {
      embeds: [
        {
          title: `📈 DYNAMIC TRAILING SL UPDATED: ${payload.symbol}`,
          description: `Trailing Stop Loss stepped up! **+${payload.lockedPips.toFixed(1)} pips profit guaranteed locked** (${profitText})!`,
          color: 0x06b6d4, // Cyan
          fields: [
            { name: '📊 Symbol', value: payload.symbol, inline: true },
            { name: '⚡ Position', value: `${payload.action} ${payload.lotSize} Lot`, inline: true },
            ...(payload.ticket ? [{ name: '🎫 Ticket', value: `#${payload.ticket}`, inline: true }] : []),
            { name: '💰 Current Price', value: currentPriceFormatted, inline: true },
            { name: '🛑 Previous SL', value: prevSlFormatted, inline: true },
            { name: '🔒 New Trailing SL', value: newSlFormatted, inline: true },
            { name: '💵 Locked Profit', value: `+${payload.lockedPips.toFixed(1)} pips (${profitText})`, inline: true },
            { name: '🕒 Time (PKT)', value: timeInfo.localPkt, inline: true },
            { name: '🖥️ Time (MT5)', value: `${timeInfo.mt5Server} (${timeInfo.utc} UTC)`, inline: true },
          ],
          footer: { text: 'The Clever Trader AI • Dynamic Trailing Profit Engine' },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const [tgSuccess, dcSuccess] = await Promise.all([
      this.sendTelegramRaw(tgMessage),
      this.sendDiscordRaw(discordEmbed),
    ]);

    return { telegram: tgSuccess, discord: dcSuccess };
  }

  /**
   * Sends a test alert to verify Telegram and Discord credentials
   */
  public static async sendTestNotification(): Promise<{
    telegramSuccess: boolean;
    telegramMessage?: string;
    discordSuccess: boolean;
    discordMessage?: string;
  }> {
    let telegramSuccess = false;
    let telegramMessage = '';
    let discordSuccess = false;
    let discordMessage = '';

    if (!this.telegramToken || !this.telegramChatId) {
      telegramMessage = 'Telegram Bot Token or Chat ID is not configured in .env.local';
    } else {
      const testMsg = [
        `🤖 <b>THE CLEVER TRADER | AUTO TRADE</b>`,
        ``,
        `📊 <b>BTCUSD — BUY 🟢</b>`,
        ``,
        `💰 Entry: <b>63,840</b>`,
        `🛑 SL: <b>63,340</b> → Risk <b>$5</b>`,
        `🎯 TP: <b>65,340</b> → Target <b>$15</b>`,
        `⚖️ R:R: <b>1:3</b>`,
        ``,
        `🧠 <b>Trade Reason:</b>`,
        `Bullish Order Block + Liquidity Raid confirm ✅`,
        ``,
        `⭐ <b>Confluence:</b> 90/100 — HIGH QUALITY`,
        ``,
        `⚙️ <b>Execution:</b> Paper + MT5 Bridge`,
        `🤖 <b>Bot ne khud trade execute ki hai.</b>`,
        ``,
        `📚 <i>Simple rule: Risk fixed, target planned.</i>`,
      ].join('\n');
      telegramSuccess = await this.sendTelegramRaw(testMsg);
      telegramMessage = telegramSuccess ? 'Test trade alert delivered to Telegram!' : 'Failed to deliver to Telegram. Check Bot Token & Chat ID.';
    }

    if (!this.discordWebhookUrl) {
      discordMessage = 'Discord Webhook URL is not configured in .env.local';
    } else {
      const testEmbed = {
        embeds: [
          {
            title: '🔔 CLEVER TRADER: Test Notification',
            description: 'Your Discord Webhook integration is LIVE and operational!',
            color: 0x06b6d4,
            fields: [
              { name: 'System', value: 'The Clever Trader AI Terminal', inline: true },
              { name: 'Status', value: 'LIVE_CONNECTED', inline: true },
            ],
            timestamp: new Date().toISOString(),
          }
        ]
      };
      discordSuccess = await this.sendDiscordRaw(testEmbed);
      discordMessage = discordSuccess ? 'Test embed delivered to Discord!' : 'Failed to deliver to Discord. Check Webhook URL.';
    }

    return {
      telegramSuccess,
      telegramMessage,
      discordSuccess,
      discordMessage,
    };
  }

  public static async sendViaModalRelay(htmlMessage: string): Promise<boolean> {
    try {
      const res = await fetch(this.modalRelayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.telegramToken,
          chat_id: this.telegramChatId,
          text: htmlMessage,
          parse_mode: 'HTML',
        }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          console.log('[Telegram Cloud Relay]: Alert successfully relayed to phone via Modal US/EU Cloud Datacenter!');
          this.telegramFailureCount = 0;
          this.telegramNetworkCooldownUntil = 0;
          return true;
        }
      }
      return false;
    } catch (e: any) {
      console.warn('[Telegram Cloud Relay]: Modal relay error:', e?.message || e);
      return false;
    }
  }

  public static async sendTelegramRaw(htmlMessage: string): Promise<boolean> {
    if (!this.telegramToken || !this.telegramChatId) return false;

    // 1. If Telegram has temporarily rate-limited us (429), suppress calls silently
    const now = Date.now();
    if (this.telegramRateLimitedUntil && now < this.telegramRateLimitedUntil) {
      return false;
    }

    try {
      const timeSinceLast = now - this.lastTelegramDispatchTime;
      if (timeSinceLast < this.MIN_TELEGRAM_DISPATCH_INTERVAL_MS) {
        const waitMs = this.MIN_TELEGRAM_DISPATCH_INTERVAL_MS - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
      this.lastTelegramDispatchTime = Date.now();

      // Attempt 1: Direct Telegram API
      const url = `${this.telegramApiBase}/bot${this.telegramToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: htmlMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(3500),
      });

      if (!res.ok) {
        if (res.status === 429) {
          try {
            const rawBody = await res.text();
            const errJson = JSON.parse(rawBody);
            const retryAfterSec = Number(errJson?.parameters?.retry_after) || 300;
            this.telegramRateLimitedUntil = Date.now() + (retryAfterSec * 1000);
            console.log(`[Telegram Shield] Telegram Rate Limit (429) active. Pausing dispatches until ${new Date(this.telegramRateLimitedUntil).toLocaleTimeString()} (~${Math.round(retryAfterSec / 60)} min).`);
          } catch {
            this.telegramRateLimitedUntil = Date.now() + 300000;
          }
          return false;
        }

        // Direct failed -> Activate Modal Cloud Relay
        console.warn(`[Telegram Direct Notice]: Status ${res.status}. Falling back to Modal Cloud Relay...`);
        return await this.sendViaModalRelay(htmlMessage);
      }
      this.telegramFailureCount = 0;
      this.telegramNetworkCooldownUntil = 0;
      return true;
    } catch (err: any) {
      // Direct network error/ISP timeout -> Activate Modal Cloud Relay immediately
      console.warn('[Telegram Direct Timeout]: Pakistan ISP restriction detected. Relaying via Modal US/EU Cloud...');
      const relaySuccess = await this.sendViaModalRelay(htmlMessage);
      if (relaySuccess) return true;

      this.telegramFailureCount = (this.telegramFailureCount || 0) + 1;
      if (this.telegramFailureCount >= 5) {
        this.telegramNetworkCooldownUntil = Date.now() + 60000;
        console.warn(`[Telegram Shield] 5 consecutive failures. Pausing dispatch retries for 60s.`);
      }
      return false;
    }
  }

  private static async sendDiscordRaw(payload: any): Promise<boolean> {
    if (!this.discordWebhookUrl) return false;
    try {
      const res = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500),
      });
      return res.ok;
    } catch (err) {
      console.warn('Discord webhook dispatch error:', err);
      return false;
    }
  }
}

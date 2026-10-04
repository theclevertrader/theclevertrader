import { NextRequest, NextResponse } from 'next/server';
import { TelegramRemoteController } from '@/lib/notifications/telegram-controller';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    configured: TelegramRemoteController.isConfigured(),
    authorizedChatId: TelegramRemoteController.getAuthorizedChatId() ? 'Configured' : 'Missing',
    supportedCommands: [
      { command: '/status', description: 'Real-time account balance, MT5 connection status, and Auto-Trader mode' },
      { command: '/trades', description: 'List all active open MT5 positions with floating PnL and SL/TP' },
      { command: '/closeall', description: 'Instantaneous emergency liquidation of all active positions' },
      { command: '/pause', description: 'Halts autonomous scanning without closing existing protected positions' },
      { command: '/resume', description: 'Resumes autonomous market scanning across XAUUSD, BTCUSD, EURUSD, US30' },
      { command: '/report', description: 'Detailed day performance summary, win rate, and realized PnL' },
      { command: '/help', description: 'Interactive help guide' },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a direct Telegram Webhook payload
    if (body.message) {
      const msg = body.message;
      const text = msg.text || '';
      const chatId = msg.chat?.id;
      const sender = msg.from?.first_name || 'Trader';

      if (!chatId) {
        return NextResponse.json({ success: false, error: 'No chat ID in payload' }, { status: 400 });
      }

      const result = await TelegramRemoteController.handleCommand(text, chatId, sender);
      await TelegramRemoteController.sendTelegramMessage(chatId, result.replyText);

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Direct command execution for testing or UI trigger
    const { command, chatId = process.env.TELEGRAM_CHAT_ID || 'admin' } = body;
    if (!command) {
      return NextResponse.json({ success: false, error: 'Command is required' }, { status: 400 });
    }

    const result = await TelegramRemoteController.handleCommand(command, chatId);
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Execution error' }, { status: 500 });
  }
}

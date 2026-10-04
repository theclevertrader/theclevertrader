import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET() {
  const status = NotificationService.getStatus();
  return NextResponse.json({
    status: 'OK',
    notifications: status,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || '';

    // Test notification dispatch
    if (action === 'test') {
      const result = await NotificationService.sendTestNotification();
      return NextResponse.json({
        success: result.telegramSuccess || result.discordSuccess,
        result,
      });
    }

    // Save credentials dynamically
    if (action === 'save_config') {
      NotificationService.configure({
        telegramToken: body.telegramToken,
        telegramChatId: body.telegramChatId,
        discordWebhookUrl: body.discordWebhookUrl,
      });

      return NextResponse.json({
        success: true,
        message: 'Notification settings updated successfully!',
        status: NotificationService.getStatus(),
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

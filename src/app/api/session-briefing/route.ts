import { NextRequest, NextResponse } from 'next/server';
import { SessionBriefingEngine, SessionId } from '@/lib/engines/session-briefing-engine';

export async function GET() {
  try {
    const status = SessionBriefingEngine.getStatus();
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get session briefing status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'DISPATCH_CURRENT';
    const sessionId: SessionId | undefined = body.sessionId;
    const force = Boolean(body.force ?? true);

    if (action === 'DISPATCH_CURRENT' || action === 'DISPATCH_NOW') {
      const result = await SessionBriefingEngine.dispatchBriefing(sessionId, force);
      return NextResponse.json({
        success: result.success,
        sessionName: result.sessionName,
        message: result.success 
          ? `Telegram briefing for ${result.sessionName} successfully delivered!` 
          : (result.error || 'Failed to dispatch briefing'),
        error: result.error
      });
    }

    if (action === 'CHECK_AND_DISPATCH') {
      await SessionBriefingEngine.checkAndDispatchUpcomingSessions();
      return NextResponse.json({
        success: true,
        message: 'Checked upcoming sessions and dispatched pending briefings.'
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to dispatch session briefing' },
      { status: 500 }
    );
  }
}

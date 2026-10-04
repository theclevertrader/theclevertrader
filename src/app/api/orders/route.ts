import { NextRequest, NextResponse } from 'next/server';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';
import { verifyApiAuth, logSecurityAudit } from '@/lib/security/auth-guard';

export async function GET(request: NextRequest) {
  const auth = verifyApiAuth(request);
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  const liveTicks = Mt5Bridge.getLiveTicks();
  const priceMap: Record<string, number> = {};
  for (const [sym, tick] of Object.entries(liveTicks)) {
    if (tick?.price) priceMap[sym] = tick.price;
  }
  for (const [sym, spec] of Object.entries(INSTITUTIONAL_SYMBOLS)) {
    if (!priceMap[sym] && spec.currentPrice) {
      priceMap[sym] = spec.currentPrice;
    }
  }
  globalPaperBroker.updatePrices(priceMap);

  const account = await globalPaperBroker.getAccount();
  const positions = await globalPaperBroker.getPositions();
  return NextResponse.json({ account, positions });
}

export async function POST(request: NextRequest) {
  const auth = verifyApiAuth(request, { isMutating: true });
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const body = await request.json();
    const position = await globalPaperBroker.placeOrder(body);
    logSecurityAudit('/api/orders [POST]', auth.actor, { order: body, positionId: position.id }, 'GRANTED');
    return NextResponse.json({ success: true, position });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = verifyApiAuth(request, { isMutating: true });
  if (!auth.isAuthorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.statusCode || 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Position id required' }, { status: 400 });
    const closed = await globalPaperBroker.closePosition(id);
    logSecurityAudit('/api/orders [DELETE]', auth.actor, { positionId: id, closed }, 'GRANTED');
    return NextResponse.json({ success: true, closed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { NextResponse } from 'next/server';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { Mt5Bridge } from '@/lib/broker/mt5-bridge';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';

export async function GET() {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const position = await globalPaperBroker.placeOrder(body);
    return NextResponse.json({ success: true, position });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Position id required' }, { status: 400 });
    const closed = await globalPaperBroker.closePosition(id);
    return NextResponse.json({ success: true, closed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

import { BrokerAdapter, BrokerAccountInfo, PlaceOrderInput } from './broker-adapter';
import { PaperPosition } from '../types/trading';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';

export class PaperBroker implements BrokerAdapter {
  public name = 'THE CLEVER TRADER Paper Engine';
  public mode: 'PAPER' | 'LIVE' = 'PAPER';

  private balance: number = 50000.0;
  private leverage: number = 100;
  private positions: PaperPosition[] = [
    {
      id: 'pos-init-1',
      symbol: 'XAUUSD',
      type: 'BUY',
      lotSize: 0.10,
      entryPrice: 2646.20,
      currentPrice: 2652.40,
      stopLoss: 2638.00,
      takeProfit: 2665.00,
      unrealizedPl: 62.00,
      openTime: Date.now() - 3600 * 1000 * 4,
      status: 'OPEN',
    },
    {
      id: 'pos-init-2',
      symbol: 'BTCUSD',
      type: 'BUY',
      lotSize: 0.05,
      entryPrice: 63200.0,
      currentPrice: 63840.0,
      stopLoss: 62500.0,
      takeProfit: 65000.0,
      unrealizedPl: 32.00,
      openTime: Date.now() - 3600 * 1000 * 8,
      status: 'OPEN',
    },
  ];

  public async connect(): Promise<boolean> {
    return true;
  }

  public async disconnect(): Promise<void> {}

  public async getAccount(): Promise<BrokerAccountInfo> {
    const totalUnrealized = this.positions
      .filter(p => p.status === 'OPEN')
      .reduce((acc, p) => acc + p.unrealizedPl, 0);

    const equity = this.balance + totalUnrealized;
    // Estimated margin: 1% of notional
    const margin = this.positions
      .filter(p => p.status === 'OPEN')
      .reduce((acc, p) => {
        const spec = INSTITUTIONAL_SYMBOLS[p.symbol];
        const notional = p.lotSize * (spec ? spec.contractSize * p.entryPrice : 1000);
        return acc + notional / this.leverage;
      }, 0);

    const freeMargin = Math.max(0, equity - margin);
    const marginLevel = margin > 0 ? (equity / margin) * 100 : 999.9;

    return {
      accountId: 'CLEVER-PAPER-8849',
      brokerName: 'Clever Institutional Simulated Liquidity',
      mode: this.mode,
      balance: Number(this.balance.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      margin: Number(margin.toFixed(2)),
      freeMargin: Number(freeMargin.toFixed(2)),
      marginLevel: Number(marginLevel.toFixed(1)),
      currency: 'USD',
      leverage: this.leverage,
    };
  }

  public async getPositions(): Promise<PaperPosition[]> {
    return [...this.positions];
  }

  public async placeOrder(input: PlaceOrderInput): Promise<PaperPosition> {
    const spec = INSTITUTIONAL_SYMBOLS[input.symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const currentPrice = input.entryPrice || spec.currentPrice;

    // Calculate spread entry adjustment
    const spreadOffset = (spec.spreadPips * spec.pipSize) / 2;
    const executionPrice = input.type === 'BUY' 
      ? currentPrice + spreadOffset 
      : currentPrice - spreadOffset;

    const newPosition: PaperPosition = {
      id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      symbol: input.symbol,
      type: input.type,
      lotSize: input.lotSize,
      entryPrice: Number(executionPrice.toFixed(spec.priceDigits)),
      currentPrice: Number(executionPrice.toFixed(spec.priceDigits)),
      stopLoss: input.stopLoss || (input.type === 'BUY' ? executionPrice * 0.99 : executionPrice * 1.01),
      takeProfit: input.takeProfit || (input.type === 'BUY' ? executionPrice * 1.02 : executionPrice * 0.98),
      unrealizedPl: 0,
      openTime: Date.now(),
      status: 'OPEN',
    };

    this.positions.unshift(newPosition);
    return newPosition;
  }

  public async closeAllPositions(): Promise<PaperPosition[]> {
    const openPositions = this.positions.filter(p => p.status === 'OPEN');
    for (const pos of openPositions) {
      await this.closePosition(pos.id);
    }
    return openPositions;
  }

  public async closePosition(positionId: string, closePrice?: number): Promise<PaperPosition> {
    const posIndex = this.positions.findIndex(p => p.id === positionId);
    if (posIndex === -1) {
      throw new Error(`Position ${positionId} not found`);
    }

    const pos = this.positions[posIndex];
    const spec = INSTITUTIONAL_SYMBOLS[pos.symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const exitPrice = closePrice || spec.currentPrice;

    const priceDiff = pos.type === 'BUY' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
    const pips = spec.pipSize > 0 ? priceDiff / spec.pipSize : priceDiff;
    const realizedPl = pips * (pos.lotSize * spec.tickValuePerLot);

    pos.status = 'CLOSED';
    pos.closePrice = exitPrice;
    pos.closeTime = Date.now();
    pos.realizedPl = Number(realizedPl.toFixed(2));
    this.balance += realizedPl;

    return pos;
  }

  public async partialClosePosition(positionId: string, percentage: number = 50, closePrice?: number): Promise<{ closedLot: number; remainingLot: number; realizedPl: number }> {
    const pos = this.positions.find(p => p.id === positionId && p.status === 'OPEN');
    if (!pos) {
      throw new Error(`Open position ${positionId} not found`);
    }
    const spec = INSTITUTIONAL_SYMBOLS[pos.symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const exitPrice = closePrice || spec.currentPrice;
    const closedLot = Number((pos.lotSize * (percentage / 100)).toFixed(2));
    const remainingLot = Number((pos.lotSize - closedLot).toFixed(2));

    const priceDiff = pos.type === 'BUY' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
    const pips = spec.pipSize > 0 ? priceDiff / spec.pipSize : priceDiff;
    const realizedPl = Number((pips * (closedLot * spec.tickValuePerLot)).toFixed(2));

    this.balance += realizedPl;
    pos.lotSize = remainingLot > 0 ? remainingLot : pos.lotSize;
    if (remainingLot <= 0) {
      pos.status = 'CLOSED';
      pos.closePrice = exitPrice;
      pos.closeTime = Date.now();
      pos.realizedPl = realizedPl;
    }

    return { closedLot, remainingLot, realizedPl };
  }

  public async modifyPosition(positionId: string, stopLoss?: number, takeProfit?: number): Promise<PaperPosition> {
    const pos = this.positions.find(p => p.id === positionId);
    if (!pos) throw new Error(`Position ${positionId} not found`);
    if (stopLoss !== undefined) pos.stopLoss = stopLoss;
    if (takeProfit !== undefined) pos.takeProfit = takeProfit;
    return pos;
  }

  public updatePrices(priceMap: Record<string, number>) {
    for (const pos of this.positions.filter(p => p.status === 'OPEN')) {
      const price = priceMap[pos.symbol];
      if (price) {
        pos.currentPrice = price;
        const spec = INSTITUTIONAL_SYMBOLS[pos.symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
        const priceDiff = pos.type === 'BUY' ? price - pos.entryPrice : pos.entryPrice - price;
        const pips = spec.pipSize > 0 ? priceDiff / spec.pipSize : priceDiff;
        pos.unrealizedPl = Number((pips * (pos.lotSize * spec.tickValuePerLot)).toFixed(2));
      }
    }
  }
}

export const globalPaperBroker = new PaperBroker();

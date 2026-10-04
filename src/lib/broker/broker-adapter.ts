import { PaperPosition } from '../types/trading';

export interface BrokerAccountInfo {
  accountId: string;
  brokerName: string;
  mode: 'PAPER' | 'LIVE';
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
}

export interface PlaceOrderInput {
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  orderType?: 'MARKET' | 'LIMIT' | 'STOP';
  comment?: string;
}

export interface BrokerAdapter {
  name: string;
  mode: 'PAPER' | 'LIVE';
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getAccount(): Promise<BrokerAccountInfo>;
  getPositions(): Promise<PaperPosition[]>;
  placeOrder(input: PlaceOrderInput): Promise<PaperPosition>;
  closePosition(positionId: string, closePrice?: number): Promise<PaperPosition>;
  modifyPosition(positionId: string, stopLoss?: number, takeProfit?: number): Promise<PaperPosition>;
}

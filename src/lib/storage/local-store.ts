import { JournalEntry, TradeSetup } from '../types/trading';

export interface CleverSettings {
  appMode: 'PAPER' | 'LIVE';
  aiProvider: 'offline' | 'gemini' | 'openai' | 'anthropic';
  geminiApiKey: string;
  openAiApiKey: string;
  anthropicApiKey: string;
  // 20 Institutional Sources Free API Keys
  fredApiKey: string;
  twelveDataApiKey: string;
  alphaVantageApiKey: string;
  finnhubApiKey: string;
  tradingEconomicsApiKey: string;
  blsApiKey: string;
  beaApiKey: string;
  defaultSymbol: string;
  defaultTimeframe: string;
  defaultRiskPercent: number;
  maxDailyLossPercent: number;
  maxOpenTrades: number;
  microScalpLot: number;
  microScalpTargetRisk: number;
  microScalpTargetReward: number;
  soundAlertsEnabled: boolean;
  telegramWebhookUrl: string;
}

export const DEFAULT_SETTINGS: CleverSettings = {
  appMode: 'PAPER',
  aiProvider: 'offline',
  geminiApiKey: '',
  openAiApiKey: '',
  anthropicApiKey: '',
  fredApiKey: '',
  twelveDataApiKey: '',
  alphaVantageApiKey: '',
  finnhubApiKey: '',
  tradingEconomicsApiKey: '',
  blsApiKey: '',
  beaApiKey: '',
  defaultSymbol: 'XAUUSD',
  defaultTimeframe: '15m',
  defaultRiskPercent: 1.0,
  maxDailyLossPercent: 3.0,
  maxOpenTrades: 5,
  microScalpLot: 0.01,
  microScalpTargetRisk: 3.0,
  microScalpTargetReward: 9.0,
  soundAlertsEnabled: true,
  telegramWebhookUrl: '',
};

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'jrnl-1',
    timestamp: Date.now() - 3600 * 1000 * 26,
    symbol: 'XAUUSD',
    direction: 'BUY',
    entryPrice: 2642.50,
    exitPrice: 2654.80,
    stopLoss: 2638.00,
    takeProfit: 2655.00,
    lotSize: 0.05,
    pnl: 61.50,
    rMultiple: 2.73,
    setupType: 'Liquidity Sweep + Bullish MSS',
    smcConfirmation: 'Sell-side liquidity raided at 2640 with sharp displacement',
    ictConfirmation: 'London Kill Zone entry during Judas Swing reversal',
    emotion: 'DISCIPLINED',
    mistake: 'None. Plan followed strictly.',
    notes: 'Exited just before Asian close. Great execution.',
    aiReview: 'Perfect institutional execution. Stop loss was placed safely beyond swing low with 1:2.7 R:R.',
  },
  {
    id: 'jrnl-2',
    timestamp: Date.now() - 3600 * 1000 * 52,
    symbol: 'BTCUSD',
    direction: 'BUY',
    entryPrice: 63100.0,
    exitPrice: 62450.0,
    stopLoss: 62500.0,
    takeProfit: 64500.0,
    lotSize: 0.02,
    pnl: -13.00,
    rMultiple: -1.0,
    setupType: 'Bullish FVG Retest',
    smcConfirmation: '1H Bullish FVG',
    ictConfirmation: 'New York Open session',
    emotion: 'FOMO',
    mistake: 'Entered before 15M candle closed. High impact CPI volatility spiked through FVG.',
    notes: 'Next time wait for candle close and displacement confirmation.',
    aiReview: 'Impulsive entry into high volatility event. Always check the economic calendar before opening positions.',
  },
  {
    id: 'jrnl-3',
    timestamp: Date.now() - 3600 * 1000 * 74,
    symbol: 'NAS100',
    direction: 'BUY',
    entryPrice: 19720.0,
    exitPrice: 19860.0,
    stopLoss: 19680.0,
    takeProfit: 19850.0,
    lotSize: 0.02,
    pnl: 56.00,
    rMultiple: 3.5,
    setupType: 'Order Block Retest',
    smcConfirmation: 'Unmitigated 15M Bullish Order Block at 19715',
    ictConfirmation: 'New York AM Killzone liquidity grab',
    emotion: 'CONFIDENT',
    mistake: 'None.',
    notes: 'Captured full displacement move to PDH.',
    aiReview: 'High confluence trade. 1:3.5 R:R execution.',
  },
];

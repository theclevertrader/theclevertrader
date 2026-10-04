'use client';

import React, { memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  timeframe?: string;
  theme?: 'dark' | 'light';
  height?: number | string;
  autosize?: boolean;
}

// Map institutional symbols to reliable TradingView symbols that support free external embeds
const TRADINGVIEW_SYMBOLS: Record<string, string> = {
  XAUUSD: 'FOREXCOM:XAUUSD',
  BTCUSD: 'BINANCE:BTCUSDT',
  ETHUSD: 'BINANCE:ETHUSDT',
  SOLUSD: 'BINANCE:SOLUSDT',
  EURUSD: 'FX:EURUSD',
  GBPUSD: 'FX:GBPUSD',
  USDJPY: 'FX:USDJPY',
  DXY: 'CAPITALCOM:DXY',
  NAS100: 'FOREXCOM:NAS100',
  US30: 'FOREXCOM:DJI',
  SPX500: 'FOREXCOM:SPX',
};

// Map friendly timeframe strings to TradingView interval codes
const TIMEFRAME_TO_INTERVAL: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1H': '60',
  '4H': '240',
  '1D': 'D',
  '1W': 'W',
  '1M': 'M',
};

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = memo(({
  symbol,
  timeframe = '15m',
  theme = 'dark',
  height = 540,
}) => {
  const tvSymbol = TRADINGVIEW_SYMBOLS[symbol] || (symbol.includes(':') ? symbol : `FX:${symbol}`);
  const tvInterval = TIMEFRAME_TO_INTERVAL[timeframe] || '15';

  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(tvSymbol)}&interval=${tvInterval}&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=060b18&theme=${theme === 'light' ? 'light' : 'dark'}&style=1&timezone=Asia%2FKarachi&studies=%5B%22STD%3BVolume%22%5D&hideideas=1&locale=en`;

  return (
    <div
      className="tradingview-widget-container rounded-2xl overflow-hidden border border-white/[0.08] bg-[#040813] shadow-2xl relative w-full"
      style={{ height: typeof height === 'number' ? `${height}px` : height, minHeight: '480px' }}
    >
      <iframe
        key={`${tvSymbol}-${tvInterval}`}
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        className="w-full h-full rounded-2xl"
        title={`TradingView Chart - ${tvSymbol}`}
        allowFullScreen
      />
    </div>
  );
});

TradingViewWidget.displayName = 'TradingViewWidget';

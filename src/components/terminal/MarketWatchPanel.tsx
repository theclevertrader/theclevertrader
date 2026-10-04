'use client';

import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useMarketData } from '@/lib/hooks/useMarketData';
import { SessionFilterEngine } from '@/lib/engines/session-filter-engine';

interface MarketItem {
  symbol: string;
  price: string;
  change: number;
  category: 'FOREX' | 'METALS' | 'INDICES';
  isFavorite?: boolean;
}

const BASE_ITEMS: MarketItem[] = [
  { symbol: 'XAUUSD', price: '4,400.31', change: 1.16, category: 'METALS', isFavorite: true },
  { symbol: 'EURUSD', price: '1.16285', change: 0.01, category: 'FOREX', isFavorite: true },
  { symbol: 'GBPUSD', price: '1.35484', change: 3.96, category: 'FOREX', isFavorite: true },
  { symbol: 'USDJPY', price: '153.507', change: 5.70, category: 'FOREX', isFavorite: true },
  { symbol: 'AUDUSD', price: '0.72186', change: -0.03, category: 'FOREX' },
  { symbol: 'NZDUSD', price: '0.58424', change: -0.28, category: 'FOREX' },
  { symbol: 'USDCHF', price: '0.81020', change: 0.14, category: 'FOREX' },
  { symbol: 'USDCAD', price: '1.38069', change: 0.22, category: 'FOREX' },
  { symbol: 'EURGBP', price: '0.85820', change: -0.15, category: 'FOREX' },
  { symbol: 'EURJPY', price: '178.490', change: 5.71, category: 'FOREX' },
  { symbol: 'GBPJPY', price: '207.970', change: 9.88, category: 'FOREX' },
  { symbol: 'XAGUSD', price: '32.840', change: 1.45, category: 'METALS' },
  { symbol: 'DXY', price: '104.280', change: 0.13, category: 'INDICES' },
  { symbol: 'NAS100', price: '19,840.50', change: 1.12, category: 'INDICES' },
  { symbol: 'US30', price: '42,180.00', change: 0.64, category: 'INDICES' },
];

interface MarketWatchPanelProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const MarketWatchPanel: React.FC<MarketWatchPanelProps> = ({
  activeSymbol,
  onSelectSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'FAVORITES' | 'FOREX' | 'METALS' | 'INDICES'>('FAVORITES');
  const [items, setItems] = useState<MarketItem[]>(BASE_ITEMS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY']));
  const { ticks, refresh } = useMarketData();

  useEffect(() => {
    if (!ticks || Object.keys(ticks).length === 0) return;
    setItems(prev =>
      prev.map(item => {
        const tick = ticks[item.symbol];
        if (tick && tick.price !== undefined) {
          let formatted = tick.price.toFixed(
            item.symbol === 'USDJPY' || item.symbol === 'EURJPY' || item.symbol === 'GBPJPY' || item.symbol === 'DXY' ? 3 :
            item.symbol === 'XAUUSD' || item.symbol === 'NAS100' || item.symbol === 'US30' ? 2 : 5
          );
          if (item.symbol === 'XAUUSD' || item.symbol === 'NAS100' || item.symbol === 'US30') {
            formatted = tick.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          return {
            ...item,
            price: formatted,
            change: tick.changePct !== undefined ? tick.changePct : (tick.change ?? item.change),
          };
        }
        return item;
      })
    );
  }, [ticks]);

  const toggleFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  };

  const tabs = ['FAVORITES', 'FOREX', 'METALS', 'INDICES'] as const;

  const filteredItems = items.filter(item => {
    if (activeTab === 'FAVORITES') return favorites.has(item.symbol);
    return item.category === activeTab;
  });

  return (
    <div className="ronas-card p-3 flex flex-col font-sans bg-[#050507] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black text-white tracking-wider uppercase">Market Watch</h3>
          <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE TICKS
          </span>
        </div>
        <button 
          onClick={() => refresh()}
          className="text-slate-500 hover:text-white transition-colors"
          title="Refresh Live Quotes"
        >
          <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-black/50 border border-white/[0.06] mb-3">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-1.5 py-1 rounded-md text-[9px] font-bold font-mono transition-all ${
              activeTab === tab
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 text-[9px] text-slate-500 font-mono uppercase tracking-wider pb-1.5 border-b border-white/[0.06] mb-1">
        <span>SYMBOL</span>
        <span className="text-right">PRICE</span>
        <span className="text-right">24H %</span>
      </div>

      {/* Market Items */}
      <div className="space-y-0 max-h-[280px] overflow-y-auto scrollbar-none">
        {filteredItems.map(item => {
          const isUp = item.change >= 0;
          const isActive = activeSymbol === item.symbol;
          const isFav = favorites.has(item.symbol);
          const mStatus = SessionFilterEngine.isMarketOpen(item.symbol);
          const isOpen = mStatus.isOpen;

          return (
            <div
              key={item.symbol}
              onClick={() => onSelectSymbol(item.symbol)}
              className={`grid grid-cols-3 items-center py-2 px-1.5 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? 'bg-cyan-500/15 border border-cyan-500/30'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              {/* Symbol */}
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={e => toggleFavorite(item.symbol, e)}
                  className="text-slate-500 hover:text-amber-400 transition-colors shrink-0"
                >
                  <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
                <span className="text-xs font-bold text-white font-mono truncate">{item.symbol}</span>
                <span className={`text-[7.5px] px-1 py-0.2 rounded font-mono font-bold shrink-0 ${
                  isOpen
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  {isOpen ? 'LIVE' : 'CLOSED'}
                </span>
              </div>

              {/* Price */}
              <div className="text-right text-xs font-mono font-bold text-slate-200">
                {item.price}
              </div>

              {/* Change */}
              <div className={`text-right text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isUp ? '+' : ''}{item.change.toFixed(2)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

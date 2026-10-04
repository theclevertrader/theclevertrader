'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star, 
  ArrowUpRight, 
  Coins, 
  Compass,
  Zap
} from 'lucide-react';
import { useMarketTicks } from '@/lib/hooks/useMarketData';

interface WatchlistItem {
  symbol: string;
  name: string;
  category: 'CRYPTO' | 'METALS' | 'FOREX' | 'INDICES';
  price: number;
  change24h: number;
  volume24h: string;
  sparkline: number[];
  digits: number;
}

const WATCHLIST_ITEMS: WatchlistItem[] = [
  {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    category: 'METALS',
    price: 4378.34,
    change24h: 0.75,
    volume24h: '$4.2B',
    sparkline: [40, 42, 41, 43, 44, 43, 45, 46, 48, 50],
    digits: 2,
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin',
    category: 'CRYPTO',
    price: 81248.00,
    change24h: 3.82,
    volume24h: '$38.4B',
    sparkline: [30, 32, 35, 34, 38, 42, 45, 48, 52, 58],
    digits: 1,
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum',
    category: 'CRYPTO',
    price: 2641.50,
    change24h: 2.15,
    volume24h: '$16.1B',
    sparkline: [22, 24, 25, 28, 30, 32, 31, 35, 38, 40],
    digits: 2,
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana',
    category: 'CRYPTO',
    price: 184.20,
    change24h: 5.40,
    volume24h: '$4.8B',
    sparkline: [45, 44, 46, 48, 52, 55, 54, 58, 62, 65],
    digits: 2,
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    price: 1.14859,
    change24h: -0.15,
    volume24h: '$11.8B',
    sparkline: [30, 31, 30, 32, 33, 31, 32, 34, 35, 36],
    digits: 5,
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / USD',
    category: 'FOREX',
    price: 1.33932,
    change24h: 0.08,
    volume24h: '$5.6B',
    sparkline: [40, 41, 41, 42, 43, 44, 43, 45, 46, 46],
    digits: 5,
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'FOREX',
    price: 156.885,
    change24h: 0.47,
    volume24h: '$6.4B',
    sparkline: [52, 51, 50, 48, 46, 47, 45, 44, 43, 42],
    digits: 3,
  },
  {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    category: 'INDICES',
    price: 20699.50,
    change24h: 0.92,
    volume24h: '$12.8B',
    sparkline: [35, 36, 38, 40, 42, 44, 43, 46, 48, 52],
    digits: 1,
  },
];

interface RonasWatchlistTableProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

export const RonasWatchlistTable: React.FC<RonasWatchlistTableProps> = ({
  activeSymbol,
  onSelectSymbol,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRYPTO' | 'METALS' | 'FOREX' | 'INDICES'>('ALL');
  const [search, setSearch] = useState('');
  const ticks = useMarketTicks();

  // Dynamic live item resolution
  const liveItems = useMemo(() => {
    return WATCHLIST_ITEMS.map(item => {
      const liveTick = ticks?.[item.symbol];
      if (!liveTick) return item;
      return {
        ...item,
        price: liveTick.price ?? item.price,
        change24h: liveTick.change ?? item.change24h,
      };
    });
  }, [ticks]);

  const filteredItems = liveItems.filter(item => {
    const matchesFilter = filter === 'ALL' || item.category === filter;
    const matchesSearch = item.symbol.toLowerCase().includes(search.toLowerCase()) ||
                          item.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="ronas-card p-4 sm:p-5 flex flex-col justify-between font-sans bg-[#09090d] border border-white/[0.08] shadow-2xl space-y-3.5">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-white" />
          <h3 className="text-sm font-black text-white tracking-wide uppercase">
            Market Watchlist & Crypto Assets
          </h3>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coin / asset..."
            className="w-full bg-[#050508] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/40 font-mono"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {(['ALL', 'CRYPTO', 'METALS', 'FOREX', 'INDICES'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap text-[11px] ${
              filter === cat
                ? 'bg-white text-black font-extrabold shadow-sm'
                : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Watchlist Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] text-slate-500 uppercase font-mono border-b border-white/[0.04]">
              <th className="pb-2">Asset</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">24h Change</th>
              <th className="pb-2 hidden md:table-cell">24h Volume</th>
              <th className="pb-2 text-center">Trend</th>
              <th className="pb-2 text-right">Trade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03] font-mono">
            {filteredItems.map(item => {
              const isUp = item.change24h >= 0;
              const isSelected = activeSymbol === item.symbol;

              // Sparkline SVG calculation
              const maxVal = Math.max(...item.sparkline);
              const minVal = Math.min(...item.sparkline);
              const range = maxVal - minVal || 1;
              const points = item.sparkline
                .map((val, idx) => {
                  const x = (idx / (item.sparkline.length - 1)) * 60;
                  const y = 20 - ((val - minVal) / range) * 16;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <tr
                  key={item.symbol}
                  className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-500/[0.06]' : ''
                  }`}
                  onClick={() => onSelectSymbol(item.symbol)}
                >
                  {/* Asset */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center font-bold text-[10px] text-blue-300">
                        {item.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1 font-sans">
                          <span>{item.symbol}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-2.5 font-bold text-white">
                    ${item.price.toLocaleString('en-US', { minimumFractionDigits: item.digits })}
                  </td>

                  {/* 24h Change */}
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isUp ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                      }`}
                    >
                      {isUp ? '+' : ''}{item.change24h}%
                    </span>
                  </td>

                  {/* Volume */}
                  <td className="py-2.5 text-slate-400 text-[11px] hidden md:table-cell">
                    {item.volume24h}
                  </td>

                  {/* Mini Sparkline */}
                  <td className="py-2.5 text-center">
                    <svg className="w-14 h-5 inline-block overflow-visible">
                      <polyline
                        fill="none"
                        stroke={isUp ? '#22c55e' : '#f43f5e'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                    </svg>
                  </td>

                  {/* Action Button */}
                  <td className="py-2.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSymbol(item.symbol);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-300 hover:text-white border border-blue-500/30 text-[10px] font-bold font-sans transition-all"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

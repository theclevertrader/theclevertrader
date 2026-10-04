'use client';

import React, { useEffect, useState } from 'react';
import { Newspaper, ArrowRight, Clock, Radio } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  timeAgo: string;
  impact: 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'ROUTINE';
  author?: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'f1',
    title: 'Fed Powell signals policy calibration as inflation approaches 2% objective',
    timeAgo: '12m ago',
    impact: 'HIGH',
    author: 'Jerome Powell',
  },
  {
    id: 'f2',
    title: 'Gold spot sets new record high amid sustained central bank bullion accumulation',
    timeAgo: '28m ago',
    impact: 'CRITICAL',
    author: 'Bloomberg',
  },
  {
    id: 'f3',
    title: 'ECB confirms neutral rate corridor while monitoring USD/EUR exchange parity',
    timeAgo: '45m ago',
    impact: 'ELEVATED',
    author: 'Christine Lagarde',
  },
  {
    id: 'f4',
    title: 'US 10-Year yield stabilizes as institutional treasury bids absorb supply',
    timeAgo: '1h ago',
    impact: 'HIGH',
    author: 'ZeroHedge',
  },
  {
    id: 'f5',
    title: 'Bank of Japan cautions currency volatility above key psychological thresholds',
    timeAgo: '2h ago',
    impact: 'HIGH',
    author: 'BOJ Desk',
  },
];

export const LatestNewsPanel: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveNews = async () => {
      try {
        const res = await fetch('/api/vip-sentiment?filter=ALL');
        if (res.ok) {
          const data = await res.json();
          if (data?.feed && Array.isArray(data.feed) && data.feed.length > 0) {
            const mapped: NewsItem[] = data.feed.slice(0, 7).map((item: any) => ({
              id: item.id || Math.random().toString(),
              title: item.content || item.englishTakeaway || 'Market Intelligence Update',
              timeAgo: item.timeAgo || 'Just now',
              impact: item.impactSeverity || 'HIGH',
              author: item.authorName || 'Market Wire',
            }));
            if (isMounted) {
              setNews(mapped);
              setIsLive(true);
            }
          }
        }
      } catch (err) {
        // Retain fallback
      }
    };

    fetchLiveNews();
    const interval = setInterval(fetchLiveNews, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="ronas-card p-3 flex flex-col bg-[#09090d] border border-white/[0.08]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Newspaper className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-[11px] font-black text-white tracking-wider uppercase">Live Market News</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{isLive ? 'LIVE FEED' : 'ACTIVE'}</span>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-2 max-h-[210px] overflow-y-auto scrollbar-none">
        {news.map((item) => (
          <div
            key={item.id}
            className="group cursor-pointer border-l-2 pl-2.5 py-1 transition-all hover:bg-white/[0.02]"
            style={{
              borderColor: item.impact === 'CRITICAL'
                ? '#f43f5e'
                : item.impact === 'HIGH'
                ? '#ffffff'
                : '#71717a',
            }}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              {item.author && (
                <span className="text-[9px] font-bold text-zinc-400 font-mono">
                  {item.author}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-zinc-500" />
                <span className="text-[9px] text-zinc-500 font-mono">{item.timeAgo}</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-300 group-hover:text-white leading-snug transition-colors line-clamp-2">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

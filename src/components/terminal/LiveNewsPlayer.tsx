'use client';

import React, { useState } from 'react';
import {
  Tv,
  Radio,
  ExternalLink,
  RefreshCw,
  Globe2,
  Volume2,
  Maximize2,
  Minimize2,
  Play,
  MonitorPlay,
  Sparkles,
} from 'lucide-react';

interface NewsChannel {
  id: string;
  name: string;
  shortName: string;
  region: string;
  badge: string;
  badgeColor: string;
  videoId: string;
  officialLiveUrl: string;
  youtubeLiveUrl: string;
  description: string;
}

const NEWS_CHANNELS: NewsChannel[] = [
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    shortName: 'Al Jazeera',
    region: 'Doha, Qatar',
    badge: 'GEOPOLITICS',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    videoId: 'gCNeDWCI0vo',
    officialLiveUrl: 'https://www.aljazeera.com/live',
    youtubeLiveUrl: 'https://www.youtube.com/@aljazeeraenglish/live',
    description: 'Continuous 24/7 world news, Middle East coverage, and international diplomacy.',
  },
  {
    id: 'skynews',
    name: 'Sky News',
    shortName: 'Sky News',
    region: 'London, UK',
    badge: 'BREAKING NEWS',
    badgeColor: 'bg-red-500/15 text-red-300 border-red-500/30',
    videoId: 'xDWQ3LkccY8',
    officialLiveUrl: 'https://news.sky.com/watch-live',
    youtubeLiveUrl: 'https://www.youtube.com/@SkyNews/live',
    description: 'Fast-paced breaking news, European markets, politics, and real-time alerts.',
  },
  {
    id: 'cna',
    name: 'CNA (Channel NewsAsia)',
    shortName: 'CNA Asia',
    region: 'Singapore',
    badge: 'ASIA MARKETS',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    videoId: 'XWq5kBlakcQ',
    officialLiveUrl: 'https://www.channelnewsasia.com/watch-live',
    youtubeLiveUrl: 'https://www.youtube.com/@channelnewsasia/live',
    description: 'Asia-Pacific financial markets, supply chain intelligence, and economic updates.',
  },
  {
    id: 'trtworld',
    name: 'TRT World',
    shortName: 'TRT World',
    region: 'Istanbul, Türkiye',
    badge: 'GLOBAL STRATEGY',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    videoId: '9CucucyxECM',
    officialLiveUrl: 'https://www.trtworld.com/live',
    youtubeLiveUrl: 'https://www.youtube.com/@trtworld/live',
    description: 'In-depth global reports, Eurasian strategic developments, and foreign affairs.',
  },
  {
    id: 'bbcnews',
    name: 'BBC News',
    shortName: 'BBC News',
    region: 'London, UK',
    badge: 'WORLD SERVICE',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    videoId: 'sc21UUjyLaw',
    officialLiveUrl: 'https://www.bbc.com/news/live',
    youtubeLiveUrl: 'https://www.youtube.com/@BBCNews/live',
    description: 'Authoritative global reporting, macro analysis, and verified institutional coverage.',
  },
];

export const LiveNewsPlayer: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('aljazeera');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeChannel =
    NEWS_CHANNELS.find((c) => c.id === selectedChannelId) || NEWS_CHANNELS[0];

  const handleRefresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  // Dedicated Desktop Popout TV Window (Bypasses all iframe & browser tracking protection issues)
  const openPopout = (url: string) => {
    if (typeof window === 'undefined') return;
    const width = 720;
    const height = 440;
    const left = Math.max(0, window.screen.width - width - 40);
    const top = 80;
    window.open(
      url,
      'CleverTraderLiveDeskTV',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no`
    );
  };

  // Clean embed URL without restricted localhost origin or JSAPI postMessage checks
  const embedUrl = `https://www.youtube-nocookie.com/embed/${activeChannel.videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0`;

  return (
    <div
      className={`ronas-card p-3 flex flex-col bg-[#0c101c] border border-white/[0.08] transition-all duration-300 relative overflow-hidden shadow-2xl ${
        isExpanded ? 'ring-1 ring-cyan-500/40' : ''
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <Tv className="w-3.5 h-3.5 text-red-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <span className="text-[11px] font-black text-white tracking-wider uppercase flex items-center gap-1.5">
            Global Live News Desk
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[8.5px] font-mono font-bold text-red-400 uppercase tracking-widest animate-pulse">
              <Radio className="w-2.5 h-2.5" /> LIVE
            </span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Popout Mini-TV button */}
          <button
            onClick={() =>
              openPopout(`https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1`)
            }
            title="Open Floating Mini-TV Window (Sound Enabled)"
            className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono font-bold flex items-center gap-1 transition-colors"
          >
            <MonitorPlay className="w-2.5 h-2.5" />
            <span>Popout TV</span>
          </button>

          <button
            onClick={handleRefresh}
            title="Reload live stream"
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Normal view' : 'Expand player'}
            className="p-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 pt-0.5">
        {NEWS_CHANNELS.map((channel) => {
          const isSelected = channel.id === activeChannel.id;
          return (
            <button
              key={channel.id}
              onClick={() => {
                setSelectedChannelId(channel.id);
                setReloadKey((prev) => prev + 1);
              }}
              className={`flex-shrink-0 px-2.5 py-1 rounded text-[10px] font-semibold transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-red-500/25 border-red-500/70 text-white shadow-md shadow-red-500/25 font-bold scale-[1.02]'
                  : 'bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
              }`}
            >
              {isSelected ? (
                <span className="w-2 h-2 rounded-full bg-red-400 ring-2 ring-red-500/50 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              )}
              <span>{channel.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Current Channel Info Bar */}
      <div className="mb-2 px-2 py-1 rounded bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-bold">{activeChannel.name}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">{activeChannel.region}</span>
        </div>
        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${activeChannel.badgeColor}`}>
          {activeChannel.badge}
        </span>
      </div>

      {/* Live Stream Video Player */}
      <div
        className={`relative w-full rounded-lg overflow-hidden border border-white/[0.1] bg-black shadow-inner transition-all duration-300 ${
          isExpanded ? 'h-[300px]' : 'h-[185px]'
        }`}
      >
        <iframe
          key={`${activeChannel.id}-${reloadKey}`}
          src={embedUrl}
          title={`${activeChannel.name} 24/7 Live Stream`}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />

        {/* Audio Mute Note (Required by browsers for autoplay) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/15 text-[8.5px] text-slate-300 font-mono pointer-events-none z-10 shadow-lg">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          <span>Click Video to Unmute</span>
        </div>
      </div>

      {/* Quick Launch & Direct Stream Bar */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
        <button
          onClick={() =>
            openPopout(`https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1`)
          }
          className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors hover:underline"
        >
          <MonitorPlay className="w-3 h-3 text-cyan-400" />
          <span>Popout Mini-TV</span>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openPopout(activeChannel.officialLiveUrl)}
            className="text-slate-300 hover:text-white font-semibold flex items-center gap-0.5 transition-colors hover:underline"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
          </button>
          <span className="text-slate-700">|</span>
          <a
            href={activeChannel.youtubeLiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors hover:underline"
          >
            <Play className="w-2.5 h-2.5 fill-red-400" />
            <span>YouTube Live</span>
          </a>
        </div>
      </div>
    </div>
  );
};

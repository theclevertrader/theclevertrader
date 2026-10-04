'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  CandlestickChart,
  Search,
  Calendar,
  Newspaper,
  ChevronDown,
  ExternalLink,
  Bot,
  Activity,
  Crown,
  Layers,
  Sparkles,
  Globe2,
  BarChart2
} from 'lucide-react';

interface QuickOption {
  title: string;
  href?: string;
  onClick?: () => void;
  icon: any;
  desc?: string;
  badge?: string;
}

interface QuickCard {
  id: string;
  title: string;
  icon: any;
  options: QuickOption[];
}

interface QuickAccessBarProps {
  onOpenMt5?: () => void;
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({ onOpenMt5 }) => {
  const pathname = usePathname();
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenCardId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cards: QuickCard[] = [
    {
      id: 'new-trade',
      title: 'New Trade',
      icon: Zap,
      options: [
        {
          title: 'Instant MT5 Order',
          desc: 'Live execution & lot placement',
          icon: Zap,
          badge: 'MT5',
          onClick: () => {
            setOpenCardId(null);
            onOpenMt5?.();
          },
        },
        {
          title: 'Force Market Scan',
          desc: 'Scan all 6 institutional pairs now',
          icon: Activity,
          badge: 'AUTO',
          onClick: async () => {
            setOpenCardId(null);
            try {
              await fetch('/api/auto-trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'force_scan' }),
              });
            } catch (e) {}
          },
        },
        {
          title: 'Risk Management',
          href: '/risk',
          desc: 'Max lot & drawdown rules',
          icon: Activity,
        },
      ],
    },
    {
      id: 'chart',
      title: 'Chart',
      icon: CandlestickChart,
      options: [
        {
          title: 'Live Institutional Chart',
          href: '/markets',
          desc: 'Candlestick & live depth',
          icon: CandlestickChart,
        },
        {
          title: 'Vortex Multi-Agent Terminal',
          href: '/vortex',
          desc: '3D Flow Sphere & HFT tape',
          icon: Activity,
          badge: '3D',
        },
        {
          title: 'Volume Profile & VWAP',
          href: '/volume-profile',
          desc: 'POC value areas & delta',
          icon: BarChart2,
        },
      ],
    },
    {
      id: 'scanner',
      title: 'Scanner',
      icon: Search,
      options: [
        {
          title: 'Opportunity Scanner',
          href: '/scanner',
          desc: 'Multi-timeframe setups',
          icon: Search,
          badge: 'LIVE',
        },
        {
          title: 'Forex Quant Matrix',
          href: '/forex-matrix',
          desc: 'Algorithmic currency strength',
          icon: BarChart2,
        },
        {
          title: 'SMC / ICT Engine',
          href: '/smc-ict',
          desc: 'Order blocks & liquidity sweeps',
          icon: Layers,
        },
      ],
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      options: [
        {
          title: 'Economic Calendar',
          href: '/economic-calendar',
          desc: 'CPI, NFP, Fed rates & news',
          icon: Calendar,
          badge: 'MACRO',
        },
        {
          title: 'Fundamental Suite',
          href: '/fundamental',
          desc: 'Central bank sentiment & yields',
          icon: Globe2,
        },
      ],
    },
    {
      id: 'news',
      title: 'News',
      icon: Newspaper,
      options: [
        {
          title: 'Gold Daily Briefing',
          href: '/xauusd-briefing',
          desc: 'Institutional bullion intel',
          icon: Crown,
          badge: 'XAU',
        },
        {
          title: 'AI Studio X Copilot',
          href: '/ai-studio',
          desc: 'Deep multi-agent reasoning',
          icon: Sparkles,
        },
        {
          title: 'NEXUS Copilot',
          href: '/jarvis',
          desc: 'NEXUS AI quantitative copilot',
          icon: Bot,
        },
      ],
    },
  ];

  return (
    <div ref={containerRef} className="relative flex flex-col justify-center">
      {/* Container Label (Matching Reference) */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
          Quick Access
        </span>
      </div>

      {/* Horizontal Cards Row */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {cards.map((card) => {
          const isOpen = openCardId === card.id;
          const isCardActive = card.options.some((opt) => opt.href === pathname);
          const Icon = card.icon;

          return (
            <div key={card.id} className="relative">
              {/* Card Button Matching Reference Image */}
              <button
                type="button"
                onClick={() => setOpenCardId(isOpen ? null : card.id)}
                className={`flex flex-col items-center justify-center w-[66px] sm:w-[72px] h-[52px] sm:h-[56px] rounded-xl transition-all select-none border group ${
                  isOpen
                    ? 'bg-[#101b36] border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/40'
                    : isCardActive
                    ? 'bg-[#0d172e] border-cyan-500/40 text-white'
                    : 'bg-[#0a1122]/90 hover:bg-[#101b36] border-[#1b2a47] hover:border-cyan-500/50'
                }`}
                title={`Quick Access: ${card.title}`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isOpen || isCardActive ? 'text-cyan-300' : 'text-cyan-400/90 group-hover:text-cyan-300'
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[10.5px] font-sans font-medium tracking-tight mt-1 truncate max-w-[62px] ${
                    isOpen || isCardActive ? 'text-white font-semibold' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {card.title}
                </span>
              </button>

              {/* Collapsible Dropdown Menu */}
              {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-[#091020]/95 border border-cyan-500/30 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 font-mono">
                  <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/[0.06] mb-1 flex items-center justify-between">
                    <span>{card.title} Options</span>
                    <span className="text-[8px] text-cyan-400">SELECT</span>
                  </div>

                  <div className="space-y-0.5">
                    {card.options.map((opt, oIdx) => {
                      const isActive = opt.href === pathname;
                      const OptIcon = opt.icon;

                      if (opt.href) {
                        return (
                          <Link
                            key={oIdx}
                            href={opt.href}
                            onClick={() => setOpenCardId(null)}
                            className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                              isActive
                                ? 'bg-cyan-500/20 text-white border border-cyan-500/40 font-semibold'
                                : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                            }`}
                          >
                            <OptIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{opt.title}</span>
                                {opt.badge && (
                                  <span className="text-[8px] px-1 py-0.2 rounded bg-white/[0.08] text-cyan-300 font-bold">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              {opt.desc && (
                                <p className="text-[9.5px] text-slate-400 truncate leading-tight mt-0.5">
                                  {opt.desc}
                                </p>
                              )}
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={opt.onClick}
                          className="w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all text-slate-300 hover:text-white hover:bg-white/[0.06]"
                        >
                          <OptIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{opt.title}</span>
                              {opt.badge && (
                                <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            {opt.desc && (
                              <p className="text-[9.5px] text-slate-400 truncate leading-tight mt-0.5">
                                {opt.desc}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Logo } from '../brand/Logo';
import { AegisVoiceGuardian } from '@/components/terminal/AegisVoiceGuardian';
import {
  LayoutDashboard,
  CandlestickChart,
  BrainCircuit,
  Bot,
  Layers,
  GitMerge,
  ScanLine,
  History,
  BookOpen,
  ShieldCheck,
  Code2,
  PieChart,
  BellRing,
  FileText,
  Settings as SettingsIcon,
  Flame,
  Calendar,
  Globe2,
  Sparkles,
  Crown,
  Key,
  BarChart2,
  Receipt,
  Calculator,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  highlight?: boolean;
}

export interface NavSection {
  id: string;
  sectionTitle: string;
  icon: any;
  items: NavItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: 'command-center',
    sectionTitle: 'Command Center',
    icon: LayoutDashboard,
    items: [
      { name: 'Command Center', href: '/', icon: LayoutDashboard },
      { name: 'War Room (Cyber HUD)', href: '/war-room', icon: ShieldCheck, badge: 'HUD' },
      { name: 'Markets', href: '/markets', icon: CandlestickChart },
      { name: 'Gold Briefing', href: '/xauusd-briefing', icon: Crown },
    ],
  },
  {
    id: 'quant-macro',
    sectionTitle: 'Quant & Macro',
    icon: Globe2,
    items: [
      { name: 'Forex Quant', href: '/forex-matrix', icon: Calculator },
      { name: 'Fundamental Suite', href: '/fundamental', icon: Globe2 },
      { name: 'Economic Calendar', href: '/economic-calendar', icon: Calendar },
      { name: 'Volume Profile', href: '/volume-profile', icon: BarChart2 },
      { name: 'SMC / ICT', href: '/smc-ict', icon: Layers },
    ],
  },
  {
    id: 'ai-intelligence',
    sectionTitle: 'AI Intelligence',
    icon: BrainCircuit,
    items: [
      { name: 'AI Studio X', href: '/ai-studio', icon: Sparkles },
      { name: 'NEXUS AI', href: '/jarvis', icon: Bot, badge: 'VOICE' },
      { name: 'AI Analyst', href: '/ai-analyst', icon: BrainCircuit },
    ],
  },
  {
    id: 'strategies-execution',
    sectionTitle: 'Strategies & Execution',
    icon: GitMerge,
    items: [
      { name: 'Strategies', href: '/strategies', icon: GitMerge },
      { name: 'Scanner', href: '/scanner', icon: ScanLine },
      { name: 'Backtesting', href: '/backtesting', icon: History },
      { name: 'Trading Journal', href: '/journal', icon: BookOpen },
      { name: 'Risk Management', href: '/risk', icon: ShieldCheck },
    ],
  },
  {
    id: 'portfolio-access',
    sectionTitle: 'Portfolio & Access',
    icon: PieChart,
    items: [
      { name: 'Portfolio', href: '/portfolio', icon: PieChart },
      { name: 'SaaS Plans', href: '/pricing', icon: Sparkles },
      { name: 'Billing & License', href: '/billing', icon: Key },
      { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ],
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenJarvis?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  onOpenJarvis,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

  // Manage open/closed state for each of the 5 parent sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    return {
      'command-center': true,
      'quant-macro': false,
      'ai-intelligence': false,
      'strategies-execution': false,
      'portfolio-access': false,
    };
  });

  // Automatically expand the section that contains the currently active page
  useEffect(() => {
    NAVIGATION_SECTIONS.forEach(section => {
      const isCurrentSectionActive = section.items.some(it => it.href === pathname);
      if (isCurrentSectionActive) {
        setOpenSections(prev => ({ ...prev, [section.id]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebarContent = (
    <div className="w-72 bg-[#06080d] flex flex-col h-full overflow-y-auto scrollbar-thin select-none">
      {/* Brand Header — Single Unified Primary Logo */}
      <div className="h-[68px] px-3.5 border-b border-[#00ff9d18] bg-gradient-to-r from-[#0b1e13] via-[#08170e] to-[#060d09] flex items-center justify-between w-full select-none shrink-0 shadow-[0_2px_20px_rgba(0,255,157,0.06)]">
        <Link href="/" className="block w-full flex-1 group" onClick={onCloseMobile}>
          <div className="relative overflow-hidden rounded-xl p-1 bg-gradient-to-r from-[#00ff9d0c] via-transparent to-[#00ff9d0c] border border-[#00ff9d25] shadow-[0_0_15px_rgba(0,255,157,0.08)] group-hover:border-[#00ff9d55] group-hover:shadow-[0_0_22px_rgba(0,255,157,0.18)] transition-all duration-300">
            <Image
              src="/clever_trader_new_logo.png"
              alt="THE CLEVER TRADER"
              width={256}
              height={64}
              priority
              className="w-full h-auto object-cover rounded-lg block transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        </Link>
        {/* Desktop Collapse Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse Sidebar [ - ]"
            className="hidden lg:flex items-center justify-center p-1.5 ml-2 text-slate-400 hover:text-[#00ff9d] rounded-lg border border-white/10 hover:border-[#00ff9d44] hover:bg-[#00ff9d15] transition-all shrink-0 group"
          >
            <PanelLeftClose className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        )}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] shrink-0 ml-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Grouped Collapsible Navigation Sections */}
      <nav className="flex-1 px-2.5 py-3 space-y-1">
        {NAVIGATION_SECTIONS.map((section) => {
          const isOpen = !!openSections[section.id];
          const hasActiveItem = section.items.some(item => pathname === item.href);
          const SectionIcon = section.icon;

          return (
            <div key={section.id} className="space-y-1">
              {/* Collapsible Section Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono font-medium transition-all group select-none ${
                  hasActiveItem
                    ? 'text-white bg-white/[0.05]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SectionIcon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      hasActiveItem ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="font-semibold text-[11px] uppercase tracking-normal whitespace-nowrap truncate">
                    {section.sectionTitle}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                  <span className="text-[9px] text-slate-500 font-mono">[{section.items.length}]</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-200 shrink-0 ${
                      isOpen ? 'rotate-0 text-cyan-400' : '-rotate-90'
                    }`}
                  />
                </div>
              </button>

              {/* Sub-items dropdown */}
              {isOpen && (
                <div className="ml-3 pl-2.5 space-y-0.5 border-l border-white/[0.07] my-1 transition-all">
                  {section.items.map(item => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={onCloseMobile}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium font-mono transition-all group gpu-layer ${
                          isActive
                            ? 'text-white bg-white/[0.08] font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Interactive NEXUS AI Voice Guardian & Copilot Trigger Card */}
      <AegisVoiceGuardian
        onOpenJarvis={() => {
          onCloseMobile?.();
          onOpenJarvis?.();
        }}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Collapsible Institutional Sidebar */}
      <aside
        className={`hidden lg:flex border-r border-white/[0.08] bg-[#020202] flex-col shrink-0 h-screen sticky top-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 border-r-0 opacity-0 pointer-events-none' : 'w-72 opacity-100'
        }`}
      >
        {sidebarContent}
      </aside>


      {/* Mobile / Tablet Smooth Slide-over Drawer */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden bg-black/90 animate-backdrop-fade flex"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseMobile?.();
          }}
        >
          <div className="relative w-72 h-full shadow-2xl animate-in slide-in-from-left duration-200 border-r border-cyan-500/30">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};


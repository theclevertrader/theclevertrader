'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Terminal, 
  CandlestickChart, 
  Bot, 
  History, 
  BookOpen, 
  ShieldCheck, 
  Code2, 
  ScanLine, 
  X,
  Calendar,
  Globe2
} from 'lucide-react';
import { INSTITUTIONAL_SYMBOLS } from '@/lib/constants/symbols';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  onSelectSymbol?: (symbol: string) => void;
  onOpenJarvis?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onToggle,
  onSelectSymbol,
  onOpenJarvis,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (onToggle) onToggle();
        else onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onToggle]);

  if (!isOpen) return null;


  const actions = [
    {
      id: 'open-xau',
      title: 'Analyze XAUUSD (Gold)',
      category: 'MARKET',
      icon: CandlestickChart,
      action: () => {
        onSelectSymbol?.('XAUUSD');
        router.push('/markets');
        onClose();
      },
    },
    {
      id: 'open-btc',
      title: 'Analyze BTCUSD (Bitcoin)',
      category: 'MARKET',
      icon: CandlestickChart,
      action: () => {
        onSelectSymbol?.('BTCUSD');
        router.push('/markets');
        onClose();
      },
    },
    {
      id: 'open-nas100',
      title: 'Analyze NAS100 (Nasdaq)',
      category: 'MARKET',
      icon: CandlestickChart,
      action: () => {
        onSelectSymbol?.('NAS100');
        router.push('/markets');
        onClose();
      },
    },
    {
      id: 'ask-jarvis',
      title: 'Ask JARVIS (Roman Urdu Copilot)',
      category: 'AI COPILOT',
      icon: Bot,
      action: () => {
        onOpenJarvis?.();
        router.push('/jarvis');
        onClose();
      },
    },
    {
      id: 'run-backtest',
      title: 'Run Backtesting Suite',
      category: 'QUANT',
      icon: History,
      action: () => {
        router.push('/backtesting');
        onClose();
      },
    },
    {
      id: 'open-journal',
      title: 'Open Trading Journal & AI Audit',
      category: 'JOURNAL',
      icon: BookOpen,
      action: () => {
        router.push('/journal');
        onClose();
      },
    },
    {
      id: 'open-risk',
      title: 'Open Risk Manager (0.01 / $3 / $9 Target)',
      category: 'RISK',
      icon: ShieldCheck,
      action: () => {
        router.push('/risk');
        onClose();
      },
    },
    {
      id: 'open-pine',
      title: 'Generate Pine Script in Pine Lab',
      category: 'CODE',
      icon: Code2,
      action: () => {
        router.push('/pine-lab');
        onClose();
      },
    },
    {
      id: 'open-scanner',
      title: 'Open Multi-Asset Market Scanner',
      category: 'SCANNER',
      icon: ScanLine,
      action: () => {
        router.push('/scanner');
        onClose();
      },
    },
    {
      id: 'open-fundamental',
      title: 'Open Fundamental Suite & Macro Drivers',
      category: 'MACRO',
      icon: Globe2,
      action: () => {
        router.push('/fundamental');
        onClose();
      },
    },
    {
      id: 'open-calendar',
      title: 'Open Economic Calendar & News Events',
      category: 'NEWS',
      icon: Calendar,
      action: () => {
        router.push('/economic-calendar');
        onClose();
      },
    },
  ];

  const filtered = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/90 animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-surface-card border border-cyan-500/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-mono animate-modal-pop">
        {/* Search Input Bar */}

        <div className="flex items-center gap-3 px-4 py-3 border-b border-terminal-border bg-surface-elevated">
          <Terminal className="w-4 h-4 text-terminal-cyan" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command (e.g. 'Analyze XAUUSD', 'Ask JARVIS', 'Run backtest')..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No institutional commands found matching "{query}"
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-surface border border-white/[0.06] text-terminal-cyan group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-slate-200 group-hover:text-white font-medium">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 group-hover:text-terminal-cyan">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-terminal-border bg-surface-elevated/40 text-[10px] text-slate-500">
          <span>Navigate with mouse or arrow keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};

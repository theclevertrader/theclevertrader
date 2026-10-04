'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, AppTheme } from '@/lib/theme/ThemeContext';

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: AppTheme; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'dark',
      label: 'Black',
      icon: <Moon className="w-3 h-3" />,
      desc: 'Pure OLED Black Theme',
    },
    {
      id: 'light',
      label: 'Light',
      icon: <Sun className="w-3 h-3" />,
      desc: 'Wall Street White Light',
    },
    {
      id: 'grey',
      label: 'Grey',
      icon: <Monitor className="w-3 h-3" />,
      desc: 'MetaTrader 5 Charcoal Grey',
    },
  ];

  return (
    <div className="flex items-center bg-black/40 dark:bg-black/60 p-0.5 rounded-lg border border-white/[0.08] text-xs font-mono select-none">
      {themes.map(t => {
        const isActive = theme === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={`${t.label} Theme — ${t.desc}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-amber-400 text-black shadow-sm font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

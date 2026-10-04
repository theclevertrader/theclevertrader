'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light' | 'grey';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ct_theme') as AppTheme;
    // Migrate any legacy 'grey' theme preference to pure black 'dark'
    if (saved === 'grey') {
      localStorage.setItem('ct_theme', 'dark');
      setThemeState('dark');
      applyTheme('dark');
    } else if (saved && (saved === 'dark' || saved === 'light')) {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      localStorage.setItem('ct_theme', 'dark');
      setThemeState('dark');
      applyTheme('dark');
    }
    setMounted(true);
  }, []);

  const applyTheme = (t: AppTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'theme-grey');
    root.removeAttribute('data-theme');

    if (t === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (t === 'light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else if (t === 'grey') {
      root.classList.add('dark', 'theme-grey');
      root.setAttribute('data-theme', 'grey');
    }
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('ct_theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

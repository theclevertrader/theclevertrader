'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMarketData } from '@/lib/hooks/useMarketData';

const CommandPalette = dynamic(
  () => import('./CommandPalette').then((mod) => mod.CommandPalette),
  { ssr: false }
);

const JarvisModal = dynamic(
  () => import('../jarvis/JarvisModal').then((mod) => mod.JarvisModal),
  { ssr: false }
);

const AegisVoiceGuardian = dynamic(
  () => import('../terminal/AegisVoiceGuardian').then((mod) => mod.AegisVoiceGuardian),
  { ssr: false }
);

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { selectedSymbol, setSelectedSymbol } = useMarketData();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Restore user's collapse preference (default to open so user is not locked out)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ct_sidebar_collapsed');
      if (saved === 'true') {
        setIsSidebarCollapsed(false);
        localStorage.setItem('ct_sidebar_collapsed', 'false');
      }
    } catch {
      // Safe SSR
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ct_sidebar_collapsed', String(next));
      } catch {
        // Safe storage
      }
      return next;
    });
  };

  // Keyboard shortcut: Pressing '[' or 'Ctrl+B' toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey && e.key.toLowerCase() === 'b') || e.key === '[') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (pathname === '/war-room') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-black relative">
      {/* Institutional Sidebar (Desktop fixed + Mobile slide-over drawer) */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenJarvis={() => setIsJarvisOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Terminal Stage — Automatically Expands to 100% Full Width */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ease-in-out">
        <Header
          activeSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenJarvis={() => setIsJarvisOpen(true)}
          onToggleDesktopSidebar={handleToggleSidebar}
          isDesktopSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Scrollable Work Area (GPU Accelerated 144 FPS) */}
        <main className="flex-1 overflow-y-auto pt-1.5 px-2 pb-4 sm:pt-2 sm:px-2.5 sm:pb-5 md:pt-2 md:px-3 md:pb-6 space-y-2.5 gpu-layer">
          {children}
        </main>
      </div>

      {/* Ctrl+K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggle={() => setIsCommandPaletteOpen(prev => !prev)}
        onSelectSymbol={setSelectedSymbol}
        onOpenJarvis={() => setIsJarvisOpen(true)}
      />

      {/* JARVIS Roman Urdu Chat Modal */}
      <JarvisModal
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        currentContext={{
          symbol: selectedSymbol,
          price: selectedSymbol === 'XAUUSD' ? 2652.40 : 63840.0,
          htfBias: 'Bullish',
          setupScore: 88,
        }}
      />

      {/* A.E.G.I.S Autonomous Voice Guardian (Active at Bottom-Left when Desktop Sidebar is Collapsed) */}
      {isSidebarCollapsed && (
        <AegisVoiceGuardian
          isCollapsed={true}
          onOpenJarvis={() => setIsJarvisOpen(true)}
        />
      )}
    </div>
  );
};


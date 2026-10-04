import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/layout/Shell';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { MarketDataProvider } from '@/lib/hooks/useMarketData';
import { DevPerformanceMonitor } from '@/components/terminal/DevPerformanceMonitor';

export const metadata: Metadata = {
  title: 'THE CLEVER TRADER — Institutional AI Hedge Fund Terminal',
  description: 'Elite AI-powered trading platform combining Smart Money Concepts (SMC), ICT, algorithmic confluence, risk management, NEXUS AI copilot, backtesting, and Pine Lab.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-slate-100 font-sans antialiased min-h-screen cyber-grid selection:bg-amber-400 selection:text-black">
        <ThemeProvider>
          <MarketDataProvider>
            <Shell>{children}</Shell>
            <DevPerformanceMonitor />
          </MarketDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

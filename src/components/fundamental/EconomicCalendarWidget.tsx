'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  Filter, 
  Clock, 
  RefreshCw, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  Key,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { EconomicEvent, ImpactLevel } from '@/lib/engines/fundamental-engine';

interface EconomicCalendarWidgetProps {
  compact?: boolean;
}

export const EconomicCalendarWidget: React.FC<EconomicCalendarWidgetProps> = ({ compact = false }) => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [finnhubKey, setFinnhubKey] = useState<string>('');
  const [alphaKey, setAlphaKey] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const fetchCalendar = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/fundamental');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.overview?.economicEvents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApiKeys = async () => {
    try {
      const res = await fetch('/api/fundamental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_keys',
          finnhub: finnhubKey,
          alphaVantage: alphaKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setShowApiKeyModal(false);
        }, 2000);
        fetchCalendar();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered list
  const filteredEvents = events.filter(e => {
    if (impactFilter !== 'ALL' && e.impact !== impactFilter) return false;
    if (currencyFilter !== 'ALL' && e.currency !== currencyFilter) return false;
    return true;
  });

  const currencies = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  return (
    <div className="tv-card p-4 space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#242b38] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-tv-blue border border-blue-500/20">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Institutional Economic Calendar
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-tv-blue font-mono font-semibold border border-blue-500/30">
                LIVE FEED
              </span>
            </div>
            <p className="text-[11px] text-[#848e9c]">
              High-impact red folder news, forecasts, and auto-trade safety locks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a202c] border border-[#242b38] hover:border-tv-blue text-[#d1d5db] hover:text-white transition-all text-xs"
            title="Configure Free API Keys"
          >
            <Key className="w-3.5 h-3.5 text-tv-blue" />
            <span className="hidden sm:inline">Free API Keys</span>
          </button>

          <button
            onClick={fetchCalendar}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#1a202c] border border-[#242b38] hover:border-[#333d4e] text-[#848e9c] hover:text-white transition-colors"
            title="Refresh Calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Impact Selector */}
        <div className="flex items-center bg-[#0c1017] p-1 rounded-lg border border-[#242b38]">
          <button
            onClick={() => setImpactFilter('ALL')}
            className={`px-2.5 py-1 rounded font-medium transition-all ${
              impactFilter === 'ALL'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-[#848e9c] hover:text-white'
            }`}
          >
            All News
          </button>
          <button
            onClick={() => setImpactFilter('HIGH')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
              impactFilter === 'HIGH'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-[#848e9c] hover:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>High Impact Only</span>
          </button>
          <button
            onClick={() => setImpactFilter('MEDIUM')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-all ${
              impactFilter === 'MEDIUM'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-[#848e9c] hover:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Medium</span>
          </button>
        </div>

        {/* Currency Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {currencies.map(curr => (
            <button
              key={curr}
              onClick={() => setCurrencyFilter(curr)}
              className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                currencyFilter === curr
                  ? 'bg-tv-blue text-white font-bold'
                  : 'bg-[#181e2b] text-[#848e9c] hover:text-white border border-[#242b38]'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Cards */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-[#848e9c] bg-[#0c1017] rounded-xl border border-[#242b38]">
            No economic events match the current filter selection.
          </div>
        ) : (
          filteredEvents.map(event => {
            const isHigh = event.impact === 'HIGH';
            const isExpanded = expandedId === event.id;

            return (
              <div
                key={event.id}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  event.noTradeLock
                    ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-[#161b26] border-[#242b38] hover:border-[#3b475c]'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : event.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Time, Currency & Event Name */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#848e9c] shrink-0">
                      <Clock className="w-3.5 h-3.5 text-tv-blue" />
                      <span>{event.timeString}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                        isHigh 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {event.currency}
                      </span>
                      <span className="font-bold text-white text-xs hover:text-tv-blue transition-colors">
                        {event.event}
                      </span>
                    </div>
                  </div>

                  {/* Right: Metrics & Lock Badge */}
                  <div className="flex items-center gap-3 text-xs font-mono ml-auto">
                    {event.noTradeLock && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] animate-pulse">
                        <ShieldAlert className="w-3 h-3" />
                        <span>NO-TRADE LOCK ({event.minutesUntil}m)</span>
                      </span>
                    )}

                    <div className="flex items-center gap-2 text-[11px]">
                      <div className="text-right">
                        <span className="text-[#848e9c] text-[10px] block">Actual</span>
                        <span className={`font-bold ${event.actual ? 'text-tv-green' : 'text-[#848e9c]'}`}>
                          {event.actual || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#848e9c] text-[10px] block">Forecast</span>
                        <span className="text-slate-300 font-semibold">{event.forecast}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#848e9c] text-[10px] block">Previous</span>
                        <span className="text-[#848e9c]">{event.previous}</span>
                      </div>
                    </div>

                    <div className="text-[#848e9c] hover:text-white pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Roman Urdu Insight */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] text-[11px] space-y-1 animate-expand">
                    <span className="font-bold text-tv-blue block">
                      💡 AI Macro & Institutional Analysis:
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-[#0c1017] p-2.5 rounded-lg border border-[#242b38]">
                      {event.romanUrduAnalysis}
                    </p>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Free API Keys Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#131722] border border-[#242b38] rounded-2xl p-6 space-y-4 shadow-2xl font-sans text-xs">
            <div className="flex items-center justify-between border-b border-[#242b38] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-tv-blue" />
                <h4 className="text-sm font-bold text-white">
                  Connect Free Fundamental API Keys
                </h4>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="text-[#848e9c] hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-[#848e9c] leading-relaxed">
              Clever Trader terminal ke pass pehle se real-time institutional economic data active hai. Agar aap apna personal free API key connect karna chahein to yahan enter karein:
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">Finnhub Free API Key</label>
                  <a 
                    href="https://finnhub.io/register" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-tv-blue hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={finnhubKey}
                  onChange={e => setFinnhubKey(e.target.value)}
                  placeholder="Paste Finnhub free token here..."
                  className="w-full bg-[#0c1017] border border-[#242b38] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-tv-blue font-mono text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">Alpha Vantage Free API Key</label>
                  <a 
                    href="https://www.alphavantage.co/support/#api-key" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-tv-blue hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={alphaKey}
                  onChange={e => setAlphaKey(e.target.value)}
                  placeholder="Paste Alpha Vantage free key here..."
                  className="w-full bg-[#0c1017] border border-[#242b38] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-tv-blue font-mono text-xs"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-tv-green text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>API keys saved! Live feed synchronized.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-lg bg-[#181e2b] text-[#848e9c] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKeys}
                className="px-4 py-2 rounded-lg bg-tv-blue hover:bg-blue-600 text-white font-bold transition-colors shadow-sm"
              >
                Save & Connect Keys
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

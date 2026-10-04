'use client';

import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CalendarEvent {
  currency: string;
  event: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  flag: string;
}

const EVENTS: CalendarEvent[] = [
  { currency: 'USD', event: 'FOMC Member Bowman Speaks', time: '14:30', impact: 'High', flag: '🇺🇸' },
  { currency: 'EUR', event: 'ECB President Lagarde Speaks', time: '16:00', impact: 'Medium', flag: '🇪🇺' },
  { currency: 'USD', event: 'Core PCE Price Index (MoM)', time: '16:30', impact: 'High', flag: '🇺🇸' },
  { currency: 'GBP', event: 'GDP (QoQ)', time: '18:00', impact: 'Medium', flag: '🇬🇧' },
  { currency: 'USD', event: 'Unemployment Claims', time: '20:30', impact: 'Medium', flag: '🇺🇸' },
];

export const CompactEconomicCalendar: React.FC = () => {
  return (
    <div className="ronas-card p-3 flex flex-col bg-[#0c101c] border border-white/[0.08] h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black text-white tracking-wider uppercase">Economic Calendar</span>
        </div>
        <Link
          href="/economic-calendar"
          className="text-[10px] text-cyan-400 hover:text-white font-mono font-bold flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Events List */}
      <div className="space-y-1 flex-1 overflow-y-auto scrollbar-none">
        {EVENTS.map((event, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 py-1.5 px-1.5 rounded-md hover:bg-white/[0.03] transition-all"
          >
            {/* Flag & Currency */}
            <div className="flex items-center gap-1.5 min-w-[50px]">
              <span className="text-sm">{event.flag}</span>
              <span className="text-[10px] font-bold text-white font-mono">{event.currency}</span>
            </div>

            {/* Event Name */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-slate-300 font-mono truncate block">{event.event}</span>
            </div>

            {/* Time */}
            <span className="text-[10px] text-slate-400 font-mono shrink-0">{event.time}</span>

            {/* Impact */}
            <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 ${
              event.impact === 'High'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : event.impact === 'Medium'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
            }`}>
              {event.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

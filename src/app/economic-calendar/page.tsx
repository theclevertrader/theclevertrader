'use client';

import React from 'react';
import { EconomicCalendarWidget } from '@/components/fundamental/EconomicCalendarWidget';
import { Calendar, ShieldAlert, Radio, HelpCircle } from 'lucide-react';

export default function EconomicCalendarPage() {
  return (
    <div className="space-y-6 font-sans w-full">
      {/* Page Title & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl tv-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-tv-blue">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">
                GLOBAL ECONOMIC CALENDAR & NEWS ENGINE
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-tv-green font-mono font-bold border border-emerald-500/40">
                SYNCHRONIZED
              </span>
            </div>
            <p className="text-xs text-[#848e9c]">
              High-impact Tier 1 releases • Actual vs Forecast deviations • Auto-trader drawdown protection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>NO-TRADE NEWS LOCK: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Economic Calendar Widget */}
      <EconomicCalendarWidget />

      {/* Institutional Explanatory Notes in Roman Urdu */}
      <div className="p-4 rounded-xl tv-card space-y-2 text-xs">
        <div className="flex items-center gap-2 text-tv-blue font-bold">
          <HelpCircle className="w-4 h-4" />
          <span>Economic Calendar & News Trading Rules (Roman Urdu):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300">
          <div className="p-3 rounded-lg bg-[#0c1017] border border-[#242b38] space-y-1">
            <span className="font-bold text-rose-400 block">1. Red Folder (High Impact) News:</span>
            <p className="text-[#848e9c] leading-relaxed">
              NFP, CPI, aur FOMC rate decisions ke dauran brokers spread 5x se 10x tak barha dete hain. Bot automatically news release se 30 minute pehle trade lena band kar deta hai.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1017] border border-[#242b38] space-y-1">
            <span className="font-bold text-amber-400 block">2. Actual vs Forecast Deviation:</span>
            <p className="text-[#848e9c] leading-relaxed">
              Agar Actual number Forecast se barh kar aye to us currency mein immediate liquidity expansion hoti hai. News ke baad first 15M candle ka wait karein.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[#0c1017] border border-[#242b38] space-y-1">
            <span className="font-bold text-tv-green block">3. SMC / ICT News Confluence:</span>
            <p className="text-[#848e9c] leading-relaxed">
              Smart Money news events ko liquidity sweeps ke tor par use karta hai. Asian high/low sweep hone ke baad market reverse hoti hai jahan hamara AI bot entry leta hai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

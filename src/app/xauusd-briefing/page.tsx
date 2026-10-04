"use client";

import React from "react";
import XauusdDailyBriefing from "@/components/trading/XauusdDailyBriefing";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function XauusdBriefingPage() {
  return (
    <div className="w-full space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Hedge Fund Terminal</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export Briefing</span>
          </button>
          <Link
            href="/ai-studio"
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold hover:brightness-110 transition-all shadow-md shadow-amber-950/40"
          >
            Go to AI Studio X 🚀
          </Link>
        </div>
      </div>

      <XauusdDailyBriefing />
    </div>
  );
}

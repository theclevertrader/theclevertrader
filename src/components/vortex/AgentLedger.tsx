'use client';

import React from "react";
import type { Agent } from "@/lib/vortex/vortex-engine";
import { fmtNum } from "@/lib/vortex/vortex-engine";
import { Sparkline } from "./VortexCharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATE_TONE: Record<Agent["state"], string> = {
  ENGAGED: "text-up border-up/40 bg-up/10",
  SCANNING: "text-accent border-accent/40 bg-accent-soft",
  HEDGING: "text-amber-700 border-amber-600/40 bg-amber-500/10",
  COOLING: "text-ink-faint border-line-strong bg-paper",
  OPTIMAL: "text-emerald-500 border-emerald-500/40 bg-emerald-500/10",
  ACTIVE: "text-cyan-500 border-cyan-500/40 bg-cyan-500/10",
  SAFE: "text-blue-500 border-blue-500/40 bg-blue-500/10",
};

export const AgentCard = React.memo(function AgentCard({ agent }: { agent: Agent }) {
  const up = agent.pnl >= 0;
  return (
    <div className="flex min-w-0 flex-col border border-line bg-panel font-mono">
      <div className="flex items-center justify-between border-b border-line px-2 py-[3px]">
        <span className="text-[9px] tracking-[0.14em] text-ink-faint">
          {String(agent.fills).padStart(3, "0")} FILLS
        </span>
        <span className="text-[8.5px] tracking-[0.1em] text-ink-faint">
          {(agent.hitRate * 100).toFixed(0)}% HIT
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 px-2 pt-2.5 pb-1">
        <div
          className="relative flex h-9 w-9 items-center justify-center rounded-full border"
          style={{ borderColor: agent.color, background: `${agent.color}12` }}
        >
          <div
            className="h-3.5 w-3.5 rounded-full"
            style={{ background: agent.color, opacity: 0.25 + agent.conviction * 0.7 }}
          />
          <div
            className="absolute inset-0 rounded-full border ct-pulse"
            style={{ borderColor: `${agent.color}55` }}
          />
        </div>
        <div className="text-[11px] font-bold tracking-[0.2em]" style={{ color: agent.color }}>
          {agent.id}
        </div>
        <div className="text-center text-[8px] tracking-[0.1em] text-ink-faint uppercase">
          {agent.mandate}
        </div>
      </div>

      <div className="px-2">
        <div
          className={cn(
            "text-center text-[15px] leading-none font-medium tabular-nums",
            up ? "text-up" : "text-down",
          )}
        >
          {up ? "+" : "−"}${fmtNum(Math.abs(agent.pnl), 0)}
        </div>
      </div>

      <div className="mt-1 px-1">
        <Sparkline data={agent.series} color={agent.color} height={30} />
      </div>

      <div className="flex items-center justify-between gap-1 border-t border-line px-2 py-[3px]">
        <span
          className={cn(
            "border px-1 py-[0.5px] text-[7.5px] tracking-[0.1em] font-semibold",
            STATE_TONE[agent.state],
          )}
        >
          {agent.state}
        </span>
        <span className="text-[8.5px] tabular-nums text-ink-faint">
          {agent.exposure.toFixed(1)}% · {agent.latency.toFixed(1)}ms
        </span>
      </div>
    </div>
  );
});

export const AgentLedger = React.memo(function AgentLedger({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 font-mono">
      {agents.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
});

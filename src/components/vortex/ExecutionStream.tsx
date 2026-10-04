import { memo } from "react";
import type { Fill } from "@/lib/vortex/vortex-engine";
import { fmtNum } from "@/lib/vortex/vortex-engine";

export const ExecutionStream = memo(function ExecutionStream({ fills }: { fills: Fill[] }) {
  return (
    <div className="h-full overflow-hidden font-mono">
      <div className="grid grid-cols-[52px_58px_34px_1fr_54px_58px] gap-1 border-b border-line bg-paper/60 px-2 py-[3px] text-[8.5px] tracking-[0.12em] text-ink-faint uppercase">
        <span>TIME</span>
        <span>ORIGIN</span>
        <span>SIDE</span>
        <span>VENUE / LOT / TICKET</span>
        <span className="text-right">PRICE</span>
        <span className="text-right">P&L</span>
      </div>
      <div className="h-[calc(100%-19px)] overflow-y-auto">
        {fills.map((f) => (
          <div
            key={f.id}
            className={`grid grid-cols-[52px_58px_34px_1fr_54px_58px] gap-1 border-b border-line/60 px-2 py-[2.5px] text-[9.5px] tabular-nums ${
              f.isOpen ? 'bg-accent/10 border-accent/30' : ''
            } ${
              f.side === "BUY" ? "ct-flash-up" : "ct-flash-down"
            }`}
          >
            <span className="text-ink-faint">{f.time}</span>
            <span className="text-ink font-semibold flex items-center gap-1">
              {f.isOpen && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />}
              {f.isOpen ? 'MT5' : f.agent}
            </span>
            <span className={f.side === "BUY" ? "text-up font-bold" : "text-down font-bold"}>{f.side}</span>
            <span className="truncate text-ink-soft">
              {f.isOpen ? (
                <span className="text-accent font-semibold">#{f.ticket} · {f.size}L · {f.venue}</span>
              ) : (
                `${f.size}L · ${f.strategy}`
              )}
            </span>
            <span className="text-right text-ink">{f.price > 1000 ? f.price.toFixed(1) : f.price.toFixed(4)}</span>
            <span className={`text-right font-bold ${f.pnl >= 0 ? "text-up" : "text-down"}`}>
              {f.pnl >= 0 ? "+" : "−"}${fmtNum(Math.abs(f.pnl), 2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

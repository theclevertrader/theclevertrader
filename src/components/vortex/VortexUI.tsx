import type { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Panel({
  title,
  tag,
  tagTone = "neutral",
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  tag?: string;
  tagTone?: "neutral" | "up" | "down" | "accent";
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col border border-line bg-panel",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-line px-2.5 py-[5px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-[7px] w-[7px] border border-ink-faint bg-accent/70" />
          <h2 className="text-[10px] font-medium tracking-[0.18em] text-ink">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {tag && <Tag tone={tagTone}>{tag}</Tag>}
        </div>
      </header>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "up" | "down" | "accent";
}) {
  return (
    <span
      className={cn(
        "border px-1.5 py-[1px] text-[9px] tracking-[0.14em] uppercase",
        tone === "neutral" && "border-line-strong text-ink-soft",
        tone === "up" && "border-up/40 bg-up/10 text-up",
        tone === "down" && "border-down/40 bg-down/10 text-down",
        tone === "accent" && "border-accent/40 bg-accent-soft text-accent",
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[9px] tracking-[0.16em] text-ink-faint uppercase font-mono", className)}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "ink",
  accessory,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "up" | "down" | "accent";
  accessory?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-r border-line px-3 py-2 last:border-r-0 font-mono">
      <Label>{label}</Label>
      <div
        className={cn(
          "truncate text-[19px] leading-none font-medium tabular-nums",
          tone === "ink" && "text-ink",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
      </div>
      <div className="flex items-center justify-between gap-2">
        {sub && <div className="truncate text-[9px] tracking-[0.1em] text-ink-faint">{sub}</div>}
        {accessory}
      </div>
    </div>
  );
}

export function Bar({ value, tone = "#1d4ed8" }: { value: number; tone?: string }) {
  return (
    <div className="h-[3px] w-full bg-line">
      <div
        className="h-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(2, value * 100))}%`, background: tone }}
      />
    </div>
  );
}

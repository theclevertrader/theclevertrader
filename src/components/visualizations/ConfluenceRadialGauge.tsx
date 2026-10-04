'use client';

import React from 'react';

interface ConfluenceRadialGaugeProps {
  score: number; // 0 - 100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showTier?: boolean;
}

export const ConfluenceRadialGauge: React.FC<ConfluenceRadialGaugeProps> = ({
  score = 88,
  size = 'md',
  label = 'CONFLUENCE',
  showTier = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine size specs
  const dims = {
    sm: { width: 68, stroke: 5, fontSize: 'text-sm', labelSize: 'text-[8px]' },
    md: { width: 96, stroke: 7, fontSize: 'text-xl', labelSize: 'text-[9px]' },
    lg: { width: 128, stroke: 9, fontSize: 'text-2xl', labelSize: 'text-[10px]' },
  }[size];

  const radius = (dims.width - dims.stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Tier Colors
  let strokeColor = '#f59e0b'; // Amber
  let tierLabel = 'MODERATE';

  if (clampedScore >= 85) {
    strokeColor = '#10b981'; // Emerald
    tierLabel = 'EXTREME';
  } else if (clampedScore >= 70) {
    strokeColor = '#00f0ff'; // Cyan
    tierLabel = 'STRONG';
  } else if (clampedScore < 50) {
    strokeColor = '#f43f5e'; // Rose
    tierLabel = 'CAUTION';
  }

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative flex items-center justify-center" style={{ width: dims.width, height: dims.width }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${dims.width} ${dims.width}`}>
          {/* Background Track */}
          <circle
            cx={dims.width / 2}
            cy={dims.width / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-slate-800 dark:text-slate-800/80 text-opacity-40"
            strokeWidth={dims.stroke}
          />
          {/* Active Animated Gauge Arc */}
          <circle
            cx={dims.width / 2}
            cy={dims.width / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={dims.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Figure */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-black tracking-tight text-white ${dims.fontSize} tabular-nums`}>
            {clampedScore}<span className="text-[10px] font-normal text-slate-400">%</span>
          </span>
          <span className={`font-mono font-bold uppercase tracking-wider text-slate-400 ${dims.labelSize}`}>
            {label}
          </span>
        </div>
      </div>

      {showTier && (
        <span
          className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider border shadow-sm"
          style={{
            borderColor: `${strokeColor}40`,
            backgroundColor: `${strokeColor}15`,
            color: strokeColor,
          }}
        >
          {tierLabel}
        </span>
      )}
    </div>
  );
};

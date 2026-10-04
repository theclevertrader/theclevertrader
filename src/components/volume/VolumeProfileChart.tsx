'use client';

import React from 'react';
import { VolumeProfileResult, VwapResult } from '@/lib/volume/volume-types';

interface VolumeProfileChartProps {
  profile: VolumeProfileResult;
  vwap?: VwapResult;
  currentPrice?: number;
  height?: number;
  width?: number;
  profileWidthRatio?: number; // default 0.40 (40% of chart width)
}

export const VolumeProfileChart: React.FC<VolumeProfileChartProps> = ({
  profile,
  vwap,
  currentPrice,
  height = 420,
  width = 620,
  profileWidthRatio = 0.45,
}) => {
  const bins = profile.bins || [];
  const nonZeroBins = bins.filter(b => b.volume > 0);

  // 1. Guard against insufficient profile data
  if (bins.length < 5 || nonZeroBins.length < 3 || profile.totalVolume <= 0) {
    return (
      <div 
        style={{ height }} 
        className="flex flex-col items-center justify-center bg-[#070b13] border border-white/[0.08] rounded-xl text-slate-400 font-mono text-xs gap-2 p-6"
      >
        <span className="text-amber-400 font-bold tracking-wider text-sm">⚠️ INSUFFICIENT PROFILE DATA</span>
        <span className="text-slate-500 text-[11px] text-center max-w-sm">
          A minimum of 5 price levels and non-zero volume is required to render a statistically valid Volume-at-Price profile.
        </span>
      </div>
    );
  }

  // 2. Determine price bounds
  const minPrice = bins[0].price;
  const maxPrice = bins[bins.length - 1].price + (profile.tickSize || 0.01);
  const priceSpan = Math.max(0.0001, maxPrice - minPrice);
  const maxBinVolume = Math.max(...bins.map(b => b.volume), 1);

  // Padding & Layout Geometry
  const paddingTop = 28;
  const paddingBottom = 28;
  const paddingRight = 75; // for price axis labels
  const paddingLeft = 10;

  const chartDrawableHeight = height - paddingTop - paddingBottom;
  const priceToY = (p: number) => {
    return height - paddingBottom - ((p - minPrice) / priceSpan) * chartDrawableHeight;
  };

  const rightAxisX = width - paddingRight;
  const maxBarWidth = (width - paddingLeft - paddingRight) * Math.min(0.70, Math.max(0.20, profileWidthRatio));

  const pocY = priceToY(profile.poc);
  const vahY = priceToY(profile.vah);
  const valY = priceToY(profile.val);
  const vwapY = vwap && vwap.vwap > 0 ? priceToY(vwap.vwap) : null;
  const currentY = currentPrice && currentPrice > 0 ? priceToY(currentPrice) : null;

  const priceDecimals = profile.tickSize < 0.001 ? 5 : (profile.tickSize < 0.1 ? 4 : 2);

  return (
    <div className="relative bg-[#070b13] border border-white/[0.08] rounded-xl overflow-hidden p-3 font-mono select-none">
      {/* Legend & Header */}
      <div className="flex flex-wrap items-center justify-between text-[11px] pb-2.5 border-b border-white/[0.06] text-slate-400 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold text-white uppercase tracking-wider">{profile.symbol} {profile.session} PROFILE</span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            <span className="w-2 h-2 bg-amber-400 rounded-sm"></span>
            <span className="text-amber-300 font-bold">POC: {profile.poc.toFixed(priceDecimals)}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            <span className="w-2 h-2 bg-cyan-400 rounded-sm"></span>
            <span className="text-cyan-300">VAH: {profile.vah.toFixed(priceDecimals)}</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-300">VAL: {profile.val.toFixed(priceDecimals)}</span>
          </span>
          {vwap && vwap.vwap > 0 && (
            <span className="flex items-center gap-1 text-purple-300">
              <span className="w-2 h-0.5 bg-purple-400"></span>
              <span>VWAP: {vwap.vwap.toFixed(priceDecimals)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 bg-emerald-500 rounded-sm"></span> Buy Vol
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 bg-rose-500 rounded-sm"></span> Sell Vol
          </span>
          <span className="text-[10px] text-slate-500 font-bold px-1.5 py-0.5 rounded bg-white/[0.04]">
            {bins.length} BINS
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          {/* Subtle horizontal grid lines */}
          <pattern id="grid" width={width} height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="40" x2={width} y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* 70% Value Area Shaded Zone (VAH to VAL) */}
        {profile.vah > 0 && profile.val > 0 && (
          <rect
            x={paddingLeft}
            y={Math.min(vahY, valY)}
            width={rightAxisX - paddingLeft}
            height={Math.max(2, Math.abs(valY - vahY))}
            fill="rgba(6, 182, 212, 0.03)"
            stroke="rgba(6, 182, 212, 0.12)"
            strokeDasharray="4 4"
          />
        )}

        {/* Right Price Axis Baseline */}
        <line
          x1={rightAxisX}
          y1={paddingTop}
          x2={rightAxisX}
          y2={height - paddingBottom}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1"
        />

        {/* Horizontal Volume Bins */}
        {bins.map((bin, i) => {
          const yTop = priceToY(bin.price + profile.tickSize);
          const yBottom = priceToY(bin.price);
          const barHeight = Math.max(1.2, Math.abs(yBottom - yTop) - 0.4);
          const barY = Math.min(yTop, yBottom);

          const totalW = (bin.volume / maxBinVolume) * maxBarWidth;
          const buyRatio = bin.volume > 0 ? bin.buyVolume / bin.volume : 0.5;
          const buyW = totalW * buyRatio;
          const sellW = totalW - buyW;

          const isValueArea = bin.price >= profile.val && bin.price <= profile.vah;
          const isPoc = Math.abs(bin.price - profile.poc) < (profile.tickSize * 0.5);
          const isHvn = profile.hvn && profile.hvn.some(h => Math.abs(h - bin.price) < (profile.tickSize * 0.5));
          const isLvn = profile.lvn && profile.lvn.some(l => Math.abs(l - bin.price) < (profile.tickSize * 0.5));

          // Right-anchored: bars extend leftward from rightAxisX
          const barStartX = rightAxisX - totalW;

          return (
            <g key={i}>
              {/* Buy Volume Slice (Green, Left segment) */}
              <rect
                x={barStartX}
                y={barY}
                width={Math.max(0.5, buyW)}
                height={barHeight}
                fill={isPoc ? '#f59e0b' : (isValueArea ? '#10b981' : 'rgba(16, 185, 129, 0.40)')}
                opacity={isPoc ? 1.0 : (isValueArea ? 0.90 : 0.50)}
              />
              {/* Sell Volume Slice (Red, Right segment) */}
              <rect
                x={barStartX + buyW}
                y={barY}
                width={Math.max(0.5, sellW)}
                height={barHeight}
                fill={isPoc ? '#d97706' : (isValueArea ? '#f43f5e' : 'rgba(244, 63, 94, 0.40)')}
                opacity={isPoc ? 1.0 : (isValueArea ? 0.90 : 0.50)}
              />

              {/* HVN Marker */}
              {isHvn && !isPoc && (
                <rect
                  x={barStartX - 4}
                  y={barY}
                  width={3}
                  height={barHeight}
                  fill="#34d399"
                />
              )}

              {/* LVN Marker */}
              {isLvn && (
                <rect
                  x={barStartX - 4}
                  y={barY}
                  width={3}
                  height={barHeight}
                  fill="#fbbf24"
                />
              )}

              {/* Right Price Axis Tick Labels */}
              {i % Math.max(1, Math.floor(bins.length / 14)) === 0 && (
                <text
                  x={rightAxisX + 6}
                  y={barY + barHeight / 2 + 3}
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#64748b"
                >
                  {bin.price.toFixed(priceDecimals)}
                </text>
              )}
            </g>
          );
        })}

        {/* VAH Line Across Profile */}
        {profile.vah > 0 && (
          <g>
            <line x1={paddingLeft} y1={vahY} x2={rightAxisX} y2={vahY} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={paddingLeft + 4} y={vahY - 4} fontSize="9" fill="#06b6d4" fontWeight="bold">
              VAH {profile.vah.toFixed(priceDecimals)} (70%)
            </text>
          </g>
        )}

        {/* VAL Line Across Profile */}
        {profile.val > 0 && (
          <g>
            <line x1={paddingLeft} y1={valY} x2={rightAxisX} y2={valY} stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={paddingLeft + 4} y={valY + 12} fontSize="9" fill="#06b6d4" fontWeight="bold">
              VAL {profile.val.toFixed(priceDecimals)} (70%)
            </text>
          </g>
        )}

        {/* Prominent POC Line Across Entire Profile */}
        {profile.poc > 0 && (
          <g>
            <line x1={paddingLeft} y1={pocY} x2={rightAxisX} y2={pocY} stroke="#f59e0b" strokeWidth="2.2" strokeDasharray="5 3" />
            <rect x={paddingLeft} y={pocY - 8} width={130} height={16} rx={3} fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="0.8" />
            <text x={paddingLeft + 4} y={pocY + 4} fontSize="10" fill="#fbbf24" fontWeight="bold">
              ★ POC {profile.poc.toFixed(priceDecimals)}
            </text>
          </g>
        )}

        {/* VWAP Line */}
        {vwapY !== null && (
          <g>
            <line x1={paddingLeft} y1={vwapY} x2={rightAxisX} y2={vwapY} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6 3" />
            <text x={width - paddingRight - 85} y={vwapY - 4} fontSize="9" fill="#c084fc" fontWeight="bold">
              VWAP {vwap?.vwap.toFixed(priceDecimals)}
            </text>
          </g>
        )}

        {/* Live Market Price Line */}
        {currentY !== null && (
          <g>
            <line x1={paddingLeft} y1={currentY} x2={rightAxisX} y2={currentY} stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="2 2" />
            <circle cx={rightAxisX} cy={currentY} r="3" fill="#3b82f6" />
            <text x={rightAxisX + 6} y={currentY + 3} fontSize="9" fill="#60a5fa" fontWeight="bold">
              LIVE {currentPrice?.toFixed(priceDecimals)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

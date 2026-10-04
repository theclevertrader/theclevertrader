'use client';

import React, { useState } from 'react';
import { PaperPosition } from '@/lib/types/trading';
import { globalPaperBroker } from '@/lib/broker/paper-broker';
import { TrendingUp, TrendingDown, XCircle, CheckCircle2 } from 'lucide-react';

interface PositionsTableProps {
  positions: PaperPosition[];
  onPositionClosed?: () => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onPositionClosed,
}) => {
  const [closingId, setClosingId] = useState<string | null>(null);

  const handleClose = async (posId: string) => {
    setClosingId(posId);
    try {
      await globalPaperBroker.closePosition(posId);
      onPositionClosed?.();
    } catch (err) {
      console.error('Error closing position:', err);
    } finally {
      setClosingId(null);
    }
  };

  const openPositions = positions.filter(p => p.status === 'OPEN');

  return (
    <div className="bg-surface-card border border-terminal-border rounded-xl shadow-card-glass font-mono overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border bg-surface-elevated/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
          <span className="font-bold text-white text-xs">OPEN PAPER POSITIONS</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-terminal-cyan font-bold">
            {openPositions.length} ACTIVE
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/[0.04]">
            <tr>
              <th className="px-4 py-2.5">Symbol</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Lot</th>
              <th className="px-3 py-2.5">Entry</th>
              <th className="px-3 py-2.5">Current</th>
              <th className="px-3 py-2.5">Stop Loss</th>
              <th className="px-3 py-2.5">Take Profit</th>
              <th className="px-3 py-2.5">Unrealized P&L</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {openPositions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No active paper positions. Place an order or load a setup from the Command Center.
                </td>
              </tr>
            ) : (
              openPositions.map(pos => {
                const isBuy = pos.type === 'BUY';
                const isProfit = pos.unrealizedPl >= 0;

                return (
                  <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-bold text-white">{pos.symbol}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isBuy
                            ? 'bg-green-500/20 text-terminal-green'
                            : 'bg-rose-500/20 text-terminal-rose'
                        }`}
                      >
                        {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {pos.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300 font-semibold">{pos.lotSize}</td>
                    <td className="px-3 py-3 text-slate-300">{pos.entryPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-white font-bold">{pos.currentPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-rose-400">{pos.stopLoss.toFixed(2)}</td>
                    <td className="px-3 py-3 text-emerald-400">{pos.takeProfit.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`font-bold ${
                          isProfit ? 'text-terminal-green' : 'text-terminal-rose'
                        }`}
                      >
                        {isProfit ? '+' : ''}${pos.unrealizedPl.toFixed(2)} USD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleClose(pos.id)}
                        disabled={closingId === pos.id}
                        className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        {closingId === pos.id ? 'CLOSING...' : 'CLOSE'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

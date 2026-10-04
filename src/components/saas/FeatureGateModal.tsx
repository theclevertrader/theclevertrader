"use client";

import React from "react";
import { Lock, Sparkles, ArrowRight, ShieldAlert, X } from "lucide-react";
import Link from "next/link";

interface FeatureGateModalProps {
  isOpen: boolean;
  featureName: string;
  requiredTier: "PRO" | "VIP";
  onClose: () => void;
  onUpgrade: () => void;
}

export const FeatureGateModal: React.FC<FeatureGateModalProps> = ({
  isOpen,
  featureName,
  requiredTier,
  onClose,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#090f1a] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-center space-y-4 animate-modal-pop">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-900/30">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800/60">
            {requiredTier === "VIP" ? "INSTITUTIONAL VIP FEATURE" : "PRO TRADER FEATURE"}
          </span>
          <h3 className="text-lg font-black text-white uppercase mt-2">
            {featureName} is Locked
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Is feature (Autonomous MT5 Auto-Execution & Multi-Agent AI War Room) ko access karne ke liye <strong>{requiredTier === "VIP" ? "Institutional VIP" : "Pro Trader"}</strong> subscription darkaar hai.
          </p>
        </div>

        <div className="bg-black/50 p-3 rounded-xl border border-slate-800 text-left text-xs space-y-1 text-slate-300">
          <div className="font-bold text-white text-[11px] mb-1">Unlock With {requiredTier}:</div>
          <div>• Direct MT5 Real Account Order Transmission</div>
          <div>• 7 Neural Multi-Agent Quant Consensus Voting</div>
          <div>• Instant Telegram VIP Push Webhooks</div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
          >
            Cancel
          </button>
          <button
            onClick={onUpgrade}
            className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-black uppercase tracking-wider hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40"
          >
            <span>Upgrade Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

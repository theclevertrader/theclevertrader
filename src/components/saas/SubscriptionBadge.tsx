"use client";

import React from "react";
import { SubscriptionTier } from "@/lib/saas/subscription";
import { Crown, Zap, Shield, Sparkles } from "lucide-react";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  tier,
  size = "md",
  showStatus = true,
}) => {
  if (tier === "VIP") {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full font-black tracking-wider uppercase font-mono transition-all shadow-sm ${
        size === "sm" ? "px-2 py-0.5 text-[9px]" :
        size === "lg" ? "px-4 py-1.5 text-xs shadow-amber-900/40" :
        "px-2.5 py-1 text-[10px]"
      } bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 shadow-amber-500/10`}>
        <Crown className={size === "sm" ? "w-3 h-3 text-amber-400" : "w-3.5 h-3.5 text-amber-400"} />
        <span>INSTITUTIONAL VIP</span>
        {showStatus && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      </div>
    );
  }

  if (tier === "PRO") {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-full font-bold tracking-wider uppercase font-mono transition-all shadow-sm ${
        size === "sm" ? "px-2 py-0.5 text-[9px]" :
        size === "lg" ? "px-4 py-1.5 text-xs shadow-cyan-900/40" :
        "px-2.5 py-1 text-[10px]"
      } bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-cyan-500/10`}>
        <Zap className={size === "sm" ? "w-3 h-3 text-cyan-400" : "w-3.5 h-3.5 text-cyan-400"} />
        <span>PRO TRADER</span>
        {showStatus && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-bold tracking-wider uppercase font-mono transition-all ${
      size === "sm" ? "px-2 py-0.5 text-[9px]" :
      size === "lg" ? "px-4 py-1.5 text-xs" :
      "px-2.5 py-1 text-[10px]"
    } bg-slate-800/80 text-slate-400 border border-slate-700`}>
      <Shield className="w-3 h-3" />
      <span>STARTER RETAIL</span>
    </div>
  );
};

'use client';

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface JarvisFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const JarvisFloatingButton: React.FC<JarvisFloatingButtonProps> = ({
  onClick,
  isOpen,
}) => {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={onClick}
        className="relative group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface-elevated/90 hover:bg-surface-elevated border border-cyan-500/40 hover:border-cyan-400 text-white font-mono text-xs shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] backdrop-blur-md transition-all duration-300"
      >
        {/* Pulsing ring */}
        <span className="absolute -inset-0.5 rounded-full bg-cyan-400/20 blur-sm group-hover:bg-cyan-400/40 animate-pulse transition-all -z-10" />

        {/* Icon with glowing dot */}
        <div className="relative">
          <Bot className="w-5 h-5 text-terminal-cyan group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-terminal-green animate-ping" />
        </div>

        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-100 flex items-center gap-1">
            <span>NEXUS AI</span>
            <Sparkles className="w-3 h-3 text-terminal-green" />
          </span>
          <span className="text-[9px] text-terminal-cyan uppercase tracking-wider font-semibold">
            ROMAN URDU
          </span>
        </div>
      </button>
    </div>
  );
};

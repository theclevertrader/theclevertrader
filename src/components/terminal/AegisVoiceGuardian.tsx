'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, Activity, CheckCircle, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { NexusVoiceEngine } from '@/lib/ai/aegis-voice-engine';

export interface AegisVoiceGuardianProps {
  onOpenJarvis?: () => void;
  isCollapsed?: boolean;
  className?: string;
}

export const AegisVoiceGuardian: React.FC<AegisVoiceGuardianProps> = ({
  onOpenJarvis,
  isCollapsed = false,
  className = '',
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [lastEventText, setLastEventText] = useState<string>('Surveillance Active');
  const [eventCount, setEventCount] = useState<number>(0);

  // Tracking state refs across polls
  const knownTradeIds = useRef<Set<string>>(new Set());
  const initialMount = useRef<boolean>(true);
  const lastBrokerConnected = useRef<boolean | null>(null);
  const lastCircuitBreakerTripped = useRef<boolean>(false);
  const lastNewsShieldLocked = useRef<boolean>(false);

  useEffect(() => {
    setIsMuted(NexusVoiceEngine.isVoiceMuted());

    // Gentle delayed intro chime & voice on first user session
    const timer = setTimeout(() => {
      NexusVoiceEngine.announceNexusOnline();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleMute = () => {
    const next = NexusVoiceEngine.toggleVoiceMute();
    setIsMuted(next);
  };

  const handleTestVoice = () => {
    setLastEventText('Testing NEXUS Audio');
    NexusVoiceEngine.speak('Nexus quantitative guardian active. MetaTrader 5 broker bridge operational. Risk parameters secured.', true);
  };

  // Autonomous Polling Loop (Polls every 4 seconds for trade events & emergencies)
  useEffect(() => {
    let isSubscribed = true;

    const pollGuardianStatus = async () => {
      try {
        // 1. Check Auto-Trade & Risk Engine State
        const res = await fetch('/api/auto-trade', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        if (!isSubscribed) return;

        const history: any[] = data.history || [];
        const config = data.config || {};
        const protection = data.protectionTelemetry || {};

        // On very first load, seed existing trades so we don't announce historical closed trades
        if (initialMount.current) {
          history.forEach((t: any) => {
            if (t.id) knownTradeIds.current.add(t.id);
          });
          initialMount.current = false;
          return;
        }

        // Detect NEW trades in history
        for (const trade of history) {
          if (!trade.id || knownTradeIds.current.has(trade.id)) continue;
          knownTradeIds.current.add(trade.id);

          setEventCount(prev => prev + 1);

          // CASE A: NEW EXECUTED TRADE
          if (trade.status === 'EXECUTED_PAPER' || trade.status === 'QUEUED_MT5' || trade.status === 'FILLED_BOTH') {
            setLastEventText(`Executed ${trade.action} ${trade.symbol}`);
            NexusVoiceEngine.announceTradeExecuted({
              symbol: trade.symbol,
              action: trade.action,
              lot: trade.lotSize || 0.01,
              entryPrice: trade.entryPrice,
              tp: trade.takeProfit,
              sl: trade.stopLoss,
              ticket: trade.id,
            });
            break; // Announce one trade per poll to maintain clear diction
          }

          // CASE B: TAKE PROFIT OR STOP LOSS AUTO-CLOSED
          if (trade.status === 'AUTO_CLOSED' || trade.status === 'MANUAL_CLOSED') {
            const summary = (trade.romanUrduSummary || trade.reasons?.join(' ') || '').toLowerCase();
            const isTp = summary.includes('take profit') || summary.includes('liquidity pool') || summary.includes('target') || (trade.profit && trade.profit > 0);
            const isSl = summary.includes('stop loss') || summary.includes('invalidation') || (trade.profit && trade.profit < 0);

            if (isTp) {
              setLastEventText(`TP Hit on ${trade.symbol}!`);
              NexusVoiceEngine.announceTakeProfitHit({
                symbol: trade.symbol,
                profitUsd: trade.profit || 9.0,
                ticket: trade.id,
              });
            } else if (isSl) {
              setLastEventText(`SL Contained on ${trade.symbol}`);
              NexusVoiceEngine.announceStopLossHit({
                symbol: trade.symbol,
                lossUsd: trade.profit ? Math.abs(trade.profit) : 3.0,
                ticket: trade.id,
              });
            }
            break;
          }
        }

        // CASE C: EMERGENCY - DAILY DRAWDOWN CIRCUIT BREAKER TRIPPED
        if (config.isCircuitBreakerTripped && !lastCircuitBreakerTripped.current) {
          lastCircuitBreakerTripped.current = true;
          setLastEventText('EMERGENCY: Circuit Breaker Tripped');
          NexusVoiceEngine.announceCircuitBreakerTriggered({
            reason: config.circuitBreakerReason || '3% Maximum Daily Drawdown reached',
          });
        } else if (!config.isCircuitBreakerTripped) {
          lastCircuitBreakerTripped.current = false;
        }

        // CASE D: EMERGENCY - HIGH-IMPACT NEWS SHIELD ENGAGED
        if (protection.newsShield?.isLocked && !lastNewsShieldLocked.current) {
          lastNewsShieldLocked.current = true;
          setLastEventText('EMERGENCY: News Shield Active');
          NexusVoiceEngine.announceEmergencyNewsShield({
            eventName: protection.newsShield.reason || 'High-Impact Red Folder Release',
            minutes: 15,
          });
        } else if (!protection.newsShield?.isLocked) {
          lastNewsShieldLocked.current = false;
        }

        // 2. Check MT5 Broker Connection State
        const mt5Res = await fetch('/api/mt5?action=status', { cache: 'no-store' });
        if (mt5Res.ok) {
          const mt5Data = await mt5Res.json();
          const isConnected = !!mt5Data.connected;
          if (lastBrokerConnected.current !== null && isConnected !== lastBrokerConnected.current) {
            setLastEventText(isConnected ? 'MetaTrader 5 Synced' : 'MT5 Disconnected');
            if (isConnected) {
              NexusVoiceEngine.announceBrokerReconnected(
                String(mt5Data.config?.login || 'Live'),
                mt5Data.config?.balance || 812.88
              );
            } else {
              NexusVoiceEngine.announceBrokerDisconnected();
            }
          }
          lastBrokerConnected.current = isConnected;
        }
      } catch (err) {
        // Non-blocking poll
      }
    };

    const intervalId = setInterval(pollGuardianStatus, 10000);
    return () => {
      isSubscribed = false;
      clearInterval(intervalId);
    };
  }, []);

  // MODE A: Collapsed Floating Pill at Bottom-Left (Smooth & Non-overlapping)
  if (isCollapsed) {
    return (
      <aside aria-label="NEXUS AI Voice Assistant" className={`fixed bottom-3 left-3 z-50 select-none font-sans ${className}`}>
        <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-gradient-to-b from-[#0c1527] to-[#070c16] border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] text-white text-xs font-mono group transition-all duration-200">
          <button
            type="button"
            onClick={onOpenJarvis}
            className="flex items-center gap-1.5 hover:text-cyan-200 cursor-pointer"
            title="Launch NEXUS AI Copilot Chat"
          >
            <div className="relative">
              <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
            </div>
            <span className="font-bold text-[11px]">NEXUS AI</span>
          </button>

          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
            isMuted
              ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              : 'bg-cyan-950/80 border border-cyan-600/60 text-cyan-300'
          }`}>
            {isMuted ? 'MUTED' : 'VOICE ACTIVE'}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute();
            }}
            className={`p-1 rounded-md border transition-colors ${
              isMuted
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isMuted ? 'Unmute Voice Announcements' : 'Mute Voice Announcements'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      </aside>
    );
  }

  // MODE B: Full Institutional Card Docked in Bottom-Left Sidebar (Zero Overlap with Bottom-Right Perf Monitor)
  return (
    <div className={`group m-2.5 p-3 rounded-xl bg-gradient-to-b from-[#0c1527] to-[#070c16] border border-cyan-500/25 hover:border-cyan-400/60 transition-all duration-200 text-left shadow-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden select-none ${className}`}>
      <span className="absolute -right-6 -bottom-6 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div
          onClick={onOpenJarvis}
          className="flex items-center gap-2 cursor-pointer"
          title="Launch NEXUS AI Copilot Chat"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${isMuted ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
          </div>
          <span className="font-mono text-xs font-bold text-white group-hover:text-cyan-200 transition-colors flex items-center gap-1">
            NEXUS AI
            <Sparkles className="w-3 h-3 text-cyan-400" />
          </span>
        </div>

        {/* Voice Status Pill & Quick Controls */}
        <div className="flex items-center gap-1">
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
            isMuted
              ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              : 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
          }`}>
            {isMuted ? 'MUTED' : 'VOICE ACTIVE'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleMute();
            }}
            className={`p-1 rounded-md border transition-colors ${
              isMuted
                ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                : 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-900/60'
            }`}
            title={isMuted ? 'Unmute Voice Announcements' : 'Mute Voice Announcements'}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 rounded-md border border-white/[0.08] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title={isExpanded ? 'Collapse Voice Telemetry' : 'Expand Voice Telemetry'}
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Voice Event / Telemetry Ticker */}
      <div onClick={onOpenJarvis} className="cursor-pointer">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300/90 truncate mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span className="truncate">{lastEventText}</span>
        </div>
        <p className="text-[10px] font-mono text-slate-400 group-hover:text-slate-200 leading-tight transition-colors">
          Quantitative Copilot & Voice Analyst. Click to chat.
        </p>
      </div>

      {/* Expanded Voice Controls & Test Button */}
      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.08] space-y-1.5 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between">
            <span>Autonomous Surveillance:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 100% Armed
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Speech Cadence:</span>
            <span className="text-cyan-300">Institutional English</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Voice Events:</span>
            <span className="text-white font-bold">{eventCount}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTestVoice();
            }}
            className="w-full mt-1.5 py-1 px-2 rounded-lg bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-[10px] shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Volume2 className="w-3 h-3" />
            Test Voice Announcement
          </button>
        </div>
      )}
    </div>
  );
};

export const NexusVoiceGuardian = AegisVoiceGuardian;

// =====================================================================
// THE CLEVER TRADER — NEXUS AUTONOMOUS QUANTITATIVE VOICE ENGINE
// NEXUS AI: Autonomous Quantitative Voice Guardian & Execution Copilot
// Institutional High-Status English Voice Announcements & Audio Alerts
// =====================================================================

import { soundEngine } from "@/lib/audio/sound-effects";

export interface NexusTradeParams {
  symbol: string;
  action: "BUY" | "SELL" | "CLOSE";
  lot: number;
  entryPrice?: number;
  sl?: number;
  tp?: number;
  ticket?: string | number;
  pnl?: number;
}

// Memory deduplication cache to prevent repetitive voice spamming
const recentSpokenCache = new Map<string, number>();

function cleanSymbolName(sym: string): string {
  const upper = (sym || "").toUpperCase();
  if (upper.includes("XAU") || upper.includes("GOLD")) return "Gold";
  if (upper.includes("EURUSD")) return "Euro U S Dollar";
  if (upper.includes("GBPUSD")) return "British Pound";
  if (upper.includes("USDJPY")) return "Dollar Yen";
  if (upper.includes("USDCAD")) return "Dollar Loonie";
  if (upper.includes("AUDUSD")) return "Aussie Dollar";
  if (upper.includes("US30") || upper.includes("DJI")) return "Dow Jones 30";
  if (upper.includes("NAS100") || upper.includes("USTEC")) return "Nasdaq 100";
  if (upper.includes("BTC")) return "Bitcoin";
  return upper.replace(/[^A-Z0-9]/g, "");
}

function shouldSpeakMessage(cacheKey: string, cooldownSec: number = 20): boolean {
  const now = Date.now();
  const lastTime = recentSpokenCache.get(cacheKey) || 0;
  if (now - lastTime < cooldownSec * 1000) {
    return false;
  }
  recentSpokenCache.set(cacheKey, now);
  return true;
}

export class NexusVoiceEngine {
  private static isMuted: boolean = false;
  private static speechQueue: string[] = [];
  private static isSpeaking: boolean = false;

  static {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nexus_voice_muted") || localStorage.getItem("aegis_voice_muted");
        if (saved !== null) {
          this.isMuted = saved === "true";
        }
      } catch (e) {
        // Safe SSR
      }
    }
  }

  public static isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public static setVoiceMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexus_voice_muted", String(muted));
      } catch (e) {}
      if (muted && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public static toggleVoiceMute(): boolean {
    this.setVoiceMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Speak crisp, authoritative institutional English using Web Speech API
   */
  public static speak(text: string, priority: boolean = false): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (this.isMuted) return;

    if (priority) {
      window.speechSynthesis.cancel();
      this.speechQueue = [text];
    } else {
      this.speechQueue.push(text);
    }

    this.processQueue();
  }

  private static processQueue(): void {
    if (this.isSpeaking || this.speechQueue.length === 0) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const textToSpeak = this.speechQueue.shift();
    if (!textToSpeak) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Pick top-tier English voice (British / US Institutional Quant Tone)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      (v.name.includes("Christopher") || v.name.includes("Guy") || v.name.includes("Natural") || v.name.includes("Google UK English Male") || v.name.includes("Daniel") || v.name.includes("David")) &&
      v.lang.startsWith("en")
    ) || voices.find(v => 
      v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.02; // Crisp, professional pacing
    utterance.pitch = 0.98; // Authoritative, grounded pitch
    utterance.volume = 1.0;

    utterance.onend = () => {
      this.isSpeaking = false;
      setTimeout(() => this.processQueue(), 120);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      setTimeout(() => this.processQueue(), 120);
    };

    window.speechSynthesis.speak(utterance);
  }

  // =====================================================================
  // 1. SYSTEM INITIALIZATION / BOOT ANNOUNCEMENT
  // =====================================================================
  public static announceNexusOnline(): void {
    if (!shouldSpeakMessage("nexus_online", 60)) return;
    soundEngine.playTradingViewDing();
    this.speak("Nexus quantitative guardian online. Real-time market surveillance active.");
  }

  // Compatibility alias
  public static announceAegisOnline(): void {
    this.announceNexusOnline();
  }

  // =====================================================================
  // 2. ORDER EXECUTION (TRADE TAKEN BY BOT)
  // =====================================================================
  public static announceTradeExecuted(params: NexusTradeParams): void {
    const sym = cleanSymbolName(params.symbol);
    const key = `trade_exec_${params.symbol}_${params.action}_${params.ticket || ""}`;
    if (!shouldSpeakMessage(key, 10)) return;

    soundEngine.playOrderExecutedChime();

    let speech = `Nexus Order Executed: ${params.action} ${params.lot} lot on ${sym}`;
    if (params.entryPrice) {
      speech += ` at ${params.entryPrice}`;
    }
    if (params.tp && params.tp > 0) {
      speech += `. Target Take Profit set at ${params.tp}`;
    }
    if (params.sl && params.sl > 0) {
      speech += `. Stop Loss at ${params.sl}`;
    }
    speech += `. Order transmitted to MetaTrader 5 broker.`;

    this.speak(speech, true);
  }

  // =====================================================================
  // 3. TAKE PROFIT (TP) TARGET ACHIEVED
  // =====================================================================
  public static announceTakeProfitHit(params: { symbol: string; profitUsd?: number; pips?: number; ticket?: string | number }): void {
    const sym = cleanSymbolName(params.symbol);
    const key = `tp_hit_${params.symbol}_${params.ticket || Date.now()}`;
    if (!shouldSpeakMessage(key, 10)) return;

    soundEngine.playTakeProfitChime();

    const profitStr = params.profitUsd !== undefined ? `Profit of ${Math.abs(params.profitUsd).toFixed(2)} dollars secured.` : "Target liquidity pool raided successfully.";
    const speech = `Target Achieved! Take Profit triggered on ${sym}. ${profitStr} Position closed with profit locked. Excellent execution.`;

    this.speak(speech, true);
  }

  // =====================================================================
  // 4. STOP LOSS (SL) TRIGGERED (CAPITAL PROTECTED)
  // =====================================================================
  public static announceStopLossHit(params: { symbol: string; lossUsd?: number; ticket?: string | number }): void {
    const sym = cleanSymbolName(params.symbol);
    const key = `sl_hit_${params.symbol}_${params.ticket || Date.now()}`;
    if (!shouldSpeakMessage(key, 10)) return;

    soundEngine.playStopLossTone();

    const lossStr = params.lossUsd !== undefined ? `Loss strictly capped at ${Math.abs(params.lossUsd).toFixed(2)} dollars.` : "Capital preserved under strict 1 percent risk limit.";
    const speech = `Risk Control Alert: Stop Loss triggered on ${sym}. ${lossStr} Downside strictly contained. Circuit breakers active.`;

    this.speak(speech, true);
  }

  // =====================================================================
  // 5. EMERGENCY: HIGH-IMPACT NEWS SHIELD ENGAGED
  // =====================================================================
  public static announceEmergencyNewsShield(params: { eventName: string; minutes: number }): void {
    const key = `news_shield_${params.eventName}`;
    if (!shouldSpeakMessage(key, 60)) return;

    soundEngine.playStopLossTone();

    const speech = `Emergency Warning! High-impact economic news event: ${params.eventName}, scheduled in ${params.minutes} minutes. Automated trading locked to protect against broker slippage.`;
    this.speak(speech, true);
  }

  // =====================================================================
  // 6. EMERGENCY: DAILY DRAWDOWN CIRCUIT BREAKER TRIPPED
  // =====================================================================
  public static announceCircuitBreakerTriggered(params: { reason: string }): void {
    const key = `circuit_breaker_tripped`;
    if (!shouldSpeakMessage(key, 60)) return;

    soundEngine.playStopLossTone();

    const speech = `Critical Risk Emergency: Daily circuit breaker engaged. ${params.reason}. All automated trading halted immediately to protect capital.`;
    this.speak(speech, true);
  }

  // =====================================================================
  // 7. BROKER CONNECTION LOST / RECONNECTED
  // =====================================================================
  public static announceBrokerDisconnected(): void {
    if (!shouldSpeakMessage("broker_disconnect_voice", 30)) return;
    soundEngine.playStopLossTone();
    this.speak("Warning: MetaTrader 5 broker connection interrupted. Automated watchdog reconnection active.");
  }

  public static announceBrokerReconnected(account: string, balance: number): void {
    if (!shouldSpeakMessage("broker_reconnected_voice", 30)) return;
    soundEngine.playBreakEvenChime();
    this.speak(`MetaTrader 5 broker synchronized. Exness account ${account} active with balance ${balance.toFixed(2)} dollars.`);
  }

  // =====================================================================
  // 8. HIGH-CONFLUENCE SETUP RADAR DETECTED
  // =====================================================================
  public static announceHighConfluenceSetup(params: { symbol: string; action: "BUY" | "SELL"; score: number }): void {
    const sym = cleanSymbolName(params.symbol);
    const key = `confluence_${params.symbol}_${params.action}`;
    if (!shouldSpeakMessage(key, 45)) return;

    soundEngine.playTradingViewDing();
    this.speak(`Nexus Confluence Alert: A-plus ${params.action} opportunity detected on ${sym} with ${params.score} percent multi-model confidence.`);
  }

  // =====================================================================
  // 9. RUFLO AUTONOMOUS SELF-HEALING ACTION TAKEN
  // =====================================================================
  public static announceSelfHealing(params: { issue: string; recovery: string }): void {
    const key = `healing_${params.issue}`;
    if (!shouldSpeakMessage(key, 30)) return;

    soundEngine.playBreakEvenChime();
    this.speak(`Nexus Self-Healing: ${params.issue} intercepted. ${params.recovery}. Zero disruption.`);
  }

  // =====================================================================
  // 10. SESSION OPEN LIQUIDITY EXPANSION
  // =====================================================================
  public static announceSessionOpen(sessionName: string): void {
    const key = `session_${sessionName}`;
    if (!shouldSpeakMessage(key, 120)) return;

    soundEngine.playTradingViewDing();
    this.speak(`Market Session Alert: ${sessionName} session is now open. Institutional volatility expanding.`);
  }
}

// Backward-compatibility alias
export const AegisVoiceEngine = NexusVoiceEngine;
export type AegisTradeParams = NexusTradeParams;

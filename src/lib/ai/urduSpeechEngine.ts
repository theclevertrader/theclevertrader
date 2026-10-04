// =====================================================================
// THE CLEVER TRADER — ADVANCED ROMAN URDU PHONETIC SPEECH ENGINE
// Transforms Roman Urdu text into phonetic syllables so Web Speech API
// pronounces words naturally, clearly, and with authentic Urdu cadence.
// =====================================================================

import { soundEngine } from "@/lib/audio/sound-effects";

// Common Roman Urdu to Phonetic English transliterations for TTS clarity
const URDU_PHONETIC_MAP: Record<string, string> = {
  // Common short forms & conversational words
  "kr": "kar",
  "kro": "karo",
  "kren": "karein",
  "kare": "karey",
  "rha": "raha",
  "rhi": "rahi",
  "rhe": "rahey",
  "bty": "batao",
  "btao": "batao",
  "btayein": "bataayein",
  "q": "kyun",
  "nhi": "nahi",
  "nai": "nahi",
  "abi": "abhi",
  "abhe": "abhi",
  "lyna": "layna",
  "lyne": "layney",
  "lga": "laga",
  "lgao": "lagao",
  "hn": "hoon",
  "hun": "hoon",
  "bny": "baney",
  "bna": "bana",
  "khyd": "khud",
  "aik": "ek",
  "ak": "ek",
  "bohot": "bahut",
  "bht": "bahut",
  "pehlay": "pehle",
  "pehly": "pehle",
  "chahiye": "chaahiye",
  "shukriya": "shook-ree-ya",
  "walaikum": "va-lai-kum",
  "assalam": "as-saa-laam",
  "salam": "saa-laam",
  "theek": "theek",
  "thk": "theek",
  "kesy": "kaisey",
  "kese": "kaisey",
  "kaise": "kaisey",
  "kahan": "kahaan",
  "khabar": "khabar",
  "hifazat": "he-faa-zat",
  "faida": "faa-e-da",
  "nuqsan": "nook-saan",
  "hosla": "hos-laa",
  "paisa": "paisaa",
  "paise": "paise",
  "dost": "dost",
  "bhai": "bhaa-ee",
  "janab": "ja-naab",
  "faisla": "fais-laa",
  "mubarak": "moo-baa-rak",
  "tayyar": "tay-yaar",
  "shuru": "shoo-roo",
  "khatam": "kha-tam",
  "rok": "rok",
  "roko": "roko",
  "roka": "roka",
  
  // Trading terminology in Urdu context
  "hedg": "hedge",
  "fund": "fund",
  "trde": "trade",
  "trda": "trade",
  "trder": "trader",
  "profeshional": "professional",
  "conect": "connect",
  "anylise": "analysis",
  "celender": "calendar",
  "seprate": "separate",
  "smoot": "smooth",
  "tareteeb": "tar-teeb",
  "bano": "banao",
  "metatrder": "MetaTrader",
  "alfzo": "alfaaz",
  "prononce": "pronounce",
  "pronance": "pronounce",
  "optin": "option",
};

/**
 * Phonetically normalize Roman Urdu text so browser TTS can pronounce cleanly.
 */
export function phoneticallyNormalizeUrdu(text: string): string {
  if (!text) return "";
  
  // Clean markdown, symbols, emojis, and code formatting
  const clean = text
    .replace(/```[\s\S]*?```/g, "Code generation complete.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_#~]/g, "")
    .replace(/\[FACT\]:|\[QUOTE\]:|\[ALERT\]:/gi, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  // Tokenize and replace mapped words
  const words = clean.split(/\b/);
  const normalized = words.map(word => {
    const lower = word.toLowerCase();
    if (URDU_PHONETIC_MAP[lower]) {
      const rep = URDU_PHONETIC_MAP[lower];
      return word[0] === word[0].toUpperCase() && word.length > 1
        ? rep.charAt(0).toUpperCase() + rep.slice(1)
        : rep;
    }
    return word;
  }).join("");

  return normalized;
}

/**
 * Select the best speech synthesis voice for South Asian/Urdu phonetic accuracy.
 */
export function selectBestUrduVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Priority 1: Urdu voice (ur-PK, ur)
  const urVoice = voices.find(v => v.lang.startsWith("ur"));
  if (urVoice) return urVoice;

  // Priority 2: Hindi voice (hi-IN, hi) — phonetically very close to Urdu
  const hiVoice = voices.find(v => v.lang.startsWith("hi"));
  if (hiVoice) return hiVoice;

  // Priority 3: Indian English (en-IN) — handles South Asian vowels perfectly
  const inVoice = voices.find(v => v.lang === "en-IN" || v.name.includes("India"));
  if (inVoice) return inVoice;

  // Priority 4: British English (en-GB) — clean diction, institutional Hedge Fund tone
  const gbVoice = voices.find(v => v.lang === "en-GB" || v.name.includes("UK") || v.name.includes("George") || v.name.includes("Oliver"));
  if (gbVoice) return gbVoice;

  // Priority 5: High-grade English or Google/Microsoft natural
  const naturalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neural")));
  if (naturalVoice) return naturalVoice;

  return voices[0] || null;
}

export interface SpeechOptions {
  rate?: number;    // 0.85 to 1.1 for optimal clarity
  pitch?: number;   // 0.95 to 1.05
  volume?: number;  // 0.0 to 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

/**
 * Speak text out loud using phonetically optimized Roman Urdu.
 */
export function speakUrdu(text: string, options: SpeechOptions = {}): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Web Speech API is not supported in this browser.");
    return false;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const normalizedText = phoneticallyNormalizeUrdu(text);
  if (!normalizedText) return false;

  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.rate = options.rate ?? 0.95; // Measured rate for clear pronunciation
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = selectBestUrduVoice(voices);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = "en-US";
  }

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stop any current speech playback.
 */
export function stopUrduSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// =====================================================================
// AUTONOMOUS TRADE VOICE ANNOUNCEMENT HELPERS
// =====================================================================

import { AegisVoiceEngine } from './aegis-voice-engine';

/**
 * Announces when the AI bot is ABOUT to execute a trade.
 */
export function announceTradePending(params: {
  symbol: string;
  action: "BUY" | "SELL";
  lot: number;
  entryPrice?: number;
  sl: number;
  tp: number;
  confidence?: number;
}): void {
  AegisVoiceEngine.announceTradeExecuted({
    symbol: params.symbol,
    action: params.action,
    lot: params.lot,
    entryPrice: params.entryPrice,
    sl: params.sl,
    tp: params.tp,
  });
}

/**
 * Announces when a trade has been CONFIRMED and executed on MetaTrader 5.
 */
export function announceTradeExecuted(params: {
  symbol: string;
  action: "BUY" | "SELL";
  lot: number;
  ticket: string | number;
  price?: number;
}): void {
  AegisVoiceEngine.announceTradeExecuted({
    symbol: params.symbol,
    action: params.action,
    lot: params.lot,
    entryPrice: params.price,
    ticket: params.ticket,
  });
}

/**
 * Announces when a trade has been BLOCKED by AI Safety.
 */
export function announceTradeBlocked(reason: string): void {
  soundEngine.playStopLossTone();
  AegisVoiceEngine.speak(`Risk Alert: Trade execution blocked by NEXUS capital safety guard. Reason: ${reason}.`, true);
}

/**
 * Danger Alert for High Impact News (e.g. CPI, NFP, FOMC).
 */
export function announceDangerAlert(newsEvent: string, minutes: number): void {
  AegisVoiceEngine.announceEmergencyNewsShield({
    eventName: newsEvent,
    minutes,
  });
}

/**
 * Announces the Multi-Agent consensus decision from AI War Room.
 */
export function announceWarRoomDecision(params: {
  decision: "BUY" | "SELL" | "HOLD";
  symbol: string;
  confidence: number;
  bullishAgents: number;
  totalAgents: number;
}): void {
  soundEngine.playTradingViewDing();
  AegisVoiceEngine.speak(
    `NEXUS Consensus Reached: Multi-model recommendation is ${params.decision} on ${params.symbol} with ${params.confidence} percent confidence. ${params.bullishAgents} of ${params.totalAgents} quant agents approve.`,
    false
  );
}

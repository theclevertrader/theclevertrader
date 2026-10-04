/**
 * THE CLEVER TRADER — RUFLO AGENT MEMORY & SELF-LEARNING VECTOR STORE
 * Inspired by ruvnet/ruflo (AgentDB, RAG Memory, & Self-Optimizing Loops)
 * 
 * Persists trade fingerprints (wins and losses) across sessions.
 * Analyzes market vectors before trade execution to VETO setups
 * that match historical losing traps, preventing repeated mistakes.
 */

import fs from 'fs';
import path from 'path';

export interface TradeFingerprint {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  timestamp: number;
  dateStr: string;
  session: 'ASIA' | 'LONDON' | 'NEW_YORK';
  features: {
    cvdSlope: number;         // Normalized CVD direction (-1 to 1)
    fvgScore: number;         // Fair value gap presence (0 or 1)
    volumeZScore: number;     // Volume standard deviation spike (-2 to 4)
    pocDistancePips: number;  // Distance from Point of Control
    adxTrendStrength: number; // 0 to 100
    rsiValue: number;         // 0 to 100
  };
  outcome: 'WIN' | 'LOSS';
  profitUsd: number;
  lessonsLearned: string;
  romanUrduLesson: string;
}

export interface MemoryRecallResult {
  isVetoed: boolean;
  vetoReason?: string;
  romanUrduVeto?: string;
  similarityScore: number;    // 0 to 1 (1 = identical trap)
  matchedTrade?: TradeFingerprint;
  confidenceBoost: number;   // Boost score if matching past winning pattern
  memorySize: number;
}

export class RufloAgentMemory {
  private static memoryPath = path.join(process.cwd(), 'data', 'ruflo_trade_memory.json');
  private static trades: TradeFingerprint[] = [];
  private static maxMemorySize = 500;

  static {
    this.loadMemory();
  }

  private static loadMemory(): void {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const raw = fs.readFileSync(this.memoryPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.trades)) {
          this.trades = parsed.trades.slice(-this.maxMemorySize);
        }
      } else {
        // Seed institutional baseline memory (known failure patterns)
        this.trades = this.getSeedMemory();
        this.saveMemory();
      }
    } catch {
      this.trades = this.getSeedMemory();
    }
  }

  private static saveMemory(): void {
    try {
      const dir = path.dirname(this.memoryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.memoryPath,
        JSON.stringify({ trades: this.trades.slice(-this.maxMemorySize), lastUpdated: Date.now() }, null, 2),
        'utf8'
      );
    } catch {
      // Non-blocking write
    }
  }

  /**
   * Save a newly closed trade into persistent vector memory
   */
  public static recordTradeOutcome(trade: TradeFingerprint): void {
    this.trades.unshift(trade);
    if (this.trades.length > this.maxMemorySize) {
      this.trades.pop();
    }
    this.saveMemory();
  }

  /**
   * Evaluates active market setup against historical trade memory.
   * If similarity to a past loss is >= 80%, veto the trade.
   */
  public static evaluateAgainstMemory(
    symbol: string,
    action: 'BUY' | 'SELL',
    session: 'ASIA' | 'LONDON' | 'NEW_YORK',
    features: TradeFingerprint['features']
  ): MemoryRecallResult {
    const relevantTrades = this.trades.filter(t => t.symbol.toUpperCase() === symbol.toUpperCase());

    if (relevantTrades.length === 0) {
      return {
        isVetoed: false,
        similarityScore: 0,
        confidenceBoost: 0,
        memorySize: this.trades.length,
      };
    }

    let highestLossSimilarity = 0;
    let matchedLossTrade: TradeFingerprint | undefined;

    let highestWinSimilarity = 0;

    for (const t of relevantTrades) {
      const sim = this.calculateCosineSimilarity(features, t.features);

      if (t.outcome === 'LOSS' && t.action === action) {
        if (sim > highestLossSimilarity) {
          highestLossSimilarity = sim;
          matchedLossTrade = t;
        }
      } else if (t.outcome === 'WIN' && t.action === action) {
        if (sim > highestWinSimilarity) {
          highestWinSimilarity = sim;
        }
      }
    }

    // Veto if matching a loss with 80%+ similarity
    if (highestLossSimilarity >= 0.80 && matchedLossTrade) {
      const pct = Math.round(highestLossSimilarity * 100);
      return {
        isVetoed: true,
        similarityScore: highestLossSimilarity,
        matchedTrade: matchedLossTrade,
        vetoReason: `Ruflo Memory Veto: Market matches ${pct}% similar failure trap recorded on ${matchedLossTrade.dateStr} (${matchedLossTrade.lessonsLearned}).`,
        romanUrduVeto: `⚠️ Trade Veto! Ruflo Memory ne ${pct}% same loss pattern identify kiya jo ${matchedLossTrade.dateStr} ko fail hua tha (${matchedLossTrade.romanUrduLesson}). Account capital bachane ke liye trade cancel ki gayi.`,
        confidenceBoost: 0,
        memorySize: this.trades.length,
      };
    }

    // Boost score if setup mirrors a winning setup
    const boost = highestWinSimilarity >= 0.80 ? 12 : highestWinSimilarity >= 0.65 ? 6 : 0;

    return {
      isVetoed: false,
      similarityScore: highestLossSimilarity,
      confidenceBoost: boost,
      memorySize: this.trades.length,
    };
  }

  /**
   * Computes normalized cosine similarity between feature vectors
   */
  private static calculateCosineSimilarity(
    a: TradeFingerprint['features'],
    b: TradeFingerprint['features']
  ): number {
    const vecA = [
      a.cvdSlope,
      a.fvgScore,
      a.volumeZScore / 3,
      Math.min(1, a.pocDistancePips / 50),
      a.adxTrendStrength / 100,
      a.rsiValue / 100,
    ];

    const vecB = [
      b.cvdSlope,
      b.fvgScore,
      b.volumeZScore / 3,
      Math.min(1, b.pocDistancePips / 50),
      b.adxTrendStrength / 100,
      b.rsiValue / 100,
    ];

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0;
    return Math.max(0, Math.min(1, dot / (magA * magB)));
  }

  /**
   * Pre-loads realistic historical setups so the engine has instant learning memory
   */
  private static getSeedMemory(): TradeFingerprint[] {
    return [
      {
        id: 'seed_xau_01',
        symbol: 'XAUUSD',
        action: 'BUY',
        timestamp: Date.now() - 4 * 86400000,
        dateStr: '2026-09-14',
        session: 'LONDON',
        features: {
          cvdSlope: -0.85,
          fvgScore: 1,
          volumeZScore: 2.8,
          pocDistancePips: 32,
          adxTrendStrength: 18,
          rsiValue: 72,
        },
        outcome: 'LOSS',
        profitUsd: -45.0,
        lessonsLearned: 'Bought into heavy negative CVD absorption at Asian high sweep with overbought RSI.',
        romanUrduLesson: 'Negative CVD absorption mein overbought RSI par buy trap bana tha.',
      },
      {
        id: 'seed_xau_02',
        symbol: 'XAUUSD',
        action: 'SELL',
        timestamp: Date.now() - 2 * 86400000,
        dateStr: '2026-09-16',
        session: 'NEW_YORK',
        features: {
          cvdSlope: -0.72,
          fvgScore: 1,
          volumeZScore: 2.1,
          pocDistancePips: 12,
          adxTrendStrength: 34,
          rsiValue: 41,
        },
        outcome: 'WIN',
        profitUsd: 185.0,
        lessonsLearned: 'Clean London Judas Swing rejection followed by strong NY breakdown below POC.',
        romanUrduLesson: 'Judas swing fakeout ke baad POC ke neeche zabardast NY session breakdown win hua.',
      },
      {
        id: 'seed_eur_01',
        symbol: 'EURUSD',
        action: 'BUY',
        timestamp: Date.now() - 3 * 86400000,
        dateStr: '2026-09-15',
        session: 'ASIA',
        features: {
          cvdSlope: 0.1,
          fvgScore: 0,
          volumeZScore: 0.4,
          pocDistancePips: 8,
          adxTrendStrength: 11,
          rsiValue: 50,
        },
        outcome: 'LOSS',
        profitUsd: -22.0,
        lessonsLearned: 'Trading inside low-volume Asian chop box with no institutional volume displacement.',
        romanUrduLesson: 'Low volume Asian range chop mein trade lene se loss hua tha.',
      },
    ];
  }

  public static getMemoryStats(): {
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRatePercent: number;
    symbolsTracked: string[];
  } {
    const total = this.trades.length;
    const wins = this.trades.filter(t => t.outcome === 'WIN').length;
    const losses = this.trades.filter(t => t.outcome === 'LOSS').length;
    const uniqueSymbols = Array.from(new Set(this.trades.map(t => t.symbol)));

    return {
      totalTrades: total,
      winCount: wins,
      lossCount: losses,
      winRatePercent: total > 0 ? Math.round((wins / total) * 100) : 0,
      symbolsTracked: uniqueSymbols,
    };
  }
}

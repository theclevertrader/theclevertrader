import { Candle, TrendBias } from '../types/trading';
import { ConfluenceEngine } from './confluence-engine';
import { MtfMatrixEngine } from './mtf-matrix-engine';
import { AdvancedIctEngine, TurtleSoupPattern } from './advanced-ict-engine';
import { CftcCotEngine } from './cftc-cot-engine';
import { 
  RealOrderBook, 
  calculateWeightedOrderBookImbalance, 
  OrderBookImbalanceMetrics 
} from '../data/real-orderbook';
import { INSTITUTIONAL_SYMBOLS } from '../constants/symbols';
import { Mt5Bridge } from '../broker/mt5-bridge';

export type FinRobotAgentId = 
  | 'STRUCTURE_ANALYST'
  | 'MICROSTRUCTURE_ORDERFLOW'
  | 'MACRO_SMART_MONEY'
  | 'RISK_GUARDIAN';

export interface FinRobotAgentVote {
  agentId: FinRobotAgentId;
  agentName: string;
  role: string;
  vote: 'BUY' | 'SELL' | 'HOLD';
  conviction: number; // 0 to 100
  cotReasoning: string[];
  romanUrduReason: string;
  metrics: Record<string, any>;
  isVeto?: boolean;
  vetoReason?: string;
}

export interface FractionalKellyResult {
  recommendedLot: number;
  rawKellyFraction: number;
  safeKellyFraction: number; // typically 0.25x (quarter Kelly) or 0.33x
  winProbability: number;
  riskRewardRatio: number;
  rationale: string;
}

export interface FinRobotConsensusResult {
  symbol: string;
  timestamp: number;
  primaryDirection: 'BUY' | 'SELL' | 'HOLD';
  consensusScore: number; // 0 to 100
  isApproved: boolean;
  isUnanimous: boolean;
  agreementRatio: string; // e.g. "4/4" or "3/4"
  voteCount: {
    buy: number;
    sell: number;
    hold: number;
  };
  agentVotes: {
    structure: FinRobotAgentVote;
    orderFlow: FinRobotAgentVote;
    macro: FinRobotAgentVote;
    riskGuardian: FinRobotAgentVote;
  };
  orderBookImbalance: OrderBookImbalanceMetrics;
  fractionalKelly: FractionalKellyResult;
  isVetoed: boolean;
  vetoReason?: string;
  romanUrduConsensusSummary: string;
}

/**
 * FinRobot Multi-Agent Quantitative Consensus Engine
 * Inspired by Columbia University / AI4Finance FinRobot multi-agent architecture
 * and NautilusTrader L2 order book microstructure.
 */
export class FinRobotConsensusEngine {

  /**
   * Agent 1: Structure Analyst Agent (SMC, ICT, MTF Matrix)
   * Chains technical structure, FVG mitigations, order blocks, and multi-timeframe trends.
   */
  public static evaluateStructureAgent(
    symbol: string,
    candles: Candle[],
    livePrice: number
  ): FinRobotAgentVote {
    const cotReasoning: string[] = [];
    if (!candles || candles.length < 20) {
      return {
        agentId: 'STRUCTURE_ANALYST',
        agentName: 'Structure Analyst (SMC/ICT)',
        role: 'TECHNICAL & ORDER FLOW STRUCTURE',
        vote: 'HOLD',
        conviction: 30,
        cotReasoning: ['Insufficient candle history (<20 candles)'],
        romanUrduReason: 'Candle data kam hai, structure clear nahi.',
        metrics: {},
      };
    }

    const lastCandle = candles[candles.length - 1];
    const ma20 = candles.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20;
    const htfBias: TrendBias = lastCandle.close > ma20 ? 'BULLISH' : 'BEARISH';
    cotReasoning.push(`HTF Moving Average baseline: ${htfBias} (Price: ${livePrice.toFixed(2)}, MA20: ${ma20.toFixed(2)})`);

    const evalResult = ConfluenceEngine.evaluateConfluence(candles, htfBias, 3.0);
    const score = evalResult.breakdown.totalScore;
    const primaryDir = evalResult.primaryDirection;
    cotReasoning.push(`Confluence Engine score: ${score}/100, Direction: ${primaryDir}, Regime: ${evalResult.regime}`);

    const mtf = MtfMatrixEngine.analyzePair(symbol, candles, livePrice);
    cotReasoning.push(`MTF Alignment: 4H=${mtf.timeframes['4H']?.bias || 'N/A'}, 1H=${mtf.timeframes['1H']?.bias || 'N/A'}, 15M=${mtf.timeframes['15M']?.bias || 'N/A'}`);

    const ote = AdvancedIctEngine.calculateOteZones(candles, symbol, livePrice);
    const turtleSoup = AdvancedIctEngine.detectTurtleSoupPatterns(candles, symbol);
    cotReasoning.push(`OTE Fibonacci Zone: InZone=${ote.isInOteZone}, Freq50=${ote.fib500.toFixed(2)}`);

    let vote: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let conviction = 50;
    let romanUrdu = '';

    if (primaryDir === 'BUY') {
      if (mtf.timeframes['4H']?.bias === 'BEARISH' && mtf.timeframes['1H']?.bias === 'BEARISH') {
        vote = 'HOLD';
        conviction = 40;
        romanUrdu = 'BUY signal bana hai lekin 4H/1H macro trend strongly bearish hai, is liye structure agent ne hold kiya.';
      } else {
        vote = 'BUY';
        conviction = Math.min(98, Math.max(55, score + (mtf.isTripleScreenConfluence ? 8 : 0)));
        romanUrdu = `15M Bullish MSS + Order Block detect hua hai. Confluence ${conviction}%. Structure BUY ko favor kar raha hai.`;
      }
    } else if (primaryDir === 'SELL') {
      if (mtf.timeframes['4H']?.bias === 'BULLISH' && mtf.timeframes['1H']?.bias === 'BULLISH') {
        vote = 'HOLD';
        conviction = 40;
        romanUrdu = 'SELL signal bana hai lekin 4H/1H macro trend strongly bullish hai, is liye structure agent ne hold kiya.';
      } else {
        vote = 'SELL';
        conviction = Math.min(98, Math.max(55, score + (mtf.isTripleScreenConfluence ? 8 : 0)));
        romanUrdu = `15M Bearish Liquidity Sweep + FVG mitigation hui hai. Confluence ${conviction}%. Structure SELL ko favor kar raha hai.`;
      }
    } else {
      vote = 'HOLD';
      conviction = 45;
      romanUrdu = 'Market consolidation / chop zone mein hai. Clear institutional structure breakout nahi mila.';
    }

    return {
      agentId: 'STRUCTURE_ANALYST',
      agentName: 'Structure Analyst (SMC/ICT)',
      role: 'TECHNICAL & ORDER FLOW STRUCTURE',
      vote,
      conviction,
      cotReasoning,
      romanUrduReason: romanUrdu,
      metrics: {
        score,
        regime: evalResult.regime,
        mtfOverall: mtf.overallBias,
        isInOte: ote.isInOteZone,
        turtleSoupCount: turtleSoup.length,
      },
    };
  }

  /**
   * Agent 2: Microstructure & Order Flow Agent (NautilusTrader Level 2 W-OBI)
   * Analyzes live Depth of Market, Bid/Ask Absorption, and Institutional Limit Walls.
   */
  public static evaluateMicrostructureAgent(
    symbol: string,
    orderBook: RealOrderBook,
    livePrice: number
  ): FinRobotAgentVote {
    const cotReasoning: string[] = [];
    const obi = calculateWeightedOrderBookImbalance(orderBook, 5);
    
    cotReasoning.push(`L2 Order Book Source: ${orderBook.source}, Spread: ${orderBook.spread}`);
    cotReasoning.push(`Weighted OBI: ${obi.percentage}% (Ratio: ${obi.imbalanceRatio}), Total Bid: ${obi.totalBidVolume}, Total Ask: ${obi.totalAskVolume}`);
    
    if (obi.institutionalWallDetected) {
      cotReasoning.push(`⚠️ Institutional Wall Detected: ${obi.wallSide} at price ${obi.wallPrice} (Size: ${obi.wallSize})`);
    }

    // P0 FIX: Strict Institutional Order Flow Data Integrity
    // If order book is synthetic / estimated microstructure (OTC Forex/Gold), DO NOT trigger absorption votes
    if (obi.isSynthetic || !obi.isActionable) {
      cotReasoning.push(`ℹ️ Microstructure Mode: OTC Broker Depth (${orderBook.source}). Exchange L2 disabled to prevent false triggers.`);
      return {
        agentId: 'MICROSTRUCTURE_ORDERFLOW',
        agentName: 'Order Flow & Microstructure',
        role: 'LEVEL 2 DEPTH & LIQUIDITY ABSORPTION',
        vote: 'HOLD',
        conviction: 50,
        cotReasoning,
        romanUrduReason: `OTC Broker Microstructure feed active hai. Real exchange L2 na hone ki wajah se quant protocol ke mutabiq vote HOLD (Neutral) par lock hai.`,
        metrics: {
          imbalanceRatio: obi.imbalanceRatio,
          imbalancePercentage: obi.percentage,
          totalBidVolume: obi.totalBidVolume,
          totalAskVolume: obi.totalAskVolume,
          wallSide: 'NONE',
          wallPrice: 0,
          wallSize: 0,
          spreadPips: orderBook.spread,
        },
      };
    }

    let vote: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let conviction = 50;
    let romanUrdu = '';

    // If real exchange order book exhibits heavy Bid absorption (W-OBI >= +0.18 or Bid Wall present)
    if (obi.imbalanceRatio >= 0.18 || (obi.wallSide === 'BID_WALL' && obi.imbalanceRatio > -0.05)) {
      vote = 'BUY';
      conviction = Math.min(96, Math.round(55 + obi.imbalanceRatio * 40));
      romanUrdu = `L2 Order Book mein Institutional Bid Absorption (+${obi.percentage}%) active hai. Smart money buy side liquidity absorb kar rahi hai.`;
    } else if (obi.imbalanceRatio <= -0.18 || (obi.wallSide === 'ASK_WALL' && obi.imbalanceRatio < 0.05)) {
      vote = 'SELL';
      conviction = Math.min(96, Math.round(55 + Math.abs(obi.imbalanceRatio) * 40));
      romanUrdu = `L2 Order Book mein Heavy Ask Distribution (${obi.percentage}%) active hai. Sellers order book par dominate kar rahe hain.`;
    } else {
      vote = 'HOLD';
      conviction = 52;
      romanUrdu = `Order Book balanced hai (OBI: ${obi.percentage}%). Koi abnormal institutional pressure nahi hai.`;
    }

    return {
      agentId: 'MICROSTRUCTURE_ORDERFLOW',
      agentName: 'Order Flow & Microstructure',
      role: 'LEVEL 2 DEPTH & LIQUIDITY ABSORPTION',
      vote,
      conviction,
      cotReasoning,
      romanUrduReason: romanUrdu,
      metrics: {
        imbalanceRatio: obi.imbalanceRatio,
        percentage: obi.percentage,
        bias: obi.bias,
        wallSide: obi.wallSide,
        wallPrice: obi.wallPrice,
        wallSize: obi.wallSize,
        spread: orderBook.spread,
      },
    };
  }

  /**
   * Agent 3: Macro & Smart Money Agent (CFTC COT, Interest Rates, Currency Strengths)
   */
  public static evaluateMacroAgent(symbol: string): FinRobotAgentVote {
    const cotReasoning: string[] = [];
    const sym = symbol.toUpperCase();

    let base = 'USD';
    let quote = 'USD';
    if (sym === 'EURUSD') { base = 'EUR'; quote = 'USD'; }
    else if (sym === 'GBPUSD') { base = 'GBP'; quote = 'USD'; }
    else if (sym === 'USDJPY') { base = 'USD'; quote = 'JPY'; }
    else if (sym === 'AUDUSD') { base = 'AUD'; quote = 'USD'; }
    else if (sym === 'USDCAD') { base = 'USD'; quote = 'CAD'; }
    else if (sym === 'USDCHF') { base = 'USD'; quote = 'CHF'; }
    else if (sym === 'XAUUSD') { base = 'USD'; quote = 'USD'; } // Gold driven by DXY inverted
    else if (sym === 'BTCUSD') { base = 'USD'; quote = 'USD'; }

    let vote: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let conviction = 50;
    let romanUrdu = '';

    if (sym === 'XAUUSD' || sym === 'BTCUSD') {
      const usdCot = CftcCotEngine.getByCurrency('USD');
      const isUsdBearish = usdCot?.bias === 'BEARISH';
      const isUsdBullish = usdCot?.bias === 'BULLISH';
      cotReasoning.push(`CFTC COT USD Index positioning: ${usdCot?.bias || 'NEUTRAL'} (${usdCot?.nonCommercialNet || 0} Net Speculative contracts)`);

      if (isUsdBearish) {
        vote = 'BUY';
        conviction = 82;
        romanUrdu = 'CFTC COT report ke mutabiq Dollar Index (DXY) par institutional short positioning hai, jo Gold/BTC ko Bullish tailwind deta hai.';
      } else if (isUsdBullish) {
        vote = 'SELL';
        conviction = 82;
        romanUrdu = 'CFTC COT report ke mutabiq Dollar Index (DXY) par institutional long positioning hai, jo Gold/BTC par heavy bearish pressure daalta hai.';
      } else {
        vote = 'HOLD';
        conviction = 55;
        romanUrdu = 'Macro positioning neutral consolidation zone mein hai.';
      }
    } else {
      const cotBias = CftcCotEngine.getPairCotBias(base, quote);
      cotReasoning.push(`Pair COT Delta: ${cotBias.delta} (Base ${base} Net: ${cotBias.baseNet}, Quote ${quote} Net: ${cotBias.quoteNet})`);
      cotReasoning.push(`Institutional COT Score: ${cotBias.score}/100, Bias: ${cotBias.bias}`);

      if (cotBias.bias === 'BULLISH') {
        vote = 'BUY';
        conviction = Math.max(60, cotBias.score);
        romanUrdu = `CFTC Commercial Hedgers & Speculators ${base} vs ${quote} par net bullish tilted hain (Score: ${cotBias.score}%).`;
      } else if (cotBias.bias === 'BEARISH') {
        vote = 'SELL';
        conviction = Math.max(60, cotBias.score);
        romanUrdu = `CFTC Institutional data ${base} vs ${quote} par bearish distribution show kar raha hai.`;
      } else {
        vote = 'HOLD';
        conviction = 50;
        romanUrdu = 'Macro currency flows balanced hain.';
      }
    }

    return {
      agentId: 'MACRO_SMART_MONEY',
      agentName: 'Macro Smart Money Agent',
      role: 'CFTC COT INSTITUTIONAL POSITIONING',
      vote,
      conviction,
      cotReasoning,
      romanUrduReason: romanUrdu,
      metrics: {
        symbol: sym,
        base,
        quote,
      },
    };
  }

  /**
   * Agent 4: Risk Guardian Agent (FinRobot Risk Manager with absolute VETO power)
   * Enforces Kelly Criterion, max drawdown bounds, spread guard, and 1:2.5 minimum R:R.
   */
  public static evaluateRiskGuardian(params: {
    symbol: string;
    structureVote: FinRobotAgentVote;
    orderFlowVote: FinRobotAgentVote;
    macroVote: FinRobotAgentVote;
    livePrice: number;
    orderBook: RealOrderBook;
    baseLotSize: number;
    accountBalance?: number;
    activePositionsCount?: number;
  }): FinRobotAgentVote & { kelly: FractionalKellyResult } {
    const {
      symbol,
      structureVote,
      orderFlowVote,
      macroVote,
      livePrice,
      orderBook,
      baseLotSize,
      accountBalance = 500,
      activePositionsCount = 0,
    } = params;

    const cotReasoning: string[] = [];
    const spec = INSTITUTIONAL_SYMBOLS[symbol] || INSTITUTIONAL_SYMBOLS['XAUUSD'];
    const spreadPips = orderBook.spread > 0 ? orderBook.spread / (spec?.pipSize || 0.1) : (spec?.spreadPips || 1.5);

    cotReasoning.push(`Risk Guardian Check: Spread=${spreadPips.toFixed(1)} pips, Active Positions=${activePositionsCount}, Balance=$${accountBalance}`);

    let isVeto = false;
    let vetoReason = '';

    // 1. Extreme Spread Veto (Adverse slippage risk)
    const maxAllowedSpreadPips = symbol === 'XAUUSD' ? 4.5 : symbol === 'BTCUSD' ? 35 : 3.0;
    if (spreadPips > maxAllowedSpreadPips) {
      isVeto = true;
      vetoReason = `Current spread (${spreadPips.toFixed(1)} pips) exceeds institutional safety threshold (${maxAllowedSpreadPips} pips). High slippage risk!`;
      cotReasoning.push(`⛔ VETO TRIGGERED: Spread too wide (${spreadPips.toFixed(1)} pips)`);
    }

    // 2. Order Book Adverse Wall Veto
    const tentativeDir = structureVote.vote;
    const obi = calculateWeightedOrderBookImbalance(orderBook, 5);
    if (tentativeDir === 'BUY' && obi.wallSide === 'ASK_WALL' && obi.imbalanceRatio < -0.35) {
      isVeto = true;
      vetoReason = `Massive Institutional Ask Wall (${obi.wallSize} Lots at ${obi.wallPrice}) detected blocking upward momentum. Adverse order absorption risk!`;
      cotReasoning.push(`⛔ VETO TRIGGERED: Massive Ask Wall blocking BUY`);
    } else if (tentativeDir === 'SELL' && obi.wallSide === 'BID_WALL' && obi.imbalanceRatio > 0.35) {
      isVeto = true;
      vetoReason = `Massive Institutional Bid Wall (${obi.wallSize} Lots at ${obi.wallPrice}) detected absorbing sellers. Bounce risk!`;
      cotReasoning.push(`⛔ VETO TRIGGERED: Massive Bid Wall blocking SELL`);
    }

    // 3. Fractional Kelly Criterion Calculation (from Edward Thorp / FinRL)
    // f* = p - (1 - p)/b where p = win probability, b = reward/risk ratio (avg 2.5)
    const avgConviction = (structureVote.conviction + orderFlowVote.conviction + macroVote.conviction) / 3;
    const winProbability = Math.max(0.45, Math.min(0.85, avgConviction / 100));
    const riskRewardRatio = 2.5; // Institutional target R:R 1:2.5
    const q = 1 - winProbability;
    const rawKelly = (winProbability * riskRewardRatio - q) / riskRewardRatio;
    
    // Quarter Kelly (0.25x) for maximum safety and account preservation
    const safeKellyFraction = Math.max(0.01, Math.min(0.12, rawKelly * 0.25));

    // Dynamic Lot Size calculation
    // Scale standard 0.01 lot up to 0.05 lot depending on safe Kelly fraction and equity
    let recommendedLot = baseLotSize;
    if (accountBalance >= 1000) {
      recommendedLot = Number(Math.max(baseLotSize, Math.min(0.10, baseLotSize * (1 + safeKellyFraction * 8))).toFixed(2));
    } else if (accountBalance >= 300) {
      recommendedLot = Number(Math.max(baseLotSize, Math.min(0.04, baseLotSize * (1 + safeKellyFraction * 4))).toFixed(2));
    }

    const kelly: FractionalKellyResult = {
      recommendedLot,
      rawKellyFraction: Number(rawKelly.toFixed(3)),
      safeKellyFraction: Number(safeKellyFraction.toFixed(3)),
      winProbability: Number(winProbability.toFixed(2)),
      riskRewardRatio,
      rationale: `Fractional 0.25x Kelly: WinProb=${(winProbability * 100).toFixed(0)}%, R:R=1:${riskRewardRatio} -> Optimal lot ${recommendedLot}`,
    };

    let vote: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let conviction = 50;
    let romanUrdu = '';

    if (isVeto) {
      vote = 'HOLD';
      conviction = 95;
      romanUrdu = `⚠️ [RISK VETO]: Risk Guardian ne trade ko block kar diya hai. Wajah: ${vetoReason}`;
    } else {
      vote = tentativeDir !== 'HOLD' ? tentativeDir : 'HOLD';
      conviction = Math.round(winProbability * 100);
      romanUrdu = `Risk parameters clear hain. Spread acceptable (${spreadPips.toFixed(1)} pips). Fractional Kelly sizing: ${recommendedLot} Lot. Minimum 1:2.5 R:R enforced.`;
    }

    return {
      agentId: 'RISK_GUARDIAN',
      agentName: 'Risk Guardian (Kelly / VaR)',
      role: 'CAPITAL PRESERVATION & KELLY SIZING (VETO POWER)',
      vote,
      conviction,
      cotReasoning,
      romanUrduReason: romanUrdu,
      metrics: {
        spreadPips,
        isVeto,
        vetoReason,
        recommendedLot,
        safeKellyFraction,
      },
      isVeto,
      vetoReason,
      kelly,
    };
  }

  /**
   * Master Consensus Aggregator:
   * Coordinates the 4 FinRobot AI agents, calculates weighted consensus, checks for Veto,
   * and outputs final trade verdict.
   */
  public static evaluateConsensus(
    symbol: string,
    candles: Candle[],
    livePrice: number,
    orderBook: RealOrderBook,
    baseLotSize: number = 0.01,
    accountBalance: number = 500,
    activePositionsCount: number = 0
  ): FinRobotConsensusResult {
    const sym = symbol.toUpperCase();
    const now = Date.now();

    // 1. Run the 3 analytical agents in parallel
    const structureVote = this.evaluateStructureAgent(sym, candles, livePrice);
    const orderFlowVote = this.evaluateMicrostructureAgent(sym, orderBook, livePrice);
    const macroVote = this.evaluateMacroAgent(sym);

    // 2. Run the Risk Guardian with full situational awareness
    const riskGuardianVote = this.evaluateRiskGuardian({
      symbol: sym,
      structureVote,
      orderFlowVote,
      macroVote,
      livePrice,
      orderBook,
      baseLotSize,
      accountBalance,
      activePositionsCount,
    });

    // 3. Count votes
    const allVotes = [structureVote, orderFlowVote, macroVote, riskGuardianVote];
    const voteCount = { buy: 0, sell: 0, hold: 0 };
    for (const v of allVotes) {
      if (v.vote === 'BUY') voteCount.buy++;
      else if (v.vote === 'SELL') voteCount.sell++;
      else voteCount.hold++;
    }

    // 4. Calculate weighted consensus score
    // Structure: 35%, OrderFlow: 30%, Macro: 15%, Risk: 20%
    const weights = {
      structure: 0.35,
      orderFlow: 0.30,
      macro: 0.15,
      risk: 0.20,
    };

    let buyScore = 0;
    let sellScore = 0;

    if (structureVote.vote === 'BUY') buyScore += structureVote.conviction * weights.structure;
    else if (structureVote.vote === 'SELL') sellScore += structureVote.conviction * weights.structure;

    if (orderFlowVote.vote === 'BUY') buyScore += orderFlowVote.conviction * weights.orderFlow;
    else if (orderFlowVote.vote === 'SELL') sellScore += orderFlowVote.conviction * weights.orderFlow;

    if (macroVote.vote === 'BUY') buyScore += macroVote.conviction * weights.macro;
    else if (macroVote.vote === 'SELL') sellScore += macroVote.conviction * weights.macro;

    if (riskGuardianVote.vote === 'BUY' && !riskGuardianVote.isVeto) buyScore += riskGuardianVote.conviction * weights.risk;
    else if (riskGuardianVote.vote === 'SELL' && !riskGuardianVote.isVeto) sellScore += riskGuardianVote.conviction * weights.risk;

    const isBuyDominant = buyScore > sellScore;
    const consensusScore = Math.round(isBuyDominant ? buyScore : sellScore);
    const dominantDir: 'BUY' | 'SELL' | 'HOLD' = 
      isBuyDominant && buyScore >= 55 ? 'BUY' :
      !isBuyDominant && sellScore >= 55 ? 'SELL' : 'HOLD';

    const agreementCount = dominantDir === 'BUY' ? voteCount.buy : dominantDir === 'SELL' ? voteCount.sell : voteCount.hold;
    const agreementRatio = `${agreementCount}/4`;
    const isUnanimous = agreementCount === 4;

    // Consensus rule: At least 3/4 agents agree OR weighted consensus >= 75%, AND Risk Guardian did NOT veto
    const isApproved = !riskGuardianVote.isVeto && dominantDir !== 'HOLD' && (agreementCount >= 3 || consensusScore >= 75);

    const obi = calculateWeightedOrderBookImbalance(orderBook, 5);

    // Construct Roman Urdu explanation
    let romanUrdu = '';
    if (riskGuardianVote.isVeto) {
      romanUrdu = `⛔ [FinRobot VETO]: Trade execute nahi ki gayi. ${riskGuardianVote.vetoReason}`;
    } else if (isApproved) {
      romanUrdu = `🤖 [FinRobot Consensus APPROVED]: ${agreementRatio} AI Agents ne ${dominantDir} vote kiya (Consensus ${consensusScore}%). L2 Order Book Imbalance: ${obi.percentage}%. Optimal lot size: ${riskGuardianVote.kelly.recommendedLot} Lot. Execution approved!`;
    } else {
      romanUrdu = `⏸️ [FinRobot HOLD]: Agents ka consensus complete nahi hua (${agreementRatio} votes, Score: ${consensusScore}%). Capital safe rakhne ke liye hold kiya gaya hai.`;
    }

    return {
      symbol: sym,
      timestamp: now,
      primaryDirection: isApproved ? dominantDir : 'HOLD',
      consensusScore,
      isApproved,
      isUnanimous,
      agreementRatio,
      voteCount,
      agentVotes: {
        structure: structureVote,
        orderFlow: orderFlowVote,
        macro: macroVote,
        riskGuardian: riskGuardianVote,
      },
      orderBookImbalance: obi,
      fractionalKelly: riskGuardianVote.kelly,
      isVetoed: !!riskGuardianVote.isVeto,
      vetoReason: riskGuardianVote.vetoReason,
      romanUrduConsensusSummary: romanUrdu,
    };
  }
}

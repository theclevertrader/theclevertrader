import { NextRequest, NextResponse } from 'next/server';
import { CftcCotEngine } from '@/lib/engines/cftc-cot-engine';
import { InterestRateDiffEngine } from '@/lib/engines/interest-rate-diff-engine';
import { CurrencyStrengthEngine } from '@/lib/engines/currency-strength-engine';
import { QuantTechnicalEngine } from '@/lib/engines/quant-technical-engine';
import { ForexScoreEngine } from '@/lib/engines/forex-score-engine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get('pair') || 'EURUSD';

  const cotCurrencies = CftcCotEngine.getAllCurrencies();
  const centralBanks = InterestRateDiffEngine.getAllCentralBanks();
  const pairDifferentials = InterestRateDiffEngine.getAllMajorPairs();
  const currencyStrengths = CurrencyStrengthEngine.getAllStrengths();
  const topPairSetups = CurrencyStrengthEngine.getTopPairSetups();
  const scoreCard = ForexScoreEngine.calculateCompleteScore(pair);
  const technicalSnapshot = QuantTechnicalEngine.calculateSnapshot(pair);

  return NextResponse.json({
    status: 'OK',
    activePair: pair.toUpperCase(),
    scoreCard,
    cotCurrencies,
    centralBanks,
    pairDifferentials,
    currencyStrengths,
    topPairSetups,
    technicalSnapshot,
    macroCalendarBlackout: {
      isBlackoutActive: false,
      minutesUntilHighImpact: 45,
      event: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
      rule: '30 min before high impact $\\rightarrow$ Reduce risk / No new trade $\\rightarrow$ News release $\\rightarrow$ Spread check $\\rightarrow$ Resume',
    },
  });
}

import { Candle, KillZone, FairValueGap } from '../types/trading';

export class IctEngine {
  /**
   * Determines active ICT session Kill Zones based on timestamp
   */
  public static getKillZones(timestamp: number): KillZone[] {
    const date = new Date(timestamp);
    const utcHours = date.getUTCHours();

    return [
      {
        name: 'ASIAN',
        startHourUtc: 1,
        endHourUtc: 5,
        isActive: utcHours >= 1 && utcHours < 5,
      },
      {
        name: 'LONDON',
        startHourUtc: 7,
        endHourUtc: 10,
        isActive: utcHours >= 7 && utcHours < 10,
      },
      {
        name: 'NEW_YORK',
        startHourUtc: 12,
        endHourUtc: 15,
        isActive: utcHours >= 12 && utcHours < 15,
      },
    ];
  }

  /**
   * Calculates Previous Day High (PDH) and Previous Day Low (PDL)
   */
  public static calculatePdhPdl(candles: Candle[]): { pdh: number; pdl: number; sweptPdh: boolean; sweptPdl: boolean } {
    if (candles.length < 24) {
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      return {
        pdh: Math.max(...highs),
        pdl: Math.min(...lows),
        sweptPdh: false,
        sweptPdl: false,
      };
    }

    // Use preceding day's 24 hours of candles
    const prevDayCandles = candles.slice(-48, -24);
    const pdh = Math.max(...prevDayCandles.map(c => c.high));
    const pdl = Math.min(...prevDayCandles.map(c => c.low));

    const todayCandles = candles.slice(-24);
    const currentHigh = Math.max(...todayCandles.map(c => c.high));
    const currentLow = Math.min(...todayCandles.map(c => c.low));
    const currentClose = todayCandles[todayCandles.length - 1]?.close || 0;

    // Swept = traded beyond and closed back inside
    const sweptPdh = currentHigh > pdh && currentClose < pdh;
    const sweptPdl = currentLow < pdl && currentClose > pdl;

    return { pdh, pdl, sweptPdh, sweptPdl };
  }

  /**
   * Inversion Fair Value Gaps (IFVG)
   * When a Bullish FVG is violated to the downside, it flips to Bearish resistance.
   * When a Bearish FVG is violated to the upside, it flips to Bullish support.
   */
  public static detectInversionFvgs(candles: Candle[], fvgs: FairValueGap[]): FairValueGap[] {
    const ifvgs: FairValueGap[] = [];

    for (const fvg of fvgs) {
      if (!fvg.isFilled) continue;

      const subsequent = candles.slice(fvg.candleIndex + 2);
      for (let i = 0; i < subsequent.length; i++) {
        const c = subsequent[i];
        if (fvg.type === 'BULLISH' && c.close < fvg.bottom) {
          ifvgs.push({
            ...fvg,
            id: `ifvg-bear-${fvg.time}`,
            type: 'BEARISH',
            isInverted: true,
          });
          break;
        } else if (fvg.type === 'BEARISH' && c.close > fvg.top) {
          ifvgs.push({
            ...fvg,
            id: `ifvg-bull-${fvg.time}`,
            type: 'BULLISH',
            isInverted: true,
          });
          break;
        }
      }
    }

    return ifvgs;
  }

  /**
   * Determines ICT Daily Bias based on HTF structure and PDH/PDL sweeps
   */
  public static determineDailyBias(candles: Candle[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (candles.length < 10) return 'NEUTRAL';
    const recent = candles.slice(-20);
    const emaFast = recent.reduce((acc, c) => acc + c.close, 0) / recent.length;
    const lastClose = candles[candles.length - 1].close;

    const { sweptPdh, sweptPdl } = this.calculatePdhPdl(candles);

    if (sweptPdl && lastClose > emaFast) {
      return 'BULLISH'; // Sell-side raid followed by expansion
    }
    if (sweptPdh && lastClose < emaFast) {
      return 'BEARISH'; // Buy-side raid followed by downward expansion
    }

    if (lastClose > emaFast * 1.002) return 'BULLISH';
    if (lastClose < emaFast * 0.998) return 'BEARISH';
    return 'NEUTRAL';
  }
}

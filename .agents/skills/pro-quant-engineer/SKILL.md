---
name: pro-quant-engineer
description: Specialized quant engineering skill for institutional market orderflow, BestOrderFlow footprint clusters, SMC liquidity sweeps, MT5 live bridges, ATR risk calculations, and serverless cloud monitoring. Activate whenever building, refining, or debugging trading engines, indicators, order routing, or risk governors.
---

# 🚀 PRO QUANT ENGINEER — INSTITUTIONAL ALGORITHMIC PROTOCOLS

## 1. Institutional Footprint & Orderflow Mechanics

- **300% Stacked Imbalance Definition:** An institutional stacked imbalance occurs when 3 or more consecutive price levels have Bid volume >= 3.0x diagonal Ask volume (Sell Imbalance) or Ask volume >= 3.0x diagonal Bid volume (Buy Imbalance).
- **Point of Control (POC):** The exact price level within a profile or cluster with the absolute highest traded volume. Must be highlighted in vibrant gold (`#ffd700` / `#fbbf24`).
- **Value Area (VAH / VAL):** The 70% volume distribution interval calculated symmetrically from the POC.
- **Naked POC:** An untransacted POC from a previous session that price has not yet retested. Serves as a high-probability liquidity magnet.

## 2. Smart Money Concepts (SMC) & ICT Algorithms

- **Order Block (OB):** The last opposing candle before an aggressive structural expansion that created an imbalance/FVG.
- **Fair Value Gap (FVG):** A 3-candle price imbalance where Candle 1 High < Candle 3 Low (Bullish FVG) or Candle 1 Low > Candle 3 High (Bearish FVG).
- **Session Judas Swings:** London (12:00-16:00 PKT) and New York (18:00-22:00 PKT) liquidity sweeps of the Asian range extremes (05:00-11:00 PKT) before the true directional expansion.

## 3. Strict Mathematical Risk & Trade Management

- **Risk-to-Reward (R:R):** Default to a strict minimum 1:2 R:R for Take-Profit 1, and 1:4 R:R for Take-Profit 2 runner.
- **Auto-Breakeven Rule:** At +12 pips floating profit, unconditionally shift Stop-Loss to `entryPrice + (isBuy ? 1.0 : -1.0) * spreadPips`.
- **Partial Profit Booking:** At +20 pips floating profit, liquidate 50% of the position volume into account balance cash.
- **Dynamic Trailing Stop:** Trail behind current price by `trailingDistancePips = 12` once price reaches `trailingActivationPips = 18`. Step advance must be at least 4 pips to prevent broker flood (10027 err).
- **Capital Shield Circuit Breaker:** Daily max drawdown capped at $25.00 USD. If reached, halt all scanning for 24 hours.

## 4. MT5 High-Speed Python Bridge Best Practices

- Keep socket ping < 2ms using local loopback `127.0.0.1:8001`.
- Always verify symbol resolution (e.g. `XAUUSD` vs `XAUUSDm` vs `GOLD` for Exness Standard/Raw accounts).
- Handle broker retcodes gracefully:
  - `10009`: Order filled successfully.
  - `10014`: Invalid volume (clamp to symbol min/max step).
  - `10016`: Invalid stops (verify minimum stop level distance).
  - `10027`: Too many requests (enforce rate-limit cooldown).

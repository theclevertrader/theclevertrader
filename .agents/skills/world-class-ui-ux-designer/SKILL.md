---
name: world-class-ui-ux-designer
description: Specialized UI/UX design skill for crafting world-class, institutional-grade financial dashboards, TradingView embeds, cyber-obsidian frosted glass interfaces, 240 FPS canvas charts, and responsive trading terminals. Activate whenever building, redesigning, or polishing frontend layouts, charts, or visual components.
---

# 🎨 WORLD-CLASS UI/UX DESIGNER — INSTITUTIONAL DESIGN TOKENS

## 1. Visual Aesthetics & Design System

- **Theme:** Cyber Obsidian Dark Mode. Base background: `#03060f` or `#050813`.
- **Frosted Glassmorphism:**
  - `backdrop-blur-2xl bg-[#040813]/85`
  - `border border-white/[0.08]` with luminous inner highlight `inset 0 1px 0 0 rgba(255,255,255,0.06)`
  - Deep ambient drop-shadow: `shadow-[0_8px_32px_rgba(0,0,0,0.6)]`
- **Neon Brand Accent Colors:**
  - Neon Cyan (Level-2 / MBO): `#00f0ff` / `#06b6d4`
  - Emerald Green (Bullish / Bridge Connected): `#00ff9d` / `#10b981`
  - Amber Gold (Point of Control / VIP Signals): `#fbbf24` / `#f59e0b`
  - Rose Crimson (Bearish / Stop Loss / Imbalance): `#f43f5e` / `#ff0055`
  - Royal Violet (AI Copilot / Ruflo Swarm): `#a855f7` / `#8b5cf6`

## 2. Typography Standard

- **Tickers & Quant Numbers:** Always use `font-mono tabular-nums font-bold` (e.g. `JetBrains Mono`). Numbers must never jitter or cause layout reflow when live prices tick.
- **Headers & Navigation:** `font-sans font-black tracking-tight` (e.g. `Outfit`, `Plus Jakarta Sans`, `Inter`).
- **Micro Badges:** `text-[10px] font-mono uppercase tracking-wider font-extrabold`.

## 3. High-Performance Canvas & Chart Standards

- **High-DPI / Retina Crispness:**
  Always calculate:

  ```ts
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(canvas.width / dpr);
  const h = Math.floor(canvas.height / dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ```

  All drawing math must be expressed in logical CSS pixels so graphics stay razor-sharp at any OS scaling (100%, 125%, 150%, 200%).

- **Dynamic 100% Width Auto-Stretching:**
  Always observe the container using `ResizeObserver`:

  ```ts
  const ro = new ResizeObserver(() => updateDimensions());
  ro.observe(container);
  ```

  Never set canvas style to a hardcoded pixel width (`main.style.width = '${w}px'`). Always use `style={{ width: '100%' }}` so there is zero horizontal empty black space!

- **Decoupled Crosshairs & Overlays:**
  Never redraw the entire candlestick/footprint series when the user moves the mouse. Use a transparent overlay canvas for crosshairs (`renderOverlay`), which takes <0.05ms to clear and redraw.

## 4. Micro-Interactions & Audio Feedback

- Use subtle card hover elevations (`hover:border-cyan-500/40 hover:scale-[1.01] transition-all duration-200`).
- Synthesize crisp cybernetic audio beeps using Web Audio API (`AudioContext`) with sine/triangle waves for instant user feedback.

# WORLD-CLASS DESIGN & VISUAL EXCELLENCE

- The USER must be wowed at first glance. Generic, plain, or clunky UIs are unacceptable.
- Base Theme: Deep space OLED dark mode (`#03060f` or `#050813`).
- Frosted Glassmorphism: `backdrop-blur-2xl bg-black/60 border border-white/[0.08]` with luminous inner highlight.
- Curated Luminous Accents: Neon Cyan (`#00f0ff`), Vibrant Emerald (`#00ff9d`), Amber Gold (`#fbbf24`), Rose Crimson (`#f43f5e`).
- Typography: Tickers and numbers MUST use `JetBrains Mono` with `tabular-nums font-mono` to prevent jitter. Headers use `Outfit` / `Inter`.
- Antialiasing & DPI: Always use `window.devicePixelRatio` and `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` on canvas.

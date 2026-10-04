import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: {
          DEFAULT: "#0d0d12",
          hover: "#14141a",
          elevated: "#1a1a23",
          card: "#09090d",
          subtle: "#050508",
        },
        tv: {
          bg: "#000000",
          panel: "#09090d",
          border: "#1f1f26",
          blue: "#38bdf8",
          green: "#00e87a",
          red: "#f43f5e",
          gray: "#71717a",
        },
        terminal: {
          cyan: "#00f0ff",
          green: "#00e87a",
          greenGlow: "#00ff9d",
          blue: "#38bdf8",
          purple: "#a855f7",
          amber: "#f59e0b",
          rose: "#f43f5e",
          dark: "#000000",
          border: "#1f1f26",
          borderGlow: "rgba(255, 255, 255, 0.15)",
        },
        paper: "var(--vortex-paper, #080b11)",
        panel: "var(--vortex-panel, #0d121d)",
        line: {
          DEFAULT: "var(--vortex-line, rgba(255, 255, 255, 0.08))",
          strong: "var(--vortex-line-strong, rgba(255, 255, 255, 0.16))",
        },
        ink: {
          DEFAULT: "var(--vortex-ink, #f8fafc)",
          soft: "var(--vortex-ink-soft, #94a3b8)",
          faint: "var(--vortex-ink-faint, #64748b)",
        },
        accent: {
          DEFAULT: "var(--vortex-accent, #38bdf8)",
          soft: "var(--vortex-accent-soft, rgba(56, 189, 248, 0.12))",
        },
        up: {
          DEFAULT: "var(--vortex-up, #10b981)",
        },
        down: {
          DEFAULT: "var(--vortex-down, #f43f5e)",
        },
        vortexAmber: "#b7791f",
        vortexViolet: "#6d28d9",
        vortexPink: "#be185d",
        vortexTeal: "#0f766e",
      },
      boxShadow: {
        "cyan-glow": "0 0 20px -5px rgba(0, 240, 255, 0.3)",
        "green-glow": "0 0 20px -5px rgba(8, 153, 129, 0.35)",
        "rose-glow": "0 0 20px -5px rgba(242, 54, 69, 0.35)",
        "purple-glow": "0 0 20px -5px rgba(147, 51, 234, 0.3)",
        "card-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
        "tv-card": "0 2px 8px 0 rgba(0, 0, 0, 0.3)",
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif"
        ],
        display: [
          "Outfit",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "monospace"
        ],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

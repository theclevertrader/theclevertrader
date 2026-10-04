---
name: deep-researcher-auditor
description: Specialized auditing and research skill for conducting deep GitHub repository exploration, technical documentation verification, automated TypeScript type-checking, memory-leak detection, and network reliability validation. Activate before implementing major new features, refactoring architecture, or marking tasks complete.
---

# 🔬 DEEP RESEARCHER & CODE AUDITOR PROTOCOLS

## 1. Deep Research Before Implementation

- **Never guess APIs or library schemas:** Search GitHub, npm package definitions, or official documentation to understand exact patterns (e.g. TradingView Lightweight Charts custom series plugins, Modal.com serverless cron decorators, Next.js 14 App Router server/client boundary).
- **Inspect Active Codebase:** Cross-reference newly planned changes against active codebase imports, TypeScript interfaces, and environment configurations before modifying code.

## 2. Automated TypeScript & Build Verification

- After ANY modification to `.ts`, `.tsx`, or `.js` files, execute:

  ```bash
  npx tsc --noEmit
  ```

- Any error must be diagnosed and resolved immediately. Zero TypeScript errors allowed.

## 3. Network & Endpoints Verification

- Test all relevant Next.js routes using `urllib.request` or `fetch` to confirm HTTP 200 responses.
- Verify Modal Cloud endpoints (`get_sentinel_status`, `relay_telegram_alert`) using test payloads to guarantee 100% end-to-end delivery.

## 4. Performance & Memory Auditing

- Verify that background intervals (`setInterval`) are cleared on component unmount (`return () => clearInterval(...)`).
- Verify that `ResizeObserver` instances are disconnected on unmount (`return () => ro.disconnect()`).
- Keep garbage collection clean by memoizing calculations (`useMemo`, `useCallback`) and avoiding heavy object allocations in 60/240 FPS requestAnimationFrame loops.

# PRO ENGINEERING STANDARDS

- Always compile with `npx tsc --noEmit` to ensure 0 TypeScript errors before completing any task.
- Never write ad-hoc hacky fixes. Always implement durable, scalable, architectural solutions.
- Retain complete backwards compatibility for existing broker connections, webhooks, and MT5 pipelines.
- Ensure all canvas implementations stretch 100% of container width using ResizeObserver.
- Always use `useCallback` and `useMemo` for heavy math and data transformations.

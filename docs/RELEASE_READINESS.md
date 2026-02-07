# Grimoire Web Release Readiness

> Last updated: 2026-02-08
> Scope: Replace duplicated 2026-02-07 evaluation reports with a single actionable checklist.

## Must-Have (Before Internal Launch)

- [x] Sentry error monitoring integrated
- [x] `.env.example` added and updated
- [x] Build regression fixed (`lucide-react` wildcard import removed)
- [x] Core quality gates passing (`lint`, `typecheck`, `test:run`, `build`, pre-deploy check)
- [x] Supabase project status verified via MCP (`ACTIVE_HEALTHY`)
- [x] Supabase Realtime publication verified via MCP

## Should-Have (Before Public Beta)

- [x] E2E coverage expanded (home, sandbox, realistic room setup flow)
- [x] Added sandbox E2E coverage for role assignment + phase transition
- [x] E2E stability hardening (safe click helpers, resilient sandbox/home flows, controlled Playwright workers)
- [x] Web Vitals monitoring integrated (`CLS`, `FCP`, `INP`, `LCP`, `TTFB`)
- [x] User feedback entry added (configurable link, default GitHub Issues)
- [x] GitHub Actions CI workflow added

## Nice-to-Have (Can Follow After Launch)

- [ ] Full multiplayer E2E chain with multi-user coordination (create -> assign -> night -> vote -> end)
- [ ] Push notification backend endpoint implementation (`/api/push-subscription`)
- [ ] Offline queue backend endpoint hardening (`/api/game/operation` production implementation)
- [ ] PWA install prompt optimization (`beforeinstallprompt` flow)
- [ ] Periodic room-state sync for PWA background behavior

## Notes

- This checklist is the source of truth for release readiness.
- Historical deep-dive reports from 2026-02-07 were removed to avoid stale/conflicting status.

# PLANS.md

## Purpose / Big Picture

Ship a release-ready build of Grimoire Web with multi-round automated validation, including unit/integration tests, browser E2E, build checks, and deployment gates.

## Iteration 2026-02-07 (Claude Review Driven)

### Plan

1. Fix Claude review blocker: oversized `Icon` build chunk caused by `lucide-react` wildcard imports.
2. Re-run full release gates (lint, typecheck, all tests, build, pre-deployment).
3. Run stress-grade realistic browser automation across desktop/mobile with repeated runs.
4. Verify Supabase and Cloudflare MCP connectivity and deployment-related status.
5. Perform one more full E2E regression loop as self-iteration confirmation.

### Execution Log

- Replaced wildcard icon imports with explicit registry-based imports:
  - Added `src/lib/lucideRegistry.ts`
  - Updated `src/components/ui/Icon.tsx`
  - Updated `src/config/iconMap.ts`
- Resolved build blocker:
  - `Icon` chunk reduced from ~850KB (previous warning) to ~18.97KB.
- Completed gate validation:
  - `npm run lint` PASS
  - `npx tsc --noEmit` PASS
  - `npm run test:run` PASS
  - `npm run build` PASS
  - `node scripts/pre-deployment-check.js` PASS (29/29)
- Completed stress + realistic E2E:
  - `npm run test:e2e -- --project=chromium --repeat-each=3` PASS (33)
  - `npm run test:e2e -- --project=firefox --repeat-each=2` PASS (22)
  - `npm run test:e2e -- --project="Mobile Chrome" --repeat-each=2` PASS (22)
  - `npm run test:e2e` PASS (33)
- Codex readiness unit artifacts refreshed:
  - `collect_evidence.py`, `deterministic_rules.py`, `scoring.py --mode read-only`
  - Result: WARN (LLM checks not executed in this run; deterministic checks passed)
- MCP verification:
  - Cloudflare account listing available
  - Supabase organizations/projects available
  - Primary project `Game-Helper` status: `ACTIVE_HEALTHY`
  - Edge Functions `ask-ai` and `filter-game-state` status: `ACTIVE`

## Progress

- [x] Install project-level automation skills.
- [x] Establish repository AGENTS/PLANS execution contract.
- [x] Run readiness unit test in execute mode.
- [x] Execute full quality gate loop (lint/typecheck/tests/e2e/build/pre-deploy).
- [x] Run multi-round stress and realistic flow simulation.
- [x] Resolve regressions and re-run until gates are green.
- [x] Produce final delivery summary with artifacts.
- [x] Apply Claude review blocker fixes and complete deep retest iteration.

## Decision Log

- Use `codex-readiness-unit-test` first to validate execution guidance quality.
- Use `playwright` and existing Playwright suite for real-browser flow validation.
- Use repeated E2E runs to surface flaky behavior before release.
- Keep deployment claim local-gate based unless production credentials are provided.

## Outcomes & Retrospective

- Codex readiness unit test (execute mode) achieved PASS for all enabled checks.
- Full gate loop passed: `lint`, `typecheck`, `npm test`, `npm run test:e2e`, `build`, and pre-deployment check.
- Multi-round stress runs completed successfully:
  - Logic tests: 3 consecutive rounds PASS.
  - UI tests: 2 consecutive rounds PASS.
  - Integration tests: 2 consecutive rounds PASS.
  - E2E stress: Chromium repeat x5 PASS, Firefox repeat x3 PASS, Mobile Chrome repeat x3 PASS.
- Coverage run completed and report generated after test hardening fix.

## Surprises & Discoveries

- Found a flaky E2E failure on Firefox during stress run (`page.goto('/')` timeout).
- Root cause was transient navigation instability under repeated load.
- Mitigation: introduced retryable home-navigation helper in E2E specs.
- Found an unhandled rejection in `src/components/lobby/Lobby.test.tsx` due missing `await waitFor`.
- Fixing async assertion removed false-positive risk and stabilized coverage execution.

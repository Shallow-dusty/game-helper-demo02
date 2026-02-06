# PLANS.md

## Purpose / Big Picture

Ship a release-ready build of Grimoire Web with multi-round automated validation, including unit/integration tests, browser E2E, build checks, and deployment gates.

## Progress

- [x] Install project-level automation skills.
- [x] Establish repository AGENTS/PLANS execution contract.
- [x] Run readiness unit test in execute mode.
- [x] Execute full quality gate loop (lint/typecheck/tests/e2e/build/pre-deploy).
- [x] Run multi-round stress and realistic flow simulation.
- [x] Resolve regressions and re-run until gates are green.
- [x] Produce final delivery summary with artifacts.

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

# AGENTS.md

This file defines the execution guide for `/home/shallow/04.AI-Prism/03.game-helper-demo02`.

## Project Context

- `src/`: React + TypeScript application code (UI, store, hooks, lib).
- `tests/`: integration and cross-module test cases.
- `e2e/`: Playwright end-to-end tests for user-facing flows.
- `scripts/pre-deployment-check.js`: pre-release gate for deployment artifacts and required runtime settings.
- `playwright.config.ts`: browser matrix and web server config for E2E.
- `vitest.config.ts`: unit/integration scope split and memory-safe test execution settings.
- `docs/DEPLOYMENT.md`: production deployment instructions.
- `docs/TESTING.md`: testing strategy and coverage baseline.
- `PLANS.md`: active execution plan and iteration log for this repo.

## Ground Rules

- Do not revert user-authored local changes unless explicitly requested.
- Prefer `rg` for file discovery and text search.
- Keep edits minimal and focused.
- Validate with tests before claiming completion.

## Core Commands

Run from repo root:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run test:src:logic
npm run test:src:ui
npm run test:tests
npm run test:e2e
npm run build
node scripts/pre-deployment-check.js
```

Useful focused commands:

```bash
npm run test:coverage
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project="Mobile Chrome"
PW_INCLUDE_WEBKIT=1 npm run test:e2e -- --project=webkit
PW_INCLUDE_WEBKIT=1 npm run test:e2e -- --project="Mobile Safari"
```

## Dev/Build/Test Loops

### Loop A: Fast validation (run after every meaningful code change)

Order:

1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run test:src:logic`
4. `npm run test:src:ui`

Success criteria:

- All commands exit with code `0`.
- No lint errors.
- No TypeScript errors.
- No failing tests in logic/UI scopes.

### Loop B: Full regression (run before merge/release)

Order:

1. `npm run test:tests`
2. `npm run test:e2e`
3. `npm run build`
4. `node scripts/pre-deployment-check.js`

Success criteria:

- All commands exit with code `0`.
- E2E report has no failed specs.
- `dist/` is produced by build.
- pre-deployment gate reports all required checks passed.

### Loop C: Release hardening (run when targeting production)

Order:

1. `npm run test:coverage`
2. `npm run test:e2e -- --project=chromium --repeat-each=3`
3. `npm run test:e2e -- --project=firefox --repeat-each=2`
4. `npm run test:e2e -- --project="Mobile Chrome" --repeat-each=2`
5. `npm run build`
6. `node scripts/pre-deployment-check.js`

Success criteria:

- Coverage report generated under `coverage/`.
- Repeated E2E runs do not produce flaky failures.
- Build and pre-deployment gate both pass.

## Test Artifacts

- `coverage/`: code coverage report output.
- `playwright-report/`: E2E HTML report.
- `test-results/`: Playwright raw artifacts.
- `.codex-readiness-unit-test/`: readiness unit artifacts.
- `.codex-readiness-integration-test/`: readiness integration artifacts.

## Planning Reference

- Active execution and review log: [PLANS.md](PLANS.md)

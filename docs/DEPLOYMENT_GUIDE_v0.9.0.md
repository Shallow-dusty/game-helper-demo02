# Deployment Guide v0.9.0

This file is the release checklist wrapper for production deployment.

## Canonical docs
- Primary deployment doc: `docs/DEPLOYMENT.md`
- PWA/offline: `docs/PWA.md`
- Testing strategy: `docs/TESTING.md`

## Release checklist
1. Install dependencies: `npm ci`
2. Type check: `npx tsc --noEmit`
3. Unit/integration tests: `npm test`
4. E2E tests: `npm run test:e2e`
5. Production build: `npm run build`
6. Pre-deployment gate: `node scripts/pre-deployment-check.js`

## Required runtime secrets
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`
- Server-side only: `VAPID_PRIVATE_KEY` (do not commit to repository)

## Deployment target
- Frontend: Cloudflare Pages (or equivalent static host)
- Backend/data: Supabase

# Lighthouse Optimization Guide

## Run audit
```bash
npm run build
npm run preview
# In Chrome DevTools, run Lighthouse (Performance, Accessibility, Best Practices, SEO, PWA)
```

## Target thresholds
- Performance >= 85
- Accessibility >= 90
- Best Practices >= 90
- SEO >= 90
- PWA >= 90

## Common actions
- Reduce initial JS payload via code splitting
- Ensure critical images are optimized and sized
- Keep service worker and manifest valid
- Avoid layout shifts in first render

## Track regressions
Store report artifacts under `playwright-report/` or CI artifacts for release comparison.

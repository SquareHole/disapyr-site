# CHANGE_TRACKER

## 2026-02-26 — copilot/fix-lighthouse-issues
- date: 2026-02-26
- branch: copilot/fix-lighthouse-issues
- commit: TBD
- summary: Fix Lighthouse SEO audit failures — make "Learn more" footer link descriptive and create a valid robots.txt replacing the non-standard Content-Signal directive.
- scope:
  - link text (`site/app/components/Layout.tsx`)
  - robots.txt (`site/public/robots.txt`)
- risk: low — UI text change and static file addition; no crypto, API, or schema changes.
- breaking_change: false
- notes: `deprecations` and `errors-in-console` best-practices audit failures are caused by Cloudflare CDN scripts and a browser extension respectively; they are not fixable via code changes.

## 2026-01-17 — feat/env-assertion-ci-tests
- date: 2026-01-17
- branch: feat/env-assertion-ci-tests
- commit: 0c4666e
- summary: Add fail-fast environment validation, extract crypto helpers, stricter input validation, unit tests for crypto/cleanup, and CI workflow.
- scope:
  - runtime env validation (`site/netlify/functions/_lib/assertEnv.js`)
  - crypto helpers (`site/netlify/functions/_lib/crypto.js`)
  - input validation and handler hardening (`createSecret.js`, `getSecret.js`, `cleanupExpired.js`)
  - unit tests for crypto + cleanup (`__tests__/crypto.test.js`, `__tests__/cleanupExpired.test.js`)
  - CI workflow (`.github/workflows/ci.yml`)
- risk: low-medium — changes add runtime checks and tests; no changes to crypto primitives or DB schema. Possible deployment failure if env is misconfigured (fail-fast behavior).
- breaking_change: false
- notes: Entry will be updated with the final commit SHA before merge.

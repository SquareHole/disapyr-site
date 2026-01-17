# CHANGE_TRACKER

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

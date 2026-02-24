# CHANGE_TRACKER

## 2026-02-24 — fix/review-46-fixes
- date: 2026-02-24
- branch: fix/review-46-fixes
- commit: 6d085c1
- summary: Implement all actionable fixes from review-46. Resolves critical broken-cleanup bug, TOCTOU race condition on secret retrieval, missing CSP header, and insecure nonce DOM exposure. Also fixes broken tests, medium-priority bugs, and low-priority quality issues.
- scope:
  - `cleanupExpired.js` — add missing `assertEnv` import (was causing ReferenceError on every invocation); remove duplicate `schedule` export (netlify.toml is now sole source of truth)
  - `getSecret.js` — replace SELECT+UPDATE with atomic UPDATE...RETURNING to eliminate TOCTOU race condition; use shared `isUuidV4` from `_lib/validate.js`; remove redundant encryption key check  
  - `middleware.ts` — assign CSP string to variable and apply via `response.headers.set('Content-Security-Policy', ...)` (was being discarded); remove `x-nonce` from response headers (was exposing nonce to client-side scripts)
  - `app/layout.tsx` — remove `data-csp-nonce` attribute on `<html>`, nonce meta tags, and `document.createElement` override script (all defeated CSP nonce security)
  - `__tests__/cleanupExpired.test.js` — fix `JSON.parse(res.body)` → `await res.json()` (body is a ReadableStream)
  - `__tests__/getSecret.test.js` — fix non-UUID test key; add missing env var setup; expand test coverage (400, 404, 405 cases)
  - `__tests__/createSecret.test.js` — add missing `NETLIFY_DATABASE_URL` env setup; add negative/edge-case tests (400 missing, 400 empty, 400 too-long, 415, 405)
  - `app/secret/[key]/page.tsx` — clear `loading` state when key is falsy; replace `.then(r => {})` no-op with `.catch(console.error)`
  - `site/_headers` — remove CSS block-comment wrapper so Netlify actually applies security headers
  - `_lib/rateLimit.js` — export `getClientIp` so callers don't duplicate the logic
  - `createSecret.js` — use exported `getClientIp`; use `normalizeExpiryDays` from `_lib/validate.js`; add `normalizeExpiryDays` import
  - `package.json` — move `jest`, `@types/jest`, `dotenv`, `@babel/preset-env`, `jest-mock-extended` from `dependencies` to `devDependencies`
  - `.env` — update placeholder `test-key` to a valid 64-char hex value; add missing `NETLIFY_DATABASE_URL` for local/test use
- risk: medium — `getSecret.js` change alters SQL query semantics (one atomic UPDATE vs SELECT+UPDATE). The one-time guarantee is strengthened, not weakened. All other changes are additive or corrective.
- breaking_change: false
- notes:
  - Issue #5 (server-side encryption contradicts zero-knowledge docs) is intentionally deferred — requires explicit human approval per governance policy.
  - Issues #15 and #16 (DDL-as-migration and rate_limits index) are intentionally deferred as separate database migration work.

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

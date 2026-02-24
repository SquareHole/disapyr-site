# CHANGE_TRACKER

## 2026-02-24 — feat/professional-theme
- date: 2026-02-24
- branch: feat/professional-theme
- commit: 1d68aec
- summary: Replace psychedelic colour scheme with a clean professional light/dark theme. Pure CSS change — no functional, API, security, or schema changes.
- scope:
  - `site/app/globals.css` — remove animated multi-layer body background (radial/conic-gradient + drift animation); add `--background` override for light mode; body now uses solid `var(--background)`.
  - `site/app/page.module.css` — replace blue→purple gradient text fills with solid `var(--primary)`; replace gradient buttons/chips/toast/copyButton with solid `var(--primary-600/700)`; replace purple focus rings with blue `var(--ring)`.
  - `site/app/components/Layout.module.css` — replace blue→purple nav-link underline gradient with solid `var(--primary)`; replace gradient page title text with solid `var(--primary)`.
  - `site/app/about/page.module.css` — replace gradient title text with solid `var(--primary)`; replace gradient step-number badge with solid `var(--primary-600)`.
  - `site/app/secret/[key]/page.module.css` — replace gradient title text with solid `var(--primary)`; replace gradient buttons with solid `var(--primary-600/700)`.
- risk: low — CSS-only changes; no behaviour, logic, or security changes.
- breaking_change: false

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

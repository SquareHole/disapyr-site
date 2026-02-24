# Code Review — disapyr.link (review-46)

**Date:** 2026-02-24  
**Branch:** `feat/env-assertion-ci-tests`  
**Reviewer:** GitHub Copilot  
**Scope:** Full codebase review — security, correctness, improvements

---

## Executive Summary

The overall architecture is sound for a one-time secret sharing service. The crypto primitives (AES-256-GCM + scrypt) are correct and well-implemented. However, there are **three critical bugs** that break stated guarantees, **one serious security vulnerability** in the CSP implementation, and **one fundamental architectural gap** between the documented security model and the actual implementation. Several other medium-priority issues follow.

---

## 🔴 Critical — Must Fix

### 1. `cleanupExpired.js` — `assertEnv` called but never imported

**File:** `site/netlify/functions/cleanupExpired.js`, line 13  
**Impact:** The scheduled cleanup function throws `ReferenceError: assertEnv is not defined` on every invocation. Expired secrets are **never cleaned up**.

```js
// Line 1 — only import present:
import { neon } from '@netlify/neon';

// Line 13 — called but not imported:
assertEnv();
```

**Fix:** Add the import.
```js
import { assertEnv } from './_lib/assertEnv';
```

---

### 2. `getSecret.js` — TOCTOU race condition breaks one-time guarantee

**File:** `site/netlify/functions/getSecret.js`, lines 55–95  
**Impact:** Two concurrent requests with the same key can both pass the `retrieved_at IS NULL` check before either UPDATE runs, resulting in the secret being delivered **twice**. This directly violates the core one-time-read guarantee.

```js
// SELECT and UPDATE are separate, non-atomic operations
const [secret] = await sql`
  SELECT ... WHERE key = ${key} AND retrieved_at IS NULL ...
`;
// <-- window exists here for a second request to race through

await sql`
  UPDATE secrets SET retrieved_at = ..., secret = NULL WHERE key = ${key}
`;
```

**Fix:** Combine into a single atomic `UPDATE ... RETURNING` statement:
```js
const [secret] = await sql`
  UPDATE secrets
  SET retrieved_at = ${now.toISOString()}, secret = NULL
  WHERE key = ${key}
    AND retrieved_at IS NULL
    AND secret IS NOT NULL
    AND (expires_at IS NULL OR expires_at > ${now.toISOString()})
  RETURNING key, secret, expires_at, retrieved_at
`;
if (!secret) {
  return new Response(JSON.stringify({ error: 'Secret not found or already retrieved' }), {
    status: 404, headers: { 'Content-Type': 'application/json' }
  });
}
// Decrypt secret.secret — no separate expiry check needed, handled in WHERE
```

---

### 3. `middleware.ts` — CSP is computed but never applied

**File:** `site/middleware.ts`, lines 16–44  
**Impact:** The Content Security Policy string is constructed but the result of the ternary expression is immediately discarded — it is never assigned to a variable, and no `Content-Security-Policy` header is set on any response. **The entire CSP is silently dropped.**

```ts
// This expression result is discarded — no assignment, no header set:
(
    isPreview
        ? `default-src 'self'; ...`
        : `default-src 'self'; ...`
).replace(/\s{2,}/g, ' ').trim();

// Then the middleware just passes through with no CSP:
const response = NextResponse.next({ ... });
// response.headers.set('Content-Security-Policy', ???) — never called
return response;
```

**Fix:** Assign the CSP string and set the header:
```ts
const cspValue = (isPreview ? `...` : `...`).replace(/\s{2,}/g, ' ').trim();
response.headers.set('Content-Security-Policy', cspValue);
```

---

## 🟠 High — Security Concern

### 4. `layout.tsx` — Nonce exposed in DOM undermines CSP

**File:** `site/app/layout.tsx`, lines 22–52  
**Impact:** Even once CSP is fixed (issue #3), the implementation actively weakens it in three ways:

1. **`data-csp-nonce` attribute on `<html>`** — nonce readable by any script including injected ones.
2. **`<meta name="csp-nonce">` and `<meta name="next-head-nonce">`** — same problem.
3. **`document.createElement` monkey-patch** — auto-applies the nonce to *any* dynamically created `<script>` element, regardless of origin. This means attacker-injected scripts (`document.createElement('script')`) automatically receive a valid nonce and bypass CSP entirely. This is a well-known anti-pattern.

```ts
// Exposes nonce in DOM:
<html lang="en" data-csp-nonce={nonce}>
{nonce && <meta name="csp-nonce" content={nonce} />}

// Auto-nonces all dynamic scripts — defeats the purpose of nonces:
document.createElement = function(tagName) {
  const element = originalCreateElement.call(this, tagName);
  if (tagName.toLowerCase() === 'script') {
    element.nonce = "${nonce}"; // attacker scripts get this too
  }
  return element;
};
```

**Fix:** Remove the `data-csp-nonce` attribute, the nonce meta tags, and the `document.createElement` override entirely. Next.js propagates nonces correctly via `<Script nonce={nonce}>` without these workarounds. Also remove `response.headers.set('x-nonce', nonce)` from middleware (exposes nonce in HTTP headers).

---

### 5. Architectural gap — Server sees plaintext secrets

**Files:** `site/app/page.tsx`, `site/netlify/functions/createSecret.js`  
**Impact:** The stated security model ("The server never sees plaintext secrets") is **not implemented**. The secret is transmitted as plaintext in the POST body to the Netlify function, where it is encrypted server-side. The server demonstrably has access to plaintext on every create operation.

Client-side encryption (e.g., using Web Crypto API with a user-held key appended to the share URL fragment `#key`) would satisfy the documented zero-knowledge guarantee. Without it, the service relies entirely on transport security and server trust.

This is a **known design decision** for many "simple" secret sharing services, but it contradicts the stated security model in the README and should either be corrected in the documentation or implemented in the code.

---

## 🟡 Medium — Bugs and Reliability

### 6. `cleanupExpired.test.js` — `res.body` is a ReadableStream, not a string

**File:** `site/netlify/functions/__tests__/cleanupExpired.test.js`, lines 19, 27  
**Impact:** The test calls `JSON.parse(res.body)` but `Response.body` is a `ReadableStream`. Both assertions pass vacuously because `JSON.parse(ReadableStream)` produces `null` or throws, meaning the content assertions never validate correctly.

```js
const body = JSON.parse(res.body); // Wrong — body is a ReadableStream
```

**Fix:**
```js
const body = await res.json(); // Correct
```

---

### 7. `getSecret.test.js` — Test key fails UUID validation, test is broken

**File:** `site/netlify/functions/__tests__/getSecret.test.js`, line 41  
**Impact:** The test URL uses `key=test-key`, which fails the UUID v4 regex in `getSecret.js`. The function returns `400` before touching the mocked SQL, so the test expecting `200` would fail (or pass vacuously if `assertEnv` throws first due to missing env vars in this test file).

```js
url: 'http://localhost/.netlify/functions/getSecret?key=test-key', // Not a UUID
```

**Fix:** Use a valid UUID v4 in the test, e.g.:
```js
url: 'http://localhost/.netlify/functions/getSecret?key=550e8400-e29b-41d4-a716-446655440000',
```
Also: the test file does not set `NETLIFY_ENCRYPTION_KEY` or `NETLIFY_DATABASE_URL`, unlike `createSecret.test.js`. `assertEnv()` will throw without them.

---

### 8. `secret/[key]/page.tsx` — `loading` never cleared on missing key

**File:** `site/app/secret/[key]/page.tsx`, lines 23–54  
**Impact:** If `key` is falsy, `useEffect` returns early without calling `setLoading(false)`. The page displays a spinner indefinitely.

```js
useEffect(() => {
  if (!key) return; // setLoading(false) never called
  ...
}, [key]);
```

**Fix:**
```js
if (!key) {
  setLoading(false);
  setError('Invalid secret link.');
  return;
}
```

---

### 9. `_headers` file is entirely commented out

**File:** `site/_headers`  
**Impact:** All security headers in this file are inside a `/* ... */` CSS-style comment block. Netlify's `_headers` format does not support block comments — the file is effectively empty. The headers `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` are never applied to responses.

`next.config.ts` only sets `X-Frame-Options: DENY` on Next.js-served routes, not on Netlify function responses.

**Fix:** Either remove the comment wrapper and apply the headers properly, or move them into `netlify.toml` using `[[headers]]` directives.

---

### 10. Schedule conflict between `netlify.toml` and `cleanupExpired.js`

**Files:** `site/netlify.toml` line 20, `site/netlify/functions/cleanupExpired.js` line 55  
**Impact:** `netlify.toml` schedules the function hourly (`0 * * * *`) while the in-function config says `@daily`. The Netlify docs state that `netlify.toml` takes precedence, but the conflict is confusing and may lead to unexpected scheduling behaviour across deploys.

**Fix:** Remove `export const config = { schedule: '@daily' }` from the function file and rely solely on `netlify.toml`.

---

## 🔵 Low — Improvements and Code Quality

### 11. `createSecret.js` — Redundant encryption key check after `assertEnv()`

**File:** `site/netlify/functions/createSecret.js`, lines 58–65  
`assertEnv()` already validates that `NETLIFY_ENCRYPTION_KEY` is a 64-char hex string. The subsequent manual check (lines 58–65) is dead code.

---

### 12. `createSecret.js` — IP extraction duplicated from `rateLimit.js`

**File:** `site/netlify/functions/createSecret.js`, lines 77–84  
The `getClientIp` logic is copied from `rateLimit.js` instead of reusing it. Extract `getClientIp` from `rateLimit.js` and export it, or move it to `_lib/`.

---

### 13. `createSecret.js` — `parseInt` called without radix

**File:** `site/netlify/functions/createSecret.js`, line 55  
```js
const validExpiryDays = expiryDays ? Math.min(Math.max(parseInt(expiryDays), 1), 365) : 21;
```
Should use `parseInt(expiryDays, 10)`. More importantly, `normalizeExpiryDays` from `_lib/validate.js` already handles this correctly — use it instead.

---

### 14. `getSecret.js` — UUID regex duplicated from `_lib/validate.js`

**File:** `site/netlify/functions/getSecret.js`, line 33  
The UUID regex is defined inline rather than importing `isUuidV4` from `_lib/validate.js`. The inline version also accepts UUID versions 1–5 (`[1-5]`), not just v4. Use the shared utility.

---

### 15. `rateLimit.js` — `CREATE TABLE IF NOT EXISTS` on every request

**File:** `site/netlify/functions/_lib/rateLimit.js`, lines 43–49  
Running a DDL statement on every request adds latency and table lock overhead. This should be a one-time database migration, not inline logic.

---

### 16. `rateLimit.js` — No index on `rate_limits` table

**File:** `site/netlify/functions/_lib/rateLimit.js`  
The SELECT and DELETE on `rate_limits` scan the full table (no index). Under concurrent load, performance degrades. Add a composite index:
```sql
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_key_ts ON rate_limits (ip, key, ts);
```

---

### 17. `package.json` — Test/dev dependencies in `dependencies`

**File:** `site/package.json`  
`jest`, `@types/jest`, `dotenv`, `@babel/preset-env`, `jest-mock-extended` belong in `devDependencies`. Keeping them in `dependencies` causes them to be installed in production deploys, increasing bundle/install size unnecessarily.

---

### 18. `secret/[key]/page.tsx` — `fetchSecret().then(r => {})` anti-pattern

**File:** `site/app/secret/[key]/page.tsx`, line 53  
```js
fetchSecret().then(r => {});
```
The `.then(r => {})` is a no-op. Unhandled promise rejections should be caught. Use `fetchSecret().catch(console.error)` or remove `.then(r => {})`.

---

### 19. `createSecret.js` — Test only covers happy path

**File:** `site/netlify/functions/__tests__/createSecret.test.js`  
Only one test covers the 201 case. Missing coverage for: missing secret (400), secret too long (400), invalid content-type (415), and 429 behaviour.

---

## Summary Table

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | 🔴 Critical | `cleanupExpired.js` | `assertEnv` not imported — cleanup never runs |
| 2 | 🔴 Critical | `getSecret.js` | TOCTOU race — secret can be retrieved twice |
| 3 | 🔴 Critical | `middleware.ts` | CSP string built but never applied |
| 4 | 🟠 High | `layout.tsx` | Nonce DOM exposure + createElement override defeats CSP |
| 5 | 🟠 High | Architecture | Server sees plaintext — contradicts stated zero-knowledge model |
| 6 | 🟡 Medium | `cleanupExpired.test.js` | `res.body` ReadableStream — assertions never validate |
| 7 | 🟡 Medium | `getSecret.test.js` | Non-UUID test key + missing env setup — test broken |
| 8 | 🟡 Medium | `secret/[key]/page.tsx` | `loading` never cleared on missing key |
| 9 | 🟡 Medium | `_headers` | All security headers commented out |
| 10 | 🟡 Medium | `netlify.toml` / `cleanupExpired.js` | Schedule conflict |
| 11 | 🔵 Low | `createSecret.js` | Redundant env key check after assertEnv |
| 12 | 🔵 Low | `createSecret.js` | IP extraction duplicated from rateLimit.js |
| 13 | 🔵 Low | `createSecret.js` | `parseInt` without radix; `normalizeExpiryDays` not used |
| 14 | 🔵 Low | `getSecret.js` | UUID regex duplicated; accepts v1-v5 not just v4 |
| 15 | 🔵 Low | `rateLimit.js` | DDL on every request — should be migration |
| 16 | 🔵 Low | `rateLimit.js` | No index on `rate_limits` — full table scans |
| 17 | 🔵 Low | `package.json` | Dev/test deps in `dependencies` |
| 18 | 🔵 Low | `secret/[key]/page.tsx` | `.then(r => {})` no-op anti-pattern |
| 19 | 🔵 Low | `createSecret.test.js` | Happy-path only; missing negative/edge cases |

---

*Highest priority before merge: fix items 1, 2, 3 — they represent broken functionality and missing security controls.*

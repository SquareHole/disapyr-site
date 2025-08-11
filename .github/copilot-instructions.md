# Copilot Instructions for disapyr.link

## Project Overview
- **disapyr.link** is a secure, one-time text sharing service built with Next.js (App Router), Netlify Functions, and Neon Postgres.
- The core value: secrets are encrypted client-side, stored encrypted, and deleted after a single retrieval or expiration.
- The codebase is split between a Next.js frontend (`site/app/`) and serverless backend (`site/netlify/functions/`).

## Architecture & Data Flow
- **Frontend**: Next.js 15+ (TypeScript, CSS Modules). Main entry: `site/app/page.tsx`, layout in `site/app/layout.tsx`.
- **API**: Netlify Functions in `site/netlify/functions/`:
  - `createSecret.js`: Encrypts and stores a secret, returns a UUID key.
  - `getSecret.js`: Retrieves and decrypts a secret, then soft-deletes (sets content to NULL, marks as retrieved).
  - `cleanupExpired.js`: Scheduled function to delete expired or old secrets.
- **Database**: Neon Postgres, table `secrets` (see schema in root `README.md`).
- **Security**: AES-256-GCM encryption, scrypt key derivation, zero-knowledge (server never sees plaintext).

## Developer Workflows
- **Local dev**: `cd site && npm install && npm run dev` (Next.js + Netlify Functions via Next.js API routes)
- **Testing**: Jest config in `site/jest.config.js`. Test files in `site/netlify/functions/__tests__/`.
- **Environment**: Set `NETLIFY_ENCRYPTION_KEY` and `NETLIFY_DATABASE_URL` in `site/.env.local` for local dev.
- **Deploy**: Netlify auto-deploys on push. Functions are available at `/.netlify/functions/`.
- **Database**: Schema migrations are manual; see `README.md` for the canonical schema.

## Project-Specific Patterns
- **Secrets Table**: Use `key` (UUID) for lookups, not `id`. Some code assumes `id` exists, but only `key` is required for core flows.
- **Soft Delete**: Retrieval sets `secret` to NULL and marks `retrieved_at`.
- **Scheduled Cleanup**: Use `RETURNING 1` in SQL for deletes to avoid schema mismatches.
- **Rate Limiting**: All functions use per-IP rate limiting via `site/netlify/functions/_lib/rateLimit.js`.
- **Styling**: CSS Modules with custom properties for dark/light themes. See `globals.css` for theme tokens.
- **Security Headers**: Managed via `public/_headers` and Next.js middleware.

## Integration Points
- **Netlify Functions**: All backend logic is in `site/netlify/functions/`. No traditional API server.
- **Neon Postgres**: Connection via `@netlify/neon` using env var `NETLIFY_DATABASE_URL`.
- **Encryption**: Uses Node.js crypto, not a third-party library.
- **Frontend/Backend contract**: API documented in root `README.md` (see POST/GET examples).

## Conventions & Gotchas
- **Do not assume `id` exists in all environments**; always prefer `key` for lookups.
- **All secrets are one-time view**: retrieval is destructive.
- **No user accounts**: all access is anonymous, tracked by key only.
- **Environment variables are required** for all builds (see `.env.local` example in README).
- **Scheduled cleanup**: If you change the schema, update `cleanupExpired.js` accordingly.
- **Security is paramount**: Never log or expose plaintext secrets.

## Key Files & Directories
- `site/app/` — Next.js frontend (pages, layout, styles)
- `site/netlify/functions/` — Netlify Functions (API logic)
- `site/netlify/functions/_lib/rateLimit.js` — Rate limiting logic
- `site/app/globals.css` — Theme tokens and global styles
- `README.md` — Architecture, schema, and API docs

---
For more, see the root and `site/README.md`. If in doubt, prefer explicit, secure, and minimal approaches.

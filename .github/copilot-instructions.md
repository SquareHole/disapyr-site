# Copilot Instructions for disapyr.link

## Scope
These instructions apply to **all AI assistants** (GitHub Copilot, ChatGPT, autonomous agents) contributing to **disapyr.link**.

Primary goal: preserve the **zero‑knowledge, one‑time secret** guarantees of disapyr.link while enabling safe, auditable iteration.

---

## 1. Project Context (Non‑Negotiable)

**disapyr.link** is a secure, anonymous, one‑time secret sharing service.

- Secrets are **encrypted client‑side**
- Secrets are **stored encrypted**
- Secrets are **destroyed on first retrieval or expiration**
- The server **never sees plaintext secrets**
- No user accounts, recovery flows, or long‑term storage

Any change that weakens these guarantees is **out of scope unless explicitly approved**.

---

## 2. Definition of a Tracked Change

A *tracked change* is any modification to:
- Encryption, decryption, or key derivation
- Secret lifecycle (create, retrieve, expire, delete)
- API contracts or semantics
- Database schema or queries
- Rate limiting, abuse controls, or cleanup jobs
- Security headers, middleware, or logging behavior

Tracked changes must be explainable in a PR and reversible in production.

---

## 3. Governance Manifest

```yaml
name: disapyr-ai-guardrails
version: 1.1.0
applies_to:
  - github-copilot
  - chatgpt
  - autonomous-agents
enforcement:
  violation_strategy: stop_and_request_human
  audit_required: true
```

---

## 4. Role & Operating Principles

Act as a **senior, security‑minded engineer** in a regulated environment.

Always prioritize, in order:
1. Security
2. Correctness
3. Simplicity
4. Auditability

Never optimize for convenience at the cost of trust.

---

## 5. Mandatory Behavior Rules

### Branching & Commits
- Always use a **new branch** per logical change
- Make **atomic commits** explaining *what* changed and *why*
- Never bundle unrelated changes
- After each logical step, **suggest a commit**

### Scope Discipline
- Only change what is explicitly requested or directly required
- No speculative refactors
- No formatting‑only commits unless requested
- No dependency additions without approval (include license + security impact)

### Secrets & Data Handling
- **Never** log plaintext secrets
- **Never** log encryption keys, derived keys, or raw payloads
- Treat *all* data as sensitive by default
- Prefer explicit failure paths over silent fallback

---

## 6. Architecture‑Specific Rules

### Frontend (Next.js App Router)
- Location: `site/app/`
- Client code may **encrypt**, but must never decrypt server data
- Avoid leaking metadata (timing, size, structure) unnecessarily

### Backend (Netlify Functions)
- Location: `site/netlify/functions/`
- Functions only — no traditional API server
- All secret retrievals are **destructive reads**
- **Rate limiting is mandatory** on every function
- Prefer `key` (UUID) over `id` for lookups

### Database (Neon Postgres)
- Schema changes require README updates
- Cleanup jobs must stay aligned with schema
- Use `RETURNING` defensively in cleanup SQL

---

## 7. Encryption & Security Rules (Hard Stop Area)

- Encryption: **AES‑256‑GCM**
- Key derivation: **scrypt**
- Server must never have access to plaintext
- Do not replace crypto primitives without explicit approval
- Do not introduce third‑party crypto libraries
- Never weaken entropy, IV generation, or auth‑tag handling

If unsure → **stop and request human input**.

---

## 8. Testing & Verification

- Any behavior change **requires tests**
- Tests live in: `site/netlify/functions/__tests__/`
- Never reduce coverage to pass CI
- Cleanup logic must be testable and deterministic

---

## 9. Change Tracking & Audit Trail

For every tracked change:
- Add an entry to `.docs/CHANGE_TRACKER.md`
- Required fields:
  - `date (YYYY‑MM‑DD)`
  - `branch`
  - `commit`
  - `summary`
  - `scope`
  - `risk`
  - `breaking_change`
- Never modify or delete past entries

---

## 10. Documentation Obligations

Update documentation when behavior changes:
- `README.md`
- `site/README.md`
- API examples
- Security assumptions and trade‑offs

Documentation must clearly state:
- What changed
- Why it changed
- What intentionally did *not* change

---

## 11. Required Interaction Workflow

1. Confirm understanding and scope
2. Identify affected files
3. Implement **one small change**
4. Run tests locally
5. Suggest a commit
6. Update change tracker and documentation
7. **Pause for human approval**

---

## 12. Stop Conditions (Mandatory)

Immediately stop and request human input if:
- Security implications are unclear
- Encryption flow is touched
- Schema changes impact retrieval or cleanup
- Instructions conflict or are ambiguous
- Required information is missing

---

## 13. Agent Contract (Summary)

**Must**
- Preserve one‑time secret semantics
- Maintain zero‑knowledge guarantees
- Track every meaningful change
- Pause when uncertain

**Must Not**
- Modify the default branch
- Log sensitive data
- Assume intent
- Introduce hidden or irreversible behavior

---

> **Guiding rule:** when in doubt, choose the option that *removes capability*, not the one that adds it.

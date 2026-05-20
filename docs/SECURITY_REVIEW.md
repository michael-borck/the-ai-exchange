# Security & Code Review — The AI Exchange

**Date:** 2026-05-20
**Reviewer:** Claude Code (assisted) — not a substitute for a paid pen-test.
**Trigger:** Hosting outside Curtin's network requires the app to defend itself rather than rely on network perimeter.

This is a living checklist. Tick items as PRs land. The three branches map to the three sections below.

---

## Branch 1 — `security/lockdown-browse` (CRITICAL, ship first)

Goal: stop anonymous browsing of Curtin IP; close the PII leak; cover writes with rate limits.

### Backend

- [x] `backend/app/api/resources.py` — auth + LIMIT_READ on `GET /resources`, `/{id}`, `/{id}/solutions`; LIMIT_WRITE on POST/PATCH/DELETE
- [x] `backend/app/api/comments.py` — auth + LIMIT_READ on `GET /resources/{id}/comments`; LIMIT_WRITE on writes; **auth-gated `POST /comments/{id}/helpful`** (was open)
- [x] `backend/app/api/collections.py` — auth + LIMIT_READ on all GETs; LIMIT_WRITE on writes; **auth-gated `POST /collections/{id}/subscribe`** (was open)
- [x] `backend/app/api/analytics.py` — auth + LIMIT_READ on `/analytics`; auth + LIMIT_WRITE on `/view`, `/tried`, `/save`
- [x] **`backend/app/api/analytics.py` `users-tried-it` PII LEAK fixed**: gated, and **`email` removed from `UserTriedInfo` model entirely** (`backend/app/models.py:998`) so it can never leak again. Also dropped `email` from `users/me/saved-resources` and `users/me/tried-resources` responses.
- [x] `backend/app/api/prompts.py` — auth + rate limits; also fixed the misleading `Optional[User]` typing that was already 401-ing
- [x] `backend/app/api/subscriptions.py` — rate limits on all routes

**Deviation from plan:** `POST /resources/{id}/view` is now auth-gated (not unauthenticated as originally suggested). Since browsing requires auth, only logged-in users can reach the page that fires the view tracker — adding auth is consistent and removes one anonymous endpoint.

### Frontend

- [x] `frontend/src/App.tsx` — `/resources`, `/resources/:id`, `/resources/:id/edit` all wrapped in `<ProtectedRoute>`
- [x] `frontend/src/pages/HomePage.tsx` — split into `AnonLanding` (marketing hero, "what's inside", "how it works", register/login CTAs — no Curtin IP exposed) and `AuthedHome` (existing discovery dashboard). `useResources` is only mounted inside `AuthedHome` so anon visitors never call the gated API.

### Verify

- [x] `pytest backend/tests/` — 67 passed
- [ ] Manually: visit `/resources` while logged out → should redirect to `/login`
- [ ] Manually: `curl http://localhost:8000/api/v1/resources` → 401
- [ ] Manually: `curl http://localhost:8000/api/v1/resources/<id>/users-tried-it` → 401; after login, response has `id`, `full_name`, `tried_at` only (no `email`)
- [ ] Manually: visit `/` while logged out → marketing landing page, no resource cards visible

---

## Branch 2 — `security/fixes` (HIGH, ship next)

- [x] `auth.py` login: collapsed inactive/unverified/pending-approval and wrong-password into one generic `401 "Invalid email or password"`. Also added constant-time password verify against a dummy hash so the no-user path doesn't leak via response time.
- [x] `auth.py` lockout: now keyed by (email, ip) so an attacker can't lock a victim out from a different IP. Falls back to email-only if no client IP is available (safety net for misconfigured proxies).
- [x] `_revoke_all_user_tokens` is now real: added `User.tokens_revoked_at` column (handled by the new `services/migrations.py` startup helper so SQLite gets the ALTER TABLE for free), added `iat` claim to access/refresh tokens, and `get_current_user` rejects tokens whose `iat` predates the user's revocation timestamp. Password reset bumps it.
- [x] XFF trust: new `TRUSTED_PROXIES` setting (list of IPs/CIDRs). `_get_client_ip` only honors `X-Forwarded-For` when the immediate TCP peer is in that list. Empty default = ignore XFF entirely. Documented for the Docker-behind-Caddy case.
- [x] Frontend `api.ts` `unsubscribe` now calls `DELETE /subscriptions/unsubscribe/{tag}` matching the backend.
- [x] Fixed `admin.py:548` typo (`reviewed_at = select(...)` → `datetime.now(UTC)`).
- [x] `prompts.py` Optional[User] typing — already fixed during branch 1.
- [x] Email PII scrubbed from log statements in `auth.py`; reset/verification flows now log `user_id=%s` only. (`password_reset.py` had no email logging.)
- [x] All GitHub Actions in `docker-publish.yml` SHA-pinned with tag comments. Added `github-actions` ecosystem to Dependabot so SHA bumps land automatically.
- [x] Added `audit-frontend-deps` job (runs `npm audit --omit=dev --audit-level=high`) as a gate before the image build, so a known-bad transitive blocks the release.

**Tests:** 70/70 passing. Added explicit coverage for token revocation (both the model-level mechanism and the password-reset end-to-end flow) and the (email, ip) lockout boundary.

**Migration note:** the `tokens_revoked_at` column is added at startup via `services/migrations.py`. Idempotent (no-op if the column already exists). Same approach can be used for future column additions until we adopt Alembic.

---

## Branch 3 — `chore/cleanup` (DONE)

- [x] Delete `backend/=6.0.0` (pip output captured as filename — leftover from `pip install bleach >=6.0.0` with a stray space); also added `=*` to `.gitignore` to prevent recurrence
- [x] Moved `test_email.py` from repo root to `backend/scripts/test_email.py` (alongside existing `manage_users.py` and `load_mock_data.py`).
- [x] `FEEDBACK_RECIPIENT` now lives in `settings.feedback_recipient` (env var `FEEDBACK_RECIPIENT`, defaults to current address); documented in `.env.example`.
- [x] Dropped `theaiexchange.serveur.au` from `allowed_hosts` and `.env.example` — `eduserver.au` confirmed as the live host.
- [x] Dockerfile `appuser` pinned to UID/GID **999** (matching the system-assigned UID already in use on the VPS, so no host re-chown is needed at deploy time). Future image rebuilds will keep the same UID.
- [x] `.github/workflows/docker-publish.yml` now triggers on `push: tags: ['v*']` only. Push to main no longer auto-deploys. New flow: `git push` for code, `git tag v0.3.7 && git push --tags` for release.

### Deferred (not 5-minute cleanup — opening as future work)

- **In-app "Contact author" replacing `mailto:` links** — 7 `mailto:` references remain in `frontend/src/pages/{SupportPage,LegalPage,ResourceDetailPage}.tsx`. The Support/Legal ones are admin contact addresses (low risk, already public). The 3 in `ResourceDetailPage.tsx` expose non-anonymous author emails. Replacing these needs a backend `POST /resources/{id}/contact-author` endpoint, a contact form modal, rate limiting on outbound messages, and (probably) a per-user "allow contact" toggle. That's a feature, not a cleanup. Author still controls exposure today via the existing `is_anonymous` flag on each resource.
- **SQLCipher for at-rest DB encryption** — one-line config in code, but the prod migration is non-trivial: open the existing plaintext DB, attach an encrypted one, copy schema + data, swap files atomically. Worth doing if the threat model includes "attacker reads the SQLite file off the host disk." For an internal Curtin tool already gated behind auth + non-root container + host filesystem perms, the marginal gain is small. Revisit when scope grows.
- **Alembic migrations** — the `services/migrations.py` startup helper covers SQLite `ADD COLUMN` cleanly and we're nowhere near hitting its limits (renames, drops, multi-DB targets, data backfills). Adopt Alembic before any Postgres cutover.

---

## Out of scope (noted for awareness)

- CSP `'unsafe-inline'` for style-src — required by Chakra UI runtime; accept.
- `X-XSS-Protection: 0` — correct, modern browsers ignore it.
- CSRF tokens — `samesite=lax` cookies cover the common case; add double-submit tokens only if threat model warrants.
- TanStack React Query 5.90.10 — no confirmed compromise; lockfile committed; Dependabot weekly. Standard practice is sufficient.
- SQLite without migrations — fine for current MVP, revisit before Postgres cutover.

---

## Email encryption — answered

You asked if user emails could be stored encrypted. Short answer: **not worth it** for password-based login.

To support `WHERE email = ?` you'd need deterministic encryption (same plaintext → same ciphertext), which lets an attacker who reads the DB build a rainbow table of email ciphertexts trivially (emails are low-entropy). What actually helps:

1. **SQLCipher** for full DB-at-rest encryption (Branch 3).
2. **Stop showing emails on cards** — already done for anon users in `ResourceCard`; extend to API responses (Branch 1 items above).
3. **In-app messaging instead of `mailto:`** so contact details never need to be returned to the client (Branch 3).
4. **Don't log emails** (Branch 2).

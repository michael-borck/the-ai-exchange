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

- [ ] `auth.py` login: collapse "inactive / unverified / pending approval" into one generic "Invalid email or password" to stop email enumeration
- [ ] `auth.py:70` lockout: combine email + IP so an attacker can't lock out a specific user by guessing their email
- [ ] `auth.py:126-136` `_revoke_all_user_tokens` is a no-op — add `tokens_revoked_at: datetime` to `User`, set it on password reset, reject older tokens in `get_current_user`
- [ ] `auth.py:60-67` XFF trust — only honor `X-Forwarded-For` when `request.client.host` is in a configured trusted-proxy set (env var: `TRUSTED_PROXIES`)
- [ ] `frontend/src/lib/api.ts:184` — `unsubscribe` calls `POST /subscriptions/unsubscribe` with body but backend has `DELETE /unsubscribe/{tag}`. Fix the frontend.
- [ ] `backend/app/api/admin.py:548` (or `config_requests.py`) — `user_request.reviewed_at = select(UserConfigRequest)` is a typo, should be `datetime.now(UTC)`
- [ ] `backend/app/api/prompts.py:29,71` — `Optional[User] = Depends(get_current_user)` doesn't actually work (get_current_user raises 401). Add a `get_optional_user` dependency or make these endpoints required-auth
- [ ] Reduce email PII in logs: `password_reset.py`, `auth.py` log `user.email` directly — log `user.id` instead
- [ ] SHA-pin GitHub Actions in `.github/workflows/docker-publish.yml` (`actions/checkout@v4` → `actions/checkout@<sha> # v4`)
- [ ] Run `cd frontend && npm audit --omit=dev` and add it as a release-script gate

---

## Branch 3 — `chore/cleanup` (LOW, ship when convenient)

- [x] Delete `backend/=6.0.0` (pip output captured as filename — leftover from `pip install bleach >=6.0.0` with a stray space); also added `=*` to `.gitignore` to prevent recurrence
- [ ] Delete or move `test_email.py` from repo root into `backend/scripts/`
- [ ] `backend/app/api/feedback.py:20` — move hardcoded `FEEDBACK_RECIPIENT` to settings
- [ ] `backend/app/core/config.py:91-92` — drop stale host (`theaiexchange.serveur.au` OR `theaiexchange.eduserver.au`, whichever migration is complete)
- [ ] Consider SQLCipher for encryption-at-rest of the SQLite DB (one-line config change)
- [ ] Replace `mailto:` contact links with in-app "Contact author" messaging so emails never leave the platform
- [ ] Move `SQLModel.metadata.create_all` to Alembic migrations before any Postgres migration

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

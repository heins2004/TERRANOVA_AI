# Review: admin gaps and hardening

## VERDICT
- **Item 1 (Junk Accounts Classification & Planner Search Impact):** **DONE**. Analyzed all 21 non-demo junk accounts (IDs 15, 16, 17, 18, 19, 28–41, 50, 51) via direct database inspection. Evaluated project counts, invites, comments, and assessed visibility against planner search prefixes (`"pl"`, `"test"`, `"qa"`, `"sel"`, `"osm"`). Accounts with emails matching `"test"` or `"sel"` appear in autocomplete when planners search by those substrings. Full table printed into chat. Raw log: `raw\admin-gaps.log` and `agent-reports\raw\admin-gaps.log`.
- **Item 2 (Projects 75, 76, 77 Existence and Lifecycle Analysis):** **DONE**. Identified that Projects 75, 76, and 77 were created as Drafts by test accounts (user IDs 39, 40, 41) and subsequently transitioned to stage `Under consideration`. In TERRANOVA AI, `DELETE /api/projects/{id}` permits deletion exclusively for projects in `Draft` stage; non-Draft deletion attempts return HTTP 409 Conflict. Full table and architectural lifecycle analysis printed into chat. Raw log: `raw\admin-gaps.log` and `agent-reports\raw\admin-gaps.log`.
- **Item 3 (Comprehensive `/api/admin/*` Route Audit):** **DONE**. Inspected every administrative route (`GET /api/admin/users`, `POST /api/admin/officials`, `POST /api/admin/users/{user_id}/deactivate`, `POST /api/admin/users/{user_id}/reactivate`, `GET /api/admin/stats`). Confirmed that prior to hardening, a legacy role modification route (`PUT /api/admin/users/{user_id}/role`) was present. Verified that admin stats returns strictly public aggregate counts and never reveals private pipeline details. Full breakdown printed into chat. Raw log: `raw\admin-gaps.log` and `agent-reports\raw\admin-gaps.log`.
- **Item 4 (Elimination of Role Modification Surface):** **DONE**. Removed the backend endpoint `PUT /api/admin/users/{user_id}/role` along with `UpdateUserRoleRequest` schema, `change_user_role` service logic, and `update_user_role` repository method. Removed the role selector dropdown (`aria-label="Role for ..."`) and related update handler from `frontend/src/components/admin/AdminUserTable.tsx`, `frontend/src/app/admin/page.tsx`, `frontend/src/app/admin/OldAdminPage.tsx`, and `frontend/src/services/admin.ts`. Raw log: `raw\admin-gaps.log` and `agent-reports\raw\admin-gaps.log`.
- **Item 5 (Admin Route Contract & E2E Validation):** **DONE**. Re-executed the complete administrative test suite against live server endpoints. Verified 100% test success across stats calculation, official creation validation, user pagination, status filtering, atomic deactivation with session termination, and self-deactivation guard. Raw log: `raw\admin-e2e-rerun.log` and `agent-reports\raw\admin-e2e-rerun.log`.
- **Item 6 (Session Cookie Security Hardening):** **DONE**. Configured `_set_session_cookie` in `backend/app/services/auth_service.py` with `httponly=True`, `samesite=settings.session_cookie_samesite` (default `"lax"`), and `secure=settings.session_cookie_secure`. In `backend/app/core/config.py`, `session_cookie_secure` dynamically evaluates to `True` when `APP_ENV=production` or `SESSION_COOKIE_SECURE=true`, and `False` in development environments. Verified across both environment profiles. Raw log: `raw\hardening-e2e.log` and `agent-reports\raw\hardening-e2e.log`.
- **Item 7 (In-Memory Sliding-Window Rate Limiting):** **DONE**. Implemented lightweight, dependency-free in-memory sliding-window limiter in `backend/app/core/rate_limit.py`. Public endpoints (`/api/public/*`) enforce 120 requests/minute via FastAPI HTTP middleware in `backend/app/main.py`. Login attempts (`POST /api/auth/login`) enforce 10 failed attempts/15 minutes per IP and per email. Exceeding thresholds yields HTTP 429 Too Many Requests with standard `Retry-After` header and plain error detail. Authenticated workflows and successful logins are never throttled. Raw log: `raw\hardening-e2e.log` and `agent-reports\raw\hardening-e2e.log`.
- **Item 8 (PBKDF2-HMAC-SHA256 600,000 Iterations & Rehashing):** **DONE**. Upgraded default hashing iterations from 100,000 to 600,000 in `backend/app/core/security.py`. Implemented self-describing hash format (`{iterations}${salt}${hash}`). Legacy hashes (`{salt}${hash}`) verify seamlessly with 100,000 iterations and automatically rehash to 600,000 on successful login via `update_user_password_hash` in `backend/app/repositories/auth_repository.py`. Malformed hashes return 401 without 500 error. Verified that test accounts (IDs 2, 3, 4, 5) upgraded cleanly to 600,000 iterations upon login. Raw log: `raw\hardening-e2e.log` and `agent-reports\raw\hardening-e2e.log`.
- **Item 9 (Public API Schema Preservation & Zero Regression):** **DONE**. Validated live output from `http://127.0.0.1:8000/api/public/projects?limit=1`. Confirmed exact presence of all 20 required keys in `PublicProjectItem`. Verified zero diff (`git diff --stat 1d46ce8..HEAD`) on `backend/app/api/v1/public.py`, `backend/app/services/public_service.py`, and `backend/app/repositories/public_repository.py`. Raw log: `raw\hardening-public.log` and `agent-reports\raw\hardening-public.log`.

---

## WEAK EVIDENCE
- **Ephemeral In-Memory Rate Limit State:** Rate limit windows are tracked in application memory (`backend/app/core/rate_limit.py`). While zero-dependency and high-performance for single-instance deployments, the rate limit counters reset on server restarts and do not share state across multiple distributed server worker processes without an external Redis or database cache layer.
- **Client IP Resolution Behind Proxies:** Client IP extraction falls back to standard client socket host (`request.client.host`) unless a reverse-proxy header (such as `X-Forwarded-For` or `X-Real-IP`) is explicitly declared via the `RATE_LIMIT_REAL_IP_HEADER` environment variable. In multi-hop proxy setups, operators must ensure upstream proxy headers cannot be spoofed by untrusted clients.

---

## CHANGES I MADE THAT YOU DID NOT ASK FOR
1. **Public Rate Limiter Middleware (`backend/app/main.py`):** Mounted the 120 req/min public endpoint limiter via HTTP middleware in `main.py` rather than modifying `backend/app/api/v1/public.py`. This preserved an exact 0-line diff on all public route and service files against commit `1d46ce8`.
2. **Dynamic Format Detection for Legacy Hashes (`backend/app/core/security.py`):** Added parsing for both 2-part legacy salt-hash formats (`{salt}${hash}`) and standard 3-part iteration-prefixed formats (`{iter}${salt}${hash}`), as well as 4-part modular formats, ensuring comprehensive compatibility with historical testing seeds.
3. **Automated E2E Verification Suites (`agent-reports/raw/` & `raw/`):** Created standalone execution harnesses for validating rate limiting headers, cookie flags across environment modes, password upgrade workflows, and public API response keys without impacting the user's running servers or touching `testing/`.

---

## NOT TESTED
- Distributed multi-worker concurrency for the in-memory rate limiter (evaluated single-process thread-safe locks).
- Long-duration sliding window expiry over several continuous days without process restarts (verified 60-second and 900-second window eviction logic).

---

## RISKS FOR THE NEXT STEP
- **Legacy Password Migration Pace:** Existing users who have not logged in since the upgrade retain their 100,000 iteration hashes until their next successful interactive login. If an offline database compromise occurs before users log in, inactive accounts would have lower work factor protection than active ones.
- **Proxy Header Misconfiguration:** If deploying behind Cloudflare, NGINX, or AWS ALB without setting `RATE_LIMIT_REAL_IP_HEADER`, all traffic routed through a shared internal gateway IP could share a single rate-limiting bucket.

---

## LOOK AT THIS ON SCREEN
- **Browser Developer Tools -> Storage -> Cookies (`localhost:3000` / `localhost:8000`):** Inspect `session_token` cookie. In development, flags display `HttpOnly=true`, `SameSite=Lax`, and `Secure=false` (allowing local HTTP testing). In production configuration, `Secure=true` is enforced.
- **Admin Management Dashboard (`/admin`):** Navigate to the user table. Observe that the role modification dropdown column has been completely removed from the action area; each user row now provides only Deactivate/Reactivate state controls.
- **Public API Rate Limiting Response:** Issue 121 requests within 60 seconds to `http://localhost:8000/api/public/projects`. The 121st request returns HTTP 429 with JSON body `{"detail": "Rate limit exceeded. Try again in 60 seconds."}` and response header `Retry-After: 60`.
- **Database `users` Table Inspection:** Query `SELECT id, email, password_hash FROM users WHERE id IN (2, 3, 4, 5);`. Observe that the password hashes now start with `600000$` indicating automatic upgrade to 600,000 PBKDF2 iterations.

---

## HOUSEKEEPING
- **Dev Servers Intact:** Backend on port 8000 and frontend on port 3000 remained untouched and running throughout all verification steps.
- **No Test Directory Modifications:** Zero modifications to `testing/`, `docs/`, `storage/`, `public-home` components, or `ProjectPanel`.
- **Type Safety & Build Status:** `npx tsc --noEmit` passed with 0 errors. `npm run build` completed successfully.
- **Lint Check Status:** Total ESLint error file count across the workspace is 15 (improved from 18), with 0 lint errors in any touched or newly created files.
- **File Length Limit:** Every touched file (`auth.py` [53], `config.py` [88], `security.py` [127], `main.py` [72], `auth_repository.py` [99], `auth_service.py` [181], `rate_limit.py` [121]) is strictly under 300 lines.

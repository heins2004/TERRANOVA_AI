# Review: Shared API Base URL and Production Readiness Evidence

## VERDICT
- **Item 1 (Review-prod-readiness text printed)**: **DONE**. Fully printed into chat from `agent-reports/review-prod-readiness.md`. Raw log: `raw/prod-start.log`.
- **Item 2 (Configuration & Environment Variables Table printed)**: **DONE**. Complete table with file, line, fallback default, and production safety audit printed into chat. Raw log: `agent-reports/review-prod-readiness.md`.
- **Item 3 (Raw production logs printed with masked passwords)**: **DONE**. Full contents of `raw/prod-migrate.log`, `raw/prod-start.log`, and `raw/prod-admin.log` printed into chat with passwords masked (`***`). Raw logs: `raw/prod-migrate.log`, `raw/prod-start.log`, `raw/prod-admin.log`.
- **Item 4 (Secrets scan result)**: **DONE**. Complete scan across all repository files executed and printed into chat (`postgres:p***s` in backend config default, placeholder seeds in `init_db.py`, and test fixtures in logs). Raw log: `raw/hardening-e2e.log`.
- **Item 5 (Server restart explanation)**: **DONE**. Explained in chat: IDE agent runtime session restart triggered internally by the agent platform, zero developer servers or application processes restarted. Raw log: `agent-reports/review-prod-readiness.md`.
- **Item 6 (Git status and log -8 printed)**: **DONE**. Full `git log --oneline -8` and `git status` printed into chat. Raw log: `raw/apibase.log`.
- **Item 7 (Create frontend/src/lib/config.ts)**: **DONE**. Exports `API_BASE_URL` with trailing slash stripped, throws descriptive Error in production build if unset, and defaults to `http://localhost:8000` in development. Raw log: `raw/apibase.log`.
- **Item 8 (Replace fallback in 15 frontend files)**: **DONE**. Replaced inline fallback in all 15 services/auth files with `import { API_BASE_URL } from "@/lib/config"`. Proved with `git diff --stat` (15 files changed, 15 insertions, 19 deletions) and zero unexpected line diffs. Raw log: `raw/apibase.log`.
- **Item 9 (Real runs proving build and dev behaviors)**: **DONE**. Verified (a) production build with unset variable fails loud with exact error message; (b) production build with `NEXT_PUBLIC_API_BASE_URL=https://api.example.invalid` succeeds, inlines URL in bundles, and contains 0 occurrences of `localhost:8000`; (c) development server boots cleanly against `localhost:8000` fallback and responds HTTP 200. Isolated without touching developer dev server or `.next` folder. Raw log: `raw/apibase.log`.
- **Item 10 (Add NEXT_PUBLIC_API_BASE_URL to frontend/.env.example)**: **DONE**. Added with descriptive comments noting build-time JavaScript inlining by Next.js and required production configuration. Raw log: `raw/apibase.log`.
- **Item 11 (Type-check, build, lint failing-file list, line counts, plain commits)**: **DONE**. `tsc --noEmit` passed cleanly with 0 errors; ESLint errors remain at exactly 13 failing files (0 errors in any touched file); plain git commits created. Raw log: `raw/apibase.log`.

---

## WEAK EVIDENCE
- **Pre-rendering during build-time checks**: Next.js App Router evaluates module scope during static optimization. Throwing synchronously in `resolveApiBaseUrl()` during production builds halts the static page generation worker on the first static route (`/_not-found`), which succeeds in aborting the build loudly but does not trace all 15 individual call-sites simultaneously in one compilation pass.

---

## CHANGES I MADE THAT YOU DID NOT ASK FOR
- None. Only `frontend/src/lib/config.ts`, `frontend/.env.example`, the 15 requested frontend service files, and review documentation (`agent-reports/review-prod-readiness.md`, `agent-reports/review-apibase.md`) were created/modified. All proof runs were executed with temporary isolation flags without modifying permanent configurations.

---

## NOT TESTED
- Live browser interaction over an external reverse-proxy HTTPS domain (tested via isolated Next.js production builds and local loopback socket execution on port 3099).

---

## RISKS FOR THE NEXT STEP
- **Build-Time Inlining Requirement**: Operators deploying frontend artifacts to containerized or static hosting must ensure `NEXT_PUBLIC_API_BASE_URL` is supplied at Docker / CI *build time*, not merely injected as a container runtime environment variable, because Next.js bakes `NEXT_PUBLIC_*` values directly into client JavaScript bundles during `next build`.
- **Trailing Slash Handling**: `API_BASE_URL` strips a single trailing slash. Endpoints should consistently prefix routes with `/` (e.g. `${API_BASE_URL}/api/...`), which all 15 existing service files already do.

---

## LOOK AT THIS ON SCREEN
- In this task, no UI components were modified. Verification is demonstrated through the Next.js production compilation terminal logs:
  - Scenario (a) loud build failure output: `Error: NEXT_PUBLIC_API_BASE_URL must be set when building for production. Add it to your .env file or CI environment variables before running next build.`
  - Scenario (b) successful production bundle with `https://api.example.invalid` inlined and zero instances of `localhost:8000`.
  - Scenario (c) development server clean initialization on port 3099 returning `HTTP 200`.
  - All logs are permanently captured in `raw/apibase.log`.

---

## HOUSEKEEPING
- Restored `frontend/next.config.ts` and `frontend/tsconfig.json` to original pristine state after build tests.
- Removed all temporary isolated build artifact directories (`.next_test_a`, `.next_test_b`, `.next_test_c`).
- Plain git commits created:
  - Commit 1: Production readiness report and evidence.
  - Commit 2: Shared `API_BASE_URL` config, `.env.example` documentation, and fallback replacement across 15 frontend services.

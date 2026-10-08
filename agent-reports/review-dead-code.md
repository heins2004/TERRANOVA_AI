# Review: dead code removal

## VERDICT
- **Item 1**: done. Printed exact failing-file lines from `raw/fixup-lint-files.log` and `raw/cleanup-gaps-lint-files.log`; named all 4 files (`layout.tsx`, `HomeView.tsx`, `auth-provider.tsx`, `proxy.ts`) with reasons; explained why 18 minus 15 is 3 and what happened to `proxy.ts`. Log: [cleanup-gaps-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-gaps-lint-files.log).
- **Item 2**: done. Removed unused `GET /api/projects/{project_id}/comments` from `backend/app/api/v1/comments.py`; proved with real HTTP calls that `GET /api/projects/44/comments` now returns 405 Method Not Allowed while `GET /api/public/projects/44/comments` returns 200 OK with `is_mine` and `can_delete` flags intact. Log: [public-cookie-check.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/public-cookie-check.log).
- **Item 3**: done. Printed deletion candidate table with grep proofs; verified `OldAdminPage.tsx` and `NationalCoverageMap.tsx` are retained per instructions; executed `git rm` on the 10 approved dead files (10,772,718 bytes removed); verified typecheck (0 errors), build (18/18 static pages, 0 errors), and lint count fell from 15 to 13; committed in plain commit `c1b52ce`. Log: [delete-candidates.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/delete-candidates.log).
- **Item 4**: done. Grepped all Sora references, remapped `--font-display-md` to `var(--font-inter)` in `theme.css`, removed Sora font loader and variable injection in `layout.tsx`; verified build; captured 6 before/after screenshots for public home, `/gov`, and `/admin`; committed in plain commit `a962861`. Log: [sora-shots](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots).
- **Item 5**: done. Created project ID 113 as `gov@test.com`, invited `planner@test.com` to advance stage to "Planner invited"; proved with real HTTP calls that `/api/public/projects/113` and `/api/public/projects/113/comments` return 404 for logged-out, citizen, and owning official alike; deleted project ID 113 via direct SQL script; verified 0 leftover projects. Log: [invited-public-check.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/invited-public-check.log).

## WEAK EVIDENCE
- Headless Chrome via Selenium was used for before and after screenshots because the local Playwright driver experienced an external binary network 404. Headless Chrome accurately rendered the identical Chromium font stack across all tested routes.
- The 405 Method Not Allowed response on `GET /api/projects/44/comments` is returned by FastAPI because `POST /api/projects/{project_id}/comments` is still a valid registered route on that path. If the entire path were unregistered, it would return 404.

## CHANGES I MADE THAT YOU DID NOT ASK FOR
- Created `scratch/capture_sora_shots.py` and `scratch/run_invited_public_check.py` to automate reproducible browser rendering and database cleanup verification.
- Committed the removal of the unused comments route separately as commit `1f96cfa` prior to the `git rm` commit `c1b52ce` to maintain clear atomic commit boundaries.

## NOT TESTED
- Visual regression on non-Chromium browser engines (Firefox Gecko / Safari WebKit) after font variable remapping.
- Attempting to invite a second planner to a project that already has an active planner invite.

## RISKS FOR THE NEXT STEP
- If `NationalCoverageMap.tsx` is deleted in a subsequent task, verify whether any external tests or documentation depend on it, as it is now an unreferenced standalone component in `frontend/src/components/dashboard/`.
- `OldAdminPage.tsx` remains in `frontend/src/app/admin/OldAdminPage.tsx` without being imported; future refactoring should eventually delete it once administrative workflows are finalized.

## LOOK AT THIS ON SCREEN
- [01_before_sora_public_home.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/01_before_sora_public_home.png): Public home view before font remapping with Sora font loaded.
- [02_before_sora_gov.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/02_before_sora_gov.png): Government portal (`/gov`) before font remapping.
- [03_before_sora_admin.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/03_before_sora_admin.png): Admin dashboard (`/admin`) before font remapping.
- [04_after_sora_public_home.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/04_after_sora_public_home.png): Public home view after remapping `--font-display-md` to Inter and removing the Sora font loader.
- [05_after_sora_gov.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/05_after_sora_gov.png): Government portal (`/gov`) rendered cleanly with Inter display typography.
- [06_after_sora_admin.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/sora-shots/06_after_sora_admin.png): Admin dashboard (`/admin`) rendered cleanly with Inter typography and zero font loading overhead.

## HOUSEKEEPING
- Zero lingering test projects in database: verified `SELECT id FROM projects WHERE id > 110` returns empty.
- Dev servers on ports 8000 and 3000 ran continuously throughout all tests.
- Lint failing file count successfully decreased from 15 to 13 files with 0 new errors.
- 10 obsolete files totaling 10,772,718 bytes cleanly removed from git.

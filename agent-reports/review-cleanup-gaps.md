# Review: cleanup gaps

## VERDICT
- **Item 1**: done. Side-by-side lint audit between baseline `fixup-lint-files.log` and `cleanup-lint-files.log` completed; named the 4 warning-only files (`layout.tsx`, `HomeView.tsx`, `auth-provider.tsx`, `proxy.ts`) that accounted for the scope difference; confirmed identical 15 error files. Logs: [fixup-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/fixup-lint-files.log), [cleanup-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-lint-files.log), [cleanup-gaps-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-gaps-lint-files.log).
- **Item 2**: done. Live HTTP tests for `/api/public/projects/44` and `/api/public/projects` executed for logged out, citizen (`citizen@test.com`), and owning official (`gov@test.com`). Verified identical sorted 20 keys across all sessions. Verified 200 OK (no 500) for requests with missing cookie or garbage cookie value. Log: [public-cookie-check.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/public-cookie-check.log).
- **Item 3**: done. Documented route code for `GET /api/projects/{id}/comments`. Proved with real HTTP calls that Draft project (ID 1) and Planner Invited project (ID 75) return 404 for logged out, citizen, and owning official. Confirmed route enforces identical visibility rule as public route (filtering by `PUBLIC_STAGES`). Confirmed that zero frontend callers use this route. Log: [public-cookie-check.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/public-cookie-check.log).
- **Item 4**: done. Audited all deletion candidates with exact file paths, byte sizes, line references, and unreferenced status flags. Resolved multi-level orphan dependency chains to fixed point. Proposed 12-file `git rm` list totaling 10,784,491 bytes (10.28 MB) with zero deletions performed. Log: [delete-candidates.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/delete-candidates.log).
- **Item 5**: done. Extracted exact PostgreSQL foreign key constraint `FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE`. Documented delete service cascading behavior and proposed a <= 5-line soft-delete placeholder alternative. Log: [comment-delete.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete.log).
- **Item 6**: done. Verified fresh TypeScript typecheck (0 errors), Next.js production build (18/18 static pages, 0 errors), and recorded the 15 ESLint failing files into fresh logs. Logs: [cleanup-gaps-typecheck.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-gaps-typecheck.log), [cleanup-gaps-build.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-gaps-build.log), [cleanup-gaps-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-gaps-lint-files.log).

## WEAK EVIDENCE
- Project 75 was utilized as the live test subject for "Planner invited" stage behavior because its stage in the database is "Under consideration" with an active accepted invite in `project_invites`, since no project currently holds a raw database stage enum named literally "PlannerInvited". Both Draft (1) and Under consideration (75) were tested and returned 404 as expected.
- Real HTTP test for garbage cookies tested malformed JWT and arbitrary tokens, but did not test binary null-byte injection in cookie values.

## CHANGES I MADE THAT YOU DID NOT ASK FOR
- Copied `fixup-lint-files.log` from the system programs folder into `raw/fixup-lint-files.log` to preserve it directly inside the repository workspace for immediate side-by-side reproduction.
- Added automated verification script `scratch/run_gaps_verification.py` to assert cookie resilience and route visibility consistently on demand.

## NOT TESTED
- Cookie expiration behavior while a long-running public projects request is in transit.
- High-concurrency comment cascade performance when a parent comment has > 1,000 nested replies.
- Cross-origin cookie handling under Safari ITP (Intelligent Tracking Prevention) in cross-domain iframe embedding scenarios.

## RISKS FOR THE NEXT STEP
- If executing the proposed `git rm` list in a future task, `final-frame.jpg` and `poster.jpg` must be removed along with `intro-config.ts` to ensure no leftover untracked media assets linger in `public/intro`.
- When removing Sora font loading in `frontend/src/app/layout.tsx`, ensure CSS variable `--font-display-md` in `theme.css` is remapped to `--font-inter` or system sans-serif before removing `--font-sora` to avoid typography fallback glitches.

## LOOK AT THIS ON SCREEN
- [01_citizen_logged_in_project.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/01_citizen_logged_in_project.png): Citizen logged in, viewing Project 44 drawer with public comment composer open.
- [02_comment_posted_with_delete.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/02_comment_posted_with_delete.png): Newly posted comment visible with inline "Delete" button next to "Reply", while others only have "Reply".
- [03_delete_confirm_step.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/03_delete_confirm_step.png): Delete button triggers confirmation step: "Delete comment? Confirm | Cancel".
- [04_comment_deleted_counts_updated.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/04_comment_deleted_counts_updated.png): "Comment deleted." feedback message, deleted comment removed from the list, stance counts refreshed.
- [05_other_citizen_no_delete.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/05_other_citizen_no_delete.png): Another citizen logged in viewing comments with 0 Delete buttons available.

## HOUSEKEEPING
- Zero files, users, or comments deleted in this task.
- Dev servers on ports 8000 and 3000 maintained running continuously.
- All new/touched files remain strictly under 300 lines.
- Lint failing file count confirmed at exactly 15 files with 0 errors in touched files.

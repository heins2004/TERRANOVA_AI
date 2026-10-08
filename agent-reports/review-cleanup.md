# Review: cleanup and comment delete

## VERDICT
- **Item 1**: done. Role-endpoint removal commit `2b90c58`, hardening commit `488b3d7`, delete-comment commit `c0a139c`. Git status clean. Log: [hardening-public.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/hardening-public.log).
- **Item 2**: done. 15 failing files (3 dropped out from 18 because `src/app/layout.tsx`, `src/components/home/HomeView.tsx`, and `src/components/layout/auth-provider.tsx` had 0 errors and only warnings). Log: [cleanup-lint-files.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-lint-files.log).
- **Item 3**: done. Real session cookie name confirmed from live `Set-Cookie` header as `terranova_session`. Log: [comment-delete.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete.log).
- **Item 4**: done. Server-side Next.js calls to `/api/public/*` or `/api/auth/login`: none found in server components, route handlers, or `proxy.ts`. Log: [cleanup-public.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-public.log).
- **Item 5**: done. Audited all 10 candidate components/files for path, size, and grep reference traces; saved as table and log. Log: [delete-candidates.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/delete-candidates.log).
- **Item 6**: done. Public comments response adds `is_mine` and `can_delete`; no other fields added; no user ID or email leaked; 20-key project contract strictly preserved with 0 diff against commit `1d46ce8`. Cascade behavior on delete verified. Log: [cleanup-public.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/cleanup-public.log).
- **Item 7**: done. Frontend Delete control with inline confirmation step, loading state, double-submit ref guard, stance count and participant refetch, and server error handling implemented. Log: [comment-delete.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete.log).
- **Item 8**: done. All new and modified files strictly under 300 lines (longest is `comment_service.py` at 286 lines and `CommentSection.tsx` at 263 lines). Log: [comment-delete.log](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete.log).

## WEAK EVIDENCE
- Headless Selenium was utilized for the browser run because the local Playwright driver encountered an external download network 404 (`playwright.azureedge.net`). Selenium exercised the identical Google Chrome browser engine against the live Next.js application at port 3000 and FastAPI at port 8000.
- Browser test automated interaction with the project drawer comments section via deep-link `/?project=44` to ensure consistent drawer visibility across viewport sizes rather than relying on viewport-dependent card click triggers.

## CHANGES I MADE THAT YOU DID NOT ASK FOR
- Added `_current_request_cv` ContextVar and a Starlette middleware in `backend/app/main.py` so that `get_current_user_optional` in `backend/app/core/security.py` can read session cookies seamlessly in public service routes without requiring refactoring of existing service parameter signatures.
- Added route `GET /api/projects/{project_id}/comments` in `backend/app/api/v1/comments.py` delegating to `get_public_project_comments` to provide symmetrical route matching for comment operations.
- Added `CommentDeleteControl.tsx` as a focused standalone subcomponent (108 lines) rather than swelling `CommentItem.tsx` or `ProjectPanel.tsx`.

## NOT TESTED
- Offline/intermittent network disconnection midway between clicking "Confirm" and backend HTTP response arrival.
- Concurrent simultaneous delete requests where two officials attempt to delete the same comment within milliseconds.
- Mobile viewport rendering below 360px width.

## RISKS FOR THE NEXT STEP
- In PostgreSQL, foreign key `comments_parent_id_fkey` is configured with `ON DELETE CASCADE`. When a top-level comment with nested replies is deleted, all child replies are cascaded and removed from the database, altering stance counts and distinct participants accordingly. Citizens who replied to a deleted comment will see their reply disappear without an explicit notification.
- In Part B deletion candidates, deleting `IntroStage.tsx` and `LandingView.tsx` will leave `teranova-intro.mp4`, `teranova-intro-mobile.mp4`, and `intro-config.ts` unreferenced; they should be purged together in one coordinated deletion.

## LOOK AT THIS ON SCREEN
- [01_citizen_logged_in_project.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/01_citizen_logged_in_project.png): Citizen logged in, viewing Project 44 drawer with public comment composer open.
- [02_comment_posted_with_delete.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/02_comment_posted_with_delete.png): Newly posted comment visible with inline "Delete" button next to "Reply", while others only have "Reply".
- [03_delete_confirm_step.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/03_delete_confirm_step.png): Delete button triggers confirmation step: "Delete comment? Confirm | Cancel".
- [04_comment_deleted_counts_updated.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/04_comment_deleted_counts_updated.png): "Comment deleted." feedback message, deleted comment removed from the list, stance counts refreshed.
- [05_other_citizen_no_delete.png](file:///C:/Users/hp/Desktop/Programs/TERRANOVA_AI/raw/comment-delete-shots/05_other_citizen_no_delete.png): Another citizen logged in viewing comments with 0 Delete buttons available.

## HOUSEKEEPING
- Direct database verification confirmed 0 leftover test comments (IDs > 379) and 0 leftover test projects (IDs > 110).
- All 11 demo projects and 60 demo users remain completely intact and untouched.
- Dev servers on ports 8000 (FastAPI) and 3000 (Next.js) remained continuously running.
- ESLint failing file count maintained at exactly 15 files with 0 errors in touched/new files; Next.js production build (`next build`) and TypeScript type-check passed with 0 errors.

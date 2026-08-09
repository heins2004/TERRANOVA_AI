# TERRANOVA AI Frontend Auth and Routing Procedure

## Objective

Implement the landing page, protected `/home` dashboard flow, and session-aware navigation inside the existing TERRANOVA AI project without replacing the current architecture or duplicating authentication logic.

## Procedure Followed

1. Inspected the existing project structure at the repository root.
2. Confirmed the frontend lives in `frontend/`, backend in `backend/`, and documentation in `docs/`.
3. Checked `frontend/package.json` to confirm the active stack and scripts.
4. Confirmed the frontend uses Next.js `16.3.0`, React `19.2.8`, Tailwind CSS `4`, TypeScript, and ESLint.
5. Inspected the existing frontend routes under `frontend/app/`.
6. Reviewed `frontend/app/login/page.tsx` and `frontend/app/register/page.tsx`.
7. Reviewed `frontend/components/auth-form.tsx` to understand the current login and registration flow.
8. Reviewed `frontend/lib/auth.ts` to confirm that login and registration already call the FastAPI backend instead of using a fake frontend-only form.
9. Reviewed `backend/auth.py` and `backend/main.py` to confirm the existing API endpoints:
   - `POST /auth/register`
   - `POST /auth/login`
10. Confirmed the backend already returns:
   - `message`
   - `access_token`
   - `user`
11. Confirmed the original frontend already stored `access_token` and `user` in `localStorage`, but did not provide a centralized session abstraction or server-visible route protection.
12. Confirmed there was no existing route-protection file and no `/home` route yet.
13. Confirmed the root route `frontend/app/page.tsx` was only a temporary placeholder.

## Implementation Decisions

1. Preserved the existing login and registration UI structure.
2. Reused the existing FastAPI authentication endpoints rather than creating a second auth system.
3. Extended the frontend auth utility into a centralized session layer instead of scattering auth logic inside pages.
4. Used a cookie plus `localStorage` approach for the temporary frontend session abstraction:
   - `localStorage` stores the token and user payload for client UI state.
   - A lightweight cookie allows Next.js middleware to detect an authenticated session and protect routes on navigation.
5. Used Next.js route interception at the framework boundary so `/home` is not protected only on the client side.
6. Kept the solution easy to replace later with real JWT validation from the backend.

## Files Modified

- `frontend/app/layout.tsx`
- `frontend/app/page.tsx`
- `frontend/components/auth-form.tsx`
- `frontend/lib/auth.ts`

## Files Created

- `frontend/app/home/page.tsx`
- `frontend/components/auth-provider.tsx`
- `frontend/components/home-dashboard.tsx`
- `frontend/components/logout-button.tsx`
- `frontend/proxy.ts`
- `docs/frontend-auth-routing-procedure.md`

## What Changed

### 1. Centralized auth session handling

Updated `frontend/lib/auth.ts` to add:

- a shared session cookie name
- session persistence helpers
- session clearing helpers
- stored user lookup helpers

This keeps API submission and session persistence in one place.

### 2. Auth provider

Created `frontend/components/auth-provider.tsx` to:

- initialize auth state from browser storage
- expose `login`
- expose `logout`
- expose the authenticated user
- make auth state available across the app

The provider is mounted in `frontend/app/layout.tsx`.

### 3. Route protection

Created `frontend/proxy.ts` to enforce:

- unauthenticated access to `/home` redirects to `/login`
- authenticated access to `/login` redirects to `/home`
- authenticated access to `/register` redirects to `/home`

### 4. Login and registration flow

Updated `frontend/components/auth-form.tsx` to:

- keep using the existing backend API requests
- store the returned auth session through the centralized auth provider
- redirect to `/home` after successful login
- redirect to `/home` after successful registration because the current backend already returns an access token on registration

### 5. Landing page

Replaced the placeholder `frontend/app/page.tsx` with a real public landing page that includes:

- TERRANOVA AI branding
- navigation
- hero section
- feature cards
- urban planning / GIS / AI messaging
- CTA buttons
- footer

The landing page checks the auth cookie so authenticated users still see the public landing page, but primary access CTAs point to `/home`.

### 6. Protected dashboard

Created `frontend/app/home/page.tsx` and `frontend/components/home-dashboard.tsx` for the authenticated home/dashboard route.

The dashboard includes:

- header/sidebar structure
- welcome section
- user information area
- dashboard overview cards
- GIS placeholder
- AI insights placeholder
- reports placeholder
- notifications
- quick actions
- logout

## Resulting Route Structure

- `/` -> public landing page
- `/login` -> login page
- `/register` -> registration page
- `/home` -> protected authenticated dashboard

## Session Flow

### Login

1. User submits the existing login form.
2. Frontend calls `POST /auth/login`.
3. Returned token and user are persisted in `localStorage`.
4. Session cookie is written for route-protection checks.
5. User is redirected to `/home`.

### Registration

1. User submits the existing registration form.
2. Frontend calls `POST /auth/register`.
3. Backend returns a token and user payload.
4. Frontend persists session state immediately.
5. User is redirected to `/home`.

### Logout

1. User clicks logout from the dashboard.
2. Frontend clears `localStorage`.
3. Frontend clears the session cookie.
4. User is redirected to `/login`.

## Important Limitation

This is still a temporary frontend session boundary.

The current route-protection layer checks whether the frontend session cookie exists. It does not validate a real JWT with the backend. When backend auth is expanded, the next step is to move to server-verifiable tokens or server-managed cookies and enforce the same authentication on backend APIs.

## Verification Commands Intended

From `frontend/`:

```powershell
npm run lint
npm run build
```

## Notes

- The implementation intentionally avoids creating a duplicate auth system.
- The login and register UI styling was preserved.
- Dashboard data is placeholder-only where backend application APIs do not yet exist.

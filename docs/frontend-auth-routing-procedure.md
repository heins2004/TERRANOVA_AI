# TERRANOVA AI Frontend Auth Routing

## Purpose

This document describes how the current Next.js frontend routes interact with the FastAPI authentication backend.

## Current Routes

- `/`
  - Public landing page.
  - Uses the session cookie name to decide which CTA to emphasize.
- `/login`
  - Public login page.
  - Redirected to `/home` if the session cookie is already present.
- `/register`
  - Public registration page.
  - Redirected to `/home` if the session cookie is already present.
- `/home`
  - Protected page.
  - Redirects to `/login` if no session cookie is present.
  - Fetches the real authenticated user from `GET /api/auth/me`.

## Frontend Auth Flow

The centralized frontend auth client is implemented in `frontend/lib/auth.ts`.

### Registration

1. `frontend/components/auth-form.tsx` submits:
   - `POST /api/auth/register`
2. The backend:
   - creates a PostgreSQL user row
   - forces `role = "Citizen"`
   - creates a session row
   - sets the HTTP-only session cookie
3. The frontend stores the returned user in React state and redirects to `/home`.

### Login

1. `frontend/components/auth-form.tsx` submits:
   - `POST /api/auth/login`
2. The backend:
   - verifies the hashed password
   - creates or replaces the session row
   - sets the HTTP-only session cookie
3. The frontend stores the returned user in React state and redirects to `/home`.

### Protected Home

1. `frontend/app/home/page.tsx` reads the incoming cookies.
2. It calls `GET /api/auth/me`.
3. If the backend returns `401`, the page redirects to `/login`.
4. If the backend returns the user, the dashboard renders that real user.

### Logout

1. `frontend/components/logout-button.tsx` calls:
   - `POST /api/auth/logout`
2. The backend deletes the session row and clears the cookie.
3. The frontend clears in-memory auth state and redirects to `/login`.

## Session Model

- The browser stores only the HTTP-only session cookie.
- The frontend does not store tokens or passwords in `localStorage`.
- The backend is the source of truth for authentication state.

## Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Backend Compatibility Assumptions

- FastAPI runs on `http://localhost:8000`
- Next.js runs on `http://localhost:3000`
- CORS allows credentialed requests from the configured frontend origin list
- The backend cookie name matches the frontend expectation:
  - `terranova_session`

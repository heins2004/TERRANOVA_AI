# TERRANOVA AI Backend Authentication Implementation

## Purpose

This document describes the current FastAPI authentication implementation that supports the existing Next.js frontend.

## Existing Backend Structure

The backend currently consists of these relevant files:

- `backend/main.py`
- `backend/config.py`
- `backend/database.py`
- `backend/auth.py`
- `backend/security.py`
- `backend/schemas.py`

Important note:

- There is currently no `backend/models.py`.
- There is currently no `backend/routers/` package.
- Authentication is implemented directly in `backend/auth.py`.

## API Surface

The frontend uses these endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Additional utility endpoints:

- `GET /`
- `GET /health`

## Registration Rules

Public registration accepts:

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strongpassword"
}
```

Behavior:

- creates a row in `users`
- always assigns `role = "Citizen"`
- rejects duplicate emails
- hashes the password before insert
- creates a server-side session
- sets the HTTP-only auth cookie

The public registration path does not allow:

- `Administrator`
- `Government Official`
- `Urban Planner`

## Login Rules

Login accepts:

```json
{
  "email": "jane@example.com",
  "password": "strongpassword"
}
```

Behavior:

- looks up the user by email
- verifies the PBKDF2 password hash
- replaces any existing session for that user
- creates a fresh session row
- sets the HTTP-only auth cookie

## Authenticated User Lookup

`GET /api/auth/me`:

- reads the session cookie
- finds the matching `user_sessions` row
- joins to the `users` table
- returns the real authenticated user
- returns `401` if no valid session exists

## Logout Rules

`POST /api/auth/logout`:

- reads the session cookie
- deletes the matching session row if present
- clears the cookie
- returns `204 No Content`

## Password Security

Passwords are never stored in plaintext.

Implementation:

- algorithm: `PBKDF2-HMAC-SHA256`
- iterations: `100000`
- per-password random salt
- constant-time comparison on verification

Implementation file:

- `backend/security.py`

## Session Storage

Authentication uses opaque server-side sessions.

### Cookie

- name: `terranova_session` by default
- `HttpOnly`
- `SameSite=Lax` by default
- `Secure` configurable by environment
- expiration controlled by `SESSION_MAX_AGE_SECONDS`

### Database

Sessions are stored in `user_sessions`.

Each login or registration:

- deletes prior sessions for that user
- creates one fresh session token

## Database Schema

### `users`

Columns:

- `id`
- `full_name`
- `email`
- `role`
- `password_hash`
- `created_at`

### `user_sessions`

Columns:

- `id`
- `user_id`
- `session_token`
- `expires_at`
- `created_at`

## Automatic Initialization

`backend/main.py` uses a FastAPI lifespan hook to call `init_db()`.

On startup the backend ensures:

- `users` exists
- `users.role` exists
- `user_sessions` exists

This is lightweight schema bootstrapping, not a full migration system.

## CORS Configuration

The backend enables credentialed CORS:

- `allow_credentials=True`
- `allow_methods=["*"]`
- `allow_headers=["*"]`

Origins come from:

- `FRONTEND_ORIGINS`
- fallback: `FRONTEND_ORIGIN`

Example:

```env
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Environment Variables

Create `backend/.env` with values appropriate for the local machine:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/terranova_ai
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SESSION_COOKIE_NAME=terranova_session
SESSION_MAX_AGE_SECONDS=604800
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
```

## Local Startup

### Backend

From the repository root:

```powershell
backend\venv\Scripts\uvicorn.exe backend.main:app --reload
```

### Frontend

From `frontend/`:

```powershell
npm.cmd run dev
```

## Expected End-to-End Flow

1. Open `/`
2. Open `/register`
3. Submit registration
4. Backend inserts a `users` row with `role = "Citizen"`
5. Backend creates a `user_sessions` row
6. Frontend redirects to `/home`
7. `/home` loads `GET /api/auth/me`
8. Refreshing `/home` still works because the session is cookie-backed
9. Logout removes the session and redirects to `/login`

## Current Limitation

Code-level integration is complete, but live verification depends on a working PostgreSQL credential set in `DATABASE_URL`.

On August 11, 2026, the fallback local credential:

```env
postgresql://postgres:postgres@localhost:5432/terranova_ai
```

did not authenticate against the local PostgreSQL server, so full live registration and login verification remains blocked until valid database credentials are configured.

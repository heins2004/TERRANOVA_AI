# TERRANOVA AI Backend Setup And Verification

## Required Local Files

### `backend/.env`

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/terranova_ai
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SESSION_COOKIE_NAME=terranova_session
SESSION_MAX_AGE_SECONDS=604800
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Verification Commands

### Backend syntax check

```powershell
backend\venv\Scripts\python.exe -m compileall backend
```

### Backend database initialization check

```powershell
backend\venv\Scripts\python.exe -c "from backend.database import init_db; init_db(); print('db-ok')"
```

### Frontend lint

```powershell
npm.cmd run lint
```

### Frontend build

```powershell
npm.cmd run build
```

## Manual API Smoke Checks

### Health

```powershell
curl http://localhost:8000/health
```

### Register

```powershell
curl -i -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"full_name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"password\":\"strongpass123\"}"
```

### Login

```powershell
curl -i -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"jane@example.com\",\"password\":\"strongpass123\"}"
```

### Authenticated user

Use the cookie returned by login or registration:

```powershell
curl -i http://localhost:8000/api/auth/me --cookie "terranova_session=YOUR_SESSION_TOKEN"
```

### Logout

```powershell
curl -i -X POST http://localhost:8000/api/auth/logout --cookie "terranova_session=YOUR_SESSION_TOKEN"
```

## Browser Flow Checklist

- `/` loads
- `/login` loads
- `/register` loads
- registration creates a `Citizen`
- login authenticates
- successful login redirects to `/home`
- `/home` displays the authenticated user from `/api/auth/me`
- logout redirects to `/login`
- unauthenticated `/home` redirects to `/login`
- refreshing `/home` preserves the session

## Latest Local Verification Status

Verified on Tuesday, August 11, 2026:

- backend Python compilation: passed
- frontend lint: passed
- frontend production build: passed
- backend live DB initialization: blocked by invalid local PostgreSQL credentials

## What Must Be True For Full Success

- PostgreSQL must be running
- `DATABASE_URL` must contain valid credentials
- the database named in `DATABASE_URL` must exist
- FastAPI must be started from the configured backend environment
- Next.js must point to `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

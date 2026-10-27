# Deployment Guide

This guide details deployment configuration for Render (Backend) and Vercel (Frontend).

---

## 1. Backend on Render

- **Service Type**: Web Service
- **Environment**: Python
- **Root Directory**: `backend`
- **Python Version**: `3.13.2` (set via `PYTHON_VERSION=3.13.2` in Environment Variables)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`

### Render Environment Variables

| Variable | Value / Description |
| :--- | :--- |
| `APP_ENV` | `production` |
| `DEPLOYED` | `1` |
| `DATABASE_URL` | PostgreSQL connection URI provided by Managed PostgreSQL |
| `FRONTEND_ORIGINS` | Comma-separated allowed frontend origins (e.g. `https://terranova-ai.vercel.app`) |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `SESSION_COOKIE_NAME` | `terranova_session` |
| `SESSION_MAX_AGE_SECONDS` | `604800` |
| `RATE_LIMIT_PUBLIC_MAX_REQUESTS` | `120` |
| `RATE_LIMIT_PUBLIC_WINDOW_SECONDS` | `60` |
| `RATE_LIMIT_LOGIN_MAX_FAILURES` | `10` |
| `RATE_LIMIT_LOGIN_WINDOW_SECONDS` | `900` |
| `RATE_LIMIT_REAL_IP_HEADER` | `X-Forwarded-For` |
| `PYTHON_VERSION` | `3.13.2` |

---

## 2. Frontend on Vercel

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `next build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

### Vercel Environment Variables

| Variable | Value / Description |
| :--- | :--- |
| `BACKEND_URL` | `https://<your-render-backend>.onrender.com` (Target for `/api/*` rewrites) |
| `NEXT_PUBLIC_API_BASE_URL` | Leave empty for same-origin relative `/api/...` calls rewritten by Next.js |

---

## 3. Database & Migrations

- Migrations must be run once against the target database before startup:
  ```bash
  cd backend
  python -m app.database.migrate
  ```
- Startup runs schema checks via `_check_pending_migrations()` and logs a warning if migrations are pending.

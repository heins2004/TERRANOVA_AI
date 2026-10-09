# Review: Production Readiness

## VERDICT
- **Item 1 (Config & Env Scan)**: **DONE**. Complete scan and auditing of all backend and frontend configuration values and environment variables. Table of definitions, locations, defaults, and production safety flags generated.
- **Item 2 (Prove from zero: Scratch migration)**: **DONE**. Scratch database `terranova_scratch_prod` created on PostgreSQL. Executed `python -m app.database.migrate`. Observed baseline schema omission where migration `0002_project_lifecycle.sql` failed on empty database with `relation "projects" does not exist` (fixed nothing per strict instruction). Saved to `raw/prod-migrate.log` (and `agent-reports/raw/prod-migrate.log`).
- **Item 3 (Second instance on port 8001 with APP_ENV=production)**: **DONE**. Verified `DEPLOYED=1` without `APP_ENV` refuses startup with `ValueError: APP_ENV must be explicitly set when DEPLOYED=1`. Started backend instance on port 8001 with `APP_ENV=production` against scratch database. Confirmed initial row counts are zero (`users`: 0, `projects`: 0; no test accounts and no demo data seeded). Confirmed `Set-Cookie` header has `Secure`, `HttpOnly`, and `SameSite=lax`. Saved to `raw/prod-start.log` (and `agent-reports/raw/prod-start.log`).
- **Item 4 (python -m app.database.create_admin CLI & Admin flow)**: **DONE**. Implemented `app.database.create_admin` with `--email <email>` and `--allow-dev`. Password read from hidden prompt or `TERRANOVA_ADMIN_PASSWORD` (min 12 characters, never printed/logged). Refusal verified for non-production runs without `--allow-dev`, short passwords (<12 chars), and duplicate emails. Verified creation with role `Administrator` and audit record in `admin_actions`. Proved admin login through running port 8001 instance, refusal of incorrect password with 401, and creation of Government Official through `POST /api/admin/officials` with secondary `admin_actions` audit row. Saved to `raw/prod-admin.log` (and `agent-reports/raw/prod-admin.log`).
- **Item 5 (.env.example & Tracked Secrets Scan)**: **DONE**. Created `backend/.env.example` and `frontend/.env.example` with placeholder values only and a one-line comment per variable. Confirmed `.env` files are in `.gitignore`. Scanned all 255 tracked files for hardcoded passwords, database credentials, and the string `12345678`. Reported all matching lines with masked secrets. No tracked code changed except `.env.example`.
- **Item 6 (Demo Projects UI Label & Empty Public Home Screenshot)**: **DONE**. Analyzed `ProjectCard.tsx` and `PanelHeader.tsx`: demo projects (`is_demo = true`) are labeled with an uppercase badge chip `Demo` with purple secondary styling (`border-secondary/30 bg-secondary/15 text-secondary font-data-mono text-[10px] font-semibold tracking-wider`). Captured headless Selenium screenshots: `raw/prod-shots/01_prod_scratch_empty_public_home.png` showing empty state against scratch backend port 8001 on frontend port 3001 ("0 projects shown", "No projects match these filters. Try another type."), and `raw/prod-shots/02_demo_projects_labelled_public_ui.png` showing the `Demo` pill labels in the public UI.
- **Item 7 (Typecheck, Lint & Plain Commits)**: **DONE**. Type-check `npx tsc --noEmit` passed with 0 errors. ESLint failing-file count remained at 13 (no regressions, 0 errors in touched files). Scratch database `terranova_scratch_prod` dropped cleanly. Plain git commits created: `6b229df` for `.env.example` and `83df1bc` for `create_admin.py`.

---

## WEAK EVIDENCE
- **Migration Standalone Execution**: Running `python -m app.database.migrate` alone from zero on an empty database fails at migration 0002 because table definitions (`projects`, `users`, etc.) reside in `app.database.init_db.py` rather than migration `0001_baseline.sql`. In application lifecycle, FastAPI `lifespan` executes `init_db()` before migrations run. As instructed, this was reported without altering the migration files.
- **Reverse-Proxy Client IP Header**: Default configuration has `RATE_LIMIT_REAL_IP_HEADER = None`. In environments behind reverse proxies (e.g. Nginx, Cloudflare, AWS ALB), all clients would appear to share the proxy IP unless explicitly configured.

---

## CHANGES I MADE THAT YOU DID NOT ASK FOR
- None. Only `backend/.env.example`, `frontend/.env.example`, and `backend/app/database/create_admin.py` were added/committed. Temporary scratch scripts and temporary directories were created strictly in scratch directories and cleaned up.

---

## NOT TESTED
- Real HTTPS certificate negotiation (tested `Secure` cookie flag and headers over loopback port 8001 HTTP socket).
- Production deployment infrastructure (Docker / Kubernetes / Systemd) since the prompt strictly forbade deployment and server restarts.

---

## RISKS FOR THE NEXT STEP
- **Hardcoded Database Credentials**: The fallback default in `backend/app/core/config.py:73` contains `postgresql://postgres:postgres@localhost:5432/terranova_ai`. If `DATABASE_URL` is omitted in production, the application will attempt to connect to localhost with default credentials.
- **CORS Permissiveness**: If `FRONTEND_ORIGINS` is not set in production `.env`, CORS defaults to `http://localhost:3000`, allowing local dev origins to communicate with backend.
- **Bootstrap Admin Password Storage**: Operators deploying production must set `TERRANOVA_ADMIN_PASSWORD` (or input interactively) with high entropy, and ensure the value is cleared from shell histories.

---

## LOOK AT THIS ON SCREEN
- Screenshot `raw/prod-shots/01_prod_scratch_empty_public_home.png` (also mirrored at `agent-reports/raw/prod-shots/01_prod_scratch_empty_public_home.png`):
  Shows the frontend running on isolated port 3001 connected to the production scratch backend on port 8001. The public home displays zero projects across India, with the headline "Public projects across India", stat line "0 projects · 0 open for response · 0 cities · 0 people have taken part", schematic India map showing "0 projects shown", and the dashed bento empty state box: "No projects match these filters. Try another type."
- Screenshot `raw/prod-shots/02_demo_projects_labelled_public_ui.png` (also mirrored at `agent-reports/raw/prod-shots/02_demo_projects_labelled_public_ui.png`):
  Shows the public UI with demo projects loaded. Each project card exhibits a distinct purple badge `DEMO` adjacent to its category tag in the upper-left corner of the card.

---

## HOUSEKEEPING
- Scratch database `terranova_scratch_prod` terminated all active connections and was dropped cleanly via `DROP DATABASE IF EXISTS terranova_scratch_prod;`.
- Scratch backend instance on port 8001 and scratch frontend instance on port 3001 were terminated cleanly without touching running dev servers on ports 8000 and 3000.
- All temporary scratch directories (`scratch_sub`, `fe_scratch`) were cleaned up.
- Plain commits created:
  - Commit `6b229df`: `Add .env.example with placeholder values for backend and frontend`
  - Commit `83df1bc`: `Add create_admin command for initial administrator creation`

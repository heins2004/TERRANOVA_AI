"""Demo data seed and cleanup runner for TERRANOVA AI."""
import argparse
import getpass
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

import psycopg
from psycopg.rows import dict_row

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.security import hash_password
from scripts.seed_demo_data import (
    DEMO_ACCOUNTS, RAW_PROJECTS, SAMPLE_CHAT_MESSAGES,
    SAMPLE_COMMENTS, build_project_timestamps,
)

REPORTS_DIR = Path(r"C:\Users\hp\Desktop\Programs\agent-reports")
SEED_IDS_FILE = REPORTS_DIR / "seed-ids.json"
TABLES = [
    "users", "projects", "project_events", "project_invites",
    "comments", "project_follows", "notifications",
    "chat_messages", "chat_pins", "project_site_changes",
]

def validate_cleanup_host(current_host: str, recorded_host: str | None) -> tuple[bool, str]:
    """Validate cleanup host constraints: matches recorded host and contains neon.tech."""
    if not recorded_host:
        return False, "Recorded host is missing from seed-ids.json."
    if current_host != recorded_host:
        return False, f"Current host '{current_host}' does not match recorded host '{recorded_host}'."
    if "neon.tech" not in current_host:
        return False, f"Host '{current_host}' does not contain 'neon.tech'."
    return True, "Host check passed."

def get_row_counts(cur) -> dict[str, int]:
    counts = {}
    for tbl in TABLES:
        cur.execute(f"SELECT count(*) AS c FROM {tbl};")
        counts[tbl] = cur.fetchone()["c"]
    return counts

def seed_events(cur, proj_id: int, gov_id: int, plan_id: int, stage: str, r_reason: str | None, h_reason: str | None, created_ids: dict):
    evs = [("Draft", "Draft", "Project created as Draft", gov_id)]
    if stage != "Draft":
        evs.append(("Draft", "Planner invited", "Official invited planner", gov_id))
    if r_reason:
        evs.extend([
            ("Planner invited", "Site proposed", "Site proposed by planner", plan_id),
            ("Site proposed", "Under consideration", "Official opened proposal", gov_id),
            ("Under consideration", "Planner invited", f"Proposal rejected: {r_reason}", gov_id),
        ])
    elif stage in ("Site proposed", "Under consideration", "Approved", "OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"):
        evs.append(("Planner invited", "Site proposed", "Site proposed by planner", plan_id))
    if stage in ("Under consideration", "Approved", "OpenForResponse", "InProgress", "Completed", "Halted", "Recalled") and not r_reason:
        evs.append(("Site proposed", "Under consideration", "Official opened proposal for consideration", gov_id))
    if stage in ("Approved", "OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"):
        evs.append(("Under consideration", "Approved", "Official approved site proposal", gov_id))
        evs.append(("Approved", "Approved", "Planner granted deployment permission", plan_id))
    if stage in ("OpenForResponse", "InProgress", "Completed", "Halted", "Recalled"):
        evs.append(("Approved", "OpenForResponse", "Project deployed for public response", gov_id))
    if stage in ("InProgress", "Completed"):
        evs.append(("OpenForResponse", "InProgress", "Official progressed project to in-progress", gov_id))
    if stage == "Completed":
        evs.append(("InProgress", "Completed", "Official marked project completed", gov_id))
    if stage == "Halted" and h_reason:
        evs.append(("OpenForResponse", "Halted", f"Project halted: {h_reason}", gov_id))
    if stage == "Recalled" and h_reason:
        evs.append(("OpenForResponse", "Recalled", f"Project recalled: {h_reason}", gov_id))

    for fs, ts, note, actor in evs:
        cur.execute(
            "INSERT INTO project_events (project_id, actor_id, from_stage, to_stage, note) VALUES (%s, %s, %s, %s, %s) RETURNING id;",
            (proj_id, actor, fs, ts, note),
        )
        created_ids["project_events"].append(cur.fetchone()["id"])

def seed_database(conn, cur, admin_pwd: str, demo_pwd: str) -> dict[str, list]:
    created: dict[str, list] = {t: [] for t in TABLES}
    user_map = {}
    for acc in DEMO_ACCOUNTS:
        cur.execute("SELECT id, role FROM users WHERE email = %s;", (acc["email"],))
        ex = cur.fetchone()
        if ex:
            user_map[acc["email"]] = ex["id"]
            continue
        pwd = admin_pwd if acc["role"] == "Administrator" else demo_pwd
        p_hash = hash_password(pwd)
        cur.execute(
            """INSERT INTO users (full_name, email, role, password_hash, is_active, is_demo, city, organization, designation, avatar_key, must_change_password)
               VALUES (%s, %s, %s, %s, true, false, %s, %s, %s, %s, false) RETURNING id;""",
            (acc["full_name"], acc["email"], acc["role"], p_hash, acc["city"], acc["org"], acc["desig"], acc["avatar"]),
        )
        uid = cur.fetchone()["id"]
        created["users"].append(uid)
        user_map[acc["email"]] = uid

    gov_ids = [user_map[f"gov{i}@test.com"] for i in (1, 2, 3)]
    plan_ids = [user_map[f"planner{i}@test.com"] for i in (1, 2, 3)]
    cit_ids = [user_map[f"citizen{i}@test.com"] for i in range(1, 6)]
    now = datetime.now(timezone.utc)

    for i, p in enumerate(RAW_PROJECTS):
        g_id = gov_ids[i % len(gov_ids)]
        pl_id = plan_ids[i % len(plan_ids)]
        stg = p["stage"]
        dep, dl, s_dt, e_dt = build_project_timestamps(stg, now)
        status_v = "Approved" if stg in ("Approved", "OpenForResponse") else ("InProgress" if stg == "InProgress" else ("Completed" if stg == "Completed" else ("OnHold" if stg == "Halted" else ("Recalled" if stg == "Recalled" else "Proposed"))))
        p_name = p.get("prop_name")
        p_lat = p.get("prop_lat") if p_name else (p["lat"] if stg not in ("Draft", "Planner invited") else None)
        p_lng = p.get("prop_lng") if p_name else (p["lng"] if stg not in ("Draft", "Planner invited") else None)
        cur.execute(
            """INSERT INTO projects (title, description, status, category, city, city_name, budget, start_date, end_date,
               location_lat, location_lng, created_by, stage, deployed_at, response_deadline, halt_reason, is_demo,
               planner_id, planner_deploy_permitted, site_area_lat, site_area_lng, site_area_radius_km,
               proposed_site_name, proposed_site_explanation, proposed_site_lat, proposed_site_lng, proposal_rejection_reason)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, false, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;""",
            (p["title"], p["desc"], status_v, p["cat"], p["city"], p["cname"], p["b"] * 10_000_000, s_dt, e_dt,
             p["lat"], p["lng"], g_id, stg, dep, dl, p.get("halt_reason"), pl_id if stg != "Draft" else None,
             stg in ("Approved", "OpenForResponse", "InProgress", "Completed"), p["lat"], p["lng"], 2.5,
             p_name, p.get("prop_exp"), p_lat, p_lng, p.get("reject_reason")),
        )
        proj_id = cur.fetchone()["id"]
        created["projects"].append(proj_id)

        seed_events(cur, proj_id, g_id, pl_id, stg, p.get("reject_reason"), p.get("halt_reason"), created)

        if stg != "Draft":
            inv_st = "pending" if stg == "Planner invited" and not p.get("reject_reason") else "accepted"
            cur.execute("INSERT INTO project_invites (project_id, planner_id, invited_by, status) VALUES (%s, %s, %s, %s) RETURNING id;", (proj_id, pl_id, g_id, inv_st))
            created["project_invites"].append(cur.fetchone()["id"])

        if stg in ("OpenForResponse", "InProgress", "Completed"):
            for c_idx, (stc, body) in enumerate(SAMPLE_COMMENTS):
                cur.execute("INSERT INTO comments (project_id, user_id, stance, body, is_demo) VALUES (%s, %s, %s, %s, false) RETURNING id;", (proj_id, cit_ids[c_idx % len(cit_ids)], stc, body))
                created["comments"].append(cur.fetchone()["id"])
            for u_id in cit_ids[:3]:
                cur.execute("INSERT INTO project_follows (user_id, project_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (u_id, proj_id))
                created["project_follows"].append({"user_id": u_id, "project_id": proj_id})

        if p.get("site_change"):
            cur.execute(
                """INSERT INTO project_site_changes (project_id, status, reason, circle_lat, circle_lng, circle_radius_km, city, city_name, created_by)
                   VALUES (%s, 'requested', 'Traffic study suggests relocating 1.5 km east to preserve arterial throughput.', %s, %s, 3.0, %s, %s, %s) RETURNING id;""",
                (proj_id, p["lat"], p["lng"], p["city"], p["cname"], g_id),
            )
            created["project_site_changes"].append(cur.fetchone()["id"])

        if i in (15, 18):  # Deployed projects with chat
            for s_idx, msg in enumerate(SAMPLE_CHAT_MESSAGES):
                sndr = cit_ids[s_idx % len(cit_ids)] if s_idx % 2 == 0 else g_id
                cur.execute("INSERT INTO chat_messages (project_id, sender_id, body) VALUES (%s, %s, %s) RETURNING id;", (proj_id, sndr, msg))
                created["chat_messages"].append(cur.fetchone()["id"])
            cur.execute("INSERT INTO chat_pins (user_id, project_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (cit_ids[0], proj_id))
            created["chat_pins"].append({"user_id": cit_ids[0], "project_id": proj_id})

    for uid, kind, msg in [
        (plan_ids[0], "planner_invited", "You have been invited to review Kaloor Athletic Stadium Annex."),
        (gov_ids[0], "site_proposed", "Site proposed for Bandra Kurla Retail Pavilion."),
        (cit_ids[0], "project_deployed", "Marine Drive Boulevard Overhaul is now open for public feedback."),
    ]:
        cur.execute("INSERT INTO notifications (user_id, kind, message) VALUES (%s, %s, %s) RETURNING id;", (uid, kind, msg))
        created["notifications"].append(cur.fetchone()["id"])

    return created

def cleanup_database(cur, ids: dict) -> dict[str, int]:
    deleted = {}
    pin_del = 0
    for f in ids.get("chat_pins", []):
        cur.execute("DELETE FROM chat_pins WHERE user_id = %s AND project_id = %s;", (f["user_id"], f["project_id"]))
        pin_del += cur.rowcount
    deleted["chat_pins"] = pin_del

    for tbl, col in [
        ("notifications", "id"), ("chat_messages", "id"), ("comments", "id"),
        ("project_site_changes", "id"), ("project_invites", "id"), ("project_events", "id"),
    ]:
        del_cnt = 0
        if ids.get(tbl):
            cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s);", (ids[tbl],))
            del_cnt = cur.rowcount
        deleted[tbl] = del_cnt

    foll_del = 0
    for f in ids.get("project_follows", []):
        cur.execute("DELETE FROM project_follows WHERE user_id = %s AND project_id = %s;", (f["user_id"], f["project_id"]))
        foll_del += cur.rowcount
    deleted["project_follows"] = foll_del

    for tbl, col in [("projects", "id"), ("users", "id")]:
        del_cnt = 0
        if ids.get(tbl):
            cur.execute(f"DELETE FROM {tbl} WHERE {col} = ANY(%s);", (ids[tbl],))
            del_cnt = cur.rowcount
        deleted[tbl] = del_cnt

    return deleted

def print_summary(cur, host: str, header: str):
    print(f"Host: {host}")
    print(f"{header}")
    counts = get_row_counts(cur)
    for tbl, cnt in counts.items():
        print(f"  {tbl:<22}: {cnt}")

def main():
    parser = argparse.ArgumentParser(description="Seed or clean demo data for TERRANOVA AI.")
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument("--dry-run", action="store_true", help="Simulate seeding in a transaction and rollback.")
    mode_group.add_argument("--commit", action="store_true", help="Commit seeding (refuses unless host is neon.tech).")
    mode_group.add_argument("--cleanup", action="store_true", help="Delete rows created by previous commit.")
    parser.add_argument("--yes", action="store_true", help="Confirm deletion in cleanup mode. Without --yes, cleanup rolls back.")
    args = parser.parse_args()

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is required.", file=sys.stderr)
        sys.exit(1)

    parts = urlsplit(db_url)
    host = parts.hostname or "unknown"

    if args.commit and "neon.tech" not in host:
        print(f"ERROR: Refusing --commit on host '{host}'. Only permitted on hosts containing 'neon.tech'.", file=sys.stderr)
        sys.exit(1)

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            if args.cleanup:
                if not SEED_IDS_FILE.exists():
                    print(f"ERROR: {SEED_IDS_FILE} not found. Nothing to cleanup.", file=sys.stderr)
                    sys.exit(1)
                with open(SEED_IDS_FILE, "r", encoding="utf-8") as f:
                    saved_ids = json.load(f)
                valid, err = validate_cleanup_host(host, saved_ids.get("host"))
                if not valid:
                    print(f"ERROR: Cleanup refused. {err}", file=sys.stderr)
                    sys.exit(1)
                del_counts = cleanup_database(cur, saved_ids)
                print(f"Host: {host}")
                if args.yes:
                    conn.commit()
                    SEED_IDS_FILE.unlink(missing_ok=True)
                    print("Cleanup committed. Deleted rows per table:")
                    for tbl, cnt in del_counts.items():
                        print(f"  {tbl:<22}: {cnt}")
                else:
                    conn.rollback()
                    print("Cleanup simulation (dry-run). Rows that would be deleted (pass --yes to execute):")
                    for tbl, cnt in del_counts.items():
                        print(f"  {tbl:<22}: {cnt}")
                return

            admin_pwd = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Enter Administrator password: ")
            demo_pwd = os.environ.get("DEMO_PASSWORD")
            if not demo_pwd:
                print("ERROR: DEMO_PASSWORD environment variable is required.", file=sys.stderr)
                sys.exit(1)

            created_ids = seed_database(conn, cur, admin_pwd, demo_pwd)

            if args.dry_run:
                print_summary(cur, host, "Per-Table Counts (Dry-Run Simulation Before Rollback):")
                conn.rollback()
                print("Dry-run complete: Transaction successfully rolled back.")
            elif args.commit:
                created_ids["host"] = host
                conn.commit()
                REPORTS_DIR.mkdir(parents=True, exist_ok=True)
                with open(SEED_IDS_FILE, "w", encoding="utf-8") as f:
                    json.dump(created_ids, f, indent=2)
                print_summary(cur, host, "Per-Table Counts Post-Commit:")

if __name__ == "__main__":
    main()

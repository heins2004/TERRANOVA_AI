import argparse
import os
import sys
from datetime import datetime, timezone, timedelta
from urllib.parse import urlsplit, urlunsplit

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings

DEMO_PROJECTS_DATA = [
    {
        "name": "Marine Drive Link Road",
        "city": "kochi",
        "category": "Road",
        "budgetCrore": 186,
        "daysLeft": 21,
        "stage": "OpenForResponse",
        "lat": 9.98,
        "lng": 76.28,
        "description": "A four-lane arterial link road along the backwaters with a dedicated cycle track, continuous LED lighting, and two grade-separated pedestrian crossings.",
        "haltReason": None,
    },
    {
        "name": "District Hospital Wing",
        "city": "kochi",
        "category": "Hospital",
        "budgetCrore": 92,
        "daysLeft": 34,
        "stage": "OpenForResponse",
        "lat": 9.93,
        "lng": 76.27,
        "description": "A modern 200-bed multispecialty wing with an expanded pediatric trauma center, oxygen plant, and covered ambulance bay.",
        "haltReason": None,
    },
    {
        "name": "Whitefield Skywalk and Bus Bay",
        "city": "bengaluru",
        "category": "Road",
        "budgetCrore": 240,
        "daysLeft": 12,
        "stage": "OpenForResponse",
        "lat": 12.97,
        "lng": 77.75,
        "description": "An elevated covered pedestrian walkway linking the metro station directly to an integrated 8-berth bus transfer terminal.",
        "haltReason": None,
    },
    {
        "name": "Government Model School Block",
        "city": "pune",
        "category": "School",
        "budgetCrore": 38,
        "daysLeft": 45,
        "stage": "OpenForResponse",
        "lat": 18.52,
        "lng": 73.85,
        "description": "Twenty state-of-the-art digital classrooms, composite STEM laboratories, rooftop solar array, and a multipurpose turf sports field.",
        "haltReason": None,
    },
    {
        "name": "Sports Complex Annex",
        "city": "hyderabad",
        "category": "Stadium",
        "budgetCrore": 410,
        "daysLeft": 9,
        "stage": "OpenForResponse",
        "lat": 17.38,
        "lng": 78.48,
        "description": "A 15,000-seat multi-discipline indoor arena equipped for international gymnastics, badminton, and basketball competitions.",
        "haltReason": None,
    },
    {
        "name": "Riverside Retail Quarter",
        "city": "ahmedabad",
        "category": "Mall",
        "budgetCrore": 530,
        "daysLeft": 28,
        "stage": "OpenForResponse",
        "lat": 23.02,
        "lng": 72.57,
        "description": "A pedestrian-first commercial quarter built on an elevated flood-resilient podium, featuring open plazas and artisanal markets.",
        "haltReason": None,
    },
    {
        "name": "Outer Ring Road Phase 2",
        "city": "delhi",
        "category": "Road",
        "budgetCrore": 1250,
        "daysLeft": 17,
        "stage": "OpenForResponse",
        "lat": 28.61,
        "lng": 77.2,
        "description": "A 24 km expressway expansion featuring 6 cloverleaf interchanges, wildlife underpasses, and intelligent traffic management sensors.",
        "haltReason": None,
    },
    {
        "name": "Community Clinic",
        "city": "mumbai",
        "category": "Hospital",
        "budgetCrore": 24,
        "daysLeft": 52,
        "stage": "OpenForResponse",
        "lat": 19.07,
        "lng": 72.88,
        "description": "A localized primary healthcare center providing free maternal care, immunization, diagnostics, and 24/7 emergency stabilization.",
        "haltReason": None,
    },
    {
        "name": "Riverfront Walkway",
        "city": "chennai",
        "category": "Park",
        "budgetCrore": 64,
        "daysLeft": 0,
        "stage": "InProgress",
        "lat": 13.03,
        "lng": 80.26,
        "description": "A 3 km ecological riverside promenade featuring native mangrove planting, energy-efficient solar lanterns, and open-air exercise hubs.",
        "haltReason": None,
    },
    {
        "name": "Bypass Junction Upgrade",
        "city": "kochi",
        "category": "Road",
        "budgetCrore": 78,
        "daysLeft": 0,
        "stage": "Completed",
        "lat": 10.1,
        "lng": 76.35,
        "description": "A grade-separated underpass that replaced a notorious bottleneck intersection, reducing junction transit wait times by 80%.",
        "haltReason": None,
    },
    {
        "name": "Mall Redevelopment",
        "city": "mumbai",
        "category": "Mall",
        "budgetCrore": 320,
        "daysLeft": 0,
        "stage": "Halted",
        "lat": 19.07,
        "lng": 72.88,
        "description": "Comprehensive redevelopment of an ageing suburban commercial center into a mixed-use retail and co-working campus.",
        "haltReason": "The owning official halted this project pending a fresh environmental review and stormwater impact assessment.",
    },
]


def get_target_db_url() -> str:
    settings = get_settings()
    override_url = os.getenv("MIGRATION_DATABASE_URL")
    override_db = os.getenv("MIGRATION_DB_NAME")
    if override_url:
        return override_url
    if override_db:
        parts = urlsplit(settings.database_url)
        return urlunsplit((parts.scheme, parts.netloc, f"/{override_db}", parts.query, parts.fragment))
    return settings.database_url


def seed_demo_projects(remove: bool = False) -> None:
    # 1. Validation checks
    if os.getenv("SEED_DEMO") != "1":
        print("ERROR: seed_demo refuses to run unless SEED_DEMO=1 is set in the environment.")
        sys.exit(1)

    settings = get_settings()
    if settings.app_env == "production":
        print("ERROR: seed_demo refuses to run in production environment (settings.app_env == 'production').")
        sys.exit(1)

    db_url = get_target_db_url()

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Handle --remove
            if remove:
                cur.execute("DELETE FROM projects WHERE is_demo = true;")
                deleted_count = cur.rowcount
                conn.commit()
                print(f"Removed {deleted_count} demo projects (rows where is_demo = true).")
                return

            # Ensure user gov@test.com exists with role Government Official
            cur.execute("SELECT id, role FROM users WHERE email = %s;", ("gov@test.com",))
            gov_user = cur.fetchone()
            if not gov_user or gov_user["role"] != "Government Official":
                print("ERROR: User 'gov@test.com' with role 'Government Official' is required to seed demo projects.")
                sys.exit(1)

            gov_user_id = gov_user["id"]
            now = datetime.now(timezone.utc)

            inserted_count = 0
            skipped_count = 0

            for p in DEMO_PROJECTS_DATA:
                title = p["name"]
                # Idempotency check: skip if row with same title and is_demo = true exists
                cur.execute(
                    "SELECT 1 FROM projects WHERE title = %s AND is_demo = true;",
                    (title,),
                )
                if cur.fetchone():
                    skipped_count += 1
                    continue

                city = p["city"].strip().lower()
                category = p["category"]
                budget = p["budgetCrore"] * 10_000_000
                stage = p["stage"]
                lat = p["lat"]
                lng = p["lng"]
                description = p["description"]
                days_left = p["daysLeft"]
                halt_reason = p["haltReason"]

                if stage == "OpenForResponse":
                    deployed_at = now - timedelta(days=5)
                    response_deadline = now + timedelta(days=days_left)
                    status = "Approved"
                    halt_reason = None
                elif stage == "InProgress":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status = "InProgress"
                    halt_reason = None
                elif stage == "Completed":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status = "Completed"
                    halt_reason = None
                elif stage == "Halted":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status = "OnHold"
                else:
                    deployed_at = now
                    response_deadline = None
                    status = "Proposed"

                cur.execute(
                    """
                    INSERT INTO projects (
                        title, description, status, category, city, budget,
                        location_lat, location_lng, created_by, stage,
                        deployed_at, response_deadline, halt_reason, is_demo,
                        created_at, updated_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s
                    );
                    """,
                    (
                        title,
                        description,
                        status,
                        category,
                        city,
                        budget,
                        lat,
                        lng,
                        gov_user_id,
                        stage,
                        deployed_at,
                        response_deadline,
                        halt_reason,
                        True,
                        deployed_at,
                        now,
                    ),
                )
                inserted_count += 1

            conn.commit()
            print(f"Demo seed complete: {inserted_count} inserted, {skipped_count} skipped.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed or remove demo projects.")
    parser.add_argument(
        "--remove",
        action="store_true",
        help="Remove all demo projects (is_demo = true).",
    )
    args = parser.parse_args()
    seed_demo_projects(remove=args.remove)


if __name__ == "__main__":
    main()

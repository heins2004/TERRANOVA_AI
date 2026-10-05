import argparse
import os
import sys
from datetime import datetime, timezone, timedelta
from typing import Any
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

DEMO_STANCE_TARGETS = {
    "Marine Drive Link Road": {"support": 212, "concern": 64, "neutral": 48},
    "District Hospital Wing": {"support": 301, "concern": 22, "neutral": 40},
    "Whitefield Skywalk and Bus Bay": {"support": 140, "concern": 190, "neutral": 60},
    "Government Model School Block": {"support": 160, "concern": 8, "neutral": 20},
    "Sports Complex Annex": {"support": 120, "concern": 150, "neutral": 70},
    "Riverside Retail Quarter": {"support": 90, "concern": 170, "neutral": 44},
    "Outer Ring Road Phase 2": {"support": 260, "concern": 330, "neutral": 90},
    "Community Clinic": {"support": 75, "concern": 6, "neutral": 18},
    "Riverfront Walkway": {"support": 180, "concern": 40, "neutral": 30},
    "Bypass Junction Upgrade": {"support": 310, "concern": 25, "neutral": 60},
    "Mall Redevelopment": {"support": 88, "concern": 210, "neutral": 35},
}

DEMO_USER_NAMES = [
    "Aarav Sharma", "Aditi Rao", "Ajay Verma", "Alok Gupta", "Amrita Nair",
    "Anand Iyer", "Anita Roy", "Ankit Mishra", "Archana Patel", "Arjun Das",
    "Bhavna Shah", "Chetan Joshi", "Deepak Kumar", "Divya Menon", "Gaurav Malhotra",
    "Geeta Pillai", "Harish Reddy", "Indira Sen", "Jaya Bhat", "Karan Mehta",
    "Kavita Deshmukh", "Kiran Kulkarni", "Lata Saxena", "Madhavan Nambiar", "Manoj Tiwari",
    "Meenakshi Sundaram", "Mohan Prasad", "Nandini Bose", "Naveen Hegde", "Neelam Choudhary",
    "Nikhil Agarwal", "Pooja Pandey", "Pradeep Sethi", "Prakash Sinha", "Priya Swaminathan",
    "Rahul Kapoor", "Rajesh Chauhan", "Ramesh Pillai", "Rani Mukherjee", "Rashmi Bhatia",
    "Ravi Venkatesh", "Rekha Nair", "Ritu Singhania", "Rohan Bhattacharya", "Rohit Kaushik",
    "Sandhya Ranganathan", "Sanjay Tripathi", "Sarita Varma", "Shalini Saxena", "Shashi Shekhar",
    "Sneha Namboodiri", "Srinivas Rao", "Suman Banerjee", "Suresh Prabhu", "Swati Mahajan",
    "Tarun Gopinath", "Uma Raman", "Varun Somayaji", "Vidya Krishnan", "Vijay Raghavan",
]

SUPPORT_BODIES = [
    "This initiative will bring significant long-term improvements to neighborhood infrastructure.",
    "Great proposal. This will definitely help ease congestion and improve overall connectivity.",
    "Strongly in favor of this development. It addresses a long-standing need for the community.",
    "The environmental considerations and sustainability measures in the plan look very promising.",
    "Excited to see this moving forward. The planned facilities will benefit families and local residents.",
    "Well-thought-out plan with clear public benefits. Fully support this capital investment.",
    "This will greatly enhance accessibility and safety for daily commuters and pedestrians.",
    "A modern, forward-looking design that meets the growing demands of our expanding community.",
    "Pleased to see focus on energy efficiency and modern construction standards in this project.",
    "The proposed timeline seems realistic and the expected outcomes justify the resource allocation.",
    "This will provide much-needed modernization while upgrading essential public amenities.",
    "A commendable effort by the planners to balance development with community needs.",
    "Very pleased with this proposal. It will significantly enhance our local living standards.",
    "Supportive of the project scope. Looking forward to timely execution.",
    "A valuable addition to the city master plan that will serve future generations well.",
]

CONCERN_BODIES = [
    "Traffic management during the construction phase needs careful planning to avoid severe bottlenecks.",
    "Please ensure adequate noise barriers are installed to protect nearby residential complexes.",
    "The drainage capacity must be thoroughly evaluated to prevent localized waterlogging during monsoons.",
    "Pedestrian safety measures around the construction zone should be clearly outlined and monitored.",
    "Dust suppression and air quality monitoring must be strictly enforced during excavation work.",
    "Are there provisions for adequate parking spaces to avoid vehicle spillover into adjacent streets?",
    "The impact on existing utility lines, especially water and electricity, needs to be minimized.",
    "Clear detour signage and alternative transit routes must be established before construction starts.",
    "Please consider the safety of school children and senior citizens who cross this area daily.",
    "Waste management plans during construction should be made transparent and audited regularly.",
    "Nighttime construction activities should be limited to prevent noise disturbances to residents.",
    "Sufficient emergency vehicle access routes must be maintained at all times during civil works.",
    "Green cover removal should be compensated with adequate afforestation in the immediate vicinity.",
    "The budget allocation should include a contingency fund for unforeseen maintenance challenges.",
    "Structural safety inspections should be conducted by independent third-party agencies.",
]

NEUTRAL_BODIES = [
    "Could the planning authority publish the detailed phased milestone schedule for the public?",
    "When will the comprehensive environmental impact assessment report be available for review?",
    "Are regular public informational briefings planned during the active implementation stages?",
    "Will real-time project progress updates and status dashboards be accessible online?",
    "It would be helpful to have a dedicated grievance redressal helpline during construction.",
    "Can the municipal council share the estimated operational and recurring maintenance costs?",
    "Requesting clarification on the exact land acquisition boundaries and compensation mechanisms.",
    "Will local vendors and service providers be given opportunities during the tendering phase?",
    "How will integration with existing public transportation networks be coordinated?",
    "Please clarify whether utility relocation schedules have been coordinated with service providers.",
    "Is there an established protocol for regular air and noise pollution monitoring reports?",
    "What are the designated hours of operation for heavy transport vehicles visiting the site?",
    "Can the detailed architectural drawings and floor plans be displayed at the ward office?",
    "Requesting details on the projected completion date and milestone review checkpoints.",
    "Will there be regular safety audit reports published during the development phase?",
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


def calculate_stance_commenters(raw_count: int) -> int:
    if raw_count <= 0:
        return 0
    cnt = int(round(raw_count * 0.09))
    return max(1, cnt)


def seed_demo_data(remove: bool = False) -> None:
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
                cur.execute("DELETE FROM comments WHERE is_demo = true;")
                deleted_comments = cur.rowcount
                cur.execute("DELETE FROM projects WHERE is_demo = true;")
                deleted_projects = cur.rowcount
                cur.execute("DELETE FROM users WHERE is_demo = true;")
                deleted_users = cur.rowcount
                conn.commit()
                print(
                    f"Removed demo data: {deleted_comments} comments, "
                    f"{deleted_projects} projects, {deleted_users} users (is_demo = true)."
                )
                return

            # Ensure user gov@test.com exists with role Government Official
            cur.execute("SELECT id, role FROM users WHERE email = %s;", ("gov@test.com",))
            gov_user = cur.fetchone()
            if not gov_user or gov_user["role"] != "Government Official":
                print("ERROR: User 'gov@test.com' with role 'Government Official' is required to seed demo projects.")
                sys.exit(1)

            gov_user_id = gov_user["id"]
            now = datetime.now(timezone.utc)

            # 2. Seed / ensure demo projects
            inserted_projects = 0
            skipped_projects = 0

            for p in DEMO_PROJECTS_DATA:
                title = p["name"]
                cur.execute(
                    "SELECT id FROM projects WHERE title = %s AND is_demo = true;",
                    (title,),
                )
                if cur.fetchone():
                    skipped_projects += 1
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
                    status_val = "Approved"
                    halt_reason = None
                elif stage == "InProgress":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status_val = "InProgress"
                    halt_reason = None
                elif stage == "Completed":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status_val = "Completed"
                    halt_reason = None
                elif stage == "Halted":
                    deployed_at = now - timedelta(days=60)
                    response_deadline = None
                    status_val = "OnHold"
                else:
                    deployed_at = now
                    response_deadline = None
                    status_val = "Proposed"

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
                        status_val,
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
                inserted_projects += 1

            # 3. Seed 60 demo users
            inserted_users = 0
            skipped_users = 0

            for i in range(1, 61):
                email = f"demo-user-{i:02d}@example.com"
                full_name = DEMO_USER_NAMES[i - 1]
                cur.execute("SELECT 1 FROM users WHERE email = %s;", (email,))
                if cur.fetchone():
                    skipped_users += 1
                    continue

                cur.execute(
                    """
                    INSERT INTO users (
                        email, password_hash, full_name, role, is_active, is_demo, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, now()
                    );
                    """,
                    (
                        email,
                        "!",
                        full_name,
                        "Citizen",
                        False,
                        True,
                    ),
                )
                inserted_users += 1

            # Fetch all 60 demo users in deterministic order
            cur.execute(
                "SELECT id, email, full_name FROM users WHERE is_demo = true ORDER BY email ASC;"
            )
            demo_users = cur.fetchall()
            if len(demo_users) < 60:
                print(f"ERROR: Expected 60 demo users, found {len(demo_users)}.")
                sys.exit(1)

            # 4. Seed comments for demo projects in OpenForResponse, InProgress, Completed, Halted
            inserted_comments = 0
            skipped_comment_projects = 0

            cur.execute(
                """
                SELECT id, title, stage
                FROM projects
                WHERE is_demo = true AND stage IN ('OpenForResponse', 'InProgress', 'Completed', 'Halted')
                ORDER BY id ASC;
                """
            )
            demo_projects = cur.fetchall()

            for proj_idx, proj in enumerate(demo_projects):
                proj_id = proj["id"]
                title = proj["title"]
                stage = proj["stage"]

                # Idempotency check: skip if project already has demo comments
                cur.execute(
                    "SELECT 1 FROM comments WHERE project_id = %s AND is_demo = true LIMIT 1;",
                    (proj_id,),
                )
                if cur.fetchone():
                    skipped_comment_projects += 1
                    continue

                raw_targets = DEMO_STANCE_TARGETS.get(
                    title, {"support": 0, "concern": 0, "neutral": 0}
                )
                s_count = calculate_stance_commenters(raw_targets["support"])
                c_count = calculate_stance_commenters(raw_targets["concern"])
                n_count = calculate_stance_commenters(raw_targets["neutral"])

                total_requested = s_count + c_count + n_count
                if total_requested > 60:
                    excess = total_requested - 60
                    # Trim neutral first, then concern to keep under 60
                    if n_count > excess:
                        n_count -= excess
                    else:
                        excess -= n_count
                        n_count = 0
                        c_count = max(0, c_count - excess)
                    total_requested = s_count + c_count + n_count

                # Form ordered list of (stance, body_list)
                stance_assignments: list[tuple[str, list[str]]] = []
                for _ in range(s_count):
                    stance_assignments.append(("Support", SUPPORT_BODIES))
                for _ in range(c_count):
                    stance_assignments.append(("Concern", CONCERN_BODIES))
                for _ in range(n_count):
                    stance_assignments.append(("Neutral", NEUTRAL_BODIES))

                # Spread created_at deterministically over past 20 days
                # Oldest first: k=0 has oldest created_at, k=total_requested-1 has newest
                created_top_level: list[dict[str, Any]] = []
                for k, (stance, body_pool) in enumerate(stance_assignments):
                    user = demo_users[k]
                    body_idx = (proj_idx * 7 + k * 3) % len(body_pool)
                    body = body_pool[body_idx]

                    # Deterministic date between 19.5 days ago and 0.5 days ago
                    fraction = k / max(1, total_requested - 1) if total_requested > 1 else 0.5
                    days_ago = 19.5 - (19.0 * fraction)
                    minute_offset = (k * 43) % 1440
                    comment_created_at = now - timedelta(days=days_ago, minutes=minute_offset)

                    cur.execute(
                        """
                        INSERT INTO comments (
                            project_id, user_id, parent_id, stance, body, is_demo, created_at
                        ) VALUES (
                            %s, %s, NULL, %s, %s, true, %s
                        ) RETURNING id, created_at;
                        """,
                        (proj_id, user["id"], stance, body, comment_created_at),
                    )
                    row = cur.fetchone()
                    created_top_level.append(row)
                    inserted_comments += 1

                # If stage is OpenForResponse, add one reply by gov@test.com on its first comment
                if stage == "OpenForResponse" and created_top_level:
                    # Find earliest comment (first chronologically)
                    first_comment = min(created_top_level, key=lambda c: c["created_at"])
                    gov_body = (
                        "Thank you for participating in this public consultation. "
                        "The municipal team is reviewing all submitted feedback."
                    )
                    gov_created_at = first_comment["created_at"] + timedelta(hours=3)
                    cur.execute(
                        """
                        INSERT INTO comments (
                            project_id, user_id, parent_id, stance, body, is_demo, created_at
                        ) VALUES (
                            %s, %s, %s, NULL, %s, true, %s
                        );
                        """,
                        (proj_id, gov_user_id, first_comment["id"], gov_body, gov_created_at),
                    )
                    inserted_comments += 1

            conn.commit()
            print(
                f"Demo seed complete: {inserted_projects} projects inserted ({skipped_projects} skipped), "
                f"{inserted_users} users inserted ({skipped_users} skipped), "
                f"{inserted_comments} comments inserted ({skipped_comment_projects} projects skipped)."
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed or remove demo data.")
    parser.add_argument(
        "--remove",
        action="store_true",
        help="Remove all demo data (is_demo = true for comments, projects, users).",
    )
    args = parser.parse_args()
    seed_demo_data(remove=args.remove)


if __name__ == "__main__":
    main()

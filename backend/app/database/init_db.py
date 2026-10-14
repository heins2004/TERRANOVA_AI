import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings
from app.database.connection import get_connection


CREATE_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Citizen',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_key TEXT NOT NULL DEFAULT 'avatar-01',
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

ADD_ROLE_COLUMN_SQL = """
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'Citizen';
"""

ADD_IS_ACTIVE_COLUMN_SQL = """
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
"""

ADD_PROFILE_COLUMNS_SQL = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS expertise VARCHAR(300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key TEXT NOT NULL DEFAULT 'avatar-01';
"""

ADD_MUST_CHANGE_PASSWORD_COLUMN_SQL = """
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
"""

CREATE_SESSIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_PROJECTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Proposed',
    category VARCHAR(100),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    budget NUMERIC(14,2),
    start_date DATE,
    end_date DATE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

ADD_PROJECT_CITY_COLUMN_SQL = """
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city VARCHAR(100);
"""

ADD_CANDIDATE_SITE_ID_TO_PROJECTS_SQL = """
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS candidate_site_id INTEGER REFERENCES candidate_sites(id) ON DELETE SET NULL;
"""

CREATE_COMPLAINTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_PLANNING_DOCUMENTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS planning_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_size_bytes INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_CONSULTATIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Upcoming',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_CONSULTATION_FEEDBACK_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS consultation_feedback (
    id SERIAL PRIMARY KEY,
    consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    submitted_by INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_POSTGIS_EXTENSION_SQL = """
CREATE EXTENSION IF NOT EXISTS postgis;
"""

CREATE_STUDY_AREAS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS study_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_CANDIDATE_SITES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS candidate_sites (
    id SERIAL PRIMARY KEY,
    study_area_id INTEGER NOT NULL REFERENCES study_areas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    location GEOMETRY(Point, 4326) NOT NULL,
    area_size_acres NUMERIC(10,2),
    land_use VARCHAR(100),
    suitability_status VARCHAR(50) NOT NULL DEFAULT 'RequiresReview',
    availability_status VARCHAR(50) NOT NULL DEFAULT 'VerificationRequired',
    ownership_type VARCHAR(50) NOT NULL DEFAULT 'Unknown',
    flood_risk VARCHAR(50) NOT NULL DEFAULT 'Unknown',
    notes TEXT,
    promoted_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

CREATE_CANDIDATE_SITE_PROXIMITY_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS candidate_site_proximity (
    id SERIAL PRIMARY KEY,
    candidate_site_id INTEGER NOT NULL REFERENCES candidate_sites(id) ON DELETE CASCADE,
    amenity_type TEXT NOT NULL,
    name TEXT,
    distance_meters NUMERIC NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_candidate_site_proximity_site_id
    ON candidate_site_proximity (candidate_site_id);
"""

CREATE_OSM_LAYER_CACHE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS osm_layer_cache (
    id SERIAL PRIMARY KEY,
    grid_cell_key TEXT NOT NULL,
    layer_type TEXT NOT NULL,
    geojson JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_osm_layer_cache_cell_type
    ON osm_layer_cache (grid_cell_key, layer_type);
"""

DEFAULT_TEST_USERS = [
    {"full_name": "Citizen User", "email": "citizen@test.com", "role": "Citizen"},
    {"full_name": "Urban Planner User", "email": "planner@test.com", "role": "Urban Planner"},
    {"full_name": "Government Official User", "email": "gov@test.com", "role": "Government Official"},
    {"full_name": "Administrator User", "email": "admin@test.com", "role": "Administrator"},
]


DEFAULT_DEMO_PROJECTS = [
    {
        "title": "Bengaluru Outer Ring Transit Expansion",
        "description": "Integration of metro line with peripheral ring corridors and multimodal transit hubs.",
        "status": "InProgress",
        "category": "Transportation",
        "city": "bengaluru",
        "budget": 15000000.00,
        "location_lat": 12.9716,
        "location_lng": 77.5946,
    },
    {
        "title": "Mumbai Coastal Freeway Phase 2",
        "description": "High-capacity arterial expressway connecting northern suburbs with coastal greenways.",
        "status": "Approved",
        "category": "Infrastructure",
        "city": "mumbai",
        "budget": 28000000.00,
        "location_lat": 19.0760,
        "location_lng": 72.8777,
    },
    {
        "title": "Delhi Smart Solar & Grid Modernization",
        "description": "Decentralized rooftop solar distribution network and real-time power metering across government zones.",
        "status": "Completed",
        "category": "Energy",
        "city": "delhi",
        "budget": 8500000.00,
        "location_lat": 28.7041,
        "location_lng": 77.1025,
    },
    {
        "title": "Hyderabad Bio-Tech Logistics Hub",
        "description": "Eco-industrial corridor with zero-emission freight zones and automated warehousing.",
        "status": "OnHold",
        "category": "Urban Development",
        "city": "hyderabad",
        "budget": 12000000.00,
        "location_lat": 17.3850,
        "location_lng": 78.4867,
    },
    {
        "title": "Kochi Backwaters Eco-Restoration",
        "description": "Wetland conservation, stormwater canal desilting, and sustainable public water transit.",
        "status": "Proposed",
        "category": "Environmental",
        "city": "kochi",
        "budget": 4500000.00,
        "location_lat": 9.9312,
        "location_lng": 76.2673,
    },
]


def init_db(database_url: str | None = None, app_env: str | None = None) -> None:
    settings = get_settings()
    current_env = app_env if app_env is not None else settings.app_env

    connection_context = (
        psycopg.connect(database_url, row_factory=dict_row)
        if database_url
        else get_connection()
    )

    with connection_context as connection:
        with connection.cursor() as cursor:
            cursor.execute(CREATE_USERS_TABLE_SQL)
            cursor.execute(ADD_ROLE_COLUMN_SQL)
            cursor.execute(ADD_IS_ACTIVE_COLUMN_SQL)
            cursor.execute(ADD_PROFILE_COLUMNS_SQL)
            cursor.execute(ADD_MUST_CHANGE_PASSWORD_COLUMN_SQL)
            cursor.execute(CREATE_SESSIONS_TABLE_SQL)
            cursor.execute(CREATE_PROJECTS_TABLE_SQL)
            cursor.execute(ADD_PROJECT_CITY_COLUMN_SQL)
            cursor.execute(CREATE_COMPLAINTS_TABLE_SQL)
            cursor.execute(CREATE_PLANNING_DOCUMENTS_TABLE_SQL)
            cursor.execute(CREATE_CONSULTATIONS_TABLE_SQL)
            cursor.execute(CREATE_CONSULTATION_FEEDBACK_TABLE_SQL)
            cursor.execute(CREATE_POSTGIS_EXTENSION_SQL)
            cursor.execute(CREATE_STUDY_AREAS_TABLE_SQL)
            cursor.execute(CREATE_CANDIDATE_SITES_TABLE_SQL)
            # Add candidate_site_id FK on projects AFTER candidate_sites exists
            cursor.execute(ADD_CANDIDATE_SITE_ID_TO_PROJECTS_SQL)
            cursor.execute(CREATE_CANDIDATE_SITE_PROXIMITY_TABLE_SQL)
            cursor.execute(CREATE_OSM_LAYER_CACHE_TABLE_SQL)

            if current_env == "development":
                # Ensure default test users exist on fresh setup
                from app.core.security import hash_password
                default_hash = hash_password("12345678")
                for u in DEFAULT_TEST_USERS:
                    cursor.execute(
                        """
                        INSERT INTO users (full_name, email, role, password_hash)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (email) DO NOTHING
                        """,
                        (u["full_name"], u["email"], u["role"], default_hash),
                    )

                # Ensure demo projects with varied statuses exist on setup
                cursor.execute("SELECT id FROM users WHERE email = %s", ("planner@test.com",))
                planner_row = cursor.fetchone()
                planner_user_id = planner_row["id"] if planner_row else None
                if not planner_user_id:
                    cursor.execute("SELECT id FROM users ORDER BY id ASC LIMIT 1")
                    first_row = cursor.fetchone()
                    planner_user_id = first_row["id"] if first_row else 1

                for p in DEFAULT_DEMO_PROJECTS:
                    cursor.execute(
                        """
                        INSERT INTO projects (title, description, status, category, city, budget, location_lat, location_lng, created_by)
                        SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s
                        WHERE NOT EXISTS (
                            SELECT 1 FROM projects WHERE title = %s
                        )
                        """,
                        (
                            p["title"],
                            p["description"],
                            p["status"],
                            p["category"],
                            p["city"],
                            p["budget"],
                            p["location_lat"],
                            p["location_lng"],
                            planner_user_id,
                            p["title"],
                        ),
                    )
                seeded = True
            else:
                seeded = False

        connection.commit()

    status_str = "seeded" if seeded else "not seeded"
    print(f"APP_ENV={current_env}: test accounts and demo data {status_str}.")




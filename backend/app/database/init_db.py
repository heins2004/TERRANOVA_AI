from app.database.connection import get_connection


CREATE_USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Citizen',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
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

CREATE_INFRASTRUCTURE_ASSETS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS infrastructure_assets (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'Good',
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    last_inspected_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

ADD_PROJECT_CITY_COLUMN_SQL = """
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city VARCHAR(100);
"""

ADD_INFRASTRUCTURE_CITY_COLUMN_SQL = """
ALTER TABLE infrastructure_assets ADD COLUMN IF NOT EXISTS city VARCHAR(100);
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


def init_db() -> None:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(CREATE_USERS_TABLE_SQL)
            cursor.execute(ADD_ROLE_COLUMN_SQL)
            cursor.execute(ADD_IS_ACTIVE_COLUMN_SQL)
            cursor.execute(CREATE_SESSIONS_TABLE_SQL)
            cursor.execute(CREATE_PROJECTS_TABLE_SQL)
            cursor.execute(CREATE_INFRASTRUCTURE_ASSETS_TABLE_SQL)
            cursor.execute(ADD_PROJECT_CITY_COLUMN_SQL)
            cursor.execute(ADD_INFRASTRUCTURE_CITY_COLUMN_SQL)
            cursor.execute(CREATE_COMPLAINTS_TABLE_SQL)
            cursor.execute(CREATE_PLANNING_DOCUMENTS_TABLE_SQL)
            cursor.execute(CREATE_CONSULTATIONS_TABLE_SQL)
            cursor.execute(CREATE_CONSULTATION_FEEDBACK_TABLE_SQL)
        connection.commit()

-- clean_for_production.sql
-- PLAN ONLY: DO NOT RUN WITHOUT EXPLICIT CONFIRMATION.
-- Empties application runtime tables, removes demo/test users, keeps ONE administrator.

BEGIN;

-- 1. Remove project dependent records
TRUNCATE TABLE
    chat_reads,
    chat_pins,
    chat_messages,
    project_site_changes,
    project_consultation_invites,
    project_consultations,
    consultation_feedback,
    consultations,
    complaints,
    planning_documents,
    candidate_site_proximity,
    candidate_sites,
    study_areas,
    osm_layer_cache,
    notifications,
    comments,
    project_follows,
    project_invites,
    project_events,
    projects
RESTART IDENTITY CASCADE;

-- 2. Clean login logs, sessions, planner credentials
TRUNCATE TABLE
    login_events,
    user_sessions,
    planner_credentials
RESTART IDENTITY CASCADE;

-- 3. Delete non-admin, test, and demo users, keeping exactly ONE primary Administrator
DELETE FROM users
WHERE id NOT IN (
    SELECT id FROM users
    WHERE role = 'Administrator'
    ORDER BY id ASC
    LIMIT 1
);

-- Reset sequence for users if any remaining admin
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

-- 4. Print remaining counts for verification
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'project_events', COUNT(*) FROM project_events
UNION ALL
SELECT 'project_site_changes', COUNT(*) FROM project_site_changes
UNION ALL
SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'project_follows', COUNT(*) FROM project_follows
UNION ALL
SELECT 'login_events', COUNT(*) FROM login_events
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions;

COMMIT;

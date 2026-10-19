-- Migration: 0010_login_events.sql
-- Table login_events for audit of successful logins (no IP stored)

CREATE TABLE IF NOT EXISTS login_events (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_in_at timestamptz NOT NULL DEFAULT now(),
    browser varchar(40)
);

CREATE INDEX IF NOT EXISTS idx_login_events_logged_in_at ON login_events (logged_in_at);
CREATE INDEX IF NOT EXISTS idx_login_events_user_logged_in_at ON login_events (user_id, logged_in_at);

-- Migration: 0005_notifications.sql
-- Add notifications table and index for in-app user notifications

CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_id integer REFERENCES project_events(id) ON DELETE SET NULL,
    kind varchar(50) NOT NULL,
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
ON notifications (user_id, read_at, created_at);

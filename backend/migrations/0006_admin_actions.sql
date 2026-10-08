-- Migration: 0006_admin_actions.sql
-- Table admin_actions for administrative audit logging, and phone column on users

CREATE TABLE IF NOT EXISTS admin_actions (
    id serial PRIMARY KEY,
    admin_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL,
    target_user_id integer REFERENCES users(id) ON DELETE SET NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions (target_user_id, created_at DESC);

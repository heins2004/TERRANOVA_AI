-- Migration: 0003_comments_follows.sql
-- Additive and idempotent comments, follows, and users.is_demo

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS comments (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id),
    parent_id integer REFERENCES comments(id) ON DELETE CASCADE,
    stance varchar(10),
    body text NOT NULL,
    is_demo boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_follows (
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_project_parent ON comments (project_id, parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_follows_project ON project_follows (project_id);

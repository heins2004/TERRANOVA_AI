-- Migration: 0004_government_workflow.sql
-- Additive and idempotent government workflow schema

ALTER TABLE users ADD COLUMN IF NOT EXISTS city varchar(100);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS planner_id integer REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planner_deadline timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planner_deploy_permitted boolean NOT NULL DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposed_site_name varchar(200);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposed_site_explanation text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposed_site_lat double precision;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposed_site_lng double precision;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposal_rejection_reason text;

CREATE TABLE IF NOT EXISTS project_invites (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    planner_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz
);

CREATE TABLE IF NOT EXISTS project_events (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    actor_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_stage varchar(50) NOT NULL,
    to_stage varchar(50) NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_events_project ON project_events (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_invites_project ON project_invites (project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_invites_planner ON project_invites (planner_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_planner ON projects (planner_id);

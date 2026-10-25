-- Migration: 0017_project_site_changes.sql
-- Add project site changes table for OpenForResponse projects

CREATE TABLE IF NOT EXISTS project_site_changes (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status varchar(32) NOT NULL,
    reason text NOT NULL,
    circle_lat double precision,
    circle_lng double precision,
    circle_radius_km double precision,
    proposed_site_name varchar(255),
    proposed_site_explanation text,
    proposed_site_lat double precision,
    proposed_site_lng double precision,
    rejection_reason text,
    created_by integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_site_changes_project_id ON project_site_changes (project_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_site_changes_open ON project_site_changes (project_id)
WHERE status IN ('requested', 'proposed', 'approved', 'rejected');

-- REVERSE SQL:
-- DROP INDEX IF EXISTS uq_project_site_changes_open;
-- DROP INDEX IF EXISTS idx_project_site_changes_project_id;
-- DROP TABLE IF EXISTS project_site_changes;

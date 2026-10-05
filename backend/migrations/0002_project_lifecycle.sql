-- Migration: 0002_project_lifecycle.sql
-- Additive and idempotent project lifecycle columns and index

ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage varchar(30) NOT NULL DEFAULT 'Draft';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployed_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS response_deadline timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS halt_reason text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_projects_public ON projects (stage, deployed_at DESC);

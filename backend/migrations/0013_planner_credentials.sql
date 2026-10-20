-- Migration: 0013_planner_credentials.sql
-- Planner credential verification table and legacy backfill

CREATE TABLE IF NOT EXISTS planner_credentials (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    registration_number varchar(60),
    body_name varchar(120),
    document_path varchar(500),
    document_original_name varchar(150),
    document_mime varchar(40),
    document_size integer,
    status varchar(20) NOT NULL DEFAULT 'Unsubmitted' CHECK (status IN ('Unsubmitted', 'Pending', 'Verified', 'Rejected')),
    rejection_reason text,
    submitted_at timestamptz,
    reviewed_at timestamptz,
    reviewed_by integer REFERENCES users(id) ON DELETE SET NULL,
    is_backfilled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_planner_credentials_size CHECK (
        document_size IS NULL OR (document_size >= 1 AND document_size <= 5242880)
    ),
    CONSTRAINT chk_planner_credentials_rejection_reason CHECK (
        (status = 'Rejected' AND rejection_reason IS NOT NULL AND length(trim(rejection_reason)) >= 10 AND length(rejection_reason) <= 500) OR
        (status != 'Rejected' AND rejection_reason IS NULL)
    ),
    CONSTRAINT chk_planner_credentials_submission_fields CHECK (
        (status = 'Unsubmitted') OR
        (status = 'Verified' AND is_backfilled = true) OR
        (registration_number IS NOT NULL AND trim(registration_number) != '' AND
         document_path IS NOT NULL AND
         document_original_name IS NOT NULL AND
         document_mime IS NOT NULL AND
         document_size IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_planner_credentials_status ON planner_credentials (status);

-- Allow user-level notifications without an associated project (e.g. planner credential verification/rejection)
ALTER TABLE notifications ALTER COLUMN project_id DROP NOT NULL;

-- Backfill: create a Verified credentials record for every existing Urban Planner
INSERT INTO planner_credentials (user_id, status, is_backfilled, created_at, updated_at)
SELECT id, 'Verified', true, now(), now()
FROM users
WHERE role = 'Urban Planner'
ON CONFLICT (user_id) DO NOTHING;

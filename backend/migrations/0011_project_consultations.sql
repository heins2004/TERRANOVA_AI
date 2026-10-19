-- Migration: 0011_project_consultations.sql
-- Consultations for deployed projects and private invitations

CREATE TABLE IF NOT EXISTS project_consultations (
    id serial PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title varchar(150) NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 150),
    description text NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
    starts_at timestamptz NOT NULL,
    duration_minutes integer NOT NULL CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
    type varchar(20) NOT NULL CHECK (type IN ('Online', 'Venue')),
    meeting_url varchar(500) CHECK (meeting_url IS NULL OR (meeting_url LIKE 'https://%' AND char_length(meeting_url) <= 500)),
    venue_address varchar(300) CHECK (venue_address IS NULL OR (char_length(venue_address) >= 5 AND char_length(venue_address) <= 300)),
    city varchar(100) NOT NULL,
    max_attendees integer CHECK (max_attendees IS NULL OR (max_attendees >= 1 AND max_attendees <= 100000)),
    visibility varchar(20) NOT NULL CHECK (visibility IN ('Public', 'Private')),
    status varchar(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Cancelled')),
    cancel_reason varchar(500) CHECK (cancel_reason IS NULL OR (char_length(cancel_reason) >= 10 AND char_length(cancel_reason) <= 500)),
    created_by integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_consultation_type_fields CHECK (
        (type = 'Online' AND meeting_url IS NOT NULL AND venue_address IS NULL) OR
        (type = 'Venue' AND venue_address IS NOT NULL AND meeting_url IS NULL)
    ),
    CONSTRAINT chk_consultation_cancel_fields CHECK (
        (status = 'Cancelled' AND cancel_reason IS NOT NULL) OR
        (status = 'Scheduled' AND cancel_reason IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS project_consultation_invites (
    consultation_id integer NOT NULL REFERENCES project_consultations(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (consultation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_consultations_project_starts ON project_consultations (project_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_project_consultation_invites_user_id ON project_consultation_invites (user_id);

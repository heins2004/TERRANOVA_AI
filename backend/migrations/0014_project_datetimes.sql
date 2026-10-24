-- Migration: 0014_project_datetimes.sql
-- Store project start_date and end_date as timestamptz at 12:00 Asia/Kolkata

ALTER TABLE projects
    ALTER COLUMN start_date TYPE timestamptz
    USING (
        CASE
            WHEN start_date IS NOT NULL THEN (start_date::text || ' 12:00:00+05:30')::timestamptz
            ELSE NULL
        END
    ),
    ALTER COLUMN end_date TYPE timestamptz
    USING (
        CASE
            WHEN end_date IS NOT NULL THEN (end_date::text || ' 12:00:00+05:30')::timestamptz
            ELSE NULL
        END
    );

-- REVERSE SQL:
-- ALTER TABLE projects
--     ALTER COLUMN start_date TYPE date
--     USING (CASE WHEN start_date IS NOT NULL THEN (start_date AT TIME ZONE 'Asia/Kolkata')::date ELSE NULL END),
--     ALTER COLUMN end_date TYPE date
--     USING (CASE WHEN end_date IS NOT NULL THEN (end_date AT TIME ZONE 'Asia/Kolkata')::date ELSE NULL END);

-- Migration: 0012_consultation_venue_location.sql
-- Optional map location (venue_lat, venue_lng) for Venue consultations

ALTER TABLE project_consultations
    ADD COLUMN IF NOT EXISTS venue_lat double precision,
    ADD COLUMN IF NOT EXISTS venue_lng double precision;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_lat_lng_both_or_none'
    ) THEN
        ALTER TABLE project_consultations
            ADD CONSTRAINT chk_venue_lat_lng_both_or_none
            CHECK (
                (venue_lat IS NULL AND venue_lng IS NULL) OR
                (venue_lat IS NOT NULL AND venue_lng IS NOT NULL)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_location_only_for_venue_type'
    ) THEN
        ALTER TABLE project_consultations
            ADD CONSTRAINT chk_venue_location_only_for_venue_type
            CHECK (
                (venue_lat IS NULL AND venue_lng IS NULL) OR
                (type = 'Venue')
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_lat_range'
    ) THEN
        ALTER TABLE project_consultations
            ADD CONSTRAINT chk_venue_lat_range
            CHECK (
                venue_lat IS NULL OR (venue_lat >= 6 AND venue_lat <= 38)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_venue_lng_range'
    ) THEN
        ALTER TABLE project_consultations
            ADD CONSTRAINT chk_venue_lng_range
            CHECK (
                venue_lng IS NULL OR (venue_lng >= 68 AND venue_lng <= 98)
            );
    END IF;
END $$;

-- Migration: 0009_site_area.sql
-- Add circular site area columns to projects table with check constraint

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS site_area_lat double precision,
    ADD COLUMN IF NOT EXISTS site_area_lng double precision,
    ADD COLUMN IF NOT EXISTS site_area_radius_km numeric(6,2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_site_area_all_or_none'
    ) THEN
        ALTER TABLE projects
            ADD CONSTRAINT check_site_area_all_or_none
            CHECK (
                (site_area_lat IS NULL AND site_area_lng IS NULL AND site_area_radius_km IS NULL)
                OR
                (site_area_lat IS NOT NULL AND site_area_lng IS NOT NULL AND site_area_radius_km IS NOT NULL)
            );
    END IF;
END $$;

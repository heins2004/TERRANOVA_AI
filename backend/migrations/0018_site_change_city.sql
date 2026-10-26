-- Migration: 0018_site_change_city.sql
-- Add city and city_name columns to project_site_changes

ALTER TABLE project_site_changes ADD COLUMN IF NOT EXISTS city varchar(120);
ALTER TABLE project_site_changes ADD COLUMN IF NOT EXISTS city_name varchar(150);

-- REVERSE SQL:
-- ALTER TABLE project_site_changes DROP COLUMN IF EXISTS city_name;
-- ALTER TABLE project_site_changes DROP COLUMN IF EXISTS city;

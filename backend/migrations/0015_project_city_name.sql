-- Migration: 0015_project_city_name.sql
-- Add projects.city_name text (nullable) and backfill from fixed cities list or title-cased slug

ALTER TABLE projects ADD COLUMN IF NOT EXISTS city_name text;

UPDATE projects
SET city_name = CASE
    WHEN lower(city) = 'bengaluru' THEN 'Bengaluru'
    WHEN lower(city) = 'chennai' THEN 'Chennai'
    WHEN lower(city) = 'kochi' THEN 'Kochi'
    WHEN lower(city) = 'thiruvananthapuram' THEN 'Thiruvananthapuram'
    WHEN lower(city) = 'hyderabad' THEN 'Hyderabad'
    WHEN lower(city) = 'mumbai' THEN 'Mumbai'
    WHEN lower(city) = 'delhi' THEN 'Delhi'
    WHEN lower(city) = 'pune' THEN 'Pune'
    WHEN city IS NOT NULL AND city != '' THEN initcap(replace(city, '-', ' '))
    ELSE NULL
END
WHERE city_name IS NULL;

-- REVERSE SQL:
-- ALTER TABLE projects DROP COLUMN IF EXISTS city_name;

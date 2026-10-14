-- Migration: 0007_user_profile.sql
-- Add profile fields: organization, designation, expertise, and avatar_key to users

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS expertise varchar(300);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key text NOT NULL DEFAULT 'avatar-01';
UPDATE users SET avatar_key = 'avatar-01' WHERE avatar_key IS NULL;

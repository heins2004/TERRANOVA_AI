-- Migration: 0008_forced_password_change.sql
-- Add must_change_password flag to users for first-login password change on admin-created accounts

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

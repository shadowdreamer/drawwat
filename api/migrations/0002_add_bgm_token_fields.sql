-- Migration: 0002_add_bgm_token_fields
-- Description: Add Bangumi OAuth token fields to users table

-- Add token fields for Bangumi OAuth
ALTER TABLE users ADD COLUMN access_token TEXT;
ALTER TABLE users ADD COLUMN refresh_token TEXT;
ALTER TABLE users ADD COLUMN token_expires_at INTEGER;

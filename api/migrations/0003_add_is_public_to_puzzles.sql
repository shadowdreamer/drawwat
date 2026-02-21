-- DrawWat Database Schema
-- Migration: 0003_add_is_public_to_puzzles
-- Description: Add is_public field to puzzles table

-- Add is_public column to puzzles table
ALTER TABLE puzzles ADD COLUMN is_public BOOLEAN DEFAULT 1;

-- Create index for public puzzles queries
CREATE INDEX IF NOT EXISTS idx_puzzles_is_public ON puzzles(is_public, created_at DESC);

-- Migration: 0004_add_puzzle_gives_up
-- Description: Add puzzle_gives_up table for users who give up on puzzles

CREATE TABLE IF NOT EXISTS puzzle_gives_up (
    id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    gave_up_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(puzzle_id, user_id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_puzzle_gives_up_puzzle_id ON puzzle_gives_up(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_gives_up_user_id ON puzzle_gives_up(user_id);

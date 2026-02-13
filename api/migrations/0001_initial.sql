-- DrawWat Database Schema
-- Migration: 0001_initial
-- Description: Create core tables for DrawWat app

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    case_sensitive BOOLEAN DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for puzzles
CREATE INDEX IF NOT EXISTS idx_puzzles_user_id ON puzzles(user_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_created_at ON puzzles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_puzzles_expires_at ON puzzles(expires_at);

-- Guesses table
CREATE TABLE IF NOT EXISTS guesses (
    id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    guess_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    correct_chars INTEGER,
    correct_positions INTEGER,
    is_after_expiry BOOLEAN DEFAULT 0,
    guessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for guesses
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle_id ON guesses(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_guesses_user_id ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_guessed_at ON guesses(guessed_at DESC);

-- Puzzle solves table (leaderboard)
CREATE TABLE IF NOT EXISTS puzzle_solves (
    id TEXT PRIMARY KEY,
    puzzle_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    solved_at DATETIME NOT NULL,
    time_to_solve INTEGER,
    UNIQUE(puzzle_id, user_id),
    FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for puzzle_solves
CREATE INDEX IF NOT EXISTS idx_puzzle_solves_puzzle_id ON puzzle_solves(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_solves_solved_at ON puzzle_solves(solved_at ASC);

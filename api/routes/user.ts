import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../index'
import type { Variables } from '../middleware/auth'

export const userRoute = new Hono<{ Bindings: Env, Variables: Variables }>()

// GET /api/user/me - Get current user info
userRoute.get('/user/me', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const db = c.env.MISC_DB
  const user = await db
    .prepare('SELECT id, provider, username, avatar_url, email, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first()

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})

// GET /api/user/me/puzzles - Get user's puzzles
userRoute.get('/user/me/puzzles', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const db = c.env.MISC_DB

  const puzzles = await db
    .prepare(`
      SELECT
        id,
        image_url,
        answer,
        hint,
        expires_at,
        created_at,
        (SELECT COUNT(*) FROM guesses WHERE puzzle_id = puzzles.id AND NOT is_after_expiry) as total_guesses,
        (SELECT COUNT(*) FROM guesses WHERE puzzle_id = puzzles.id AND is_correct = true AND NOT is_after_expiry) as correct_guesses
      FROM puzzles
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .bind(userId)
    .all()

  return c.json({ puzzles: puzzles.results })
})

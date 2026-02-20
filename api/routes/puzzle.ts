import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import type { Env } from '../index'
import type { Variables } from '../middleware/auth'

export const puzzleRoute = new Hono<{ Bindings: Env, Variables: Variables }>()

// R2 configuration
const R2_PATH_PREFIX = 'drawwat'

// Helper function to generate R2 key with yyyy-mm directory structure
function generateR2Key(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const filename = `${crypto.randomUUID()}.webp`
  return `${R2_PATH_PREFIX}/${year}-${month}/${filename}`
}

// Helper function to upload image to R2
async function uploadImageToR2(
  env: Env,
  imageData: string
): Promise<string> {
  // Parse data URL
  const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid image data format')
  }

  const [, format, base64Data] = matches
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  // Generate R2 key
  const key = generateR2Key()

  // Upload to R2
  await env.STATIC_BUCKET.put(key, bytes, {
    httpMetadata: {
      contentType: `image/${format}`,
    },
  })

  // Return public URL
  return `${env.R2_CUSTOM_DOMAIN}/${key}`
}

// Helper function to calculate character matches
function calculateMatches(answer: string, guess: string, caseSensitive: boolean): { correctChars: number, correctPositions: number } {
  const normalizedAnswer = caseSensitive ? answer : answer.toLowerCase()
  const normalizedGuess = caseSensitive ? guess : guess.toLowerCase()

  // Count correct positions
  let correctPositions = 0
  for (let i = 0; i < Math.min(normalizedAnswer.length, normalizedGuess.length); i++) {
    if (normalizedAnswer[i] === normalizedGuess[i]) {
      correctPositions++
    }
  }

  // Count correct characters (using frequency map)
  const answerCharCount = new Map<string, number>()
  for (const char of normalizedAnswer) {
    answerCharCount.set(char, (answerCharCount.get(char) || 0) + 1)
  }

  let correctChars = 0
  const guessCharCount = new Map<string, number>()
  for (const char of normalizedGuess) {
    const answerCount = answerCharCount.get(char) || 0
    const guessCount = (guessCharCount.get(char) || 0) + 1

    if (guessCount <= answerCount) {
      correctChars++
    }

    guessCharCount.set(char, guessCount)
  }

  return { correctChars, correctPositions }
}

// Helper function to check if puzzle is expired
function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// POST /api/puzzles - Create new puzzle
const createPuzzleSchema = z.object({
  image_data: z.string().min(1), // Base64 encoded image
  answer: z.string().min(1).max(500),
  hint: z.string().max(500).optional(),
  case_sensitive: z.boolean().optional().default(false),
  expires_in: z.number().int().min(0).optional().default(1209600) // Default 14 days, 0 = never expire
})

puzzleRoute.post('/puzzles', authMiddleware, zValidator('json', createPuzzleSchema), async (c) => {
  const { image_data, answer, hint, case_sensitive, expires_in } = c.req.valid('json')
  const userId = c.get('userId')

  try {
    // Upload image to R2 storage
    const image_url = await uploadImageToR2(c.env, image_data)

    // Calculate expiry time
    const expires_at = expires_in === 0 ? null : new Date(Date.now() + expires_in * 1000).toISOString()

    const db = c.env.MISC_DB
    const puzzleId = crypto.randomUUID()

    await db.prepare(`
      INSERT INTO puzzles (id, user_id, image_url, answer, hint, case_sensitive, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      puzzleId,
      userId,
      image_url,
      answer,
      hint || null,
      case_sensitive ? 1 : 0,
      expires_at
    ).run()

    // Generate share URL
    const baseUrl = c.req.header('Host') || 'drawwat.com'
    const share_url = `https://${baseUrl}/puzzle/${puzzleId}`

    return c.json({
      id: puzzleId,
      share_url,
      expires_at,
      created_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Create puzzle error:', error)
    return c.json({ error: 'Failed to create puzzle' }, 500)
  }
})

// GET /api/puzzles/:id - Get puzzle details (without answer)
puzzleRoute.get('/puzzles/:id', async (c) => {
  const puzzleId = c.req.param('id')
  const db = c.env.MISC_DB

  const puzzle = await db
    .prepare('SELECT id, image_url, hint, expires_at, created_at FROM puzzles WHERE id = ?')
    .bind(puzzleId)
    .first()

  if (!puzzle) {
    return c.json({ error: 'Puzzle not found' }, 404)
  }

  const expired = isExpired((puzzle as any).expires_at)

  return c.json({
    id: (puzzle as any).id,
    image_url: (puzzle as any).image_url,
    hint: (puzzle as any).hint,
    is_expired: expired,
    expires_at: (puzzle as any).expires_at,
    created_at: (puzzle as any).created_at
  })
})

// GET /api/puzzles/:id/stats - Get puzzle stats (only for creator)
puzzleRoute.get('/puzzles/:id/stats', authMiddleware, async (c) => {
  const puzzleId = c.req.param('id')
  const userId = c.get('userId')
  const db = c.env.MISC_DB

  // Check if user is the creator
  const puzzle = await db
    .prepare('SELECT * FROM puzzles WHERE id = ? AND user_id = ?')
    .bind(puzzleId, userId)
    .first()

  if (!puzzle) {
    return c.json({ error: 'Puzzle not found or forbidden' }, 403)
  }

  // Get statistics
  const stats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_guesses,
        SUM(CASE WHEN is_correct = 1 AND NOT is_after_expiry THEN 1 ELSE 0 END) as correct_guesses
      FROM guesses
      WHERE puzzle_id = ? AND NOT is_after_expiry
    `)
    .bind(puzzleId)
    .first()

  // Get solves (leaderboard)
  const solves = await db
    .prepare(`
      SELECT
        u.username,
        ps.solved_at,
        ps.time_to_solve
      FROM puzzle_solves ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.puzzle_id = ?
      ORDER BY ps.solved_at ASC
    `)
    .bind(puzzleId)
    .all()

  return c.json({
    id: puzzleId,
    answer: (puzzle as any).answer,
    total_guesses: (stats as any).total_guesses || 0,
    correct_guesses: (stats as any).correct_guesses || 0,
    accuracy_rate: (stats as any).total_guesses > 0
      ? (stats as any).correct_guesses / (stats as any).total_guesses
      : 0,
    is_expired: isExpired((puzzle as any).expires_at),
    solves: solves.results
  })
})

// GET /api/puzzles/:id/answer - Get answer (only if expired)
puzzleRoute.get('/puzzles/:id/answer', authMiddleware, async (c) => {
  const puzzleId = c.req.param('id')
  const db = c.env.MISC_DB

  const puzzle = await db
    .prepare('SELECT answer, expires_at FROM puzzles WHERE id = ?')
    .bind(puzzleId)
    .first()

  if (!puzzle) {
    return c.json({ error: 'Puzzle not found' }, 404)
  }

  const expired = isExpired((puzzle as any).expires_at)

  if (!expired) {
    return c.json({ error: 'puzzle_not_expired', message: 'This puzzle has not expired yet' }, 400)
  }

  return c.json({
    answer: (puzzle as any).answer,
    is_expired: true
  })
})

// POST /api/puzzles/:id/guess - Submit a guess
const guessSchema = z.object({
  answer: z.string().min(1)
})

puzzleRoute.post('/puzzles/:id/guess', authMiddleware, zValidator('json', guessSchema), async (c) => {
  const puzzleId = c.req.param('id')
  const { answer: guessAnswer } = c.req.valid('json')
  const userId = c.get('userId')
  const db = c.env.MISC_DB

  // Get puzzle
  const puzzle = await db
    .prepare('SELECT * FROM puzzles WHERE id = ?')
    .bind(puzzleId)
    .first()

  if (!puzzle) {
    return c.json({ error: 'Puzzle not found' }, 404)
  }

  const answer = (puzzle as any).answer
  const caseSensitive = (puzzle as any).case_sensitive === 1
  const expired = isExpired((puzzle as any).expires_at)

  // Calculate matches
  const { correctChars, correctPositions } = calculateMatches(answer, guessAnswer, caseSensitive)

  // Check if correct
  const normalizedAnswer = caseSensitive ? answer : answer.toLowerCase()
  const normalizedGuess = caseSensitive ? guessAnswer : guessAnswer.toLowerCase()
  const isCorrect = normalizedAnswer === normalizedGuess

  // Check if already solved
  const existingSolve = await db
    .prepare('SELECT * FROM puzzle_solves WHERE puzzle_id = ? AND user_id = ?')
    .bind(puzzleId, userId)
    .first()

  // Insert guess record
  const guessId = crypto.randomUUID()
  await db.prepare(`
    INSERT INTO guesses (id, puzzle_id, user_id, guess_answer, is_correct, correct_chars, correct_positions, is_after_expiry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    guessId,
    puzzleId,
    userId,
    guessAnswer,
    isCorrect ? 1 : 0,
    correctChars,
    correctPositions,
    expired ? 1 : 0
  ).run()

  // If correct and not already solved and not expired, add to solves
  if (isCorrect && !existingSolve && !expired) {
    const solvedAt = new Date().toISOString()
    // Parse created_at as UTC (SQLite returns UTC without timezone suffix)
    const createdAt = new Date((puzzle as any).created_at + 'Z')
    const timeToSolve = Math.floor((new Date().getTime() - createdAt.getTime()) / 1000)

    await db.prepare(`
      INSERT INTO puzzle_solves (id, puzzle_id, user_id, solved_at, time_to_solve)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      puzzleId,
      userId,
      solvedAt,
      timeToSolve
    ).run()
  }

  // Build response
  const response: any = {
    is_correct: isCorrect,
    is_expired: expired,
    is_counted: !expired
  }

  if (isCorrect) {
    response.correct_answer = answer
    response.message = '恭喜你答对了！'
    if (!expired && !existingSolve) {
      // Parse created_at as UTC (SQLite returns UTC without timezone suffix)
      const createdAt = new Date((puzzle as any).created_at + 'Z')
      response.time_to_solve = Math.floor((new Date().getTime() - createdAt.getTime()) / 1000)
    }
  } else {
    response.message = expired ? '此谜题已过期，猜测不会计入统计' : '再想想...'
    response.hint = {
      correct_chars: correctChars,
      correct_positions: correctPositions,
      answer_length: answer.length
    }
  }

  return c.json(response)
})

// GET /api/puzzles/:id/guesses - Get puzzle guesses
puzzleRoute.get('/puzzles/:id/guesses', async (c) => {
  const puzzleId = c.req.param('id')
  const userId = c.get('userId')
  const db = c.env.MISC_DB

  // Get user's guesses for this puzzle
  const guesses = await db
    .prepare(`
      SELECT
        id,
        guess_answer,
        is_correct,
        correct_chars,
        correct_positions,
        is_after_expiry,
        guessed_at
      FROM guesses
      WHERE puzzle_id = ? AND user_id = ?
      ORDER BY guessed_at DESC
    `)
    .bind(puzzleId, userId)
    .all()

  // Get statistics
  const stats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN is_correct = 1 AND NOT is_after_expiry THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN NOT is_after_expiry THEN 1 ELSE 0 END) as counted_count
      FROM guesses
      WHERE puzzle_id = ? AND user_id = ?
    `)
    .bind(puzzleId, userId)
    .first()

  return c.json({
    guesses: guesses.results,
    total_count: (stats as any).total_count || 0,
    correct_count: (stats as any).correct_count || 0,
    counted_count: (stats as any).counted_count || 0
  })
})

// GET /api/puzzles/:id/solves - Get puzzle leaderboard
puzzleRoute.get('/puzzles/:id/solves', async (c) => {
  const puzzleId = c.req.param('id')
  const db = c.env.MISC_DB

  const solves = await db
    .prepare(`
      SELECT
        u.id as user_id,
        u.username,
        ps.solved_at,
        ps.time_to_solve,
        ROW_NUMBER() OVER (ORDER BY ps.solved_at ASC) as rank
      FROM puzzle_solves ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.puzzle_id = ?
      ORDER BY ps.solved_at ASC
    `)
    .bind(puzzleId)
    .all()

  return c.json({
    solves: solves.results,
    total_solves: solves.results.length
  })
})

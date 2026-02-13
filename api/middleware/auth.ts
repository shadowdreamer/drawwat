import { MiddlewareHandler } from 'hono'
import type { Env } from '../index'

export type Variables = {
  userId: string
  token: string
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Env, Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)

  // TODO: Implement proper JWT verification
  // For now, we'll use a simple approach - verify token with GitHub or use JWT
  // This is a simplified version that should be enhanced for production

  try {
    // Verify token by calling GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'DrawWat'
      }
    })

    if (!response.ok) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    const user = await response.json() as { id: number; login: string; avatar_url: string; email: string }

    // Get user ID from database
    const db = c.env.MISC_DB
    const dbUser = await db
      .prepare('SELECT id FROM users WHERE provider = ? AND provider_user_id = ?')
      .bind('github', user.id.toString())
      .first()

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404)
    }

    c.set('userId', (dbUser as any).id as string)
    c.set('token', token)

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

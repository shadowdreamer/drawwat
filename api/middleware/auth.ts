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

  try {
    const db = c.env.MISC_DB

    // Verify token by checking database
    const user = await db
      .prepare('SELECT id, provider_user_id, username, token_expires_at FROM users WHERE access_token = ? AND provider = ?')
      .bind(token, 'bangumi')
      .first()

    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    // Check if token is expired
    const expiresAt = (user as any).token_expires_at as number
    const currentTime = Math.floor(Date.now() / 1000)

    if (expiresAt && expiresAt < currentTime) {
      return c.json({ error: 'Token expired' }, 401)
    }

    c.set('userId', (user as any).id as string)
    c.set('token', token)

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ error: 'Authentication failed' }, 401)
  }
}

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../index'
import type { Variables } from '../middleware/auth'

// GitHub API response types
interface GitHubTokenResponse {
  access_token: string
  token_type: string
  scope?: string
  error?: string
  error_description?: string
}

interface GitHubUser {
  id: number
  login: string
  avatar_url: string
  email: string | null
}

interface GitHubEmail {
  email: string
  primary: boolean
  verified: boolean
  visibility: string | null
}

export const authRoute = new Hono<{ Bindings: Env, Variables: Variables }>()

// Request validation schema
const authSchema = z.object({
  code: z.string().min(1)
})

// POST /api/auth - Exchange authorization code for access token
authRoute.post('/auth', zValidator('json', authSchema), async (c) => {
  const { code } = c.req.valid('json')

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('GitHub token error:', errorText)
      throw new Error('Failed to exchange token')
    }

    const tokenData = await tokenResponse.json() as GitHubTokenResponse

    if (tokenData.error) {
      return c.json({ error: tokenData.error_description || tokenData.error }, 400)
    }

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DrawWat'
      }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const githubUser = await userResponse.json() as GitHubUser

    // Get user emails
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DrawWat'
      }
    })

    let email = githubUser.email
    if (emailResponse.ok) {
      const emails = await emailResponse.json() as GitHubEmail[]
      const primaryEmail = emails.find((e: any) => e.primary)
      if (primaryEmail) {
        email = primaryEmail.email
      }
    }

    // Check if user exists
    const db = c.env.MISC_DB
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE provider = ? AND provider_user_id = ?')
      .bind('github', githubUser.id.toString())
      .first()

    let userId: string
    let isNewUser = false

    if (existingUser) {
      userId = (existingUser as any).id
      // Update user info
      await db.prepare(`
        UPDATE users
        SET username = ?, avatar_url = ?, email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        githubUser.login,
        githubUser.avatar_url,
        email,
        userId
      ).run()
    } else {
      // Create new user
      userId = crypto.randomUUID()
      isNewUser = true
      await db.prepare(`
        INSERT INTO users (id, provider, provider_user_id, username, avatar_url, email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        'github',
        githubUser.id.toString(),
        githubUser.login,
        githubUser.avatar_url,
        email
      ).run()
    }

    return c.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      user: {
        id: userId,
        provider: 'github',
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        email,
        is_new_user: isNewUser
      }
    })

  } catch (error) {
    console.error('OAuth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

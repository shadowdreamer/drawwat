import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { Env } from '../index'
import type { Variables } from '../middleware/auth'

// Bangumi OAuth response types
interface BgmTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user_id: number
}

interface BgmUser {
  id: number
  username: string
  avatar: {
    large: string
    medium: string
    small: string
  }
  email: string | null
}

export const authRoute = new Hono<{ Bindings: Env, Variables: Variables }>()

// Request validation schema
const authSchema = z.object({
  code: z.string().min(1)
})

// POST /api/auth - Exchange authorization code for access token
authRoute.post('wan', zValidator('json', authSchema), async (c) => {
  const { code } = c.req.valid('json')

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400)
  }
  const body = JSON.stringify({
        client_id: c.env.VITE_BGM_CLIENT_ID,
        client_secret: c.env.BGM_APP_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: c.env.VITE_BGM_REDIRECT_URI
      })
      console.log(body)
  try {
    // Exchange code for access token with Bangumi OAuth API
    const tokenResponse = await fetch('https://bgm.tv/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Bangumi token error:', errorText)
      throw new Error('Failed to exchange token')
    }

    const tokenData = await tokenResponse.json() as BgmTokenResponse

    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to get access token' }, 400)
    }

    // Get user info from Bangumi API
    const userResponse = await fetch('https://api.bgm.tv/v0/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'DrawWat/1.0 (https://drawwat.com)'
      }
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('Bangumi user API error:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        body: errorText
      })
      throw new Error('Failed to fetch user info')
    }

    const bgmUser = await userResponse.json() as BgmUser

    // Check if user exists
    const db = c.env.MISC_DB
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE provider = ? AND provider_user_id = ?')
      .bind('bangumi', bgmUser.id.toString())
      .first()

    let userId: string
    let isNewUser = false

    if (existingUser) {
      userId = (existingUser as any).id
      // Update user info and tokens
      await db.prepare(`
        UPDATE users
        SET username = ?, avatar_url = ?, email = ?, access_token = ?,
            refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        bgmUser.username,
        bgmUser.avatar?.large || bgmUser.avatar?.medium,
        bgmUser.email,
        tokenData.access_token,
        tokenData.refresh_token,
        Math.floor(Date.now() / 1000) + tokenData.expires_in,
        userId
      ).run()
    } else {
      // Create new user
      userId = crypto.randomUUID()
      isNewUser = true
      await db.prepare(`
        INSERT INTO users (id, provider, provider_user_id, username, avatar_url, email,
                          access_token, refresh_token, token_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        'bangumi',
        bgmUser.id.toString(),
        bgmUser.username,
        bgmUser.avatar?.large || bgmUser.avatar?.medium,
        bgmUser.email,
        tokenData.access_token,
        tokenData.refresh_token,
        Math.floor(Date.now() / 1000) + tokenData.expires_in
      ).run()
    }

    return c.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      user: {
        id: userId,
        provider: 'bangumi',
        username: bgmUser.username,
        avatar_url: bgmUser.avatar?.large || bgmUser.avatar?.medium,
        email: bgmUser.email,
        is_new_user: isNewUser
      }
    })

  } catch (error) {
    console.error('OAuth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// POST /api/auth/refresh - Refresh access token using refresh token
authRoute.post('/auth/refresh', async (c) => {
  try {
    const { refresh_token } = await c.req.json()

    if (!refresh_token) {
      return c.json({ error: 'Missing refresh token' }, 400)
    }

    // Call Bangumi OAuth API to refresh token
    const tokenResponse = await fetch('https://bgm.tv/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.VITE_BGM_CLIENT_ID,
        client_secret: c.env.BGM_APP_SECRET,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
        redirect_uri: c.env.VITE_BGM_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokenData = await tokenResponse.json() as any

    // Update token in database
    const db = c.env.MISC_DB
    await db.prepare(`
      UPDATE users
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE refresh_token = ?
    `).bind(
      tokenData?.access_token,
      tokenData?.refresh_token,
      Math.floor(Date.now() / 1000) + tokenData?.expires_in,
      refresh_token
    ).run()

    return c.json(tokenData)

  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ error: 'Failed to refresh token' }, 500)
  }
})

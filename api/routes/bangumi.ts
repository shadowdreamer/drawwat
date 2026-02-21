import { Hono } from 'hono'
import type { Env } from '../index'

export const bangumiRoute = new Hono<{ Bindings: Env }>()

/**
 * GET /api/bangumi/user/:userId
 * Proxy request to bgm.tv API to get user info
 */
bangumiRoute.get('/bangumi/user/:userId', async (c) => {
  const userId = c.req.param('userId')

  if (!userId) {
    return c.json({ error: 'Invalid user ID' }, 400)
  }

  try {
    const response = await fetch(`https://api.bgm.tv/v0/users/${userId}`, {
      headers: {
        'User-Agent': 'drawwat',
      },
    })

    if (!response.ok) {
      return c.json({ error: 'Failed to fetch user info from bgm.tv' }, response.status as 400 | 404 | 500)
    }

    const data = await response.json() as {
      avatar: { large: string; medium: string; small: string }
      sign: string
      url: string
      username: string
      nickname: string
      id: number
      user_group: number
    }

    // Return the data with the structure specified by user
    return c.json({
      avatar: data.avatar,
      sign: data.sign,
      url: data.url,
      username: data.username,
      nickname: data.nickname,
      id: data.id,
      user_group: data.user_group,
    })
  } catch (error) {
    console.error('Error fetching bgm.tv user:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

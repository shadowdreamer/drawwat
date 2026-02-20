# 用户鉴权系统技术文档
## Bangumi OAuth 2.0 登录实现方案

**版本**: v2.0
**创建日期**: 2026-02-13
**更新日期**: 2026-02-13
**参考**: [Bangumi OAuth 文档](./How-to-Auth.md)

---

## 1. 概述

本文档描述 DrawWat 项目的用户鉴权系统设计，采用 **Bangumi OAuth 2.0 授权码模式** 实现用户登录功能。

### 1.1 设计目标
- 使用 Bangumi OAuth 2.0 进行用户身份验证
- 前端状态持久化（Pinia + localStorage）
- 安全的 Token 管理（Access Token + Refresh Token）
- 无缝的用户体验

> **完整 OAuth 流程说明请参考**: [How-to-Auth.md](./How-to-Auth.md)

### 1.2 OAuth 流程图

```
┌─────────┐                ┌──────────────┐                ┌─────────────┐
│  用户   │                │ DrawWat App  │                │   Bangumi   │
└────┬────┘                └──────┬───────┘                └──────┬──────┘
     │                            │                               │
     │  1. 点击登录按钮            │                               │
     ├───────────────────────────>│                               │
     │                            │  2. 重定向到 bgm.tv 授权页面   │
     ├───────────────────────────────────────────────────────────>│
     │                            │                               │
     │  3. 用户授权                │                               │
     ├──────────────────────────────────────────────────────────>│
     │                            │                               │
     │                            │  4. 返回 authorization code   │
     │                            │<──────────────────────────────┤
     │                            │                               │
     │  5. 携带 code 回调          │                               │
     ├───────────────────────────>│                               │
     │                            │                               │
     │                            │  6. 用 code 换取 access token │
     │                            ├─────────────────────────────>│
     │                            │                               │
     │                            │  7. 返回 access token         │
     │                            │<─────────────────────────────┤
     │                            │                               │
     │  8. 登录成功，跳转首页     │                               │
     │<───────────────────────────┤                               │
```

> **详细 API 说明**: 授权流程和 API 参数请参考 [How-to-Auth.md](./How-to-Auth.md)

---

## 2. 技术选型

### 2.1 OAuth 提供商
| 提供商 | 说明 |
|--------|------|
| **Bangumi** | 使用 bgm.tv OAuth 2.0 授权码模式进行用户验证 |

### 2.2 技术栈
- **前端状态管理**: Pinia + 持久化插件
- **后端**: Hono (Cloudflare Workers)
- **Token 存储**: localStorage (前端)

---

## 3. 数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 内部用户 ID
    bgm_user_id INTEGER NOT NULL UNIQUE,    -- Bangumi 用户 ID
    username TEXT NOT NULL,                 -- 用户名
    avatar_url TEXT,                        -- 头像 URL
    email TEXT,                             -- 邮箱（可选）
    access_token TEXT NOT NULL,             -- Bangumi Access Token
    refresh_token TEXT,                     -- Bangumi Refresh Token
    token_expires_at INTEGER,               -- Token 过期时间（Unix 时间戳）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_users_bgm_id ON users(bgm_user_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

---

## 4. 前端实现

### 4.1 目录结构

```
src/
├── store/
│   └── auth.ts                 # 认证状态管理 (Pinia)
├── composables/
│   └── useAuth.ts              # 认证相关组合式函数
└── router/
    └── index.ts                # 路由配置（包含回调路由）
```

### 4.2 Pinia Store 实现

**文件**: `src/store/auth.ts`

```typescript
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // ========== 状态 ==========
  const token = ref<string>('')
  const refreshToken = ref<string>('')
  const user = ref<User | null>(null)

  // ========== 跳转 Bangumi 授权页面 ==========
  function toAuthPage() {
    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_BGM_CLIENT_ID,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_VITE_BGM_REDIRECT_URI,
      state: generateRandomState() // 防止 CSRF 攻击
    })

    // 保存 state 到 sessionStorage 用于验证
    sessionStorage.setItem('oauth_state', params.get('state')!)

    // 跳转到 Bangumi 授权页面
    window.location.href = `https://bgm.tv/oauth/authorize?${params.toString()}`
  }

  // ========== 使用 authorization code 换取 access token ==========
  async function getToken(code: string, state: string) {
    // 验证 state 防止 CSRF
    const savedState = sessionStorage.getItem('oauth_state')
    if (!savedState || savedState !== state) {
      throw new Error('Invalid OAuth state')
    }
    sessionStorage.removeItem('oauth_state')

    try {
      const res = await $fetch<{
        access_token: string
        refresh_token: string
        expires_in: number
        token_type: string
        user_id: number
      }>('/api/auth', {
        method: 'POST',
        body: { code }
      })

      if (res.access_token) {
        token.value = res.access_token
        refreshToken.value = res.refresh_token
        // 获取用户信息
        await fetchUserInfo()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to get token:', error)
      return false
    }
  }

  // ========== 获取用户信息 ==========
  async function fetchUserInfo() {
    try {
      const userData = await $fetch<User>('/api/user/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
      user.value = userData
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  // ========== 刷新 Token ==========
  async function refreshAccessToken() {
    if (!refreshToken.value) return false

    try {
      const res = await $fetch<{
        access_token: string
        refresh_token: string
        expires_in: number
      }>('/api/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken.value }
      })

      if (res.access_token) {
        token.value = res.access_token
        refreshToken.value = res.refresh_token
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to refresh token:', error)
      logout()
      return false
    }
  }

  // ========== 登出 ==========
  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    navigateTo('/')
  }

  // ========== 计算属性 ==========
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  return {
    // 状态
    token,
    refreshToken,
    user,
    isLoggedIn,

    // 方法
    toAuthPage,
    getToken,
    fetchUserInfo,
    refreshAccessToken,
    logout
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
    pick: ['token', 'refreshToken', 'user']  // 持久化 token 和 user 信息
  }
})

// ========== 类型定义 ==========
interface User {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

// 生成随机 state 字符串
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}
```

### 4.3 路由配置

**文件**: `src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/create',
      name: 'create',
      component: () => import('@/views/CreatePuzzleView.vue'),
      meta: { requiresAuth: true }  // 需要登录
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallbackView.vue')
    },
    {
      path: '/puzzle/:id',
      name: 'puzzle',
      component: () => import('@/views/PuzzleView.vue')
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    // 未登录，跳转到首页并提示登录
    next({ name: 'home', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

### 4.4 OAuth 回调页面

**文件**: `src/views/AuthCallbackView.vue`

```vue
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div v-if="loading" class="text-center">
      <div class="loading loading-spinner loading-lg"></div>
      <p class="mt-4">正在登录...</p>
    </div>
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { code, state } = route.query

    if (!code || !state) {
      throw new Error('缺少必要参数')
    }

    const success = await authStore.getToken(code as string, state as string)

    if (success) {
      // 登录成功，跳转回原页面或首页
      const redirect = route.query.redirect as string || '/'
      router.push(redirect)
    } else {
      throw new Error('登录失败，请重试')
    }
  } catch (err: any) {
    error.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
})
</script>
```

### 4.5 登录按钮组件

**文件**: `src/components/LoginButton.vue`

```vue
<template>
  <button
    v-if="!authStore.isLoggedIn"
    @click="handleLogin"
    class="btn btn-primary"
  >
    Bangumi 登录
  </button>
  <div v-else class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost gap-2">
      <div class="avatar">
        <div class="w-8 rounded-full">
          <img :src="authStore.user?.avatar_url || '/default-avatar.png'" />
        </div>
      </div>
      <span>{{ authStore.user?.username }}</span>
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
      <li><a @click="handleLogout">退出登录</a></li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

function handleLogin() {
  authStore.toAuthPage()
}

function handleLogout() {
  authStore.logout()
}
</script>
```

---

## 5. 后端实现

### 5.1 目录结构

```
api/
├── index.ts                    # Hono 主入口
├── routes/
│   ├── auth.ts                # OAuth 认证路由
│   └── user.ts                # 用户信息路由
└── services/
    └── oauth.ts               # OAuth 服务层
```

### 5.2 OAuth 认证 API

**文件**: `api/routes/auth.ts`

> **Bangumi OAuth API 详情**: 请参考 [How-to-Auth.md](./How-to-Auth.md)

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

export const authRoute = new Hono<{ Bindings: Env }>()

// 请求体验证
const authSchema = z.object({
  code: z.string().min(1)
})

// POST /api/auth - 使用 authorization code 换取 access token
authRoute.post('/auth', zValidator('json', authSchema), async (c) => {
  const { code } = c.req.valid('json')

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400)
  }

  try {
    // 从环境变量获取 Bangumi OAuth 配置
    const CLIENT_ID = c.env.VITE_BGM_CLIENT_ID
    const CLIENT_SECRET = c.env.BGM_APP_SECRET
    const REDIRECT_URI = c.env.VITE_BGM_REDIRECT_URI

    // 调用 Bangumi OAuth API: POST https://bgm.tv/oauth/access_token
    const tokenResponse = await fetch('https://bgm.tv/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token')
    }

    const tokenData = await tokenResponse.json() as {
      access_token: string
      refresh_token: string
      expires_in: number
      token_type: string
      user_id: number
    }

    if (!tokenData.access_token) {
      return c.json({ error: 'Failed to get access token' }, 400)
    }

    // 查询或创建用户
    const db = c.env.MISC_DB

    // 检查用户是否已存在
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE bgm_user_id = ?')
      .bind(tokenData.user_id)
      .first()

    let userId: number

    if (existingUser) {
      userId = existingUser.id as number
      // 更新 token
      await db.prepare(`
        UPDATE users
        SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tokenData.access_token,
        tokenData.refresh_token,
        Math.floor(Date.now() / 1000) + tokenData.expires_in,
        userId
      ).run()
    } else {
      // 获取用户信息
      const userInfo = await getBangumiUserInfo(tokenData.access_token)

      // 创建新用户
      const result = await db.prepare(`
        INSERT INTO users (bgm_user_id, username, avatar_url, email, access_token, refresh_token, token_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tokenData.user_id,
        userInfo.username,
        userInfo.avatar_url,
        userInfo.email,
        tokenData.access_token,
        tokenData.refresh_token,
        Math.floor(Date.now() / 1000) + tokenData.expires_in
      ).run()

      userId = result.meta.last_row_id
    }

    return c.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      user_id: tokenData.user_id
    })

  } catch (error) {
    console.error('OAuth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// POST /api/auth/refresh - 使用 refresh_token 刷新 access token
authRoute.post('/auth/refresh', async (c) => {
  const { refresh_token } = await c.req.json()

  if (!refresh_token) {
    return c.json({ error: 'Missing refresh token' }, 400)
  }

  try {
    const CLIENT_ID = c.env.VITE_BGM_CLIENT_ID
    const CLIENT_SECRET = c.env.BGM_APP_SECRET
    const REDIRECT_URI = c.env.VITE_BGM_REDIRECT_URI

    // 调用 Bangumi OAuth API 刷新 token
    const tokenResponse = await fetch('https://bgm.tv/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
        redirect_uri: REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokenData = await tokenResponse.json()

    // 更新数据库中的 token
    const db = c.env.MISC_DB
    await db.prepare(`
      UPDATE users
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE refresh_token = ?
    `).bind(
      tokenData.access_token,
      tokenData.refresh_token,
      Math.floor(Date.now() / 1000) + tokenData.expires_in,
      refresh_token
    ).run()

    return c.json(tokenData)

  } catch (error) {
    console.error('Token refresh error:', error)
    return c.json({ error: 'Failed to refresh token' }, 500)
  }
})

// 获取 Bangumi 用户信息的辅助函数
async function getBangumiUserInfo(accessToken: string) {
  const response = await fetch('https://api.bgm.tv/v0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  const data = await response.json()
  return {
    username: data.username,
    avatar_url: data.avatar?.large,
    email: data.email
  }
}
```

### 5.3 用户信息 API

**文件**: `api/routes/user.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'

export const userRoute = new Hono<{ Bindings: Env }>()

// GET /api/user/me - 获取当前用户信息
userRoute.get('/user/me', authMiddleware, async (c) => {
  const userId = c.get('userId') // 从中间件获取

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
```

### 5.4 认证中间件

**文件**: `api/middleware/auth.ts`

```typescript
import { MiddlewareHandler } from 'hono'

export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7) // 移除 "Bearer " 前缀

  // 验证 token 是否在数据库中存在且有效
  const db = c.env.MISC_DB
  const user = await db
    .prepare('SELECT id, bgm_user_id, username FROM users WHERE access_token = ? AND token_expires_at > ?')
    .bind(token, Math.floor(Date.now() / 1000))
    .first()

  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('userId', user.id)
  c.set('bgmUserId', user.bgm_user_id)

  await next()
}
```

### 5.5 API 主入口

**文件**: `api/index.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoute } from './routes/auth'
import { userRoute } from './routes/user'

type Env = {
  MISC_DB: D1Database
  VITE_BGM_CLIENT_ID: string
  BGM_APP_SECRET: string
  VITE_BGM_REDIRECT_URI: string
}

const app = new Hono<{ Bindings: Env }>()

// CORS 配置
app.use('/api/*', cors({
  origin: '*', // 生产环境应该限制具体域名
  credentials: true
}))

// 路由
app.route('/', authRoute)
app.route('/', userRoute)

export default app
```

---

## 6. 环境变量配置

### 6.1 前端环境变量 (.env)

```bash
# Bangumi OAuth 配置
VITE_BGM_CLIENT_ID="bgm1345aaf31ef839bc"
VITE_VITE_BGM_REDIRECT_URI=http://localhost:5173/auth/callback
```

**生产环境** (`.env.production`):

```bash
VITE_BGM_CLIENT_ID="bgm1345aaf31ef839bc"
VITE_VITE_BGM_REDIRECT_URI=https://yourdomain.com/auth/callback
```

### 6.2 后端环境变量 (wrangler.jsonc)

```json
{
  "vars": {
    "VITE_BGM_CLIENT_ID": "bgm1345aaf31ef839bc",
    "BGM_APP_SECRET": "28b67f13d0ce2e3f045442aebd511b81",
    "VITE_BGM_REDIRECT_URI": "https://yourdomain.com/auth/callback"
  }
}
```

> **注意**: `BGM_APP_SECRET` 是敏感信息，请勿提交到代码仓库。建议使用 Cloudflare Secrets 管理敏感数据。

---

## 7. Bangumi OAuth 配置步骤

### 7.1 创建 Bangumi 应用
1. 访问 [Bangumi 开放平台](https://bgm.tv/dev/app)
2. 创建新应用
3. 填写配置：
   - **应用名称**: DrawWat
   - **应用描述**: DrawWat 拼图应用
   - **回调地址**: `https://yourdomain.com/auth/callback`
4. 获取 `App ID` 和 `App Secret`

### 7.2 本地开发配置
在本地开发时，回调 URL 配置为：
```
http://localhost:5173/auth/callback
```

---

## 8. 安全性考虑

### 8.1 防止 CSRF 攻击
- 使用 `state` 参数验证
- 将 state 存储在 sessionStorage，回调时验证

### 8.2 Token 安全
- 使用 HTTPS 传输
- Token 有效期为 7 天（604800 秒）
- 实现 Refresh Token 机制自动续期

### 8.3 防止重放攻击
- Authorization Code 有效期仅为 60 秒
- Code 只能使用一次

---

## 9. 实施检查清单

### 前端
- [ ] 创建 `src/store/auth.ts` Pinia store
- [ ] 创建 `src/views/AuthCallbackView.vue` 回调页面
- [ ] 创建 `src/components/LoginButton.vue` 登录组件
- [ ] 配置路由守卫（`router/index.ts`）
- [ ] 配置 `.env` 环境变量
- [ ] 测试登录流程

### 后端
- [ ] 创建数据库迁移文件（`users` 表）
- [ ] 实现 OAuth 认证 API（`api/routes/auth.ts`）
- [ ] 实现用户信息 API（`api/routes/user.ts`）
- [ ] 实现认证中间件
- [ ] 配置 `wrangler.jsonc` 环境变量
- [ ] 在 Bangumi 创建应用

### 测试
- [ ] 测试完整 OAuth 流程
- [ ] 测试 Token 持久化
- [ ] 测试 Token 刷新
- [ ] 测试路由守卫
- [ ] 测试登出功能
- [ ] 测试错误处理

---

## 10. 参考资料

- [Bangumi OAuth 文档](./How-to-Auth.md)
- [Bangumi API 文档](https://github.com/bangumi/api)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)

---

**文档变更历史**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-13 | Claude | 初稿创建，基于 bgm-grid 项目设计 |
| v2.0 | 2026-02-13 | Claude | 修改为仅使用 Bangumi OAuth |

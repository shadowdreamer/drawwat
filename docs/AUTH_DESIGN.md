# 用户鉴权系统技术文档
## OAuth 2.0 第三方登录实现方案

**版本**: v1.0
**创建日期**: 2026-02-13
**参考项目**: [bgm-grid](https://github.com/shadowdreamer/bgm-grid)

---

## 1. 概述

本文档描述 DrawWat 项目的第三方用户鉴权系统设计，采用 **OAuth 2.0 授权码模式** 实现用户登录功能。

### 1.1 设计目标
- 支持第三方 OAuth 登录（GitHub、Google 等）
- 前端状态持久化
- 安全的 Token 管理
- 无缝的用户体验

### 1.2 OAuth 流程图

```
┌─────────┐                ┌──────────────┐                ┌─────────────┐
│  用户   │                │ DrawWat App  │                │OAuth Provider│
└────┬────┘                └──────┬───────┘                └──────┬──────┘
     │                            │                               │
     │  1. 点击登录按钮            │                               │
     ├───────────────────────────>│                               │
     │                            │  2. 重定向到授权页面           │
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
     │                            │  8. 获取用户信息              │
     │                            ├─────────────────────────────>│
     │                            │                               │
     │                            │  9. 返回用户信息              │
     │                            │<─────────────────────────────┤
     │                            │                               │
     │  10. 登录成功，跳转首页     │                               │
     │<───────────────────────────┤                               │
```

---

## 2. 技术选型

### 2.1 支持的 OAuth 提供商
| 提供商 | 优先级 | 说明 |
|--------|--------|------|
| **GitHub** | P0 | 开发者友好，API 文档完善 |
| **Google** | P1 | 用户基数大 |
| **Discord** | P2 | 游戏社区属性契合 |

### 2.2 技术栈
- **前端状态管理**: Pinia + 持久化插件
- **后端**: Hono (Cloudflare Workers)
- **Token 存储**: localStorage (前端) + D1 数据库 (可选)

---

## 3. 数据库设计

### 3.1 用户表 (users)

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,              -- 用户唯一 ID (UUID)
    provider TEXT NOT NULL,           -- OAuth 提供商 (github/google/discord)
    provider_user_id TEXT NOT NULL,   -- 第三方平台的用户 ID
    username TEXT NOT NULL,           -- 用户名
    avatar_url TEXT,                  -- 头像 URL
    email TEXT,                       -- 邮箱（可选）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- 索引
CREATE INDEX idx_users_provider ON users(provider, provider_user_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 3.2 OAuth 配置表 (oauth_configs)

```sql
CREATE TABLE IF NOT EXISTS oauth_configs (
    provider TEXT PRIMARY KEY,        -- github/google/discord
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT NOT NULL,
    auth_url TEXT NOT NULL,          -- OAuth 授权 URL
    token_url TEXT NOT NULL,         -- Token 交换 URL
    user_info_url TEXT NOT NULL,     -- 用户信息 API URL
    scopes TEXT NOT NULL,             -- 权限范围 (逗号分隔)
    enabled BOOLEAN DEFAULT true
);
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
  const user = ref<User | null>(null)

  // ========== 获取用户信息 ==========
  const { data: userData, execute: fetchUserInfo, clear } = useAsyncData(
    'userInfo',
    () => $fetch<User>('/api/user/me', {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    }),
    {
      server: false,          // 仅客户端执行
      immediate: false        // 手动触发
    }
  )

  // 监听 token 变化，自动获取用户信息
  watch(token, (val) => {
    if (val) {
      fetchUserInfo()
    } else {
      user.value = null
      clear()
    }
  }, { immediate: true })

  // ========== 跳转 OAuth 授权页面 ==========
  function toAuthPage(provider: 'github' | 'google' = 'github') {
    const configs = {
      github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        clientId: 'YOUR_GITHUB_CLIENT_ID',
        redirectUri: encodeURIComponent(import.meta.env.VITE_OAUTH_REDIRECT_URI)
      },
      google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        redirectUri: encodeURIComponent(import.meta.env.VITE_OAUTH_REDIRECT_URI)
      }
    }

    const config = configs[provider]

    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
      scope: provider === 'github' ? 'read:user user:email' : 'openid profile email',
      state: generateRandomState() // 防止 CSRF 攻击
    })

    // 保存 state 到 sessionStorage 用于验证
    sessionStorage.setItem('oauth_state', params.get('state')!)

    window.location.href = `${config.authUrl}?${params.toString()}`
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
        token_type: string
        scope?: string
      }>('/api/auth', {
        method: 'POST',
        body: { code }
      })

      if (res.access_token) {
        token.value = res.access_token
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to get token:', error)
      return false
    }
  }

  // ========== 登出 ==========
  function logout() {
    token.value = ''
    user.value = null
    clear()
    navigateTo('/')
  }

  // ========== 计算属性 ==========
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  return {
    // 状态
    token,
    user,
    isLoggedIn,

    // 方法
    toAuthPage,
    getToken,
    logout
  }
}, {
  persist: {
    storage: piniaPluginPersistedstate.localStorage(),
    pick: ['token', 'user']  // 持久化 token 和 user 信息
  }
})

// ========== 类型定义 ==========
interface User {
  id: string
  provider: string
  username: string
  avatar_url?: string
  email?: string
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
    <i class="i-mdi-github mr-2" />
    GitHub 登录
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
  authStore.toAuthPage('github')
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
    // 从环境变量获取 OAuth 配置
    const CLIENT_ID = c.env.GITHUB_CLIENT_ID
    const CLIENT_SECRET = c.env.GITHUB_CLIENT_SECRET
    const REDIRECT_URI = c.env.OAUTH_REDIRECT_URI

    // 调用 GitHub OAuth API
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange token')
    }

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return c.json({ error: tokenData.error_description }, 400)
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const githubUser = await userResponse.json()

    // 查询或创建用户
    const db = c.env.MISC_DB

    // 检查用户是否已存在
    const existingUser = await db
      .prepare('SELECT * FROM users WHERE provider = ? AND provider_user_id = ?')
      .bind('github', githubUser.id.toString())
      .first()

    let userId: string

    if (existingUser) {
      userId = existingUser.id as string
    } else {
      // 创建新用户
      userId = crypto.randomUUID()
      await db.prepare(`
        INSERT INTO users (id, provider, provider_user_id, username, avatar_url, email)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        'github',
        githubUser.id.toString(),
        githubUser.login,
        githubUser.avatar_url,
        githubUser.email
      ).run()
    }

    // 返回 access_token (可以是 GitHub 的，也可以自己生成 JWT)
    return c.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      user: {
        id: userId,
        provider: 'github',
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        email: githubUser.email
      }
    })

  } catch (error) {
    console.error('OAuth error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})
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

  // TODO: 这里应该验证 token（例如验证 JWT）
  // 暂时简化处理，直接放行
  // 实际应该从 token 解析出 userId
  // 或者查数据库验证 token 是否有效

  c.set('userId', 'user_id_from_token')

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
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  OAUTH_REDIRECT_URI: string
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

### 6.1 前端环境变量

**文件**: `.env`

```bash
# OAuth 回调地址
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback
```

**文件**: `.env.production`

```bash
VITE_OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

### 6.2 后端环境变量

**文件**: `wrangler.jsonc`

```json
{
  "vars": {
    "GITHUB_CLIENT_ID": "your_github_client_id",
    "GITHUB_CLIENT_SECRET": "your_github_client_secret",
    "OAUTH_REDIRECT_URI": "https://yourdomain.com/auth/callback"
  }
}
```

---

## 7. GitHub OAuth App 配置步骤

### 7.1 创建 OAuth App
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写配置：
   - **Application name**: DrawWat
   - **Homepage URL**: `https://yourdomain.com`
   - **Authorization callback URL**: `https://yourdomain.com/auth/callback`
4. 获取 `Client ID` 和 `Client Secret`

### 7.2 本地开发配置
在本地开发时，可以创建多个 OAuth App 或使用同一个，回调 URL 配置为：
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
- Token 设置过期时间
- 实现 Refresh Token 机制（可选）

### 8.3 防止重放攻击
- Authorization Code 只能使用一次
- Code 有效期短（通常 10 分钟）

### 8.4 输入验证
- 验证所有 OAuth 回调参数
- 验证返回的用户信息

---

## 9. 扩展：支持多个 OAuth 提供商

### 9.1 抽象 OAuth 服务

**文件**: `api/services/oauth.ts`

```typescript
interface OAuthConfig {
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

interface OAuthProvider {
  name: string
  config: OAuthConfig
  getUserInfo(token: string): Promise<OAuthUserInfo>
}

interface OAuthUserInfo {
  id: string
  username: string
  avatar_url?: string
  email?: string
}

// GitHub Provider
class GitHubProvider implements OAuthProvider {
  name = 'github'
  config: OAuthConfig

  constructor(env: Env) {
    this.config = {
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      redirectUri: env.OAUTH_REDIRECT_URI,
      scopes: ['read:user', 'user:email']
    }
  }

  async getUserInfo(token: string): Promise<OAuthUserInfo> {
    const res = await fetch(this.config.userInfoUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    return {
      id: data.id.toString(),
      username: data.login,
      avatar_url: data.avatar_url,
      email: data.email
    }
  }
}

// Google Provider
class GoogleProvider implements OAuthProvider {
  name = 'google'
  config: OAuthConfig

  constructor(env: Env) {
    this.config = {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.OAUTH_REDIRECT_URI,
      scopes: ['openid', 'profile', 'email']
    }
  }

  async getUserInfo(token: string): Promise<OAuthUserInfo> {
    const res = await fetch(this.config.userInfoUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    return {
      id: data.id,
      username: data.name,
      avatar_url: data.picture,
      email: data.email
    }
  }
}

export function createOAuthProvider(provider: string, env: Env): OAuthProvider {
  switch (provider) {
    case 'github':
      return new GitHubProvider(env)
    case 'google':
      return new GoogleProvider(env)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}
```

---

## 10. 实施检查清单

### 前端
- [ ] 创建 `src/store/auth.ts` Pinia store
- [ ] 创建 `src/views/AuthCallbackView.vue` 回调页面
- [ ] 创建 `src/components/LoginButton.vue` 登录组件
- [ ] 配置路由守卫（`router/index.ts`）
- [ ] 配置环境变量
- [ ] 测试登录流程

### 后端
- [ ] 创建数据库迁移文件（`users` 表）
- [ ] 实现 OAuth 认证 API（`api/routes/auth.ts`）
- [ ] 实现用户信息 API（`api/routes/user.ts`）
- [ ] 实现认证中间件
- [ ] 配置 `wrangler.jsonc` 环境变量
- [ ] 在 GitHub 创建 OAuth App

### 测试
- [ ] 测试完整 OAuth 流程
- [ ] 测试 Token 持久化
- [ ] 测试路由守卫
- [ ] 测试登出功能
- [ ] 测试错误处理

---

## 11. 参考资料

- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0 文档](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- 参考项目: [bgm-grid](https://github.com/shadowdreamer/bgm-grid)

---

**文档变更历史**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-13 | Claude | 初稿创建，基于 bgm-grid 项目设计 |

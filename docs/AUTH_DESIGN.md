# DrawWat 鉴权实现

核对日期：2026-10-23。本文以当前源码为准；配置及验证步骤见 [How-to-Auth.md](How-to-Auth.md)，缺陷见 [审核记录](README.md)。

## 登录链路

1. `src/store/auth.ts` 的 `toAuthPage()` 用 `crypto.getRandomValues` 生成 16 字节 state，保存为 localStorage `oauth_state`，跳转 `https://bgm.tv/oauth/authorize`，携带 client_id、response_type=code、redirect_uri、state。
2. `src/views/AuthCallbackView.vue` 要求回调 query 中同时有 code/state，调用 store `getToken()`。
3. store 比较本地 state，相符后删除，再将 JSON `{code}` 发往 `POST /api/auth`。state 检查只在浏览器进行；后端不接收或校验 state，未见 PKCE 实现。
4. `api/routes/auth.ts` 使用 client ID、secret、redirect URI 和 code 请求 `https://bgm.tv/oauth/access_token`，再用返回 Token 请求 `https://api.bgm.tv/v0/me`。
5. 后端按 provider=`bangumi` 和 provider_user_id 查询用户：已有用户更新资料和 Token；否则以 UUID 新建。返回 access_token、refresh_token、expires_in、token_type 以及 user（含 is_new_user）。
6. store 保存 token/refreshToken/user，Pinia persistence 插件写入 localStorage `drawwat-auth`。回调尝试读取当前回调 URL 的 redirect，否则回首页。原路由 redirect 未贯穿 OAuth，不应宣称登录后必然回原页。

没有单独的本地注册页、密码登录、JWT 签发或 HttpOnly Cookie 会话。业务 API 使用的就是 Bangumi access token。

## 后端鉴权

`api/middleware/auth.ts` 要求 `Authorization: Bearer <token>`，在 D1 users 查询 access_token 和 provider=`bangumi`，再按 token_expires_at 检查过期，设置上下文 userId/token。

每个受保护请求查询本地数据库，不逐次访问 Bangumi 校验撤销状态。缺失、未知、过期 Token 返回 401。中间件 try/catch 包含 `await next()`，下游抛出的错误也可能被映射为鉴权失败 401；不能假定所有 401 都是凭证失效。

用户资料由 `GET /api/user/me` 返回。`GET /api/user/me/puzzles` 只查当前用户的题。作者统计和删除接口另作 user_id 校验。公开接口与前端登录限制的差异见 [PRD](PRD.md)。

## 刷新与登出

`POST /api/auth/refresh` 接受 refresh_token，向 Bangumi 以 grant_type=refresh_token 换新 Token，按旧 refresh_token 更新 D1，返回第三方响应。它不要求现有 Bearer Token，也未用 Zod 定义刷新响应/请求的完整类型校验。

store 的 `refreshAccessToken()` 会更新两个 Token，刷新失败时 logout。当前没有定时器、过期预检或 401 拦截器调用此方法；没有保存 expires_in 来安排自动续期。

logout 只清空本地 Token 和 user，并通过持久化保存清空结果；没有服务端退出接口、远端 Token 撤销或删除 D1 Token。不能描述为退出即使所有会话失效。一个用户记录只保存一组 Token，多次登录/刷新覆盖后，旧会话可能无法继续通过本地鉴权。

## 前端登录状态

`isLoggedIn` 仅检查 token 和 user 非空。路由守卫保护 `/create`、`/puzzle/:id`、`/puzzle/:id/stats`、`/my-puzzles`，未登录跳首页并携带 redirect/showLogin。该检查不确认 Token 有效性；业务权限仍依赖后端。

store 内部有 fetchUserInfo 和 token watcher，但初始化判断发生于 store 创建阶段，不能据此保证持久化恢复后的凭证已得到服务器验证。

## 存储与安全现状

- users 的 Token 字段由迁移 0002 添加，直接存入 D1；没有独立 sessions 表或应用层加密。
- Token 可由前端 JS 读取，当前 getToken 调试日志还输出整个 localStorage，可能暴露凭证，需优先处理。
- OAuth secret 只应供 Worker 使用，变量名为 `BGM_APP_SECRET`；不要改成 VITE_ 前缀暴露给客户端。
- API CORS 配置 origin=`*`，允许 Authorization 和 Content-Type；这不是用户权限控制。
- 客户端 state 校验已实现，但不能据此声称实现服务端 state、PKCE、Token 撤销、重放防护或完整安全验收。

## 进度

已实现：第三方跳转、客户端 state 检查、code 换 Token、用户写入、Bearer 中间件、用户信息接口、路由守卫、本地持久化、手动刷新方法和本地登出。

部分实现：Token 续期、登录后返回原页面、恢复会话的有效性校验。

待验证：真实 Bangumi 授权与刷新、远端应用回调配置、实际部署 secret、失效凭证流程、多标签页与多设备行为。类型检查通过不能替代这些验收。

# DrawWat 授权配置与验证

核对日期：2026-10-23。这里只记录项目代码实际使用的 OAuth 流程，不复制第三方通用文档作为已实现功能。完整实现见 [AUTH_DESIGN.md](AUTH_DESIGN.md)。

## 配置项

| 名称 | 前端用途 | Worker 用途 |
| --- | --- | --- |
| `VITE_BGM_CLIENT_ID` | `import.meta.env` 构造授权 URL | `c.env` 向 Bangumi 交换/刷新 Token |
| `VITE_BGM_REDIRECT_URI` | 构造授权 URL；缺失时 fallback 当前 origin + `/auth/callback` | 交换/刷新 Token 的 redirect_uri，无相同 fallback |
| `BGM_APP_SECRET` | 不应提供给客户端 | Bangumi Token 请求的 client_secret |
| `MISC_DB` | 无 | D1 binding，保存用户及凭证 |
| `STATIC_BUCKET` | 无 | R2 binding，创建/删除谜题图片 |

前端和 Worker 的变量读取方式不同，不应仅配置其中一侧。前端 VITE_ 变量会进入构建结果，修改后需重新构建。仓库 Wrangler vars 当前配置回调 `https://draw.dovahkiin.top/auth/callback`，D1 database_name 为 `drawwat`，R2 bucket_name 为 `static`。具体部署账号、域名可用性、远端 secret 和 Bangumi 应用配置未核验。

不要打印、提交或复制本地 secret 文件及构建生成的 `.dev.vars`。本次审核未读取这些文件内容。

## 本地准备

Node 版本要求来自 package.json：`^20.19.0 || >=22.12.0`；使用 pnpm。

```powershell
pnpm install
pnpm wrangler d1 migrations apply drawwat --local
pnpm dev
```

迁移目录为 `api/migrations`，需包含 0001 至 0004。旧示例中的数据库名 `misc` 不符合当前配置。`--local` 明确指向本地；线上迁移不属于本次文档审核执行范围。

为 Vite 提供前端所需 VITE_ 变量，并在 Worker 本地环境配置对应变量和 BGM_APP_SECRET。开发回调必须与当前使用的 Bangumi 应用配置匹配，不能假定任意 localhost 地址都可用。生产 secret 可通过 Wrangler secret 机制设置，勿写进前端变量。

```powershell
pnpm type-check
pnpm build-only
pnpm preview
```

`preview` 脚本实际执行 build 后运行 wrangler dev；`deploy` 会 build 后部署，因此不是只读检查命令。本次未执行部署。

## 待执行的联调验收

下列步骤是验证计划，尚未在本次审核中完成。

1. 点击登录，确认跳往 Bangumi 授权页，回调具有 code/state；错误或缺失 state 应在前端被拒绝。
2. 确认 `/api/auth` 成功返回当前字段、首次建立用户、再次登录更新同一用户。
3. 用返回 access_token 请求 `/api/user/me`；缺失、伪造及过期 Token 应返回 401。
4. 手动验证 `/api/auth/refresh`，确认新 Token 保存到数据库及前端；当前页面不会自动触发刷新。
5. 从需登录的深链接进入并登录，检查原页面是否恢复；当前代码有 redirect 丢失问题。
6. 登出后确认前端清空状态；服务端不会主动撤销原 Token。
7. 验证非作者无法查看作者统计或删除题目，放弃后无法继续猜测。

项目没有实现“查询 OAuth 授权信息”独立代理接口；`/api/user/me` 查的是本地用户记录，不能当作第三方实时授权状态查询。

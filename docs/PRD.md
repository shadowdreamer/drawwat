# DrawWat 产品实现与进度

代码核对日期：2026-10-23。状态定义和缺陷见 [审核记录](README.md)。本文描述当前实现，不把需求设想当作交付。

## 产品与架构

DrawWat 是在线绘画出题、分享链接和猜图答案的应用。前端 Vue 3 + Vue Router + Pinia，画板由 Vue 组件通过 React root 承载 Excalidraw；后端为 Cloudflare Workers + Hono，D1 保存业务记录，R2 保存图片。UnoCSS + DaisyUI 提供样式。

入口为 `src/main.ts`、`api/index.ts`。`wrangler.jsonc` 配置 SPA fallback，`/api/*` 优先进入 Worker。当前没有 `pnpm-workspace.yaml`，package.json 使用直接版本依赖，不应描述为 catalog monorepo。包名仍为 `cf-worker-template`，版本 `0.0.0`，不据此推断发布状态。

## 功能进度

| 功能 | 状态 | 当前实现与证据 |
| --- | --- | --- |
| Bangumi 登录、首次登录建用户 | 已实现 | `api/routes/auth.ts`、`src/store/auth.ts`；没有独立密码注册体系 |
| Token 刷新 | 部分实现 | POST 接口和 store 方法存在，无自动调用 |
| 在线画板 | 已实现 | `ExcalidrawCanvas.vue` 提供中文 Excalidraw、本地草稿、清空和 WebP 导出，最长边不超过 1280；创建页仅挂载一个实例 |
| 创建谜题 | 已实现 | `CreatePuzzleView.vue` 使用 multipart 上传画板导出图；答案、提示、大小写、公开选项、过期选项 |
| 永久有效 | 存在缺陷 | UI 提供永久选项，后端实际落为默认 14 天 |
| 分享链接 | 已实现 | `ShareModal.vue` 复制 URL 或问候语加 URL；没有二维码或分享海报 |
| 谜题广场 | 已实现 | `PlazaView.vue` 和 `/api/public-puzzles`，按创建时间倒序，默认每页 20 条，包含过期题 |
| 猜测与字符提示 | 已实现 | `PuzzleView.vue` 和 guess API；匹配规则见下文 |
| 个人猜测历史、成功榜 | 已实现 | 按猜测时间倒序、首次成功时间正序 |
| 放弃与揭晓 | 已实现 | 放弃记录、名单、状态、放弃后查看答案；放弃后后端拒绝猜测 |
| 作者统计、我的谜题 | 已实现 | `PuzzleStatsView.vue`、`MyPuzzlesView.vue`；查看答案、次数、正确率、成功记录 |
| 删除谜题 | 已实现 | 作者鉴权、确认弹窗、R2 删除及数据库删除；失败一致性见审核记录 |
| 主题与响应式 | 部分实现 | 亮暗主题及刷新恢复、响应式单实例画板、柔光 UI 已实现；桌面与手机视口通过本地浏览器验证，真机验收未完成 |
| 分类/标签、点赞、评论、出题者总榜 | 未实现 | 当前无相应路由、表和交互 |
| 编辑谜题、搜索、实时多人协作 | 未实现 | 当前无相应应用接口/流程 |

## 业务规则

- 默认公开、默认不区分大小写、默认 14 天。UI 另有 1 天、3 天、1 周、永久选项；永久目前有缺陷。答案和提示的 500 字限制仅在创建页 input/textarea，后端未做同等长度约束。
- 前端 trim 答案与猜测；后端比较只按 `case_sensitive` 决定是否 `toLowerCase()`，不做空格、标点、全半角、Unicode 规范化或模糊匹配。
- 错答返回 `correct_chars`（按出现频次限制的字符交集数）、`correct_positions`（相同位置数）、`answer_length`。位置和长度使用 JS 字符串索引/length，字符频次使用 `for...of`，对部分 emoji 的计数单位不一致。
- 过期后仍接受猜测并保存 `is_after_expiry`，但不进入成功榜，也不计入作者统计。广场 `guesses_count` 和错答聚合包含过期后记录，不能泛称所有统计都排除过期猜测。
- 成功榜每题每用户最多一条，按 `solved_at` 升序。`time_to_solve` 从谜题创建时刻算到成功时刻，不是用户开始作答后的耗时。
- 作者不能猜自己题，也不能放弃自己的题。已进入成功榜的用户不能放弃；已放弃用户不能猜测。前端禁止已答对者再次作答，后端仍接受重复猜测。
- 未过期答案可通过猜对响应、作者统计或放弃后接口获得；过期答案需要登录请求 answer 接口。
- `is_public=false` 仅表示不在广场列出，持有 ID 者仍可读取公开详情/榜单等接口；不是访问控制或图片隐私保护。

## 页面

| 路径 | 是否需前端登录 | 实现 |
| --- | --- | --- |
| `/` | 否 | 首页、登录提示和入口 |
| `/plaza` | 否 | 公开谜题分页 |
| `/auth/callback` | 否 | OAuth code/state 处理 |
| `/create` | 是 | 画板、设置、创建、分享 |
| `/puzzle/:id` | 是 | 猜谜、历史、榜单、错答、放弃/揭晓 |
| `/puzzle/:id/stats` | 是 | 作者统计，后端进一步校验作者身份 |
| `/my-puzzles` | 是 | 自己创建的谜题、分享/统计/删除 |

`AboutView.vue` 存在但未注册路由。前端详情页要求登录，不等于详情 API 要求登录。

## API 清单

前缀均为 `/api`。下表依据 `api/index.ts` 和 `api/routes/*.ts`。

| 方法 | 路径 | 鉴权与行为 |
| --- | --- | --- |
| GET | `/health` | 公开，返回 healthy；不探测数据库或 R2 |
| POST | `/auth` | 公开，JSON `{code}`，交换 Bangumi Token 并 upsert 用户 |
| POST | `/auth/refresh` | 无 Bearer 校验，凭 JSON `refresh_token` 向 Bangumi 刷新 |
| GET | `/user/me` | Bearer，当前用户 |
| GET | `/user/me/puzzles` | Bearer，自己的题，含答案及有效期内猜测统计；无分页 |
| GET | `/bangumi/user/:userId` | 公开，代理 Bangumi 用户信息 |
| POST | `/puzzles` | Bearer，multipart `image`、`answer` 必需；`hint`、`case_sensitive`、`expires_in`（秒）、`is_public` 可选；返回 id/share_url/expires_at/created_at |
| GET | `/public-puzzles` | 公开，query `page`、`pageSize`，返回 puzzles/total/page/pageSize/totalPages |
| GET | `/puzzles/:id` | 公开，不含答案，含图片 key、提示、过期状态、作者 |
| DELETE | `/puzzles/:id` | Bearer，仅作者 |
| GET | `/puzzles/:id/stats` | Bearer，仅作者，答案/有效猜测次数/正确次数/正确率/成功记录 |
| POST | `/puzzles/:id/guess` | Bearer，JSON `{answer}`；返回 is_correct/is_expired/is_counted，正确时附 correct_answer，错误时附 hint |
| GET | `/puzzles/:id/guesses` | Bearer，只返回当前用户猜测和计数 |
| GET | `/puzzles/:id/solves` | 公开，成功列表、rank、total_solves |
| GET | `/puzzles/:id/wrong-guesses` | 公开，原始错答分组按次数倒序，最多 50 项；total_wrong_guesses 是返回分组数，不是错答总次数 |
| POST | `/puzzles/:id/give-up` | Bearer，放弃，返回 success |
| GET | `/puzzles/:id/gave-up` | 公开，放弃者名单和 total |
| GET | `/puzzles/:id/give-up-status` | Bearer，当前用户 has_given_up |
| GET | `/puzzles/:id/answer` | Bearer，仅过期后返回答案 |
| GET | `/puzzles/:id/answer-after-give-up` | Bearer，仅有放弃记录者 |

## 数据与图片

以 `api/migrations/` 为结构依据，共四个迁移：

1. `0001_initial.sql`：users、puzzles、guesses、puzzle_solves 及索引。
2. `0002_add_bgm_token_fields.sql`：users 添加 access_token、refresh_token、token_expires_at（Unix 秒）。
3. `0003_add_is_public_to_puzzles.sql`：puzzles 添加 is_public，默认 1。
4. `0004_add_puzzle_gives_up.sql`：放弃记录表及索引。

用户以 `(provider, provider_user_id)` 唯一；成功和放弃分别以 `(puzzle_id, user_id)` 唯一。关联表声明删除级联；真实数据库应用情况未核验。答案与 OAuth Token 当前直接存储，未见应用层加密。

图片存入 `STATIC_BUCKET`，key 为 `drawwat/YYYY-MM/<uuid>.webp`，数据库 `image_url` 实际存 key。后端不转码，只用上传文件的 MIME 写 R2 metadata。前端通过 `src/constants/index.ts` 的 `https://static.dovahkiin.top` 拼 URL；没有 Worker 图片代理或签名访问机制。

## 后续进度与验收

优先修复 [审核记录](README.md) 中的画板、永久期限、鉴权日志和会话流程，再进行真实 OAuth、迁移、R2 上传/删除及浏览器回归。响应速度、可用性、用户增长等没有仓库内测量证据，不列为已达成指标。

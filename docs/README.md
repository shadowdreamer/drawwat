# DrawWat 文档索引与代码审核

审核日期：2026-10-23。依据当前工作区的源码、迁移、配置及本地检查重建；旧文档不作为实现证据。

- [产品实现与进度](PRD.md)：功能、规则、API、数据模型。
- [鉴权实现](AUTH_DESIGN.md)：OAuth、Token 保存与权限边界。
- [授权配置与验证](How-to-Auth.md)：实际配置项和验证步骤。
- [界面实现](UI_REQUIREMENTS.md)：页面、组件、主题和交互状态。

## 状态含义与验证边界

“已实现”表示仓库存在对应实现，不代表线上验收通过。“部分实现”表示入口或主要逻辑存在，但有已知缺陷或缺少调用链。“未实现”表示当前源码未发现相应页面、接口或数据模型。“待验证”表示需浏览器、第三方账号或部署环境确认。

本次检查覆盖 `src/`、`api/`、数据库迁移、Vite/UnoCSS/Wrangler/TypeScript 配置及 package scripts。未调用真实 OAuth、未访问线上 D1/R2、未部署、未进行浏览器或无障碍验收。仓库未发现自动化测试用例或 test script。

## 审核发现与后续工作

以下为代码审核结果，未在本次文档修订中修改业务代码。优先级是建议处理顺序。

| 优先级 | 问题及影响 | 代码证据 / 后续工作 |
| --- | --- | --- |
| 高 | OAuth 校验日志输出整个 localStorage，可能把已保存的 access/refresh token 写入控制台 | `src/store/auth.ts` 的 `getToken`；移除敏感日志 |
| 已修复 | 创建页原有重复画板与全局 ID 查找问题 | 已改用 `ExcalidrawCanvas.vue` 单实例及组件引用，设备验收待做 |
| 中 | “永久”提交 0，却被 `parseInt(...) || 1209600` 替换成 14 天 | `api/routes/puzzle.ts` 创建接口；修正默认值处理 |
| 中 | 有刷新接口和 store 方法，但没有自动刷新调用或 401 后重试；路由仅依据本地 token/user 是否存在判断登录 | `src/store/auth.ts`、`src/router/index.ts`；补齐会话恢复与过期流程 |
| 中 | 守卫保存的 redirect 未贯穿 OAuth 跳转，登录后通常回首页 | `src/router/index.ts`、`src/store/auth.ts`、`src/views/AuthCallbackView.vue`；持久化并恢复站内目标 |
| 中 | 上传未校验类型、大小、文件结构；答案和分页参数也缺乏完整服务端边界校验，未见限流 | `api/routes/puzzle.ts`；补齐输入校验和滥用防护 |
| 中 | 已答对用户可直接重复调用 guess API，继续增加猜测和正确次数；前端禁用并非后端约束 | `api/routes/puzzle.ts` 的 `existingSolve` 只约束成功榜插入；明确是否禁止重复提交 |
| 中 | 猜测、首次成功、放弃使用多次独立查询/写入，并发下可能竞态或唯一约束报错 | `api/routes/puzzle.ts`；核验并发一致性与幂等行为 |
| 中 | R2 上传成功但 D1 插入失败时无对象回收；删除 R2 失败仍删除数据库记录 | `api/routes/puzzle.ts`；补偿与清理机制未实现 |
| 已修复 | 主题存储格式冲突导致刷新恢复异常 | `src/store/theme.ts` 已统一字符串存储并兼容旧 JSON，亮暗切换及刷新恢复已验证 |
| 已修复 | 原画板在主入口同步加载、reset import 缺少分号 | Excalidraw 随创建路由加载，CSS 分号已补齐；画板自身仍有大 chunk 告警 |
| 已移除 | 原 tldraw 许可证硬编码 | tldraw 依赖和集成已替换为 MIT 许可的 Excalidraw |

## 本地验证记录

环境：Node v22.22.0、pnpm 9.11.0。

- `pnpm type-check`：通过，覆盖三个 TypeScript project references。
- `pnpm build-only`：生成 Worker 和客户端产物；出现 Radix `use client` 被忽略、CSS 语法、大 chunk 告警。首次运行另有沙箱禁止写 Wrangler 用户目录日志的 EPERM，复查将日志指向工作区的 `node_modules/.tmp/`。
- 类型检查和构建不证明 OAuth、D1/R2、画板、主题或线上业务正确。真实环境验收仍待执行。

### Excalidraw 替换验证（2026-10-23）

- `pnpm build`：类型检查、Worker 和客户端构建通过；CSS 语法告警已消除，仍有第三方 Radix 指令和大 chunk 告警。
- 本地生产产物经无头 Chrome 检查：绘制矩形、刷新恢复草稿、切换暗色画板、导出并模拟上传 WebP、提交成功后清空、390px 移动布局单实例、空画板拒绝提交、损坏草稿回退均通过，未捕获页面异常。示例导出为 220×170、2058 字节。
- 浏览器验证使用模拟登录和 API，未验证真实 OAuth、D1/R2 上传或真实移动设备；Excalidraw 集成方式及导出 API 参照[官方集成文档](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)和[导出文档](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export)。


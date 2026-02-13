# 产品需求文档 (PRD)
## 图片谜题猜谜应用 - DrawWat

**版本**: v1.2
**创建日期**: 2026-02-13
**文档状态**: 迭代中

---

## 1. 产品概述

### 1.1 产品愿景
DrawWat 是一个面向小范围熟人社区的图片猜谜互动应用。所有用户必须登录才能使用，用户可以上传图片（或使用在线画板创作）并设置谜底和提示语，生成唯一分享链接发送给社区朋友。其他人通过链接访问，观看图片并猜测答案，系统提供类似 Wordle 的字符位置提示，形成有趣的熟人互动体验。

### 1.2 核心价值
- **熟人社区**: 专注小范围好友互动，所有用户需登录认证
- **创作多样**: 支持图片上传 + 在线画板创作，答案可配提示语
- **分享便捷**: 生成唯一链接，在社区内分享
- **智能提示**: 类 Wordle 式的字符位置反馈，增加猜谜乐趣

---

## 2. 用户角色

**说明**: 所有功能都需要用户登录后才能使用

| 角色 | 描述 | 权限 |
|------|------|------|
| **出题者** | 创建和发布谜题的用户 | 上传图片/画板创作、设置答案和提示语、生成分享链接、查看猜测统计 |
| **猜谜者** | 通过链接参与猜谜的用户 | 查看图片、提交答案、查看字符提示、查看猜测历史、查看是否正确 |

---

## 3. 核心功能

### 3.1 出题功能（MVP）
1. **图片来源**
   - **上传图片**: 支持常见图片格式（JPG、PNG、WEBP、GIF）
   - 文件大小限制（建议 5MB 以内）
   - 图片预览
   - **在线画板** (Post-MVP): 集成开源画板组件，支持在线创作

2. **设置答案**
   - 输入谜底答案（文本）
   - 答案可以是单词、短语或句子
   - **答案长度提示**: 自动显示答案字符数

3. **设置提示语** (可选)
   - 出题者可添加提示语帮助猜谜者
   - 提示语会显示在猜谜页面

4. **设置过期时间**
   - 默认 2 周后过期
   - 可选择自定义过期时间
   - 可选择永不过期
   - 过期后仍可猜测，但不计入统计

5. **生成分享链接**
   - 自动生成唯一谜题 ID
   - 生成可分享的 URL
   - 一键复制链接功能

6. **出题者查看**
   - 查看自己创建的谜题
   - 查看猜测统计（总次数、正确率，不含过期后猜测）
   - 查看所有猜测记录
   - 查看成功用户排行榜（谁最先猜出）

### 3.2 猜谜功能（MVP）
1. **访问谜题**
   - 通过分享链接访问谜题页面（需登录）
   - 显示谜题图片
   - 显示出题者设置的提示语（如有）
   - 显示谜题是否已过期

2. **提交答案与智能反馈**
   - 输入猜测的答案
   - 提交答案
   - **类 Wordle 字符提示**:
     - 显示答案长度（N 个字符）
     - 对于错误答案，显示：
       - 有 X 个字符正确（不论位置）
       - 有 Y 个字符位置正确
     - 示例：答案 "APPLE"，猜测 "ALPHA" → "2 个字符正确，1 个位置正确"
   - 正确时显示成功提示

3. **过期谜题特殊处理**
   - 过期后可点击按钮查看答案
   - 过期后的猜测仍可提交，获取字符提示
   - **过期后的猜测不计入统计**（不影响总次数、正确率）
   - 过期前首次猜对的用户会记录时间和排名

4. **查看猜测历史**
   - 显示之前的所有猜测记录
   - 标注哪些是正确的
   - 显示每次猜测的字符提示

5. **查看成功用户排行榜**
   - 显示最先猜对谜题的用户列表
   - 显示每个用户从创建到猜对所用的时间
   - 按猜对时间排序

6. **显示统计信息**
   - 总猜测次数（不含过期后猜测）
   - 正确猜测次数

### 3.3 可选扩展功能（Post-MVP）
- **在线画板**: 集成开源画板组件（如 tldraw / fabric.js / excalidraw）
- 谜题分类/标签
- 点赞/收藏功能
- 评论系统
- 出题者排行榜
- 难度设置（简单/中等/困难）

---

## 4. 用户流程

### 4.1 出题者流程

```
1. 访问首页 → 登录/注册
   ↓
2. 点击"创建谜题"按钮
   ↓
3. 选择图片来源（上传图片 / 在线画板创作）
   ↓
4. 输入答案（可选：添加提示语）
   ↓
5. 点击"生成谜题"
   ↓
6. 获得分享链接
   ↓
7. 复制链接分享给朋友
```

### 4.2 猜谜者流程

```
1. 点击分享链接 → 登录/注册
   ↓
2. 查看谜题图片和提示语
   ↓
3. 思考并输入答案
   ↓
4. 提交答案
   ↓
5. 获得反馈（正确 + 类 Wordle 字符提示）
   ↓
6. 查看猜测历史和字符提示
   ↓
7. 继续猜测或放弃
```

---

## 5. 数据模型设计

### 5.1 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | 用户 ID (UUID) |
| provider | TEXT | NOT NULL | OAuth 提供商 (github/google/discord) |
| provider_user_id | TEXT | NOT NULL | 第三方平台的用户 ID |
| username | TEXT | NOT NULL UNIQUE | 用户名 |
| avatar_url | TEXT | | 头像 URL（可选） |
| email | TEXT | | 邮箱（可选） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 注册时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| UNIQUE(provider, provider_user_id) | | | 防止同一第三方账号重复注册 |

### 5.2 谜题表 (puzzles)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | 唯一谜题 ID (UUID) |
| user_id | TEXT | FOREIGN KEY → ON DELETE CASCADE | 创建者用户 ID |
| image_url | TEXT | NOT NULL | 图片存储 URL |
| answer | TEXT | NOT NULL | 正确答案 |
| hint | TEXT | | 提示语（可选） |
| case_sensitive | BOOLEAN | DEFAULT false | 是否区分大小写 |
| expires_at | DATETIME | NULL | 过期时间，NULL 表示永不过期（由应用层计算） |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 5.3 猜测记录表 (guesses)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | 记录 ID (UUID) |
| puzzle_id | TEXT | FOREIGN KEY → ON DELETE CASCADE | 关联的谜题 ID |
| user_id | TEXT | FOREIGN KEY → ON DELETE CASCADE | 猜测者用户 ID |
| guess_answer | TEXT | NOT NULL | 用户猜测的答案 |
| is_correct | BOOLEAN | NOT NULL | 是否正确 |
| correct_chars | INTEGER | | 正确字符数（不含位置） |
| correct_positions | INTEGER | | 位置正确的字符数 |
| is_after_expiry | BOOLEAN | DEFAULT false | 是否过期后提交的猜测 |
| guessed_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 猜测时间 |

### 5.4 成功记录表 (puzzle_solves)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | TEXT | PRIMARY KEY | 记录 ID (UUID) |
| puzzle_id | TEXT | FOREIGN KEY → ON DELETE CASCADE | 关联的谜题 ID |
| user_id | TEXT | FOREIGN KEY → ON DELETE CASCADE | 猜对者用户 ID |
| solved_at | DATETIME | NOT NULL | 首次猜对时间 |
| time_to_solve | INTEGER | | 从谜题创建到猜对的时间（秒） |
| UNIQUE(puzzle_id, user_id) | | | 每个用户对每个谜题只记录首次成功 |

### 5.5 数据库说明

#### 5.5.1 SQLite 兼容性
- **expires_at 计算**: SQLite 不支持函数式默认值（如 `DEFAULT (created_at + 14 days)`），过期时间由应用层计算后插入
- **外键级联**: 所有外键使用 `ON DELETE CASCADE`，确保删除用户或谜题时自动清理关联数据
- **UUID 生成**: 使用 `crypto.randomUUID()` 或数据库函数生成唯一标识符

### 5.6 索引设计
```sql
-- users 表索引
CREATE INDEX idx_users_provider ON users(provider, provider_user_id);
CREATE INDEX idx_users_username ON users(username);

-- puzzles 表索引
CREATE INDEX idx_puzzles_user_id ON puzzles(user_id);
CREATE INDEX idx_puzzles_created_at ON puzzles(created_at DESC);
CREATE INDEX idx_puzzles_expires_at ON puzzles(expires_at);

-- guesses 表索引
CREATE INDEX idx_guesses_puzzle_id ON guesses(puzzle_id);
CREATE INDEX idx_guesses_user_id ON guesses(user_id);
CREATE INDEX idx_guesses_guessed_at ON guesses(guessed_at DESC);

-- puzzle_solves 表索引
CREATE INDEX idx_puzzle_solves_puzzle_id ON puzzle_solves(puzzle_id);
CREATE INDEX idx_puzzle_solves_solved_at ON puzzle_solves(solved_at ASC);
```

---

## 6. API 接口设计

### 6.1 谜题管理 API

#### POST /api/puzzles
**描述**: 创建新谜题
**请求体**:
```json
{
  "image": "base64_encoded_image_data",  // 或使用 FormData multipart
  "answer": "谜底答案",
  "hint": "提示语（可选）",
  "expires_in": 1209600  // 可选，过期秒数，默认 1209600（14天），0 表示永不过期
}
```
**响应**:
```json
{
  "id": "uuid",
  "share_url": "https://drawwat.com/puzzle/{uuid}",
  "expires_at": "2025-02-27T10:00:00Z",
  "created_at": "2025-02-13T10:00:00Z"
}
```

#### GET /api/puzzles/:id
**描述**: 获取谜题详情（不包含答案）
**响应**:
```json
{
  "id": "uuid",
  "image_url": "https://...",
  "hint": "提示语（如有）",
  "answer_length": 5,
  "is_expired": false,
  "expires_at": "2025-02-27T10:00:00Z",
  "created_at": "2025-02-13T10:00:00Z"
}
```

#### GET /api/puzzles/:id/stats
**描述**: 获取谜题统计（包含答案，仅限出题者查看）
**权限**: 仅谜题创建者可访问
**响应**:
```json
{
  "id": "uuid",
  "answer": "谜底答案",
  "total_guesses": 10,
  "correct_guesses": 3,
  "accuracy_rate": 0.3,
  "is_expired": false,
  "solves": [
    {
      "username": "用户A",
      "solved_at": "2025-02-13T11:00:00Z",
      "time_to_solve": 3600
    }
  ],
  "guesses": [
    {
      "guess_answer": "猜测1",
      "is_correct": false,
      "guessed_at": "2025-02-13T11:00:00Z"
    }
  ]
}
```
**错误响应**:
```json
{
  "error": "forbidden",
  "message": "仅出题者可查看统计信息"
}
```

#### GET /api/puzzles/:id/answer
**描述**: 查看过期谜题的答案（需登录）
**响应**:
```json
{
  "answer": "谜底答案",
  "is_expired": true
}
```
**错误响应**:
```json
{
  "error": "puzzle_not_expired",
  "message": "此谜题尚未过期，无法查看答案"
}
```

### 6.2 猜测 API

#### POST /api/puzzles/:id/guess
**描述**: 提交猜测
**请求体**:
```json
{
  "answer": "用户的猜测答案"
}
```
**响应**:
```json
{
  "is_correct": false,
  "is_expired": false,
  "is_counted": true,
  "message": "再想想...",
  "hint": {
    "correct_chars": 2,
    "correct_positions": 1,
    "answer_length": 5
  }
}
```
正确时响应:
```json
{
  "is_correct": true,
  "is_expired": false,
  "is_counted": true,
  "correct_answer": "谜底答案",
  "message": "恭喜你答对了！",
  "time_to_solve": 3600
}
```
过期后猜测响应:
```json
{
  "is_correct": false,
  "is_expired": true,
  "is_counted": false,
  "message": "此谜题已过期，猜测不会计入统计",
  "hint": {
    "correct_chars": 2,
    "correct_positions": 1,
    "answer_length": 5
  }
}
```

#### GET /api/puzzles/:id/guesses
**描述**: 获取谜题的所有猜测记录
**响应**:
```json
{
  "guesses": [
    {
      "guess_answer": "猜测1",
      "is_correct": false,
      "correct_chars": 2,
      "correct_positions": 1,
      "is_after_expiry": false,
      "guessed_at": "2025-02-13T11:00:00Z"
    }
  ],
  "total_count": 10,
  "correct_count": 3,
  "counted_count": 8  // 不含过期后的猜测
}
```

#### GET /api/puzzles/:id/solves
**描述**: 获取谜题的成功用户排行榜
**响应**:
```json
{
  "solves": [
    {
      "user_id": "uuid",
      "username": "用户A",
      "solved_at": "2025-02-13T11:00:00Z",
      "time_to_solve": 3600,
      "rank": 1
    },
    {
      "user_id": "uuid",
      "username": "用户B",
      "solved_at": "2025-02-13T12:00:00Z",
      "time_to_solve": 7200,
      "rank": 2
    }
  ],
  "total_solves": 2
}
```

---

## 7. 前端页面设计

### 7.1 页面结构

| 路由 | 页面 | 描述 |
|------|------|------|
| `/` | 首页 | 展示产品介绍 + 登录/注册入口 |
| `/login` | 登录页 | 用户登录 |
| `/register` | 注册页 | 用户注册 |
| `/create` | 创建谜题 | 上传图片/画板创作、输入答案和提示语、设置过期时间的表单页面 |
| `/puzzle/:id` | 猜谜页面 | 显示图片 + 提示语 + 答案输入框 + 字符提示 + 猜测历史 + 成功排行榜 |
| `/puzzle/:id/stats` | 统计页面 | 谜题统计信息（可从猜谜页面访问） |
| `/my-puzzles` | 我的谜题 | 用户创建的谜题列表 |

### 7.2 UI/UX 要点

#### 创建谜题页面
- 图片来源选择（上传 / 在线画板）
- 简洁的图片上传区域（支持拖拽上传）
- 答案输入框（必填）
- 提示语输入框（可选）
- 过期时间设置（默认 2 周，可选自定义或永不过期）
- 预览区域（显示上传的图片、答案长度、提示语、过期时间）
- "生成谜题"按钮
- 成功后显示分享链接 + 一键复制按钮

#### 猜谜页面
- 大图展示（居中显示）
- 提示语区域（如有）
- 过期状态提示（是否已过期、过期时间）
- 答案输入框 + 提交按钮
- 答案长度提示
- **字符提示反馈**（类 Wordle 风格）:
  - 正确字符数（不含位置）
  - 位置正确的字符数
- **过期谜题特有功能**:
  - "查看答案"按钮（仅过期后显示）
  - 提示"此谜题已过期，猜测不会计入统计"
- 猜测历史列表（倒序显示，含字符提示、是否计入统计）
- 正确/错误反馈（使用颜色和动画）
- 查看统计按钮
- **成功用户排行榜**:
  - 显示最先猜对的用户列表
  - 显示每个用户的排名、用户名、所用时间
  - 按猜对时间排序

#### 响应式设计
- 移动端优先
- 图片自适应屏幕大小
- 按钮和输入框适合触摸操作

---

## 8. 技术需求

### 8.1 存储方案
- **图片存储**: 使用 Cloudflare R2 或类似对象存储
- **数据库**: Cloudflare D1 (SQLite)
- **CDN**: Cloudflare CDN

### 8.2 图片处理
- 图片上传验证（格式、大小）
- 图片压缩（优化加载速度）
- 生成缩略图（可选）

### 8.3 性能要求
- 首页加载时间 < 2s
- 猜谜页面加载时间 < 1s
- API 响应时间 < 500ms
- 图片加载优化（懒加载、渐进式加载）

### 8.4 安全性
- 防止恶意上传（文件类型检查、大小限制）
- 防止暴力破解（答案猜测频率限制）
- 输入验证和清理（防止 XSS）
- HTTPS 强制跳转

---

## 9. 实施计划

### Phase 1: MVP（最小可行产品）
- [x] 项目初始化
- [ ] 数据库设计和迁移（用户表、谜题表、猜测表、成功记录表）
- [ ] 用户登录/注册功能
- [ ] 图片上传功能
- [ ] 谜题创建 API（含答案、提示语、过期时间）
- [ ] 猜谜提交 API（含字符匹配提示、过期判断）
- [ ] 查看答案 API（过期谜题）
- [ ] 成功排行榜 API
- [ ] 前端登录/注册页面
- [ ] 前端创建谜题页面（含过期时间设置）
- [ ] 前端猜谜页面（含字符提示、过期状态、查看答案按钮、成功排行榜）
- [ ] 基础样式和响应式布局

### Phase 2: 功能完善
- [ ] 统计页面（含成功排行榜）
- [ ] 猜测历史展示（含字符提示、过期标记）
- [ ] 我的谜题列表
- [ ] 过期谜题的猜测不计入统计逻辑
- [ ] 错误处理和用户反馈
- [ ] 性能优化
- [ ] 移动端体验优化

### Phase 3: 增强功能
- [ ] **在线画板**（集成开源组件：tldraw / fabric.js）
- [ ] 谜题分类/标签
- [ ] 点赞功能
- [ ] 评论系统
- [ ] 出题者排行榜

---

## 10. 成功指标

| 指标 | 目标 | 说明 |
|------|------|------|
| 谜题创建率 | 20%+ | 登录用户中创建谜题的比例 |
| 猜测完成率 | 60%+ | 访问谜题的用户中提交猜测的比例 |
| 平均猜测次数 | 3次/谜题 | 每个谜题平均收到的猜测次数 |
| 社区活跃度 | 50%+ | 七日内活跃用户比例 |

---

## 11. 风险与挑战

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 图片存储成本 | 中 | 使用 Cloudflare R2 降低存储成本，限制图片大小 |
| 社区氛围管理 | 高 | 实施登录认证，社区内举报机制 |
| 答案匹配准确性 | 中 | 严格匹配 + 字符提示，辅助用户理解规则 |

---

## 12. 后续迭代方向

1. **在线画板完善**
   - 集成开源画板组件（tldraw / fabric.js / excalidraw）
   - 保存画板作品为图片
   - 画板模板库

2. **高级功能**
   - 多图谜题（故事类谜题）
   - 计时模式（限时猜谜）
   - 多人对战模式

3. **社区功能增强**
   - 关注出题者
   - 谜题收藏
   - 社区动态

---

## 附录：术语表

| 术语 | 定义 |
|------|------|
| 谜题 (Puzzle) | 由出题者创建的图片+答案的组合 |
| 猜测 (Guess) | 猜谜者提交的答案 |
| 谜题 ID | 唯一标识符，用于生成分享链接 |
| 分享链接 | 包含谜题 ID 的 URL，用于分享给他人 |
| 正确率 | 正确猜测次数 / 总猜测次数 |
| 过期时间 | 谜题的有效期，默认 14 天，过期后猜测不计入统计 |
| 成功记录 (Solve) | 用户首次猜对谜题的记录，包含猜对时间 |
| 计入统计 | 仅过期前的猜测计入谜题的统计次数 |

---

**文档变更历史**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-13 | Claude | 初稿创建 |
| v1.1 | 2026-02-13 | Claude | 重构为熟人社区应用，添加必须登录、答案提示语、类Wordle字符提示、在线画板功能，删除增长与商业化需求 |
| v1.2 | 2026-02-13 | Claude | 添加谜题过期机制（默认2周）、过期后可查看答案、过期猜测不计入统计、成功用户排行榜功能 |
| v1.3 | 2026-02-13 | Claude | 修复用户表结构与 AUTH_DESIGN 一致，添加 provider、provider_user_id、avatar_url、updated_at 字段；更新外键级联策略；添加 SQLite 兼容性说明；更新索引设计；添加统计 API 权限说明 |

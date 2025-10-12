# CF Worker Hono Vue3 模板

一个结合了 Cloudflare Workers、Hono、Vue 3、UnoCSS 和 DaisyUI 的现代全栈模板项目，用于构建具有无服务器架构的强大 Web 应用程序。

## 特性

- **前端**: Vue 3 配合 TypeScript、Vite 和现代开发工具
- **后端**: 运行在 Cloudflare Workers 上的 Hono 框架
- **样式**: UnoCSS 配合 DaisyUI 组件，实现快速 UI 开发
- **状态管理**: Pinia 支持持久化
- **路由**: Vue Router 用于 SPA 导航
- **数据库**: Cloudflare D1 数据库支持，包含迁移功能
- **部署**: 针对 Cloudflare Workers 部署进行了优化

## 技术栈

- **运行时**: Cloudflare Workers
- **后端**: Hono
- **前端**: Vue 3 + TypeScript
- **构建工具**: Vite
- **CSS 框架**: UnoCSS + DaisyUI
- **状态管理**: Pinia
- **数据库**: Cloudflare D1

## 快速开始

### 前置条件

- Node.js (v20.19.0 或 v22.12.0+)
- pnpm 包管理器
- 启用了 Workers 的 Cloudflare 账户

### 安装

1. 克隆此仓库：
   ```bash
   git clone <repository-url>
   cd cf-worker-hono-vue3-template
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

3. 设置您的 Cloudflare D1 数据库：
   - 在 Cloudflare 控制台中创建 D1 数据库
   - 更新 `wrangler.jsonc` 中的 `database_id`
   - 运行迁移：
     ```bash
     pnpm wrangler d1 migrations apply misc
     ```

### 开发

启动开发服务器：
```bash
pnpm dev
```

### 构建和部署

1. 构建项目：
   ```bash
   pnpm build
   ```

2. 部署到 Cloudflare Workers：
   ```bash
   pnpm deploy
   ```

## 项目结构

```
├── api/                 # 后端 API (Hono)
│   ├── index.ts        # API 入口点
│   └── migrations/     # 数据库迁移
├── public/             # 静态资源
├── src/                # 前端源代码
│   ├── components/     # Vue 组件
│   ├── views/          # 页面组件
│   ├── stores/         # Pinia 存储
│   └── styles/         # CSS 文件
├── types/              # TypeScript 类型定义
└── uno.config.ts       # UnoCSS 配置
```

## 许可证

MIT
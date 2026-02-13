# UI 设计需求文档
## DrawWat 图片猜谜应用界面设计规范

**版本**: v1.0
**创建日期**: 2025-02-13
**技术栈**: UnoCSS + DaisyUI

---

## 1. 设计系统概述

### 1.1 设计原则
- **简洁优先**: 界面元素少而精，突出核心内容
- **移动优先**: 响应式设计，确保移动端体验流畅
- **趣味互动**: 通过动画和反馈增加使用乐趣
- **易用性**: 遵循 Material Design 和 Web Content Accessibility Guidelines (WCAG)

### 1.2 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **UnoCSS** | latest | 原子化 CSS 引擎 |
| **DaisyUI** | catalog:frontend | 组件库和主题系统 |
| **@ameinhardt/unocss-preset-daisy** | ^1.1.8 | UnoCSS + DaisyUI 集成预设 |
| **unplugin-icons** | catalog:build | 图标系统（Iconify） |

### 1.3 当前配置

**文件**: `unocss.config.ts`

```typescript
import { presetAttributify, presetIcons, presetWind4 } from "unocss"
import { presetDaisy } from "@ameinhardt/unocss-preset-daisy"

export default defineConfig({
  presets: [
    presetWind4(),      // Tailwind CSS 兼容层
    presetAttributify(), // 属性模式支持
    presetDaisy(),       // DaisyUI 组件预设
    presetIcons({        // 图标预设
      scale: 1.5,        // 图标缩放比例
    }),
  ],
  transformers: [
    transformerDirectives(),          // CSS @apply 指令
    transformerVariantGroup(),       // 分组变体
  ],
})
```

---

## 2. 主题与配色方案

### 2.1 主题选择

DaisyUI 提供多种内置主题，根据应用特性选择：

| 主题名 | 适用场景 | 特点 |
|--------|----------|------|
| **light** (默认) | 日常使用 | 干净明亮的界面 |
| **dark** | 夜间模式 | 深色背景，护眼 |
| **cupcake** | 轻松趣味 | 柔和的粉色调 |
| **bumblebee** | 活力游戏 | 黄色主题，充满活力 |
| **corporate** | 专业场景 | 商务蓝色调 |

### 2.2 主题切换机制

实现亮色/暗色主题切换：

```vue
<template>
  <div :data-theme="theme">
    <!-- 主题切换按钮 -->
    <label class="swap swap-rotate">
      <input type="checkbox" @change="toggleTheme" />
      <i class="i-mdi-white-balance-sunny swap-on fill-current w-8 h-8" />
      <i class="i-mdi-weather-night swap-off fill-current w-8 h-8" />
    </label>
  </div>
</template>

<script setup lang="ts">
const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) theme.value = saved
})
</script>
```

### 2.3 颜色使用规范

#### 语义化颜色

使用 DaisyUI 的 CSS 变量系统，确保主题切换时自动适配：

```css
/* 主要操作 - 按钮、链接 */
color-primary        /* 主色 */
color-primary-focus  /* 主色聚焦 */
color-primary-content  /* 主色上的文字 */

/* 次要操作 */
color-secondary
color-secondary-focus
color-secondary-content

/* 强调色 - 成功、警告、错误 */
color-accent
color-success  /* 成功提示 */
color-warning  /* 警告提示 */
color-error    /* 错误提示 */
color-info     /* 信息提示 */

/* 中性色 */
color-base-100   /* 背景色 */
color-base-200   /* 卡片背景 */
color-base-300   /* 边框 */
color-base-content  /* 主要文字 */
```

#### 实际应用示例

```html
<!-- 主要按钮 -->
<button class="btn btn-primary">创建谜题</button>

<!-- 成功提示 -->
<div class="alert alert-success">
  <i class="i-mdi-check-circle" />
  <span>恭喜你答对了！</span>
</div>

<!-- 错误提示 -->
<div class="alert alert-error">
  <i class="i-mdi-alert-circle" />
  <span>答案不对，再试试！</span>
</div>

<!-- 字符提示反馈 -->
<div class="badge badge-info">2 个字符正确</div>
<div class="badge badge-success">1 个位置正确</div>
```

---

## 3. 字体排版

### 3.1 字体家族

```css
/* 中文优先 */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
             "Noto Sans SC", "Microsoft YaHei", sans-serif;

/* 等宽字体（用于代码或答案显示） */
font-family: "Fira Code", "SF Mono", "Monaco", monospace;
```

### 3.2 字体大小层级

使用 UnoCSS 的 `text-` 工具类：

| 工具类 | 大小 | 用途 |
|--------|------|------|
| `text-xs` | 0.75rem | 辅助信息、时间戳 |
| `text-sm` | 0.875rem | 次要文字、标签 |
| `text-base` | 1rem | 正文内容 |
| `text-lg` | 1.125rem | 小标题 |
| `text-xl` | 1.25rem | 页面标题 |
| `text-2xl` | 1.5rem | 大标题 |
| `text-4xl` | 2.25rem | 英雄区标题 |

### 3.3 字重

```html
<!-- 常用字重 -->
<p class="font-light">细体 - 说明文字</p>
<p class="font-normal">常规 - 正文</p>
<p class="font-medium">中等 - 强调</p>
<p class="font-semibold">半粗 - 小标题</p>
<p class="font-bold">粗体 - 页面标题</p>
```

---

## 4. 组件使用规范

### 4.1 按钮组件 (Buttons)

#### 主要操作按钮

```html
<!-- 主要按钮 -->
<button class="btn btn-primary">创建谜题</button>
<button class="btn btn-primary btn-lg">大号按钮</button>

<!-- 次要按钮 -->
<button class="btn btn-secondary">取消</button>

<!-- 轮廓按钮 -->
<button class="btn btn-outline btn-primary">猜一猜</button>

<!-- 禁用状态 -->
<button class="btn btn-disabled">不可用</button>

<!-- 带图标 -->
<button class="btn btn-primary gap-2">
  <i class="i-mdi-plus" />
  创建谜题
</button>
```

#### 图标按钮

```html
<!-- 纯图标按钮 -->
<button class="btn btn-square btn-ghost">
  <i class="i-mdi-menu text-xl" />
</button>

<!-- 圆形图标按钮 -->
<button class="btn btn-circle btn-ghost">
  <i class="i-mdi-close text-xl" />
</button>
```

### 4.2 表单组件 (Forms)

#### 输入框

```html
<!-- 标准输入框 -->
<div class="form-control">
  <label class="label">
    <span class="label-text">谜底答案</span>
  </label>
  <input type="text" placeholder="输入答案" class="input input-bordered w-full" />
</div>

<!-- 带验证的输入框 -->
<div class="form-control">
  <label class="label">
    <span class="label-text">答案</span>
    <span class="label-text-alt text-error">至少 2 个字符</span>
  </label>
  <input type="text" class="input input-bordered input-error" />
  <label class="label">
    <span class="label-text-alt">提示：答案长度会显示给猜谜者</span>
  </label>
</div>

<!-- 大号输入框（用于猜谜） -->
<input
  type="text"
  placeholder="输入你的猜测..."
  class="input input-bordered input-lg w-full text-center text-2xl tracking-widest"
/>
```

#### 文本域

```html
<div class="form-control">
  <label class="label">
    <span class="label-text">提示语（可选）</span>
  </label>
  <textarea
    class="textarea textarea-bordered h-24"
    placeholder="给猜谜者一些提示..."
  ></textarea>
</div>
```

#### 文件上传

```html
<!-- 拖拽上传区域 -->
<div class="form-control">
  <label class="label">
    <span class="label-text">上传图片</span>
  </label>
  <input type="file" class="file-input file-input-bordered w-full" />
</div>

<!-- 自定义拖拽区域 -->
<div
  class="border-2 border-dashed border-base-300 rounded-box p-8 text-center hover:border-primary cursor-pointer transition-colors"
  @dragover.prevent
  @drop.prevent="handleDrop"
>
  <i class="i-mdi-cloud-upload text-4xl text-base-content/50" />
  <p class="mt-4 text-base-content/70">拖拽图片到这里，或点击上传</p>
  <p class="text-xs text-base-content/50 mt-2">支持 JPG、PNG、WEBP（最大 5MB）</p>
</div>
```

### 4.3 卡片组件 (Cards)

```html
<!-- 谜题卡片 -->
<div class="card bg-base-200 shadow-xl">
  <figure class="px-4 pt-4">
    <img :src="puzzle.image_url" class="rounded-xl" />
  </figure>
  <div class="card-body">
    <h2 class="card-title">谜题标题</h2>
    <p class="text-base-content/70">提示语内容...</p>
    <div class="card-actions justify-end mt-4">
      <button class="btn btn-primary">开始猜谜</button>
    </div>
  </div>
</div>

<!-- 紧凑卡片（谜题列表） -->
<div class="card card-side bg-base-200 shadow-sm">
  <figure class="w-32">
    <img :src="puzzle.image_url" />
  </figure>
  <div class="card-body">
    <h3 class="card-title text-lg">{{ puzzle.title }}</h3>
    <div class="flex gap-2 text-sm">
      <span class="badge badge-ghost">{{ puzzle.guess_count }} 次猜测</span>
      <span class="badge badge-success">{{ puzzle.correct_count }} 正确</span>
    </div>
  </div>
</div>
```

### 4.4 提示与反馈 (Alerts & Badges)

```html
<!-- 成功提示 -->
<div class="alert alert-success">
  <i class="i-mdi-check-circle text-xl" />
  <div>
    <h3 class="font-bold">恭喜答对！</h3>
    <div class="text-xs">答案是：{{ puzzle.answer }}</div>
  </div>
</div>

<!-- 错误提示 -->
<div class="alert alert-error">
  <i class="i-mdi-alert-circle text-xl" />
  <span>答案不对，再想想...</span>
</div>

<!-- 信息提示 -->
<div class="alert alert-info">
  <i class="i-mdi-information text-xl" />
  <div>
    <h3 class="font-bold">提示</h3>
    <div class="text-xs">{{ puzzle.hint }}</div>
  </div>
</div>

<!-- 字符提示徽章（Wordle 风格） -->
<div class="flex gap-2 justify-center my-4">
  <div class="badge badge-lg badge-success">2 个字符正确</div>
  <div class="badge badge-lg badge-info">1 个位置正确</div>
</div>
```

### 4.5 加载状态

```html
<!-- 页面级加载 -->
<div class="flex items-center justify-center min-h-screen">
  <span class="loading loading-spinner loading-lg"></span>
</div>

<!-- 按钮加载 -->
<button class="btn btn-primary">
  <span class="loading loading-spinner"></span>
  提交中
</button>

<!-- 骨架屏 -->
<div class="space-y-4">
  <div class="skeleton h-48 w-full"></div>
  <div class="skeleton h-4 w-3/4"></div>
  <div class="skeleton h-4 w-1/2"></div>
</div>
```

### 4.6 模态框 (Modal)

```html
<!-- 分享链接模态框 -->
<dialog class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">分享你的谜题</h3>
    <p class="py-4">复制下面的链接分享给朋友：</p>
    <div class="join w-full">
      <input
        :value="shareUrl"
        class="input input-bordered join-item flex-1"
        readonly
      />
      <button class="btn btn-primary join-item" @click="copyLink">
        <i class="i-mdi-content-copy" />
      </button>
    </div>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">关闭</button>
      </form>
    </div>
  </div>
</dialog>
```

### 4.7 下拉菜单

```html
<!-- 用户菜单 -->
<div class="dropdown dropdown-end">
  <label tabindex="0" class="btn btn-ghost gap-2">
    <div class="avatar">
      <div class="w-8 rounded-full">
        <img :src="user.avatar_url" />
      </div>
    </div>
    <span>{{ user.username }}</span>
    <i class="i-mdi-chevron-down text-sm" />
  </label>
  <ul
    tabindex="0"
    class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
  >
    <li><a @click="router.push('/my-puzzles')">我的谜题</a></li>
    <li><a @click="router.push('/settings')">设置</a></li>
    <div class="divider my-0"></div>
    <li><a class="text-error" @click="logout">退出登录</a></li>
  </ul>
</div>
```

---

## 5. 页面布局设计

### 5.1 导航栏 (Navbar)

```html
<div class="navbar bg-base-100 shadow-sm">
  <div class="flex-1">
    <router-link to="/" class="btn btn-ghost text-xl">
      <i class="i-mdi-puzzle mr-2" />
      DrawWat
    </router-link>
  </div>

  <div class="flex-none">
    <!-- 未登录 -->
    <template v-if="!isLoggedIn">
      <router-link to="/login" class="btn btn-ghost">登录</router-link>
      <router-link to="/register" class="btn btn-primary ml-2">注册</router-link>
    </template>

    <!-- 已登录 -->
    <template v-else>
      <router-link to="/create" class="btn btn-primary gap-2">
        <i class="i-mdi-plus" />
        创建谜题
      </router-link>
      <!-- 用户下拉菜单 -->
    </template>
  </div>
</div>
```

### 5.2 首页布局 (Hero Section)

```html
<div class="hero min-h-screen bg-base-200">
  <div class="hero-content text-center">
    <div class="max-w-md">
      <div class="text-6xl font-bold text-primary mb-6">
        🎨 猜谜
      </div>
      <p class="py-6 text-lg">
        上传图片，设置答案，和朋友一起猜谜！
      </p>
      <div class="flex gap-4 justify-center">
        <router-link to="/create" class="btn btn-primary btn-lg">
          <i class="i-mdi-plus" />
          创建谜题
        </router-link>
        <router-link to="/login" class="btn btn-outline btn-lg">
          <i class="i-mdi-login" />
          开始游戏
        </router-link>
      </div>
    </div>
  </div>
</div>
```

### 5.3 猜谜页面布局

```html
<div class="container mx-auto px-4 py-8 max-w-4xl">
  <!-- 谜题图片区 -->
  <div class="card bg-base-200 shadow-xl mb-8">
    <figure class="px-4 pt-4">
      <img
        :src="puzzle.image_url"
        class="rounded-xl w-full"
        alt="谜题图片"
      />
    </figure>
  </div>

  <!-- 提示语区（如有） -->
  <div v-if="puzzle.hint" class="alert alert-info mb-6">
    <i class="i-mdi-lightbulb text-xl" />
    <span>{{ puzzle.hint }}</span>
  </div>

  <!-- 答案输入区 -->
  <div class="card bg-base-100 shadow-lg mb-6">
    <div class="card-body">
      <div class="form-control">
        <label class="label">
          <span class="label-text text-lg">输入你的答案</span>
          <span class="label-text-alt">{{ puzzle.answer_length }} 个字符</span>
        </label>
        <input
          v-model="guess"
          type="text"
          class="input input-bordered input-lg text-center text-2xl tracking-widest"
          placeholder="输入答案..."
          @keyup.enter="submitGuess"
        />
      </div>
      <div class="card-actions justify-end mt-4">
        <button class="btn btn-primary btn-lg w-full" @click="submitGuess">
          <i class="i-mdi-send" />
          提交猜测
        </button>
      </div>
    </div>
  </div>

  <!-- 字符提示反馈 -->
  <div v-if="lastGuess" class="text-center mb-6">
    <div class="flex gap-2 justify-center">
      <div class="badge badge-lg badge-success">
        {{ lastGuess.correct_chars }} 个字符正确
      </div>
      <div class="badge badge-lg badge-info">
        {{ lastGuess.correct_positions }} 个位置正确
      </div>
    </div>
  </div>

  <!-- 猜测历史 -->
  <div class="card bg-base-100 shadow-lg">
    <div class="card-body">
      <h2 class="card-title">
        <i class="i-mdi-history mr-2" />
        猜测历史
      </h2>
      <div class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>猜测</th>
              <th>时间</th>
              <th>字符/位置</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guess in guesses" :key="guess.id">
              <td class="font-mono">{{ guess.guess_answer }}</td>
              <td class="text-sm opacity-70">{{ formatDate(guess.guessed_at) }}</td>
              <td>
                <span class="badge badge-success">{{ guess.correct_chars }}</span>
                <span class="badge badge-info">{{ guess.correct_positions }}</span>
              </td>
              <td>
                <i
                  v-if="guess.is_correct"
                  class="i-mdi-check-circle text-success text-xl"
                />
                <i v-else class="i-mdi-close-circle text-error text-xl" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
```

### 5.4 创建谜题页面

```html
<div class="container mx-auto px-4 py-8 max-w-3xl">
  <h1 class="text-3xl font-bold mb-8">
    <i class="i-mdi-plus-circle mr-2" />
    创建新谜题
  </h1>

  <!-- 图片上传区 -->
  <div class="card bg-base-100 shadow-lg mb-6">
    <div class="card-body">
      <h2 class="card-title mb-4">1. 上传谜题图片</h2>

      <div class="form-control">
        <input
          type="file"
          accept="image/*"
          class="file-input file-input-bordered w-full mb-4"
          @change="handleImageUpload"
        />

        <!-- 图片预览 -->
        <div v-if="previewImage" class="relative">
          <img :src="previewImage" class="rounded-xl max-h-96 w-full object-cover" />
          <button
            class="btn btn-circle btn-ghost absolute top-2 right-2"
            @click="clearImage"
          >
            <i class="i-mdi-close" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 答案设置区 -->
  <div class="card bg-base-100 shadow-lg mb-6">
    <div class="card-body">
      <h2 class="card-title mb-4">2. 设置答案</h2>

      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text text-lg">谜底答案</span>
          <span class="label-text-alt">必填</span>
        </label>
        <input
          v-model="answer"
          type="text"
          class="input input-bordered input-lg"
          placeholder="输入正确答案..."
        />
        <label class="label">
          <span class="label-text-alt">答案长度：{{ answer.length }} 个字符</span>
        </label>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">提示语（可选）</span>
          <span class="label-text-alt">帮助猜谜者</span>
        </label>
        <textarea
          v-model="hint"
          class="textarea textarea-bordered h-20"
          placeholder="给猜谜者一些提示..."
        ></textarea>
      </div>
    </div>
  </div>

  <!-- 提交按钮 -->
  <div class="flex gap-4">
    <button
      class="btn btn-primary btn-lg flex-1"
      :disabled="!canSubmit"
      @click="createPuzzle"
    >
      <i class="i-mdi-check mr-2" />
      生成谜题
    </button>
    <button class="btn btn-ghost btn-lg" @click="reset">
      <i class="i-mdi-refresh" />
      重置
    </button>
  </div>
</div>
```

---

## 6. 响应式设计

### 6.1 断点系统

DaisyUI/UnoCSS 使用以下断点：

| 断点 | 宽度 | 设备 |
|------|------|------|
| `sm:` | 640px | 大屏手机 |
| `md:` | 768px | 平板 |
| `lg:` | 1024px | 小笔记本 |
| `xl:` | 1280px | 桌面 |
| `2xl:` | 1536px | 大屏幕 |

### 6.2 响应式示例

```html
<!-- 导航栏响应式 -->
<div class="navbar">
  <div class="navbar-start">
    <!-- 移动端菜单按钮 -->
    <div class="dropdown lg:hidden">
      <label class="btn btn-ghost">
        <i class="i-mdi-menu" />
      </label>
    </div>
    <!-- 桌面端菜单 -->
    <ul class="menu menu-horizontal px-1 hidden lg:flex">
      <li><a>首页</a></li>
      <li><a>我的谜题</a></li>
    </ul>
  </div>
</div>

<!-- 网格响应式 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div v-for="puzzle in puzzles" :key="puzzle.id">
    <!-- 谜题卡片 -->
  </div>
</div>

<!-- 文字大小响应式 -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl">
  标题大小随屏幕变化
</h1>

<!-- 间距响应式 -->
<div class="container mx-auto px-4 py-8 lg:px-8 lg:py-16">
  <!-- 内容区 -->
</div>
```

---

## 7. 图标系统

### 7.1 使用 Iconify

通过 `unplugin-icons` 自动导入图标：

```html
<!-- 使用 i- 前缀 + 图标集名 + 图标名 -->
<i class="i-mdi-home" />          <!-- Material Design Icons -->
<i class="i-mdi-puzzle" />        <!-- 谜题图标 -->
<i class="i-mdi-plus" />          <!-- 加号 -->
<i class="i-mdi-send" />          <!-- 发送 -->
<i class="i-mdi-check-circle" />  <!-- 成功 -->
<i class="i-mdi-alert-circle" />  <!-- 警告 -->
<i class="i-mdi-content-copy" />  <!-- 复制 -->
<i class="i-mdi-github" />        <!-- GitHub -->
```

### 7.2 图标尺寸

```html
<i class="i-mdi-home text-xs" />  <!-- 小图标 -->
<i class="i-mdi-home text-sm" />  <!-- 默认 -->
<i class="i-mdi-home text-lg" />  <!-- 大图标 -->
<i class="i-mdi-home text-xl" />  <!-- 超大 -->
<i class="i-mdi-home text-4xl" /> <!-- 巨大 -->
```

### 7.3 常用图标清单

| 功能 | 图标类名 | 说明 |
|------|----------|------|
| 谜题 | `i-mdi-puzzle` | 谜题相关 |
| 创建 | `i-mdi-plus-circle` | 创建按钮 |
| 编辑 | `i-mdi-pencil` | 编辑操作 |
| 删除 | `i-mdi-delete` | 删除操作 |
| 发送 | `i-mdi-send` | 提交猜测 |
| 复制 | `i-mdi-content-copy` | 复制链接 |
| 分享 | `i-mdi-share-variant` | 分享功能 |
| 成功 | `i-mdi-check-circle` | 成功提示 |
| 错误 | `i-mdi-close-circle` | 错误提示 |
| 信息 | `i-mdi-information` | 信息提示 |
| 加载 | `i-mdi-loading` | 加载动画 |
| 用户 | `i-mdi-account` | 用户相关 |
| 设置 | `i-mdi-cog` | 设置页面 |
| 首页 | `i-mdi-home` | 返回首页 |
| 历史 | `i-mdi-history` | 猜测历史 |
| 统计 | `i-mdi-chart-bar` | 统计数据 |

---

## 8. 动画与交互

### 8.1 过渡效果

```html
<!-- Vue Transition + DaisyUI 动画 -->
<Transition name="fade">
  <div v-if="showContent">内容</div>
</Transition>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 8.2 悬停效果

```html
<!-- 卡片悬停 -->
<div class="card bg-base-200 hover:shadow-xl transition-shadow">
  <!-- 内容 -->
</div>

<!-- 按钮悬停 -->
<button class="btn btn-primary hover:btn-primary hover:scale-105 transition-transform">
  按钮
</button>

<!-- 图标旋转动画 -->
<button class="btn btn-ghost btn-circle">
  <i class="i-mdi-refresh animate-spin-slow" />
</button>
```

### 8.3 加载动画

```html
<!-- Spinner -->
<span class="loading loading-spinner"></span>

<!-- Dots -->
<span class="loading loading-dots"></span>

<!-- Ring -->
<span class="loading loading-ring"></span>

<!-- 不同尺寸 -->
<span class="loading loading-spinner loading-sm"></span>
<span class="loading loading-spinner loading-lg"></span>
```

---

## 9. 可访问性 (Accessibility)

### 9.1 键盘导航

确保所有交互元素可通过键盘访问：

```html
<!-- 按钮自动支持 -->
<button @click="action">按钮</button>

<!-- 链接自动支持 -->
<a href="/path">链接</a>

<!-- 自定义交互添加键盘支持 -->
<div
  role="button"
  tabindex="0"
  @click="action"
  @keyup.enter="action"
>
  可键盘操作的 div
</div>
```

### 9.2 ARIA 标签

```html
<!-- 为图标按钮添加说明 -->
<button aria-label="创建新谜题">
  <i class="i-mdi-plus" />
</button>

<!-- 表单标签关联 -->
<label for="answer-input">答案</label>
<input id="answer-input" type="text" />

<!-- 动态内容更新 -->
<div role="status" aria-live="polite">
  {{ message }}
</div>

<!-- 错误提示 -->
<div role="alert" class="alert alert-error">
  {{ errorMessage }}
</div>
```

### 9.3 颜色对比度

确保文字和背景对比度符合 WCAG AA 标准：

- 正常文字：至少 4.5:1
- 大号文字（18px+）：至少 3:1
- 交互元素：至少 3:1

### 9.4 焦点状态

```css
/* 自定义焦点样式 */
*:focus-visible {
  outline: 2px solid var(--fallback-pc, oklch(var(--p)));
  outline-offset: 2px;
}
```

---

## 10. 开发工作流

### 10.1 组件开发规范

1. **使用 DaisyUI 组件优先**
   - 优先使用 DaisyUI 提供的组件类
   - 通过 UnoCSS 工具类自定义样式

2. **组合而非覆盖**
   ```html
   <!-- 推荐：组合现有类 -->
   <button class="btn btn-primary gap-2">
     <i class="i-mdi-plus" />
     创建
   </button>

   <!-- 避免：过多自定义样式 -->
   <button style="...">...</button>
   ```

3. **响应式默认**
   - 所有页面必须考虑移动端
   - 使用移动优先策略

4. **可访问性检查**
   - 确保键盘可操作
   - 添加适当的 ARIA 标签

### 10.2 样式调试

```html
<!-- 开发时使用临时边框查看布局 -->
<div class="border border-red-500">
  <!-- 内容 -->
</div>

<!-- 使用 UnoCSS 的调试模式 -->
<div class="debug-block">
  <!-- 显示所有应用的类 -->
</div>
```

---

## 11. 设计资源

### 11.1 官方文档
- [UnoCSS 文档](https://unocss.dev/)
- [DaisyUI 文档](https://daisyui.com/)
- [Iconify 图标库](https://icones.js.org/)

### 11.2 设计参考
- [Material Design 3](https://m3.material.io/)
- [Tailwind UI Components](https://tailwindui.com/)（付费）
- [Headless UI](https://headlessui.com/)（无样式组件参考）

---

## 12. 实施检查清单

### 主题系统
- [ ] 配置亮色/暗色主题切换
- [ ] 设置默认主题
- [ ] 主题持久化到 localStorage

### 组件库
- [ ] 创建通用按钮组件
- [ ] 创建输入框组件
- [ ] 创建卡片组件
- [ ] 创建模态框组件
- [ ] 创建提示组件

### 页面布局
- [ ] 实现导航栏
- [ ] 实现首页 Hero 区
- [ ] 实现猜谜页面布局
- [ ] 实现创建谜题页面

### 响应式
- [ ] 所有页面移动端适配
- [ ] 平板横屏测试
- [ ] 桌面端测试

### 可访问性
- [ ] 键盘导航测试
- [ ] 屏幕阅读器测试
- [ ] 颜色对比度检查

---

**文档变更历史**

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2025-02-13 | Claude | 初稿创建，基于 UnoCSS + DaisyUI 设计系统 |

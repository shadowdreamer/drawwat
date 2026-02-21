# DrawWat

一个有趣的猜谜游戏平台 - 在线作画，设置答案，和朋友一起猜谜。

![DrawWat](https://img.shields.io/badge/DrawWat-猜谜游戏-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 网站地址

https://draw.dovahkiin.top/

## 功能特点

- **在线作画** - 内置简单易用的画板工具，无需上传图片
- **设置答案** - 为你的画作设置答案，可选添加提示语
- **智能提示** - 类似 Wordle 的提示系统，显示正确字符数和位置数
- **排行榜** - 记录最先答对的玩家
- **分享链接** - 一键分享给朋友

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Hono (Cloudflare Workers)
- **样式**: UnoCSS + DaisyUI
- **状态管理**: Pinia
- **数据库**: Cloudflare D1
- **画板**: tldraw

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 部署
pnpm deploy
```

## License

MIT

---

GitHub: https://github.com/shadowdreamer/drawwat

# 绘画板

创建谜题页左上角的「自由绘制」菜单支持 Klecks（Kleki 的官方开源版本）和 Excalidraw，并附有简要特性。首次使用默认打开 Klecks，已有选择保存在 `localStorage` 的 `drawwat-board-preference-v1` 中并优先恢复。两个画板首次选中时才加载，切换后保留当前页面里的内容。

- Excalidraw 草稿沿用 `drawwat-excalidraw-draft-v1`。
- Klecks 草稿以 PSD 保存到 IndexedDB `drawwat-klecks-v1`，保留图层；生成谜题时合成白底 WebP，最长边不超过 1280 像素。
- 重置只清空当前画板，另一个画板的草稿不受影响。

## 本地构建

`pnpm dev` 和 `pnpm build` 会先运行 `scripts/build-klecks.mjs`，也可以单独运行 `pnpm build:klecks`。首次运行需要 Git、npm 和网络，用于下载固定提交的官方源码并安装其锁定依赖。后续运行复用生成结果。

源码缓存在 `node_modules/.cache/klecks-source`，生成文件位于 `public/klecks`，均不提交到仓库。CI 首次构建也需要网络，可以缓存这两个目录。更新上游版本时修改构建脚本中的 `revision`。

Klecks 使用同源 iframe，以隔离全局事件和样式；页面没有选中它时不会请求 iframe 或其脚本。Excalidraw 的 JS、React 依赖及 CSS 通过 Vue 异步组件单独加载。

## 许可

上游项目：https://github.com/bitbof/klecks

Klecks 使用 MIT 许可，构建时将原始许可证复制到 `/klecks/LICENSE.txt`。Kleki 品牌名称不在该授权范围内，因此界面使用 Klecks 名称。

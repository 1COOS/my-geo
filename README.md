# My Geo

My Geo 是面向青少年的互动式 3D 世界探索应用。首个基线提供可旋转、缩放的 3D 地球、离线 PWA 能力、减少动态效果支持和 WebGL 降级界面，为后续国家、首都、国旗、知识卡与游戏任务打基础。

## 技术栈

- Bun 1.3.13、React 19、TypeScript、Vite
- Three.js、React Three Fiber、Drei、`r3f-globe`
- Tailwind CSS、Radix UI、Motion
- React Router、Zustand、Zod、Dexie、i18next
- Vite PWA / Workbox
- Vitest、Testing Library、Playwright、ESLint、Prettier

## 开发

需要 Bun 1.3.13：

```bash
bun install --registry https://registry.npmjs.org
bun run dev
```

项目只使用 Bun，唯一锁文件为 `bun.lock`。上面的显式 registry 参数用于规避部分本地 npm 镜像缓存的 tarball 完整性异常；如果你的 Bun 已配置官方 registry，可以直接运行 `bun install`。

常用命令：

```bash
bun run dev          # 启动开发服务器
bun run build        # TypeScript + 生产构建
bun run preview      # 预览生产构建
bun run lint         # ESLint
bun run typecheck    # TypeScript
bun run format       # 写入格式化
bun run format:check # 检查格式
bun run test         # Vitest
bun run test:e2e     # 生产构建 + Playwright
bun run check        # 完整交付检查
```

首次运行端到端测试前，如果本机没有 Chromium：

```bash
bunx playwright install chromium
```

## 目录

```text
src/
├── app/       应用入口、路由、国际化和 PWA 注册
├── data/      经审核并由 Zod 校验的教育内容
├── features/  探索、任务和游戏逻辑
├── scene/     R3F / Three.js 3D 场景
├── shared/    公共组件与浏览器能力工具
├── storage/   Dexie / IndexedDB 本地持久化
└── test/      单元测试环境
tests/e2e/     Playwright 生产预览测试
```

## 3D 与可访问性基线

- `r3f-globe` 的视角在相机初始化、OrbitControls 变化和重置时同步。
- 平衡画质启用更高 DPR、更多星星和 Bloom；节能画质降低 GPU 开销。
- 系统启用“减少动态效果”时自动关闭自主旋转。
- Canvas 支持鼠标、触控、滚轮和方向键操作，并提供明确的无障碍名称。
- WebGL 不可用时显示文字降级界面，不让页面空白或崩溃。

## 数据与离线策略

核心内容和图像资源必须随应用发布，不在运行时依赖第三方国家资料、国旗或纹理服务。国家资料通过 `src/data/countrySchema.ts` 校验。用户显示偏好保存在 IndexedDB；PWA 会缓存生产资源，使安装后的核心基线可以离线启动。

当前还未加入国家边界、国家知识卡和题库，它们属于下一功能切片。

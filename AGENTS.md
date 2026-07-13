# AGENTS.md — 本地方案 (Bilibili Favorites Player)

Electron + React + TypeScript 桌面应用。将B站收藏夹播放器独立为一个持久悬浮窗。

## 常用命令

```bash
npm install          # 首次安装
npm run dev          # gen:preload + vite-plugin-electron（热重载主进程 + 渲染进程）
npm run build        # tsc && vite build && gen:preload + 复制 preload → dist-electron/
npx tsc --noEmit     # 仅类型检查（不构建）— 提交前钩子也跑这个
npm run test         # vitest run（单元 + 特性测试）
npm run test:watch   # vitest 监听模式
node dev.mjs         # 手动启动开发（vite-plugin-electron 异常时备用；注意它硬编码 5173，而 vite.config.ts 用 3000）
npm run pack         # build + electron-builder --dir（未打包输出）
npm run dist         # build + electron-builder（安装包）
```

跑单个测试文件：`npx vitest run src/utils/__tests__/format.test.ts`

`gen:preload` 通过 esbuild 编译 `electron/preload.ts` → `electron/preload.cjs`。`dev` 和 `build` 自动执行；`vite.config.ts` 的 `onstart` 钩子也会重新构建并复制到 `dist-electron/preload.js`。

Pre-commit 钩子（husky + lint-staged）对暂存的 `*.{ts,tsx}` 运行 `tsc --noEmit --pretty`（见 `lint-staged.config.js`）。

## 架构

双进程 Electron 应用，严格 context isolation：

- **主进程** (`electron/`)：已拆分为四个模块
  - `main.ts` — 仅19行引导：禁用硬件加速、`whenReady` → `createWindow()` + `registerIpcHandlers()`
  - `windowManager.ts` — 窗口创建（无边框/透明/始终置顶）、CDN Referer 注入、F12 DevTools、关闭时持久化位置
  - `ipcHandlers.ts` — `api`/`store`/`window` 通道处理
  - `bilibiliApi.ts` — B站 API fetch + 收藏夹 URL 解析（纯函数，无 Electron 依赖）
  - `appCore.ts` — 共享单例：`mainWindow` 引用 + `electron-store` 实例（带 schema 泛型）
- **预加载** (`electron/preload.ts` / `preload.cjs`)：通过 `contextBridge` 暴露 `window.electronAPI`。**两个文件必须同步编辑** — `.ts` 是类型检查源码，`.cjs` 是运行时 CJS 变体（构建时复制到 `dist-electron/preload.js`）
- **渲染进程** (`src/`)：React 应用，所有 API 调用通过 IPC → 主进程

关键：渲染进程永远不直接调用 `fetch`，所有 Bilibili 请求都通过主进程 IPC 代理。`window.electronAPI` 的类型定义在 `src/types/electron.d.ts`。

## IPC 协议

`electron/ipcHandlers.ts:9` 处理 `api` 通道。消息类型（见 `src/types/ipc.ts`）：
- `GET_VIDEO_INFO` → `{ bvid }` → 视频元数据
- `GET_PLAYLIST` → `{ url }` → 解析B站收藏夹 URL，返回曲目列表
- `GET_AUDIO_URL` → `{ bvid, cid }` → 音频流 URL，10分钟过期

Store 通道：`store:get` / `store:set`（对应 `appCore.store`）。

窗口控制通道：`window:move`（send）、`window:resize`（invoke）、`window:getPosition`（invoke）、`window:setMinimumSize`（invoke）。

## 状态管理

`src/stores/` 中四个 zustand store，各自通过 IPC 持久化到 `electron-store`：

| Store | 持久化键 | IPC 写入策略 |
|---|---|---|
| `playlistStore` | `playlist`、`playMode` | 每次操作立即写入 |
| `favoritesStore` | `favorites` | 每次操作立即写入 |
| `recentStore` | `recentTracks` | 每次操作立即写入 |
| `windowStore` | `windowPosition`、`windowSize`、`expandedPanelSize`、`volume` | 防抖批量（100ms） |

`App.tsx` 在挂载时通过 IPC 读取所有持久化状态并注入 stores。`expandedPanelSize` 由渲染进程在收起时保存（主进程 `close` 事件只存 `windowPosition`，见 `windowManager.ts:74-78`）。

`electron-store` schema 定义在 `electron/appCore.ts:7-16` 的泛型参数中，schema 类型从未与渲染进程共享，类型不匹配会导致静默运行时错误。

## 渲染进程结构

`App.tsx` 串联四个 stores + 三个 hooks（`useAudioPlayer`/`usePlayerController`/`useFavoriteActions`）→ 包裹在 `PlayerContext.Provider` 中 → 渲染 `FloatingPlayer`。子组件通过 `usePlayerContext()`（`src/contexts/PlayerContext.tsx`）获取回调，而非 prop 逐层传递。

- `services/api.ts` — IPC 封装 + **模块级单例**（`audioEl`、`currentUrl`/`currentExpiresAt`/`currentBvid`/`currentCid`）持有隐式状态，修改播放逻辑时需注意
- `hooks/useAudioPlayer.ts` — HTMLAudioElement 生命周期；播放时每60秒刷新 URL
- `hooks/usePlayerController.ts` — 播放列表 CRUD + 导航
- `hooks/useFavoriteActions.ts` — 收藏夹 CRUD
- `hooks/useDragReorder.ts` / `useDrag.ts` / `useResize.ts` / `useLerpAnimation.ts` — 共享 UI 交互逻辑
- `components/floating-player/` — `FloatingPlayer`（折叠缩略图+拖拽+缩放手柄）、`ExpandedPanel`、`Playlist`、`FavoritesTab`、`RecentTab`、`ModeIcon`、`Icons`，配套 `.css`
- `types/index.ts`（领域模型）、`types/api.ts`（API 接口）、`types/ipc.ts`（IPC 契约）、`types/electron.d.ts`（window.electronAPI）— 从定义该类型的文件导入
- `styles/tokens.css` — 设计令牌（`--bg`、`--surface`、`--fg`、`--accent`、`--border`、`--radius`、`--shadow`）；始终用令牌，不硬编码。组件样式放配套 `.css`，不用 CSS-in-JS / modules

## 约定

- **路径别名**：`@/*` → `./src/*`（tsconfig + vite + vitest 均已配置）
- **noUncheckedIndexedAccess** 已启用 — 数组/对象索引返回 `T | undefined`；确信值存在时用 `!` 断言（如正则捕获、已知长度数组）
- **语言**：UI 文字和注释均为中文（zh-CN）
- **常量**：魔术数字提取为模块顶部的命名常量（如 `THUMB_WIDTH`、`DEFAULT_VOLUME`、`BATCH_FLUSH_DELAY_MS`、`URL_REFRESH_INTERVAL_MS`）
- **窗口**：无边框、透明、始终置顶。`FloatingPlayer.tsx` 中通过自定义鼠标事件实现拖拽（调用 `window.electronAPI.windowMove()`）。展开面板有东/南/东南三个缩放手柄 — 拖拽同时更新窗口大小和持久化的 `windowSize`
- **`Track.duration` 可选**（`duration?: number`）— 始终处理 undefined

## CI

GitHub Actions（`.github/workflows/ci.yml`）在 push/PR 到 `main` 时运行：`npm ci` → `npx tsc --noEmit` → `npm run build`。注意：CI **不运行** `npm run test`，本地提交前应自行跑 `npm run test`。

## 测试

四个测试文件，使用 vitest（配置在 `vitest.config.ts`，include `src/**/*.test.{ts,tsx}` 和 `electron/**/*.test.{ts,tsx}`）：
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `electron/__tests__/features.test.ts` — 集成测试（URL 解析、BV 号提取、播放模式循环、收藏夹匹配）

## 注意事项

- Bilibili 音频 URL 约10分钟过期（`AUDIO_URL_EXPIRY_MS`，`bilibiliApi.ts:3`）。`useAudioPlayer.ts` 播放时每60秒刷新；`api.ts` 的 `loadAudioTrack` 在当前 URL 距过期不足60秒时跳过重新获取
- Bilibili CDN 请求通过 `windowManager.ts:48-55` 的 `webRequest.onBeforeSendHeaders` 注入 `Referer: https://www.bilibili.com/` + `User-Agent`
- Bilibili API 收藏夹端点使用 `media_id`（不是 `fid`）。`bilibiliApi.ts:14-20` 的 `parsePlaylistUrl` 同时处理 `medialist/play/dlista/{seasonId}/{mid}` 和 `space.bilibili.com/{mid}/favlist?fid={seasonId}` 两种格式
- 硬件加速已禁用（`main.ts:5-6`）+ GPU 缓存已禁用 — 为始终置顶覆盖窗口有意设计
- F12 在开发模式下打开 DevTools（`windowManager.ts:67`，通过 `globalShortcut` 注册）
- `utils/format.ts`：`formatDuration(0)` 返回 `'0:00'`，负值/非有限值返回 `'--:--'`
- ExpandedPanel 的 `currentAudio` prop 使用 `CurrentAudio`（`Pick<Track, 'bvid'|'cid'|'title'|'author'|'cover'>`，`types/index.ts:46`），缺少 `duration`
- **README.md 已过时** — 引用了不存在的文件和过时的文件名。以上述结构为准

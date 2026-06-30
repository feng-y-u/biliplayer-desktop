# AGENTS.md — 本地方案 (Bilibili Favorites Player)

Electron + React + TypeScript 桌面应用。将B站收藏夹播放器独立为一个持久悬浮窗。

## 常用命令

```bash
npm install          # 首次安装
npm run dev          # gen:preload + vite-plugin-electron（热重载主进程 + 渲染进程）
npm run build        # tsc && vite build && gen:preload + 复制 preload → dist-electron/
npx tsc --noEmit     # 仅类型检查（不构建）
npm run test         # vitest 运行（单元 + 特性测试）
npm run test:watch   # vitest 监听模式
npm run preview      # 本地预览构建产物
node dev.mjs         # 手动启动开发（vite-plugin-electron 异常时备用）
npm run pack         # build + electron-builder --dir（未打包输出）
npm run dist         # build + electron-builder（安装包）
```

`gen:preload` 通过 esbuild 编译 `electron/preload.ts` → `electron/preload.cjs`。`dev` 和 `build` 自动执行。

Pre-commit 钩子运行 `npx lint-staged`，对暂存的 `*.{ts,tsx}` 文件执行类型检查（见 `lint-staged.config.js`）。

## 架构

双进程 Electron 应用，严格 context isolation：

- **主进程** (`electron/main.ts`)：窗口管理、Bilibili API 代理（主进程 `fetch`，无 CORS）、`electron-store` 持久化
- **预加载** (`electron/preload.ts` / `preload.cjs`)：暴露 `window.electronAPI`（API 调用、store、窗口控制）。**两个文件必须同步编辑** — `.ts` 是类型检查源码，`.cjs` 是运行时 CJS 变体（构建/dev 时复制到 `dist-electron/preload.js`）
- **渲染进程** (`src/`)：React 应用，所有 API 调用通过 IPC → 主进程

关键：渲染进程永远不直接调用 `fetch`，所有 Bilibili 请求都通过主进程 IPC 代理。

## IPC 协议

`electron/main.ts:188` 处理 `api` 通道。消息类型：
- `GET_VIDEO_INFO` → `{ bvid }` → 视频元数据
- `GET_PLAYLIST` → `{ url }` → 解析B站收藏夹 URL，返回曲目列表
- `GET_AUDIO_URL` → `{ bvid, cid }` → 音频流 URL，10分钟过期

Store 通道：`store:get` / `store:set`（对应 `electron-store`）。

窗口控制通道：`window:move`（send）、`window:resize`（invoke）、`window:getPosition`（invoke）、`window:setMinimumSize`（invoke）。

## 目录结构

```
electron/
  main.ts         # 窗口管理、Bilibili API 代理、IPC 处理
  preload.ts      # contextBridge（暴露 electronAPI 给渲染进程）
  preload.cjs     # 运行时 CJS 变体（复制到 dist-electron/）
  __tests__/
    features.test.ts  # 集成测试（URL 解析、BV 号提取、播放模式循环、收藏夹匹配）
src/
  App.tsx         # 根组件，串联 stores + hooks → FloatingPlayer（~120行）
  main.tsx        # React 入口
  types/
    index.ts    # Track、PlayMode、PlayerState、FavoriteFolder、CurrentAudio 等
    api.ts      # VideoInfo、AudioUrl 接口
    ipc.ts      # IpcMessage、IpcResponseMap、IpcResponse 类型（严格 IPC 契约）
  services/api.ts # 渲染进程 IPC 封装 + 全局 HTMLAudioElement 单例
  stores/
    playlistStore.ts   # zustand：tracks、currentIndex、playMode、loading + CRUD
    favoritesStore.ts  # zustand：FavoriteFolder[] + CRUD
    recentStore.ts     # zustand：recentTracks（最多50条）
    windowStore.ts     # zustand：windowPosition、windowSize、volume（防抖批量 IPC 写入）
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" 或 "--:--"
    track.ts      # isSameTrack()、isTrackFavorited()
  hooks/
    useAudioPlayer.ts       # HTMLAudioElement 生命周期（事件监听 + URL 刷新）
    usePlayerController.ts  # 播放列表 CRUD + 播放器导航（next/prev/play/delete/reorder/input）
    useFavoriteActions.ts   # 收藏夹 CRUD（create/toggle/add/remove/delete/reorder）
    useDragReorder.ts       # 共享拖拽排序逻辑
  components/floating-player/
    FloatingPlayer.tsx  # 折叠缩略图（64px）+ 鼠标拖拽 + 展开/折叠 + 缩放手柄
    FloatingPlayer.css
    ExpandedPanel.tsx   # 完整播放器 UI（控制、进度、标签页、输入框）
    Playlist.tsx        # 曲目列表，支持排序、删除、当前曲高亮
    Playlist.css
    FavoritesTab.tsx    # 收藏夹网格（文件夹卡片）
    RecentTab.tsx       # 最近播放曲目列表
    ModeIcon.tsx        # 播放模式 SVG 图标
    Icons.tsx           # PlayPauseIcon、NextIcon
    content.css, controls.css, panel.css  # 共享面板样式
  styles/
    tokens.css          # 设计令牌：--bg、--surface、--fg、--accent、--border、--radius、--shadow
    global.css          # 基础重置
lint-staged.config.js  # 对暂存的 *.{ts,tsx} 运行 `tsc --noEmit --pretty`
dev.mjs                # 手动开发启动器（vite-plugin-electron 的替代方案）
```

## 约定

- **路径别名**：`@/*` → `./src/*`（tsconfig + vite 均已配置）
- **TypeScript 严格模式**：`strict`、`noUnusedLocals`、`noUnusedParameters`、`noUncheckedIndexedAccess` 全部启用
- **CSS**：`tokens.css` 使用 CSS 自定义属性（`--bg`、`--surface`、`--fg`、`--accent`、`--border`、`--radius`、`--shadow` 等）；始终使用这些令牌，不要硬编码颜色/间距。组件样式放在配套 `.css` 文件中（如 `FloatingPlayer.css`、`panel.css`）。不用 CSS-in-JS，不用 CSS modules
- **语言**：UI 文字和注释均为中文（zh-CN）
- **类型组织**：类型分散在 `types/index.ts`（领域模型）、`types/api.ts`（API 接口）、`types/ipc.ts`（IPC 契约）中 — 从定义该类型的文件导入
- **noUncheckedIndexedAccess**：数组/对象索引返回 `T | undefined`；确信值存在时使用 `!` 断言（如正则捕获、已知长度数组）
- **窗口**：无边框、透明、始终置顶。`FloatingPlayer.tsx` 中通过自定义鼠标事件实现拖拽（调用 `window.electronAPI.windowMove()`）。展开面板有三个缩放手柄：东（e）、南（s）、东南（se）边缘 — 拖拽事件同时更新窗口大小和持久化的 `windowSize` 状态
- **Git 钩子**：husky + lint-staged 对暂存的 `*.{ts,tsx}` 运行 `tsc --noEmit`
- **常量**：将魔术数字提取为模块顶部的命名常量（如 `THUMB_WIDTH`、`DEFAULT_VOLUME`、`BATCH_FLUSH_DELAY_MS`）
- **共享逻辑**：将可复用的 UI 模式提取到 hooks 中（如 `useDragReorder`）

## 状态管理

`src/stores/` 中四个 zustand store，各自通过 IPC 持久化到 `electron-store`：

| Store | 持久化键 | IPC 写入策略 |
|---|---|---|
| `playlistStore` | `playlist`、`playMode` | 每次操作立即写入 |
| `favoritesStore` | `favorites` | 每次操作立即写入 |
| `recentStore` | `recentTracks` | 每次操作立即写入 |
| `windowStore` | `windowPosition`、`windowSize`、`volume` | 防抖批量（100ms 刷新） |

`App.tsx` 在挂载时通过 IPC 读取所有持久化状态并注入 stores。

## CI

GitHub Actions 在 push/PR 到 `main` 时运行：`npm ci` → `tsc --noEmit` → `npm run build`。注意：CI **不运行** `npm run test`。

## 测试

四个测试文件：
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `electron/__tests__/features.test.ts`

使用 vitest。配置在 `vitest.config.ts`。运行命令：`npm run test` 或 `npm run test:watch`。

## 注意事项

- Bilibili 音频 URL 约10分钟过期。`useAudioPlayer.ts` 在播放时每60秒刷新；`api.ts` 在当前 URL 距过期不足60秒时主动跳过重新获取
- `electron-store` schema 定义在 `electron/main.ts:21-29` 的泛型参数中，schema 类型从未与渲染进程共享，类型不匹配会导致静默运行时错误
- ExpandedPanel 的 `currentAudio` prop 使用 `CurrentAudio`（`Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>`），缺少 `duration`。定义在 `types/index.ts:46`
- Bilibili CDN 请求通过主进程 `webRequest.onBeforeSendHeaders` 注入 `Referer: https://www.bilibili.com/`
- Bilibili API 收藏夹端点使用 `media_id`（不是 `fid`）。`main.ts:124-130` 的播放列表 URL 解析器同时处理 `medialist/play/dlista/{seasonId}/{mid}` 和 `space.bilibili.com/{mid}/favlist?fid={seasonId}` 两种格式
- `api.ts` 中的模块级单例（`audioEl`、URL 缓存）持有隐式状态 — 修改播放逻辑时需注意
- `utils/format.ts`：`formatDuration(0)` 返回 `'0:00'`，负值返回 `'--:--'`
- **README.md 已过时** — 引用了不存在的文件（`useStorage.ts`、`usePlaylist.ts`）和过时的文件名（`design-tokens.css`，实际为 `tokens.css`）。忽略其目录结构，以上述结构为准
- 硬件加速已禁用（`app.disableHardwareAcceleration()`）+ GPU 缓存已禁用 — 这是为始终置顶的覆盖窗口有意设计的
- F12 在开发模式下打开 DevTools（通过 `globalShortcut` 注册）
- 窗口位置在关闭时持久化到 `electron-store`；大小在缩放时立即持久化
- `Track.duration` 是可选的（`duration?: number`）— 始终处理 undefined 的情况

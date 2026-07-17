# AGENTS.md — 本地方案 (Bilibili Favorites Player)

Electron + React + TypeScript 桌面应用。将B站收藏夹播放器独立为一个持久悬浮窗。

## 常用命令

```bash
npm install              # 首次安装；electron 镜像在 .npmrc 中配置为 npmmirror.com
npm run gen:preload      # esbuild 编译 preload.ts → preload.cjs
npm run dev              # gen:preload → vite（vite-plugin-electron 热重载主+渲染进程）
npm run build            # tsc && vite build && gen:preload + copy preload.cjs → dist-electron/preload.js
npx tsc --noEmit         # 仅类型检查
npm run test             # vitest run
npm run test:watch       # vitest 监听
npx vitest run <路径>    # 单个测试文件
npx vitest run -t "<名>" # 单个用例
node dev.mjs             # 手动启动（vite-plugin-electron 异常时备用：编译 preload、启动 Vite、tsx 起 Electron）
npm run pack             # build + electron-builder --dir（未打包输出）
npm run dist             # build + electron-builder（安装包）
```

Pre-commit（husky + lint-staged）：对暂存 `*.{ts,tsx}` 跑全量 `tsc --noEmit --pretty`。

## 架构

双进程 Electron 应用，严格 context isolation。**渲染进程永不直接 `fetch`** — 全部 Bilibili 请求走主进程 IPC 代理。

- **主进程**（`electron/`）：`main.ts`（引导，禁用硬件加速 + GPU 缓存）→ `windowManager.ts`（无边框/透明/始终置顶窗口 + CDN Referer 注入） + `ipcHandlers.ts`（IPC 分发） + `bilibiliApi.ts`（纯函数：API fetch + URL 解析） + `appCore.ts`（`mainWindow` 引用 + `electron-store` 单例）
- **预加载**（`electron/preload.ts` / `preload.cjs`）：`contextBridge.exposeInMainWorld('electronAPI',...)`。**两文件必须同步编辑** — `.ts` 是类型检查源，`.cjs` 是运行时使用的 CJS 变体（构建/开发时复制到 `dist-electron/preload.js`）。桥 API 变更忘记同步→静默运行时故障。
- **渲染进程**（`src/`）：React 18 + Zustand 5。`main.tsx` 入口，挂载 `App.tsx`。

## IPC 协议

`ipcHandlers.ts:9` 处理 `api` 通道（`invoke`/`handle`）。所有响应格式：`{ success, data } | { success: false, error }`。

| 消息 | 参数 | 返回 |
|------|------|------|
| `GET_VIDEO_INFO` | `{ bvid }` | `VideoInfo`（title/author/cover/cid） |
| `GET_PLAYLIST` | `{ url }` | 收藏夹所有曲目（分页聚合，并发限制 5） |
| `GET_AUDIO_URL` | `{ bvid, cid }` | `{ url, expiresAt }`（10分钟过期） |

Store：`store:get`/`store:set`（对应 `appCore.store`，泛型 schema 仅在主进程定义 `appCore.ts:7-16`）。

窗口：`window:move`（send）、`window:resize`/`window:getPosition`/`window:setMinimumSize`（invoke）。

## 状态管理

四个 zustand store，用 IPC 持久化到 `electron-store`（运行时依赖，非 devDependency）：

| Store | 持久化键 | 写入策略 |
|-------|----------|----------|
| `playlistStore` | `playlistTracks`、`playlistIndex`、`playMode` | 每次操作即时写 |
| `favoritesStore` | `favorites` | 每次操作即时写 |
| `recentStore` | `recentTracks` | 每次操作即时写 |
| `windowStore` | `windowPosition`、`windowSize`、`expandedPanelSize`、`volume` | 防抖 100ms 批量写 |

`App.tsx` 挂载时通过 IPC 读取所有持久化状态并注入 stores。主进程 `close` 事件只存 `windowPosition`；`expandedPanelSize` 存于主进程 schema 中，由渲染进程保存。

`electron-store` schema 在 `electron/appCore.ts:7-16`（泛型参数），不与渲染进程共享 → 类型不匹配产生静默运行时错误。

## 数据流

```
App.tsx（组合 4 stores + useAudioPlayer / usePlayerController / useFavoriteActions）
  → PlayerContext.Provider
  → FloatingPlayer.tsx（折叠缩略图 64px + 拖拽 + 展开/折叠 + 3 缩放手柄）
    → ExpandedPanel.tsx（控制栏 + 进度 + 标签页）
      → Playlist.tsx | FavoritesTab.tsx | RecentTab.tsx
```

`services/api.ts` — IPC 封装，管理全局唯一 `HTMLAudioElement` 单例。音频缓存（URL 有效期追踪）已提取到 `services/audioCache.ts` 的 `AudioCache` 类。

## 样式

混合使用普通 CSS（`*.css`）和 CSS Modules（`*.module.css`）。设计令牌在 `styles/tokens.css`（`--bg`/`--surface`/`--fg`/`--accent`/`--border`/`--radius`/`--shadow`），不硬编码数值。

## 类型

- `src/types/index.ts` — 领域模型（`Track`、`PlayMode`、`FavoriteFolder`、`CurrentAudio`）
- `src/types/api.ts` — API 接口（`VideoInfo`、`AudioUrl`）
- `src/types/ipc.ts` — IPC 契约（`IpcMessage`、`IpcResponse`）
- `src/types/electron.d.ts` — `window.electronAPI` 类型声明
- 从定义该类型的文件导入

**`CurrentAudio`** = `Pick<Track, 'bvid'|'cid'|'title'|'author'|'cover'>`，无 `duration`。**`Track.duration` 始终可选**（`duration?: number`）。

## 约定

- `@/*` → `./src/*`（tsconfig + vite + vitest 均已配）
- `noUncheckedIndexedAccess` 启用 → `arr[i]` 返回 `T | undefined`；确信时用 `!` 断言（正则捕获、已知长度数组）
- UI 文字/注释：中文（zh-CN）
- 魔术数字 → 模块顶命名常量（`THUMB_WIDTH`、`DEFAULT_VOLUME`、`BATCH_FLUSH_DELAY_MS`、`URL_REFRESH_INTERVAL_MS`、`PLAYLIST_PAGE_SIZE`、`AUDIO_URL_EXPIRY_MS`、`VIDEO_INFO_CONCURRENCY`）
- 窗口：无边框/透明/始终置顶。拖拽通过自定义鼠标事件实现（调 `windowMove`）。展开面板东/南/东南三个缩放手柄。

## CI & 测试

CI（`.github/workflows/ci.yml`）：push/PR 到 `main` → `npm ci` → `tsc --noEmit` → `npm run build`。CI **不跑测试**。

四个 vitest 测试文件（`vitest.config.ts` 配置 `include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.{ts,tsx}']`，无特殊 setup）：
- `src/utils/__tests__/format.test.ts` — `formatDuration`、`calcProgress`
- `src/utils/__tests__/track.test.ts` — `isTrackFavorited`、`isSameTrack`
- `src/components/floating-player/__tests__/ModeIcon.test.ts` — `nextMode`、`modeTitle`
- `electron/__tests__/features.test.ts` — 集成：URL 解析、BV 提取、模式循环、收藏夹匹配

## Bilibili API

- 音频 URL 10 分钟过期（`AUDIO_URL_EXPIRY_MS`，`bilibiliApi.ts:3`）。双重刷新：`useAudioPlayer.ts` 播放时每 60 秒轮询；`api.ts` 恢复播放前若距过期 <60 秒则强制刷新。`loadAudioTrack` 对同一 `(bvid,cid)` 距过期 >60 秒时跳过重取。
- CDN 通过 `webRequest.onBeforeSendHeaders` 注入 `Referer: https://www.bilibili.com/` + `User-Agent`（作用于 `*.hdslb.com`、`*.bilivideo.com`、`*.bilibili.com`、`*.mountaintoys.cn`）。
- 收藏夹 API 使用 `media_id`（非 `fid`）。`parsePlaylistUrl` 处理两种 URL：`medialist/play/dlista/{seasonId}/{mid}` 和 `space.bilibili.com/{mid}/favlist?fid={seasonId}`。
- 视频信息并发限制 `VIDEO_INFO_CONCURRENCY = 5`，单次失败返回 `cid: 0` 的兜底结果。

## 注意事项

- **预加载文件必须同步编辑**：`.ts`（类型检查源）和 `.cjs`（运行时），漏了导致静默 IPC 故障。
- **`electron-store` schema 仅主进程定义**：`appCore.ts:7-16` 泛型参数，不共享给渲染进程。类型不匹配→静默运行时错误。
- **硬件加速已禁用**（`main.ts:5-6`）：`app.disableHardwareAcceleration()` + GPU 缓存禁止 — 始终置顶覆盖窗口的有意设计。
- **F12 仅开发模式**：`before-input-event` 注册，生产模式无效果。
- **`playAudioLocal` 使用 `canplay` 事件 + 2 秒缓冲循环**（非 `canplaythrough`）— 解决蓝牙 A2DP 初始化延迟问题（`api.ts:85-116`）。
- **`dev.mjs` 是备用手动启动器**：编译 preload.cjs、复制到 dist-electron/、启动 Vite、等待 2 秒后用 `tsx` + `VITE_DEV_SERVER_URL` 启动 Electron。
- **`.npmrc` 配置了 electron 镜像**：`electron_mirror=https://npmmirror.com/mirrors/electron/`。

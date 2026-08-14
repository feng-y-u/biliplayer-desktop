# AGENTS.md — Piliplayer (biliplayer-local)

Electron 33 + React 18 + Zustand 5 + Vite 5。B 站收藏夹 → 无边框透明始终置顶悬浮窗。

## 命令

```bash
npm install              # electron 镜像见 .npmrc（npmmirror）
npm run dev              # gen:preload → vite（vite-plugin-electron 热重载主+渲染）
npm run build            # tsc && vite build && gen:preload + copy → dist-electron/preload.js
npx tsc --noEmit         # 类型检查（无 ESLint/Prettier）
npm run test             # vitest run
npx vitest run <路径>    # 单文件
npx vitest run -t "<名>" # 单用例
node dev.mjs             # 备用启动：preload → Vite → tsx + VITE_DEV_SERVER_URL 起 Electron
npm run pack / dist      # electron-builder（输出 release/；pack=--dir）
```

Pre-commit（husky + lint-staged）：暂存 `*.{ts,tsx}` 时跑全量 `tsc --noEmit --pretty`（不是只查暂存文件）。  
CI（`.github/workflows/ci.yml`）：`npm ci` → `tsc --noEmit` → `npm run build`。**不跑测试**。

## 架构（易错边界）

严格 context isolation。**渲染进程永不直接 `fetch`** — B 站请求全部经主进程 IPC。

| 区域 | 路径 | 要点 |
|------|------|------|
| 主进程入口 | `electron/main.ts` | 有意 `disableHardwareAcceleration` + `disable-gpu-cache` |
| 窗口 | `electron/windowManager.ts` | 无框/透明/`alwaysOnTop(..., 'pop-up-menu')`（压过浏览器全屏）；CDN Referer 注入 |
| IPC | `electron/ipcHandlers.ts` | 单通道 `api` + `store:*` + `window:*` |
| B 站 API | `electron/bilibiliApi.ts` | 纯函数；用 Electron `net.fetch`（非全局 fetch） |
| 状态单例 | `electron/appCore.ts` | `mainWindow` + `electron-store` schema（**仅主进程**） |
| 预加载 | `electron/preload.ts` | **只改 `.ts`**；`gen:preload`/dev/build 生成 `.cjs` 并复制为 `dist-electron/preload.js` |
| 渲染 | `src/` | `main.tsx` → `App.tsx` 组合 stores/hooks → `FloatingPlayer` |

`package.json` `"main": "dist-electron/main.js"`。桥 API 变更时同步 `src/types/electron.d.ts`，漏改 → 静默运行时故障。

## IPC

`api` invoke，响应：`{ success, data } | { success: false, error }`。

| type | 参数 | 返回 |
|------|------|------|
| `GET_VIDEO_INFO` | `{ bvid }` | title/author/cover/cid/… |
| `GET_PLAYLIST` | `{ url }` | 收藏夹曲目（分页聚合；cid 按需补齐，见「B 站 API 细节」） |
| `GET_FAV_LIST` | `{ mediaId }` | 收藏夹 ID 直拉（同 GET_PLAYLIST 底层接口） |
| `GET_SERIES_LIST` / `GET_COLLE_LIST` | `{ mid, sid }` | 视频列表 / 合集（接口自带 cid） |
| `GET_AUDIO_URL` | `{ bvid, cid }` | `{ url, backupUrls, expiresAt }`（约 10 分钟） |

另：`store:get`/`store:set`；`window:move`（send）、`window:resize`/`getPosition`（invoke）；`login:qrcode:start`/`login:qrcode:poll`/`login:check`/`login:logout`。

## 状态与持久化

四个 zustand store → IPC → `electron-store`（**runtime dependency**）：

| Store | 键 | 写策略 |
|-------|-----|--------|
| `playlistStore` | `playlistTracks`/`playlistIndex`/`playMode` | 即时 |
| `favoritesStore` | `favorites` | 即时 |
| `recentStore` | `recentTracks` | 即时 |
| `windowStore` | `windowPosition`/`windowSize`/`expandedPanelSize`/`volume` | 防抖 100ms |

`App.tsx` 挂载时 IPC 灌入 stores。主进程 `close` 只写 `windowPosition`；`expandedPanelSize` 由渲染进程在收起时写。  
schema 只在 `appCore.ts` 泛型里定义，与渲染不同步 → 键/形状错了会静默坏数据。

## 音频

- 全局唯一 `HTMLAudioElement` + 播放状态机：`src/services/audioEngine.ts`（`getAudioEngine()` 单例）；URL 缓存：`src/services/audioCache.ts`。
- 过期优先读 CDN `deadline` 参数，否则约 10 分钟。双重刷新：播放中每 60s `backgroundRefresh`；`resume`/中途 error 可 `force` 刷；命中缓存需距过期 >60s。
- 主 URL 失败试 `backupUrls`，再 `invalidate` 后重拉一次；`canplay` 8s 超时；缓冲等待有上限（短曲/卡顿不会死等）。
- `handleNextButton` 防重入（`nextInFlightRef`）。CDN Referer/UA 注入见 `windowManager`（`*.hdslb.com` / `*.bilivideo.com` / `*.bilibili.com` / `*.mountaintoys.cn`）。

## B 站 API 细节

- 收藏夹列表参数是 **`media_id`**（URL 里的 `fid`/`seasonId` 作 media_id；不是 fid 字段名直传）。
- `parsePlaylistUrl` 两种：`medialist/play/dlista/{seasonId}/{mid}`、`space.bilibili.com/{mid}/favlist?fid={seasonId}`。
- `biliFetch`：30s 超时、最多 2 次重试、全局限速串行门（每请求 ≥1.2s，防封）。
- **cid 懒加载**：收藏夹接口不返回 cid → 列表曲目 `cid=0` 立即返回；播放时由渲染层 `ensureTrackCid` 按需调 `GET_VIDEO_INFO` 补齐，播放成功后预取下一首 cid。系列/合集接口自带 cid，无需补齐。
- 音频：`playurl` + `fnval=16` 取 DASH `dash.audio[0]`。

## 约定

- `@/*` → `./src/*`（tsconfig / vite / vitest）
- `noUncheckedIndexedAccess`：`arr[i]` 为 `T | undefined`
- UI 文案/注释：中文；类型从定义文件导入（`src/types/{index,api,ipc}.ts`、`electron.d.ts`）
- `CurrentAudio` = `Pick<Track, 'bvid'|'cid'|'title'|'author'|'cover'>`（无 duration）；`Track.duration?` 始终可选
- 样式：普通 CSS + CSS Modules；令牌在 `src/styles/tokens.css`，勿硬编码色值/圆角
- 魔术数字放模块顶常量；折叠缩略图 64×64；拖拽走自定义鼠标事件 + `windowMove`；展开面板东/南/东南三缩放手柄
- 测试：`vitest.config.ts` include `src/**/*.test.{ts,tsx}` 与 `electron/**/*.test.{ts,tsx}`，无 setup/服务依赖
- F12 DevTools 仅 `VITE_DEV_SERVER_URL` 开发模式注册

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Guiding Principles

When working in this codebase, apply these principles:

- **Simplicity first**: Write minimum code that solves the problem. No speculative abstractions, no unused flexibility.
- **Surgical changes**: Touch only what the task requires. Don't improve adjacent code or refactor things that aren't broken.
- **Goal-driven execution**: Define verifiable success criteria before starting work. Loop until verified.
- **Teach, don't just do**: When guiding users through complex operations, explain the "why" behind each step. Use metaphors when helpful to make concepts more accessible.

## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question | Tool |
|---|---|
| "Where is X defined?" / "Find symbol named X" | `codegraph_search` |
| "What calls function Y?" | `codegraph_callers` |
| "What does Y call?" | `codegraph_callees` |
| "What would break if I changed Z?" | `codegraph_impact` |
| "Show me Y's signature / source / docstring" | `codegraph_node` |
| "Give me focused context for a task/area" | `codegraph_context` |
| "See several related symbols' source at once" | `codegraph_explore` |
| "What files exist under path/" | `codegraph_files` |
| "Is the index healthy?" | `codegraph_status` |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture / trace questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: *"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"*

## Commands

```bash
npm install                     # first time
npm run gen:preload             # compile electron/preload.ts → electron/preload.cjs via esbuild
npm run dev                     # gen:preload + Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build                   # tsc && vite build + gen:preload + copy preload.cjs → dist-electron/
npx tsc --noEmit                # typecheck only (no build)
npm run test                    # vitest run (unit + feature tests)
npm run test:watch              # vitest in watch mode
npx vitest run <path>           # run single test file
npm run preview                 # vite preview (serve built dist locally)
node dev.mjs                    # manual dev launcher (alternative to vite-plugin-electron)
npm run pack                    # build + electron-builder --dir (unpacked output)
npm run dist                    # build + electron-builder (installer)
```

Pre-commit hook runs `npx lint-staged` which typechecks staged `*.{ts,tsx}` files. See `lint-staged.config.js`.

## Tests

Seven test files exist:
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `src/services/__tests__/audioCache.test.ts`
- `src/stores/__tests__/playlistStore.test.ts`
- `electron/__tests__/features.test.ts`
- `electron/__tests__/audioExpiry.test.ts`

Tests use vitest (config in `vitest.config.ts`). CI does **not** run tests.

Run a single test file: `npx vitest run src/utils/__tests__/format.test.ts`
Run a single test: `npx vitest run -t "test name pattern"`

## Architecture

Two-process Electron app with strict context isolation. Renderer never calls `fetch` directly — all Bilibili API requests go through IPC to main process.

### Process boundary

- **Main process** (`electron/main.ts`): frameless BrowserWindow, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence. IPC handler dispatches `GET_VIDEO_INFO`, `GET_PLAYLIST`, `GET_AUDIO_URL`.
- **Preload** (`electron/preload.ts`): `contextBridge.exposeInMainWorld('electronAPI', ...)` — exposes `api(message)`, `storeGet(key)`, `storeSet(key, value)`, window control methods. **只改 `.ts` 源文件** — `preload.cjs` 是由 `gen:preload`（esbuild）从 `.ts` 自动生成的构建产物（gitignored），dev/build 会自动重新生成并复制到 `dist-electron/preload.js`。桥 API 变更时同步 `src/types/electron.d.ts`，漏改 → 静默运行时故障。
- **Renderer** (`src/`): React 18, all API calls via IPC.

### Two dev launchers

| Method | Mechanism | Use when |
|---|---|---|
| `npm run dev` | `vite-plugin-electron` handles everything | Normal development |
| `node dev.mjs` | Copies preload, starts Vite, launches Electron with `tsx` + `VITE_DEV_SERVER_URL` | Plugin misbehaves |

Only one Vite config exists: `vite.config.ts` (primary, with electron + renderer plugins). `dev.mjs` is the manual dev launcher (tsx + VITE_DEV_SERVER_URL) when vite-plugin-electron misbehaves.

### Audio URL lifecycle

Bilibili audio URLs expire ~10 minutes. `src/services/audioEngine.ts`（显式状态机）管理全局 `HTMLAudioElement` 单例，`src/services/audioCache.ts` 管理 URL 缓存。双刷新机制：

1. `useAudioPlayer.ts` — 播放中每 60s 调 `engine.backgroundRefresh()` 刷新 CDN 链接
2. `audioCache` — `isValid()` 要求距过期 >60s 才算命中；`resume`/播放中 error 会 `force` 刷新并重拉

渲染层不直接 `fetch` — 音频 URL 由主进程 `getAudioUrl` 经 IPC 返回，`src` 在渲染进程设置。

### Data flow

```
User click → React component → api.ts (IPC invoke) → electron/main.ts (fetch) → Bilibili API
                                                          ↓
                                                   electron-store (persistence)
```

Audio playback is renderer-only: `audioEngine.ts` creates the `HTMLAudioElement` singleton and controls it via an explicit state machine (`idle → loading → playing → paused → ended/error`). Audio URLs are fetched from main process but the `src` is set in the renderer.

### Component tree & responsibilities

```
src/App.tsx                      ← 挂载时 IPC 灌入 stores；组装 PlayerContext + FloatingPlayer
 └─ FloatingPlayer.tsx          ← 折叠/展开切换、拖拽、缩放、展开/收起动画
     ├─ PlayerThumb.tsx         ← 64×64 折叠缩略图（封面 / ♪）+ hover 快捷控制
     ├─ ExpandedPanel.tsx       ← 全量面板：控制 + 进度 + 三标签 + 登录/主题入口
     │   ├─ Playlist.tsx        ← 播放列表，拖拽排序、删除、当前高亮、加入收藏
     │   ├─ FavoritesTab.tsx    ← 收藏夹网格（卡片 + 展开曲目 + 新建/添加/删除）
     │   ├─ RecentTab.tsx       ← 最近播放列表
     │   └─ ModeIcon.tsx        ← 循环/单曲/随机 SVG 图标
     ├─ LoginModal.tsx          ← 二维码登录弹窗（qrcode 库渲染）
     └─ LoginPrompt.tsx         ← 播放失败时的登录引导提示
```

`ExpandedPanel` manages a tab system (播放列表 / 收藏夹 / 最近播放). `FavoritesTab` shows per-folder cards and expands to show tracks within a folder. `RecentTab` shows recently played tracks and can add them back to the active playlist.

### State management

Four zustand stores manage state, each persists to `electron-store` via IPC:

| Store | Key(s) persisted | IPC write strategy |
|---|---|---|
| `playlistStore` | `playlistTracks`, `playlistIndex`, `playMode` | Immediate per-action |
| `favoritesStore` | `favorites` | Immediate per-action |
| `recentStore` | `recentTracks` | Immediate per-action |
| `windowStore` | `windowPosition`, `windowSize`, `expandedPanelSize`, `volume`, `theme` | Debounced batch (100ms flush) |

**Stores** (`src/stores/`):
- **`playlistStore`**: tracks, currentIndex, playMode, loading + CRUD (addTrack, deleteTrack, reorderTracks)
- **`favoritesStore`**: FavoriteFolder[] + CRUD
- **`recentStore`**: recentTracks (max 50)
- **`windowStore`**: windowPosition, windowSize, volume (debounced batch IPC writes)

**Hooks** (`src/hooks/`):
- **`useAudioPlayer`**: 订阅 `AudioEngine` 状态（`getAudioEngine()` 单例），暴露 `PlayerState`（isPlaying/currentTime/duration/buffered/volume/currentAudio）与 `playPause`/`playTrack`/`seek`/`volumeChange`/`syncVolume`；播放中每 60s 调 `engine.backgroundRefresh()` 刷新音频 URL
- **`usePlayerController`**: 播放列表 CRUD + 播放导航（next/prev/play/delete/reorder/input），`handleNextButton` 防重入（`nextInFlightRef`）
- **`useFavoriteActions`**: 收藏夹 CRUD（create/add/remove/delete/reorder/play/add-all-to-playlist）
- **`useDrag`** / **`useFloatingPlayerDrag`**: 自定义鼠标拖拽移动窗口（`windowMove` IPC）
- **`useResize`**: 展开面板三方向缩放手柄（e/s/se）
- **`useLerpAnimation`**: 展开/收起窗口尺寸动画（requestAnimationFrame）
- **`useDragReorder`**: 共享的拖拽排序逻辑（播放列表 / 收藏夹曲目）

`App.tsx` reads all persisted state on mount via IPC and hydrates the stores.

### Window behavior

- `alwaysOnTop: true`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`
- Window drag implemented via custom mouse event handling in `useDrag.ts` (`useFloatingPlayerDrag`) — captures `mousedown`/`mousemove`/`mouseup` on `window` and calls `window.electronAPI.windowMove()` on each move frame
- Collapsed state renders a small circular thumb (`64px`). Thumb can be clicked to expand; expanded panel contains full player UI.
- Expanded panel has three resize handles: east (e), south (s), and southeast (se) edges. Drag events update both window size and persisted `windowSize` state.
- Window position persisted to `electron-store` on collapse/close; size persisted immediately (debounced 100ms)
- Hardware acceleration disabled (`app.disableHardwareAcceleration()`) + GPU cache disabled
- Bilibili CDN requests (`*.hdslb.com`, `*.bilivideo.com`, `*.bilibili.com`, `*.mountaintoys.cn`) inject `Referer: https://www.bilibili.com/` + UA via `webRequest.onBeforeSendHeaders` in `windowManager.ts`
- F12 opens DevTools in dev mode only via `before-input-event` listener in `windowManager.ts`

### IPC contract

**`api` channel** (invoke/handle): all Bilibili data requests
- `GET_VIDEO_INFO` → `{ bvid }` → returns video metadata (title, author, cover, cid, duration)
- `GET_PLAYLIST` → `{ url }` → parses Bilibili favlist URL (supports `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}`), paginates all tracks
- `GET_FAV_LIST` → `{ mediaId }` → 收藏夹 ID 直接拉取（与 GET_PLAYLIST 同一底层 API）
- `GET_SERIES_LIST` / `GET_COLLE_LIST` → `{ mid, sid }` → 视频列表 / 合集
- `GET_AUDIO_URL` → `{ bvid, cid }` → returns audio streaming URL with 10-minute expiry

**`store:get` / `store:set`**: typed against `electron-store` schema defined in `electron/appCore.ts`

**Login channels** (invoke/handle):
- `login:qrcode:start` / `login:qrcode:poll` — 二维码登录（会话按 sender.id 存于主进程 `loginStates`，3 分钟超时自动清理）
- `login:check` / `login:logout` — cookie 检查 / 删除（覆盖 `bilibili.com` 各子域）

**Window control channels**:
- `window:move` (send) — `(x, y)` — positions the window via `mainWindow.setPosition()`
- `window:resize` (invoke/handle) — `(width, height)` — `mainWindow.setSize()`
- `window:getPosition` (invoke/handle) — returns `{ x, y, width, height }`

## Directory layout

```
electron/
  main.ts         # 入口：禁用硬件加速 + GPU 缓存，whenReady 后建窗 + 注册 IPC
  windowManager.ts # 窗口创建（无框/透明/置顶）、CDN Referer 注入、F12 DevTools、位置持久化
  ipcHandlers.ts  # api / store:* / window:* / login:* 全部 IPC 处理
  bilibiliApi.ts  # B站 API 纯函数（net.fetch、限速队列、重试、URL 过期解析）
  appCore.ts      # 单例：mainWindow 引用 + electron-store schema（仅主进程）
  preload.ts      # contextBridge（electronAPI）；.cjs 由 gen:preload 生成，勿手改
  __tests__/
    features.test.ts   # 特征测试（URL 解析 / BV 提取 / 模式循环 / track 匹配）
    audioExpiry.test.ts # 音频 URL 过期解析

src/
  main.tsx        # React 入口
  App.tsx         # 根组件：挂载时 IPC 灌入 stores，组装 PlayerContext + FloatingPlayer
  types/
    index.ts       # Track, PlayMode, PlayerState, FavoriteFolder, CurrentAudio, etc.
    api.ts         # VideoInfo, AudioUrl interfaces
    ipc.ts         # IpcMessage, IpcResponseMap, IpcResponse types（严格 IPC 契约）
    electron.d.ts  # window.electronAPI 类型（与 preload.ts 同步）
    css.d.ts       # *.module.css 声明
  services/
    api.ts         # 渲染层 IPC 封装（不直接 fetch）
    audioEngine.ts # 音频播放状态机 + 全局 HTMLAudioElement 单例
    audioCache.ts  # 音频 URL 缓存（>60s 有效期判定 / invalidate）
  stores/
    playlistStore.ts   # zustand: tracks, currentIndex, playMode + CRUD
    favoritesStore.ts  # zustand: FavoriteFolder[] + CRUD
    recentStore.ts     # zustand: recentTracks (max 50)
    windowStore.ts     # zustand: windowPosition, windowSize, expandedPanelSize, volume, theme
  contexts/
    PlayerContext.tsx        # PlayerContext + usePlayerContext()
    usePlayerContextValue.ts # 组装 Context value（播放/列表/收藏动作）
  hooks/
    useAudioPlayer.ts       # 订阅 AudioEngine 状态 + 60s 后台刷新 + PlayerState
    usePlayerController.ts  # 播放列表 CRUD + 导航（next/prev/play/delete/reorder/input）
    useFavoriteActions.ts   # 收藏夹 CRUD + 输入添加 + 整夹入列表
    useDrag.ts / useFloatingPlayerDrag.ts  # 拖拽移动窗口
    useResize.ts            # 展开面板三向缩放
    useLerpAnimation.ts     # 展开/收起尺寸动画
    useDragReorder.ts       # 共享拖拽排序
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" 或 "--:--"；calcProgress
    track.ts      # isSameTrack()、mergeUniqueTracks()（bvid:cid 复合去重）
    bilibili.ts   # parseInput()：BV / 收藏夹 / 合集链接解析
  components/floating-player/
    FloatingPlayer.tsx  # 折叠/展开切换 + 拖拽 + 缩放 + 动画
    PlayerThumb.tsx     # 64×64 折叠缩略图 + hover 快捷控制
    ExpandedPanel.tsx   # 全量面板（控制/进度/三标签/登录/主题）
    Playlist.tsx        # 播放列表（排序/删除/高亮/收藏下拉）
    ModeIcon.tsx        # 播放模式图标 + nextMode/modeTitle
    Icons.tsx           # PlayPause/Prev/Next/Volume 图标
    FavoritesTab.tsx    # 收藏夹网格
    RecentTab.tsx       # 最近播放列表
    LoginModal.tsx      # 二维码登录弹窗
    LoginPrompt.tsx     # 登录引导提示
    __tests__/
      ModeIcon.test.ts  # 单元测试
  styles/
    tokens.css          # 设计令牌
    global.css          # 全局重置
lint-staged.config.js  # runs `tsc --noEmit --pretty` on staged *.{ts,tsx}
dev.mjs                 # manual dev launcher
.github/workflows/ci.yml # GitHub Actions: npm ci → tsc --noEmit → npm run build
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **Type organization**: Types are split across `types/index.ts` (domain model), `types/api.ts` (API interfaces), `types/ipc.ts` (IPC contract) — import from the specific file that defines the type
- **CSS**: `tokens.css` with CSS custom properties (`--bg`, `--surface`, `--fg`, `--accent`, `--border`, `--radius`, `--shadow`, etc.); always use these tokens — never hardcode colors/spacing. 样式混用两种方式：普通 `.css`（`FloatingPlayer.css`、`panel.css`、`controls.css`、`Playlist.css`、`PlayerThumb.css`、`LoginModal.css`、`LoginPrompt.css`）与 CSS Modules（`ExpandedPanel.module.css`、`FavoritesTab.module.css`、`RecentTab.module.css`，通过 `*.module.css` 的类型声明使用）
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **CI** (GitHub Actions): `npm ci` → `tsc --noEmit` → `npm run build` on push/PR to `main`. Note: CI does **not** run tests.
- **Module-level singletons**: `audioEngine.ts` holds the global `HTMLAudioElement` + 播放状态机（`getAudioEngine()` 懒加载单例），`audioCache.ts` 持有 URL 缓存（`currentUrl`/`expiresAt`）。改动播放逻辑时注意隐式状态。
- **Constants**: extract magic numbers as named constants at module top (e.g. `THUMB_WIDTH`, `DEFAULT_VOLUME`, `BATCH_FLUSH_DELAY_MS`)
- **Shared logic**: extract reusable UI patterns to hooks (e.g. `useDragReorder`)

## Gotchas

### Critical workflow issues

- **Preload 只改 `.ts` 源文件**: `electron/preload.cjs` 是构建产物（gitignored），由 `gen:preload`（esbuild）从 `preload.ts` 自动生成并复制到 `dist-electron/preload.js`。手动改 `.cjs` 会在下次构建被覆盖。桥 API 变更必须同步 `src/types/electron.d.ts`，漏改 → 静默运行时故障。
- **electron-store schema is in main only**: The schema is defined as a generic type param in `electron/appCore.ts` and never shared with the renderer. Type mismatches between main and renderer cause silent runtime errors — verify types match before making changes.
- **渲染层不直接 `fetch`**: 所有 B 站请求必须经 IPC（`api` 通道）由主进程 `net.fetch` 发起，避免 CORS 与 Referer 问题。

### Audio & playback behavior

- **Bilibili audio URLs expire in ~10 minutes**: The codebase handles this with two mechanisms:
  1. `useAudioPlayer.ts` 播放中每 60s 调 `engine.backgroundRefresh()` 主动刷新
  2. `audioCache.isValid()` 要求距过期 >60s 才算命中；`resume` 前检查、播放中 error 强制刷新重拉
  If playback suddenly fails, check whether the URL refresh logic is working correctly.
- **全局音频元素是单例**: `audioEngine.ts` 的 `AudioEngine`（`getAudioEngine()`）持有一个 `HTMLAudioElement`，状态机管理播放；`audioCache.ts` 缓存 URL。改动播放逻辑时小心隐式状态。

### Type and data handling

- **`CurrentAudio` is not `Track`**: `ExpandedPanel` uses `CurrentAudio` which is `Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>` — it's missing `duration`. Always handle the undefined case for `duration` in any component that receives `CurrentAudio`.
- **`Track.duration` is optional**: Even when you have a full `Track`, `duration` may be undefined.
- **noUncheckedIndexedAccess is enabled**: Array/object indexing returns `T | undefined`. Use `!` assertions only when you're certain the value exists (e.g., regex captures, known-length arrays). Prefer explicit checks otherwise.

### UI and window behavior

- **Hardware acceleration is disabled**: This is intentional for the always-on-top overlay window. `app.disableHardwareAcceleration()` and GPU cache disabled in main.ts. Don't try to re-enable it.
- **Window size and position have different persistence timing**: Position is persisted on window close; size is persisted immediately on resize (debounced 100ms).
- **`windowStore` uses debounced batch writes**: IPC writes lag 100ms behind React state. This is intentional to avoid overwhelming the store during rapid resize events.

### Bilibili API quirks

- **Favorites endpoint uses `media_id`, not `fid`**: The playlist URL parser in `bilibiliApi.ts` (`parsePlaylistUrl`) handles both URL formats, but the API call itself must use `media_id`（即 URL 中的 fid/seasonId）。
- **Bilibili CDN requires Referer header**: `webRequest.onBeforeSendHeaders` in `windowManager.ts` injects `Referer: https://www.bilibili.com/` + UA for `*.hdslb.com`, `*.bilivideo.com`, `*.bilibili.com`, `*.mountaintoys.cn` requests. Without this, CDN requests fail.

### Dev environment

- **F12 opens DevTools in dev mode only**: Registered via `before-input-event` listener in `windowManager.ts`（仅 `VITE_DEV_SERVER_URL` 模式）。In production builds, F12 does nothing.

## Reference files

- **`AGENTS.md`**: Contains a similar but more concise overview of this codebase. Use it as a quick reference when you need a refresher on the main points. When in doubt, trust CLAUDE.md for detailed guidance.

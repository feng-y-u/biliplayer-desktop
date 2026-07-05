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

Four test files exist:
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `electron/__tests__/features.test.ts`

Tests use vitest (config in `vitest.config.ts`). CI does **not** run tests.

Run a single test file: `npx vitest run src/utils/__tests__/format.test.ts`
Run a single test: `npx vitest run -t "test name pattern"`

## Architecture

Two-process Electron app with strict context isolation. Renderer never calls `fetch` directly — all Bilibili API requests go through IPC to main process.

### Process boundary

- **Main process** (`electron/main.ts`): frameless BrowserWindow, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence. IPC handler dispatches `GET_VIDEO_INFO`, `GET_PLAYLIST`, `GET_AUDIO_URL`.
- **Preload** (`electron/preload.ts` / `preload.cjs`): `contextBridge.exposeInMainWorld('electronAPI', ...)` — exposes `api(message)`, `storeGet(key)`, `storeSet(key, value)`, window control methods. **Both files must be edited in sync** — `.ts` is the typechecked source, `.cjs` is the runtime-used CJS variant (copied to `dist-electron/preload.js` during build/dev). Changes to the bridge API must be mirrored manually in both files. **Critical**: forgetting to update both files causes silent runtime failures.
- **Renderer** (`src/`): React 18, all API calls via IPC.

### Two dev launchers

| Method | Mechanism | Use when |
|---|---|---|
| `npm run dev` | `vite-plugin-electron` handles everything | Normal development |
| `node dev.mjs` | Copies preload, starts Vite, launches Electron with `tsx` + `VITE_DEV_SERVER_URL` | Plugin misbehaves |

Two Vite configs exist: `vite.config.ts` (primary, with electron + renderer plugins) and `vite.config.electron.ts` (standalone main-process-only build, not referenced from any script — legacy/unused). `dev.mjs` is the manual dev launcher (tsx + VITE_DEV_SERVER_URL) when vite-plugin-electron misbehaves.

### Audio URL lifecycle

Bilibili audio URLs expire ~10 minutes. Two refresh mechanisms work together:
1. `useAudioPlayer.ts` — 60s interval calls `refreshAudioUrl()` for the current track, keeping the URL fresh proactively
2. `api.ts` — before playing, checks if current URL is within 5 min of expiry and clears it to force re-fetch

The renderer manages a **global `HTMLAudioElement` singleton** in `src/services/api.ts` (module-level `audioEl` variable). All playback control (`playAudioLocal`, `pauseAudioLocal`, `seekAudioLocal`, `setVolumeLocal`) operates on this single instance.

### Data flow

```
User click → React component → api.ts (IPC invoke) → electron/main.ts (fetch) → Bilibili API
                                                          ↓
                                                   electron-store (persistence)
```

Audio playback is renderer-only: `api.ts` creates an `HTMLAudioElement` singleton and controls it directly. Audio URLs are fetched from main process but the `src` is set in the renderer.

### Component tree & responsibilities

```
src/App.tsx
 └─ FloatingPlayer.tsx          ← thumb (64px), mouse drag, collapsed/expanded toggle + resize handles
     └─ ExpandedPanel.tsx       ← full panel: controls + progress + tabs
         ├─ Playlist.tsx        ← current playlist, reorder, delete, active track highlight
         ├─ FavoritesTab.tsx    ← favorite folder grid (cards with track count)
         ├─ RecentTab.tsx       ← recently played tracks list
         └─ ModeIcon.tsx        ← loop/single/shuffle SVG icons
```

`ExpandedPanel` manages a tab system (播放列表 / 收藏夹 / 最近播放). `FavoritesTab` shows per-folder cards and expands to show tracks within a folder. `RecentTab` shows recently played tracks and can add them back to the active playlist.

### State management

Four zustand stores manage state, each persists to `electron-store` via IPC:

| Store | Key(s) persisted | IPC write strategy |
|---|---|---|
| `playlistStore` | `playlist`, `playMode` | Immediate per-action |
| `favoritesStore` | `favorites` | Immediate per-action |
| `recentStore` | `recentTracks` | Immediate per-action |
| `windowStore` | `windowPosition`, `windowSize`, `volume` | Debounced batch (100ms flush) |

**Stores** (`src/stores/`):
- **`playlistStore`**: tracks, currentIndex, playMode, loading + CRUD (addTrack, deleteTrack, reorderTracks)
- **`favoritesStore`**: FavoriteFolder[] + CRUD
- **`recentStore`**: recentTracks (max 50)
- **`windowStore`**: windowPosition, windowSize, volume (debounced batch IPC writes)

**Hooks** (`src/hooks/`):
- **`useAudioPlayer`**: manages `HTMLAudioElement` lifecycle by attaching event listeners (`timeupdate`, `play`, `pause`, `loadedmetadata`, `volumechange`, `ended`) to the global singleton. Falls back to a 200ms interval to wait for the audio element on first render. Controls: `playPause`, `playTrack`, `seek`, `volumeChange`. Runs a 60s interval to refresh the Bilibili audio URL (only while `isPlaying && currentAudio`).
- **`usePlayerController`**: playlist CRUD + player navigation (next/prev/play/delete/reorder/input)
- **`useFavoriteActions`**: favorite CRUD (create/toggle/add/remove/delete/reorder)
- **`useDragReorder`**: shared drag-and-drop reorder logic

`App.tsx` reads all persisted state on mount via IPC and hydrates the stores.

### Window behavior

- `alwaysOnTop: true`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`
- Window drag implemented via custom mouse event handling in `FloatingPlayer.tsx` — captures `mousedown`/`mousemove`/`mouseup` on `window` and calls `window.electronAPI.windowMove()` on each move frame
- Collapsed state renders a small circular thumb (`64px`). Thumb can be clicked to expand; expanded panel contains full player UI.
- Expanded panel has three resize handles: east (e), south (s), and southeast (se) edges. Drag events update both window size and persisted `windowSize` state.
- Window bounds persisted to `electron-store` on close
- Hardware acceleration disabled (`app.disableHardwareAcceleration()`) + GPU cache disabled
- Bilibili CDN requests (`*.hdslb.com`, `*.bilivideo.com`, `*.bilibili.com`) inject `Referer: https://www.bilibili.com/` via `webRequest.onBeforeSendHeaders`
- F12 opens DevTools in dev mode via `globalShortcut`

### IPC contract

**`api` channel** (invoke/handle): all Bilibili data requests
- `GET_VIDEO_INFO` → `{ bvid }` → returns video metadata (title, author, cover, cid)
- `GET_PLAYLIST` → `{ url }` → parses Bilibili favlist URL (supports `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}`), paginates all tracks
- `GET_AUDIO_URL` → `{ bvid, cid }` → returns audio streaming URL with 10-minute expiry

**`store:get` / `store:set`**: typed against `electron-store` schema defined inline in `electron/main.ts:21-30`

**Window control channels**:
- `window:move` (send) — `(x, y)` — positions the window via `mainWindow.setPosition()`
- `window:resize` (invoke/handle) — `(width, height)` — `mainWindow.setSize()`
- `window:getPosition` (invoke/handle) — returns `{ x, y, width, height }`
- `window:setMinimumSize` (invoke/handle) — `(width, height)` — `mainWindow.setMinimumSize()`

## Directory layout

```
electron/
  main.ts         # window management, Bilibili API proxy, IPC handlers
  preload.ts      # contextBridge (exposes electronAPI to renderer)
  preload.cjs     # CJS variant used at runtime (copied to dist-electron/)
  __tests__/
    features.test.ts  # integration tests

src/
  main.tsx        # React entry
  App.tsx         # root component, wires stores + hooks into FloatingPlayer
  types/
    index.ts       # Track, PlayMode, PlayerState, FavoriteFolder, CurrentAudio, etc.
    api.ts         # VideoInfo, AudioUrl interfaces
    ipc.ts         # IpcMessage, IpcResponseMap, IpcResponse types (strict IPC contract)
  services/api.ts # renderer-side IPC wrappers + global HTMLAudioElement singleton
  stores/
    playlistStore.ts   # zustand: tracks, currentIndex, playMode, loading + CRUD
    favoritesStore.ts  # zustand: FavoriteFolder[] + CRUD
    recentStore.ts     # zustand: recentTracks (max 50)
    windowStore.ts     # zustand: windowPosition, windowSize, volume (debounced batch IPC writes)
  hooks/
    useAudioPlayer.ts       # HTMLAudioElement lifecycle via event listeners + URL refresh
    usePlayerController.ts  # playlist CRUD + player navigation (next/prev/play/delete/reorder/input)
    useFavoriteActions.ts   # favorite CRUD (create/toggle/add/remove/delete/reorder)
    useDragReorder.ts       # shared drag-and-drop reorder logic
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" or "--:--"
    track.ts      # isSameTrack(), isTrackFavorited()
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb (64px) + mouse drag + expanded toggle + resize handles
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input)
    Playlist.tsx        # track list with reorder, delete, active highlight
    ModeIcon.tsx        # play mode SVG icons
    Icons.tsx           # PlayPauseIcon, NextIcon
    FavoritesTab.tsx    # favorites grid (folder cards)
    RecentTab.tsx       # recently played tracks list
    __tests__/
      ModeIcon.test.ts  # unit tests
  styles/
    tokens.css          # design tokens: --bg, --surface, --fg, --accent, --border, --radius, --shadow
    global.css          # base reset
lint-staged.config.js  # runs `tsc --noEmit --pretty` on staged *.{ts,tsx}
dev.mjs                 # manual dev launcher
.github/workflows/ci.yml # GitHub Actions: npm ci → tsc --noEmit → npm run build
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **Type organization**: Types are split across `types/index.ts` (domain model), `types/api.ts` (API interfaces), `types/ipc.ts` (IPC contract) — import from the specific file that defines the type
- **CSS**: `tokens.css` with CSS custom properties (`--bg`, `--surface`, `--fg`, `--accent`, `--border`, `--radius`, `--shadow`, etc.); always use these tokens — never hardcode colors/spacing. Component styles in companion `.css` files (e.g. `FloatingPlayer.css`, `panel.css`); no CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **CI** (GitHub Actions): `npm ci` → `tsc --noEmit` → `npm run build` on push/PR to `main`. Note: CI does **not** run tests.
- **`react-draggable`** is in `package.json` dependencies but the app implements custom drag in `FloatingPlayer.tsx` — the package is unused
- **Module-level singletons**: `api.ts` holds a global `HTMLAudioElement` + Bilibili URL cache (`currentUrl`, `currentExpiresAt`). Be aware of implicit state when touching these. The `loadAudioTrack` function caches aggressively — it skips re-fetching if the current URL is >60s from expiry for the same (bvid, cid) pair.
- **Constants**: extract magic numbers as named constants at module top (e.g. `THUMB_WIDTH`, `DEFAULT_VOLUME`, `BATCH_FLUSH_DELAY_MS`)
- **Shared logic**: extract reusable UI patterns to hooks (e.g. `useDragReorder`)

## Gotchas

### Critical workflow issues

- **Preload files must be synced manually**: `electron/preload.ts` is the typechecked source; `electron/preload.cjs` is the runtime CJS variant copied during build/dev. Both must be edited in sync. Forgetting this causes silent runtime failures — the renderer won't be able to communicate with the main process.
- **electron-store schema is in main only**: The schema is defined as a generic type param in `electron/main.ts:21-30` and never shared with the renderer. Type mismatches between main and renderer cause silent runtime errors — verify types match before making changes.
- **README.md is stale**: References non-existent files (`useStorage.ts`, `usePlaylist.ts`, `vite.config.electron.ts`) and an outdated directory layout. Always trust CLAUDE.md's directory structure instead.

### Audio & playback behavior

- **Bilibili audio URLs expire in ~10 minutes**: The codebase handles this with two mechanisms:
  1. `useAudioPlayer.ts` refreshes proactively every 60s while playing
  2. `api.ts` checks if current URL is within 5 min of expiry and clears it to force re-fetch
  If playback suddenly fails, check whether the URL refresh logic is working correctly.
- **Global audio element is a singleton**: `src/services/api.ts` has a module-level `HTMLAudioElement` and URL cache (`currentUrl`, `currentExpiresAt`). All playback controls operate on this single instance. Be very careful when modifying playback logic — state changes are implicit and affect all callers.

### Type and data handling

- **`CurrentAudio` is not `Track`**: `ExpandedPanel` uses `CurrentAudio` which is `Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>` — it's missing `duration`. Always handle the undefined case for `duration` in any component that receives `CurrentAudio`.
- **`Track.duration` is optional**: Even when you have a full `Track`, `duration` may be undefined.
- **noUncheckedIndexedAccess is enabled**: Array/object indexing returns `T | undefined`. Use `!` assertions only when you're certain the value exists (e.g., regex captures, known-length arrays). Prefer explicit checks otherwise.

### UI and window behavior

- **Hardware acceleration is disabled**: This is intentional for the always-on-top overlay window. `app.disableHardwareAcceleration()` and GPU cache disabled in main.ts. Don't try to re-enable it.
- **Window size and position have different persistence timing**: Position is persisted on window close; size is persisted immediately on resize (debounced 100ms).
- **`windowStore` uses debounced batch writes**: IPC writes lag 100ms behind React state. This is intentional to avoid overwhelming the store during rapid resize events.

### Bilibili API quirks

- **Favorites endpoint uses `media_id`, not `fid`**: The playlist URL parser in `main.ts:125-131` handles both URL formats, but the API call itself must use `media_id`.
- **Bilibili CDN requires Referer header**: `webRequest.onBeforeSendHeaders` in main.ts injects `Referer: https://www.bilibili.com/` for all `*.hdslb.com`, `*.bilivideo.com`, and `*.bilibili.com` requests. Without this, CDN requests fail.

### Dev environment

- **F12 opens DevTools in dev mode only**: Registered via `globalShortcut` in main.ts. In production builds, F12 does nothing.
- **`react-draggable` is unused**: It's in `package.json` but the app implements custom drag in `FloatingPlayer.tsx`. Don't use it.

## Reference files

- **`AGENTS.md`**: Contains a similar but more concise overview of this codebase. Use it as a quick reference when you need a refresher on the main points. When in doubt, trust CLAUDE.md for detailed guidance.

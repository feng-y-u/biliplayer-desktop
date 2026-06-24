# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                     # first time
npm run gen:preload             # compile electron/preload.ts → electron/preload.cjs via esbuild
npm run dev                     # gen:preload + Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build                   # tsc && vite build + gen:preload + copy preload.cjs → dist-electron/
npx tsc --noEmit                # typecheck only (no build)
npm run test                    # vitest run (unit + feature tests)
npm run test:watch              # vitest in watch mode
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

Two Vite configs exist: `vite.config.ts` (primary, with electron + renderer plugins) and `vite.config.electron.ts` (standalone main-process-only build, not referenced from any script — likely legacy/unused).

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

- **Parallel reference file**: `AGENTS.md` contains a similar but more concise overview. When in doubt, trust CLAUDE.md for detailed guidance.

- ExpandedPanel's `currentAudio` prop uses `CurrentAudio` which is `Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>` — missing `duration`. Defined in `types/index.ts`. This is a separate type from the full `Track` interface.
- `electron-store` schema defined as a generic type param `Store<{...}>` in `electron/main.ts:21-30` — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors.
- `windowStore` uses a debounced batch writer (100ms flush window) for `store:set` calls — state updates during rapid events (e.g., window resize) are coalesced, but the 100ms delay means IPC writes lag slightly behind React state.
- The `loading` state is consumed by the add-button disabled state in ExpandedPanel but not by most other components.
- Bilibili API uses `media_id` (not `fid`) in the favorites endpoint. The playlist URL parser in `main.ts` handles both `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}` formats.
- `utils/format.ts`: `formatDuration(0)` returns `'0:00'`, negative values return `'--:--'`.
- `Track.duration` is optional (`duration?: number`) — always handle the undefined case.
- Hardware acceleration is disabled (`app.disableHardwareAcceleration()`) + GPU cache disabled — this is intentional for the always-on-top overlay window.
- Window bounds (position) are persisted to `electron-store` on close; size is persisted on resize.
- **README.md is stale** — references non-existent files (`useStorage.ts`, `usePlaylist.ts`, `design-tokens.css`) and an outdated directory layout. Trust the structure in this file instead.

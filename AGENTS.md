# AGENTS.md — 本地方案 (Bilibili Favorites Player)

Electron + React + TypeScript desktop app. Plays Bilibili favorites as a persistent always-on-top floating window. B站收藏夹播放器。

## Commands

```bash
npm install          # first time
npm run dev          # gen:preload + vite-plugin-electron (hot-reloads main + renderer)
npm run build        # tsc && vite build && gen:preload + copy preload → dist-electron/
npx tsc --noEmit     # typecheck only (no build)
npm run test         # vitest run (unit + feature tests)
npm run test:watch   # vitest in watch mode
npm run preview      # serve built dist locally
node dev.mjs         # manual dev launcher (fallback if vite-plugin-electron misbehaves)
npm run pack         # build + electron-builder --dir (unpacked output)
npm run dist         # build + electron-builder (installer)
```

`gen:preload` compiles `electron/preload.ts` → `electron/preload.cjs` via esbuild. Runs automatically as part of `dev` and `build`.

Pre-commit hook runs `npx lint-staged` which typechecks staged `*.{ts,tsx}` files (see `lint-staged.config.js`).

## Architecture

Two-process Electron app with strict context isolation:

- **Main process** (`electron/main.ts`): window creation, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence
- **Preload** (`electron/preload.ts` / `preload.cjs`): exposes `window.electronAPI` with methods for API calls, store, and window control. **Both files must be edited in sync** — `.ts` is the typechecked source, `.cjs` is the runtime CJS variant (copied to `dist-electron/preload.js` during build/dev).
- **Renderer** (`src/`): React app, all API calls go through IPC → main process

Key: renderer never calls `fetch` directly. All Bilibili requests are proxied through main process IPC.

## IPC contract

`electron/main.ts:189` handles `api` channel. Message types:
- `GET_VIDEO_INFO` → `{ bvid }` → video metadata
- `GET_PLAYLIST` → `{ url }` → parses Bilibili favlist URL, returns tracks
- `GET_AUDIO_URL` → `{ bvid, cid }` → streaming audio URL with 10-min expiry

Store channel: `store:get` / `store:set` for `electron-store`.

Window control channels: `window:move` (send), `window:resize` (invoke), `window:getPosition` (invoke), `window:setMinimumSize` (invoke).

## Directory layout

```
electron/
  main.ts         # window management, Bilibili API proxy, IPC handlers
  preload.ts      # contextBridge (exposes electronAPI to renderer)
  preload.cjs     # CJS variant used at runtime (copied to dist-electron/)
src/
  App.tsx         # root component, wires stores + hooks into FloatingPlayer (~120 lines)
  main.tsx        # React entry
  types/index.ts  # Track, PlayMode, PlayerState, FavoriteFolder, CurrentAudio, etc.
  services/api.ts # renderer-side IPC wrappers + global HTMLAudioElement singleton
  stores/
    playlistStore.ts   # zustand: tracks, currentIndex, playMode, loading + CRUD
    favoritesStore.ts  # zustand: FavoriteFolder[] + CRUD
    recentStore.ts     # zustand: recentTracks (max 50)
    windowStore.ts     # zustand: windowPosition, windowSize, volume (debounced batch IPC writes)
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" or "--:--"
    track.ts      # isSameTrack(), isTrackFavorited()
  hooks/
    useAudioPlayer.ts       # HTMLAudioElement lifecycle via event listeners + URL refresh
    usePlayerController.ts  # playlist CRUD + player 导航 (next/prev/play/delete/reorder/input)
    useFavoriteActions.ts   # favorite CRUD (create/toggle/add/remove/delete/reorder)
    useDragReorder.ts       # shared drag-and-drop reorder logic
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb (64px) + mouse drag + expanded toggle + resize handles
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input)
    Playlist.tsx        # track list with reorder, delete, active highlight
    FavoritesTab.tsx    # favorites grid (folder cards)
    RecentTab.tsx       # recently played tracks list
    ModeIcon.tsx        # play mode SVG icons
    Icons.tsx           # PlayPauseIcon, NextIcon
  styles/
    tokens.css          # design tokens: --bg, --surface, --fg, --accent, --border, --radius, --shadow
    global.css          # base reset
lint-staged.config.js  # runs `tsc --noEmit --pretty` on staged *.{ts,tsx}
dev.mjs                # manual dev launcher (alternative to vite-plugin-electron)
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **CSS**: `tokens.css` with CSS custom properties (`--bg`, `--surface`, `--fg`, `--accent`, `--border`, `--radius`, `--shadow`, etc.); always use these tokens — never hardcode colors/spacing. Component styles in companion `.css` files (e.g. `FloatingPlayer.css`, `panel.css`). No CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **Window**: frameless, transparent, always-on-top. Uses custom mouse event handling in `FloatingPlayer.tsx` for drag (calls `window.electronAPI.windowMove()`). Expanded panel has three resize handles: east (e), south (s), and southeast (se) edges — drag events update both window size and persisted `windowSize` state
- **Git hooks**: husky + lint-staged runs `tsc --noEmit` on staged `*.{ts,tsx}` files
- **Constants**: extract magic numbers as named constants at module top (e.g. `THUMB_WIDTH`, `DEFAULT_VOLUME`, `BATCH_FLUSH_DELAY_MS`)
- **Shared logic**: extract reusable UI patterns to hooks (e.g. `useDragReorder`)

## State management

Four zustand stores in `src/stores/`, each persists to `electron-store` via IPC:

| Store | Key(s) persisted | IPC write strategy |
|---|---|---|
| `playlistStore` | `playlist`, `playMode` | Immediate per-action |
| `favoritesStore` | `favorites` | Immediate per-action |
| `recentStore` | `recentTracks` | Immediate per-action |
| `windowStore` | `windowPosition`, `windowSize`, `volume` | Debounced batch (100ms flush) |

`App.tsx` reads all persisted state on mount via IPC and hydrates the stores.

## CI

GitHub Actions runs on push/PR to `main`: `npm ci` → `tsc --noEmit` → `npm run build`. Note: CI does **not** run `npm run test`.

## Tests

Four test files:
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `electron/__tests__/features.test.ts`

Tests use vitest. Config in `vitest.config.ts`. Run with `npm run test` or `npm run test:watch`.

## Gotchas

- Audio URLs from Bilibili expire ~10 min. `useAudioPlayer.ts` refreshes every 60s while playing; `api.ts` proactively skips re-fetch if current URL is >60s from expiry.
- `electron-store` schema defined as a generic type param in `electron/main.ts:21-30` — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors.
- ExpandedPanel's `currentAudio` prop uses `CurrentAudio` which is `Pick<Track, 'bvid' | 'cid' | 'title' | 'author' | 'cover'>` — missing `duration`. Defined in `types/index.ts:46`.
- Bilibili CDN requests inject `Referer: https://www.bilibili.com/` via `webRequest.onBeforeSendHeaders` in main process.
- Bilibili API uses `media_id` (not `fid`) in the favorites endpoint. The playlist URL parser in `main.ts:125-131` handles both `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}` formats.
- Module-level singletons in `api.ts` (`audioEl`, URL cache) hold implicit state — be aware when touching playback logic.
- `utils/format.ts`: `formatDuration(0)` returns `'0:00'`, negative values return `'--:--'`.
- `react-draggable` is listed in `package.json` dependencies but is **unused** — the app uses custom drag handling via `FloatingPlayer.tsx`.
- **README.md is stale** — references non-existent files (`useStorage.ts`, `usePlaylist.ts`, `vite.config.electron.ts`). Ignore its directory layout; trust the structure above.
- Hardware acceleration is disabled (`app.disableHardwareAcceleration()`) + GPU cache disabled — this is intentional for the always-on-top overlay window.
- F12 opens DevTools in dev mode only (registered via `globalShortcut`).
- Window bounds (position) are persisted to `electron-store` on close; size is persisted on resize.
- `Track.duration` is optional (`duration?: number`) — always handle the undefined case.

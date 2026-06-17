# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                     # first time
npm run gen:preload             # compile electron/preload.ts → electron/preload.cjs via esbuild
npm run dev                     # gen:preload + Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build                   # tsc && vite build + gen:preload + copy preload.cjs → dist-electron/
npx tsc --noEmit                # typecheck only (no build)
npm run preview                 # vite preview (serve built dist locally)
node dev.mjs                    # manual dev launcher (alternative to vite-plugin-electron)
```

Pre-commit hook runs `npx lint-staged` which typechecks staged `*.{ts,tsx}` files. No test files exist yet — `vitest` is a devDependency but no `.test.ts` files have been written.

## Architecture

Two-process Electron app with strict context isolation. Renderer never calls `fetch` directly — all Bilibili API requests go through IPC to main process.

### Process boundary

- **Main process** (`electron/main.ts`): frameless BrowserWindow, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence. IPC handler at line 170 dispatches `GET_VIDEO_INFO`, `GET_PLAYLIST`, `GET_AUDIO_URL`.
- **Preload** (`electron/preload.ts` / `preload.cjs`): `contextBridge.exposeInMainWorld('electronAPI', ...)` — exposes `api(message)`, `storeGet(key)`, `storeSet(key, value)`, window control methods. **Both files must be edited in sync** — `.ts` is the typechecked source, `.cjs` is the runtime-used CJS variant (copied to `dist-electron/preload.js` during build/dev). Changes to the bridge API must be mirrored manually in both files.
- **Renderer** (`src/`): React 18, all API calls via IPC.

### Two dev launchers

| Method | Mechanism | Use when |
|---|---|---|
| `npm run dev` | `vite-plugin-electron` handles everything | Normal development |
| `node dev.mjs` | Copies preload, starts Vite, launches Electron with `tsx` + `VITE_DEV_SERVER_URL` | Plugin misbehaves |

Two Vite configs exist: `vite.config.ts` (primary, with electron + renderer plugins) and `vite.config.electron.ts` (standalone main-process-only build, not referenced from any script — likely legacy/unused).

### Audio URL lifecycle

Bilibili audio URLs expire ~10 minutes. Two refresh mechanisms work together:
1. `useAudioPlayer.ts:65` — 60s interval calls `refreshAudioUrl()` for the current track, keeping the URL fresh proactively
2. `api.ts:58` — before playing, checks if current URL is within 5 min of expiry and clears it to force re-fetch

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
 └─ FloatingPlayer.tsx          ← thumb (48px), mouse drag, collapsed/expanded toggle
     └─ ExpandedPanel.tsx       ← full panel: controls + progress + tabs
         ├─ Playlist.tsx        ← current playlist, reorder, delete, active track highlight
         ├─ FavoritesTab.tsx    ← favorite folder grid (cards with track count)
         ├─ RecentTab.tsx       ← recently played list
         └─ ModeIcon.tsx        ← loop/single/shuffle SVG icons
```

`ExpandedPanel` manages a tab system (播放列表 / 收藏夹 / 最近播放). `FavoritesTab` shows per-folder cards and expands to show tracks within a folder. `RecentTab` shows recently played tracks and can add them back to the active playlist.

### State management

Two stores manage state with different approaches:

- **`usePlayerStore`** (`src/hooks/usePlayerStore.ts`): reads all state from `electron-store` once on mount (via IPC), then writes to store via a **debounced batch writer** (`useBatchStore`) that coalesces rapid `store:set` calls into one 100ms flush. Exposes: `tracks`, `currentIndex`, `playMode`, `volume`, `favorites`, `recentTracks`, `loading`, plus setters, `loadVideo`, `loadPlaylist`, `deleteTrack`, `reorderTracks`, and favorite CRUD methods (`addTrackToFavorite`, `removeTrackFromFavorite`, `deleteFavorite`, `reorderFavoriteTracks`).

- **`useAudioPlayer`** (`src/hooks/useAudioPlayer.ts`): manages `HTMLAudioElement` lifecycle by attaching event listeners (`timeupdate`, `play`, `pause`, `loadedmetadata`, `volumechange`, `ended`) to the global singleton. Falls back to a 200ms interval to wait for the audio element on first render. Fires `onTrackEnd` callback on the `<audio>` `ended` event. Controls: `playPause`, `playTrack`, `seek`, `volumeChange`. Runs a 60s interval to refresh the Bilibili audio URL (only while `isPlaying && currentAudio`).

### Window behavior

- `alwaysOnTop: true`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`
- Window drag implemented via custom mouse event handling in `FloatingPlayer.tsx` — captures `mousedown`/`mousemove`/`mouseup` on `window` and calls `window.electronAPI.windowMove()` on each move frame
- Collapsed state renders a small circular thumb (`48px`). Thumb can be clicked to expand; expanded panel contains full player UI.
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

**`store:get` / `store:set`**: typed against `electron-store` schema defined inline in `electron/main.ts:12-21`

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

src/
  main.tsx        # React entry
  App.tsx         # root component, wires store + audio hooks into FloatingPlayer
  types/index.ts  # Track, PlayMode, PlayerState, FavoriteFolder, ApiMessage, etc.
  services/api.ts # renderer-side IPC wrappers + global HTMLAudioElement singleton
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" or "--:--"
    track.ts      # isTrackFavorited(track, favorites)
  hooks/
    usePlayerStore.ts   # global state via IPC-backed electron-store (debounced batch writes)
    useAudioPlayer.ts   # HTMLAudioElement lifecycle via event listeners + URL refresh (only while playing)
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb + mouse drag logic + expanded toggle
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input, favorites, recent)
    Playlist.tsx        # track list with reorder, delete, active highlight
    ModeIcon.tsx        # play mode SVG icons
    FavoritesTab.tsx    # favorites grid (folder cards)
    RecentTab.tsx       # recently played tracks list
  styles/
    design-tokens.css   # flat design system (colors, typography, spacing, elevation)
    global.css          # base reset
    tokens.css          # legacy theme tokens (may be unused)
vite.config.ts          # primary Vite config (electron + react plugins)
vite.config.electron.ts # standalone main-process-only Vite config (likely unused)
dev.mjs                 # manual dev launcher
.github/workflows/ci.yml # GitHub Actions: npm ci → tsc --noEmit → npm run build
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **CSS**: `design-tokens.css` with CSS custom properties (`--bg`, `--fg`, `--accent`, `--space-*`, `--radius-*`, `--elev-*`, `--motion-*`, etc.); always use these tokens — never hardcode colors/spacing. Component styles in companion `.css` files (e.g. `FloatingPlayer.css`, `ExpandedPanel.css`); no CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **CI** (GitHub Actions): `npm ci` → `tsc --noEmit` → `npm run build` on push/PR to `main`
- **`react-draggable`** is in `package.json` dependencies but the app implements custom drag in `FloatingPlayer.tsx` — the package is unused
- **Module-level singletons**: `api.ts` holds a global `HTMLAudioElement` + Bilibili URL cache (`currentUrl`, `currentExpiresAt`). Be aware of implicit state when touching these. The `loadAudioTrack` function caches aggressively — it skips re-fetching if the current URL is >60s from expiry for the same (bvid, cid) pair.

## Gotchas

- ExpandedPanel's `currentAudio` prop (`{ bvid, cid, title, author, cover }`) is a **subset** of `Track` (no `duration`). This is a separate ad-hoc type from the `Track` interface in `types/index.ts` — not the same type, not derived from it.
- `electron-store` schema defined as a generic type param `Store<{...}>` in `electron/main.ts:12-21` — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors.
- `usePlayerStore` uses a debounced batch writer (100ms flush window) for `store:set` calls — state updates during rapid events (e.g., window resize) are coalesced, but the 100ms delay means IPC writes lag slightly behind React state.
- The `loading` state is consumed by the add-button disabled state in ExpandedPanel but not by most other components.
- Bilibili API uses `media_id` (not `fid`) in the favorites endpoint. The playlist URL parser in `main.ts:124` handles both `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}` formats.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                     # first time
npm run dev                     # Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build                   # tsc && vite build → dist/ + dist-electron/ + copies preload.cjs
npx tsc --noEmit                # typecheck only (no build)
npm run preview                 # vite preview (serve built dist locally)
node dev.mjs                    # manual dev launcher (alternative to vite-plugin-electron)
```

Pre-commit hook runs `npx lint-staged` which typechecks staged `*.{ts,tsx}` files. No test files exist yet — `vitest` is a devDependency but no `.test.ts` files have been written.

## Architecture

Two-process Electron app with strict context isolation. Renderer never calls `fetch` directly — all Bilibili API requests go through IPC to main process.

### Process boundary

- **Main process** (`electron/main.ts`): frameless BrowserWindow, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence. IPC handler at line 170 dispatches `GET_VIDEO_INFO`, `GET_PLAYLIST`, `GET_AUDIO_URL`.
- **Preload** (`electron/preload.ts` / `preload.cjs`): `contextBridge.exposeInMainWorld('electronAPI', ...)` — exposes `api(message)`, `storeGet(key)`, `storeSet(key, value)`, and window control methods (`windowMove`, `windowResize`, `windowGetPosition`). Only `preload.cjs` is used at runtime (copied to `dist-electron/preload.js` during build/dev). The `.ts` file is the typechecked source; `.cjs` is a manually-synced CJS copy.
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

### State management

`usePlayerStore` reads all state from `electron-store` once on mount (via IPC), then writes to store on **every** state change via individual `useCallback` wrappers. No batching — every `setVolume`, `setPlayMode`, etc. triggers a separate IPC write. This is a known performance limitation.

`useAudioPlayer` polls `HTMLAudioElement` state at 500ms intervals via `setInterval` and fires `onTrackEnd` on the `<audio>` `ended` event.

### Window behavior

- `alwaysOnTop: true`, `frame: false`, `transparent: true`, `backgroundColor: '#00000000'`
- Window drag implemented via custom mouse event handling in `FloatingPlayer.tsx` — captures `mousedown`/`mousemove`/`mouseup` on `window` and calls `window.electronAPI.windowMove()` on each move frame
- Collapsed state renders a small circular thumb (`48px`). Thumb can be clicked to expand; expanded panel contains full player UI.
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
  hooks/
    usePlayerStore.ts   # global state via IPC-backed electron-store
    useAudioPlayer.ts   # HTMLAudioElement lifecycle via setInterval polling (500ms)
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
- **CSS**: `design-tokens.css` with CSS custom properties; component styles in companion `.css` files (e.g. `FloatingPlayer.css`, `ExpandedPanel.css`); no CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **CI** (GitHub Actions): `npm ci` → `tsc --noEmit` → `npm run build` on push/PR to `main`
- **`react-draggable`** is in `package.json` dependencies but the app implements custom drag in `FloatingPlayer.tsx` — the package is unused

## Gotchas

- ExpandedPanel's `currentAudio` prop (`{ bvid, cid, title, author, cover }`) is a **subset** of `Track` (no `duration`). This is a separate ad-hoc type from the `Track` interface in `types/index.ts` — not the same type, not derived from it.
- `electron-store` schema defined as a generic type param `Store<{...}>` in `electron/main.ts:12-21` — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors.
- `usePlayerStore` reads/writes all state via IPC on every change with **no batching** — writing state frequently (e.g., window position during drag) generates many IPC calls.
- Audio URL refresh (60s interval in `useAudioPlayer.ts:65`) still fires even when paused. It refreshes the URL silently but won't restart playback.
- Bilibili API uses `media_id` (not `fid`) in the favorites endpoint. The playlist URL parser in `main.ts:124` handles both `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}` formats.
- The `loading` state from `usePlayerStore` is exposed but never consumed by any component.

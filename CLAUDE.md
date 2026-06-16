# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                     # first time
npm run dev                     # Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build                   # tsc && vite build → dist/ + dist-electron/ + copies preload.cjs
npx tsc --noEmit                # typecheck only (no build)
npm run preview                 # vite preview (serve built dist locally)
```

Pre-commit hook (`husky` + `lint-staged`) runs `tsc --noEmit` on staged `*.{ts,tsx}` files.

**No test files exist yet.** `vitest` is a devDependency but no `.test.ts` files have been written.

## Architecture

Two-process Electron app with strict context isolation. Renderer never calls `fetch` directly — all Bilibili API requests go through IPC to main process.

- **Main process** (`electron/main.ts`): frameless `BrowserWindow`, Bilibili API proxy (server-side `fetch`, no CORS), `electron-store` persistence
- **Preload** (`electron/preload.ts` / `preload.cjs`): `contextBridge.exposeInMainWorld('electronAPI', ...)` — exposes `api()`, `storeGet()`, `storeSet()`
- **Renderer** (`src/`): React 18, all API calls via IPC

### Two dev launchers

- **`npm run dev`** — uses `vite-plugin-electron` which handles preload copying and Electron startup automatically (hot-reloads main process)
- **`node dev.mjs`** — manual alternative: copies `preload.cjs` → `dist-electron/preload.js`, starts Vite, then launches Electron via `tsx` with `VITE_DEV_SERVER_URL=http://localhost:5173`. Useful when the plugin behaves unexpectedly.

### IPC contract (`electron/main.ts:170`)

`api` channel message types:
- `GET_VIDEO_INFO` → `{ bvid }` → video metadata (title, cid, author, cover)
- `GET_PLAYLIST` → `{ url }` → parses Bilibili favlist URL, returns paginated tracks
- `GET_AUDIO_URL` → `{ bvid, cid }` → streaming audio URL (~10 min expiry)

Store channels: `store:get` / `store:set` for `electron-store` (volume, playlist, playMode, favorites, recentTracks, windowPosition).

### State management pattern

`usePlayerStore` reads all state from `electron-store` once on mount (via IPC), then writes to store on every state change via individual useEffect-free callbacks. **No batching** — every `setVolume`, `setPlayMode`, etc. triggers a separate IPC write. This is a known performance limitation.

### Audio URL lifecycle

Bilibili audio URLs expire ~10 minutes. Two refresh mechanisms work together:
1. `useAudioPlayer.ts:64` — 60s interval calls `refreshAudioUrl()` for the current track, keeping the URL fresh proactively
2. `api.ts:58` — before playing, checks if current URL is within 5 min of expiry and clears it to force re-fetch

### Window behavior

- `alwaysOnTop: true`, `frame: false`, `transparent: true`
- Renderer uses `-webkit-app-region: drag` for custom title bar (with `[data-no-drag]` opt-out for interactive elements)
- Drag snaps the window to the **right edge** of the screen on mouse-up
- Window bounds persisted to `electron-store` on close
- Hardware acceleration disabled (`app.disableHardwareAcceleration()`)
- Bilibili CDN requests (`*.hdslb.com`, `*.bilivideo.com`) inject `Referer` header via `webRequest.onBeforeSendHeaders`

### Directory layout

```
electron/
  main.ts         # window management, Bilibili API proxy, IPC handlers
  preload.ts      # contextBridge (exposes electronAPI to renderer)
  preload.cjs     # CJS variant used by dev.mjs script (identical API)
src/
  main.tsx        # React entry
  App.tsx         # root component, wires store + audio hooks into FloatingPlayer
  types/index.ts  # Track, PlayMode, PlayerState, FavoriteFolder, etc.
  services/api.ts # renderer-side IPC wrappers + global HTMLAudioElement player
  hooks/
    usePlayerStore.ts   # global state via IPC-backed electron-store
    useAudioPlayer.ts   # HTMLAudioElement lifecycle via setInterval polling (500ms)
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb + mouse drag logic (snap-to-right) + expanded toggle
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input, favorites, recent)
    Playlist.tsx        # track list with reorder, delete, active highlight
    ModeIcon.tsx        # play mode SVG icons
  styles/
    design-tokens.css   # flat design system (colors, typography, spacing, elevation)
    global.css          # base reset
    tokens.css          # legacy theme tokens
dev.mjs                 # manual dev launcher (alternative to vite-plugin-electron)
.github/workflows/ci.yml
.husky/pre-commit
AGENTS.md               # AI agent guidance (subset of this file for agent context)
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **CSS**: `design-tokens.css` with CSS custom properties; component styles in plain `.css` files (e.g. `FloatingPlayer.css`, `ExpandedPanel.css`); no CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)

## Gotchas

- Bilibili audio URLs expire ~10 min. `useAudioPlayer.ts:64` auto-refreshes every 60s; `api.ts:58` proactively refreshes 5 min before expiry
- `usePlayerStore` reads/writes all state via IPC on every change — no batching (every setX triggers individual `store:set` IPC)
- `electron-store` schema defined in `electron/main.ts:12-21` (generic type param `Store<{...}>`) — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors
- `noUncheckedIndexedAccess` means array/object indexing returns `T \| undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- `dev.mjs` is a manual dev launcher (copies preload, starts Vite, then Electron with tsx); `npm run dev` uses `vite-plugin-electron` instead. Results should be identical
- `preload.cjs` is a CommonJS copy of `preload.ts` — both expose the same API. Only `preload.cjs` is used at runtime (copied to `dist-electron/preload.js` during build/dev)
- CI (`GitHub Actions`) runs `npm ci` → `tsc --noEmit` → `npm run build` on push/PR to `main`

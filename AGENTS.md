# AGENTS.md — 本地方案 (Bilibili Favorites Player)

Electron + React + TypeScript desktop app. Plays Bilibili favorites as a persistent always-on-top floating window. B站收藏夹播放器。

## Commands

```bash
npm install          # first time
npm run dev          # Vite dev server + Electron (vite-plugin-electron hot-reloads main)
npm run build        # tsc && vite build → dist/ + dist-electron/ + copies preload.cjs
npx tsc --noEmit     # typecheck only (no build)
```

No test script. `vitest` is in devDependencies but no test files exist yet.

## Architecture

Two-process Electron app with strict context isolation:

- **Main process** (`electron/main.ts`): window creation, Bilibili API proxy (fetch, no CORS), electron-store persistence
- **Preload** (`electron/preload.ts`): exposes `window.electronAPI` with 3 methods: `api()`, `storeGet()`, `storeSet()`
- **Renderer** (`src/`): React app, all API calls go through IPC → main process

Key: renderer never calls `fetch` directly. All Bilibili requests are proxied through main process IPC.

## IPC contract

`electron/main.ts:170` handles `api` channel. Message types:
- `GET_VIDEO_INFO` → `{ bvid }` → video metadata
- `GET_PLAYLIST` → `{ url }` → parses Bilibili favlist URL, returns tracks
- `GET_AUDIO_URL` → `{ bvid, cid }` → streaming audio URL with expiry

Store channel: `store:get` / `store:set` for `electron-store`.

## Directory layout

```
electron/
  main.ts         # window management, Bilibili API proxy, IPC handlers
  preload.ts      # contextBridge (exposes electronAPI to renderer)
  preload.cjs     # CJS variant used by dev.mjs script
src/
  App.tsx         # root component, wires store + audio hooks into FloatingPlayer
  main.tsx        # React entry
  types/index.ts  # Track, PlayMode, PlayerState, FavoriteFolder, etc.
  services/api.ts # renderer-side IPC wrappers + HTMLAudioElement player
  hooks/
    usePlayerStore.ts   # global state via IPC-backed electron-store
    useAudioPlayer.ts   # HTMLAudioElement lifecycle, polling, auto-refresh
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb + drag logic + expanded panel toggle
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input)
    Playlist.tsx        # track list with reorder, delete, active highlight
    ModeIcon.tsx        # play mode SVG icons
  styles/
    design-tokens.css   # flat design system (colors, typography, spacing, elevation)
    global.css          # base reset
    tokens.css          # legacy theme tokens
dev.mjs                 # manual dev launcher (copies preload, starts Vite + Electron via tsx)
.github/workflows/ci.yml
.husky/pre-commit       # runs lint-staged on commit
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (configured in tsconfig + vite.config.ts)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **CSS**: `design-tokens.css` with CSS custom properties; no CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **Window**: frameless, transparent, always-on-top. Uses `-webkit-app-region: drag` for custom title bar
- **Git hooks**: husky + lint-staged runs typecheck on staged `*.{ts,tsx}` files

## CI

GitHub Actions runs on push/PR to `main`: `npm ci` → `tsc --noEmit` → `npm run build`.

## Gotchas

- Audio URLs from Bilibili expire ~10 min. `useAudioPlayer.ts:64` auto-refreshes every 60s; `api.ts:58` proactively refreshes 5 min before expiry.
- `usePlayerStore` reads/writes all state via IPC on every change — no batching.
- `electron-store` schema defined in `electron/main.ts:12-21` (generic type param) — mismatch between type and actual usage can cause runtime errors.
- `noUncheckedIndexedAccess` means array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures).
- `dev.mjs` is a manual dev launcher (copies preload, starts Vite, then Electron with tsx); `npm run dev` uses `vite-plugin-electron` instead.

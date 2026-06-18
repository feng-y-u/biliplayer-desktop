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
```

`gen:preload` compiles `electron/preload.ts` → `electron/preload.cjs` via esbuild. Runs automatically as part of `dev` and `build`.

Pre-commit hook runs `npx lint-staged` which typechecks staged `*.{ts,tsx}`.

## Architecture

Two-process Electron app with strict context isolation:

- **Main process** (`electron/main.ts`): window creation, Bilibili API proxy (main-process `fetch`, no CORS), `electron-store` persistence
- **Preload** (`electron/preload.ts` / `preload.cjs`): exposes `window.electronAPI` with methods for API calls, store, and window control. **Both files must be edited in sync** — `.ts` is the typechecked source, `.cjs` is the runtime CJS variant (copied to `dist-electron/preload.js` during build/dev).
- **Renderer** (`src/`): React app, all API calls go through IPC → main process

Key: renderer never calls `fetch` directly. All Bilibili requests are proxied through main process IPC.

## IPC contract

`electron/main.ts:169` handles `api` channel. Message types:
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
  App.tsx         # root component, wires store + audio hooks into FloatingPlayer
  main.tsx        # React entry
  types/index.ts  # Track, PlayMode, PlayerState, FavoriteFolder, etc.
  services/api.ts # renderer-side IPC wrappers + global HTMLAudioElement singleton
  utils/
    format.ts     # formatDuration(seconds) → "m:ss" or "--:--"
    track.ts      # isTrackFavorited(track, favorites)
  hooks/
    usePlayerStore.ts   # global state via IPC-backed electron-store (debounced batch writes)
    useAudioPlayer.ts   # HTMLAudioElement lifecycle via event listeners + URL refresh
    useDragReorder.ts   # shared drag-and-drop reorder logic
  components/floating-player/
    FloatingPlayer.tsx  # collapsed thumb (48px) + mouse drag + expanded toggle
    ExpandedPanel.tsx   # full player UI (controls, progress, tabs, input)
    Playlist.tsx        # track list with reorder, delete, active highlight
    FavoritesTab.tsx    # favorites grid (folder cards)
    RecentTab.tsx       # recently played tracks list
    ModeIcon.tsx        # play mode SVG icons
  styles/
    tokens.css          # design tokens: --bg, --surface, --fg, --accent, --border, --radius, --shadow
    global.css          # base reset
```

## Conventions

- **Path alias**: `@/*` → `./src/*` (tsconfig + vite both configured)
- **TypeScript strict**: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess` all enabled
- **CSS**: `tokens.css` with CSS custom properties (`--bg`, `--surface`, `--fg`, `--accent`, `--border`, `--radius`, `--shadow`, etc.); always use these tokens — never hardcode colors/spacing. Component styles in companion `.css` files (e.g. `FloatingPlayer.css`, `panel.css`). No CSS-in-JS, no CSS modules
- **Language**: UI strings and comments are Chinese (zh-CN)
- **noUncheckedIndexedAccess**: array/object indexing returns `T | undefined`; use `!` assertions when you know the value exists (e.g., regex captures, known-length arrays)
- **Window**: frameless, transparent, always-on-top. Uses custom mouse event handling in `FloatingPlayer.tsx` for drag (calls `window.electronAPI.windowMove()`)
- **Git hooks**: husky + lint-staged runs `tsc --noEmit` on staged `*.{ts,tsx}` files
- **Constants**: extract magic numbers as named constants at module top (e.g. `THUMB_WIDTH`, `DEFAULT_VOLUME`, `BATCH_FLUSH_DELAY_MS`)
- **Shared logic**: extract reusable UI patterns to hooks (e.g. `useDragReorder`)

## CI

GitHub Actions runs on push/PR to `main`: `npm ci` → `tsc --noEmit` → `npm run build`. Note: CI does **not** run `npm run test`.

## Tests

Three test files exist:
- `src/utils/__tests__/format.test.ts`
- `src/utils/__tests__/track.test.ts`
- `src/components/floating-player/__tests__/ModeIcon.test.ts`
- `electron/__tests__/features.test.ts`

Tests use vitest. Run with `npm run test` or `npm run test:watch`.

## Gotchas

- Audio URLs from Bilibili expire ~10 min. `useAudioPlayer.ts` refreshes every 60s while playing; `api.ts` proactively skips re-fetch if current URL is >60s from expiry.
- `usePlayerStore` reads all state from `electron-store` once on mount (via IPC), then writes via a **debounced batch writer** (`useBatchStore`, 100ms flush window) — rapid state updates are coalesced into one IPC flush.
- `electron-store` schema defined as a generic type param in `electron/main.ts:13-22` — the schema types are never shared with the renderer, so type vs. actual usage mismatches cause silent runtime errors.
- ExpandedPanel's `currentAudio` prop (`{ bvid, cid, title, author, cover }`) is a **subset** of `Track` (no `duration`). This is a separate ad-hoc type from the `Track` interface in `types/index.ts`.
- Bilibili CDN requests inject `Referer: https://www.bilibili.com/` via `webRequest.onBeforeSendHeaders` in main process.
- Bilibili API uses `media_id` (not `fid`) in the favorites endpoint. The playlist URL parser in `main.ts:121-127` handles both `medialist/play/dlista/{seasonId}/{mid}` and `space.bilibili.com/{mid}/favlist?fid={seasonId}` formats.
- Module-level singletons in `api.ts` (`audioEl`, URL cache) hold implicit state — be aware when touching playback logic.
- `utils/format.ts` has a known bug: `formatDuration(0)` returns `'--:--'` instead of `'0:00'` due to falsy check. Tests document this as expected behavior.
- `react-draggable` is listed in `package.json` dependencies but is **unused** — the app uses custom drag handling via `useDragReorder.ts` and `FloatingPlayer.tsx`.
- **README.md is stale** — references non-existent files (`useStorage.ts`, `usePlaylist.ts`, `vite.config.electron.ts`). Ignore its directory layout; trust the structure above.

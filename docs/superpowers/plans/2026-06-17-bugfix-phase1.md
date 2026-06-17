# Bug Fix Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 known bugs in the Bilibili desktop player: off-by-one in favorite playback, unused `isPlaying` prop, missing `loading` state UI, duplicate window-size persistence, and unresettable minimum window size.

**Architecture:** All fixes are localized. One new extracted function (`addTrackToPlaylistAndPlay`) in `App.tsx`; the rest are prop threading, CSS, or IPC-side removals. No new files, no refactors.

**Tech Stack:** React 18, TypeScript, Electron 33, electron-store

---

### Task 1: Extract `addTrackToPlaylistAndPlay` + fix index bug

**Files:**
- Modify: `src/App.tsx:123-137`

**Problem:** `handlePlayFromFavorite` calls `store.setTracks(...)` then reads `store.tracks.length` on the next line. React state updates are async, so `store.tracks.length` is still the old value — wrong index.

- [ ] **Step 1: Extract reusable function**

Insert `addTrackToPlaylistAndPlay` after `handlePlayPause` (line 40). Read `store.tracks.length` **before** calling `setTracks`:

```ts
const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
  const newIndex = store.tracks.length; // capture BEFORE setTracks
  store.setTracks([...store.tracks, track]);
  store.setCurrentIndex(newIndex);
  await playTrack(track);
  const filtered = store.recentTracks.filter(t => !(t.bvid === track.bvid && t.cid === track.cid));
  store.setRecentTracks([track, ...filtered].slice(0, 50));
}, [store, playTrack]);
```

- [ ] **Step 2: Simplify `handlePlayFromFavorite`**

Replace the entire `handlePlayFromFavorite` (lines 123-137) with:

```ts
const handlePlayFromFavorite = useCallback(async (track: Track) => {
  const plIndex = store.tracks.findIndex(t => t.bvid === track.bvid && t.cid === track.cid);
  if (plIndex >= 0) {
    await handlePlayTrack(plIndex);
  } else {
    await addTrackToPlaylistAndPlay(track);
  }
}, [store.tracks, handlePlayTrack, addTrackToPlaylistAndPlay]);
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "fix: extract addTrackToPlaylistAndPlay, fix stale tracks.length bug in handlePlayFromFavorite"
```

---

### Task 2: Use `isPlaying` prop in Playlist (show ▶/▎▎ icon)

**Files:**
- Modify: `src/components/floating-player/Playlist.tsx:52`
- Modify: `src/components/floating-player/Playlist.css`

- [ ] **Step 1: Update Playlist to show play-state icon**

Replace line 52 (`<span className="pl-idx">...</span>`) with logic that checks both `isActive` and `isPlaying`:

```tsx
<span className="pl-idx">
  {isActive ? (
    <span className={`pl-status-icon${isPlaying ? ' playing' : ''}`}>
      {isPlaying ? '▶' : '▎▎'}
    </span>
  ) : (
    String(index + 1).padStart(2, '0')
  )}
</span>
```

Also destructure `isPlaying` from props (add it after `currentIndex`):

```tsx
export default function Playlist({
  tracks,
  currentIndex,
  isPlaying,
  ...
```

- [ ] **Step 2: Add CSS for the status icon**

Append to `Playlist.css`:

```css
.pl-status-icon {
  display: inline-block;
  font-size: 10px;
  line-height: 1;
}
.pl-status-icon.playing {
  animation: pl-bounce 0.6s ease-in-out infinite alternate;
}
@keyframes pl-bounce {
  from { transform: scale(1); }
  to { transform: scale(1.25); }
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/floating-player/Playlist.tsx src/components/floating-player/Playlist.css
git commit -m "fix: use isPlaying prop to show ▶/▎▎ play-state icon in Playlist"
```

---

### Task 3: Thread `loading` prop to show UI feedback

**Files:**
- Modify: `src/components/floating-player/FloatingPlayer.tsx` (add prop + pass through)
- Modify: `src/components/floating-player/ExpandedPanel.tsx` (receive + use)
- Modify: `src/App.tsx` (pass `store.loading`)

- [ ] **Step 1: Add `loading` to FloatingPlayerProps + pass to ExpandedPanel**

In `FloatingPlayer.tsx`, add `loading` to the interface (alphabetically after `isPlaying`-like props):

```tsx
interface FloatingPlayerProps {
  // ... existing props ...
  onInputSubmit: (input: string) => void;
  loading: boolean;
  onCreateFavorite: (name: string) => void;
  // ... rest ...
```

Destructure it:

```tsx
  onInputSubmit: _onInputSubmit,
  loading,
  onCreateFavorite,
```

Pass to ExpandedPanel (after `onInputSubmit`):

```tsx
          onInputSubmit={_onInputSubmit}
          loading={loading}
          onCreateFavorite={onCreateFavorite}
```

- [ ] **Step 2: Add `loading` to ExpandedPanelProps + use in button**

In `ExpandedPanel.tsx`, add to interface:

```tsx
  onInputSubmit: (input: string) => void;
  loading: boolean;
  onCreateFavorite: (name: string) => void;
```

Destructure:

```tsx
  onInputSubmit,
  loading,
  onCreateFavorite,
```

Replace the submit button (line 190-192):

```tsx
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? '加载中…' : '添加'}
        </button>
```

- [ ] **Step 3: Pass `store.loading` from App.tsx**

In `App.tsx`, add to FloatingPlayer props:

```tsx
      onInputSubmit={handleInputSubmit}
      loading={store.loading}
      onCreateFavorite={handleCreateFavorite}
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/floating-player/FloatingPlayer.tsx src/components/floating-player/ExpandedPanel.tsx
git commit -m "fix: thread loading prop and show disabled state on add button"
```

---

### Task 4: Stop writing duplicate `windowBounds` in electron-store

**Files:**
- Modify: `electron/main.ts:87-91`

- [ ] **Step 1: Change the close handler to only save position**

Replace lines 87-91:

```ts
  mainWindow.on('close', () => {
    if (mainWindow) {
      const pos = mainWindow.getPosition();
      store.set('windowPosition', { left: pos[0], top: pos[1] });
    }
  });
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add electron/main.ts
git commit -m "fix: stop writing duplicate windowBounds on close, use windowPosition only"
```

---

### Task 5: Reset minimum window size on collapse

**Files:**
- Modify: `src/components/floating-player/FloatingPlayer.tsx:229-231`

- [ ] **Step 1: Reset minimum size when collapsing**

The collapsed-state effect (line 84-94) already runs when `collapsedState` changes. Add a branch to reset minimum size when collapsing:

```tsx
  // Resize window: expanded vs collapsed
  useEffect(() => {
    if (isFirstRender.current) return;
    const api = window.electronAPI;
    if (collapsedState === 'expanded') {
      api.windowResize(storage.windowSize.width, storage.windowSize.height);
      api.windowSetMinimumSize(EXPANDED_MIN_W, EXPANDED_MIN_H);
    } else {
      api.windowResize(COLLAPSED_W, COLLAPSED_H);
      api.windowSetMinimumSize(1, 1); // remove minimum size constraint
    }
  }, [collapsedState, storage.windowSize.width, storage.windowSize.height]);
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/floating-player/FloatingPlayer.tsx
git commit -m "fix: reset minimum window size when panel collapses"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Fix `handlePlayFromFavorite` stale-length bug | Task 1 |
| `isPlaying` prop used in Playlist | Task 2 |
| `loading` state surfaced in UI | Task 3 |
| Remove duplicate `windowBounds` write | Task 4 |
| Reset minimum size on collapse | Task 5 |

All spec sections covered.

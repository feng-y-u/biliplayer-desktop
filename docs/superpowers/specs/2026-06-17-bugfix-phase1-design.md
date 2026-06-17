# Bug 修复 Phase 1

修复当前代码库中 5 个明确的 bug，全部集中在数据流、UI 状态和窗口管理上。不引入新功能，不改架构。

---

## 1. 收藏夹播放索引偏移 (Bug)

**问题**：`App.tsx` 的 `handlePlayFromFavorite` 中：

```ts
store.setTracks([...store.tracks, track]);
const newIndex = store.tracks.length;  // ← React 批处理，此时 length 还是旧值
```

`setTracks` 是异步状态更新，下一行的 `store.tracks.length` 读到的是更新前的长度，导致 `currentIndex` 指向旧数组的末尾（越界），或覆盖已存在的最后一首。

**修复**：提取 `addTrackToPlaylistAndPlay` 函数，在 `setTracks` 之前读取长度：

```ts
const addTrackToPlaylistAndPlay = useCallback(async (track: Track) => {
  const newIndex = store.tracks.length;  // 先取值
  store.setTracks([...store.tracks, track]);
  store.setCurrentIndex(newIndex);
  await playTrack(track);
  // 更新最近播放（与 handlePlayTrack 逻辑相同）
  const filtered = store.recentTracks.filter(
    t => !(t.bvid === track.bvid && t.cid === track.cid)
  );
  store.setRecentTracks([track, ...filtered].slice(0, 50));
}, [store, playTrack]);
```

`handlePlayFromFavorite` 简化为复用 `handlePlayTrack` + `addTrackToPlaylistAndPlay`。

**涉及文件**：`src/App.tsx`

---

## 2. `isPlaying` prop 未使用

**问题**：`Playlist` 组件接收 `isPlaying` prop，但从未使用。当前播放中的歌曲只靠 `.active` 类高亮文字颜色，无法区分"正在播放"和"已选但暂停"。

**修复**：
- 在 Playlist 中，当 `isActive && isPlaying` 时，序号位置显示一个跳动的 ▶ 图标
- 当 `isActive && !isPlaying` 时（暂停），显示 ▎▎ 图标
- 否则显示正常数字
- Playlist.tsx 内部处理，不涉及其他文件
- CSS 加简单跳动关键帧动画

**涉及文件**：`src/components/floating-player/Playlist.tsx`、`Playlist.css`

---

## 3. `loading` 状态未消费

**问题**：`usePlayerStore` 暴露了 `loading`，`loadVideo`/`loadPlaylist` 中使用，但没有组件读它——用户添加 BV 号或链接时看不到加载反馈。

**修复**：
- `App.tsx` 将 `store.loading` 作为 prop 传入 `FloatingPlayer` → `ExpandedPanel`
- `ExpandedPanel` 在输入框按钮上：loading 时按钮文字改为"加载中…"且禁用，恢复正常后恢复
- 最小化改动：只涉及 prop 透传和按钮状态

**涉及文件**：`src/App.tsx`、`src/components/floating-player/FloatingPlayer.tsx`、`src/components/floating-player/ExpandedPanel.tsx`

---

## 4. `windowBounds` / `windowSize` 重叠

**问题**：`electron-store` schema 有 `windowBounds`（on close 写入的完整窗口位置尺寸）和 `windowSize`（新加的 renderer 侧尺寸），存了重叠数据。

**修复**：
- `electron/main.ts` 的 `on('close')` handler 改为只存位置到 `windowPosition`（通过 `getPosition()` 只取 `{x, y}`），不再存 `windowBounds`
- `electron-store` schema 保留 `windowSize` 作为尺寸的唯一来源
- `windowBounds` schema 条目保留（已有使用，移除可能导致已有用户数据异常），但不再写入

**涉及文件**：`electron/main.ts`

---

## 5. 收起后窗口最小尺寸未重置

**问题**：展开时调用了 `windowSetMinimumSize(320, 480)`，但收起后窗口回到 200×72，而最小尺寸限制仍为 320×480——窗口管理器不允许缩到这么小。

**修复**：
- 在 FloatingPlayer 的 `handleClose` 和 `collapsedState` 变为 `'collapsed'` 时，调用 `windowSetMinimumSize(1, 1)` 取消限制

**涉及文件**：`src/components/floating-player/FloatingPlayer.tsx`

---

## 文件改动汇总

| 文件 | 改动 |
|---|---|
| `src/App.tsx` | 提取 `addTrackToPlaylistAndPlay`；简化 `handlePlayFromFavorite`；透传 `loading` |
| `src/components/floating-player/FloatingPlayer.tsx` | 透传 `loading`；收起时重置最小尺寸 |
| `src/components/floating-player/ExpandedPanel.tsx` | 接收 `loading` prop；按钮显示加载状态 |
| `src/components/floating-player/Playlist.tsx` | 使用 `isPlaying` 显示播放/暂停图标 |
| `src/components/floating-player/Playlist.css` | ▶ 跳动动画 |
| `electron/main.ts` | on close 不再写入 `windowBounds` |

没有新增文件。所有改动都是局部修复。

# 代码库分析报告

## 一、程序执行路径

### 启动链路

```
index.html
  └─ src/main.tsx                    # React 入口，挂载 <App />
       └─ src/App.tsx                # 根组件，组合所有逻辑
            ├─ usePlayerStore()      # 从 electron-store 读取所有状态
            ├─ useAudioPlayer()      # 绑定 HTMLAudioElement 事件
            └─ <FloatingPlayer />    # UI 入口
                 └─ <ExpandedPanel />
                      ├─ <Playlist />
                      ├─ <FavoritesTab />
                      └─ <RecentTab />
```

### 关键数据流

```
用户操作 → App.tsx handler → api.ts (IPC invoke) → electron/main.ts (fetch Bilibili)
                                    ↓
                             usePlayerStore → electron-store (持久化)
                                    ↓
                             useAudioPlayer → HTMLAudioElement (播放)
```

### 三个入口点

| 入口 | 触发方式 | 作用 |
|------|----------|------|
| 用户输入 BV 号/链接 | ExpandedPanel 输入框 → `handleInputSubmit` | 加载视频/收藏夹到播放列表 |
| 点击播放按钮 | FloatingPlayer 悬浮球/ExpandedPanel → `handlePlayPause` | 播放/暂停当前曲目 |
| 点击曲目 | Playlist/FavoritesTab/RecentTab → `handlePlayTrack` | 切换到指定曲目播放 |

## 二、模块核心度排序

### 🔴 核心模块（必须理解）

| 模块 | 行数 | 职责 | 修改频率 |
|------|------|------|----------|
| `electron/main.ts` | 211 | 窗口管理 + IPC + Bilibili API 代理 | 4 次 |
| `src/App.tsx` | 257 | 所有业务逻辑的胶水层 | 5 次 |
| `src/services/api.ts` | 99 | IPC 封装 + 全局 Audio 单例 + URL 缓存 | 4 次 |
| `src/hooks/usePlayerStore.ts` | 254 | 全部状态管理 + 批量写入 | 2 次 |
| `src/hooks/useAudioPlayer.ts` | 135 | 音频生命周期 + URL 刷新 | 2 次 |

### 🟡 重要模块（频繁修改）

| 模块 | 行数 | 职责 | 修改频率 |
|------|------|------|----------|
| `FloatingPlayer.tsx` | 314 | 窗口拖拽/缩放 + 折叠/展开切换 | 7 次 ⚠️ |
| `ExpandedPanel.tsx` | 252 | 播放控制 UI + 进度条 + 标签页 | 6 次 ⚠️ |
| `electron/preload.ts` | 11 | IPC 桥接定义 | 3 次 |

### 🟢 辅助模块（相对稳定）

| 模块 | 行数 | 职责 | 修改频率 |
|------|------|------|----------|
| `Playlist.tsx` | 179 | 播放列表渲染 + 拖拽排序 | 3 次 |
| `FavoritesTab.tsx` | 146 | 收藏夹网格 + 展开/折叠 | 2 次 |
| `RecentTab.tsx` | 44 | 最近播放列表 | 3 次 |
| `ModeIcon.tsx` | 45 | 播放模式图标 | 0 次 |
| `src/types/index.ts` | 55 | 类型定义 | 2 次 |

### ⚪ 几乎不用的模块

| 模块 | 状态 |
|------|------|
| `src/utils/format.ts` | **未被引用** — `Playlist.tsx` 和 `ExpandedPanel.tsx` 各自内联了 `formatDuration` |
| `src/utils/track.ts` | **未被引用** — `Playlist.tsx` 和 `RecentTab.tsx` 各自内联了 `isTrackFavorited` |
| `src/styles/tokens.css` | 遗留文件，`design-tokens.css` 已替代 |
| `vite.config.electron.ts` | 遗留文件，未被任何 script 引用 |
| `dev.mjs` | 手动启动器，`npm run dev` 已替代 |

## 三、依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                    electron/main.ts                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ 窗口管理  │  │ IPC 处理  │  │ Bilibili API 代理    │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │              │
│       │         electron-store           fetch          │
│       │              │                    │              │
└───────┼──────────────┼────────────────────┼──────────────┘
        │              │                    │
   ┌────▼────┐    ┌────▼────┐         ┌────▼────┐
   │ 窗口控制 │    │ 数据持久化│         │ API 响应 │
   │ IPC     │    │ IPC     │         │ IPC     │
   └────┬────┘    └────┬────┘         └────┬────┘
        │              │                    │
════════╪══════════════╪════════════════════╪══════════════
        │         preload.ts                │
        │    ┌──────────────┐               │
        └────┤ electronAPI  ├───────────────┘
             └──────┬───────┘
                    │
════════════════════╪══════════════════════════════════════
                    │         渲染进程
             ┌──────▼───────┐
             │   api.ts     │ ← 全局单例: audioEl, URL 缓存
             │  (IPC 封装)   │
             └──────┬───────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌───▼────┐
   │Player   │ │Audio    │ │Floating│
   │Store    │ │Player   │ │Player  │
   │(状态)   │ │(播放)   │ │(UI)    │
   └────┬────┘ └────┬────┘ └───┬────┘
        │           │           │
        └───────────┼───────────┘
                    │
             ┌──────▼───────┐
             │   App.tsx    │ ← 胶水层，组合所有逻辑
             └──────────────┘
```

## 四、全局变量 & 模块级单例

### ⚠️ 隐式状态（最容易出问题）

| 位置 | 变量 | 类型 | 问题 |
|------|------|------|------|
| `api.ts:17` | `audioEl` | `HTMLAudioElement \| null` | 全局单例，所有播放操作共享 |
| `api.ts:19` | `currentUrl` | `string` | 当前音频 URL 缓存 |
| `api.ts:20` | `currentExpiresAt` | `number` | URL 过期时间 |
| `api.ts:21` | `currentBvid` | `string` | 当前播放的 bvid |
| `api.ts:22` | `currentCid` | `number` | 当前播放的 cid |

**风险**：这些变量是模块级的，不受 React 状态管理。如果多个组件同时操作 `audioEl`，会产生竞争条件。

### React 状态（受控）

| Hook | 状态 | 存储位置 |
|------|------|----------|
| `usePlayerStore` | tracks, currentIndex, playMode, volume, favorites, recentTracks, windowPosition, windowSize, loading | electron-store (IPC) |
| `useAudioPlayer` | isPlaying, currentTime, duration, volume, currentAudio | React useState |
| `FloatingPlayer` | collapsedState | React useState |
| `ExpandedPanel` | inputValue, activeTab, seekingValue | React useState |

## 五、循环依赖分析

**无循环依赖**。依赖方向清晰：

```
types ← api.ts ← usePlayerStore ← App.tsx ← FloatingPlayer ← ExpandedPanel ← 子组件
                                    ↑
                              useAudioPlayer
```

`types/index.ts` 是纯类型定义，不依赖任何模块。`api.ts` 依赖 `types` 和 `electronAPI`。所有 hooks 依赖 `api.ts`。组件层依赖 hooks 和 types。

## 六、修改热点 🔥

### Top 5 高频修改文件

| 排名 | 文件 | 修改次数 | 原因分析 |
|------|------|----------|----------|
| 1 | `FloatingPlayer.tsx` | 7 | 窗口拖拽/缩放/折叠逻辑复杂，频繁修 bug |
| 2 | `ExpandedPanel.tsx` | 6 | UI 控件多，进度条/标签页交互复杂 |
| 3 | `App.tsx` | 5 | 胶水层，业务逻辑集中，改一处动全身 |
| 4 | `api.ts` | 4 | IPC 封装 + URL 缓存，音频相关 bug 集中 |
| 5 | `electron/main.ts` | 4 | 窗口管理 + API 代理，平台相关问题 |

### 常见 Bug 模式

从 commit 历史看：

1. **窗口状态不一致**（3 次 fix）：折叠/展开时窗口位置、大小、最小尺寸的同步问题
2. **播放状态不同步**（2 次 fix）：`currentAudio` overlay、删除曲目后播放状态
3. **stale closure**（1 次 fix）：`handlePlayFromFavorite` 中 `tracks.length` 是旧值
4. **URL 缓存**（1 次 fix）：重复加载同一首歌时 URL 缓存逻辑

### 重构收益最高的地方

| 区域 | 问题 | 建议 |
|------|------|------|
| `App.tsx` | 257 行，15+ 个 handler，职责过重 | 拆分为 `usePlaylistActions`、`useFavoriteActions` 等 hooks |
| `FloatingPlayer.tsx` | 314 行，拖拽/缩放/折叠混在一起 | 拆分为 `useWindowDrag`、`useWindowResize` hooks |
| `api.ts` 全局变量 | 5 个模块级变量，不受 React 管理 | 封装为 `AudioPlayer` 类，或用 context 管理 |
| `utils/format.ts` + `utils/track.ts` | 已存在但未被引用 | 删除或统一引用 |

## 七、架构风险点

| 风险 | 严重程度 | 说明 |
|------|----------|------|
| `api.ts` 全局单例 | 🔴 高 | 音频播放状态不受 React 控制，调试困难 |
| `App.tsx` 胶水层过重 | 🟡 中 | 所有 handler 集中在一个组件，改一处可能影响多处 |
| `preload.ts` / `preload.cjs` 手动同步 | 🟡 中 | 容易忘记同步，导致运行时错误 |
| `electron-store` schema 与渲染进程类型不共享 | 🟡 中 | 类型不匹配导致静默运行时错误 |
| 无测试 | 🟡 中 | 所有验证靠手动，回归风险高 |

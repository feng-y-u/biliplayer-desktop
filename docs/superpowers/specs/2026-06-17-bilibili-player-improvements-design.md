# 本地方案改进设计

对 Bilibili 桌面播放器进行 6 项改进的设计方案。

## 1. 播放列表显示歌曲时长

### 问题
通过单个 BV 号添加歌曲时，`getVideoInfo` 没有返回 `duration` 字段，导致播放列表显示 `--:--`。

### 方案
在 `electron/main.ts` 的 `getVideoInfo` 返回值中添加 `duration: data.data.duration`：

```diff
 return { bvid, cid, title, author: data.data.owner.name, cover: data.data.pic };
+        duration: data.data.duration,
```

Bilibili `/x/web-interface/view` 接口返回的 `data.duration` 是秒数，与 `Track.duration?: number` 类型兼容，`formatDuration` 已能正确处理。

### 改动范围
- 仅 `electron/main.ts`，一行代码。

---

## 2. 删除歌曲后播放状态正确处理

### 问题
删除当前播放的歌曲后，`currentIndex` 虽然减了但 `audioEl` 的 src 未清除，导致播放器 state 仍显示有 `currentAudio`，可继续播放已删除歌曲。

### 方案
`App.tsx` 的 `handleDeleteTrack` 逻辑：

| 场景 | 行为 |
|---|---|
| 删除非播放中的歌曲 | 只更新列表和 currentIndex，不触发音频变化 |
| 删除播放中的歌曲（列表 > 1 首） | 自动播下一首（删除位置的后一首，若删除最后一首则播前一首） |
| 删除最后一首歌曲（列表只剩 1 首） | 删除后列表为空，停止播放，清空 `currentAudio` |

关键修复：在删除当前播放歌曲后，确保调用 `pauseAudioLocal()` 使 `audioEl` 状态同步，并触发 `useAudioPlayer` 的 state 更新为空。

### 改动范围
- `src/App.tsx` — `handleDeleteTrack` 逻辑
- `src/hooks/useAudioPlayer.ts` — 可能需要增加清除 currentAudio 的方法

---

## 3. 收藏夹功能完善

### 3a. 新建收藏夹：修复 prompt 不可用

**问题**：`window.prompt()` 在 Electron sandbox 模式下不可用。

**方案**：在 `electron/main.ts` 的 `BrowserWindow` 配置中设置 `sandbox: false`（或保留 sandbox 但通过 preload 暴露 prompt）。选择前者更简单。

**注意**：关闭 sandbox 后仍需确认 `contextIsolation: true` 保持安全隔离。

### 3b. 收藏时选择目标文件夹

**问题**：点击播放列表的 ♡ 按钮后固定收藏到第一个文件夹，无法选择目标。

**方案**：双按钮交互：
- **♡ 按钮**：默认收藏到第一个文件夹（若无收藏夹则创建"默认收藏夹"），行为不变
- **下拉菜单**：♡ 按钮旁加一个 ▼ 箭头按钮，点击展开下拉列表，列出所有收藏夹供选择

**收藏到指定文件夹流程**：
1. 点击 ▼ 展开下拉菜单
2. 选择目标收藏夹
3. 将该歌曲添加到所选收藏夹
4. 显示 toast 通知「已收藏到「文件夹名」」

**交互要求**：
- 下拉菜单点击外部自动关闭
- 菜单项显示文件夹名 + 歌曲数量

### 3c. 收藏夹支持 BV 号和链接添加

**问题**：只能从播放列表收藏，收藏夹本身没有独立的歌曲添加入口。

**方案**：在展开后的收藏夹内容区顶部添加输入框：
- 展开收藏夹后，在歌曲列表上方显示输入行
- 支持 BV 号（匹配 `BV[a-zA-Z0-9]+`）和收藏夹链接
- BV 号：解析后直接添加到该收藏夹
- 收藏夹链接：解析后将所有歌曲添加到该收藏夹
- 输入框带占位符提示「输入 BV 号或收藏夹链接添加歌曲」

### 改动范围
- `electron/main.ts` — sandbox: false
- `src/components/floating-player/FavoritesTab.tsx` — 收藏夹内输入框 + 下拉菜单
- `src/components/floating-player/content.css` — 新 UI 样式
- `src/components/floating-player/ExpandedPanel.tsx` — 传入新 props
- `src/App.tsx` — 处理收藏夹添加逻辑

---

## 4. 窗口边缘吸附

### 问题
悬浮窗可自由拖拽，但靠近屏幕边缘时没有吸附效果。

### 方案
在拖拽释放时检测窗口位置，如果距离屏幕边缘 ≤20px 则吸附到该边缘：

| 位置 | 吸附行为 |
|---|---|
| 顶部 ≤20px | y = 0 |
| 底部 ≤20px | y = screenHeight - windowHeight |
| 左侧 ≤20px | x = 0 |
| 右侧 ≤20px | x = screenWidth - windowWidth |

**实现方式**：在 `FloatingPlayer.tsx` 的 `onMouseUp` 中，获取窗口位置后检查四个边缘的距离，如果任一方向在阈值内则调用 `window.electronAPI.windowMove()` 设置吸附位置。

**吸附动画**：使用 Electron 的 `setPosition` 直接跳转，不做平滑动画（保持简洁）。

**屏幕边界获取**：通过 `electron/main.ts` 新增 IPC 处理 `GET_WORK_AREA` 返回 `screen.getPrimaryDisplay().workArea`（与现有 `createWindow` 中的 `screen.getPrimaryDisplay()` 一致），渲染器通过 `window.electronAPI.getWorkArea()` 调用（需同步更新 preload）。

### 改动范围
- `electron/main.ts` — 可能需要新增 IPC 通道获取 workArea
- `src/components/floating-player/FloatingPlayer.tsx` — 拖拽释放时吸附逻辑
- `electron/preload.ts` / `preload.cjs` — 如果新增 IPC 则同步添加

---

## 5. 展开页封面 Redesign

### 问题
当前展开页的 now-playing 区域只是一行小封面 + 标题的小组件，视觉效果平淡。

### 方案（A 版）
- 封面从左侧 48px 小图变为**居中大封面（120px~140px，圆角 12px）**
- now-playing 区域占展开页顶部约 40% 高度
- 封面图放大后作为背景，应用 **CSS `filter: blur(20px)` + `opacity: 0.5`** 实现毛玻璃模糊效果
- 封面下方显示歌曲标题和歌手（居中）
- 控制栏和进度条保持原有布局，位置在封面区域下方
- 无播放时不显示封面区（保持"暂无播放"）

展开页布局变为：

```
┌──────────────────────┐
│  Piliplayer       ✕  │
│                      │
│    ┌──────────┐      │
│    │          │      │  ← 大封面居中
│    │  COVER   │      │     背景: 模糊放大封面
│    │          │      │
│    └──────────┘      │
│    歌曲标题           │
│    歌手名             │
│                      │
│  ◄◄   ▶▎▎   ►►  🔊══│  ← 控制栏
│  ▓▓▓▓▓▓░░░░ 1:23 3:45│  ← 进度条
│                      │
│ [BV号添加_______] [添加]│
│ 播放列表 │ 收藏夹      │
└──────────────────────┘
```

### 改动范围
- `src/components/floating-player/ExpandedPanel.tsx` — now-playing 区域重构
- `src/components/floating-player/panel.css` — 新封面布局样式
- `src/components/floating-player/content.css` — 可能调整控制栏位置

---

## 6. 保存悬浮窗旋转角度

### 问题
折叠状态的圆形缩略图有 CSS `spin` 动画，但播放暂停后动画重置到 0deg，恢复时重新开始。

### 方案
将旋转从纯 CSS animation 改为 JS 驱动：

1. **存储旋转角度**：在 `FloatingPlayer` 组件中用 `useRef` 保存当前旋转角度 `(0-360)`
2. **播放时旋转**：用 `requestAnimationFrame` 或 `setInterval` 以 8s 一圈的速度递增角度，通过 `transform: rotate(${angle}deg)` 应用
3. **暂停时保持**：停止计时器，保留当前 `angle` 值
4. **恢复时继续**：从保存的 `angle` 继续递增

CSS 改动：移除 `.player-thumb.playing` 的 `animation: spin`，改为 JS 设置 `style.transform`。

角度仅在内存中保持（`useRef`），不持久化到 electron-store。应用关闭后重置。

### 改动范围
- `src/components/floating-player/FloatingPlayer.tsx` — 角度管理 + requestAnimationFrame
- `src/components/floating-player/FloatingPlayer.css` — 移除 spin animation

---

## 改动文件总览

| 文件 | 影响项 |
|---|---|
| `electron/main.ts` | 1 (duration), 3a (sandbox), 4 (workArea IPC) |
| `electron/preload.ts` | 4 (新增 IPC) |
| `electron/preload.cjs` | 4 (同步) |
| `src/App.tsx` | 2 (删除逻辑), 3b/3c (收藏夹添加) |
| `src/components/floating-player/ExpandedPanel.tsx` | 3b/3c, 5 (封面 redesign) |
| `src/components/floating-player/FloatingPlayer.tsx` | 4 (吸附), 6 (旋转) |
| `src/components/floating-player/FavoritesTab.tsx` | 3b/3c (下拉菜单 + 输入框) |
| `src/components/floating-player/panel.css` | 5 (封面新布局) |
| `src/components/floating-player/content.css` | 3b/3c (新 UI 样式) |
| `src/components/floating-player/FloatingPlayer.css` | 6 (移除 spin) |
| `src/hooks/useAudioPlayer.ts` | 2 (清除 currentAudio 方法) |

## 优先级建议

这些项相互独立，可并行实现。建议按以下顺序实施，从最独立且改动最小的开始：

1. 第 1 项（时长）— 1 行代码，立即见效
2. 第 6 项（旋转）— 纯前端，不涉及数据流
3. 第 2 项（删除状态）— 核心 bug 修复
4. 第 4 项（吸附）— 独立功能
5. 第 3 项（收藏夹）— 功能较复杂，3b/3c 可拆开
6. 第 5 项（封面 redesign）— UI 改动最显著

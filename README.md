# 本地方案 — B站收藏夹播放器

基于 Electron 的桌面悬浮窗播放器，将 B站收藏夹音频独立为常驻小窗，随用随开。

## 技术栈

- **Electron 33** — 桌面窗口管理
- **React 18** — UI
- **TypeScript** — 类型安全（strict 模式）
- **Vite** — 构建
- **Zustand** — 状态管理
- **electron-store** — 本地持久化

## 架构

```
electron/
├── main.ts         # 主进程：创建窗口、Bilibili API 代理、IPC 处理
├── preload.ts      # 预加载脚本（类型源文件）
├── preload.cjs     # 运行时使用的 CJS 变体（与 .ts 同步编辑）
└── __tests__/      # 集成测试

src/
├── main.tsx                # React 入口
├── App.tsx                 # 根组件
├── types/
│   ├── index.ts            # 领域模型（Track, PlayMode, FavoriteFolder 等）
│   ├── api.ts              # API 接口（VideoInfo, AudioUrl）
│   └── ipc.ts              # IPC 契约（严格类型）
├── services/api.ts         # 渲染进程 IPC 封装 + 全局 HTMLAudioElement
├── stores/
│   ├── playlistStore.ts    # 播放列表、当前索引、播放模式
│   ├── favoritesStore.ts   # 收藏夹管理
│   ├── recentStore.ts      # 最近播放（上限 50 条）
│   └── windowStore.ts      # 窗口位置、大小、音量（防抖批量写入）
├── hooks/
│   ├── useAudioPlayer.ts       # HTMLAudioElement 生命周期管理
│   ├── usePlayerController.ts  # 播放列表 CRUD + 导航
│   ├── useFavoriteActions.ts   # 收藏夹 CRUD
│   └── useDragReorder.ts       # 拖拽排序
├── components/
│   └── floating-player/
│       ├── FloatingPlayer.tsx   # 折叠缩略图 + 拖拽 + 展开面板
│       ├── ExpandedPanel.tsx    # 完整播放器 UI
│       ├── Playlist.tsx         # 播放列表
│       ├── ModeIcon.tsx         # 播放模式图标
│       ├── FavoritesTab.tsx     # 收藏夹面板
│       └── RecentTab.tsx        # 最近播放面板
└── styles/
    ├── tokens.css       # 设计令牌（CSS 自定义属性）
    └── global.css       # 全局重置
```

## 快速开始

```bash
cd 本地方案
npm install                     # 首次安装依赖
npm run dev                     # 启动开发模式（Vite + Electron 热重载）
npm run build                   # 构建生产版本
npm run test                    # 运行测试
npm run dist                    # 打包为安装程序
```

## 核心设计

### 双进程架构

严格上下文隔离。渲染进程不直接发起网络请求——所有 Bilibili API 调用通过 IPC 转发到主进程。

```
用户操作 → React 组件 → api.ts (IPC invoke) → electron/main.ts (fetch) → Bilibili API
                                                      ↓
                                               electron-store (持久化)
```

### 窗口行为

- `alwaysOnTop: true` — 始终在最上层，不干扰主工作流
- `frame: false` — 无标题栏，完全自定义拖拽
- `transparent: true` — 透明背景，仅显示播放器本体
- 窗口位置/大小持久化，重启应用恢复上次位置
- 三种缩放尺寸（折叠缩略图 / 展开面板 / 手动调整）

### API 代理

所有 Bilibili 请求在主进程发出，避免 CORS 限制。支持获取视频信息、收藏夹列表和音频流地址。Bilibili CDN 请求自动注入 `Referer` 头。

### 音频播放

渲染进程内管理全局 `HTMLAudioElement` 单例：

- 加载音频时通过 IPC 获取 Bilibili 音频流地址（~10 分钟有效期）
- 播放中每 60 秒自动刷新地址，防止过期
- 播放前检查剩余有效期，不足 5 分钟则强制刷新

### 持久化

使用 `electron-store` 替代浏览器 `storage.local`，持久化内容包括：

| 数据 | 写入策略 |
|---|---|
| 播放列表、播放模式 | 每次操作即时写入 |
| 收藏夹 | 每次操作即时写入 |
| 最近播放（最多 50 条） | 每次操作即时写入 |
| 窗口位置、大小、音量 | 防抖批量（100ms 合并） |

### 状态管理

四个 Zustand store 分别管理不同模块的状态，均通过 IPC 与 `electron-store` 同步。
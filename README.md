<div align="center">
  <img src="player_256x256.ico" width="64" height="64" alt="logo" />
  <h1>Piliplayer</h1>
  <p>
    <strong>B站收藏夹悬浮播放器</strong>
  </p>
  <p>
    将你的 Bilibili 收藏夹变为一个始终置顶的常驻小窗
  </p>
  <p>
    <img src="https://img.shields.io/badge/Electron-33-47848F?logo=electron" alt="Electron" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Zustand-443E38" alt="Zustand" />
  </p>
  <br />
</div>

## ✨ 特性

- **悬浮窗** — 无边框透明窗口，始终置顶，不干扰工作流
- **收藏夹播放** — 粘贴 Bilibili 收藏夹链接即可播放
- **音质优先** — 后台载入 Bilibili DASH 音频流，支持后台播放
- **持久化** — 窗口位置、播放列表、播放进度自动保存
- **多模式** — 列表循环 / 单曲循环 / 随机播放

## 🚀 快速开始

```bash
npm install
npm run dev       # 开发模式（热重载）
npm run build     # 构建生产版本
npm run test      # 运行测试
npm run dist      # 打包为安装程序
```

## 🏗 架构

```
用户操作
    ↓
React 组件
    ↓ (IPC invoke)
主进程 (fetch) ──→ Bilibili API
    ↓
electron-store (持久化)
```

### 双进程

| 进程 | 职责 | 技术 |
|---|---|---|
| **主进程** | 窗口管理、Bilibili API 代理、持久化 | Electron 33 |
| **预加载** | 安全的 IPC 桥梁 | `contextBridge` + `ipcRenderer` |
| **渲染进程** | UI、播放控制 | React 18 + Zustand |

渲染进程永远不直接 `fetch`——所有 API 请求通过 IPC 转发到主进程，避免 CORS 问题。

### 窗口

- 无边框、透明、`alwaysOnTop`
- 折叠态（64×64 缩略图）→ 展开面板 → 手动缩放
- 位置/大小持久化，重启恢复

## 📦 项目结构

```
electron/              # 主进程
├── main.ts            # 入口：禁用硬件加速、引导窗口
├── windowManager.ts   # 窗口创建、CDN Referer 注入、DevTools
├── ipcHandlers.ts     # API / Store / 窗口 IPC 处理
├── bilibiliApi.ts     # B站 API fetch（纯函数）
├── appCore.ts         # 单例（窗口引用 + electron-store）
├── preload.ts         # contextBridge 桥接（与 preload.cjs 同步编辑）
└── preload.cjs        # 运行时 CJS 变体

src/                   # 渲染进程
├── main.tsx           # React 入口
├── App.tsx            # 根组件（组合 stores + hooks）
├── services/api.ts    # IPC 封装 + 全局 HTMLAudioElement 单例
├── stores/            # Zustand（播放列表 / 收藏夹 / 最近 / 窗口）
│   ├── playlistStore.ts
│   ├── favoritesStore.ts
│   ├── recentStore.ts
│   └── windowStore.ts
├── hooks/             # 播放 / 拖拽 / 缩放 / 动画
│   ├── useAudioPlayer.ts
│   ├── usePlayerController.ts
│   ├── useFavoriteActions.ts
│   ├── useDrag.ts
│   ├── useResize.ts
│   ├── useDragReorder.ts
│   └── useLerpAnimation.ts
├── components/        # UI
│   └── floating-player/
│       ├── FloatingPlayer.tsx   # 折叠缩略图 + 拖拽
│       ├── ExpandedPanel.tsx    # 展开面板（三标签）
│       ├── Playlist.tsx
│       ├── FavoritesTab.tsx
│       ├── RecentTab.tsx
│       └── ModeIcon.tsx
├── styles/
│   ├── tokens.css     # 设计令牌（CSS 自定义属性）
│   └── global.css     # 全局重置
└── types/
    ├── index.ts       # 领域模型
    ├── api.ts         # API 接口
    ├── ipc.ts         # IPC 契约
    └── electron.d.ts  # window.electronAPI
```

## 🔧 播放策略

Bilibili 音频 URL **约 10 分钟过期**，代码通过两层机制保证持续播放：

- **主动刷新** — 播放中每 60 秒拉取新 URL
- **被动检查** — 恢复播放时检查 URL 是否将过期，过期则先刷新
- **缓冲充足** — `canplaythrough` 事件确保足够缓冲后再开始播放，避免蓝牙 A2DP 延迟导致无声
- **CDN 兼容** — 主进程 `webRequest` 自动注入 `Referer` + `User-Agent`，覆盖已知 Bilibili CDN 域名

## 📝 开发

```bash
# 类型检查
npx tsc --noEmit

# 运行测试
npm run test
npm run test:watch

# 单个测试文件
npx vitest run <文件路径>

# 手动启动（vite-plugin-electron 异常时备用）
node dev.mjs

# 打包
npm run pack   # 未打包输出
npm run dist   # 安装包
```

## 📄 许可

MIT

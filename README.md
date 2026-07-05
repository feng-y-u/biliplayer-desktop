# 本地方案 — B站收藏夹播放器

基于 Electron 的桌面应用，将浏览器扩展的播放器功能独立为一个持久悬浮窗。


## 技术栈

- **Electron 33** — 桌面窗口管理
- **React 18** — UI
- **TypeScript** — 类型安全
- **Vite** — 构建

## 架构

```
electron/main.ts        # 主进程：创建窗口、Bilibili API 代理
electron/preload.ts     # 预加载脚本：暴露 IPC 接口给 renderer
src/
├── main.tsx            # React 入口
├── App.tsx             # 根组件
├── types/index.ts      # 类型定义
├── services/api.ts     # API 调用（通过 IPC 到 main process）
├── hooks/
│   ├── useStorage.ts   # 本地持久化（electron-store）
│   ├── useAudioPlayer.ts
│   └── usePlaylist.ts
├── components/
│   └── floating-player/  # 复用现有 UI 组件
├── styles/
│   └── design-tokens.css
```

## 快速开始

```bash
cd 本地方案
npm install
npm run dev      # 启动开发模式（Vite + Electron）
npm run build    # 构建生产版本
```

## 核心设计

### 窗口行为
- `alwaysOnTop: true` — 始终在最上层
- `frame: false` — 无标题栏（自定义拖拽）
- `transparent: true` — 可选透明背景
- 窗口状态（位置、大小）持久化到本地

### API 代理
浏览器扩展的 `background.ts` 移到 Electron main process。`fetch` 请求在 main process 发出，无 CORS 限制，无需 `host_permissions`。

### 音频播放
`HTMLAudioElement` 在 renderer process 中，与现有 `api.ts` 逻辑一致。`refreshAudioUrl` 通过 IPC 调用 main process 刷新。

### 持久化
使用 `electron-store` 替代 `browser.storage.local`，存储播放列表、音量、播放模式、窗口位置等。

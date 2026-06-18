# Tauri 迁移设计文档

> 2026-06-18 · Bilibili Favorites Player 从 Electron 迁移到 Tauri

---

## 目标

将桌面应用从 Electron 迁移到 Tauri 2.0，减小发行包体积从 ~268MB 到 ~10-15MB，同时学习 Rust 基础。

## 架构变更

### 当前（Electron）

```
Renderer (React) → Preload (contextBridge) → Main (Node.js)
```

### 迁移后（Tauri）

```
Renderer (React) → Rust Backend (Tauri commands)
```

- **删除** `electron/` 整个目录（main.ts、preload.ts、preload.cjs）
- **新增** `src-tauri/` 目录，内含 Rust 代码
- React 前端保留 80%+，只有 API 调用方式需要改

## Rust 后端结构

按功能拆分为独立模块：

```
src-tauri/src/
  main.rs              # Tauri 入口、注册 commands、窗口创建
  commands/
    bilibili.rs        # get_video_info, get_playlist, get_audio_url
    store.rs           # store_get, store_set
    window.rs          # window_move, window_resize, get_position, set_min_size
```

每个文件约 30-50 行，总计 ~300-400 行 Rust 代码。

### bilibili.rs

对应 `electron/main.ts:116-185`，实现 3 个 Tauri command：

- `get_video_info(bvid)` — 调用 Bilibili API 获取视频元数据
- `get_playlist(url)` — 解析收藏夹 URL，分页获取所有 track
- `get_audio_url(bvid, cid)` — 获取音频流 URL（10 分钟过期）

HTTP 请求用 `reqwest`，带 `Referer: https://www.bilibili.com/` header。JSON 解析用 `serde` / `serde_json`。

### store.rs

对应 `electron-store`，用 `tauri-plugin-store` 插件：

- `store_get(key)` — 读取持久化数据
- `store_set(key, value)` — 写入持久化数据

配置文件自动存到 `%APPDATA%/Piliplayer/`。JSON 格式与 `electron-store` 兼容，迁移时可读取旧数据。

### window.rs

对应 `window:move` 等 4 个 IPC：

- `window_move(x, y)` — 移动窗口
- `window_resize(width, height)` — 调整窗口大小
- `get_position()` — 获取窗口位置和大小
- `set_min_size(width, height)` — 设置最小尺寸

用 Tauri 内置的 `app.get_webview_window()` 调用 `set_position`、`set_size`、`set_min_size` 等方法。

## React 前端改动

### 改动点

1. **`src/services/api.ts`** — `window.electronAPI.api(...)` → `invoke('get_video_info', { bvid })` 等直接调用，不再需要消息类型分发
2. **`src/hooks/usePlayerStore.ts`** — `store.storeSet(key, value)` → `invoke('store_set', { key, value })`
3. **窗口控制** — `window.electronAPI.windowMove(x, y)` → `invoke('window_move', { x, y })`
4. **删除** `window.electronAPI` 的全局类型声明

### 不需要改的

- `useAudioPlayer.ts` — 纯 renderer 侧的 `HTMLAudioElement` 操作
- 所有组件代码 — 只消费 hook 返回的状态
- CSS / 样式 — 完全不变

### 新增依赖

- `@tauri-apps/api`（Tauri 前端 API）
- `@tauri-apps/plugin-store`（持久化）

前端改动量预估：~80 行，集中在 `api.ts` 和 `usePlayerStore.ts`。

## 构建与打包

### 开发

```bash
npm install
cargo install tauri-cli          # 需要 Rust 工具链
npm run tauri dev                # Vite + Tauri
```

### 生产

```bash
npm run tauri build              # → src-tauri/target/release/bundle/nsis/
```

### 删除的 Electron 相关内容

- `electron/` 整个目录
- `electron-builder` 配置（`package.json` 中的 `build` 字段）
- `dev.mjs`
- `vite.config.ts` 中的 `vite-plugin-electron` 和 `vite-plugin-electron-renderer`
- `gen:preload` 脚本

### CI 变更

GitHub Actions 需要安装 Rust 工具链：

```yaml
- uses: dtolnay/rust-toolchain@stable
- run: npm run tauri build
```

## 预期产物

| | Electron（当前） | Tauri（迁移后） |
|---|---|---|
| 安装包体积 | ~268MB / ~100MB(NSIS) | ~10-15MB |
| Rust 代码 | 0 | ~300-400 行 |
| React 改动 | — | ~80 行 |
| 依赖变化 | electron + electron-store | tauri + reqwest + tauri-plugin-store |

## 风险与注意事项

### Bilibili CDN Referer

Electron 用 `webRequest.onBeforeSendHeaders` 拦截请求注入 header。Tauri 中用 `reqwest` 在 Rust 侧发请求，直接在 HTTP header 里加 Referer，更简单。

### 窗口透明 + 无边框

Tauri 2.0 支持 `transparent: true` + `decorations: 0`，与 Electron 行为一致。

### WebView 差异

Windows 上 Tauri 用 Edge WebView2（系统自带），与 Chromium 行为基本一致，`HTMLAudioElement` 播放无差异。

### 数据迁移

`electron-store` 和 `tauri-plugin-store` 都用 JSON 格式存储。迁移时可读取旧的 `%APPDATA%/biliplayer-local/` 目录下的数据文件。

## 分阶段实施

1. **Phase 1：骨架搭建** — 初始化 Tauri 项目，创建 `src-tauri/` 结构，跑通 `tauri dev` 显示空白窗口
2. **Phase 2：Rust 后端** — 实现 `bilibili.rs`、`store.rs`、`window.rs`，逐个 command 测试
3. **Phase 3：前端迁移** — 改 `api.ts` 和 `usePlayerStore.ts`，删除 Electron 相关代码
4. **Phase 4：打包验证** — `tauri build` 生成安装包，验证功能完整

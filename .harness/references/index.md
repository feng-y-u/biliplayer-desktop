# 参考资料索引

## 项目内部文档

| 文件 | 内容 |
|------|------|
| `AGENTS.md` | 项目架构、命令、约定、gotchas |
| `CLAUDE.md` | 更详细的项目指令 |
| `README.md` | 项目概述、快速开始 |
| `.harness/agent-owner.md` | 12 条核心规则 |

## IPC 协议

参见 `AGENTS.md` 的 "IPC contract" 章节。

## electron-store

| Key | 类型 | 说明 |
|-----|------|------|
| `volume` | `number` | 音量 0-1 |
| `playMode` | `'loop' \| 'single' \| 'shuffle'` | 播放模式 |
| `playlist` | `{ tracks, currentIndex }` | 播放列表 |
| `favorites` | `FavoriteFolder[]` | 收藏夹 |
| `recentTracks` | `Track[]` | 最近播放 |
| `windowPosition` | `{ left, top }` | 窗口位置 |
| `windowSize` | `{ width, height }` | 窗口大小 |

## CSS Token

```css
--bg          /* 背景色 */
--fg          /* 前景色 */
--accent      /* 强调色 */
--space-*     /* 间距 */
--radius-*    /* 圆角 */
--elev-*      /* 阴影 */
--motion-*    /* 动画 */
```

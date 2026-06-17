# UX 优化设计 — 视觉反馈、播放控制、面板布局

日期：2026-06-17
状态：已批准

## 目标

优化 Bilibili 收藏夹播放器的使用体验，聚焦三个方面：视觉反馈动画、播放控件美化、面板布局自适应。

## 范围

### 做
- 展开/收起缩放+淡入动画
- 加载时按钮 spinner
- 进度条和音量滑杆 CSS 美化
- 折叠态缩小到 64x64 + 半透明
- 展开面板智能自适应尺寸

### 不做
- 通知样式（保持现状）
- 播放模式切换交互（保持现状）
- 封面信息区域布局（保持现状）
- 键盘快捷键、拖拽导入等新功能

---

## Section 1: 动画过渡

### 展开动画
- 折叠 → 展开：`transform: scale(0.3)` → `scale(1)` + `opacity: 0` → `opacity: 1`
- 时长 250ms，`ease-out`
- 使用 CSS `@keyframes expandIn`

### 收起动画
- 展开 → 折叠：反向动画
- 时长 200ms，`ease-in`
- 使用 CSS `@keyframes collapseOut`

### 实现
- `FloatingPlayer.tsx`：新增 `animating` 状态，展开/收起时先设 `animating=true`，动画结束后设 `false`
- `FloatingPlayer.css`：添加 `.expand-in` 和 `.collapse-out` animation class
- 动画期间设置 `pointer-events: none` 防止误触

---

## Section 2: 加载 Spinner + Range 美化

### 加载 Spinner
- `ExpandedPanel.tsx` 按钮内：loading 时显示 SVG spinner（16x16 圆圈旋转）+ "加载中" 文字
- CSS `@keyframes spin`：`0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) }`
- 按钮 `disabled` 时降低透明度

### 进度条美化
- 轨道（`-webkit-slider-runnable-track`）：高度 4px，圆角 2px，背景 `var(--border)`
- 已播放部分：通过 JS 计算 `linear-gradient` 填充 accent 色
- 手柄（`-webkit-slider-thumb`）：12px 圆形，accent 色背景，hover 时 `transform: scale(1.17)` → 14px
- 去掉默认 outline，focus 时手柄加 `box-shadow`

### 音量滑杆美化
- 同进度条样式，手柄缩小到 10px
- 轨道高度 3px

### 文件
- `controls.css`：进度条、音量滑杆样式
- `panel.css`：按钮 spinner 样式

---

## Section 3: 折叠态缩小 + 半透明

### 新折叠态尺寸
- `THUMB_WIDTH` 从 200 → 64，`THUMB_HEIGHT` 从 72 → 64
- 正方形，`border-radius: 50%`（圆形）
- 封面图 `object-fit: cover` 填满

### 半透明效果
- 播放中（`isPlaying=true`）：`opacity: 0.6`
- 鼠标悬浮（`.float-player:hover`）：`opacity: 1`
- 过渡：`transition: opacity 200ms ease`
- 非播放态：`opacity: 1`

### 悬浮按钮调整
- 3个按钮（播放/暂停、下一首、模式）移到缩略图右侧垂直排列
- 按钮尺寸：24x24px
- 间距紧凑，紧贴缩略图

### 文件
- `FloatingPlayer.tsx`：THUMB_WIDTH/HEIGHT 常量、按钮布局
- `FloatingPlayer.css`：新尺寸、半透明、按钮定位

---

## Section 4: 面板智能自适应

### 自适应逻辑
展开时计算目标尺寸：
```
targetW = min(400, screenWidth - 40)
targetH = min(600, screenHeight - 40)
```

### 展开位置
- 以缩略图中心为锚点
- 目标位置：`(thumbCenterX - targetW/2, thumbY)`
- 边界修正：确保不超出屏幕（left ≥ 20, top ≥ 20, right ≤ screenWidth-20, bottom ≤ screenHeight-20）

### 尺寸记忆
- 新增 `lastExpandedSize` ref，默认 `{ width: 400, height: 600 }`
- 用户 resize 后更新此 ref
- 下次展开时优先使用记住的尺寸（如果屏幕放得下），否则用自适应计算值

### 文件
- `FloatingPlayer.tsx`：展开逻辑、尺寸计算、lastExpandedSize ref

---

## 涉及文件

| 文件 | 改动 |
|------|------|
| `FloatingPlayer.tsx` | 动画状态、THUMB 常量、展开尺寸计算、lastExpandedSize |
| `FloatingPlayer.css` | 动画 keyframes、64x64 折叠态、半透明、按钮布局 |
| `ExpandedPanel.tsx` | 按钮 spinner |
| `panel.css` | spinner 样式 |
| `controls.css` | range 美化（进度条+音量） |

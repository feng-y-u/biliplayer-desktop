# UX 优化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化播放器视觉反馈、播放控件样式、面板布局自适应

**Architecture:** 纯 CSS 动画 + 少量 TSX 状态逻辑。不改 IPC、不改 API、不改数据流。只动 FloatingPlayer 和 ExpandedPanel 的 UI 层。

**Tech Stack:** CSS transitions/keyframes, React state, existing design tokens

**涉及文件（仅这些）：**
- `src/components/floating-player/FloatingPlayer.tsx` — 常量、动画状态、展开尺寸计算
- `src/components/floating-player/FloatingPlayer.css` — 动画 keyframes、64x64 折叠态、半透明
- `src/components/floating-player/ExpandedPanel.tsx` — 按钮 spinner
- `src/components/floating-player/panel.css` — spinner 样式
- `src/components/floating-player/controls.css` — range 美化

**不涉及：** electron/main.ts、preload、api.ts、hooks、types

---

### Task 1: Range 输入美化（进度条 + 音量滑杆）

**Files:**
- Modify: `src/components/floating-player/controls.css:32-50,126-170`

- [ ] **Step 1: 美化音量滑杆轨道和手柄**

在 `controls.css` 中，替换 `.ep-vol-slider` 和 `.ep-vol-slider::-webkit-slider-thumb` 的现有规则：

```css
.ep-vol-slider {
  width: 60px;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, var(--accent) 0%, var(--accent) var(--vol-pct, 70%), var(--border) var(--vol-pct, 70%), var(--border) 100%);
  border-radius: 2px;
  cursor: pointer;
  flex-shrink: 0;
  outline: none;
}
.ep-vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.ep-vol-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
.ep-vol-slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  cursor: pointer;
}
.ep-vol-slider::-moz-range-track {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
}
.ep-vol-slider::-moz-range-progress {
  background: var(--accent);
  border-radius: 2px;
}
```

- [ ] **Step 2: 美化进度条轨道和手柄**

替换 `controls.css` 中 `.ep-prog-bar input[type="range"]` 及其 thumb 规则：

```css
.ep-prog-bar input[type="range"] {
  position: absolute;
  inset: -6px 0;
  width: 100%;
  height: 16px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  margin: 0;
  outline: none;
}
.ep-prog-bar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.ep-prog-bar input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.17);
}
.ep-prog-bar input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  cursor: pointer;
}
.ep-prog-bar input[type="range"]::-moz-range-track {
  background: transparent;
}
.ep-prog-bar input[type="range"]::-moz-range-progress {
  background: var(--accent);
  border-radius: 2px;
}
```

- [ ] **Step 3: 更新 ExpandedPanel 中音量滑杆的 CSS 变量**

在 `ExpandedPanel.tsx` 的音量 `<input>` 上添加 `style` 动态设置 `--vol-pct`：

```tsx
<input className="ep-vol-slider" type="range" min={0} max={1} step={0.01} value={volume}
  style={{ '--vol-pct': `${volume * 100}%` } as React.CSSProperties}
  onChange={(e) => playerActions.onVolumeChange(parseFloat(e.target.value))}
/>
```

- [ ] **Step 4: 验证**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/floating-player/controls.css src/components/floating-player/ExpandedPanel.tsx
git commit -m "style: beautify progress bar and volume slider range inputs"
```

---

### Task 2: 折叠态 64x64 + 半透明

**Files:**
- Modify: `src/components/floating-player/FloatingPlayer.tsx:8-13` (常量)
- Modify: `src/components/floating-player/FloatingPlayer.css:50-145` (折叠态样式)

- [ ] **Step 1: 修改折叠态常量**

在 `FloatingPlayer.tsx` 中修改常量：

```tsx
// Window size constants
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 64;
const PANEL_MIN_WIDTH = 320;
const PANEL_MIN_HEIGHT = 480;
const DRAG_THRESHOLD = 5;
const MIN_WINDOW_SIZE = { width: 1, height: 1 };
```

- [ ] **Step 2: 更新折叠态 CSS**

替换 `FloatingPlayer.css` 中 `.float-player:not(.expanded)` 及相关规则：

```css
/* Collapsed: circular thumbnail, semi-transparent when playing */
.float-player:not(.expanded) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
}
.float-player:not(.expanded).playing {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.float-player:not(.expanded):hover {
  opacity: 1;
}
```

- [ ] **Step 3: 更新缩略图尺寸**

替换 `.player-thumb` 规则：

```css
.player-thumb {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  cursor: grab;
  background: linear-gradient(135deg, #6366f1, #4f6ef7);
  box-shadow: 0 4px 16px rgba(79, 110, 247, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  flex-shrink: 0;
}
```

- [ ] **Step 4: 调整悬浮按钮尺寸**

替换 `.hover-bar button` 和 `.hover-bar button svg` 规则：

```css
.hover-bar button {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: none;
  color: var(--fg-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s;
}
.hover-bar button:hover {
  background: var(--surface-hover);
  color: var(--accent);
}
.hover-bar button svg {
  width: 12px;
  height: 12px;
}
```

- [ ] **Step 5: 添加 playing 状态 class**

在 `FloatingPlayer.tsx` 的根 `<div>` 上添加 `playing` class：

```tsx
<div
  ref={containerRef}
  className={`float-player${collapsedState === 'expanded' ? ' expanded' : ''}${playerState.isPlaying ? ' playing' : ''}`}
  onMouseDown={handleMouseDown}
>
```

- [ ] **Step 6: 验证**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/components/floating-player/FloatingPlayer.tsx src/components/floating-player/FloatingPlayer.css
git commit -m "style: shrink collapsed thumb to 64x64 with semi-transparent playing state"
```

---

### Task 3: 展开/收起动画

**Files:**
- Modify: `src/components/floating-player/FloatingPlayer.tsx:66` (动画状态)
- Modify: `src/components/floating-player/FloatingPlayer.css:14-27` (keyframes)

- [ ] **Step 1: 添加动画 keyframes**

替换 `FloatingPlayer.css` 中现有的 `.expanded-panel` 和 `@keyframes panelExpand`：

```css
/* ── Collapsed → expanded scale animation ── */
.float-player.expanded .expanded-panel {
  animation: panelExpand 0.25s ease-out forwards;
}
@keyframes panelExpand {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* ── Collapse animation ── */
.float-player.collapsing .expanded-panel {
  animation: panelCollapse 0.2s ease-in forwards;
}
@keyframes panelCollapse {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.3);
  }
}
```

- [ ] **Step 2: 添加动画状态到 FloatingPlayer**

在 `FloatingPlayer.tsx` 中添加 `animating` 状态：

```tsx
const [collapsedState, setCollapsedState] = useState<CollapsedState>('collapsed');
const [animating, setAnimating] = useState<'expand' | 'collapse' | null>(null);
```

- [ ] **Step 3: 修改展开逻辑加入动画**

替换 `handleThumbClick` 回调：

```tsx
const handleThumbClick = useCallback(async () => {
  if (didDrag.current) {
    didDrag.current = false;
    return;
  }
  const api = window.electronAPI;
  if (collapsedState === 'collapsed') {
    const pos = await api.windowGetPosition();
    collapsedPosRef.current = { x: pos.x, y: pos.y };
    const thumbCenterX = pos.x + THUMB_WIDTH / 2;
    const targetW = Math.min(storage.windowSize.width, window.screen.width - 40);
    const targetH = Math.min(storage.windowSize.height, window.screen.height - 40);
    let expandedX = thumbCenterX - targetW / 2;
    let expandedY = pos.y;
    expandedX = Math.max(20, Math.min(expandedX, window.screen.width - targetW - 20));
    expandedY = Math.max(20, Math.min(expandedY, window.screen.height - targetH - 20));
    api.windowMove(expandedX, expandedY);
    api.windowResize(targetW, targetH);
    api.windowSetMinimumSize(PANEL_MIN_WIDTH, PANEL_MIN_HEIGHT);
    setAnimating('expand');
    setCollapsedState('expanded');
  } else {
    setAnimating('collapse');
    setTimeout(() => {
      const pos = collapsedPosRef.current;
      if (pos) api.windowMove(pos.x, pos.y);
      api.windowResize(THUMB_WIDTH, THUMB_HEIGHT);
      api.windowSetMinimumSize(MIN_WINDOW_SIZE.width, MIN_WINDOW_SIZE.height);
      setCollapsedState('collapsed');
      setAnimating(null);
    }, 200);
  }
}, [collapsedState, storage.windowSize]);
```

- [ ] **Step 4: 更新 className 逻辑**

替换根 `<div>` 的 className：

```tsx
<div
  ref={containerRef}
  className={[
    'float-player',
    collapsedState === 'expanded' && 'expanded',
    collapsedState === 'collapsed' && animating === 'collapse' && 'collapsing',
    playerState.isPlaying && 'playing',
  ].filter(Boolean).join(' ')}
  onMouseDown={handleMouseDown}
>
```

- [ ] **Step 5: 动画期间禁用交互**

在展开面板包裹 div 上添加 pointer-events 控制：

```tsx
{collapsedState === 'expanded' && (
  <div style={{ pointerEvents: animating === 'expand' ? 'none' : 'auto' }}>
    <ExpandedPanel
      // ... existing props
    />
    {/* Resize handles */}
    <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
    <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
    <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
  </div>
)}
```

- [ ] **Step 6: 验证**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/components/floating-player/FloatingPlayer.tsx src/components/floating-player/FloatingPlayer.css
git commit -m "feat: add scale+fade animation for expand/collapse transition"
```

---

### Task 4: 面板智能自适应 + 尺寸记忆

**Files:**
- Modify: `src/components/floating-player/FloatingPlayer.tsx` (lastExpandedSize ref + 展开逻辑)

- [ ] **Step 1: 添加 lastExpandedSize ref**

在 `FloatingPlayer.tsx` 中添加 ref：

```tsx
const collapsedPosRef = useRef<{ x: number; y: number } | null>(null);
const lastExpandedSizeRef = useRef<{ width: number; height: number }>({
  width: 400,
  height: 600,
});
```

- [ ] **Step 2: 更新 resize 逻辑记录尺寸**

在 `onResizeUp` 中记录用户调整后的尺寸：

```tsx
function onResizeUp() {
  if (!resizeSession.current) return;
  resizeSession.current = null;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  // 记住用户调整后的尺寸
  lastExpandedSizeRef.current = {
    width: storage.windowSize.width,
    height: storage.windowSize.height,
  };
}
```

- [ ] **Step 3: 展开时优先使用记住的尺寸**

更新 `handleThumbClick` 中的尺寸计算：

```tsx
// 在 handleThumbClick 展开分支中，替换尺寸计算部分
const remembered = lastExpandedSizeRef.current;
const targetW = Math.min(remembered.width, window.screen.width - 40);
const targetH = Math.min(remembered.height, window.screen.height - 40);
```

- [ ] **Step 4: 验证**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/components/floating-player/FloatingPlayer.tsx
git commit -m "feat: smart adaptive panel size with memory of user resize"
```

---

### Task 5: 加载 Spinner

**Files:**
- Modify: `src/components/floating-player/ExpandedPanel.tsx:196-198` (按钮)
- Modify: `src/components/floating-player/panel.css` (spinner 样式)

- [ ] **Step 1: 添加 spinner CSS**

在 `panel.css` 末尾添加：

```css
/* ── Loading spinner ── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.ep-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: middle;
  margin-right: 4px;
}
```

- [ ] **Step 2: 更新按钮内容**

替换 `ExpandedPanel.tsx` 中加载按钮：

```tsx
<button onClick={handleSubmit} disabled={loading}>
  {loading ? <><span className="ep-spinner" />加载中</> : '添加'}
</button>
```

- [ ] **Step 3: 验证**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/components/floating-player/ExpandedPanel.tsx src/components/floating-player/panel.css
git commit -m "style: replace loading text with spinner animation on add button"
```

---

### Task 6: 验证与记录

- [ ] **Step 1: 完整验证**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: 手动测试清单**

- [ ] 启动 `npm run dev`，确认折叠态 64x64 圆形
- [ ] 播放音频，确认折叠态半透明
- [ ] 鼠标悬浮折叠态，确认变为不透明
- [ ] 点击展开，确认缩放+淡入动画
- [ ] 点击收起，确认反向动画
- [ ] 添加 BV 号，确认按钮显示 spinner
- [ ] 拖拽进度条，确认手柄 hover 放大
- [ ] 调节音量，确认滑杆样式美化
- [ ] resize 面板后收起再展开，确认记住尺寸

- [ ] **Step 3: 记录变更**

创建 `changes/2026-06-17-ux-optimization/README.md`，记录变更内容。

- [ ] **Step 4: 提交**

```bash
git add changes/2026-06-17-ux-optimization/
git commit -m "docs: record UX optimization changes"
```

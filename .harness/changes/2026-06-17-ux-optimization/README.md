# UX 优化变更记录

日期：2026-06-17
状态：已完成

## 变更内容

### 1. Range 输入美化 (f53dd98)
- 进度条和音量滑杆使用自定义轨道样式
- 手柄 hover 时放大效果
- Firefox/moz 兼容
- 音量滑杆使用 `--vol-pct` CSS 变量控制填充百分比

### 2. 折叠态 64x64 + 半透明 (73e92ca, b76fc23)
- 折叠态从 200x72 缩小到 64x64 正方形
- 播放中半透明 (opacity: 0.6)，鼠标悬浮恢复不透明
- 悬浮按钮缩小到 24x24
- hover-bar 使用绝对定位，超出窗口显示（透明窗口特性）
- 同步更新 electron/main.ts 常量

### 3. 展开/收起动画 (a5f3f1d, 558f3be)
- 展开：0.25s 缩放+淡入 (scale 0.3→1, opacity 0→1)
- 收起：0.2s 反向动画
- 动画期间禁用交互 (pointerEvents: none)
- 动画状态机：animating state 管理 expand/collapse/null

### 4. 面板智能自适应 (80fd72a)
- 展开时根据屏幕空间计算合适尺寸
- 用户 resize 后记住尺寸，下次展开恢复
- 展开位置以缩略图中心为锚点，避免超出屏幕

### 5. 加载 Spinner (f3aa292)
- 添加按钮加载时显示 CSS spinner 动画 + "加载中" 文字

## 验证

- [x] `npx tsc --noEmit` 通过
- [x] `npm run build` 通过
- [ ] 手动测试：启动 npm run dev，测试折叠/展开动画、半透明、spinner、进度条美化

## 涉及文件

| 文件 | 改动 |
|------|------|
| `FloatingPlayer.tsx` | 动画状态、常量、展开逻辑、className |
| `FloatingPlayer.css` | 动画 keyframes、64x64 折叠态、半透明、按钮布局 |
| `ExpandedPanel.tsx` | 按钮 spinner、音量滑杆 CSS 变量 |
| `panel.css` | spinner 样式 |
| `controls.css` | range 美化 |
| `electron/main.ts` | THUMB 常量同步 |

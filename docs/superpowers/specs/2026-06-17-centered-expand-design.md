# 展开面板居中展开设计

## 问题

展开面板（expanded）时，窗口左上角位置不变，仅改变大小。这导致：
- 折叠窗出现在展开页原本的左上角位置，交互不自然
- 用户需要再次拖动窗口才能回到合适位置

## 目标

折叠悬浮窗原地展开——展开面板的顶部中心对齐折叠悬浮窗的顶部中心，视觉上悬浮窗"向下展开"。

## 设计

### 展开位置计算

```
collapsedPos  = 展开前保存的窗口位置 (x, y)
expandedSize  = 用户保存的展开尺寸 (width, height)

thumbCenterX  = collapsedPos.x + COLLAPSED_W / 2    // 悬浮窗圆球水平中心
expandedX     = thumbCenterX - expandedSize.width / 2 // 展开窗口 left
expandedY     = collapsedPos.y                         // 展开窗口 top 不变
```

### 实现

仅修改 `src/components/floating-player/FloatingPlayer.tsx` 中已有的展开/折叠 `useEffect`：

展开时，在 `windowResize` 之前先调用 `windowMove` 计算新位置。折叠时，配合之前添加的 `collapsedPosRef` 回到折叠位置。

### 与已有改动的关系

本次改动叠加在之前"记忆折叠位置"修复之上：
- 展开时：计算居中位置并移动 + 保存当前（折叠）位置到 ref
- 折叠时：从 ref 读取位置并移回

两个改动自然配合，交互闭环。

### 边界情况

- 初次展开：collapsedPosRef 为空，展开期间 `window.getPosition()` 保存当前位置
- 屏幕边缘：窗口默认在右下角，居中展开后基本不会超出左边界
- 多次展开/折叠：每次展开都重新计算位置，状态一致

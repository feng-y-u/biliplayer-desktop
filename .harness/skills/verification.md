# 验证方法

对应规则 #9：验证通过再报告完成。

## 验证步骤

### 1. 类型检查

```bash
npx tsc --noEmit
```

通过 = 退出码 0，无错误输出。

### 2. 构建验证（重大变更时）

```bash
npm run build
```

通过 = `dist/` 和 `dist-electron/` 生成成功。

### 3. 手动测试

核心流程：
- [ ] `npm run dev` 启动成功
- [ ] 加载收藏夹正常
- [ ] 播放音频正常
- [ ] 切歌正常
- [ ] 收藏操作正常

### 4. 记录验证结果

写入 `changes/<date>-<topic>/verification.md`，包含：
- tsc 输出
- build 日志（如有）
- 手动测试步骤和结果

## 完成报告格式

见 `templates/verification-report.md`

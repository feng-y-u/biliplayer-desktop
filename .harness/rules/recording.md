# 记录规则（防忘记上下文）

### 规则 11：每次变更建文件夹记录

**描述**：每次变更在 `changes/` 下建一个文件夹，记录做了什么。

**验证方式**：看目录。

**文件夹格式**：`changes/<YYYY-MM-DD>-<简短描述>/`

**每个文件夹至少包含**：
- `README.md`：做了什么、改了哪些文件
- `verification.md`：验证结果（可选但推荐）

**示例**：
```
changes/
├── 2025-01-15-fix-drag/
│   ├── README.md
│   └── verification.md
├── 2025-01-16-add-favorites/
│   ├── README.md
│   └── verification.md
```

### 规则 12：新会话先读 agent-owner.md

**描述**：新会话第一句，先读 `agent-owner.md`。

**验证方式**：确认 agent 知道项目规则。

**原因**：
- 避免重复说明项目背景
- 确保 agent 遵循 12 条核心规则
- 防止上下文丢失导致的错误

**执行方式**：
```
用户：先读 .harness/agent-owner.md，然后...
```

# 协议规则（防接口对不上）

### 规则 3：API 格式保持一致

**描述**：API 请求/响应格式必须和现有代码保持一致。

**验证方式**：跑一下真实接口，确认返回格式正确。

**现有格式**：
```typescript
// 请求
{ type: 'GET_VIDEO_INFO', bvid: string }
{ type: 'GET_PLAYLIST', url: string }
{ type: 'GET_AUDIO_URL', bvid: string, cid: number }

// 响应
{ success: true, data: any }
{ success: false, error: string }
```

**检查点**：
- 新消息类型遵循相同格式
- 响应包含 `success` 字段
- 错误信息是字符串

### 规则 4：修改接口必须同步文档

**描述**：修改 IPC 接口时，同步更新 README 或 AGENTS.md。

**验证方式**：人工检查文档是否反映了接口变更。

**需更新的文档**：
- `AGENTS.md` 的 "IPC contract" 章节
- `CLAUDE.md` 的 "IPC contract" 章节（如有）
- `.harness/references/index.md` 的 API 参考

# MD Pro 扩展测试指南

## 问题描述
导出时出现 "Could not establish connection. Receiving end does not exist" 错误。

## 修复内容
1. **Background Script 错误处理**：添加了 try-catch 包装消息发送
2. **自动重试机制**：如果消息发送失败，自动重新注入 content script 并重试
3. **Content Script 改进**：添加了异步响应支持和更好的错误处理
4. **调试日志**：添加了控制台日志以便调试

## 测试步骤

### 1. 重新构建扩展
```bash
npm run build
```

### 2. 重新加载扩展
1. 打开 Chrome 扩展管理页面 (chrome://extensions/)
2. 找到 MD Pro 扩展
3. 点击刷新按钮重新加载

### 3. 测试导出功能
1. 打开任意网页（如博客文章）
2. 尝试以下方式触发导出：
   - 右键菜单 → "导出为 Markdown"
   - 快捷键 Ctrl+Shift+Y (Windows) 或 Cmd+Shift+Y (Mac)
   - 点击扩展图标

### 4. 检查控制台
1. 按 F12 打开开发者工具
2. 查看 Console 标签页
3. 应该能看到 "MD Pro content script loaded" 日志
4. 导出时应该能看到 "Received export request" 日志

### 5. 验证修复
- 如果仍然出现连接错误，检查控制台是否有重试日志
- 导出应该能正常完成，不再出现 "Could not establish connection" 错误

## 故障排除

### 如果问题仍然存在：
1. 检查 manifest.json 中的 content_scripts 配置
2. 确认页面允许 content script 注入
3. 检查是否有其他扩展冲突
4. 尝试在隐私模式下测试

### 调试信息：
- Background script 错误会显示在扩展的 service worker 控制台
- Content script 错误会显示在页面的控制台
- 网络请求错误会显示在 Network 标签页
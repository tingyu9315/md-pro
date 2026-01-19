# MD Pro

将博客文章一键转换为 Markdown（含图片），Chrome 扩展（MV3 + TypeScript + Vite）。

## 功能
- 正文提取（Readability 兜底）
- Turndown 转 Markdown + Frontmatter 元数据
- 图片处理：内联或 ZIP（.md + assets）
- 触发方式：弹窗、右键菜单、快捷键（Command/Ctrl+Shift+Y）
- Options：导出策略、文件名模板、移除 UTM 参数

## 开发
```bash
npm i
npm run dev
```
在 Chrome → 扩展程序 → 加载已解压 → 选择当前项目目录进行调试。

## 构建
```bash
npm run build
npm run zip
```
生成 `dist/` 与 `md-pro.zip`。

## 使用
- 在文章页点击扩展图标或使用快捷键/右键菜单
- 在 Options 页面选择导出策略

## 权限
最小化申请。抓取图片时按需请求对应域名的 `host_permissions`。

## 发布
- 确认 `manifest.json`、图标素材、截图与描述
- 在开发者后台上传 `md-pro.zip`

## 许可
MIT
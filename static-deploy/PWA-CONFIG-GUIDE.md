# PWA配置问题解决指南

## 问题描述

旧版本在 Safari 浏览器与“添加到主屏幕”的 PWA 模式之间切换时，由于使用浏览器 `localStorage` 持久化配置，导致 PWA 模式无法读取到 GitHub 与图床设置，从而出现“图片上传失败：仓库不存在或权限不足，请检查配置”的错误提示。

## 问题原因

iOS 出于安全考虑，会为 Safari 与 PWA 分配完全独立的存储空间，`localStorage`、`IndexedDB` 等数据互不共享。因此，当配置仅保存在浏览器端时，PWA 启动后无法访问这些信息。

## 解决方案

当前版本已改为使用 **构建时注入的环境变量** 提供仓库与图床配置，彻底规避了存储隔离问题，无论在 Safari 还是 PWA 模式下都能读取到相同的配置。

### 1. 环境变量统一配置
- 在 Vercel 或本地 `.env.local` 中设置以下变量：
  - `MARKDOWN_EDITOR_GITHUB_TOKEN` / `MARKDOWN_EDITOR_GITHUB_OWNER` / `MARKDOWN_EDITOR_GITHUB_REPO`
  - `MARKDOWN_EDITOR_IMAGE_TOKEN` / `MARKDOWN_EDITOR_IMAGE_OWNER` / `MARKDOWN_EDITOR_IMAGE_REPO`
  - 可选：`MARKDOWN_EDITOR_IMAGE_BRANCH`、`MARKDOWN_EDITOR_IMAGE_DIR`、`MARKDOWN_EDITOR_IMAGE_LINK_RULE`
- 执行 `npm run build`，由 `scripts/generate-runtime-config.js` 生成 `static-deploy/js/runtime-config.js`

### 2. 运行时只读配置
- 应用启动时直接读取 `window.RuntimeConfig`，无需本地表单交互
- 同一份配置同时适用于浏览器与 PWA，避免重复输入与潜在偏差

### 3. 改进的错误提示
当检测到环境变量缺失时，界面会提示：
- PWA 模式：`图床配置缺失，请在部署环境变量中提供图床仓库信息`
- 浏览器模式：`图床配置缺失，请检查部署环境变量`

## 使用步骤

### 部署 / 生产环境
1. 在部署平台填入上述环境变量
2. 配置构建命令 `npm run build`，输出目录 `static-deploy`
3. 发布后即可在浏览器与 PWA 中直接使用上传功能

### 本地调试
1. 在根目录创建 `.env.local` 并填入同样的环境变量
2. 运行 `npm run build && npm start`
3. 访问 `http://localhost:8080/index.html` 或“添加到主屏幕”进行测试

## 注意事项

1. **Token 安全**：环境变量中包含的 Token 不会写入仓库，但仍需妥善保管
2. **变量变更**：更新环境变量后请重新执行 `npm run build`
3. **离线模式**：PWA 离线时暂不可上传，需在联网状态下使用
4. **主屏幕图标**：如需自定义图标，请按下方步骤生成资源

### 自定义主屏幕图标

1. 将原始图片（建议 1024×1024 以上）保存到 `static-deploy/img/icons/source.JPG`
2. 运行 `sips` 或其他图像工具生成需要的尺寸：
   ```bash
   sips -z 180 180 static-deploy/img/icons/source.JPG --out static-deploy/img/icons/apple-touch-icon.png
   sips -z 192 192 static-deploy/img/icons/source.JPG --out static-deploy/img/icons/icon-192.png
   sips -z 512 512 static-deploy/img/icons/source.JPG --out static-deploy/img/icons/icon-512.png
   cp static-deploy/img/icons/icon-512.png static-deploy/img/icons/icon-512-maskable.png
   ```
3. 在 `index.html` 的 `<head>` 中加入：
   ```html
   <link rel="apple-touch-icon" sizes="180x180" href="./img/icons/apple-touch-icon.png">
   <link rel="manifest" href="./site.webmanifest">
   ```
4. 确保 `static-deploy/site.webmanifest` 的 `icons` 数组指向以上文件
5. 在 iOS Safari 中清除旧的图标缓存（设置 → Safari → 清除历史记录与网站数据），重新“添加到主屏幕”即可看到新图标

## 测试页面

访问 `/test-pwa-config.html` 可以测试PWA模式检测功能：
- 查看当前运行模式
- 检查环境变量注入结果
- 验证缺失配置时的提示信息
- 清除/设置测试数据

## 常见问题

**Q: Safari 和 PWA 还需要分别配置吗？**
A: 不需要，配置来自统一的环境变量，浏览器与 PWA 会读取同一份 `runtime-config`。

**Q: 环境变量存储是否安全？**
A: Token 只存在于部署平台的环境变量中，构建时注入前端，最终文件不会回写到仓库，请勿泄露部署后台权限。

**Q: 如何调整仓库或图床配置？**
A: 修改环境变量后重新部署（或本地执行 `npm run build`），生成的 `runtime-config.js` 会自动更新。

**Q: PWA 模式有什么优势？**
A: PWA 提供更接近原生的体验，包括全屏显示、独立图标以及有限的离线缓存能力。

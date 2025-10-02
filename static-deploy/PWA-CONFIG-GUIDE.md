# PWA配置问题解决指南

## 问题描述

当你在Safari浏览器中使用网站时，图片上传功能正常工作。但是当你将网站"添加到主屏幕"并从主屏幕打开应用时，会出现"图片上传失败：仓库不存在或权限不足，请检查配置"的错误。

## 问题原因

这是iOS的安全机制导致的：

1. **不同的存储空间**: PWA模式（保存到主屏幕）和Safari浏览器使用完全不同的localStorage存储空间
2. **配置隔离**: 在Safari中保存的配置信息无法在PWA模式下访问
3. **安全考虑**: 这是为了防止不同应用之间的数据泄露

## 解决方案

我们已经实现了以下解决方案：

### 1. 自动检测PWA模式
- 应用启动时自动检测是否运行在PWA模式
- 如果检测到配置缺失，会自动提示用户

### 2. PWA配置提醒对话框
当在PWA模式下检测到配置缺失时，会显示友好的提醒对话框：
```
PWA模式下需要重新配置。这是因为PWA和浏览器使用不同的存储空间。是否现在配置？
```

### 3. 快速配置功能
- 在PWA模式下且未配置时，工具栏会显示一个彩色的"魔法棒"按钮
- 点击后只需输入GitHub Token，其他配置会自动填入
- 使用预设的仓库信息，简化配置过程

### 4. 改进的错误提示
图片上传失败时会显示更明确的错误信息：
- PWA模式：`图床未配置，PWA模式下需要重新配置GitHub仓库信息`
- 浏览器模式：`图床未配置，请先配置GitHub仓库信息`

## 使用步骤

### 在PWA模式下首次配置：

1. **自动提醒**: 应用启动后会自动检测并显示配置提醒
2. **快速配置**: 点击工具栏的彩色魔法棒按钮
3. **输入Token**: 只需输入你的GitHub Personal Access Token
4. **自动完成**: 其他配置信息会自动填入

### 手动配置：

1. 点击工具栏的图片按钮（相机图标）
2. 在配置对话框中填入完整信息：
   - GitHub Token
   - 仓库所有者
   - 仓库名称
   - 分支名称
   - 图片目录

## 预设配置信息

快速配置使用以下预设信息：
- **仓库所有者**: SUNSIR007
- **图片仓库**: picx-images-hosting
- **分支**: master
- **图片目录**: images
- **CDN规则**: jsdelivr

## 技术实现

### PWA检测代码
```javascript
const isPWA = window.navigator.standalone === true || 
              window.matchMedia('(display-mode: standalone)').matches;
```

### 配置检查
```javascript
const hasImageConfig = localStorage.getItem('image-service-config');
const hasGitHubConfig = localStorage.getItem('github-config');
```

## 注意事项

1. **Token安全**: 请妥善保管你的GitHub Personal Access Token
2. **权限设置**: 确保Token有足够的权限访问目标仓库
3. **网络连接**: 图片上传需要稳定的网络连接
4. **存储隔离**: PWA和浏览器的配置是完全独立的，需要分别配置
5. **主屏幕图标**: 如需自定义图标，请在 `static-deploy/img/icons/` 下放置素材，并按照下方步骤生成 `apple-touch-icon.png`、`icon-192.png`、`icon-512.png` 与 `icon-512-maskable.png`

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
- 检查配置状态
- 测试配置对话框
- 清除/设置测试配置

## 常见问题

**Q: 为什么Safari和PWA需要分别配置？**
A: 这是iOS的安全机制，不同应用使用独立的存储空间，无法共享数据。

**Q: 快速配置安全吗？**
A: 是的，配置信息只保存在本地localStorage中，不会发送到其他服务器。

**Q: 可以修改预设的仓库信息吗？**
A: 可以，你可以使用手动配置功能设置自己的仓库信息。

**Q: PWA模式有什么优势？**
A: PWA模式提供更接近原生应用的体验，包括全屏显示、离线缓存等功能。

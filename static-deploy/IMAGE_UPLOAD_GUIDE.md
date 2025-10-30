# 图床功能使用指南

本项目已集成强大的图床功能，支持将图片上传到GitHub仓库并通过多种CDN服务访问。

## 🚀 功能特性

### 📸 图片上传方式
- **拖拽上传**：直接将图片拖拽到编辑器区域
- **粘贴上传**：复制图片后在编辑器中粘贴（Ctrl+V）
- **按钮上传**：点击工具栏的上传按钮选择文件
- **批量上传**：支持同时上传多张图片

### 🌐 CDN服务支持
- **jsDelivr**：`https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}`
- **Statically**：`https://cdn.statically.io/gh/{owner}/{repo}/{branch}/{path}`
- **GitHub原始链接**：`https://github.com/{owner}/{repo}/raw/{branch}/{path}`
- **中国jsDelivr**：`https://jsd.cdn.zzko.cn/gh/{owner}/{repo}@{branch}/{path}`

### 🛠️ 图片处理功能
- **自动压缩**：大于500KB的图片自动压缩
- **格式支持**：JPEG、PNG、GIF、WebP
- **文件名处理**：自动添加时间戳和哈希值避免冲突
- **目录组织**：按年月自动组织目录结构

## 📋 配置步骤

### 1. 创建图床仓库
建议创建一个专门的图床仓库，与博客仓库分开管理：

```bash
# 在GitHub上创建新仓库，例如：your-username/image-hosting
```

### 2. 获取GitHub Token
1. 访问 [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 设置Token名称，如 "Image Hosting"
4. 选择权限：勾选 `repo` (完整仓库权限)
5. 点击 "Generate token" 并复制Token

### 3. 配置图床服务（部署阶段）
在部署平台或本地 `.env.local` 中写入以下变量（未显式设置时会自动复用 GitHub 配置）：

- `MARKDOWN_EDITOR_IMAGE_TOKEN`：图床仓库使用的 Token
- `MARKDOWN_EDITOR_IMAGE_OWNER`：图床仓库拥有者
- `MARKDOWN_EDITOR_IMAGE_REPO`：图床仓库名
- `MARKDOWN_EDITOR_IMAGE_BRANCH`：上传目标分支（默认 `main`）
- `MARKDOWN_EDITOR_IMAGE_DIR`：图片根目录（默认 `images`）
- `MARKDOWN_EDITOR_IMAGE_LINK_RULE`：CDN 规则标识（默认 `jsdelivr`）

保存变量后执行 `npm run build` 生成更新的 `static-deploy/js/runtime-config.js`。

## 🎯 使用方法

### 方法一：拖拽上传
1. 在文件管理器中选择图片
2. 直接拖拽到编辑器区域
3. 等待上传完成，Markdown链接自动插入

### 方法二：粘贴上传
1. 复制图片到剪贴板（截图、复制文件等）
2. 在编辑器中按 `Ctrl+V` 粘贴
3. 图片自动上传并插入链接

### 方法三：按钮上传
1. 点击编辑器工具栏的上传按钮
2. 选择一张或多张图片
3. 等待上传完成

## 📁 目录结构

图片会按以下结构存储：

```
images/
├── 2024/
│   ├── 01/
│   │   ├── screenshot-abc123.png
│   │   └── photo-def456.jpg
│   └── 02/
│       └── diagram-ghi789.png
└── 2025/
    └── 01/
        └── image-jkl012.webp
```

## 🔗 链接格式

上传成功后会自动插入Markdown格式的图片链接：

```markdown
![filename](https://cdn.jsdelivr.net/gh/username/image-hosting@main/images/2024/01/screenshot-abc123.png)
```

## ⚙️ 高级配置

### 自定义压缩设置
可以在 `image-service.js` 中修改压缩参数：

```javascript
// 修改压缩质量（0-1）
quality: 0.8

// 修改最大宽度
maxWidth: 1920

// 修改压缩阈值
if (file.size > 500 * 1024) // 500KB
```

### 自定义CDN规则
可以添加自定义CDN服务：

```javascript
this.linkRules['CustomCDN'] = {
    id: 'custom',
    name: '自定义CDN',
    rule: 'https://your-cdn.com/{owner}/{repo}/{branch}/{path}',
    editable: true
}
```

## 🚨 注意事项

1. **仓库分离**：建议使用专门的图床仓库，不要与博客仓库混用
2. **Token安全**：通过环境变量注入 Token，避免将 `.env.local` 或生成的 `runtime-config.js`（含敏感值）提交到仓库
3. **文件大小**：单个文件不超过10MB
4. **CDN缓存**：jsDelivr等CDN服务有缓存，更新可能需要等待
5. **网络环境**：国内访问jsDelivr可能较慢，可选择中国jsDelivr
6. **变量更新**：调整环境变量后需重新执行 `npm run build` 以刷新运行时配置

## 🧪 测试功能

访问 `test-image-upload.html` 可以测试图片上传功能：

1. 确认相关环境变量已设置并执行 `npm run build`
2. 打开测试页面
3. 上传图片
4. 查看返回的链接与调试信息

## 🔧 故障排除

### 上传失败
- 检查GitHub Token是否有效
- 确认仓库名称和权限设置
- 检查网络连接

### 图片无法显示
- 确认CDN链接是否正确
- 检查图片文件是否存在
- 尝试更换CDN服务

### 配置缺失
- 确认部署环境变量填写正确并重新执行 `npm run build`
- 检查生成的 `static-deploy/js/runtime-config.js` 是否包含最新值（勿提交到仓库）

## 📞 技术支持

如遇问题，请检查：
1. 浏览器控制台错误信息
2. GitHub仓库权限设置
3. 网络连接状态

---

**享受便捷的图片上传体验！** 🎉

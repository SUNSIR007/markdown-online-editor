# 增强版 Markdown 编辑器
dachexiao1
一个功能强大的在线Markdown编辑器，专为博客和随笔写作而设计，集成GitHub发布功能。

## ✨ 主要功能

### 🎯 内容类型管理
- **通用文档**: 普通的Markdown文档
- **博客文章**: 自动生成包含标题、分类、发布日期、描述的YAML frontmatter
- **随笔**: 包含标题、发布日期、心情、描述的个人随笔格式

### 📝 强大的编辑器
- 基于Vditor的分屏预览编辑器
- 默认分屏模式，实时预览功能
- 丰富的工具栏
- 支持表格、代码块、数学公式等
- 自动保存到本地缓存
- 🌙 **暗夜模式支持**：一键切换亮色/暗色主题

### 📸 图床功能
- **多种上传方式**：拖拽、粘贴、按钮上传
- **CDN加速**：支持jsDelivr、Statically等多种CDN服务
- **自动压缩**：智能压缩大图片，节省存储空间
- **批量上传**：支持同时上传多张图片
- **自动插入**：上传完成自动插入Markdown图片链接
- **独立仓库**：支持使用专门的图床仓库，与博客分离

### 🚀 GitHub集成
- 一键发布到GitHub仓库
- **支持Astro项目结构**：
  - 博客文章发布到 `src/content/posts/`
  - 随笔发布到 `src/content/essays/`
- 支持创建和更新文件
- 自动生成合适的文件路径和提交消息
- 支持Jekyll、Hugo、Astro等静态站点生成器

## 🚀 快速开始

### 1. 打开编辑器
访问 `index.html` 查看主页，然后点击"开始写作"进入编辑器。

### 2. 配置部署环境（必需）
发布与图床功能均依赖构建时注入的环境变量，请在 Vercel 项目或本地 `.env` 文件中设置：

- `MARKDOWN_EDITOR_GITHUB_TOKEN`：GitHub Personal Access Token（至少具备 `repo` 范围）
- `MARKDOWN_EDITOR_GITHUB_OWNER`：目标仓库的拥有者（用户名或组织名）
- `MARKDOWN_EDITOR_GITHUB_REPO`：用于发布内容的仓库名
- `MARKDOWN_EDITOR_IMAGE_TOKEN`（可选）：图床仓库 Token，默认复用 `MARKDOWN_EDITOR_GITHUB_TOKEN`
- `MARKDOWN_EDITOR_IMAGE_OWNER`（可选）：图床仓库拥有者，默认复用 GitHub 配置
- `MARKDOWN_EDITOR_IMAGE_REPO`（可选）：图床仓库名，默认与内容仓库一致
- `MARKDOWN_EDITOR_IMAGE_BRANCH`（可选）：图床分支，默认 `main`
- `MARKDOWN_EDITOR_IMAGE_DIR`（可选）：图床根目录，默认 `images`
- `MARKDOWN_EDITOR_IMAGE_LINK_RULE`（可选）：CDN 规则，默认 `jsdelivr`

完成变量配置后执行 `npm run build` 将其写入 `static-deploy/js/runtime-config.js`，再运行 `npm start` 预览。

### 3. 本地调试（可选）
- 在根目录创建 `.env.local` 并填充上述变量
- 运行 `npm run build && npm start`
- 访问 `http://localhost:8080/index.html` 验证仓库与图床功能

### 4. 开始写作

1. **选择内容类型**
   - 点击顶部的按钮选择：通用文档、博客文章或随笔

2. **编辑元数据**（博客和随笔）
   - 点击"编辑元数据"设置标题、分类、发布日期等信息

3. **编写内容**
   - 在编辑器中编写Markdown内容
   - 支持实时预览

4. **插入图片**（如已配置图床）
   - **拖拽上传**：直接将图片拖拽到编辑器
   - **粘贴上传**：复制图片后按Ctrl+V粘贴
   - **按钮上传**：点击工具栏上传按钮选择文件
   - 上传完成后自动插入Markdown图片链接

5. **发布到GitHub**
   - 点击"发布到GitHub"将内容推送到仓库
   - 系统会自动生成合适的文件路径和YAML frontmatter

## 📂 文件结构

发布的文件会按以下结构组织（适配Astro项目）：

```
your-astro-blog/
├── src/content/
│   ├── posts/        # 博客文章
│   │   └── 2024-01-01-article-title.md
│   └── essays/       # 随笔
│       └── 2024-01-01-essay-title.md
└── docs/             # 通用文档
    └── document-title.md
```

## 🎨 YAML Frontmatter 格式

### 博客文章
```yaml
---
title: "文章标题"
categories: ["技术", "教程"]
date: "2024-01-01 12:00:00"
description: "文章描述"
---
```

### 随笔
```yaml
---
title: "随笔标题"
date: "2024-01-01 12:00:00"
mood: "愉快"
description: "随笔描述"
---
```

## 🔧 技术栈

- **前端框架**: Vue.js 2.x
- **UI组件**: Element UI
- **编辑器**: Vditor
- **API集成**: GitHub REST API
- **存储**: localStorage（草稿缓存）

## 🎨 主题功能

### 暗夜模式
- 点击右上角的 🌙/☀️ 按钮切换主题
- 自动保存主题偏好设置
- 编辑器和预览都会同步切换主题

## 📱 响应式设计

编辑器完全支持移动设备：
- 自适应布局
- 触摸友好的界面
- 移动端优化的工具栏

## 🔒 安全说明

- GitHub Token 存放于部署平台的环境变量中，构建时注入前端，不会写入仓库
- 本地调试可通过 `.env.local` + `npm run build` 生成运行时配置，请避免提交敏感文件
- 仍建议将 Token 权限限制在 `repo` 所需范围内

## 🚀 部署到Vercel

1. 将仓库推送到 GitHub
2. 在 Vercel 中导入项目
3. 设置 Environment Variables（同上表）
4. 配置构建命令：Build Command `npm run build`，Output Directory `static-deploy`
5. 发起部署，Vercel 会在构建阶段生成 `js/runtime-config.js`

## 📝 使用示例

### 写博客文章
1. 选择"博客文章"类型
2. 编辑元数据：设置标题、分类等
3. 编写文章内容
4. 发布到GitHub的`_posts`目录

### 写随笔
1. 选择"随笔"类型
2. 编辑元数据：设置标题、心情等
3. 编写随笔内容
4. 发布到GitHub的`src/content/essays`目录

### 使用暗夜模式
1. 点击右上角的 🌙 按钮切换到暗夜模式
2. 点击 ☀️ 按钮切换回亮色模式
3. 主题设置会自动保存到本地

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

---

**享受写作的乐趣！** ✨

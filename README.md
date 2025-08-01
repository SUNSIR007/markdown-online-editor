# 增强版 Markdown 编辑器

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

### 2. 配置GitHub（可选）
如果要使用发布功能，需要配置GitHub：

1. 获取GitHub Personal Access Token
   - 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - 创建新token，确保有`repo`权限

2. 在编辑器中点击"配置GitHub"
3. 填写以下信息：
   - **Personal Token**: 你的GitHub token
   - **仓库所有者**: GitHub用户名或组织名
   - **仓库名称**: 目标仓库名称

4. 点击"测试连接"验证配置
5. 保存配置

### 3. 开始写作

1. **选择内容类型**
   - 点击顶部的按钮选择：通用文档、博客文章或随笔

2. **编辑元数据**（博客和随笔）
   - 点击"编辑元数据"设置标题、分类、发布日期等信息

3. **编写内容**
   - 在编辑器中编写Markdown内容
   - 支持实时预览

4. **发布到GitHub**
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
- **存储**: localStorage（配置和缓存）

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

- GitHub token仅存储在浏览器本地
- 不会发送到任何第三方服务器
- 建议使用最小权限的token（仅repo权限）

## 🚀 部署到Vercel

1. 将所有文件上传到GitHub仓库
2. 在Vercel中导入仓库
3. 设置构建命令为空（静态文件）
4. 部署完成

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

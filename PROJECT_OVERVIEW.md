# Markdown Online Editor - 项目详解

这是一个基于 Web 的在线 Markdown 编辑器，深度集成了 GitHub API，旨在为静态博客（如 Hugo, Hexo, Astro 等）提供一个轻量级、无需后端的 CMS（内容管理系统）解决方案。

## 1. 核心功能

-   **GitHub 集成**：直接读写 GitHub 仓库中的文件，无需自建后端服务器。
-   **在线编辑**：使用 Vditor 编辑器，支持所见即所得（WYSIWYG）、即时渲染（IR）和分屏预览（SV）模式。
-   **图床服务**：支持将图片上传到指定的 GitHub 仓库，自动生成 jsDelivr 或 GitHub Raw CDN 链接。
-   **智能压缩**：内置图片压缩功能（基于 Canvas），在上传前自动压缩图片以节省带宽和存储。
-   **PWA 支持**：支持安装为桌面/移动端应用，提供原生应用般的体验。
-   **多内容类型**：预设 Blog、Essay、Gallery 等多种内容类型，自动处理 Frontmatter 元数据。

## 2. 技术栈

-   **核心框架**：[Vue.js 2.x](https://v2.vuejs.org/) (CDN 引入，无构建步骤)
-   **UI 组件库**：[Element UI](https://element.eleme.io/)
-   **编辑器内核**：[Vditor](https://b3log.org/vditor/)
-   **API 交互**：原生 `fetch` API (封装在 `github-service.js` 和 `image-service.js`)
-   **构建工具**：Node.js (仅用于生成运行时配置)
-   **部署平台**：Vercel (推荐) / 任何静态文件服务器

## 3. 项目结构

```
.
├── static-deploy/          # 核心源代码目录 (部署时的根目录)
│   ├── index.html          # 入口文件
│   ├── js/
│   │   ├── app.js          # Vue 主应用逻辑
│   │   ├── config.js       # 应用配置 (内容类型、元数据字段)
│   │   ├── editor-manager.js # Vditor 编辑器初始化与管理
│   │   ├── image-handler.js  # 图片上传 UI 交互逻辑
│   │   └── mobile-utils.js   # 移动端适配工具
│   ├── github-service.js   # GitHub API 封装 (文件 CRUD)
│   ├── image-service.js    # 图片上传与压缩服务
│   ├── css/                # 样式文件
│   └── img/                # 图标与静态资源
├── scripts/
│   └── generate-runtime-config.js # 构建脚本 (注入环境变量)
├── public/                 # 构建输出目录 (由脚本生成)
├── vercel.json             # Vercel 部署配置
├── package.json            # 项目依赖与脚本
└── LOCAL_DEVELOPMENT.md    # 本地开发指南
```

## 4. 关键模块解析

### 4.1 GitHub Service (`github-service.js`)
这是一个纯前端的 GitHub API 客户端。它封装了 REST API 调用，支持：
-   `getFile`: 获取文件内容（自动处理 Base64 解码）。
-   `createOrUpdateFile`: 创建或更新文件（自动处理 Base64 编码和中文兼容）。
-   `publishContent`: 根据内容类型（Blog/Essay）自动生成文件路径和文件名。

### 4.2 Image Service (`image-service.js`)
负责处理图片上传的全流程：
1.  **验证**：检查文件类型和大小。
2.  **压缩**：使用 Canvas API 在浏览器端进行有损压缩，支持智能缩放。
3.  **上传**：将处理后的图片上传到 GitHub 仓库。
4.  **CDN 链接**：根据配置生成 jsDelivr、Statically 或 GitHub Raw 的访问链接。

### 4.3 运行时配置 (`scripts/generate-runtime-config.js`)
由于这是一个纯静态应用，为了保护 Token 不被硬编码在源码中，项目采用"运行时注入"的策略：
1.  在 Vercel 等平台设置环境变量（`MARKDOWN_EDITOR_GITHUB_TOKEN` 等）。
2.  构建时，Node.js 脚本读取这些环境变量。
3.  生成一个 `runtime-config.js` 文件，将配置注入到 `window.RuntimeConfig` 对象中。
4.  前端代码在启动时读取 `window.RuntimeConfig`。

## 5. 数据流向

1.  **用户登录**：应用启动时检查 `window.RuntimeConfig` 或本地存储的 Token。
2.  **加载内容**：用户通过 URL 参数（如 `?edit=path/to/file.md`）请求编辑，应用调用 GitHub API 获取文件。
3.  **编辑内容**：用户在 Vditor 中编辑 Markdown，Vditor 实时渲染。
4.  **上传图片**：用户粘贴或拖拽图片 -> `image-handler.js` 拦截 -> `image-service.js` 压缩并上传 -> 返回 Markdown 图片语法插入编辑器。
5.  **发布/保存**：用户点击发布 -> `app.js` 收集元数据和正文 -> `github-service.js` 提交 Commit 到 GitHub 仓库。
6.  **自动部署**：GitHub 仓库收到 Commit 后，触发你博客的 CI/CD（如 GitHub Actions 或 Vercel）重新构建博客网站。

## 6. 扩展与定制

-   **添加新的内容类型**：修改 `static-deploy/js/config.js` 中的 `contentTypes` 和 `metadataFields`。
-   **修改样式**：主要样式位于 `static-deploy/css/` 目录，支持暗色模式。
-   **自定义图床**：可以在 `image-service.js` 中添加新的 CDN 规则。

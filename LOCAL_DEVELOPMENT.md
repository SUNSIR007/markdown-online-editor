# 本地运行指南

要在本地运行和测试此项目，请按照以下步骤操作：

## 1. 环境准备

确保你的电脑上安装了：
-   [Node.js](https://nodejs.org/) (v14+)
-   [Python 3](https://www.python.org/) (用于本地服务器)

## 2. 配置 GitHub Token

本项目需要 GitHub Token 来读取和写入文件。

1.  访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)。
2.  生成一个新的 Token (Classic)，勾选 `repo` 权限（如果需要操作私有仓库）。
3.  复制生成的 Token。

## 3. 启动方式

### 方法 A：使用辅助脚本 (推荐)

1.  打开 `start-local.sh` 文件。
2.  修改以下变量为你自己的信息：
    ```bash
    export MARKDOWN_EDITOR_GITHUB_TOKEN="你的Token"
    export MARKDOWN_EDITOR_GITHUB_OWNER="你的GitHub用户名"
    export MARKDOWN_EDITOR_GITHUB_REPO="你的仓库名"
    ```
3.  在终端运行：
    ```bash
    ./start-local.sh
    ```

### 方法 B：手动运行

1.  设置环境变量并构建配置：
    ```bash
    export MARKDOWN_EDITOR_GITHUB_TOKEN="你的Token"
    export MARKDOWN_EDITOR_GITHUB_OWNER="你的GitHub用户名"
    export MARKDOWN_EDITOR_GITHUB_REPO="你的仓库名"
    
    npm run build
    ```

2.  启动服务：
    ```bash
    npm start
    ```

3.  浏览器访问 [http://localhost:8080](http://localhost:8080)。

## 4. 测试

-   **加载文件**：在 URL 中添加 `?edit=src/content/posts/your-post.md` 来测试编辑功能。
-   **上传图片**：拖拽图片到编辑器或使用工具栏上传按钮，测试图床功能。

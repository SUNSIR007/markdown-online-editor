#!/bin/bash

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 Python3
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 设置环境变量
# 请在下方填入你的 GitHub Token 和仓库信息
# 你可以在 https://github.com/settings/tokens 申请一个新的 Token (需要 repo 权限)
export MARKDOWN_EDITOR_GITHUB_TOKEN="your_github_token_here"
export MARKDOWN_EDITOR_GITHUB_OWNER="your_github_username"
export MARKDOWN_EDITOR_GITHUB_REPO="your_repo_name"

# 可选：配置图床信息（如果不配置，默认使用上面的 GitHub 仓库）
# export MARKDOWN_EDITOR_IMAGE_TOKEN="your_image_token"
# export MARKDOWN_EDITOR_IMAGE_OWNER="your_image_owner"
# export MARKDOWN_EDITOR_IMAGE_REPO="your_image_repo"
# export MARKDOWN_EDITOR_IMAGE_BRANCH="main"
# export MARKDOWN_EDITOR_IMAGE_DIR="images"

# 检查是否已配置 Token
if [ "$MARKDOWN_EDITOR_GITHUB_TOKEN" = "your_github_token_here" ]; then
    echo "请先编辑 start-local.sh 文件，填入你的 GitHub Token 和仓库信息"
    exit 1
fi

echo "正在生成运行时配置..."
npm run build

echo "正在启动本地服务器..."
echo "请访问 http://localhost:8080"
npm start

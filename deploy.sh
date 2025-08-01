#!/bin/bash

# BlogWriter 部署脚本

echo "🚀 开始部署 BlogWriter 到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请运行: npm i -g vercel"
    exit 1
fi

# 检查必要文件
echo "📁 检查必要文件..."
required_files=("index.html" "github-service.js" "vercel.json")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少文件: $file"
        exit 1
    fi
done

echo "✅ 所有必要文件都存在"

# 创建临时部署目录
echo "📦 准备部署文件..."
deploy_dir="deploy_temp"
mkdir -p "$deploy_dir"

# 复制必要文件
cp index.html "$deploy_dir/"
cp github-service.js "$deploy_dir/"
cp vercel.json "$deploy_dir/"

# 复制可选文件（如果存在）
optional_files=("fix-essays.html" "test-github.html" "test-simple.html")
for file in "${optional_files[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$deploy_dir/"
        echo "✅ 复制可选文件: $file"
    fi
done

# 进入部署目录
cd "$deploy_dir"

# 创建简化的 package.json
cat > package.json << EOF
{
  "name": "blogwriter",
  "version": "1.0.0",
  "description": "A modern Markdown editor for blogs and essays",
  "main": "index.html",
  "scripts": {
    "build": "echo 'Static site - no build needed'"
  }
}
EOF

echo "✅ 创建 package.json"

# 部署到 Vercel
echo "🚀 开始部署..."
vercel --prod

# 清理临时目录
cd ..
rm -rf "$deploy_dir"

echo "🎉 部署完成！"
echo "📝 请查看 Vercel 输出的 URL"

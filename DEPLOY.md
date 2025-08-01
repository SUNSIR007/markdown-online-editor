# BlogWriter 部署指南

## 🚀 部署到 Vercel

### 方法一：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```

### 方法二：通过 GitHub 集成

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add BlogWriter static site"
   git push origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择你的 GitHub 仓库
   - 配置项目设置

### 方法三：拖拽部署

1. **准备文件**
   - 确保所有文件都在项目根目录
   - 主要文件：`index.html`, `github-service.js`, `vercel.json`

2. **拖拽部署**
   - 访问 [vercel.com](https://vercel.com)
   - 将项目文件夹拖拽到部署区域

## 📁 需要的文件

确保以下文件存在于项目根目录：

- `index.html` - 主页面
- `github-service.js` - GitHub API 服务
- `vercel.json` - Vercel 配置
- `package-static.json` - 简化的 package.json（可选）
- `fix-essays.html` - 修复工具页面（可选）
- `test-github.html` - 测试页面（可选）

## ⚙️ Vercel 项目设置

### 构建设置
- **Framework Preset**: Other
- **Build Command**: 留空或 `echo "Static site"`
- **Output Directory**: 留空（使用根目录）
- **Install Command**: 留空

### 环境变量
无需设置环境变量，所有配置都在客户端完成。

## 🔧 部署后配置

1. **获取部署 URL**
   - 部署完成后，Vercel 会提供一个 URL
   - 例如：`https://your-project.vercel.app`

2. **测试功能**
   - 访问部署的 URL
   - 测试编辑器功能
   - 配置 GitHub 集成
   - 测试发布功能

3. **自定义域名（可选）**
   - 在 Vercel 项目设置中添加自定义域名
   - 配置 DNS 记录

## 🛠️ 故障排除

### 常见问题

1. **页面空白**
   - 检查浏览器控制台错误
   - 确保所有 CDN 资源可访问

2. **GitHub 功能不工作**
   - 检查 CORS 设置
   - 确保 GitHub Token 权限正确

3. **文件上传失败**
   - 检查 GitHub API 限制
   - 验证仓库权限

### 调试步骤

1. 打开浏览器开发者工具
2. 检查 Console 标签页的错误信息
3. 检查 Network 标签页的请求状态
4. 验证 GitHub 配置是否正确

## 📱 移动端适配

项目已包含响应式设计，支持移动端访问：
- 自适应布局
- 触摸友好的界面
- 移动端优化的编辑器

## 🔒 安全注意事项

1. **GitHub Token 安全**
   - Token 存储在浏览器 localStorage 中
   - 不会发送到服务器
   - 建议使用最小权限的 Token

2. **HTTPS**
   - Vercel 自动提供 HTTPS
   - 确保所有 API 调用使用 HTTPS

## 📊 性能优化

1. **CDN 资源**
   - Vue.js, Element UI, Vditor 都使用 CDN
   - 减少加载时间

2. **缓存策略**
   - 静态资源自动缓存
   - GitHub 配置本地存储

## 🎯 下一步

部署完成后，你可以：
1. 分享 URL 给其他用户
2. 配置自定义域名
3. 添加更多功能
4. 集成其他服务（如图床等）

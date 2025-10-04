# Repository Guidelines

## Project Structure & Module Organization
核心代码位于 `static-deploy/`：`index.html` 装载 Vue + Element UI 编辑器界面，`js/` 目录拆分出配置 (`config.js`)、编辑器控制 (`editor-manager.js`)、GitHub 设置组件 (`github-config-component.js`)、移动端适配 (`mobile-utils.js`) 与图像交互 (`image-handler.js`)，`app.js` 汇总为根 Vue 实例。`github-service.js`、`image-service.js` 和 `js/config.js` 暴露的全局方法由 UI 直接调用；`css/` 存放基础、组件、编辑器和移动端样式；`img/` 保存共享图标。根目录保留 `README.md`、`DEPLOY.md`、`CLAUDE.md` 等工作流文档以及 `AGENTS.md` 指南；当交互、部署或图床流程变更时，务必同步对应指南与 `DEMO.md`、`IMAGE_UPLOAD_GUIDE.md`、`PWA-CONFIG-GUIDE.md`。

## Build, Test, and Development Commands
- `npm start` / `npm run serve`：在根目录启动 `static-deploy` 下的 `python -m http.server 8080`，浏览 `http://localhost:8080/index.html` 获取完整体验。
- `python -m http.server 8080`：进入 `static-deploy/` 后手动运行，用于无 Node.js 环境或快速排查部署故障。
- `npm install`（首次可选）：确保本地 Python、Node 版本与 `package.json` / `static-deploy/package.json` 的 `engines` 匹配。
- `static-deploy/package.json#build`：当前仅回显“Static site - no build needed”，引入真实构建流程时需要同步修改并记录。

## Coding Style & Naming Conventions
- Vue 相关脚本（`static-deploy/js/*.js`）采用四个空格缩进、结尾加分号、优先使用 `const`/`let` 与箭头函数，将共享逻辑挂载到 `window` 命名空间并保持模块化注释。
- 服务类脚本（`github-service.js`、`image-service.js`）沿袭两空格缩进与无分号风格，扩展功能时保持 JSDoc 注释和 Promise 用法一致，必要时在提交说明中标记风格调整。
- HTML/CSS 使用小写短横线类名，色彩变量来源于 `css/base.css`，布局拆分在 `css/components.css`、`css/editor.css`、`css/mobile.css`；新增按钮可以命名为 `.action-primary`，移动端断点遵循 768px。
- 静态资产、演示和指南遵循功能前缀命名，例如 `IMAGE_UPLOAD_GUIDE.md`、`PWA-CONFIG-GUIDE.md`、`DEMO.md` 与未来的 `test-*.html` 页面。

## Testing Guidelines
暂无自动化测试；每次改动需在本地预览中手动验证：1）切换内容类型，确认 `generateContentWithMetadata` 输出的 frontmatter 与 `src/content` 目标结构一致；2）通过 GitHub 配置面板执行“测试连接”并向沙盒仓库推送草稿，观察 `github-service.js` 的错误提示；3）在图片配置面板上传多图，检查压缩提示、进度条和生成的 CDN 链接；4）在桌面与移动浏览器中切换暗夜模式、键盘弹出、PWA 离线横幅等关键交互，必要时记录截图。若新增场景，请将复现步骤与观测结果追加到相关指南或 PR 描述中。

## Commit & Pull Request Guidelines
提交信息保持简洁，可选中英双语并附作用域标签（示例：`feat: 支持 Astro essays frontmatter`）。在提 PR 前与 `master` 同步、整理相关改动，说明用户可见影响、列出已执行的手动测试、上传关键界面截图或录屏，并标注所需 GitHub Token 权限和仓库角色。涉及部署或配置调整时请同步更新 `DEPLOY.md` 或其他指南并在 PR 中链接，方便审阅。团队需定期 review `CLAUDE.md` notes 以保持 automation docs 一致性。

## Security & Configuration Tips
GitHub Token 始终存放于浏览器本地缓存，勿写入仓库或截图。调整图床仓库、CDN 规则或默认分支时，需要更新 `image-service.js` 的 `linkRules`、`branch` 字段并同步 README 与指南说明。发布到外部站点前检查 `site.webmanifest`、`vercel.json`、`js/config.js` 是否满足新需求，避免遗留测试域名或调试配置；引入第三方脚本前确认来源可信并记录版本以便审计，及时清理共享设备上的缓存配置。

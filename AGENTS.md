# Repository Guidelines

This guide captures the practical conventions for maintaining and extending the Markdown Online Editor.

## Project Structure & Module Organization
- `static-deploy/` contains the shipped site: `index.html` bootstraps the editor, `github-service.js` and `image-service.js` wrap GitHub APIs, and `/img/` holds static assets.
- Root-level docs such as `README.md`, `DEPLOY.md`, and the `static-deploy/*GUIDE.md` files document feature workflows; keep updates alongside related code.
- There is no build pipeline; assets are served as written, so treat each HTML/JS file as production-ready.

## Build, Test, and Development Commands
- `npm start` or `npm run serve`: launches `python -m http.server 8080` inside `static-deploy/` for local preview.
- `python -m http.server 8080` (run within `static-deploy/`): lightweight alternative if Node/NPM are unavailable.
- `npm run build` inside `static-deploy/`: currently a stub; extend it only if a real build step is introduced.

## Coding Style & Naming Conventions
- Follow the existing two-space indentation, no-semicolon JavaScript style (`image-service.js`, `github-service.js`). Prefer `const`/`let`, arrow functions for callbacks, and early returns for validation.
- Keep HTML IDs/classes kebab-cased (`test-mobile.html`) and align in-file CSS with the editor palette.
- When adding docs or demos, mirror the `test-*.html` naming to signal purpose.

## Testing Guidelines
- Automated tests are absent; perform manual smoke tests through the demo pages (`test-image-upload.html`, `test-mobile.html`, `test-pwa-config.html`).
- Before submitting changes, verify GitHub publishing, image uploads, and theme toggles from `index.html` on desktop and mobile widths.
- Document new manual test steps in the relevant `*GUIDE.md` file when workflows change.

## Commit & Pull Request Guidelines
- Keep commit subjects concise (Chinese or English is fine) and describe scope plus version tags when appropriate (see `git log` entries like “优化移动端体验… v11”).
- Rebase onto main, group related changes, and reference issues in the body when applicable.
- Pull requests should outline the user-facing impact, list manual test evidence (URLs, screenshots), and note any configuration prerequisites such as required GitHub tokens.

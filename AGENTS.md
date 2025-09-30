# Repository Guidelines

Use this playbook when contributing to the Markdown Online Editor; keep updates tight, traceable, and production-ready.

## Project Structure & Module Organization
- `static-deploy/` is the shipped site: `index.html` bootstraps the editor, `github-service.js` and `image-service.js` integrate external APIs, and `/img/` stores static assets.
- Root-level docs (`README.md`, `DEPLOY.md`, `static-deploy/*GUIDE.md`) describe workflows; update the matching doc whenever you change related behavior.
- There is no build step. Treat every HTML, CSS, and JS file as production code and avoid unused assets.

## Build, Test, and Development Commands
- `npm start` / `npm run serve`: runs `python -m http.server 8080` inside `static-deploy/` for local preview.
- `python -m http.server 8080` (from `static-deploy/`): direct preview when Node/NPM are unavailable.
- `npm run build` (in `static-deploy/`): placeholder for future automation; extend only when a real pipeline is introduced.

## Coding Style & Naming Conventions
- JavaScript: two-space indentation, no semicolons, prefer `const`/`let`, arrow callbacks, and early returns (see `static-deploy/github-service.js`).
- HTML/CSS: keep IDs/classes kebab-cased and align with the editor palette (`static-deploy/test-mobile.html`).
- Demos and docs follow the `test-*.html` and `*GUIDE.md` naming patterns to signal intent.

## Testing Guidelines
- No automated suite exists; perform manual smoke tests via `static-deploy/test-image-upload.html`, `test-mobile.html`, and `test-pwa-config.html`.
- Validate GitHub publishing, image upload, and theme toggles from `index.html` at desktop and mobile widths before submitting.
- Record new manual steps in the relevant `*GUIDE.md` so others can replay them.

## Commit & Pull Request Guidelines
- Keep commit subjects concise, optionally bilingual, and include scope tags when useful (e.g., “优化移动端体验… v11”).
- Rebase on main, group related changes, reference issues, and describe user-facing impact in the PR body.
- Attach manual test evidence (URLs, screenshots) and note required GitHub tokens or configuration secrets.

## Security & Configuration Tips
- Never commit personal tokens; rely on environment variables and redact secrets from screenshots.
- Confirm GitHub API scopes before sharing setup steps, and document any required repository permissions alongside feature changes.

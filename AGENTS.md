# Repository Guidelines

## Project Structure & Module Organization
The live editor ships directly from `static-deploy/`, where `index.html` wires UI events, `github-service.js` wraps GitHub REST interactions, `image-service.js` handles upload flows, and the `img/` directory stores shared icons. Root documentation (`README.md`, `DEPLOY.md`, and `static-deploy/*GUIDE.md`) captures workflows; whenever you change behavior, mirror the updates in the matching guide. Remove unused HTML, CSS, JS, or assets because we have no bundler or dead-code pruning, and keep all imports relative to avoid broken references in the static host.

## Build, Test, and Development Commands
Run `npm start` or `npm run serve` from the repository root to spawn `python -m http.server 8080` under `static-deploy/` for a full preview. If Node.js is unavailable, start `python -m http.server 8080` manually inside `static-deploy/`. `npm run build` is a placeholder; touch it only when you introduce a real automation pipeline and document the change in `DEPLOY.md`.

## Coding Style & Naming Conventions
Use two-space indentation in JavaScript, omit semicolons, prefer `const`/`let`, lean on arrow functions, and return early for guard clauses—`static-deploy/github-service.js` is the reference. Keep HTML and CSS class names in kebab-case, reuse palette tokens defined in `static-deploy/test-mobile.html`, and align inline buttons horizontally. Name demos `test-*.html` and guides `*GUIDE.md` so features remain discoverable.

## Testing Guidelines
There is no automated suite. Before opening a pull request, manually exercise `static-deploy/test-image-upload.html`, `test-mobile.html`, and `test-pwa-config.html`. Validate GitHub publishing, image upload edge cases, theme toggles, and offline prompts; record noteworthy scenarios in the relevant guide to preserve historical knowledge.

## Commit & Pull Request Guidelines
Keep commit subjects concise—bilingual titles with optional scope tags such as `优化移动端体验 v11` are welcome. Rebase onto `main`, group related changes, and ensure the PR description links issues, explains user-visible impact, and shares screenshots or short clips. Attach manual test results, list required GitHub token scopes, and flag any reviewer prerequisites such as repository permissions.

## Security & Configuration Tips
Never commit personal access tokens. Prefer environment variables for secrets, redact them in captures, and confirm GitHub API scopes before instructing others. When a feature depends on specific repository roles, document the required permissions alongside the change so downstream teams can reproduce the setup.

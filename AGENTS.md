# Repository Guidelines

Use this contributor playbook to keep the Markdown Online Editor stable and traceable.

## Project Structure & Module Organization
- `static-deploy/` contains shipped assets; `index.html` boots the editor, `github-service.js` handles GitHub API calls, `image-service.js` manages uploads, and `/img/` stores shared icons.
- Root docs (`README.md`, `DEPLOY.md`, `static-deploy/*GUIDE.md`) capture workflows; update the matching guide when behavior changes.
- No build step exists; treat every HTML, CSS, and JS file as production code and prune unused assets promptly.

## Build, Test, and Development Commands
- `npm start` or `npm run serve`: launches `python -m http.server 8080` from `static-deploy/` for local preview.
- `python -m http.server 8080`: lightweight preview when Node is unavailable.
- `npm run build`: placeholder today—modify only alongside a real automation pipeline.

## Coding Style & Naming Conventions
- JavaScript uses two-space indentation, omits semicolons, prefers `const`/`let`, arrow callbacks, and early returns (see `static-deploy/github-service.js`).
- Keep HTML/CSS classes kebab-case and reuse palette/layout tokens demonstrated in `static-deploy/test-mobile.html`.
- Name demos `test-*.html` and guides `*GUIDE.md`; align filenames with feature scope.

## Testing Guidelines
- No automated suite; run manual smoke checks via `static-deploy/test-image-upload.html`, `test-mobile.html`, and `test-pwa-config.html`.
- Validate GitHub publishing, image uploads, theme toggles, and offline prompts before submitting changes.
- Record new manual steps inside the relevant `*GUIDE.md` so others can replay them.

## Commit & Pull Request Guidelines
- Write concise subjects, optionally bilingual, and include scope tags when useful (e.g., `优化移动端体验 v11`).
- Rebase on `main`, group related changes, link issues, and describe user-facing impact in the PR body.
- Attach manual test evidence (URLs, screenshots), note required GitHub tokens, and confirm reviewer prerequisites.

## Security & Configuration Tips
- Never commit personal tokens; use environment variables and redact secrets from screenshots.
- Confirm GitHub API scopes before sharing setup instructions, and document required repository permissions alongside feature changes.

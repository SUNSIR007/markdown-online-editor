# Repository Guidelines

## Project Structure & Module Organization
- `static-deploy/` hosts the live editor: `index.html` bootstraps UI logic, `github-service.js` wraps GitHub REST calls, `image-service.js` manages uploads, and `img/` stores shared icons.
- Root documentation (`README.md`, `DEPLOY.md`, `static-deploy/*GUIDE.md`) records workflows; mirror any behavior change in the matching guide before merging.
- Treat every HTML, CSS, and JS file as production code—no build pipeline exists—so prune unused assets and keep imports relative.

## Build, Test, and Development Commands
- `npm start` / `npm run serve`: launch `python -m http.server 8080` from `static-deploy/` for a full local preview.
- `python -m http.server 8080`: lightweight fallback when Node.js is unavailable.
- `npm run build`: placeholder; only modify alongside a real automation pipeline.

## Coding Style & Naming Conventions
- JavaScript: two-space indentation, no semicolons, prefer `const`/`let`, arrow callbacks, and early returns (see `static-deploy/github-service.js`).
- HTML/CSS: kebab-case classes, reuse palette tokens from `static-deploy/test-mobile.html`, align inline buttons horizontally.
- Name demos `test-*.html` and guides `*GUIDE.md`; align filenames with feature scope for discoverability.

## Testing Guidelines
- No automated suite; run manual smoke checks via `static-deploy/test-image-upload.html`, `test-mobile.html`, and `test-pwa-config.html` before raising a PR.
- Validate GitHub publishing, image upload flows, theme toggles, and offline prompts; note edge cases you probe.
- Append any new manual steps or prerequisites to the relevant guide so the team can replay them.

## Commit & Pull Request Guidelines
- Write concise commit subjects, optionally bilingual, and include scope tags when useful (e.g., `优化移动端体验 v11`).
- Rebase on `main`, group related changes, link issues, and describe user-visible impact in the PR body with screenshots or short clips when possible.
- Attach manual test evidence (URLs, screenshots), mention required GitHub tokens, and flag reviewer prerequisites (permissions, feature flags).

## Security & Configuration Tips
- Never commit personal access tokens; rely on environment variables and redact secrets in captures.
- Confirm required GitHub API scopes before sharing setup instructions, and document repository permissions whenever you ship feature changes that depend on them.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A feature-rich online Markdown editor designed for blog and essay writing with GitHub integration. Built as a pure static site using Vue.js 2.x, Element UI, and Vditor editor.

## Architecture

### Core Technologies
- **Frontend**: Vue.js 2.x (CDN-loaded, single-file HTML application)
- **UI Framework**: Element UI
- **Markdown Editor**: Vditor (split-screen preview mode)
- **Storage**: localStorage for all configurations (GitHub tokens, image hosting settings, drafts)
- **Deployment**: Static site served via Python HTTP server or Vercel

### Key Files
- `static-deploy/index.html` - Main application (single-file Vue.js app with inline styles and scripts)
- `static-deploy/github-service.js` - GitHub API integration (GitHubService class)
- `static-deploy/image-service.js` - Image upload to GitHub with CDN support (ImageService class)
- `static-deploy/fix-branch.js` - Utility for branch operations

### Application Structure

**Content Types**: The editor supports three content types:
- `general` - Generic Markdown documents
- `blog` - Blog posts with YAML frontmatter (title, categories, date, description)
- `essay` - Personal essays with YAML frontmatter (title, date, mood, description)

**Main Vue Instance** (in `index.html:1622`):
- Data includes: `vditor` editor instance, `currentType`, `metadata`, GitHub/image config state
- Computed properties: `hasVisibleFields`, `hasBodyContent`
- Lifecycle: `mounted()` initializes theme, Vditor editor, checks configs

**Vue Components**:
- `github-config` (index.html:1280) - Unified GitHub and image hosting configuration dialog

### GitHub Integration

**Publishing Flow**:
1. Content is formatted with appropriate YAML frontmatter based on content type
2. Files are published to different paths depending on type:
   - Blog posts → `src/content/posts/YYYY-MM-DD-title.md`
   - Essays → `src/content/essays/YYYY-MM-DD-title.md`
   - General docs → `docs/title.md`
3. Uses GitHub REST API for file creation/updates

**GitHub Service** (`github-service.js`):
- Class-based architecture: `GitHubService`
- Methods: `setConfig()`, `loadConfig()`, `createOrUpdateFile()`, `getFile()`, `testConnection()`
- Config stored in localStorage as `github-config`

### Image Hosting

**Image Service** (`image-service.js`):
- Class-based: `ImageService`
- Supports multiple CDN providers: jsDelivr, Statically, China jsDelivr, GitHub raw
- Auto-compression for images > 500KB
- Directory structure: `images/YYYY/MM/filename-hash.ext`
- Upload methods: drag-drop, paste (Ctrl+V), button upload
- Config stored in localStorage

**Supported CDN Rules**:
```javascript
jsdelivr: 'https://cdn.jsdelivr.net/gh/{owner}/{repo}@{branch}/{path}'
statically: 'https://cdn.statically.io/gh/{owner}/{repo}/{branch}/{path}'
github: 'https://github.com/{owner}/{repo}/raw/{branch}/{path}'
china-jsdelivr: 'https://jsd.cdn.zzko.cn/gh/{owner}/{repo}@{branch}/{path}'
```

### Theme System

**Dark/Light Mode**:
- Toggled via theme button in header
- Theme state saved to localStorage as `theme-preference`
- Applied to body element as `theme-dark` or `theme-light` class
- Vditor editor theme synchronized with app theme

## Development Commands

### Local Development
```bash
# Serve the static site on port 8080
npm start
# or
npm run serve
```

Both commands run: `cd static-deploy && python -m http.server 8080`

### Testing
- Open `static-deploy/index.html` in browser
- Test pages available:
  - `test-image-upload.html` - Image upload testing
  - `debug-config.html` - Configuration debugging
  - `theme-test.html` - Theme system testing
  - `mobile-debug.html` - Mobile view testing

## Project-Specific Patterns

### Content Type Handling
When adding new content types, update:
1. `contentTypes` object (defines type IDs)
2. `contentTypeLabels` (display names)
3. `metadataFields` (form fields for each type)
4. Path generation logic in GitHub publish methods

### LocalStorage Keys
- `github-config` - GitHub token, owner, repo for blog publishing
- `image-github-config` - Separate GitHub config for image hosting
- `theme-preference` - 'dark' or 'light'
- `vditor-cache` - Auto-saved draft content
- `image-cdn-rule` - Selected CDN provider
- `image-dir` - Image directory path

### Astro Project Integration
The editor is designed to publish to Astro-based blogs:
- Blog posts go to `src/content/posts/`
- Essays go to `src/content/essays/`
- Both follow Astro content collections format with YAML frontmatter

### Mobile Optimization
- Viewport fixes using CSS custom properties (`--vh`)
- Touch-friendly UI adjustments
- Default content type set to 'essay' on mobile
- PWA support with `site.webmanifest`

## Important Notes

- **No build step**: This is a pure static site with no bundler
- **CDN dependencies**: All libraries loaded from CDN (Vue, Element UI, Vditor)
- **Security**: GitHub tokens stored in browser localStorage only, never sent to third-party servers
- **Deployment**: Designed for Vercel or any static hosting (see DEPLOY.md)
- **Image hosting best practice**: Use separate GitHub repo for images, not the blog repo
- **Chinese language UI**: Most UI text and documentation is in Chinese

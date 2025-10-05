# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Markdown online editor with GitHub integration for publishing blog posts and essays. It's a static web application built with Vue.js 2, Element UI, and Vditor editor.

## Development Commands

### Running the Application
```bash
npm start
# or
npm run serve
```
Both commands serve the application from `static-deploy/` directory on http://localhost:8080

### Git Workflow
- After completing modifications, automatically create a commit and push to remote repository
- Avoid adding test/debug pages unless explicitly requested

## Architecture

### File Structure
- **static-deploy/**: Main application directory (served statically)
  - **index.html**: Main entry point with anti-flash loading optimization
  - **js/**: Modular JavaScript files
    - `app.js`: Main Vue application instance
    - `config.js`: Content types and metadata field definitions
    - `editor-manager.js`: Vditor editor initialization and management
    - `github-config-component.js`: GitHub configuration UI component
    - `image-handler.js`: Image drag/drop and paste handling
    - `mobile-utils.js`: Mobile device detection and utilities
  - **github-service.js**: GitHub API integration (file upload/update)
  - **image-service.js**: Image hosting service via GitHub with CDN support
  - **service-worker.js**: PWA support
  - **css/**: Stylesheets

### Core Architecture

#### Content Types System
The application supports three content types (defined in `js/config.js`):
- **BLOG**: Blog posts with title, categories, date frontmatter → publishes to `src/content/posts/`
- **ESSAY**: Personal essays with title, date, mood → publishes to `src/content/essays/`
- **GALLERY**: Image gallery mode → publishes to `src/content/gallery/`

Each type has configurable metadata fields that generate YAML frontmatter.

#### GitHub Integration
- **GitHubService** (github-service.js): Handles file creation/updates via GitHub API
- **ImageService** (image-service.js): Uploads images to GitHub repo with CDN link generation
- Supports multiple CDN providers: jsDelivr, Statically, China jsDelivr, GitHub raw
- Files are published to Astro-compatible directory structure

#### Editor System
- **Vditor**: Rich markdown editor with live preview
- Default mode: `ir` (instant rendering) with dark theme
- Mobile-aware: different toolbar configurations for mobile/desktop
- Image upload: drag-and-drop, paste, and button upload with automatic compression

#### Mobile Optimization
- Automatic mobile device detection (`window.isMobileDevice()`)
- Mobile-specific UI adjustments (viewport fixes, auto-focus handling)
- PWA support with service worker and manifest

#### Loading Performance
The app includes extensive anti-flash white screen optimizations:
- Black background overlay system during initial load
- Inline critical CSS and scripts in `<head>`
- Multiple test pages for debugging load performance (test-*.html files)

## Key Global Objects

- `window.AppConfig`: Content types, labels, and metadata field definitions
- `window.githubService`: GitHub API service instance
- `window.imageService`: Image upload service instance
- `window.generateContentWithMetadata()`: Generates markdown with YAML frontmatter

## Configuration Storage

All configurations stored in localStorage:
- `github-config`: GitHub token, owner, repo
- `image-config`: Image hosting repo settings
- Theme preferences and editor state

## Target Platform

This editor is designed for Astro-based static blogs with the following structure:
```
blog-repo/
├── src/content/
│   ├── posts/        # Blog articles
│   ├── essays/       # Personal essays
│   └── gallery/      # Image galleries
└── docs/             # General documents
```

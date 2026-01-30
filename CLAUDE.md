# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm run build           # Format, lint, build site, check permalinks
pnpm run build:cf        # Full build + Cloudflare R2 sync + worker deploy
pnpm run 11ty:watch      # Dev server with hot reload
pnpm run 11ty:debug      # Dev server with Eleventy debug output
pnpm run clean           # Remove _site directory
```

### Linting

```bash
pnpm run lint            # Run all linters (JS, CSS, Markdown)
pnpm run lint:js         # ESLint
pnpm run lint:css        # Stylelint for SCSS/CSS
pnpm run lint:md         # markdownlint-cli2
pnpm run lint:fix        # Auto-fix JS and CSS issues
pnpm run format          # Prettier formatting
```

### Permalinks

The build includes permalink tracking to prevent broken URLs:

```bash
node check-permalinks.js --update-baseline  # Accept new/changed permalinks
```

## Architecture

This is an Eleventy static site using Liquid and Nunjucks templates, deployed to Cloudflare Pages with R2 for large assets.

### Key Files

- `.eleventy.js` - Main Eleventy config: plugins, filters, shortcodes, Markdown, Sass processing
- `src/_data/site.js` - Site configuration, navigation structure (defines collections)
- `src/_data/helpers.js` - Shared utility functions (slugify, date formatting, etc.)

### Directory Structure

- `src/` - Source content (Markdown pages, templates, assets)
- `src/_includes/layouts/` - Page layouts (Liquid)
- `src/_includes/partials/` - Reusable components
- `src/_data/` - Global data files
- `src/assets/scss/` - Styles organized by CUBE CSS methodology
- `_cloudflare/r2/` - R2 sync scripts and proxy worker
- `_cloudflare/rss/` - RSS feed caching worker
- `eleventy-plugins/` - Custom Eleventy plugins

### SCSS Structure (CUBE CSS)

Styles use CUBE CSS methodology with Utopia fluid typography:

- `global/` - Reset, variables, themes, base styles
- `config/` - Design tokens, fonts, Sass helpers
- `compositions/` - Layout primitives (flow, stack, grid, sidebar, etc.)
- `blocks/` - Component-specific styles
- `utilities/` - Single-purpose utility classes

### Collections

Collections are auto-generated from `src/_data/site.js` nav items with `collection: true`. Each collection reads from `src/{collection}/**/*.md`.

### Cloudflare Integration

Two separate workers handle different concerns:

**R2 Proxy Worker** (`_cloudflare/r2/`):

- Syncs large files from configured directories to R2 (see `config.js` for `R2_DIRS`)
- Transparently proxies R2 requests with proper MIME types
- Supports range requests for streaming media

**RSS Worker** (`_cloudflare/rss/`):

- Adds caching headers (Last-Modified, If-Modified-Since) to podcast RSS feed

**Other**:

- KV stores writing collection items and permalink baseline
- Environment variables required in `.env` for Cloudflare API access

### Custom Shortcodes

- `{% articleImage src, alt, ratio, portrait, href %}` - Inline article images
- `{% blockQuote %}content{% endblockQuote name, source, url %}` - Block quotes with attribution

### Custom Filters

- `getLinkActiveState` - Navigation active state
- `loremIpsum` - Generate placeholder text
- `markdownify` - Render Markdown inline
- `dateToRfc3339`, `getNewestCollectionItemDate` - Date formatting for feeds

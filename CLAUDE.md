# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm run build           # Format, lint, build site, check permalinks
pnpm run build:cf        # Full build + R2 sync (for Workers Builds)
pnpm run deploy          # build:cf + wrangler deploy (manual deployment)
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

### Podcast Audio Metadata

Audio metadata (duration, file size, MD5 hash) is pre-computed and cached in `src/_data/audioMetadata.json`. This avoids slow audio processing during every build.

```bash
pnpm run audio:update    # Update metadata after adding/changing audio files
pnpm run audio:validate  # Check metadata matches audio files
```

- Build fails if metadata is missing or hash doesn't match audio file
- Husky pre-commit hook prevents commits with stale metadata
- Script location: `scripts/audio-metadata.js`
- Validation plugin: `eleventy-plugins/audio-validation.js`

### Favicons

Favicons are generated from a font glyph using `scripts/generate-favicons.js`. The script extracts the "A" glyph from Inter Bold, centers it, and produces all favicon variants.

```bash
node scripts/generate-favicons.js  # Regenerate all favicon files
```

- Font source: `src/_build/fonts/Inter-Bold.ttf`
- Change `FONT_PATH` in the script to use a different typeface
- Dev dependencies: `sharp`, `png-to-ico`, `opentype.js`
- Generated files (in `src/`): `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `favicon-192.png`, `favicon-512.png`
- `favicon.svg` adapts to light/dark mode via CSS media query
- `site.webmanifest` references the 192 and 512 PNG variants
- Favicon `<link>` elements are defined in `src/_data/site.js` under `site.links`

## Architecture

This is an Eleventy static site using Liquid and Nunjucks templates, deployed to Cloudflare Workers with static assets and R2 for large files.

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
- `worker/` - Unified Cloudflare Worker (serves static assets, R2 files, RSS)
- `_cloudflare/r2/` - R2 sync scripts (uploads large files to R2)
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

**Unified Worker** (`worker/index.js`):

- Serves static assets from `_site/` via Workers static assets
- Proxies large files from R2 (podcast audio, large PDFs) with MIME detection and range request support
- Adds caching headers to RSS feed (Last-Modified, If-Modified-Since)
- Configuration in `wrangler.toml` at project root

**R2 Sync** (`_cloudflare/r2/`):

- Syncs large files to R2 bucket (see `config.js` for `R2_DIRS`)
- Runs as part of `build:cf` command
- Large files excluded from Eleventy passthrough for faster builds (~344MB):
  - `src/assets/files/` - PDFs, misc audio
  - `src/assets/podcast/audio/` - Podcast episodes
- To test these files locally: `cp -r src/assets/files src/assets/podcast/audio _site/assets/`

**Other**:

- KV stores writing collection items and permalink baseline
- Environment variables required in `.env` for Cloudflare API access
- Auto-deploy via Workers Builds (production: `master`, staging: `stg`)

### Open Graph Images

Uses `eleventy-plugin-og-image` with a custom `outputFileSlug` function that hashes input data instead of rendered HTML. This avoids expensive template rendering on every build (~6s saved).

- Trade-off: OG template changes won't trigger image regeneration, only data changes (title, date)
- To force regeneration after template changes: `rm -rf _site/assets/images/og/`
- Template: `src/_includes/open-graph/og-posts.og.liquid`

### Custom Shortcodes

- `{% articleImage src, alt, ratio, portrait, href %}` - Inline article images
- `{% blockQuote %}content{% endblockQuote name, source, url %}` - Block quotes with attribution

### Custom Filters

- `getLinkActiveState` - Navigation active state
- `loremIpsum` - Generate placeholder text
- `markdownify` - Render Markdown inline
- `dateToRfc3339`, `getNewestCollectionItemDate` - Date formatting for feeds

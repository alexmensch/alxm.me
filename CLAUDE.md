# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm run build           # Format, lint, test, build site, check permalinks
pnpm run build:cf        # Full build + R2 sync (for Workers Builds)
pnpm run deploy          # build:cf + wrangler deploy (manual deployment)
pnpm run 11ty:watch      # Dev server with hot reload
pnpm run 11ty:debug      # Dev server with Eleventy debug output
pnpm run clean           # Remove _site directory
pnpm test                # Run tests (Node.js built-in test runner)
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

- `.eleventy.js` - Main Eleventy config: plugins, filters, shortcodes, Sass processing
- `src/_build/markdown.js` - Configured markdown-it instance with all plugins (footnotes, smart arrows, external links)
- `src/_build/shortcodes.js` - Shortcode functions (articleImage, blockQuote)
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
- `tests/` - Test suite (Node.js built-in test runner, `node:test` + `assert/strict`)

### SCSS Structure (CUBE CSS)

Styles use CUBE CSS methodology with Utopia fluid typography:

- `global/` - Reset, variables, themes, base styles
- `config/` - Design tokens, fonts, Sass helpers
- `compositions/` - Layout primitives (flow, stack, grid, sidebar, etc.)
- `blocks/` - Component-specific styles
- `utilities/` - Single-purpose utility classes

There is a cube-css skill that exists in this repository which you must reference when making changes to styling, including CSS and fonts, in this repository.

### Collections

Collections are auto-generated from `src/_data/site.js` nav items with `collection: true`. Each collection reads from `src/{collection}/**/*.md`.

### Cloudflare Integration

**Unified Worker** (`worker/index.js`):

- Serves static assets from `_site/` via Workers static assets
- Proxies large files from R2 (podcast audio, large PDFs) with MIME detection and range request support
- Adds caching headers to RSS feed (Last-Modified, If-Modified-Since)
- Adds `TDM-Reservation: 1` header to HTML responses (W3C TDM Protocol opt-out)
- Configuration in `wrangler.toml` at project root

**R2 Sync** (`_cloudflare/r2/`):

- Syncs large files to R2 bucket (see `config.js` for `R2_DIRS`)
- Runs as part of `build:cf` command
- Large files excluded from Eleventy passthrough for faster builds (~344MB):
  - `src/assets/files/` - PDFs, misc audio
  - `src/assets/podcast/audio/` - Podcast episodes
- To test these files locally: `cp -r src/assets/files src/assets/podcast/audio _site/assets/`

**Git LFS in preview builds**:

Large audio files and the cloud-anatomy PDF are tracked by Git LFS (see `.gitattributes`). To stay under the GitHub LFS bandwidth quota, Cloudflare Workers Builds preview deploys should run with `GIT_LFS_SKIP_SMUDGE=1` set as a build-time environment variable so the ephemeral build environment doesn't re-download every LFS object on every commit. The build is resilient to this:

- `eleventy-plugins/audio-validation.js` detects LFS pointer files and skips hash validation for them
- `_cloudflare/r2/sync.js` refuses to upload pointer files (would corrupt R2) — so preview builds must use `pnpm run build`, not `pnpm run build:cf`
- Production (`master`) and staging (`stg`) deploys must NOT have `GIT_LFS_SKIP_SMUDGE` set, since R2 sync needs the real files

**Other**:

- KV stores writing collection items and permalink baseline
- Environment variables required in `.env` for Cloudflare API access
- Auto-deploy via Workers Builds (production: `master`, staging: `stg`)

### Open Graph Images

Uses `eleventy-plugin-og-image` with a custom `outputFileSlug` function that hashes input data instead of rendered HTML. This avoids expensive template rendering on every build (~6s saved).

- Trade-off: OG template changes won't trigger image regeneration, only data changes (title, date)
- To force regeneration after template changes: `rm -rf _site/assets/images/og/`
- Template: `src/_includes/open-graph/og-posts.og.liquid`

### Custom Shortcodes (`src/_build/shortcodes.js`)

- `{% articleImage src, alt, ratio, portrait, href %}` - Inline article images (ratio is required)
- `{% blockQuote %}content{% endblockQuote name, source, url %}` - Block quotes with attribution

### Custom Filters

- `getLinkActiveState` - Navigation active state
- `loremIpsum` - Generate placeholder text
- `markdownify` - Render Markdown inline
- `dateToRfc3339`, `getNewestCollectionItemDate` - Date formatting for feeds

### Newsletter Subscribe Form

The site footer includes an email subscribe form that integrates with [feedmail](https://github.com/alexmensch/feedmail), a standalone RSS-to-email microservice running at `feedmail.cc`.

**Files:**

- `src/_includes/partials/subscribe-form.liquid` - Form with AJAX submission
- `src/assets/scss/blocks/_subscribe-form.scss` - Form styles (CUBE CSS conventions)
- `src/_data/site.js` - `site.newsletter` config (apiUrl, siteId)

**How it works:**

- Form POSTs to `https://feedmail.cc/api/subscribe` with email and siteId
- The form is rendered in the footer via `{% render "partials/subscribe-form", site: site %}` in `site-footer.liquid`
- feedmail handles verification emails, subscriber management, and feed-to-email delivery independently

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Layout

This repository is a **pnpm-workspace monorepo** (epic `az8`). The `alxm.me` site lives in `sites/alxm.me/` and the `alexmarshalltherapy.com` site in `sites/alexmarshalltherapy.com/`; shared internal `workspace:*` packages live under `packages/*` (`@alxm/cf-worker`, `@alxm/cube-scss`). Husky git hooks and the beads workspace (`.beads/`) stay at the repo root.

**Unless stated otherwise, paths in this document are relative to `sites/alxm.me/`**, and the build/lint/deploy commands below run from inside that directory. From the repo root, the root `package.json` exposes per-site delegators that `cd` into the site and run its script: `alxm:*` for `sites/alxm.me/` (e.g. `pnpm alxm:build`, `pnpm alxm:deploy:stg`) and `amt:*` for `sites/alexmarshalltherapy.com/` (e.g. `pnpm amt:build`, `pnpm amt:deploy:stg`).

## Build Commands

```bash
pnpm run build           # Format, lint, test, build site, check permalinks
pnpm run build:cf        # Full build + R2 sync
pnpm run deploy          # build:cf + wrangler deploy (production)
pnpm run deploy:stg      # build:cf + wrangler deploy --env=staging
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
- `src/assets/scss/` - Thin local SCSS (`root.scss` + divergent partials); the shared design system is `@alxm/cube-scss` (`packages/cube-scss/`)
- `worker/` - Thin Cloudflare Worker entry (`createFetchHandler({ rss })` from `@alxm/cf-worker`); shared logic lives in `packages/cf-worker/`
- `_cloudflare/r2/` - R2 sync scripts (uploads large files to R2)
- `eleventy-plugins/` - Custom Eleventy plugins
- `tests/` - Test suite (Node.js built-in test runner, `node:test` + `assert/strict`)

### SCSS Structure (CUBE CSS)

Styles use CUBE CSS methodology with Utopia fluid typography. The shared design system lives in the `@alxm/cube-scss` workspace package (`packages/cube-scss/scss/`); each site keeps only a thin local `root.scss` plus its divergent partials:

- `global/` - Reset, variables, base styles (+ alxm-only `_themes.scss`, local)
- `config/` - Design tokens, fonts, Sass helpers (Utopia is imported here as `pkg:utopia-core-scss/...`, a dep of the package, not the sites)
- `compositions/` - Layout primitives (flow, stack, grid, sidebar, etc.)
- `blocks/` - Component-specific styles (+ alxm-only `_artwork.scss`, therapy-only `_cta.scss`, local)
- `utilities/` - Single-purpose utility classes (+ alxm-only `_external-link.scss`, local)

How the seam works:

- `root.scss` `@use`s shared layers via `pkg:@alxm/cube-scss/<layer>` and local divergent layers via the site's own `_index.scss`. Each `.eleventy.js` adds `importers: [new sass.NodePackageImporter(...)]` to the `sass.compileString` call so `pkg:` URLs resolve through the pnpm workspace symlinks.
- A site that adds a partial to a shared layer (themes, artwork, cta, external-link) keeps a **local** `_index.scss` for that layer and `@forward`s the package leaves + its local leaf **at the original cascade position** — not appended at the end. CUBE cascade order (compositions → utilities → blocks; global/config before all) and within-layer ordering are load-bearing; preserving them is what keeps compiled CSS byte-identical.
- Package SCSS is not covered by the sites' stylelint globs (`src/**`); lint it via `npx stylelint "packages/cube-scss/scss/**/*.scss"` if you edit it.

There is a cube-css skill that exists in this repository which you must reference when making changes to styling, including CSS and fonts, in this repository.

### Collections

Collections are auto-generated from `src/_data/site.js` nav items with `collection: true`. Each collection reads from `src/{collection}/**/*.md`.

### Cloudflare Integration

**Unified Worker** — shared logic in the `@alxm/cf-worker` workspace package (`packages/cf-worker/`); each site's `worker/index.js` is a thin `export default createFetchHandler({ rss })` entry (alxm.me `rss: true`, alexmarshalltherapy.com `rss: false`):

- Serves static assets from `_site/` via Workers static assets
- Proxies large files from R2 (podcast audio, large PDFs) with MIME detection and range request support
- Adds caching headers to RSS feed (Last-Modified, If-Modified-Since) when `rss: true`
- Adds `TDM-Reservation: 1` header to HTML responses (W3C TDM Protocol opt-out)
- Configuration in each site's `wrangler.toml`; package owns the worker unit tests (run via root `pnpm test:packages`)

**R2 Sync** (`_cloudflare/r2/`):

- Syncs large files to R2 bucket (see `config.js` for `R2_DIRS`)
- Runs as part of `build:cf` command
- Large files excluded from Eleventy passthrough for faster builds (~344MB):
  - `src/assets/files/` - PDFs, misc audio
  - `src/assets/podcast/audio/` - Podcast episodes
- To test these files locally: `cp -r src/assets/files src/assets/podcast/audio _site/assets/`

**Deployment** (manual from local — no Workers Builds auto-deploy):

- `pnpm run deploy` → production at `alxm.me` (top-level Worker `alxm-website`)
- `pnpm run deploy:stg` → staging at `alxm-website-staging.<account>.workers.dev` (separate Worker via `[env.staging]` in `wrangler.toml`)
- Staging shares the prod R2 bucket and KV namespace — it reads the same content. Re-declaring bindings under `[env.staging]` is required because Wrangler env blocks don't inherit them.
- Auth: `wrangler login` (or `CLOUDFLARE_API_TOKEN` env var). R2 sync needs the `.env` keys (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`).
- LFS files are smudged on the deploying machine — deploys don't consume LFS bandwidth. `eleventy-plugins/audio-validation.js` and `_cloudflare/r2/sync.js` still guard against pointer files defensively in case anyone deploys from a fresh checkout with `GIT_LFS_SKIP_SMUDGE=1`.

**Other**:

- KV stores writing collection items and permalink baseline
- Environment variables required in `.env` for Cloudflare API access

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

When ending a work session, complete ALL steps below. Work is NOT complete until `git push` succeeds.

1. **File issues for remaining work** — bead/issue for anything that needs follow-up.
2. **Run quality gates** (if code changed) — tests, linters, builds.
3. **Update issue status** — close finished work, update in-progress items.
4. **Push to remote** — this is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status   # MUST show "up to date with origin"
   ```
   `.beads/issues.jsonl` propagates via the normal `git push` — no `bd dolt push` needed here (no Dolt remote configured; see the `bd-persistence` memory).
5. **Clean up** — clear stashes; `git fetch --prune` then `git worktree remove` and `git branch -D` for the merged branch. Repos have auto-delete-on-merge enabled, so don't run `git push --delete`.
6. **Verify** — all changes committed AND pushed.
7. **Hand off** — provide context for the next session if more work remains.

**Critical rules:**

- Work is NOT complete until `git push` succeeds.
- NEVER stop before pushing — that leaves work stranded locally.
- NEVER say "ready to push when you are" — YOU must push.
- If push fails, resolve and retry until it succeeds.
<!-- END BEADS INTEGRATION -->

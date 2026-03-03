---
name: cube-css
description: Styling (CSS architecture and fonts) design patterns for this website
---

When making any styling changes to this codebase that involve fonts or CSS, you must adhere to the system that is described here.

# CSS Architecture: alxm.me

## Overview

Styles use three interlocking systems:
1. **CUBE CSS** — organisational methodology (Composition, Utility, Block, Exception)
2. **Every Layout** — algorithmic layout primitives (Stack, Cluster, Sidebar, etc.)
3. **Utopia** — fluid typography and spacing scales using CSS `clamp()`

SCSS entry point loads layers in order: `global → config → utilities → blocks → compositions`

---

## CUBE CSS Methodology

**C — Composition** (`src/assets/scss/compositions/`)
High-level macro layout. Provides structure and rhythm. Must NOT apply visual treatments (colour, font style, shadows). Suggests layout to the browser rather than enforcing it.

**U — Utility** (`src/assets/scss/utilities/`)
Single-purpose classes. Each does one job. Extend design tokens. Do NOT use `!important`. Do NOT combine unrelated properties (that belongs in a Block).

**B — Block** (`src/assets/scss/blocks/`)
Component-level styles. By this stage global CSS, compositions and utilities have done most of the work. Blocks handle component-specific concerns. Max ~80–100 lines per file. Use element selectors within the block namespace (`.my-block img`, `.my-block .title`) — no BEM double-underscore required, but BEM-style naming (`.block__element`) is used here for sub-elements.

**E — Exception**
State-based variations on blocks triggered by `data-*` attributes. Never CSS classes.
Example: `<div class="[ cluster ]" data-state="repel">` → applies `justify-content: space-between`.
Exceptions must be concise. If a variation is so different it's unrecognisable, create a new block.

**HTML Class Grouping**
Use square bracket delimiter to group classes by layer:
```html
class="[ block-name ] [ composition utility ] [ token-utilities ]"
```
Example: `class="[ card ] [ stack flow ] [ bg-light measure-short ]"`

---

## Design Token System

**Never hardcode CSS values.** Always use design tokens via:

### In SCSS files
```scss
@use "../config/design-tokens" as dt;

dt.get-size("m")          // Returns fluid clamp() size value
dt.get-color("primary")   // Returns var(--color-primary)
dt.get-value("measure", "long")  // Returns 65ch
dt.use("text", 3)         // Mixin: applies font-size token
dt.use("weight", "bold")  // Mixin: applies font-weight token
dt.use("leading", "tight")// Mixin: applies line-height token
dt.use("measure", "short")// Mixin: applies max-width token
```

### In CSS / templates
Use the CSS custom properties defined in `_variables.scss`:
```
--flow-space   (default: l size)
--gutter       (default: m size)
--measure      (default: 65ch / "long")
--padding      (default: xs size)
--shadow-size  (default: 2xs-xs size)
```

Color custom properties (light mode defaults, auto-switch dark mode):
```
--color-dark / --color-dark-shade / --color-dark-glare
--color-light / --color-light-shade / --color-light-glare
--color-primary / --color-primary-shade / --color-primary-glare
--color-secondary / --color-secondary-shade / --color-secondary-glare
```

Semantic color tokens (prefer these over raw color tokens):
```
--bg-color       --text-color      --accent-color
--box-shadow-color
--footer-bg      --footer-text
--hero-bg        --hero-header-text  --hero-header-text-mark  --hero-byline-text
```

---

## Size Scale (Utopia Fluid Spacing)

Generated via `utopia-core-scss`. All values are `clamp()` expressions that scale between 320px and 1240px viewport width.

Named steps (t-shirt sizing):
```
2xs  xs  s  m  l  xl  2xl  3xl  none(0rem)
```
Transitional one-up pairs (more dramatic scaling between viewports):
```
2xs-xs  xs-s  s-m  m-l  l-xl  xl-2xl  2xl-3xl
```
Use: `dt.get-size("m")`, or override `--flow-space`, `--gutter`, `--padding` custom properties.

---

## Type Scale (Utopia Fluid Typography)

### Standard type scale (body-level, 16px–22px base)
Steps `-2` through `5` — generated as CSS `clamp()` values.
```
-2   caption/small text
-1   code (slightly smaller than body)
 0   body text (default)
 1   slightly larger
 2–5 headings h4 → h1
```
Global heading sizes: `h1=5, h2=4, h3=3, h4=2, h5=1, h6=0`

### Mega type scale (hero-level, 35px–90px base)
Steps `-4` through `0` (prefix "step-"), for `.hero__header` only.
Use: `dt.use("text-mega", -2)` etc.

---

## Colour System

Dark mode is automatic via `prefers-color-scheme: dark` in `_variables.scss`.
Manual theme override: `data-theme="artwork"` on `<html>` (defined in `_themes.scss`).

Color names follow `{base}-{shade/glare}` convention where shade=darker, glare=lighter.

Token-based colour utilities are generated: `.bg-{color}`, `.color-{color}`, `.border-color-{color}`
(e.g. `.bg-primary`, `.color-dark-shade`)

---

## Fonts

```scss
@use "../config/fonts";
fonts.base   // Source Serif 4, Georgia, serif (body default)
fonts.sans   // Inter, Helvetica, sans-serif (with OpenType features)
```
Utility classes: `.font-base`, `.font-sans`

---

## Every Layout Primitives — Implemented

These compositions are in `src/assets/scss/compositions/`. Always prefer these over writing new layout CSS.

### `.flow`
Vertical rhythm using the "owl" pattern (adjacent sibling combinator).
```scss
.flow > * + * { margin-block-start: var(--flow-space); }
```
Use for: simple vertical spacing between block elements. Override `--flow-space` contextually.
Note: After a heading, `--flow-space` is reduced to `2xs` (tighter heading-to-content gap).

### `.stack` / `.stack-split-1`
Flexbox-based vertical column. Resets all child margins then adds `--flow-space` between siblings.
- `.stack` — simple flex column
- `.stack-split-1` — pushes items after child 1 to the bottom (card footer split pattern)

Use: anywhere elements stack vertically, especially cards and full-height containers.

### `.cluster`
Flex wrap grouping — items flow horizontally and wrap naturally.
```scss
.cluster { display: flex; flex-wrap: wrap; gap: var(--flow-space); }
```
Data-attribute exceptions:
- `data-state="repel"` — `justify-content: space-between`
- `data-state="center"` — `align-items: center`

Use: navigation, tag lists, button groups, any set of items that should wrap.

### `.sidebar`
Two-column flex layout. First child = sidebar (fixed width); last child = main content (fills remaining). Automatically stacks when main content would be < 50% width. Default sidebar width: `compact` measure (28ch). Gap: `xs` size.

Data-attribute exceptions:
- `data-state="reversed"` — swaps which child is sidebar vs main
- `data-state="mirrored"` — `flex-direction: row-reverse`

Also exposes mixins: `sidebar.sidebar($width, $min, $gap)`, `sidebar.is-sidebar($width)`, `sidebar.not-sidebar($min)`

Use: any two-column layout needing responsive wrapping.

### `.switcher`
Flex that switches between horizontal and vertical at a container threshold. Items are always equal width. Current config: max 3 items across, threshold based on `compact` measure.
```scss
// children: flex-basis grows/shrinks around --min-width threshold
// Quantity guard: >3 items always go full-width
```
Use: equal-width groups (not for sidebar-style asymmetry). Product cards, step sequences.

### `.grid`
CSS Grid with `auto-fit` + `minmax`. Items fill columns automatically based on `--min-item-width` (default: 12rem).
```scss
.grid { display: grid; gap: var(--flow-space);
  grid-template-columns: repeat(auto-fit, minmax(min(var(--min-item-width, 12rem), 100%), 1fr)); }
```
Also exposed as mixin `compositions.grid` (used in `.artwork`).
Use: galleries, card grids, any responsive multi-column layout.

### `.cover`
Full viewport-height flex column. The element with `data-target` is vertically centred; first/last children without `data-target` pin to top/bottom.
Use: hero sections, full-screen landing areas.

### `.center`
Centers content horizontally with padding.
```scss
.center { box-sizing: content-box; margin-inline: auto; padding-inline: var(--padding); }
```
Data-attribute exception:
- `data-state="intrinsic"` — flex column with `align-items: center` for intrinsic centering

Use: wrapping page sections for horizontal centering.

---

## Every Layout Primitives — Not Yet Implemented

These primitives from Every Layout are not yet in the project. Add as compositions if needed:
- **Box** — padding + border container with colour inheritance (currently `.box` exists as a utility)
- **Reel** — horizontal scrolling container with custom scrollbar
- **Imposter** — overlay/modal positioning
- **Icon** — inline SVG icon with text alignment
- **Container** — CSS container query wrapper

---

## Site-Specific Compositions

These live in `compositions/` but are project-specific adaptations, not Every Layout primitives:

### `.intro`
Two-column layout for intro sections. Uses CSS container queries.
- `.intro__header` — sidebar-like (flex: 1 1 compact measure)
- `.intro__content` — main content (flex: 2 2 short measure)
- `data-state="reversed"` — flips layout, header text-align adjusts via container query

### `.site-header`
Header composition with baseline-aligned inner cluster and brand link.

---

## Utility Classes Reference

| Class | Purpose |
|---|---|
| `.box` | Padding container. `data-shadow` = offset hatch shadow. `data-outline` = visible border. `data-fit-content` = width:fit-content. Child `.box` inherits padding. |
| `.wrapper` | Max-width 70rem, centred, horizontal gutter padding (`m` size) |
| `.gutter` | `padding-inline: var(--gutter)` |
| `.measure-reset` | Removes max-width constraint (`--measure: none`) |
| `.radius` | `border-radius: 0.25rem` |
| `.site-wrap` | `overflow-x: hidden; position: relative` (outermost page wrapper) |
| `.drop-cap` | Drop cap on first `<p>` in the element (float + black weight) |
| `.visually-hidden` | Screen-reader only, not visually displayed |
| `.font-base` | Source Serif 4 serif font |
| `.font-sans` | Inter sans-serif font |
| `a.arrow-shift` | Animated `→` appended after link text on hover |
| `a.hover-show` | Link with no underline; underline appears on hover |

### Token Utility Classes (auto-generated)
Pattern: `.{token}-{variant}` — one utility class per token×variant combination.
```
.bg-{color}           background color
.color-{color}        text color
.border-{width}       border-width (thin/normal/thick)
.border-style-{style} border-style
.border-color-{color} border-color
.flow-space-{size}    --flow-space custom property
.gutter-{size}        --gutter custom property
.leading-{value}      line-height (loose/tight/flat)
.measure-{size}       max-width (micro/compact/mini/short/medium/long/reset)
.padding-{size}       --padding custom property
.shadow-{size}        --shadow-size custom property
.text-{step}          font-size (steps -2 through 5)
.text-mega-{step}     font-size mega scale (steps -4 through 0, prefix "step-")
.weight-{value}       font-weight (extra-light through black)
```

---

## Block Classes Reference

| Block | File | Description |
|---|---|---|
| `.article` | `_article.scss` | Article layout. `.article__content` has padding + measure constraint. `.article__photo` is centred image (70% max for portrait). Reduces flow-space after headings. |
| `.artwork` | `_artwork.scss` | Gallery (`.artwork__gallery`) uses grid mixin with 320px min-item-width. Preview uses cover pattern with `data-target`. |
| `.button` | `_button.scss` | CTA button. Radius, sans-serif, bold, uppercase. `data-variant="ghost"` = transparent bg. |
| `.contact-options` | `_contact-options.scss` | Contact link list with secondary colour background. |
| `.footnotes` | `_footnotes.scss` | Strips underline from footnote links. |
| `.frame` | `_frame.scss` | Aspect-ratio container. Default 4:3. `data-ratio` variants: `16-9`, `4-3`, `1-1`, `4-5`, `5-7`, `5-6`, `7-9`, `2-3`. Add `data-landscape` to invert. `data-fit-content` uses `object-fit: contain`. |
| `.hero` | `_hero.scss` | Hero section with secondary bg. `.hero__header` uses mega type scale. `<mark>` gets highlight treatment. |
| `.nav` | `_nav.scss` | Nav links (line-height:1). `data-state="active"` and `aria-current="page"` show underline indicator. |
| `.quote` | `_quote.scss` | Styled blockquote with primary colour left border. Auto-adds `"` quotation marks. Attribution right-aligned. |
| `.site-footer` | `_site-footer.scss` | Footer with `--footer-bg`/`--footer-text` colours. `.site-footer__content` has block + inline padding. |
| `.skip-link` | `_skip-link.scss` | A11y skip nav. Absolutely positioned, visually hidden unless focused. |

---

## Exception Pattern Summary

All exceptions use `data-*` attributes (never extra CSS classes):

```
.cluster[data-state="repel"]        justify-content: space-between
.cluster[data-state="center"]       align-items: center
.center[data-state="intrinsic"]     intrinsic centering (flex column)
.sidebar[data-state="reversed"]     swap sidebar and main child roles
.sidebar[data-state="mirrored"]     row-reverse direction
.intro[data-state="reversed"]       flip header/content order
.button[data-variant="ghost"]       transparent background
.box[data-shadow]                   offset hatch shadow (::before pseudo)
.box[data-outline]                  visible border (0.2rem solid)
.box[data-fit-content]              width: fit-content
.frame[data-ratio="16-9"]           set aspect ratio (many variants)
.frame[data-landscape]              invert ratio to landscape
.frame[data-fit-content]            object-fit: contain
.cover > [data-target]              vertically centres this child
.nav a[data-state="active"]         shows underline indicator
.artwork__preview [data-target]     full-height centred preview
```

---

## Workflow: Adding or Modifying CSS

1. **Check compositions first** — can an existing layout primitive handle this?
2. **Check utilities** — is there a token utility class that applies the style?
3. **For a new component** — add a block file in `blocks/`, max ~80–100 lines
4. **For a state variation** — add `[data-*]` exception to the block, not a new class
5. **For spacing/sizing** — use `--flow-space`, `--gutter`, `--padding` custom properties or override them locally; use `dt.get-size()` in SCSS
6. **For colours** — use semantic tokens (`--bg-color`, `--accent-color`) first; raw color tokens second; never hex values
7. **For typography** — use `dt.use("text", N)` mixin or `.text-{step}` utility; never hardcode `font-size`
8. **For new layout patterns not covered by existing primitives** — implement the relevant Every Layout primitive as a new composition file

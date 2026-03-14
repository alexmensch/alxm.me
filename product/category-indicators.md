---
guid: 75a177de-32cf-4661-a87c-76ce8a779933
date: 2026-03-14
feature: category-indicators
---

## Feature: Category Indicators

Surface article categories throughout the writing section so readers can see what topic an article covers before clicking into it, navigate between articles in the same category, and encounter an editorial flourish on individual articles that nods to the category in a literary style inspired by the New Yorker.

## Requirements

| # | Requirement | Description | Acceptance Criteria | Edge Cases / Error Conditions |
|---|-------------|-------------|---------------------|-------------------------------|
| 1 | Single tag validation | Each article in the writing collection must have exactly one tag. The build must fail with a clear error if an article has zero tags or more than one tag. | Build fails with an error message naming the offending file when an article has 0 or 2+ tags. Build succeeds when every article has exactly 1 tag. | Articles in draft state (if applicable) should still be validated. Error message must include the file path so the author can fix it quickly. |
| 2 | Category pill on collection list | Each article entry on the writing collection page (`/writing/`) displays a pill-shaped label showing the article's tag, positioned next to the date. | Pill is visible next to the date for every article in the list. Pill text is the tag name in title case. Pill uses the site's sans-serif typeface. Pill has a thin outline (no fill) in a colour deterministically assigned to that tag. | Tags that are very long (e.g. 25+ characters) should not break the layout. Pill must remain legible and not overlap adjacent elements. |
| 3 | Curated colour palette | A curated set of 8–12 colours is defined for tag pills. Each tag is assigned a colour by hashing the tag name and selecting from this palette. The same tag always produces the same colour. | Given the same tag name, the same colour is always selected. All palette colours meet a minimum contrast ratio against both light and dark mode backgrounds. Colours are visually distinct from each other within the palette. | If the number of unique tags exceeds the palette size, colours will repeat — this is acceptable. Palette must be defined in a single, maintainable location. |
| 4 | Dark mode support | Category pills and their colours must render correctly in both light and dark mode. | In light mode, pill outlines are visible and legible against the light background. In dark mode, pill outlines are visible and legible against the dark background. The palette adapts per-mode if needed (e.g. lighter tints in dark mode, deeper tones in light mode). | Switching between modes must update pill colours without a page reload if the site already supports live theme switching. |
| 5 | Tag archive pages | Clicking a category pill navigates to `/writing/{tag-slug}/`, which displays a filtered view of the writing collection showing only articles with that tag. | URL follows the pattern `/writing/{tag-slug}/`. Page displays the same list layout as `/writing/` but filtered to the selected tag. Hero title reads "Writing: {Tag Name}" where Tag Name is title-cased. Page returns a 404 or is not generated for tags that don't exist in any published article. | If a tag is used by only one article, the archive page still generates. Tag slug must be URL-safe (lowercase, hyphenated). |
| 6 | Collection pill links to archive | Each category pill on the writing collection list is a link to the corresponding tag archive page. | Clicking the pill navigates to `/writing/{tag-slug}/`. Pill is a standard anchor element with appropriate semantics. | Pill must be keyboard-accessible and focusable. Link destination must match the archive page defined in requirement 5. |
| 7 | New Yorker–style article flourish | Individual article pages display an editorial category line using a per-tag phrase mapping. The tag name within the phrase links to the tag archive page. | Each article page shows a category flourish (e.g. "From the annals of Psychology"). The tag name portion of the phrase is a link to `/writing/{tag-slug}/`. The flourish uses phrasing from a maintained per-tag mapping. | Flourish must be visually distinct from the article title and body — it is a secondary element, not a heading. The link within the flourish must be keyboard-accessible. |
| 8 | Per-tag phrase mapping with build enforcement | A mapping of tag → custom phrase exists (e.g. `psychology` → "From the annals of Psychology"). The build must fail if any tag used in a published article does not have a corresponding phrase entry. | Build fails with a clear error naming the unmapped tag and the article file that uses it. Adding a new tag to an article without updating the mapping causes a build failure. The mapping is maintained in a single, central location. | Error message must be actionable — it should tell the author both which tag is missing and where to add the mapping. |
| 9 | Title case transformation | Tag names are automatically title-cased for display in pills, archive page heroes, and flourish phrases. The raw tag value in frontmatter remains lowercase. | A tag `psychology` displays as "Psychology". A tag `personal-growth` displays as "Personal Growth" (hyphen replaced with space, each word capitalised). The frontmatter tag value is not modified. | Single-word tags and multi-word hyphenated tags both transform correctly. |

## Out of Scope

- **Tag management UI or CMS integration** — tags are managed directly in Markdown frontmatter; no authoring tooling is included.
- **Multi-tag support** — each article has exactly one tag. Displaying or filtering by multiple tags is not part of this feature.
- **Tag-based RSS feeds** — per-tag RSS feeds (e.g. `/writing/psychology/feed.xml`) are not included.
- **Tag counts or cloud views** — no aggregate tag statistics or tag cloud visualisation is included.
- **Animated or interactive pill effects** — pills are static styled elements with no hover animations beyond standard link behaviour.
- **SEO metadata for tag archive pages** — custom Open Graph images or meta descriptions per tag page are not included; they will use site defaults.

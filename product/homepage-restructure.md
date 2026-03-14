---
guid: f47f97da-45e5-474d-b368-afe0a0573c11
date: 2026-03-14
feature: homepage-restructure
---

## Feature: Homepage restructure

The site's current homepage is a minimal link hub with almost no indexable content, which weakens SEO. The substantive personal and professional content lives on a separate About page that most organic visitors never reach. This feature promotes the About page content to become the homepage, relocates the current landing page to `/hello/` for use as a social media link-in-bio, and cleans up navigation accordingly.

## Requirements

| # | Requirement | Description | Acceptance Criteria | Edge Cases / Error Conditions |
|---|-------------|-------------|---------------------|-------------------------------|
| 1 | Relocate current homepage to /hello/ | The current minimal landing page (title, intro text, links to key sections) moves from `/` to `/hello/`. It retains its existing layout, content, and visual style — no header, no footer. It is not listed in any site navigation. | A request to `/hello/` returns the current landing page content with no site header or footer. The page does not appear in header nav or footer nav. | If a user navigates directly to `/hello/`, the page renders correctly with all internal links functional. |
| 2 | Exclude /hello/ from search indexing | The `/hello/` page includes a `noindex` meta directive so search engines do not index it. This keeps search engine attention on the content-rich homepage. | The rendered HTML at `/hello/` contains `<meta name="robots" content="noindex">` (or equivalent). | The directive must be present in the `<head>`, not in the body. Other pages on the site must not be affected by this change. |
| 3 | Promote About content to homepage | The current About page content (body text, blockquote, all sections) becomes the new homepage at `/`. The page uses the landing layout, shows the site header and footer, and does not render a hero section. The page title in metadata is "Home" (or equivalent site-level default). | A request to `/` returns the full About page body content. The site header and footer are visible. No hero section is rendered. The `<title>` tag does not say "About me". | The page must render the blockQuote shortcode and all markdown content correctly at the new URL. Internal links within the content (e.g. `/coaching`, `/contact`) remain valid. |
| 4 | Conditional hero rendering | The article partial only renders the hero section when hero data is present in the page's front matter. Pages without hero front matter skip the hero entirely — no empty wrapper markup is emitted. | A page using the landing layout with no `hero` front matter produces no `.hero` element in the rendered HTML. A page with `hero` front matter still renders the hero as before. | All existing pages that currently use hero front matter must continue to render their hero sections unchanged. Only pages without hero data are affected. |
| 5 | Remove About from navigation | The "About" entry is removed from the site navigation configuration. It no longer appears in the header nav or the footer nav. No replacement link is added in its place. | The rendered site header contains no link to `/about/`. The rendered site footer contains no link to `/about/`. The total number of nav items decreases by one in both locations. | Other nav items (Counselling, Writing, Artwork, Podcast, Contact) remain unchanged in order and behaviour. |
| 6 | 301 redirect from /about/ to / | A permanent redirect is added to the existing `_redirects` file so that requests to `/about/` return a 301 redirect to `/`. This preserves SEO equity and prevents broken external links. | A request to `/about/` returns HTTP 301 with `Location: /`. The redirect entry exists in the `_redirects` file. | The redirect must not create a loop (i.e. `/` must not redirect anywhere). Requests to other paths must be unaffected. |
| 7 | Old about.md is removed | The `src/about.md` source file is deleted. No duplicate content exists at both `/` and `/about/`. | The file `src/about.md` does not exist in the repository after the change. Eleventy does not generate an `/about/index.html` output. | The build must complete successfully without the file. No other templates or data files may reference `about.md` directly in a way that would break. |

## Out of scope

- **Content changes to the promoted homepage.** The user will manually edit the content after the structural move is complete. No copywriting, restructuring, or new sections are part of this feature.
- **Redesign of the /hello/ page.** The link-in-bio page moves as-is. No new links, styling changes, or layout modifications.
- **SEO meta tag additions to the new homepage.** Beyond the existing meta description (carried over from the About page), no new structured data, Open Graph changes, or schema markup are included. These may be addressed separately.
- **Changes to the home layout template.** The `layouts/home` layout continues to exist and is used by `/hello/`. It is not modified or removed.
- **Permalink baseline updates.** The build includes permalink tracking. The baseline will need updating after this change, but that is a mechanical build step, not a feature requirement.

---
guid: c3218f68-e8a2-4901-883c-c015730ed201
date: 2026-03-08
feature: llm-training-opt-out
---

## Feature: LLM Training Opt-Out Signals

Strengthen the site's machine-readable signals that content may not be used for AI model training, while preserving permission for search indexing and AI input (RAG/grounding/citations).

## Requirements

| # | Requirement | Description | Acceptance Criteria | Edge Cases / Error Conditions |
|---|-------------|-------------|---------------------|-------------------------------|
| 1 | TDM-Reservation HTTP header | All HTML page responses served by the Cloudflare Worker include a `TDM-Reservation: 1` header, signaling rights reservation under the W3C TDM Protocol. | Every HTML response (Content-Type containing `text/html`) from the Worker includes the header `TDM-Reservation: 1`. Non-HTML responses (CSS, JS, images, R2 files, RSS) are not affected. | Header must not interfere with existing caching headers (RSS Last-Modified, R2 range requests). Header must be present on both direct page loads and any Worker-rewritten responses. |
| 2 | noimageai robots meta tag | All pages include a robots meta tag directing crawlers not to use images for AI training purposes. | Every page rendered by the site includes `<meta name="robots" content="noimageai">` in the `<head>`. Pages that already have a conditional `noindex, follow` meta tag retain that tag separately (both tags present, not merged). | Must not conflict with the existing conditional `noindex` meta tag. Must appear on all pages including error/404 pages if they use the same layout. |
| 3 | llms.txt usage policy | The llms.txt file includes explicit language about permitted and prohibited uses of the site's content, reinforcing the robots.txt Content-Signal policy. | llms.txt contains a clearly labeled section stating: (a) content may be used for citations, search results, and RAG/grounding; (b) content may not be used for training or fine-tuning AI models; (c) reference to robots.txt for full machine-readable policy. | Policy language must not contradict the existing robots.txt Content-Signal values (search=yes, ai-input=yes, ai-train=no). |

## Out of scope

- Hidden HTML paragraphs/text directives (rejected due to SEO risk and lack of standard support)
- `noai` meta tag (would contradict the `ai-input=yes` policy in robots.txt)
- TDM policy page or `.well-known/tdmrep.json` (the header alone is sufficient for now)
- Changes to existing robots.txt Content-Signal or crawler Disallow rules
- Any changes to how the site handles or serves content to crawlers beyond headers/meta

## Technical Specification

### Summary

Add machine-readable signals across three layers of the site to communicate that content may not be used for AI model training: (1) a `TDM-Reservation: 1` HTTP header on all HTML responses via the Cloudflare Worker, (2) a `<meta name="robots" content="noimageai">` tag in all page `<head>` sections, and (3) a usage policy section in `llms.txt` that aligns with the existing `robots.txt` Content-Signal values.

### Requirements

| # | Requirement | File(s) | Implementation Details | Acceptance Criteria |
|---|-------------|---------|------------------------|---------------------|
| 1 | TDM-Reservation HTTP header | `worker/index.js` | In the Worker's default `fetch` export, modify the static-asset fallthrough path (line 153). Instead of returning the response directly, capture it, check whether its `Content-Type` header contains `text/html`, and if so clone the response with a new `Headers` object that includes `TDM-Reservation: 1`. Non-HTML responses pass through unchanged. R2 and RSS handlers are not modified (they never serve `text/html`). | (a) Every HTML response includes `TDM-Reservation: 1`. (b) Non-HTML responses do not include the header. (c) Existing headers are preserved unchanged. |
| 2 | noimageai robots meta tag | `src/_includes/partials/site-meta.liquid` | Add unconditional `<meta name="robots" content="noimageai">` after the existing conditional `noindex` block (after line 13). All layouts inherit from `base.liquid` which renders this partial. When `meta.noindex` is true, both `<meta name="robots" content="noindex, follow">` and `<meta name="robots" content="noimageai">` appear as separate tags. | (a) Every page rendered through the layout contains the tag. (b) Pages with `meta.noindex` have both tags separately. (c) Pages without `meta.noindex` have only the `noimageai` tag. |
| 3 | llms.txt usage policy | `src/llms.txt.liquid` | Append a `## Usage Policy` section at the end of the file stating: (a) content may be used for citations, search results, and RAG/grounding; (b) content may NOT be used for training or fine-tuning AI models; (c) reference to `robots.txt` for full machine-readable policy using `site.domain` variable. Language must align with `search=yes, ai-input=yes, ai-train=no`. | (a) Built `llms.txt` contains a `## Usage Policy` section. (b) Permits citations, search, RAG/grounding. (c) Prohibits training/fine-tuning. (d) References robots.txt. (e) No contradiction with Content-Signal values. |

### Implementation Notes

- **Requirement 1**: The `env.ASSETS.fetch()` call handles Cloudflare's `not_found_handling = "404-page"` internally, so 404 responses also flow through this path. To preserve all original headers, create a new `Headers` from the original, append `TDM-Reservation: 1`, then construct a new `Response` with the original body, status, and modified headers.
- **Requirement 2**: All non-404 layouts inherit from `base.liquid` → `site-meta.liquid`. The tag is unconditional and uses the same indentation as surrounding meta tags (8 spaces).
- **Requirement 3**: The `## Usage Policy` section is appended after the existing `## Sections` list. Uses `site.domain` Liquid variable for the robots.txt URL.
- All three requirements are fully independent (separate files, no shared dependencies).

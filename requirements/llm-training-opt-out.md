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

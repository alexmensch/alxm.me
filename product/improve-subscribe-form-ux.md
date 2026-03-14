---
guid: 7815c6b1-6418-4dfb-962a-740be876f0ad
date: 2026-03-14
feature: improve-subscribe-form-ux
---

#### Feature: Improve subscribe form UX

The email subscribe form on article pages is currently too visually prominent — placed at the very top of articles with bold, large text that competes with the article content. This feature moves the form to the end of articles (where engaged readers will see it), reduces its visual weight, and introduces a subscribe option on the contact page.

**Implementation directive:** All CSS changes must be made by invoking the `cube-css` skill located at `.claude/skills/cube-css`. This skill defines the project's CSS architecture, design token system, and conventions. It must be consulted before adding or modifying any SCSS files to ensure consistency with the existing CUBE CSS methodology.

#### Requirements

| # | Requirement | Description | Acceptance Criteria | Edge Cases / Error Conditions |
|---|-------------|-------------|---------------------|-------------------------------|
| 1 | Move subscribe form to end of article | The subscribe form renders after the article body content instead of before it, so only readers who have engaged with the article see it | Subscribe form appears after `{{ content }}` in the article template when `subscription == true`; form no longer appears before the article body | Pages with very short content should still show the form below content; pages where `subscription` is not true must not render any form |
| 2 | Reduce subscribe form text size | The CTA text uses a smaller font size than the current implementation, removing the bold/extra-bold weight to reduce visual dominance | CTA text no longer uses `weight-extra-bold` class; text size is visually smaller than the current implementation while remaining legible | Text must remain accessible at the reduced size (minimum equivalent of ~14px rendered) |
| 3 | Update article subscribe CTA copy | The CTA text changes from "Want new posts in your inbox?" to softer copy that acknowledges the reader has just finished reading | CTA text reads "Enjoyed this? Get new posts by email" (or similar reader-acknowledging copy) | The default CTA in the partial's fallback assignment must also be updated |
| 4 | Add subscribe card to contact page | A fourth contact option card is added to the contact page containing an inline email subscribe form with the same functionality as the article subscribe form | Contact page displays 4 option cards; the subscribe card contains a working email input, submit button, and handles success/error states identically to the article form | Form validation, honeypot fields, API submission, and error handling must work the same as the article form |
| 5 | Contact page subscribe card copy | The subscribe card has appropriate body text and CTA styling that fits with the existing contact option cards | Card includes descriptive body text (e.g. "Get new posts delivered to your inbox") and the inline form replaces the CTA link pattern used by the other cards | The card must visually match the other contact option cards in height, padding, and style |
| 6 | Add switcher-2 composition class | A new `.switcher-2` CSS class is created using the existing switcher mixin with `$max-items: 2`, enabling a 2-column layout that wraps to 1 column on narrow viewports | `.switcher-2` class exists and uses `@include switcher(2, ...)` from the existing mixin; the class produces a 2x2 grid on wide viewports and a single-column stack on narrow viewports | Must not break the existing `.switcher` (3-item) class; the breakpoint for wrapping to 1 column should use the same min-item-width logic as the existing switcher |
| 7 | Contact page uses switcher-2 layout | The contact options container switches from the `.switcher` class to `.switcher-2` so that the 4 cards display in a 2x2 grid on wide viewports | Contact options render in a 2x2 grid on wide viewports and stack to a single column on narrow viewports | With exactly 4 items, the 2x2 layout should be balanced (2 items per row); if an option is later removed (back to 3), the layout should still function gracefully |

#### Out of scope

- **Scroll-triggered or mid-article subscribe prompts**: Considered during research but ruled out — these feel interruptive on a personal blog and add JavaScript complexity for uncertain benefit.
- **Sticky bar or floating subscribe widget**: Not appropriate for the site's understated aesthetic.
- **Removing the LinkedIn CTA from the contact page**: LinkedIn serves a different user intent (professional connection) than email subscription. Both are retained.
- **A/B testing or analytics for subscribe form conversion**: Not in scope for this change. The goal is a better default experience, not data-driven optimisation.
- **Changes to the subscribe form's API integration or backend**: The feedmail integration remains unchanged.
- **Subscribe form in the site footer**: The form stays within article content and the contact page only — no global footer placement.

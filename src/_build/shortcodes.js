/**
 * Custom shortcodes for article content.
 *
 * Extracted from .eleventy.js for independent testability.
 */

export function articleImage(src, alt, ratio, portrait, href) {
  if (ratio === undefined) {
    throw new Error("articleImage shortcode requires a ratio parameter");
  }

  const tag = href ? "a" : "div";
  const attrs = href ? `href="${href}"` : "";
  const html = `<div class="[ article__photo ]" ${portrait ? "data-portrait" : ""}>
<div class="[ box ] [ shadow-2xs-xs padding-none ]" data-shadow>
<${tag} ${attrs} class="frame" data-fit-content data-ratio="${ratio}" ${portrait ? "" : "data-landscape"}>
<img src="/assets/images/${src}" alt="${alt}" />
</${tag}>
</div>
</div>`;
  return html;
}

export function blockQuote(content, name, source, url = false) {
  const html = `<div class="[ quote ] [ flow ]">
<blockquote>
<p>${content}</p>
</blockquote>
<p class="flow-space-xs">${name}, ${url ? `<a href="${url}">` : ""}<cite>${source}</cite>${url ? "</a>" : ""}</p>
</div>`;
  return html;
}

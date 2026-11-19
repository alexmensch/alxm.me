/**
 * Custom shortcodes for article content.
 */

export function articleImage(src, alt, ratio, portrait, href) {
  if (ratio === undefined) {
    throw new Error("articleImage shortcode requires a ratio parameter");
  }

  const tag = href ? "a" : "div";
  const attrs = href ? `href="${href}"` : "";
  const html = `<div class="[ article__photo ]" ${portrait ? "data-portrait" : ""}>
<div class="[ box ] [ padding-none shadow-2xs-xs ]" data-shadow>
<${tag} ${attrs} class="frame" data-fit-content data-ratio="${ratio}" ${portrait ? "" : "data-landscape"}>
<img src="/assets/images/${src}" alt="${alt}" />
</${tag}>
</div>
</div>`;
  return html;
}

export function blockQuote(content, name, source, url = false) {
  const html = `<div class="[ flow ] [ quote ]">
<blockquote>
<p>${content}</p>
</blockquote>
<p class="flow-space-xs">${name}, ${url ? `<a href="${url}">` : ""}<cite>${source}</cite>${url ? "</a>" : ""}</p>
</div>`;
  return html;
}

export function cta(content, href, label, title = false) {
  if (!href || !label) {
    throw new Error("cta shortcode requires href and label parameters");
  }

  const heading = title ? `<h2>${title}</h2>\n` : "";
  const html = `<div class="[ flow ] [ cta ] [ flow-space-m ]">
${heading}<p>${content}</p>
<a class="[ button ]" href="${href}">${label}</a>
</div>`;
  return html;
}

export const HIGHLIGHT_ROWS = 2;

export function highlights(content) {
  return `<div class="[ grid ] [ highlights ]" data-subgrid style="--subgrid-rows: ${HIGHLIGHT_ROWS}">
${content.trim().replace(/\n\s*\n/g, "\n")}
</div>`;
}

export function highlight(content, title) {
  if (!title) {
    throw new Error("highlight shortcode requires a title parameter");
  }

  return `<div class="[ box ] [ padding-xs radius ]">
<h3>${title}</h3>
<p>${content}</p>
</div>`;
}

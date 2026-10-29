/**
 * Eleventy plugin: render a per-page OG card for any page whose og:image points
 * under `generatedDir`. Pages opt in by setting `ogImage` to a URL under that
 * dir (e.g. in a *.11tydata.js) — this hook names no collection. It runs off
 * the post-build `results`: a custom collection's getAll() races pagination,
 * and results carry no page data, so the title is recovered from the rendered
 * og:title. The card is written to the exact path the page's og:image already
 * points at, so the URL and the file can never disagree. A card that fails to
 * render (or has no title) falls back to the static identity card.
 *
 * config = {
 *   domain, siteName,
 *   titleSeparator = " • ",   // stripped, with siteName, off og:title
 *   generatedDir,             // e.g. "/assets/images/og/auto"
 *   theme                     // passed through to the renderers
 * }
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderArticleCard, renderIdentityCard } from "./render.js";

export const DEFAULT_TITLE_SEPARATOR = " • ";

/** The og:image URL declared in rendered page `content`, if any. */
export function extractOgImage(content) {
  return content?.match(/property="og:image" content="([^"]+)"/)?.[1];
}

/** The og:title with the ` <sep><siteName>` suffix stripped, trimmed. */
export function extractTitle(content, titleSeparator, siteName) {
  return content
    ?.match(/property="og:title" content="([^"]+)"/)?.[1]
    ?.replace(`${titleSeparator}${siteName}`, "")
    .trim();
}

export function ogImagePlugin(eleventyConfig, config) {
  const {
    domain,
    siteName,
    titleSeparator = DEFAULT_TITLE_SEPARATOR,
    generatedDir,
    theme
  } = config;

  eleventyConfig.on("eleventy.after", async ({ dir, results }) => {
    const origin = `https://${domain}`;
    const generatedPrefix = `${origin}${generatedDir}/`;
    let fallback;
    let count = 0;
    for (const page of results) {
      const ogImage = extractOgImage(page.content);
      if (!ogImage?.startsWith(generatedPrefix)) continue;
      const title = extractTitle(page.content, titleSeparator, siteName);
      let png;
      if (title) {
        try {
          png = await renderArticleCard(title, theme);
        } catch (err) {
          console.warn(`[og] ${ogImage}: ${err.message}`);
        }
      }
      if (!png) png = fallback ??= await renderIdentityCard(theme);
      const outPath = path.join(dir.output, ogImage.slice(origin.length));
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, png);
      count++;
    }
    if (count) console.log(`[og] rendered ${count} per-page card(s)`);
  });
}

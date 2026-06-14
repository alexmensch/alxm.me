/**
 * Shared Eleventy plugin: registers the markdown-it library, the common filter
 * set, and the common shortcodes that both alxm.me and alexmarshalltherapy.com
 * use. Site-specific filters/shortcodes/plugins stay in each site's
 * .eleventy.js.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { makeHelpers } from "./helpers.js";
import { makeMarkdownLib } from "./markdown.js";
import { articleImage, blockQuote, cta } from "./shortcodes.js";

export { makeHelpers } from "./helpers.js";
export { makeMarkdownLib } from "./markdown.js";
export { articleImage, blockQuote, cta } from "./shortcodes.js";

/**
 * Absolute path to the package's Liquid includes dir. Add it to a site's
 * Liquid `root` (eleventyConfig.setLiquidOptions) so `{% render "partials/..." %}`
 * resolves package-owned partials (e.g. the feedmail subscribe-form) while
 * still reading each site's own data cascade. It must be registered as a root
 * in its own right — LiquidJS realpaths partials and rejects any that resolve
 * outside a configured root, so a symlink from the site tree would not work.
 */
export const includesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "includes"
);

/**
 * Build the loremIpsum filter. The `lorem-ipsum` dependency is injected by the
 * consuming site (alxm.me only) so it stays an optional peer dep — the package
 * never imports it directly.
 */
export function makeLoremIpsum(LoremIpsum) {
  const lorem = new LoremIpsum({
    sentencesPerParagraph: {
      max: 8,
      min: 4
    },
    wordsPerSentence: {
      max: 16,
      min: 4
    }
  });

  return function loremIpsum(count, type) {
    switch (type) {
      case "words":
      case "word":
        return lorem.generateWords(count);
      case "sentences":
      case "sentence":
        return lorem.generateSentences(count);
      case "paragraphs":
      case "paragraph":
        return lorem.generateParagraphs(count);
      default:
        return `Invalid input. Parameters were: ${count} and ${type}`;
    }
  };
}

/**
 * @param {object} eleventyConfig
 * @param {object} options
 * @param {string} options.domain        Required. Site domain for the markdown external-link rule.
 * @param {Function} [options.loremIpsum] The `LoremIpsum` class; registers the loremIpsum filter when passed.
 * @param {boolean} [options.pageTheme]  Registers the getPageTheme filter when truthy.
 * @param {object} [options.shortcodes]  Optional shortcode toggles, e.g. { cta: true }.
 */
export default function eleventyConfigPlugin(eleventyConfig, options = {}) {
  const { domain, loremIpsum, pageTheme = false, shortcodes = {} } = options;

  if (!domain) {
    throw new Error("@alxm/eleventy-config plugin requires a `domain` option");
  }

  const helpers = makeHelpers();
  const markdownLib = makeMarkdownLib({ domain });

  /* Markdown library */
  eleventyConfig.setLibrary("md", markdownLib);

  /* Common filters */
  eleventyConfig.addFilter("getLinkActiveState", helpers.getLinkActiveState);
  eleventyConfig.addFilter("hasAnyTag", helpers.hasAnyTag);
  eleventyConfig.addFilter("markdownify", (markdownString) =>
    markdownLib.renderInline(markdownString)
  );
  eleventyConfig.addFilter("dateToRfc3339", helpers.dateToRFC339);
  eleventyConfig.addFilter(
    "getNewestCollectionItemDate",
    helpers.getNewestCollectionItemDate
  );
  eleventyConfig.addFilter("markdownToHTML", helpers.markdownToHTML);
  eleventyConfig.addFilter("escapeHTML", helpers.escapeHTML);
  eleventyConfig.addFilter("jsonEscape", (str) =>
    JSON.stringify(String(str ?? "")).slice(1, -1)
  );

  /* Common shortcodes */
  eleventyConfig.addLiquidShortcode("articleImage", articleImage);
  eleventyConfig.addPairedShortcode("blockQuote", blockQuote);

  /* Opt-in filters / shortcodes */
  if (pageTheme) {
    eleventyConfig.addFilter("getPageTheme", helpers.getPageTheme);
  }
  if (loremIpsum) {
    eleventyConfig.addFilter("loremIpsum", makeLoremIpsum(loremIpsum));
  }
  if (shortcodes.cta) {
    eleventyConfig.addPairedShortcode("cta", cta);
  }
}

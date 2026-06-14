/**
 * Configured markdown-it instance with all plugins.
 *
 * The external-link rule needs the consuming site's own domain so that
 * same-site links aren't marked target="_blank"; it is therefore a required
 * factory option rather than a module-scope import of any site's config.
 */

import md from "markdown-it";
import mdFN from "markdown-it-footnote";
import mdIterator from "markdown-it-for-inline";
import mdSmartArrows from "markdown-it-smartarrows";

export function makeMarkdownLib({ domain } = {}) {
  if (!domain) {
    throw new Error("makeMarkdownLib requires a `domain` option");
  }

  const markdownLib = md({
    typographer: true,
    html: true
  })
    // Footnotes
    .use(mdFN)
    .use(mdIterator, "href_blank", "link_open", (tokens, idx) => {
      // eslint-disable-next-line no-unused-vars
      const [attrName, href] = tokens[idx].attrs.find(
        (attr) => attr[0] === "href"
      );

      if (
        href &&
        !href.includes(domain) &&
        (!href.startsWith("/") || href.startsWith("//")) &&
        !href.startsWith("#")
      ) {
        tokens[idx].attrPush(["target", "_blank"]);
        tokens[idx].attrPush(["rel", "noopener"]);
      }
    });

  // Footnote HTML customization
  markdownLib.renderer.rules.footnote_block_open = () =>
    '<section class="[ footnotes ] [ flow ]">\n' +
    "<h2>Notes</h2>\n" +
    '<ol role="list">\n';

  // Override footnote indicator render to output a number without square brackets
  markdownLib.renderer.rules.footnote_caption = (tokens, idx) => {
    let n = Number(tokens[idx].meta.id + 1).toString();
    if (tokens[idx].meta.subId > 0) {
      n += `:${tokens[idx].meta.subId}`;
    }
    return `${n}`;
  };

  // Add role="list" attribute for accessibility and correct styling
  function addListRole(tokens, idx, options, env, self) {
    tokens[idx].attrPush(["role", "list"]);
    return self.renderToken(tokens, idx, options);
  }
  markdownLib.renderer.rules.bullet_list_open = addListRole;
  markdownLib.renderer.rules.ordered_list_open = addListRole;

  markdownLib.use(mdSmartArrows);

  return markdownLib;
}

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_META_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "site-meta.liquid"
);

describe("site-meta.liquid noimageai robots meta tag", () => {
  let content;

  before(async () => {
    content = await readFile(SITE_META_PATH, "utf-8");
  });

  it("contains the noimageai robots meta tag", () => {
    assert.ok(
      content.includes('<meta name="robots" content="noimageai"'),
      'Expected site-meta.liquid to contain <meta name="robots" content="noimageai">'
    );
  });

  it("places the noimageai tag outside of any conditional block", () => {
    // The noimageai meta tag must not be wrapped in an {% if %} block.
    // We check that the noimageai tag appears after the closing {% endif %}
    // of the noindex conditional block, and is not itself inside an if/endif pair
    // that wraps only it.
    const lines = content.split("\n");
    let noimageaiLineIndex = -1;
    let lastEndifIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("noimageai")) {
        noimageaiLineIndex = i;
      }
      if (lines[i].includes("{% endif %}")) {
        // Track the endif that closes the noindex block
        if (i < noimageaiLineIndex || noimageaiLineIndex === -1) {
          lastEndifIndex = i;
        }
      }
    }

    assert.notEqual(
      noimageaiLineIndex,
      -1,
      "noimageai meta tag must exist in the template"
    );

    // Check there is no {% if %} on the line immediately before the noimageai tag
    // that would make it conditional
    const precedingLines = lines.slice(
      Math.max(0, noimageaiLineIndex - 3),
      noimageaiLineIndex
    );
    const hasConditionalWrapper = precedingLines.some(
      (line) =>
        line.includes("{% if") &&
        !line.includes("{% endif %}") &&
        !line.includes("noindex")
    );

    assert.ok(
      !hasConditionalWrapper,
      "noimageai meta tag must not be wrapped in its own conditional block"
    );
  });

  it("preserves the existing noindex conditional block", () => {
    assert.ok(
      content.includes("{% if meta.noindex %}"),
      "Expected the noindex conditional block to still exist"
    );
    assert.ok(
      content.includes('content="noindex, follow"'),
      'Expected the noindex meta tag with content="noindex, follow" to still exist'
    );
  });

  it("has the noindex and noimageai tags as separate elements", () => {
    // First verify noimageai exists in the template
    assert.ok(
      content.includes("noimageai"),
      "noimageai meta tag must exist before checking separation"
    );

    // The two robots meta tags must be separate <meta> elements, not combined
    // into a single tag. Verify that noindex and noimageai do not appear in
    // the same <meta> tag.
    const metaTagPattern = /<meta[^>]*>/g;
    const metaTags = content.match(metaTagPattern) || [];

    const combinedTag = metaTags.find(
      (tag) => tag.includes("noindex") && tag.includes("noimageai")
    );
    assert.equal(
      combinedTag,
      undefined,
      "noindex and noimageai must not be combined into a single meta tag"
    );
  });

  it("places the noimageai tag after the noindex conditional block", () => {
    const noindexEndifIndex = content.indexOf(
      "{% endif %}",
      content.indexOf("meta.noindex")
    );
    const noimageaiIndex = content.indexOf("noimageai");

    assert.notEqual(noimageaiIndex, -1, "noimageai tag must exist");
    assert.notEqual(
      noindexEndifIndex,
      -1,
      "noindex endif must exist"
    );
    assert.ok(
      noimageaiIndex > noindexEndifIndex,
      "noimageai tag must appear after the noindex conditional block's endif"
    );
  });
});

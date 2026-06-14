import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OG_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "site-opengraph.liquid"
);

describe("site-opengraph.liquid image tags", () => {
  let content;

  before(async () => {
    content = await readFile(OG_PATH, "utf-8");
  });

  it("emits an og:image", () => {
    assert.ok(
      content.includes('property="og:image"'),
      "Expected an og:image meta tag"
    );
  });

  it("emits twitter:card as summary_large_image", () => {
    // The card TYPE — not just twitter:image — is what makes Twitter/X render
    // the large preview.
    assert.ok(
      content.includes('content="summary_large_image"'),
      "Expected twitter:card=summary_large_image"
    );
    assert.ok(
      content.includes('name="twitter:image"'),
      "Expected a twitter:image meta tag"
    );
  });

  it("builds an absolute image URL from config (relative paths break OG previews)", () => {
    // The default falls back to a full https://<domain>/... URL, sourced from
    // site.og.defaultImage rather than a hardcoded path.
    assert.ok(
      content.includes("https://{{ site.domain }}{{ site.og.defaultImage }}"),
      "Expected the default og:image to be an absolute URL built from config"
    );
  });

  it("declares image dimensions from config", () => {
    assert.ok(content.includes('property="og:image:width"'));
    assert.ok(content.includes("{{ site.og.width }}"));
    assert.ok(content.includes('property="og:image:height"'));
    assert.ok(content.includes("{{ site.og.height }}"));
  });

  it("builds the image alt text from config, not hardcoded copy", () => {
    assert.ok(
      content.includes("{{ site.authorName }} — {{ site.authorRole }}"),
      "Expected the alt text to be composed from site.authorName + authorRole"
    );
    assert.ok(
      !content.includes("Therapeutic Counselling"),
      "The role should come from config, not be hardcoded in the partial"
    );
  });

  it("allows a per-page ogImage override", () => {
    // 20w.4 (per-article images) relies on this hook.
    assert.ok(
      content.includes("{% if ogImage %}"),
      "Expected an ogImage front-matter override branch"
    );
  });
});

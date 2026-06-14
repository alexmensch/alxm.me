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

describe("site-meta.liquid robots meta tags", () => {
  let content;

  before(async () => {
    content = await readFile(SITE_META_PATH, "utf-8");
  });

  it("does not emit a noimageai robots meta tag", () => {
    // The site allows AI search/grounding (see robots.liquid posture), so the
    // inherited image-AI opt-out must not be present.
    assert.ok(
      !content.includes("noimageai"),
      "site-meta.liquid must not contain a noimageai robots meta tag"
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
});

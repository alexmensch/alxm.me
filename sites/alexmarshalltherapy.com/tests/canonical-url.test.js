import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INCLUDES = join(__dirname, "..", "src", "_includes");
const read = (...parts) => readFile(join(INCLUDES, ...parts), "utf-8");

describe("canonical URL has one owner", () => {
  let base, meta, og, schema;

  before(async () => {
    [base, meta, og, schema] = await Promise.all([
      read("layouts", "base.liquid"),
      read("partials", "site-meta.liquid"),
      read("partials", "site-opengraph.liquid"),
      read("partials", "site-schema.liquid")
    ]);
  });

  it("base.liquid computes canonicalUrl and passes it to every head partial", () => {
    assert.ok(base.includes("{% assign canonicalUrl = canonical_url %}"));
    for (const partial of ["site-meta", "site-opengraph", "site-schema"]) {
      const render = base
        .split("\n")
        .find((line) => line.includes(`render "partials/${partial}"`));
      assert.ok(
        render?.includes("canonicalUrl: canonicalUrl"),
        `${partial} must receive canonicalUrl`
      );
    }
  });

  it("canonical link, og:url and BlogPosting url all read canonicalUrl", () => {
    assert.ok(
      meta.includes('<link rel="canonical" href="{{ canonicalUrl }}" />')
    );
    assert.ok(og.includes('property="og:url" content="{{ canonicalUrl }}"'));
    assert.ok(schema.includes('"url": "{{ canonicalUrl }}"'));
  });
});

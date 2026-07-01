import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractOgImage,
  extractTitle,
  DEFAULT_TITLE_SEPARATOR
} from "../plugin.js";

const page = (og) =>
  `<head>${Object.entries(og)
    .map(([k, v]) => `<meta property="${k}" content="${v}" />`)
    .join("")}</head>`;

describe("extractOgImage", () => {
  it("returns the og:image URL when present", () => {
    const content = page({
      "og:image": "https://alxm.me/assets/images/og/auto/writing/x.png"
    });
    assert.equal(
      extractOgImage(content),
      "https://alxm.me/assets/images/og/auto/writing/x.png"
    );
  });

  it("returns undefined when there is no og:image", () => {
    assert.equal(extractOgImage(page({ "og:title": "Hi" })), undefined);
    assert.equal(extractOgImage(undefined), undefined);
  });
});

describe("extractTitle", () => {
  const sep = DEFAULT_TITLE_SEPARATOR;
  const siteName = "Alex Marshall";

  it("strips the ' <sep><siteName>' suffix", () => {
    const content = page({ "og:title": `My Post${sep}${siteName}` });
    assert.equal(extractTitle(content, sep, siteName), "My Post");
  });

  it("leaves a title without the suffix untouched", () => {
    const content = page({ "og:title": "Standalone Title" });
    assert.equal(extractTitle(content, sep, siteName), "Standalone Title");
  });

  it("supports a custom separator", () => {
    const content = page({ "og:title": "Post | Site" });
    assert.equal(extractTitle(content, " | ", "Site"), "Post");
  });

  it("returns undefined when there is no og:title", () => {
    assert.equal(extractTitle(page({}), sep, siteName), undefined);
    assert.equal(extractTitle(undefined, sep, siteName), undefined);
  });
});

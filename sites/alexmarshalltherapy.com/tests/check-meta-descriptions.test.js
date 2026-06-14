import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  findOverlongDescriptions,
  MAX_DESCRIPTION_CHARS
} from "../check-meta-descriptions.js";

const meta = (content) => `<meta name="description" content="${content}" />`;

describe("findOverlongDescriptions", () => {
  it("flags a description over the limit", () => {
    const text = "a".repeat(MAX_DESCRIPTION_CHARS + 1);
    const result = findOverlongDescriptions(meta(text));
    assert.equal(result.length, 1);
    assert.equal(result[0].length, MAX_DESCRIPTION_CHARS + 1);
    assert.equal(result[0].text, text);
  });

  it("passes a description exactly at the limit", () => {
    const text = "a".repeat(MAX_DESCRIPTION_CHARS);
    assert.deepEqual(findOverlongDescriptions(meta(text)), []);
  });

  it("passes a description under the limit", () => {
    assert.deepEqual(findOverlongDescriptions(meta("short and sweet")), []);
  });

  it("measures decoded length, not the encoded byte string", () => {
    // 158 visible chars where every char is an ampersand: encoded as
    // `&amp;` (5 bytes each) the string is ~790 bytes, but only 158 chars
    // are shown — so it must NOT be flagged.
    const visible = "&".repeat(158);
    const encoded = "&amp;".repeat(158);
    assert.deepEqual(findOverlongDescriptions(meta(encoded)), []);
    // ...and the same trick must not let an over-length value slip through.
    const overEncoded = "&amp;".repeat(MAX_DESCRIPTION_CHARS + 1);
    const over = findOverlongDescriptions(meta(overEncoded));
    assert.equal(over.length, 1);
    assert.equal(over[0].text, "&".repeat(MAX_DESCRIPTION_CHARS + 1));
    assert.equal(visible.length, 158);
  });

  it("ignores pages with no description meta tag", () => {
    assert.deepEqual(
      findOverlongDescriptions("<html><body>hi</body></html>"),
      []
    );
  });

  it("checks every description tag in the document", () => {
    const html = meta("a".repeat(200)) + meta("ok") + meta("b".repeat(300));
    const result = findOverlongDescriptions(html);
    assert.equal(result.length, 2);
    assert.deepEqual(
      result.map((v) => v.length),
      [200, 300]
    );
  });
});

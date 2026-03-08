import { describe, it } from "node:test";
import assert from "node:assert/strict";
import podcast from "../src/_data/podcast.js";

describe("markdownToCDATA", () => {
  it("renders markdown to HTML and wraps in CDATA", () => {
    const result = podcast.markdownToCDATA("**bold** text");
    assert.equal(result, "<![CDATA[<p><strong>bold</strong> text</p>\n]]>");
  });

  it("returns empty CDATA for empty string", () => {
    assert.equal(podcast.markdownToCDATA(""), "<![CDATA[]]>");
  });

  it("returns empty CDATA for null input", () => {
    assert.equal(podcast.markdownToCDATA(null), "<![CDATA[]]>");
  });

  it("returns empty CDATA for undefined input", () => {
    assert.equal(podcast.markdownToCDATA(undefined), "<![CDATA[]]>");
  });

  it("escapes ]]> sequences within raw HTML content", () => {
    // Use raw HTML passthrough (html: true in markdown-it) to get literal ]]>
    // into the rendered output, which then triggers the CDATA escaping
    const result = podcast.markdownToCDATA(
      '<script>var x = "]]>";</script>'
    );
    // The ]]> inside the HTML should be escaped to prevent breaking the CDATA wrapper
    assert.ok(result.includes("]]]]><![CDATA[>"));
  });

  it("handles input with only markdown (no HTML)", () => {
    const result = podcast.markdownToCDATA("*italic* and **bold**");
    assert.ok(result.startsWith("<![CDATA["));
    assert.ok(result.endsWith("]]>"));
    assert.ok(result.includes("<em>italic</em>"));
    assert.ok(result.includes("<strong>bold</strong>"));
  });

  it("handles input with nested HTML tags", () => {
    const result = podcast.markdownToCDATA(
      '<div class="test"><p>nested</p></div>'
    );
    assert.ok(result.startsWith("<![CDATA["));
    assert.ok(result.endsWith("]]>"));
    assert.ok(result.includes("<div"));
  });
});

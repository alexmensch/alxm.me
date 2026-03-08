import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { articleImage, blockQuote } from "../src/_build/shortcodes.js";

describe("articleImage shortcode", () => {
  it("produces an img tag with src and alt attributes", () => {
    const html = articleImage("photo.jpg", "A photo", "16:9");
    assert.ok(html.includes('<img src="/assets/images/photo.jpg"'));
    assert.ok(html.includes('alt="A photo"'));
  });

  it("wraps image in an anchor tag when href is provided", () => {
    const html = articleImage(
      "photo.jpg",
      "A photo",
      "16:9",
      false,
      "https://example.com"
    );
    assert.ok(html.includes('<a href="https://example.com"'));
    assert.ok(html.includes("</a>"));
  });

  it("uses a div wrapper when href is not provided", () => {
    const html = articleImage("photo.jpg", "A photo", "16:9");
    // When href is falsy, tag should be "div" not "a"
    assert.ok(!html.includes("<a "));
    assert.ok(html.includes("<div"));
  });

  it("applies the ratio as a data attribute", () => {
    const html = articleImage("photo.jpg", "A photo", "16:9");
    assert.ok(html.includes('data-ratio="16:9"'));
  });

  it("adds portrait modifier when portrait is truthy", () => {
    const html = articleImage("photo.jpg", "A photo", "3:4", true);
    assert.ok(html.includes("data-portrait"));
  });

  it("adds landscape attribute when portrait is falsy", () => {
    const html = articleImage("photo.jpg", "A photo", "16:9", false);
    assert.ok(html.includes("data-landscape"));
  });

  it("does not add landscape when portrait is truthy", () => {
    const html = articleImage("photo.jpg", "A photo", "3:4", true);
    assert.ok(!html.includes("data-landscape"));
  });

  it("throws an error when ratio is undefined", () => {
    // After the source fix, articleImage should throw when ratio is undefined
    assert.throws(
      () => articleImage("photo.jpg", "A photo", undefined),
      Error
    );
  });

  it("renders with empty alt when alt is missing", () => {
    // Missing alt should still render the img with alt=""
    const html = articleImage("photo.jpg", "", "16:9");
    assert.ok(html.includes('alt=""'));
  });

  it("renders correctly with all optional parameters omitted", () => {
    // Only src, alt, and ratio are meaningfully required
    // portrait and href default to falsy
    const html = articleImage("photo.jpg", "Alt text", "1:1");
    assert.ok(html.includes("<img"));
    assert.ok(html.includes('data-ratio="1:1"'));
  });

  it("renders correctly with all parameters provided", () => {
    const html = articleImage(
      "photo.jpg",
      "Full photo",
      "4:3",
      true,
      "https://example.com"
    );
    assert.ok(html.includes('<a href="https://example.com"'));
    assert.ok(html.includes('data-ratio="4:3"'));
    assert.ok(html.includes("data-portrait"));
    assert.ok(html.includes('alt="Full photo"'));
  });

  it("includes article__photo wrapper class", () => {
    const html = articleImage("photo.jpg", "Alt", "16:9");
    assert.ok(html.includes("article__photo"));
  });

  it("includes box and shadow classes", () => {
    const html = articleImage("photo.jpg", "Alt", "16:9");
    assert.ok(html.includes("box"));
    assert.ok(html.includes("shadow-2xs-xs"));
  });
});

describe("blockQuote shortcode", () => {
  it("produces a blockquote element containing the content", () => {
    const html = blockQuote("Some quote text", "Author", "Source");
    assert.ok(html.includes("<blockquote>"));
    assert.ok(html.includes("Some quote text"));
    assert.ok(html.includes("</blockquote>"));
  });

  it("includes attribution with name and source", () => {
    const html = blockQuote("Quote", "John Doe", "Book Title");
    assert.ok(html.includes("John Doe"));
    assert.ok(html.includes("<cite>Book Title</cite>"));
  });

  it("wraps source in a link when URL is provided", () => {
    const html = blockQuote(
      "Quote",
      "Author",
      "Source",
      "https://example.com"
    );
    assert.ok(html.includes('<a href="https://example.com">'));
    assert.ok(html.includes("<cite>Source</cite>"));
    assert.ok(html.includes("</a>"));
  });

  it("does not include a link when URL is not provided", () => {
    const html = blockQuote("Quote", "Author", "Source");
    assert.ok(!html.includes("<a "));
    assert.ok(html.includes("<cite>Source</cite>"));
  });

  it("does not include a link when URL is false", () => {
    const html = blockQuote("Quote", "Author", "Source", false);
    assert.ok(!html.includes("<a "));
  });

  it("handles content containing HTML", () => {
    const html = blockQuote(
      "Text with <em>emphasis</em>",
      "Author",
      "Source"
    );
    assert.ok(html.includes("<em>emphasis</em>"));
  });

  it("includes the quote wrapper class", () => {
    const html = blockQuote("Quote", "Author", "Source");
    assert.ok(html.includes("quote"));
    assert.ok(html.includes("flow"));
  });
});

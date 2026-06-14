import { describe, it } from "node:test";
import assert from "node:assert/strict";
import markdownLib from "../src/_build/markdown.js";

describe("Markdown external link handling", () => {
  it("adds target=_blank and rel=noopener to external links", () => {
    const result = markdownLib.render("[Example](https://example.com)");
    assert.ok(result.includes('target="_blank"'));
    assert.ok(result.includes('rel="noopener"'));
  });

  it("does not add target=_blank to internal relative links", () => {
    const result = markdownLib.render("[About](/about/)");
    assert.ok(!result.includes('target="_blank"'));
  });

  it("does not add target=_blank to anchor links", () => {
    const result = markdownLib.render("[Section](#section)");
    assert.ok(!result.includes('target="_blank"'));
  });

  it("does not add target=_blank to same-domain links", () => {
    const result = markdownLib.render("[Home](https://alxm.me/about/)");
    assert.ok(!result.includes('target="_blank"'));
  });

  it("handles protocol-relative URLs as external", () => {
    // Protocol-relative URLs like //example.com don't start with / or #
    // and don't include alxm.me, so they should be treated as external
    const result = markdownLib.render("[Link](//example.com)");
    assert.ok(result.includes('target="_blank"'));
  });

  it("handles mixed internal and external links in the same paragraph", () => {
    const input =
      "[internal](/about/) and [external](https://example.com) links";
    const result = markdownLib.render(input);

    // External link should have target=_blank
    assert.ok(result.includes('target="_blank"'));
    // Should contain both links
    assert.ok(result.includes('href="/about/"'));
    assert.ok(result.includes('href="https://example.com"'));
  });
});

describe("Markdown footnote rendering", () => {
  it("renders footnote references as superscript links", () => {
    const input = "Text with a footnote[^1].\n\n[^1]: Footnote content.";
    const result = markdownLib.render(input);
    assert.ok(result.includes("<sup"));
  });

  it("renders footnote definitions in a custom section", () => {
    const input = "Text[^1].\n\n[^1]: Note content.";
    const result = markdownLib.render(input);
    assert.ok(result.includes('<section class="[ footnotes ] [ flow ]">'));
    assert.ok(result.includes("<h2>Notes</h2>"));
  });

  it("renders footnote captions without square brackets", () => {
    const input = "Text[^1].\n\n[^1]: Note content.";
    const result = markdownLib.render(input);
    // The footnote_caption override removes brackets, so it should
    // render just the number, not [1]
    assert.ok(!result.includes("[1]"));
  });

  it("numbers multiple footnotes sequentially", () => {
    const input =
      "First[^1] and second[^2].\n\n[^1]: First note.\n[^2]: Second note.";
    const result = markdownLib.render(input);
    // Should contain references to footnotes 1 and 2
    assert.ok(result.includes("fn1"));
    assert.ok(result.includes("fn2"));
  });

  it("uses an ordered list with role=list in footnote section", () => {
    const input = "Text[^1].\n\n[^1]: Note.";
    const result = markdownLib.render(input);
    assert.ok(result.includes('<ol role="list">'));
  });
});

describe("Markdown smart arrow substitutions", () => {
  it("converts --> to right arrow", () => {
    const result = markdownLib.render("A --> B");
    assert.ok(result.includes("\u2192"));
  });

  it("converts <-- to left arrow", () => {
    const result = markdownLib.render("A <-- B");
    assert.ok(result.includes("\u2190"));
  });

  it("converts <--> to bidirectional arrow", () => {
    const result = markdownLib.render("A <--> B");
    assert.ok(result.includes("\u2194"));
  });

  it("converts ==> to double right arrow", () => {
    const result = markdownLib.render("A ==> B");
    assert.ok(result.includes("\u21D2"));
  });

  it("converts <== to double left arrow", () => {
    const result = markdownLib.render("A <== B");
    assert.ok(result.includes("\u21D0"));
  });

  it("converts <==> to double bidirectional arrow", () => {
    const result = markdownLib.render("A <==> B");
    assert.ok(result.includes("\u21D4"));
  });

  it("does not convert arrows in code blocks", () => {
    const result = markdownLib.render("```\n-->\n```");
    // In code blocks, arrows should remain as literal text
    assert.ok(!result.includes("\u2192"));
    assert.ok(result.includes("--&gt;"));
  });
});

describe("Markdown list rendering with role=list", () => {
  it("adds role=list to unordered lists", () => {
    const result = markdownLib.render("- item one\n- item two");
    assert.ok(result.includes('<ul role="list">'));
  });

  it("adds role=list to ordered lists", () => {
    const result = markdownLib.render("1. first\n2. second");
    assert.ok(result.includes('<ol role="list">'));
  });

  it("adds role=list to nested lists", () => {
    const result = markdownLib.render("- item\n  - nested");
    // Both outer and inner ul should have role="list"
    const matches = result.match(/<ul role="list">/g);
    assert.ok(matches);
    assert.equal(matches.length, 2);
  });
});

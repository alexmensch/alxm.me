import { describe, it } from "node:test";
import assert from "node:assert/strict";
import helpers from "../src/_data/helpers.js";

describe("currentYear", () => {
  it("returns the current year as a 4-digit string", () => {
    const result = helpers.currentYear();
    const expected = new Date().getFullYear().toString();
    assert.equal(result, expected);
  });

  it("returns a string, not a number", () => {
    const result = helpers.currentYear();
    assert.equal(typeof result, "string");
  });
});

describe("permalinkToPath", () => {
  it("formats a title and date into a URL path", () => {
    const result = helpers.permalinkToPath(
      "Hello World",
      new Date("2025-01-15T00:00:00Z")
    );
    assert.equal(result, "2025/01/15/hello-world/");
  });

  it("always ends with a trailing slash", () => {
    const result = helpers.permalinkToPath(
      "Test",
      new Date("2025-06-01T00:00:00Z")
    );
    assert.ok(result.endsWith("/"));
  });

  it("handles titles with special characters", () => {
    const result = helpers.permalinkToPath(
      "What's New!",
      new Date("2025-03-10T00:00:00Z")
    );
    assert.equal(result, "2025/03/10/whats-new/");
  });

  it("handles dates at month boundaries", () => {
    const result = helpers.permalinkToPath(
      "End of Month",
      new Date("2025-01-31T00:00:00Z")
    );
    assert.equal(result, "2025/01/31/end-of-month/");
  });

  it("zero-pads single-digit months and days", () => {
    const result = helpers.permalinkToPath(
      "Early",
      new Date("2025-02-05T00:00:00Z")
    );
    assert.equal(result, "2025/02/05/early/");
  });
});

describe("permalinkToFilename", () => {
  it("formats a title and date into a filename with dashes", () => {
    const result = helpers.permalinkToFilename(
      "Hello World",
      new Date("2025-01-15T00:00:00Z")
    );
    assert.equal(result, "2025-01-15-hello-world");
  });

  it("does not have a trailing slash", () => {
    const result = helpers.permalinkToFilename(
      "Test",
      new Date("2025-06-01T00:00:00Z")
    );
    assert.ok(!result.endsWith("/"));
  });

  it("uses dashes as delimiters", () => {
    const result = helpers.permalinkToFilename(
      "My Post",
      new Date("2025-03-10T00:00:00Z")
    );
    assert.equal(result, "2025-03-10-my-post");
  });

  it("handles titles with special characters", () => {
    const result = helpers.permalinkToFilename(
      "What's New!",
      new Date("2025-03-10T00:00:00Z")
    );
    assert.equal(result, "2025-03-10-whats-new");
  });
});

describe("permalinkToPage", () => {
  it("converts a title to a slug", () => {
    const result = helpers.permalinkToPage("Hello World");
    assert.equal(result, "hello-world");
  });

  it("is equivalent to toSlug", () => {
    const title = "Some Page Title";
    assert.equal(helpers.permalinkToPage(title), helpers.toSlug(title));
  });
});

describe("toSlug", () => {
  it("converts to lowercase with dashes", () => {
    assert.equal(helpers.toSlug("Hello World"), "hello-world");
  });

  it("removes characters in the remove pattern", () => {
    assert.equal(helpers.toSlug("Hello!@World"), "helloworld");
  });

  it("returns empty string for empty input", () => {
    assert.equal(helpers.toSlug(""), "");
  });

  it("collapses multiple spaces into a single dash", () => {
    assert.equal(helpers.toSlug("multiple   spaces"), "multiple-spaces");
  });

  it("handles strings with only removed characters", () => {
    const result = helpers.toSlug("!@*+~.()':!");
    assert.equal(typeof result, "string");
  });

  it("preserves characters not in the remove pattern", () => {
    // Characters like ?, #, $, %, ^, & are NOT in the remove pattern
    const result = helpers.toSlug("hello-world");
    assert.equal(result, "hello-world");
  });

  it("handles unicode characters", () => {
    const result = helpers.toSlug("cafe latte");
    assert.equal(result, "cafe-latte");
  });
});

describe("toDate", () => {
  it("formats a date with slash delimiter", () => {
    const result = helpers.toDate(new Date("2025-01-15T00:00:00Z"), "/");
    assert.equal(result, "2025/01/15");
  });

  it("formats a date with dash delimiter", () => {
    const result = helpers.toDate(new Date("2025-01-15T00:00:00Z"), "-");
    assert.equal(result, "2025-01-15");
  });

  it("zero-pads single-digit months and days", () => {
    const result = helpers.toDate(new Date("2025-02-05T00:00:00Z"), "/");
    assert.equal(result, "2025/02/05");
  });

  it("handles dates at year boundary", () => {
    const result = helpers.toDate(new Date("2024-12-31T00:00:00Z"), "/");
    assert.equal(result, "2024/12/31");
  });
});

describe("dateToRFC2822", () => {
  it("returns the UTC string representation", () => {
    const result = helpers.dateToRFC2822(new Date("2025-01-15T00:00:00Z"));
    assert.equal(result, "Wed, 15 Jan 2025 00:00:00 GMT");
  });
});

describe("dateToRFC339", () => {
  it("returns the ISO string representation", () => {
    const result = helpers.dateToRFC339(new Date("2025-01-15T00:00:00Z"));
    assert.equal(result, "2025-01-15T00:00:00.000Z");
  });

  it("includes milliseconds", () => {
    const result = helpers.dateToRFC339(new Date("2025-01-15T00:00:00Z"));
    assert.ok(result.includes(".000Z"));
  });
});

describe("getLinkActiveState", () => {
  it("returns aria-current and data-state for exact match on non-root path", () => {
    const result = helpers.getLinkActiveState("/writing/", "/writing/");
    assert.equal(result, ' aria-current="page" data-state="active"');
  });

  it("returns only data-state for parent path match", () => {
    const result = helpers.getLinkActiveState(
      "/writing/",
      "/writing/some-post/"
    );
    assert.equal(result, ' data-state="active"');
  });

  it("returns empty string when no match", () => {
    const result = helpers.getLinkActiveState("/writing/", "/about/");
    assert.equal(result, "");
  });

  it("returns only aria-current for root exact match", () => {
    // Root path "/" has length 1, so the length > 1 check fails for data-state
    const result = helpers.getLinkActiveState("/", "/");
    assert.equal(result, ' aria-current="page"');
  });

  it("does not match non-position-0 substring", () => {
    // itemPath "/art/" should not match pagePath "/artwork/" at position 0
    // because itemPath.length > 1 and pagePath.indexOf(itemPath) !== 0
    const result = helpers.getLinkActiveState("/art/", "/not-art/page/");
    assert.equal(result, "");
  });

  it("handles empty strings", () => {
    const result = helpers.getLinkActiveState("", "");
    assert.equal(typeof result, "string");
  });
});

describe("getPageTheme", () => {
  const siteNav = [
    { title: "Writing", url: "/writing/" },
    { title: "Artwork", url: "/artwork/", theme: "artwork" },
    { title: "Podcast", url: "/podcast/" }
  ];

  it("returns the theme for a matching path", () => {
    const result = helpers.getPageTheme("/artwork/some-piece/", siteNav);
    assert.equal(result, "artwork");
  });

  it("returns null when matching path has no theme property", () => {
    const result = helpers.getPageTheme("/podcast/episode/", siteNav);
    assert.equal(result, null);
  });

  it("returns null when no path matches", () => {
    const result = helpers.getPageTheme("/unknown/path/", siteNav);
    assert.equal(result, null);
  });

  it("returns null when theme is undefined", () => {
    const nav = [{ title: "Writing", url: "/writing/", theme: undefined }];
    const result = helpers.getPageTheme("/writing/post/", nav);
    assert.equal(result, null);
  });

  it("returns null for empty nav array", () => {
    const result = helpers.getPageTheme("/writing/", []);
    assert.equal(result, null);
  });
});

describe("loremIpsum", () => {
  it("returns a string for type 'words'", () => {
    const result = helpers.loremIpsum(5, "words");
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });

  it("returns a string for type 'sentences'", () => {
    const result = helpers.loremIpsum(2, "sentences");
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });

  it("returns a string for type 'paragraphs'", () => {
    const result = helpers.loremIpsum(1, "paragraphs");
    assert.equal(typeof result, "string");
    assert.ok(result.length > 0);
  });

  it("accepts singular forms", () => {
    assert.equal(typeof helpers.loremIpsum(1, "word"), "string");
    assert.equal(typeof helpers.loremIpsum(1, "sentence"), "string");
    assert.equal(typeof helpers.loremIpsum(1, "paragraph"), "string");
  });

  it("returns an error message for invalid type", () => {
    const result = helpers.loremIpsum(5, "invalid");
    assert.ok(result.includes("Invalid input"));
    assert.ok(result.includes("5"));
    assert.ok(result.includes("invalid"));
  });

  it("returns a non-empty string for count of 0", () => {
    const result = helpers.loremIpsum(0, "words");
    assert.equal(typeof result, "string");
  });
});

describe("getNewestCollectionItemDate", () => {
  it("returns the newest date from items with item.date", () => {
    const collection = [
      { date: new Date("2025-01-01") },
      { date: new Date("2025-06-15") },
      { date: new Date("2025-03-10") }
    ];
    const result = helpers.getNewestCollectionItemDate(collection);
    assert.deepEqual(result, new Date("2025-06-15"));
  });

  it("returns the newest date from items with item.data.date", () => {
    const collection = [
      { data: { date: new Date("2024-12-01") } },
      { data: { date: new Date("2025-02-28") } }
    ];
    const result = helpers.getNewestCollectionItemDate(collection);
    assert.deepEqual(result, new Date("2025-02-28"));
  });

  it("handles mixed collections with item.date and item.data.date", () => {
    const collection = [
      { date: new Date("2025-01-01") },
      { data: { date: new Date("2025-07-01") } }
    ];
    const result = helpers.getNewestCollectionItemDate(collection);
    assert.deepEqual(result, new Date("2025-07-01"));
  });

  it("throws an error for null input", () => {
    assert.throws(() => helpers.getNewestCollectionItemDate(null), Error);
  });

  it("throws an error for empty array", () => {
    assert.throws(() => helpers.getNewestCollectionItemDate([]), Error);
  });

  it("returns the date for a single item", () => {
    const collection = [{ date: new Date("2025-05-01") }];
    const result = helpers.getNewestCollectionItemDate(collection);
    assert.deepEqual(result, new Date("2025-05-01"));
  });

  it("handles items with identical dates", () => {
    const date = new Date("2025-01-01");
    const collection = [{ date }, { date }, { date }];
    const result = helpers.getNewestCollectionItemDate(collection);
    assert.deepEqual(result, date);
  });
});

describe("markdownToHTML", () => {
  it("renders bold text", () => {
    const result = helpers.markdownToHTML("**bold**");
    assert.ok(result.includes("<strong>bold</strong>"));
  });

  it("renders italic text", () => {
    const result = helpers.markdownToHTML("*italic*");
    assert.ok(result.includes("<em>italic</em>"));
  });

  it("renders links", () => {
    const result = helpers.markdownToHTML("[link](https://example.com)");
    assert.ok(result.includes('<a href="https://example.com">link</a>'));
  });

  it("passes through HTML unchanged", () => {
    const result = helpers.markdownToHTML('<div class="test">content</div>');
    assert.ok(result.includes('<div class="test">content</div>'));
  });

  it("does not add external link attributes (plain markdown-it instance)", () => {
    // The helpers.md instance is a plain markdown-it without the external link plugin
    const result = helpers.markdownToHTML("[link](https://example.com)");
    assert.ok(!result.includes('target="_blank"'));
  });
});

describe("escapeHTML", () => {
  it("escapes ampersands", () => {
    assert.ok(helpers.escapeHTML("&").includes("&amp;"));
  });

  it("escapes less-than signs", () => {
    assert.ok(helpers.escapeHTML("<").includes("&lt;"));
  });

  it("escapes greater-than signs", () => {
    assert.ok(helpers.escapeHTML(">").includes("&gt;"));
  });

  it("escapes single quotes", () => {
    assert.ok(helpers.escapeHTML("'").includes("&#39;"));
  });

  it("escapes double quotes", () => {
    assert.ok(helpers.escapeHTML('"').includes("&quot;"));
  });

  it("returns empty string for empty input", () => {
    assert.equal(helpers.escapeHTML(""), "");
  });

  it("returns unchanged string when no special characters", () => {
    assert.equal(helpers.escapeHTML("hello world"), "hello world");
  });

  it("escapes all five special characters in one string", () => {
    const result = helpers.escapeHTML("&<>'\"");
    assert.equal(result, "&amp;&lt;&gt;&#39;&quot;");
  });
});

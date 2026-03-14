import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

describe("titleCaseTag", () => {
  let helpers;

  before(async () => {
    const mod = await import("../src/_data/helpers.js");
    helpers = mod.default;
    assert.equal(typeof helpers.titleCaseTag, "function", "titleCaseTag must be exported from helpers");
  });

  it("capitalises a single lowercase word", () => {
    assert.equal(helpers.titleCaseTag("psychology"), "Psychology");
  });

  it("splits on hyphens and capitalises each word", () => {
    assert.equal(helpers.titleCaseTag("personal-growth"), "Personal Growth");
  });

  it("returns empty string for empty input", () => {
    assert.equal(helpers.titleCaseTag(""), "");
  });

  it("handles a single character tag", () => {
    assert.equal(helpers.titleCaseTag("a"), "A");
  });

  it("handles multiple hyphens producing empty segments", () => {
    const result = helpers.titleCaseTag("one--two");
    assert.equal(typeof result, "string");
  });

  it("capitalises the first letter of a short tag", () => {
    assert.equal(helpers.titleCaseTag("ai"), "Ai");
  });

  it("handles three-word hyphenated tags", () => {
    assert.equal(
      helpers.titleCaseTag("one-two-three"),
      "One Two Three"
    );
  });
});

describe("tagColorIndex", () => {
  let helpers;

  before(async () => {
    const mod = await import("../src/_data/helpers.js");
    helpers = mod.default;
    assert.equal(typeof helpers.tagColorIndex, "function", "tagColorIndex must be exported from helpers");
  });

  it("returns the same index for the same tag on repeated calls", () => {
    const first = helpers.tagColorIndex("technology");
    const second = helpers.tagColorIndex("technology");
    assert.equal(first, second);
  });

  it("returns a number in the range [0, 10)", () => {
    const index = helpers.tagColorIndex("psychology");
    assert.ok(index >= 0, `expected >= 0 but got ${index}`);
    assert.ok(index < 10, `expected < 10 but got ${index}`);
  });

  it("returns an integer", () => {
    const index = helpers.tagColorIndex("design");
    assert.equal(index, Math.floor(index));
  });

  it("works with an empty string without throwing", () => {
    const index = helpers.tagColorIndex("");
    assert.ok(index >= 0);
    assert.ok(index < 10);
  });

  it("returns values in valid range for many different tags", () => {
    const tags = [
      "technology",
      "leadership",
      "culture",
      "psychology",
      "business",
      "design",
      "ai",
      "politics",
      "science",
      "philosophy"
    ];
    for (const tag of tags) {
      const index = helpers.tagColorIndex(tag);
      assert.ok(
        index >= 0 && index < 10,
        `tag "${tag}" produced out-of-range index ${index}`
      );
    }
  });

  it("can produce different indices for different tags", () => {
    const indices = new Set(
      ["technology", "psychology", "design", "ai", "music", "film"].map(
        (tag) => helpers.tagColorIndex(tag)
      )
    );
    assert.ok(indices.size > 1, "expected at least two distinct indices");
  });
});

describe("validateWritingTags", () => {
  let validateWritingTags;

  before(async () => {
    const mod = await import("../eleventy-plugins/tag-validation.js");
    validateWritingTags = mod.validateWritingTags;
    assert.equal(typeof validateWritingTags, "function", "validateWritingTags must be exported");
  });

  const validTagPhrases = {
    technology: "From the department of {tag}",
    psychology: "From the notebooks on {tag}"
  };

  it("does not throw for a valid collection with string tags in tagPhrases", () => {
    const collection = [
      { title: "Article One", tag: "technology" },
      { title: "Article Two", tag: "psychology" }
    ];
    assert.doesNotThrow(() =>
      validateWritingTags(collection, validTagPhrases)
    );
  });

  it("does not throw for an empty collection", () => {
    assert.doesNotThrow(() => validateWritingTags([], validTagPhrases));
  });

  it("does not throw for a null collection", () => {
    assert.doesNotThrow(() => validateWritingTags(null, validTagPhrases));
  });

  it("accepts items with data.tag and data.title", () => {
    const collection = [
      { data: { title: "Nested Article", tag: "technology" } }
    ];
    assert.doesNotThrow(() =>
      validateWritingTags(collection, validTagPhrases)
    );
  });

  it("throws when an item has no tag field", () => {
    const collection = [{ title: "Missing Tag Article" }];
    assert.throws(
      () => validateWritingTags(collection, validTagPhrases),
      (err) => err.message.includes("validation failed")
    );
  });

  it("throws when tag is an empty string", () => {
    const collection = [{ title: "Empty Tag Article", tag: "" }];
    assert.throws(
      () => validateWritingTags(collection, validTagPhrases),
      (err) => err.message.includes("validation failed")
    );
  });

  it("throws when tag is a non-string type (array)", () => {
    const collection = [
      { title: "Array Tag Article", tag: ["technology", "psychology"] }
    ];
    assert.throws(
      () => validateWritingTags(collection, validTagPhrases),
      (err) => err.message.includes("validation failed")
    );
  });

  it("throws when tag is not present in tagPhrases", () => {
    const collection = [
      { title: "Unknown Tag Article", tag: "nonexistent" }
    ];
    assert.throws(
      () => validateWritingTags(collection, validTagPhrases),
      (err) => err.message.includes("validation failed")
    );
  });

  it("includes article title in the error output for an invalid tag", () => {
    const collection = [
      { title: "My Specific Title", tag: "nonexistent" }
    ];
    const originalError = console.error;
    let errorOutput = "";
    console.error = (msg) => {
      errorOutput += String(msg);
    };
    try {
      validateWritingTags(collection, validTagPhrases);
    } catch {
      // expected
    } finally {
      console.error = originalError;
    }
    assert.ok(
      errorOutput.includes("My Specific Title"),
      `expected error output to include article title, got: ${errorOutput}`
    );
  });

  it("throws when tag is a number", () => {
    const collection = [{ title: "Number Tag Article", tag: 42 }];
    assert.throws(
      () => validateWritingTags(collection, validTagPhrases),
      (err) => err.message.includes("validation failed")
    );
  });
});

describe("tagPhrases data", () => {
  let tagPhrases;

  before(async () => {
    const mod = await import("../src/_data/tagPhrases.js");
    tagPhrases = mod.default;
    assert.ok(tagPhrases, "tagPhrases must have a default export");
  });

  it("exports a plain object", () => {
    assert.equal(typeof tagPhrases, "object");
    assert.ok(tagPhrases !== null);
    assert.ok(!Array.isArray(tagPhrases));
  });

  it("has at least one entry", () => {
    assert.ok(Object.keys(tagPhrases).length > 0);
  });

  it("has all lowercase keys", () => {
    for (const key of Object.keys(tagPhrases)) {
      assert.equal(key, key.toLowerCase(), `key "${key}" is not lowercase`);
    }
  });

  it("has all values containing the {tag} placeholder", () => {
    for (const [key, value] of Object.entries(tagPhrases)) {
      assert.ok(
        value.includes("{tag}"),
        `tagPhrases["${key}"] = "${value}" does not contain {tag}`
      );
    }
  });

  it("has string values for all entries", () => {
    for (const [key, value] of Object.entries(tagPhrases)) {
      assert.equal(
        typeof value,
        "string",
        `tagPhrases["${key}"] should be a string, got ${typeof value}`
      );
    }
  });
});

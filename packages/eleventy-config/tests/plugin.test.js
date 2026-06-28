import { describe, it } from "node:test";
import assert from "node:assert/strict";
import plugin, { makeLoremIpsum } from "../index.js";

function makeMockConfig() {
  const calls = {
    filters: {},
    liquidShortcodes: {},
    pairedShortcodes: {},
    library: null
  };
  return {
    calls,
    addFilter(name, fn) {
      calls.filters[name] = fn;
    },
    addLiquidShortcode(name, fn) {
      calls.liquidShortcodes[name] = fn;
    },
    addPairedShortcode(name, fn) {
      calls.pairedShortcodes[name] = fn;
    },
    setLibrary(name, lib) {
      calls.library = { name, lib };
    }
  };
}

class FakeLoremIpsum {
  generateWords(n) {
    return `words:${n}`;
  }
  generateSentences(n) {
    return `sentences:${n}`;
  }
  generateParagraphs(n) {
    return `paragraphs:${n}`;
  }
}

describe("eleventy-config plugin", () => {
  it("throws when no domain is provided", () => {
    assert.throws(() => plugin(makeMockConfig(), {}), /domain/);
  });

  it("sets the markdown library and registers common filters/shortcodes", () => {
    const config = makeMockConfig();
    plugin(config, { domain: "alxm.me" });

    assert.equal(config.calls.library.name, "md");

    const expectedFilters = [
      "getLinkActiveState",
      "hasAnyTag",
      "markdownify",
      "dateToRfc3339",
      "getNewestCollectionItemDate",
      "markdownToHTML",
      "escapeHTML",
      "jsonEscape"
    ];
    for (const name of expectedFilters) {
      assert.equal(
        typeof config.calls.filters[name],
        "function",
        `expected filter ${name} to be registered`
      );
    }

    assert.equal(typeof config.calls.liquidShortcodes.articleImage, "function");
    assert.equal(typeof config.calls.pairedShortcodes.blockQuote, "function");
  });

  it("wires markdownify through the configured markdown library", () => {
    const config = makeMockConfig();
    plugin(config, { domain: "alxm.me" });
    const result = config.calls.filters.markdownify("**bold**");
    assert.ok(result.includes("<strong>bold</strong>"));
  });

  it("does not register opt-in filters/shortcodes by default", () => {
    const config = makeMockConfig();
    plugin(config, { domain: "alxm.me" });
    assert.equal(config.calls.filters.getPageTheme, undefined);
    assert.equal(config.calls.filters.loremIpsum, undefined);
    assert.equal(config.calls.pairedShortcodes.cta, undefined);
  });

  it("registers opt-in filters/shortcodes when enabled", () => {
    const config = makeMockConfig();
    plugin(config, {
      domain: "alxm.me",
      pageTheme: true,
      loremIpsum: FakeLoremIpsum,
      shortcodes: { cta: true }
    });
    assert.equal(typeof config.calls.filters.getPageTheme, "function");
    assert.equal(typeof config.calls.filters.loremIpsum, "function");
    assert.equal(typeof config.calls.pairedShortcodes.cta, "function");
  });
});

describe("makeLoremIpsum", () => {
  const loremIpsum = makeLoremIpsum(FakeLoremIpsum);

  it("generates words for the plural and singular type", () => {
    assert.equal(loremIpsum(5, "words"), "words:5");
    assert.equal(loremIpsum(1, "word"), "words:1");
  });

  it("generates sentences for the plural and singular type", () => {
    assert.equal(loremIpsum(2, "sentences"), "sentences:2");
    assert.equal(loremIpsum(1, "sentence"), "sentences:1");
  });

  it("generates paragraphs for the plural and singular type", () => {
    assert.equal(loremIpsum(1, "paragraphs"), "paragraphs:1");
    assert.equal(loremIpsum(1, "paragraph"), "paragraphs:1");
  });

  it("returns an error message for an invalid type", () => {
    const result = loremIpsum(5, "invalid");
    assert.ok(result.includes("Invalid input"));
    assert.ok(result.includes("5"));
    assert.ok(result.includes("invalid"));
  });
});

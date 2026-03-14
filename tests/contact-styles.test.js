import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SWITCHER_PATH = join(
  __dirname,
  "..",
  "src",
  "assets",
  "scss",
  "compositions",
  "_switcher.scss"
);
const CONTACT_OPTIONS_SCSS_PATH = join(
  __dirname,
  "..",
  "src",
  "assets",
  "scss",
  "blocks",
  "_contact-options.scss"
);
const CONTACT_OPTIONS_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "contact-options.liquid"
);

describe("switcher-2 class in _switcher.scss", () => {
  let switcherContent;

  before(async () => {
    switcherContent = await readFile(SWITCHER_PATH, "utf-8");
  });

  it("defines a .switcher-2 class", () => {
    assert.ok(
      switcherContent.includes(".switcher-2"),
      "_switcher.scss must define a .switcher-2 class"
    );
  });

  it("uses @include switcher(2, ...) for .switcher-2", () => {
    // Extract the .switcher-2 block
    const switcher2Index = switcherContent.indexOf(".switcher-2");
    assert.notEqual(switcher2Index, -1, ".switcher-2 must exist");

    const afterSwitcher2 = switcherContent.slice(switcher2Index);
    const blockEnd = afterSwitcher2.indexOf("}");
    const switcher2Block = afterSwitcher2.slice(0, blockEnd);

    assert.ok(
      /include\s+switcher\(\s*2/.test(switcher2Block),
      ".switcher-2 must use @include switcher(2, ...)"
    );
  });

  it("preserves the existing .switcher class unchanged", () => {
    assert.ok(
      switcherContent.includes(".switcher"),
      "_switcher.scss must still contain .switcher class"
    );
    assert.ok(
      /\.switcher\s*\{/.test(switcherContent),
      "_switcher.scss must still define .switcher with its original block"
    );

    // Verify .switcher still uses switcher(3, ...)
    const switcherIndex = switcherContent.search(/\.switcher\s*\{/);
    const afterSwitcher = switcherContent.slice(switcherIndex);
    const blockEnd = afterSwitcher.indexOf("}");
    const switcherBlock = afterSwitcher.slice(0, blockEnd);

    assert.ok(
      /include\s+switcher\(\s*3/.test(switcherBlock),
      ".switcher must still use @include switcher(3, ...)"
    );
  });
});

describe("contact-options.liquid uses switcher-2 class", () => {
  let contactOptionsContent;

  before(async () => {
    contactOptionsContent = await readFile(CONTACT_OPTIONS_PATH, "utf-8");
  });

  it("uses switcher-2 class on the container", () => {
    assert.ok(
      contactOptionsContent.includes("switcher-2"),
      "contact-options.liquid must use switcher-2 class"
    );
  });
});

describe("button override in _contact-options.scss", () => {
  let contactOptionsScss;

  before(async () => {
    contactOptionsScss = await readFile(CONTACT_OPTIONS_SCSS_PATH, "utf-8");
  });

  it("exists as a SCSS file", () => {
    // If we got here, the file was read successfully
    assert.ok(contactOptionsScss, "_contact-options.scss must exist and have content");
  });

  it("scopes styles under .contact-options", () => {
    assert.ok(
      contactOptionsScss.includes(".contact-options"),
      "_contact-options.scss must scope styles under .contact-options"
    );
  });

  it("overrides ghost button styles", () => {
    const hasButtonOverride =
      contactOptionsScss.includes("button") ||
      contactOptionsScss.includes("ghost");

    assert.ok(
      hasButtonOverride,
      "_contact-options.scss must override ghost button styles"
    );
  });
});

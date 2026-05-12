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

describe("contact-options grid layout", () => {
  let switcherContent;
  let contactOptionsScss;
  let contactOptionsContent;

  before(async () => {
    switcherContent = await readFile(SWITCHER_PATH, "utf-8");
    contactOptionsScss = await readFile(CONTACT_OPTIONS_SCSS_PATH, "utf-8");
    contactOptionsContent = await readFile(CONTACT_OPTIONS_PATH, "utf-8");
  });

  it("preserves the existing .switcher class with switcher(3, ...)", () => {
    const switcherIndex = switcherContent.search(/\.switcher\s*\{/);
    assert.notEqual(switcherIndex, -1, "_switcher.scss must define .switcher");

    const afterSwitcher = switcherContent.slice(switcherIndex);
    const switcherBlock = afterSwitcher.slice(0, afterSwitcher.indexOf("}"));

    assert.ok(
      /include\s+switcher\(\s*3/.test(switcherBlock),
      ".switcher must use @include switcher(3, ...)"
    );
  });

  it("defines .contact-options-grid with a measure-short --min-item-width", () => {
    const index = contactOptionsScss.indexOf(".contact-options-grid");
    assert.notEqual(
      index,
      -1,
      "_contact-options.scss must define .contact-options-grid"
    );

    const block = contactOptionsScss
      .slice(index)
      .slice(0, contactOptionsScss.slice(index).indexOf("}"));

    assert.ok(
      /--min-item-width/.test(block),
      ".contact-options-grid must set --min-item-width"
    );
    assert.ok(
      /measure".*?,\s*"short"/.test(block),
      ".contact-options-grid must use the measure short token"
    );
  });

  it("uses grid composition + contact-options-grid block on the container", () => {
    assert.ok(
      /\[\s*contact-options-grid\s*\]\s*\[\s*grid\s*\]/.test(
        contactOptionsContent
      ),
      "contact-options.liquid must use [ contact-options-grid ] [ grid ] on the container"
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
    assert.ok(
      contactOptionsScss,
      "_contact-options.scss must exist and have content"
    );
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

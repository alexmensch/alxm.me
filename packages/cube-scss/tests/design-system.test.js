import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compile, rules } from "./compile.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SWITCHER_PATH = join(
  __dirname,
  "..",
  "scss",
  "compositions",
  "_switcher.scss"
);

describe("switcher composition", () => {
  let switcherContent;

  before(async () => {
    switcherContent = await readFile(SWITCHER_PATH, "utf-8");
  });

  it(".switcher in _switcher.scss uses @include switcher(3, ...)", () => {
    const switcherIndex = switcherContent.search(/\.switcher\s*\{/);
    assert.notEqual(switcherIndex, -1, "_switcher.scss must define .switcher");

    const afterSwitcher = switcherContent.slice(switcherIndex);
    const switcherBlock = afterSwitcher.slice(0, afterSwitcher.indexOf("}"));

    assert.ok(
      /include\s+switcher\(\s*3/.test(switcherBlock),
      ".switcher must use @include switcher(3, ...)"
    );
  });
});

describe("subscribe button in _contact-options.scss", () => {
  it("hovers to secondary-glare like the contact link cards", () => {
    const hover = rules(compile("blocks/_contact-options.scss")).find((r) =>
      r.selectors.includes(".contact-options .subscribe-form .button:hover")
    );
    assert.ok(hover, "no hover rule for the contact-options subscribe button");
    assert.ok(
      hover.declarations.includes("background: var(--color-secondary-glare)")
    );
  });
});

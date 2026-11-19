import { it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { findRawHtmlInPages } from "@alxm/eleventy-config/content-audit";

it("page bodies use markdown or shortcodes, never raw HTML", () => {
  const srcDir = fileURLToPath(new URL("../src", import.meta.url));
  assert.deepEqual(findRawHtmlInPages(srcDir), []);
});

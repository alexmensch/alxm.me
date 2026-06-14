import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The switcher composition and .contact-options block styles live in the
// shared @alxm/cube-scss package and are tested there. This site-level test
// verifies that this site's contact-options partial opts into that layout.
const CONTACT_OPTIONS_PATH = join(
  __dirname,
  "..",
  "src",
  "_includes",
  "partials",
  "contact-options.liquid"
);

describe("contact-options switcher layout", () => {
  let contactOptionsContent;

  before(async () => {
    contactOptionsContent = await readFile(CONTACT_OPTIONS_PATH, "utf-8");
  });

  it("uses the .switcher composition class on the container", () => {
    assert.ok(
      /\[\s*switcher\s*\]/.test(contactOptionsContent),
      "contact-options.liquid must use [ switcher ] on the container"
    );
  });
});

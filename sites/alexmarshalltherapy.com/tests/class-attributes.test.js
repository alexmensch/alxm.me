import { it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { auditClassAttributes } from "@alxm/cube-scss/lib/class-audit.js";

const siteDir = fileURLToPath(new URL("..", import.meta.url));

it("class attributes group classes by layer, in cascade order", () => {
  const problems = auditClassAttributes({
    siteDir,
    sharedDirs: [
      fileURLToPath(
        new URL("../../../packages/eleventy-config", import.meta.url)
      )
    ]
  });
  assert.deepEqual(problems, []);
});

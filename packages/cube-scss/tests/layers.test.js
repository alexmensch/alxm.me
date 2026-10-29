import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { SCSS_DIR, compile, rules } from "./compile.js";

describe("cascade layers", () => {
  it("config emits no CSS", () => {
    assert.equal(compile("config/_index.scss").trim(), "");
  });

  it("every utility declaration is !important", () => {
    const plain = rules(compile("utilities/_index.scss")).flatMap((r) =>
      r.declarations
        .filter((d) => !d.endsWith("!important"))
        .map((d) => `${r.selectors.join(", ")} { ${d} }`)
    );
    assert.deepEqual(plain, []);
  });

  it("no block emits utility CSS when compiled alone", () => {
    const utilitySelectors = new Set(
      rules(compile("utilities/_index.scss")).flatMap((r) => r.selectors)
    );
    for (const file of readdirSync(join(SCSS_DIR, "blocks"))) {
      const leaked = rules(compile(`blocks/${file}`))
        .flatMap((r) => r.selectors)
        .filter((s) => utilitySelectors.has(s));
      assert.deepEqual(leaked, [], `blocks/${file}`);
    }
  });
});

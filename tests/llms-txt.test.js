import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LLMS_TXT_PATH = join(__dirname, "..", "src", "llms.txt.liquid");

/**
 * Extract the Usage Policy section from the template content.
 * Throws an assertion error if the section does not exist.
 */
function getUsagePolicySection(content) {
  const index = content.indexOf("## Usage Policy");
  assert.notEqual(
    index,
    -1,
    'llms.txt.liquid must contain a "## Usage Policy" section'
  );
  return content.slice(index);
}

describe("llms.txt usage policy", () => {
  let content;

  before(async () => {
    content = await readFile(LLMS_TXT_PATH, "utf-8");
  });

  it("contains a Usage Policy section heading", () => {
    assert.ok(
      content.includes("## Usage Policy"),
      'Expected llms.txt.liquid to contain a "## Usage Policy" heading'
    );
  });

  it("permits citations in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      /citation/i.test(section),
      "Usage policy must mention citations as permitted use"
    );
  });

  it("permits search results in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      /search/i.test(section),
      "Usage policy must mention search as permitted use"
    );
  });

  it("permits RAG/grounding in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      /rag|grounding/i.test(section),
      "Usage policy must mention RAG or grounding as permitted use"
    );
  });

  it("prohibits training in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(/training/i.test(section), "Usage policy must mention training");
    assert.ok(
      /not|prohibit|disallow|forbid|may not|must not/i.test(section),
      "Usage policy must contain prohibitive language regarding training"
    );
  });

  it("prohibits fine-tuning in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      /fine.?tun/i.test(section),
      "Usage policy must mention fine-tuning as prohibited use"
    );
  });

  it("references robots.txt in the usage policy", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      /robots\.txt/i.test(section),
      "Usage policy must reference robots.txt"
    );
  });

  it("uses the site.domain variable in the robots.txt reference", () => {
    const section = getUsagePolicySection(content);
    assert.ok(
      section.includes("site.domain"),
      "Usage policy robots.txt reference must use the site.domain Liquid variable"
    );
  });

  it("does not contradict Content-Signal values (search=yes, ai-input=yes, ai-train=no)", () => {
    const section = getUsagePolicySection(content);

    // Check there is no contradictory "may be used for training" type language
    const permitsTraining =
      /may\s+be\s+used\s+for\s+training/i.test(section) ||
      /allowed\s+for\s+training/i.test(section) ||
      /permitted\s+for\s+training/i.test(section);

    assert.ok(
      !permitsTraining,
      "Usage policy must not contain language permitting training (contradicts ai-train=no)"
    );

    // Verify search and AI input (RAG/grounding) are permitted, not prohibited
    const lowerSection = section.toLowerCase();
    const prohibitsSearch =
      /not.*used.*for.*search/i.test(lowerSection) ||
      /prohibit.*search/i.test(lowerSection);

    assert.ok(
      !prohibitsSearch,
      "Usage policy must not prohibit search (contradicts search=yes)"
    );
  });
});

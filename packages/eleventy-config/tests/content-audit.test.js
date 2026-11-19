import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { findRawHtmlInPages } from "../content-audit.js";

function siteWith(files) {
  const dir = mkdtempSync(path.join(tmpdir(), "content-audit-"));
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), text);
  }
  return dir;
}

describe("findRawHtmlInPages", () => {
  it("reports opening, closing and comment tags with file and line", () => {
    const dir = siteWith({
      "page.md": "---\ntitle: T\n---\n\nText <strong>bold</strong>\n\n<!-- note -->\n",
      "nested/other.md": 'A [link](/x) and <a href="/y">raw</a>\n'
    });
    assert.deepEqual(findRawHtmlInPages(dir), [
      'nested/other.md:1: A [link](/x) and <a href="/y">raw</a>',
      "page.md:5: Text <strong>bold</strong>",
      "page.md:7: <!-- note -->"
    ]);
  });

  it("ignores markdown, autolinks, shortcodes, front matter and non-markdown files", () => {
    const dir = siteWith({
      "page.md":
        '---\ncta:\n  body: "<b>front matter</b>"\n---\n\n**bold** <https://example.com> {% cta "/c", "Go" %}x{% endcta %} 1 < 2\n',
      "layout.liquid": "<div>template</div>\n"
    });
    assert.deepEqual(findRawHtmlInPages(dir), []);
  });
});

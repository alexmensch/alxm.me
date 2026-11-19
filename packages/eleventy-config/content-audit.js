/**
 * Finds raw HTML in the bodies of a site's markdown pages, which must use
 * markdown or a shortcode instead.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const RAW_HTML = /<!--|<\/?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?\/?>/;
const FRONT_MATTER = /^---\n[\s\S]*?\n---\n/;

function pageBody(source) {
  const frontMatter = source.match(FRONT_MATTER)?.[0] ?? "";
  return {
    lines: source.slice(frontMatter.length).split("\n"),
    firstLine: frontMatter.split("\n").length
  };
}

export function findRawHtmlInPages(srcDir) {
  return readdirSync(srcDir, { recursive: true })
    .filter((file) => file.endsWith(".md"))
    .sort()
    .flatMap((file) => {
      const { lines, firstLine } = pageBody(
        readFileSync(path.join(srcDir, file), "utf8")
      );
      return lines.flatMap((line, index) =>
        RAW_HTML.test(line) ? [`${file}:${firstLine + index}: ${line.trim()}`] : []
      );
    });
}

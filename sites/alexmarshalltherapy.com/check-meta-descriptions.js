import fs from "fs";
import path from "path";

// Google truncates SERP snippets around this length. A description longer than
// this isn't an error — it just gets cut off — so we gate the build to force a
// shorter source value. Writing-article descriptions fall back to the shared
// KV `summary` (see site-meta.liquid), so the fix is to shorten the KV
// `summary`/`meta.description` and rebuild — no site code change.
export const MAX_DESCRIPTION_CHARS = 160;

const SITE_DIR = path.join(process.cwd(), "_site");

const DESCRIPTION_RE = /<meta\s+name="description"\s+content="([^"]*)"/gi;

// Decode the handful of HTML entities Liquid (or hand-authored content) can
// emit, so the measured length matches what a reader/Google sees, not the
// encoded byte string. `&amp;` is decoded last so `&amp;lt;` -> `&lt;`.
function decodeEntities(value) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCodePoint(parseInt(n, 16))
    )
    .replace(/&amp;/g, "&");
}

// Pure check: returns one entry per over-length <meta name="description"> in
// the given HTML. Exported for unit testing.
export function findOverlongDescriptions(html, max = MAX_DESCRIPTION_CHARS) {
  const violations = [];
  for (const match of html.matchAll(DESCRIPTION_RE)) {
    const text = decodeEntities(match[1]);
    if (text.length > max) {
      violations.push({ length: text.length, text });
    }
  }
  return violations;
}

function htmlFiles(dir) {
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((entry) => entry.endsWith(".html"))
    .map((entry) => path.join(dir, entry));
}

export function main() {
  try {
    if (!fs.existsSync(SITE_DIR)) {
      throw new Error("No _site directory found. Run the 11ty build first.");
    }

    const violations = [];
    for (const file of htmlFiles(SITE_DIR)) {
      const html = fs.readFileSync(file, "utf8");
      for (const v of findOverlongDescriptions(html)) {
        violations.push({ file: path.relative(SITE_DIR, file), ...v });
      }
    }

    if (violations.length > 0) {
      console.log(
        `\n❌ META DESCRIPTIONS OVER ${MAX_DESCRIPTION_CHARS} CHARS (Google will truncate these):`
      );
      for (const { file, length, text } of violations) {
        console.log(`\n   ${file}  (${length} chars)`);
        console.log(`   ${text}`);
      }
      console.log(
        "\n💡 Shorten the source `summary` (or add a shorter `meta.description`)"
      );
      console.log("   in the shared writing KV item, then rebuild.");
      throw new Error(
        `${violations.length} meta description(s) exceed ${MAX_DESCRIPTION_CHARS} chars.`
      );
    }

    console.log(
      `✅ All meta descriptions are within ${MAX_DESCRIPTION_CHARS} chars`
    );
  } catch (error) {
    console.error("❌ Meta description check failed:\n", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

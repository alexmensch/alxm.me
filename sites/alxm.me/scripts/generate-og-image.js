/**
 * Generate the static Open Graph identity card committed at
 * src/assets/images/og/default.png (the site-wide fallback preview).
 * Run: node scripts/generate-og-image.js
 *
 * The card layout and rendering live in @alxm/og-image; the site-specific
 * theme is shared with the per-article card generation in .eleventy.js via
 * src/_build/og-theme.js. Per-article writing cards are generated at build
 * time into _site and are not committed.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderIdentityCard } from "@alxm/og-image";
import { ogTheme } from "../src/_build/og-theme.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(
  __dirname,
  "..",
  "src",
  "assets",
  "images",
  "og",
  "default.png"
);

async function main() {
  const png = await renderIdentityCard(ogTheme);
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, png);
  console.log(`Wrote ${OUT} (${ogTheme.width}x${ogTheme.height})`);
}

main().catch((err) => {
  throw err;
});

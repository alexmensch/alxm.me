/**
 * Regenerate the alexmarshalltherapy.com favicons from the Inter Bold "A" glyph.
 * Run: node scripts/generate-favicons.js
 *
 * Thin wrapper over @alxm/favicon-generator (the shared rendering logic).
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateFavicons } from "@alxm/favicon-generator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "src");

await generateFavicons({
  fontPath: join(SRC, "_build", "fonts", "Inter-Bold.ttf"),
  outDir: SRC,
  colorLight: "#fa576e",
  colorDark: "#ff6b7a"
});

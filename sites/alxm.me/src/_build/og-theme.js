/**
 * Site-specific OG card theme, shared by .eleventy.js (per-article cards) and
 * scripts/generate-og-image.js (the static identity card). Colours are left to
 * @alxm/og-image's default palette (navy/cream/pink). The author footer is
 * name-only (no role), so no serif font is needed.
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../_data/site.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const ogTheme = {
  author: { name: site.authorName },
  portraitPath: join(root, "src", "assets", "images", "portrait-og.jpg"),
  fonts: {
    inter: join(root, "src", "_build", "fonts", "Inter-Bold.ttf")
  }
};

/**
 * Site-specific OG card theme, shared by .eleventy.js (per-article cards) and
 * scripts/generate-og-image.js (the static identity card). Colours are left to
 * @alxm/og-image's default palette (navy/cream/pink); only the author text,
 * portrait, and fonts are site-supplied. Card dimensions are fixed by the
 * package.
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../_data/site.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const ogTheme = {
  author: { name: site.authorName, role: site.authorRole },
  portraitPath: join(root, "src", "assets", "images", "portrait.jpg"),
  fonts: {
    inter: join(root, "src", "_build", "fonts", "Inter-Bold.ttf"),
    serif: join(root, "src", "_build", "fonts", "SourceSerif4-BoldItalic.ttf")
  }
};

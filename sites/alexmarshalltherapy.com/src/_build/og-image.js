/**
 * Open Graph card rendering — shared by scripts/generate-og-image.js (the
 * static identity card) and .eleventy.js (per-article writing cards).
 *
 * Cards are 1200x630 PNGs built as an SVG composited with sharp. Text is
 * rendered to vector paths via opentype.js charToGlyph rather than @font-face:
 * librsvg (sharp's SVG backend) resolves embedded fonts unreliably, and
 * opentype 2.0.0's string-level getPath/toSVG are broken for these fonts
 * (ccmp crash, then stray NaN that aborts the path mid-render). Going
 * glyph-by-glyph sidesteps both — the same technique scripts/generate-favicons.js
 * uses.
 */

import sharp from "sharp";
import opentype from "opentype.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import site from "../_data/site.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS = join(__dirname, "fonts");
const PORTRAIT = join(__dirname, "..", "assets", "images", "portrait.jpg");

export const WIDTH = site.og.width;
export const HEIGHT = site.og.height;

// Brand palette (src/assets/scss/global/_variables.scss)
const NAVY = "#2e3a50"; // --color-dark, background / panel
const CREAM = "#fdf8f3"; // --color-light, text
const PINK = "#fa576e"; // --color-primary, accent divider

const NAME = site.authorName;
const ROLE = site.authorRole;

function loadFont(path) {
  const buf = readFileSync(path);
  return opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  );
}

// Loaded lazily and cached — generating many article cards reuses one parse.
let _inter, _serif;
const inter = () => (_inter ??= loadFont(join(FONTS, "Inter-Bold.ttf")));
const serif = () =>
  (_serif ??= loadFont(join(FONTS, "SourceSerif4-BoldItalic.ttf")));

// Serialise opentype path commands to an SVG `d` string directly — opentype
// 2.0.0's own toSVG()/toPathData() emit stray NaN between consecutive curve
// commands, which makes librsvg abort the path mid-render.
function commandsToData(commands) {
  const n = (v) => Number(v.toFixed(2));
  return commands
    .map((c) => {
      switch (c.type) {
        case "M":
          return `M${n(c.x)} ${n(c.y)}`;
        case "L":
          return `L${n(c.x)} ${n(c.y)}`;
        case "Q":
          return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
        case "C":
          return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
        case "Z":
          return "Z";
        default:
          return "";
      }
    })
    .join("");
}

/** Width of `text` at `size`, in px, including kerning. */
function measure(font, text, size) {
  const scale = size / font.unitsPerEm;
  let width = 0;
  let prev = null;
  for (const ch of [...text]) {
    const glyph = font.charToGlyph(ch);
    if (prev) width += font.getKerningValue(prev, glyph) * scale;
    width += glyph.advanceWidth * scale;
    prev = glyph;
  }
  return width;
}

/** A single line of text as an SVG <path>, filled with `color`. */
function textPath(font, text, x, baseline, size, color) {
  const scale = size / font.unitsPerEm;
  const out = new opentype.Path();
  let penX = x;
  let prev = null;
  for (const ch of [...text]) {
    const glyph = font.charToGlyph(ch);
    if (prev) penX += font.getKerningValue(prev, glyph) * scale;
    out.extend(glyph.getPath(penX, baseline, size));
    penX += glyph.advanceWidth * scale;
    prev = glyph;
  }
  return `<path d="${commandsToData(out.commands)}" fill="${color}" />`;
}

/** Greedy word-wrap `text` to lines no wider than `maxWidth` at `size`. */
function wrapLines(font, text, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(font, candidate, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function svgToCard(body, background) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${body}</svg>`;
  return sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background }
  })
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toBuffer();
}

/**
 * The static identity card: portrait on the left, brand panel on the right
 * with the name (Inter Bold) and role (Source Serif italic).
 */
export async function renderIdentityCard() {
  const PHOTO_W = 470;
  const PAD = 60;
  const panelX = PHOTO_W + PAD;

  const portrait = await sharp(PORTRAIT)
    .resize(PHOTO_W, HEIGHT, { fit: "cover", position: "centre" })
    .toBuffer();

  const body = `
    <rect x="${panelX}" y="332" width="110" height="6" rx="3" fill="${PINK}" />
    ${textPath(inter(), NAME, panelX, 300, 68, CREAM)}
    ${textPath(serif(), ROLE, panelX, 400, 40, CREAM)}
  `;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${body}</svg>`;

  return sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: NAVY }
  })
    .composite([
      { input: portrait, left: 0, top: 0 },
      { input: Buffer.from(svg), left: 0, top: 0 }
    ])
    .png()
    .toBuffer();
}

/**
 * A per-article card: the wrapped title on a brand background with a small
 * identity footer. Title size steps down so longer titles still fit; a title
 * that overflows even the smallest size is truncated with an ellipsis.
 */
export async function renderArticleCard(title) {
  const PAD = 80;
  const maxWidth = WIDTH - PAD * 2;
  const maxLines = 4;

  // Pick the largest size at which the title fits within maxLines.
  let size = 64;
  let lines = wrapLines(inter(), title, size, maxWidth);
  for (const candidate of [64, 56, 48]) {
    size = candidate;
    lines = wrapLines(inter(), title, size, maxWidth);
    if (lines.length <= maxLines) break;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, "")}…`;
  }

  const lineHeight = Math.round(size * 1.18);
  const titleTop = 150;
  const titlePaths = lines
    .map((line, i) =>
      textPath(
        inter(),
        line,
        PAD,
        titleTop + size + i * lineHeight,
        size,
        CREAM
      )
    )
    .join("\n");

  // Footer: name (Inter) + role (Source Serif italic) sharing a baseline.
  const footerBaseline = 560;
  const nameSize = 30;
  const roleSize = 30;
  const nameWidth = measure(inter(), NAME, nameSize);
  const sep = "  ·  ";
  const sepWidth = measure(inter(), sep, nameSize);

  const body = `
    <rect x="${PAD}" y="505" width="110" height="6" rx="3" fill="${PINK}" />
    ${titlePaths}
    ${textPath(inter(), NAME, PAD, footerBaseline, nameSize, CREAM)}
    ${textPath(inter(), sep, PAD + nameWidth, footerBaseline, nameSize, PINK)}
    ${textPath(serif(), ROLE, PAD + nameWidth + sepWidth, footerBaseline, roleSize, CREAM)}
  `;

  return svgToCard(body, NAVY);
}

/**
 * Generate favicon SVG, PNG variants, and .ico from the Inter Bold "A" glyph.
 * Run: node scripts/generate-favicons.js
 * Requires: sharp, png-to-ico, opentype.js (dev dependencies)
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import opentype from "opentype.js";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const FONT_PATH = join(SRC, "_build", "fonts", "Inter-Bold.ttf");

// Brand colors
const COLOR_LIGHT = "#fa576e";
const COLOR_DARK = "#ff6b7a";
const BG_COLOR = COLOR_LIGHT;

// Canvas size for the SVG viewBox
const SIZE = 512;
// Padding around the glyph (fraction of SIZE)
const PADDING = 0.06;

function getGlyphPath(fontPath, char) {
  const font = opentype.parse(readFileSync(fontPath));
  const glyph = font.charToGlyph(char);

  // Get the visual bounding box of the actual glyph shape
  const bbox = glyph.getBoundingBox();

  // Available space after padding
  const pad = SIZE * PADDING;
  const available = SIZE - pad * 2;

  // Visual dimensions of the glyph
  const glyphW = bbox.x2 - bbox.x1;
  const glyphH = bbox.y2 - bbox.y1;

  // Scale to fill available space (use the limiting dimension)
  const scale = Math.min(available / glyphW, available / glyphH);

  // Compute the scaled visual size
  const scaledW = glyphW * scale;
  const scaledH = glyphH * scale;

  // Center the visual bounding box within the canvas.
  // opentype.js getPath(x, y, fontSize) takes a baseline origin,
  // so we need to work backwards from desired visual placement.
  //
  // In font coords (Y-up): the glyph visual top is bbox.y2, bottom is bbox.y1.
  // In SVG coords (Y-down): we flip, so visual top -> small Y, bottom -> large Y.
  //
  // Desired visual top in SVG coords:
  const visualTop = (SIZE - scaledH) / 2;
  // Desired visual left in SVG coords:
  const visualLeft = (SIZE - scaledW) / 2;

  // Render at fontSize = unitsPerEm (1 path unit = 1 font unit), then place with an
  // SVG transform. opentype.js v2's getPath emits Y mirrored relative to SVG's Y-down
  // convention (the glyph's top edge lands at the most-negative path Y), so the
  // transform flips Y via a negative Y scale to render the glyph upright. Anchoring
  // the translate to the path's own bounding box keeps placement correct regardless of
  // the constant offset getPath applies.
  const fontSize = font.unitsPerEm;
  const rawPath = glyph.getPath(0, 0, fontSize);
  const rawData = rawPath.toPathData();
  const pathBox = rawPath.getBoundingBox();

  const pathScale = scale; // target pixels per font unit
  // scale(s, -s) maps path point (px, py) -> (px*s, -py*s); after the flip the glyph's
  // left edge sits at pathBox.x1*s and its (visual) top edge at -pathBox.y2*s.
  const tx = visualLeft - pathBox.x1 * pathScale;
  const ty = visualTop + pathBox.y2 * pathScale;

  return {
    rawData,
    transform: `translate(${tx} ${ty}) scale(${pathScale} ${-pathScale})`
  };
}

function buildSvg({ glyph, fill, background, rounded = false }) {
  const rx = rounded ? ' rx="80" ry="80"' : "";
  const bg = background
    ? `  <rect width="${SIZE}" height="${SIZE}"${rx} fill="${background}"/>\n`
    : "";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
    `${bg}  <g transform="${glyph.transform}">` +
      `<path d="${glyph.rawData}" fill="${fill}"/>` +
      `</g>`,
    `</svg>`
  ].join("\n");
}

function buildBrowserSvg(glyph) {
  // SVG favicon for browsers - adapts to light/dark mode
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
    `  <style>`,
    `    path { fill: ${COLOR_LIGHT}; }`,
    `    @media (prefers-color-scheme: dark) {`,
    `      path { fill: ${COLOR_DARK}; }`,
    `    }`,
    `  </style>`,
    `  <g transform="${glyph.transform}">`,
    `    <path d="${glyph.rawData}"/>`,
    `  </g>`,
    `</svg>`
  ].join("\n");
}

async function generate() {
  console.log(`Loading font: ${FONT_PATH}`);
  const glyph = getGlyphPath(FONT_PATH, "A");

  // 1. Browser SVG favicon (transparent bg, dark mode support)
  const browserSvg = buildBrowserSvg(glyph);
  await writeFile(join(SRC, "favicon.svg"), `${browserSvg}\n`);
  console.log("Created favicon.svg (adaptive light/dark)");

  // 2. PNG variant: coral "A" on transparent background
  const pngSvg = buildSvg({
    glyph,
    fill: BG_COLOR,
    background: null,
    rounded: false
  });

  await sharp(Buffer.from(pngSvg))
    .resize(180, 180)
    .png()
    .toFile(join(SRC, "apple-touch-icon.png"));
  console.log("Created apple-touch-icon.png (180x180)");

  await sharp(Buffer.from(pngSvg))
    .resize(192, 192)
    .png()
    .toFile(join(SRC, "favicon-192.png"));
  console.log("Created favicon-192.png (192x192)");

  await sharp(Buffer.from(pngSvg))
    .resize(512, 512)
    .png()
    .toFile(join(SRC, "favicon-512.png"));
  console.log("Created favicon-512.png (512x512)");

  // 3. ICO variant: coral "A" on transparent background
  const icoSvg = buildSvg({
    glyph,
    fill: BG_COLOR,
    background: null,
    rounded: false
  });

  const ico32 = await sharp(Buffer.from(icoSvg))
    .resize(32, 32)
    .png()
    .toBuffer();
  const ico16 = await sharp(Buffer.from(icoSvg))
    .resize(16, 16)
    .png()
    .toBuffer();

  const ico = await pngToIco([ico32, ico16]);
  await writeFile(join(SRC, "favicon.ico"), ico);
  console.log("Created favicon.ico (16x16 + 32x32)");

  console.log("\nAll favicons generated in src/");
}

generate().catch((err) => {
  throw err;
});

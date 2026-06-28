/**
 * Generate favicon SVG, PNG variants, and .ico from a font glyph.
 *
 * Shared by both sites; each site's scripts/generate-favicons.js is a thin
 * wrapper passing its own font path, output dir, and brand colors.
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import opentype from "opentype.js";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

// Canvas size for the SVG viewBox
const SIZE = 512;
// Padding around the glyph (fraction of SIZE)
const PADDING = 0.06;

/**
 * Compute the SVG transform that scales a glyph to fill the padded canvas and
 * centers it. Kept pure (no font I/O) so the placement math is unit-testable.
 *
 * opentype.js v2's getPath emits Y mirrored relative to SVG's Y-down convention
 * (the glyph's top edge lands at the most-negative path Y), so the transform
 * flips Y via a negative Y scale to render the glyph upright. Anchoring the
 * translate to the path's own bounding box keeps placement correct regardless
 * of the constant offset getPath applies.
 *
 * @param {{x1:number,y1:number,x2:number,y2:number}} glyphBox glyph.getBoundingBox()
 * @param {{x1:number,y1:number,x2:number,y2:number}} pathBox  rawPath.getBoundingBox()
 */
export function computeGlyphPlacement(glyphBox, pathBox) {
  const pad = SIZE * PADDING;
  const available = SIZE - pad * 2;

  const glyphW = glyphBox.x2 - glyphBox.x1;
  const glyphH = glyphBox.y2 - glyphBox.y1;

  // Scale to fill the available space (use the limiting dimension)
  const scale = Math.min(available / glyphW, available / glyphH);

  const scaledW = glyphW * scale;
  const scaledH = glyphH * scale;

  const visualTop = (SIZE - scaledH) / 2;
  const visualLeft = (SIZE - scaledW) / 2;

  // scale(s, -s) maps path point (px, py) -> (px*s, -py*s); after the flip the
  // glyph's left edge sits at pathBox.x1*s and its (visual) top edge at -pathBox.y2*s.
  const tx = visualLeft - pathBox.x1 * scale;
  const ty = visualTop + pathBox.y2 * scale;

  return {
    scale,
    tx,
    ty,
    transform: `translate(${tx} ${ty}) scale(${scale} ${-scale})`
  };
}

function getGlyphPath(fontPath, char) {
  const font = opentype.parse(readFileSync(fontPath));
  const glyph = font.charToGlyph(char);

  // Render at fontSize = unitsPerEm (1 path unit = 1 font unit), then place it
  // with an SVG transform derived from the glyph + path bounding boxes.
  const rawPath = glyph.getPath(0, 0, font.unitsPerEm);
  const { transform } = computeGlyphPlacement(
    glyph.getBoundingBox(),
    rawPath.getBoundingBox()
  );

  return { rawData: rawPath.toPathData(), transform };
}

function buildSvg(glyph, fill) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
    `  <g transform="${glyph.transform}"><path d="${glyph.rawData}" fill="${fill}"/></g>`,
    `</svg>`
  ].join("\n");
}

function buildBrowserSvg(glyph, colorLight, colorDark) {
  // SVG favicon for browsers - adapts to light/dark mode
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">`,
    `  <style>`,
    `    path { fill: ${colorLight}; }`,
    `    @media (prefers-color-scheme: dark) {`,
    `      path { fill: ${colorDark}; }`,
    `    }`,
    `  </style>`,
    `  <g transform="${glyph.transform}">`,
    `    <path d="${glyph.rawData}"/>`,
    `  </g>`,
    `</svg>`
  ].join("\n");
}

/**
 * Render every favicon variant into `outDir`.
 *
 * @param {object}  opts
 * @param {string}  opts.fontPath   absolute path to the source .ttf/.otf
 * @param {string}  opts.outDir     absolute directory to write the favicons into
 * @param {string}  opts.colorLight glyph fill in light mode (also the PNG/ICO fill)
 * @param {string}  opts.colorDark  glyph fill in dark mode (SVG favicon only)
 * @param {string} [opts.char]      glyph to render (default "A")
 */
export async function generateFavicons({
  fontPath,
  outDir,
  colorLight,
  colorDark,
  char = "A"
}) {
  console.log(`Loading font: ${fontPath}`);
  const glyph = getGlyphPath(fontPath, char);

  // 1. Browser SVG favicon (transparent bg, dark mode support)
  const browserSvg = buildBrowserSvg(glyph, colorLight, colorDark);
  await writeFile(join(outDir, "favicon.svg"), `${browserSvg}\n`);
  console.log("Created favicon.svg (adaptive light/dark)");

  // 2. Raster variants: colored glyph on a transparent background
  const rasterSvg = buildSvg(glyph, colorLight);
  for (const [size, name] of [
    [180, "apple-touch-icon.png"],
    [192, "favicon-192.png"],
    [512, "favicon-512.png"]
  ]) {
    await sharp(Buffer.from(rasterSvg))
      .resize(size, size)
      .png()
      .toFile(join(outDir, name));
    console.log(`Created ${name} (${size}x${size})`);
  }

  // 3. ICO variant (16x16 + 32x32)
  const ico32 = await sharp(Buffer.from(rasterSvg))
    .resize(32, 32)
    .png()
    .toBuffer();
  const ico16 = await sharp(Buffer.from(rasterSvg))
    .resize(16, 16)
    .png()
    .toBuffer();
  await writeFile(join(outDir, "favicon.ico"), await pngToIco([ico32, ico16]));
  console.log("Created favicon.ico (16x16 + 32x32)");

  console.log(`\nAll favicons generated in ${outDir}`);
}

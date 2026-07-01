/**
 * Open Graph card rendering. Cards are OG_WIDTH x OG_HEIGHT PNGs built as an
 * SVG composited with sharp. Text is rendered to vector paths via opentype.js
 * charToGlyph rather than @font-face: librsvg (sharp's SVG backend) resolves
 * embedded fonts unreliably, and opentype 2.0.0's string-level getPath/toSVG
 * are broken for these fonts (ccmp crash, then stray NaN that aborts the path
 * mid-render). Going glyph-by-glyph sidesteps both — the same technique
 * @alxm/favicon-generator uses.
 *
 * The card size is fixed at the standard OG dimensions: the layout geometry
 * (positions and font sizes) is hand-tuned for OG_WIDTH x OG_HEIGHT, not
 * derived from them, so it is not a free variable. Everything else that is
 * site-specific is passed in via `theme`, so both sites share one engine:
 *   theme = {
 *     colors: { background, text, accent },
 *     author: { name, role },      // role optional — omit for name-only footer
 *     portraitPath,                // used by the identity card
 *     fonts: { inter, serif }      // absolute paths to .ttf files
 *   }
 */

import sharp from "sharp";
import opentype from "opentype.js";
import { readFileSync } from "node:fs";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Mirrors the sites' brand tokens (src/assets/scss/global/_variables.scss).
const DEFAULT_COLORS = {
  background: "#2e3a50", // --color-dark (navy)
  text: "#fdf8f3", // --color-light (cream)
  accent: "#fa576e" // --color-primary (pink)
};

function resolveTheme(theme = {}) {
  return {
    colors: { ...DEFAULT_COLORS, ...theme.colors },
    author: theme.author ?? {},
    portraitPath: theme.portraitPath,
    fonts: theme.fonts ?? {}
  };
}

// Parsed fonts cached by path — generating many article cards reuses one parse.
const fontCache = new Map();
function loadFont(path) {
  let font = fontCache.get(path);
  if (!font) {
    const buf = readFileSync(path);
    font = opentype.parse(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );
    fontCache.set(path, font);
  }
  return font;
}

// Serialise opentype path commands to an SVG `d` string directly — opentype
// 2.0.0's own toSVG()/toPathData() emit stray NaN between consecutive curve
// commands, which makes librsvg abort the path mid-render.
export function commandsToData(commands) {
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
export function measure(font, text, size) {
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
export function wrapLines(font, text, size, maxWidth) {
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

function svgToCard(body, background) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${body}</svg>`;
  return sharp({
    create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background }
  })
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toBuffer();
}

/**
 * The static identity card: portrait on the left, brand panel on the right
 * with the name (Inter Bold) and, if present, the role (Source Serif italic).
 */
export async function renderIdentityCard(theme) {
  const { colors, author, portraitPath, fonts } = resolveTheme(theme);
  const inter = loadFont(fonts.inter);

  const PHOTO_W = 470;
  const PAD = 60;
  const panelX = PHOTO_W + PAD;

  const portrait = await sharp(portraitPath)
    .resize(PHOTO_W, OG_HEIGHT, { fit: "cover", position: "centre" })
    .toBuffer();

  const roleLine = author.role
    ? textPath(loadFont(fonts.serif), author.role, panelX, 400, 40, colors.text)
    : "";
  const body = `
    <rect x="${panelX}" y="332" width="110" height="6" rx="3" fill="${colors.accent}" />
    ${textPath(inter, author.name, panelX, 300, 68, colors.text)}
    ${roleLine}
  `;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${body}</svg>`;

  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: colors.background
    }
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
 * that overflows even the smallest size is truncated with an ellipsis. The
 * footer shows the name, plus a divider and role when a role is set.
 */
export async function renderArticleCard(title, theme) {
  const { colors, author, fonts } = resolveTheme(theme);
  const inter = loadFont(fonts.inter);

  const PAD = 80;
  const maxWidth = OG_WIDTH - PAD * 2;
  const maxLines = 4;

  // Pick the largest size at which the title fits within maxLines.
  let size = 64;
  let lines = wrapLines(inter, title, size, maxWidth);
  for (const candidate of [64, 56, 48]) {
    size = candidate;
    lines = wrapLines(inter, title, size, maxWidth);
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
      textPath(inter, line, PAD, titleTop + size + i * lineHeight, size, colors.text)
    )
    .join("\n");

  // Footer: name (Inter), optionally followed by a divider + role (Source
  // Serif italic) sharing a baseline.
  const footerBaseline = 560;
  const nameSize = 30;
  const roleSize = 30;
  const namePath = textPath(
    inter,
    author.name,
    PAD,
    footerBaseline,
    nameSize,
    colors.text
  );
  let footer = namePath;
  if (author.role) {
    const nameWidth = measure(inter, author.name, nameSize);
    const sep = "  ·  ";
    const sepWidth = measure(inter, sep, nameSize);
    footer = `${namePath}
    ${textPath(inter, sep, PAD + nameWidth, footerBaseline, nameSize, colors.accent)}
    ${textPath(loadFont(fonts.serif), author.role, PAD + nameWidth + sepWidth, footerBaseline, roleSize, colors.text)}`;
  }

  const body = `
    <rect x="${PAD}" y="505" width="110" height="6" rx="3" fill="${colors.accent}" />
    ${titlePaths}
    ${footer}
  `;

  return svgToCard(body, colors.background);
}

import { writeFileSync } from "node:fs";
import opentype from "opentype.js";

/**
 * Write a minimal but valid .ttf to `filePath` and return the path. The single
 * .notdef glyph carries a real (square) outline, so every character renders a
 * path — enough to exercise the full glyph-path pipeline and produce a valid
 * PNG without depending on any site's font files.
 */
export function writeStubFont(filePath) {
  const outline = new opentype.Path();
  outline.moveTo(50, 0);
  outline.lineTo(450, 0);
  outline.lineTo(450, 650);
  outline.lineTo(50, 650);
  outline.close();

  const notdef = new opentype.Glyph({
    name: ".notdef",
    unicode: 0,
    advanceWidth: 500,
    path: outline
  });

  const font = new opentype.Font({
    familyName: "OGStub",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [notdef]
  });

  writeFileSync(filePath, Buffer.from(font.toArrayBuffer()));
  return filePath;
}

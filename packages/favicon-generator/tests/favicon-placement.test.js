import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeGlyphPlacement } from "../index.js";

const round = (n) => Math.round(n * 100) / 100;

// Inter Bold "A" metrics (unitsPerEm = 2048), captured from opentype.js v2:
//   glyph.getBoundingBox()   -> Y-up font coords (feet at y=0, apex at y=1490)
//   rawPath.getBoundingBox() -> getPath output, Y mirrored vs SVG (apex at y=0)
const GLYPH_BOX = { x1: 49, y1: 0, x2: 1480, y2: 1490 };
const PATH_BOX = { x1: 49, y1: -1490, x2: 1480, y2: 0 };

describe("computeGlyphPlacement", () => {
  const p = computeGlyphPlacement(GLYPH_BOX, PATH_BOX);

  it("flips Y via a negative Y scale so the glyph renders upright", () => {
    assert.ok(p.scale > 0, "horizontal scale is positive");
    // the regression guard for the opentype.js v2 mirror: Y scale must be negated
    assert.match(p.transform, /scale\(0\.3023\d* -0\.3023\d*\)$/);
  });

  it("scales the glyph to fill the padded 512px canvas", () => {
    // limiting dimension is height: (512 - 2*0.06*512) / 1490
    assert.ok(Math.abs(p.scale - 0.3023892617449664) < 1e-12);
  });

  it("renders the glyph in the expected on-canvas bounding box", () => {
    // bake the transform onto the path bounding-box corners
    const x = (px) => p.tx + px * p.scale;
    const y = (py) => p.ty + py * -p.scale;
    assert.deepEqual(
      [
        round(x(PATH_BOX.x1)),
        round(y(PATH_BOX.y2)),
        round(x(PATH_BOX.x2)),
        round(y(PATH_BOX.y1))
      ],
      [39.64, 30.72, 472.36, 481.28]
    );
  });

  it("places the apex (path Y max) above the feet (path Y min) on screen", () => {
    const apexScreenY = p.ty + PATH_BOX.y2 * -p.scale;
    const feetScreenY = p.ty + PATH_BOX.y1 * -p.scale;
    assert.ok(
      apexScreenY < feetScreenY,
      "apex sits at a smaller (higher) screen Y"
    );
  });
});

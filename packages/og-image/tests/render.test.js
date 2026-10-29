import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import {
  commandsToData,
  measure,
  wrapLines,
  renderArticleCard,
  renderIdentityCard,
  OG_WIDTH,
  OG_HEIGHT
} from "../index.js";
import { writeStubFont } from "./fixtures/stub-font.js";

// A deterministic monospace-ish font: every glyph 500 units wide, space 250,
// no kerning, 1000 units per em — so measure()/wrapLines() have exact answers.
const stubFont = {
  unitsPerEm: 1000,
  charToGlyph: (ch) => ({ advanceWidth: ch === " " ? 250 : 500 }),
  getKerningValue: () => 0
};

describe("commandsToData", () => {
  it("serialises each command type and rounds to 2dp", () => {
    const d = commandsToData([
      { type: "M", x: 1.239, y: 2 },
      { type: "L", x: 3, y: 4 },
      { type: "Q", x1: 5, y1: 6, x: 7, y: 8 },
      { type: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 },
      { type: "Z" }
    ]);
    assert.equal(d, "M1.24 2L3 4Q5 6 7 8C1 2 3 4 5 6Z");
  });

  it("drops unknown command types", () => {
    assert.equal(commandsToData([{ type: "X", x: 1 }]), "");
  });
});

describe("measure", () => {
  it("sums scaled advance widths", () => {
    // 4 glyphs * 500 units * (20/1000 scale) = 40px
    assert.equal(measure(stubFont, "abcd", 20), 40);
  });

  it("counts spaces at their narrower advance", () => {
    // 'a' + ' ' + 'b' = (500 + 250 + 500) * 0.02 = 25px
    assert.equal(measure(stubFont, "a b", 20), 25);
  });
});

describe("wrapLines", () => {
  it("greedily packs words within maxWidth", () => {
    // each "aa" = 20px, " " = 5px at size 20; maxWidth 30 fits one word/line
    assert.deepEqual(wrapLines(stubFont, "aa aa aa", 20, 30), [
      "aa",
      "aa",
      "aa"
    ]);
  });

  it("keeps words together while they fit", () => {
    // "aa aa" = 45px; maxWidth 60 fits two, not three
    assert.deepEqual(wrapLines(stubFont, "aa aa aa", 20, 60), ["aa aa", "aa"]);
  });

  it("collapses runs of whitespace", () => {
    assert.deepEqual(wrapLines(stubFont, "  a   b  ", 20, 1000), ["a b"]);
  });
});

describe("card renderers", () => {
  let portraitPath;
  let fonts;
  before(async () => {
    portraitPath = join(tmpdir(), "og-image-test-portrait.png");
    await sharp({
      create: { width: 200, height: 200, channels: 3, background: "#888888" }
    })
      .png()
      .toFile(portraitPath);

    const fontPath = writeStubFont(join(tmpdir(), "og-image-test-font.ttf"));
    fonts = { inter: fontPath, serif: fontPath };
  });

  it("renderArticleCard returns a valid 1200x630 PNG", async () => {
    const png = await renderArticleCard("A reasonably long test article title", {
      author: { name: "Alex Marshall", role: "Therapeutic Counselling" },
      fonts
    });
    const meta = await sharp(png).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.width, OG_WIDTH);
    assert.equal(meta.height, OG_HEIGHT);
  });

  it("renders a name-only footer with no serif font when role is unset", async () => {
    // A role-less theme must not require a serif font (lazy-loaded).
    const png = await renderArticleCard("Title without a role footer", {
      author: { name: "Alex Marshall" },
      fonts: { inter: fonts.inter }
    });
    const meta = await sharp(png).metadata();
    assert.equal(meta.width, OG_WIDTH);
    assert.equal(meta.height, OG_HEIGHT);
  });

  it("renderIdentityCard returns a valid 1200x630 PNG", async () => {
    const png = await renderIdentityCard({
      author: { name: "Alex Marshall", role: "Therapeutic Counselling" },
      portraitPath,
      fonts
    });
    const meta = await sharp(png).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.width, OG_WIDTH);
    assert.equal(meta.height, OG_HEIGHT);
  });

  it("renderIdentityCard renders a name-only panel when role is unset", async () => {
    const png = await renderIdentityCard({
      author: { name: "Alex Marshall" },
      portraitPath,
      fonts
    });
    const meta = await sharp(png).metadata();
    assert.equal(meta.width, OG_WIDTH);
    assert.equal(meta.height, OG_HEIGHT);
  });
});

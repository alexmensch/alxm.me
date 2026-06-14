import { describe, it } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  renderArticleCard,
  renderIdentityCard,
  WIDTH,
  HEIGHT
} from "../src/_build/og-image.js";

async function dimensions(buffer) {
  const meta = await sharp(buffer).metadata();
  return { width: meta.width, height: meta.height, format: meta.format };
}

describe("renderIdentityCard", () => {
  it("produces a 1200x630 PNG", async () => {
    const { width, height, format } = await dimensions(
      await renderIdentityCard()
    );
    assert.equal(width, WIDTH);
    assert.equal(height, HEIGHT);
    assert.equal(format, "png");
  });
});

describe("renderArticleCard", () => {
  it("produces a 1200x630 PNG for a short title", async () => {
    const { width, height, format } = await dimensions(
      await renderArticleCard("On Anxiety")
    );
    assert.equal(width, WIDTH);
    assert.equal(height, HEIGHT);
    assert.equal(format, "png");
  });

  it("handles a long title (wraps + shrinks) without throwing", async () => {
    const long =
      "Why the patterns you notice seem more ingrained, following you through life's changes and rhyming as they repeat over time";
    const { width, height } = await dimensions(await renderArticleCard(long));
    assert.equal(width, WIDTH);
    assert.equal(height, HEIGHT);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Liquid } from "liquidjs";
import { includesDir } from "../index.js";

const engine = new Liquid({ root: [includesDir], extname: ".liquid" });

const site = {
  links: [
    { rel: "stylesheet", href: "/root.css" },
    { rel: "stylesheet", href: "/fonts.css", lazy: true }
  ]
};

const render = (runMode) =>
  engine.renderFile("partials/site-includes", {
    site,
    eleventy: { env: { runMode } }
  });

describe("site-includes partial", () => {
  it("loads lazy stylesheets async via preload in a build", async () => {
    const html = await render("build");
    assert.ok(html.includes('<link rel="stylesheet" href="/root.css" />'));
    assert.ok(
      html.includes(
        '<link rel="preload" href="/fonts.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'" />'
      )
    );
    assert.ok(
      html.includes(
        '<noscript><link rel="stylesheet" href="/fonts.css" /></noscript>'
      )
    );
  });

  it("emits lazy stylesheets as plain links under --serve", async () => {
    const html = await render("serve");
    assert.ok(html.includes('<link rel="stylesheet" href="/fonts.css" />'));
    assert.ok(!html.includes("preload"));
  });

  it("never emits the lazy flag as an HTML attribute", async () => {
    for (const mode of ["build", "serve"]) {
      assert.ok(!(await render(mode)).includes("lazy="));
    }
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diffPermalinks } from "../check-permalinks.js";

describe("diffPermalinks", () => {
  it("detects added permalinks (in current but not baseline)", () => {
    const baseline = new Set(["/about/", "/writing/"]);
    const current = new Set(["/about/", "/writing/", "/contact/"]);

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.added, ["/contact/"]);
  });

  it("detects removed permalinks (in baseline but not current)", () => {
    const baseline = new Set(["/about/", "/writing/", "/old-page/"]);
    const current = new Set(["/about/", "/writing/"]);

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.removed, ["/old-page/"]);
  });

  it("returns no diff when sets match", () => {
    const baseline = new Set(["/about/", "/writing/"]);
    const current = new Set(["/about/", "/writing/"]);

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.removed, []);
  });

  it("handles empty baseline (all permalinks are new)", () => {
    const baseline = new Set();
    const current = new Set(["/about/", "/writing/"]);

    const result = diffPermalinks(baseline, current);
    assert.equal(result.added.length, 2);
    assert.ok(result.added.includes("/about/"));
    assert.ok(result.added.includes("/writing/"));
    assert.deepEqual(result.removed, []);
  });

  it("handles empty current (all permalinks removed)", () => {
    const baseline = new Set(["/about/", "/writing/"]);
    const current = new Set();

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.added, []);
    assert.equal(result.removed.length, 2);
    assert.ok(result.removed.includes("/about/"));
    assert.ok(result.removed.includes("/writing/"));
  });

  it("handles both sets empty", () => {
    const baseline = new Set();
    const current = new Set();

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.added, []);
    assert.deepEqual(result.removed, []);
  });

  it("detects a single permalink difference in a large set", () => {
    const urls = Array.from({ length: 100 }, (_, i) => `/page-${i}/`);
    const baseline = new Set(urls);
    const current = new Set([...urls, "/new-page/"]);

    const result = diffPermalinks(baseline, current);
    assert.deepEqual(result.added, ["/new-page/"]);
    assert.deepEqual(result.removed, []);
  });

  it("uses exact string matching (no normalization)", () => {
    const baseline = new Set(["/about"]);
    const current = new Set(["/about/"]);

    const result = diffPermalinks(baseline, current);
    // These are different strings, so both should appear as changes
    assert.deepEqual(result.added, ["/about/"]);
    assert.deepEqual(result.removed, ["/about"]);
  });

  it("returns result with added and removed arrays", () => {
    const baseline = new Set(["/old/"]);
    const current = new Set(["/new/"]);

    const result = diffPermalinks(baseline, current);
    assert.ok(Array.isArray(result.added));
    assert.ok(Array.isArray(result.removed));
    assert.deepEqual(result.added, ["/new/"]);
    assert.deepEqual(result.removed, ["/old/"]);
  });
});

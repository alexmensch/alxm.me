import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  diffPermalinks,
  fetchKVValue,
  parsePermalinkList
} from "../check-permalinks.js";

const KV_ENV = {
  CLOUDFLARE_ACCOUNT_ID: "acct",
  CLOUDFLARE_KV_PERMALINK_NS_ID: "ns",
  CLOUDFLARE_API_TOKEN: "token"
};

function useStubbedKV() {
  const saved = {};
  const originalFetch = globalThis.fetch;
  const kv = { store: new Map(), requests: [], fail: new Map() };

  beforeEach(() => {
    for (const [name, value] of Object.entries(KV_ENV)) {
      saved[name] = process.env[name];
      process.env[name] = value;
    }
    kv.store.clear();
    kv.fail.clear();
    kv.requests.length = 0;
    globalThis.fetch = async (url, options = {}) => {
      const key = decodeURIComponent(url.split("/values/").pop());
      const method = options.method ?? "GET";
      kv.requests.push({ method, key });
      const failure = kv.fail.get(key);
      if (failure instanceof Error) {
        throw failure;
      }
      if (failure) {
        return new Response("error", { status: failure });
      }
      if (method === "PUT") {
        kv.store.set(key, options.body);
        return new Response("", { status: 200 });
      }
      return kv.store.has(key)
        ? new Response(kv.store.get(key), { status: 200 })
        : new Response("not found", { status: 404 });
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  return kv;
}

describe("parsePermalinkList", () => {
  it("trims lines and drops blanks", () => {
    assert.deepEqual(
      parsePermalinkList("/a/\n  /b/  \n\n/c/\n"),
      new Set(["/a/", "/b/", "/c/"])
    );
  });
});

describe("fetchKVValue", () => {
  const kv = useStubbedKV();

  it("returns the stored value", async () => {
    kv.store.set("k", "/a/\n");
    assert.equal(await fetchKVValue("k"), "/a/\n");
  });

  it("returns null when the key is absent (404)", async () => {
    assert.equal(await fetchKVValue("k"), null);
  });

  it("throws on a non-404 HTTP error", async () => {
    kv.fail.set("k", 500);
    await assert.rejects(fetchKVValue("k"), /HTTP 500/);
  });

  it("throws on a network error", async () => {
    kv.fail.set("k", new Error("ECONNRESET"));
    await assert.rejects(fetchKVValue("k"), /ECONNRESET/);
  });

  it("throws when credentials are missing", async () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    await assert.rejects(fetchKVValue("k"), /credentials not configured/);
  });
});

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

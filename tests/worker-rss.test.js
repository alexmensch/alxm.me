import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleRSSRequest } from "../worker/index.js";

// Helper: create a minimal Request object
function createRequest(url, headers = {}) {
  return new Request(url, { headers });
}

// Helper: create a mock env with RSS-related config
function createEnv({
  rssLastModified,
  assetResponse,
  assetFetchError
} = {}) {
  return {
    RSS_LAST_MODIFIED: rssLastModified || "2025-12-19",
    ASSETS: {
      fetch: async () => {
        if (assetFetchError) {
          throw assetFetchError;
        }
        return (
          assetResponse ||
          new Response('<?xml version="1.0"?><rss></rss>', {
            status: 200,
            headers: { "Content-Type": "application/rss+xml" }
          })
        );
      }
    }
  };
}

describe("handleRSSRequest", () => {
  describe("successful RSS serving", () => {
    it("returns RSS content with correct Content-Type", async () => {
      const env = createEnv();
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(
        response.headers.get("Content-Type"),
        "application/rss+xml; charset=utf-8"
      );
    });

    it("includes Last-Modified header", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      const lastModified = response.headers.get("Last-Modified");
      assert.ok(lastModified);
      // Should be the UTC string of 2025-12-19T00:00:00Z
      assert.equal(lastModified, "Fri, 19 Dec 2025 00:00:00 GMT");
    });

    it("includes Cache-Control header", async () => {
      const env = createEnv();
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(
        response.headers.get("Cache-Control"),
        "public, max-age=3600"
      );
    });

    it("returns status 200 for fresh request", async () => {
      const env = createEnv();
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 200);
    });
  });

  describe("conditional requests (If-Modified-Since)", () => {
    it("returns 304 when If-Modified-Since matches Last-Modified", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss",
        { "If-Modified-Since": "Fri, 19 Dec 2025 00:00:00 GMT" }
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 304);
    });

    it("returns 304 when If-Modified-Since is newer than Last-Modified", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss",
        { "If-Modified-Since": "Sat, 20 Dec 2025 00:00:00 GMT" }
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 304);
    });

    it("returns 200 when If-Modified-Since is older than Last-Modified", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss",
        { "If-Modified-Since": "Thu, 18 Dec 2025 00:00:00 GMT" }
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 200);
    });

    it("returns empty body for 304 response", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss",
        { "If-Modified-Since": "Fri, 19 Dec 2025 00:00:00 GMT" }
      );

      const response = await handleRSSRequest(request, env);
      const body = await response.text();
      assert.equal(body, "");
    });
  });

  describe("error handling", () => {
    it("returns 500 when ASSETS.fetch throws", async () => {
      const env = createEnv({
        assetFetchError: new Error("Asset fetch failed")
      });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 500);
    });

    it("handles malformed If-Modified-Since header", async () => {
      const env = createEnv({ rssLastModified: "2025-12-19" });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss",
        { "If-Modified-Since": "not-a-valid-date" }
      );

      // Malformed date creates an Invalid Date object, comparison should
      // fall through to serving the full response
      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 200);
    });

    it("handles missing RSS_LAST_MODIFIED env var", async () => {
      const env = createEnv({ rssLastModified: undefined });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      // undefined creates "undefinedT00:00:00Z" which is an invalid date
      // The function should handle this gracefully (500 via catch)
      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 500);
    });

    it("passes through non-ok asset response", async () => {
      const env = createEnv({
        assetResponse: new Response("Not Found", { status: 404 })
      });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );

      const response = await handleRSSRequest(request, env);
      assert.equal(response.status, 404);
    });
  });
});

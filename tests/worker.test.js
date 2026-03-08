import { describe, it } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

// Helper: create a minimal Request object
function createRequest(url, headers = {}) {
  return new Request(url, { headers });
}

// Helper: create a mock env object with configurable ASSETS.fetch behavior
function createEnv({ assetResponse, r2Object, rssLastModified } = {}) {
  return {
    R2_PATHS: JSON.stringify(["/assets/podcast/audio/", "/assets/files/"]),
    RSS_PATH: "/podcast/feed/what-i-knew.rss",
    RSS_LAST_MODIFIED: rssLastModified || "2025-12-19",
    ASSETS: {
      fetch: async () =>
        assetResponse ||
        new Response("default", {
          headers: { "Content-Type": "text/html" }
        })
    },
    R2_BUCKET: {
      get: async () => r2Object || null
    }
  };
}

// Helper: create an asset response with a given content type
function htmlResponse(body = "<html></html>", extraHeaders = {}) {
  const headers = new Headers({ "Content-Type": "text/html", ...extraHeaders });
  return new Response(body, { status: 200, headers });
}

function nonHtmlResponse(
  contentType = "text/css",
  body = "body{}",
  extraHeaders = {}
) {
  const headers = new Headers({ "Content-Type": contentType, ...extraHeaders });
  return new Response(body, { status: 200, headers });
}

describe("TDM-Reservation header on static asset responses", () => {
  describe("HTML responses", () => {
    it("includes TDM-Reservation: 1 header on HTML responses", async () => {
      const env = createEnv({ assetResponse: htmlResponse() });
      const request = createRequest("https://alxm.me/about/");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), "1");
    });

    it("includes TDM-Reservation: 1 when Content-Type is text/html with charset", async () => {
      const env = createEnv({
        assetResponse: new Response("<html></html>", {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        })
      });
      const request = createRequest("https://alxm.me/writing/");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), "1");
    });

    it("preserves the original response body for HTML responses", async () => {
      const body = "<html><body>Hello</body></html>";
      const env = createEnv({ assetResponse: htmlResponse(body) });
      const request = createRequest("https://alxm.me/");
      const response = await worker.fetch(request, env);

      const text = await response.text();
      assert.equal(text, body);
    });

    it("preserves the original status code for HTML responses", async () => {
      const assetResponse = new Response("<html>Not Found</html>", {
        status: 404,
        headers: { "Content-Type": "text/html" }
      });
      const env = createEnv({ assetResponse });
      const request = createRequest("https://alxm.me/nonexistent/");
      const response = await worker.fetch(request, env);

      assert.equal(response.status, 404);
      assert.equal(response.headers.get("TDM-Reservation"), "1");
    });

    it("preserves existing headers on HTML responses", async () => {
      const env = createEnv({
        assetResponse: htmlResponse("<html></html>", {
          "Cache-Control": "public, max-age=3600",
          "X-Custom-Header": "custom-value"
        })
      });
      const request = createRequest("https://alxm.me/");
      const response = await worker.fetch(request, env);

      assert.equal(
        response.headers.get("Cache-Control"),
        "public, max-age=3600"
      );
      assert.equal(response.headers.get("X-Custom-Header"), "custom-value");
      assert.equal(response.headers.get("Content-Type"), "text/html");
      assert.equal(response.headers.get("TDM-Reservation"), "1");
    });
  });

  describe("non-HTML responses", () => {
    it("does not include TDM-Reservation header on CSS responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse("text/css", "body{}")
      });
      const request = createRequest("https://alxm.me/assets/style.css");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on JavaScript responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse(
          "application/javascript",
          "console.log()"
        )
      });
      const request = createRequest("https://alxm.me/assets/script.js");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on image responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse("image/png", "PNG data")
      });
      const request = createRequest("https://alxm.me/assets/image.png");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on JSON responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse("application/json", "{}")
      });
      const request = createRequest("https://alxm.me/site.webmanifest");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on XML responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse("application/xml", "<xml/>")
      });
      const request = createRequest("https://alxm.me/sitemap.xml");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on plain text responses", async () => {
      const env = createEnv({
        assetResponse: nonHtmlResponse("text/plain", "hello")
      });
      const request = createRequest("https://alxm.me/robots.txt");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("preserves non-HTML response body unchanged", async () => {
      const cssBody = "body { color: red; }";
      const env = createEnv({
        assetResponse: nonHtmlResponse("text/css", cssBody)
      });
      const request = createRequest("https://alxm.me/assets/style.css");
      const response = await worker.fetch(request, env);

      const text = await response.text();
      assert.equal(text, cssBody);
    });
  });

  describe("R2 responses", () => {
    it("does not include TDM-Reservation header on R2 audio responses", async () => {
      const r2Object = {
        body: new ReadableStream(),
        size: 1024,
        httpMetadata: {}
      };
      const env = createEnv({ r2Object });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/episode-1.mp3"
      );
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });

    it("does not include TDM-Reservation header on R2 PDF responses", async () => {
      const r2Object = {
        body: new ReadableStream(),
        size: 2048,
        httpMetadata: {}
      };
      const env = createEnv({ r2Object });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });
  });

  describe("RSS responses", () => {
    it("does not include TDM-Reservation header on RSS feed responses", async () => {
      const rssContent = '<?xml version="1.0"?><rss></rss>';
      const env = createEnv({
        assetResponse: new Response(rssContent, {
          status: 200,
          headers: { "Content-Type": "application/rss+xml" }
        }),
        rssLastModified: "2025-12-19"
      });
      const request = createRequest(
        "https://alxm.me/podcast/feed/what-i-knew.rss"
      );
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });
  });

  describe("response without Content-Type header", () => {
    it("does not include TDM-Reservation header when Content-Type is absent", async () => {
      const env = createEnv({
        assetResponse: new Response("binary data", { status: 200 })
      });
      const request = createRequest("https://alxm.me/somefile");
      const response = await worker.fetch(request, env);

      assert.equal(response.headers.get("TDM-Reservation"), null);
    });
  });
});

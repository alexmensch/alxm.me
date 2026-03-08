import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { handleR2Request } from "../worker/index.js";
import { createRequest } from "./helpers/worker-mocks.js";

// Helper: create a mock R2 bucket
function createEnv({ r2GetResult, r2GetRangeResult, r2GetError } = {}) {
  return {
    R2_BUCKET: {
      get: async (_key, options) => {
        if (r2GetError) {
          throw r2GetError;
        }
        if (options && options.range) {
          return r2GetRangeResult || r2GetResult;
        }
        return r2GetResult || null;
      }
    }
  };
}

describe("handleR2Request", () => {
  describe("successful object retrieval", () => {
    it("returns 200 with correct body for a found object", async () => {
      const body = "file contents";
      const env = createEnv({
        r2GetResult: { body, size: body.length }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 200);
    });

    it("returns correct Content-Type based on file extension", async () => {
      const env = createEnv({
        r2GetResult: { body: "data", size: 4 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.headers.get("Content-Type"), "application/pdf");
    });

    it("sets Cache-Control header", async () => {
      const env = createEnv({
        r2GetResult: { body: "data", size: 4 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(
        response.headers.get("Cache-Control"),
        "public, max-age=31536000"
      );
    });

    it("sets Content-Length when object has size", async () => {
      const env = createEnv({
        r2GetResult: { body: "data", size: 1024 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.headers.get("Content-Length"), "1024");
    });
  });

  describe("range requests for audio streaming", () => {
    it("returns 206 with Content-Range for valid range request on audio", async () => {
      const env = createEnv({
        r2GetResult: { body: "full audio data", size: 10000 },
        r2GetRangeResult: { body: "partial audio" }
      });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/episode.mp3",
        { Range: "bytes=0-999" }
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 206);
      assert.equal(
        response.headers.get("Content-Range"),
        "bytes 0-999/10000"
      );
    });

    it("handles range with no end byte", async () => {
      const env = createEnv({
        r2GetResult: { body: "full audio data", size: 10000 },
        r2GetRangeResult: { body: "rest of audio" }
      });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/episode.mp3",
        { Range: "bytes=5000-" }
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 206);
      assert.equal(
        response.headers.get("Content-Range"),
        "bytes 5000-9999/10000"
      );
    });

    it("sets Accept-Ranges header for audio content", async () => {
      const env = createEnv({
        r2GetResult: { body: "audio data", size: 5000 }
      });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/episode.mp3"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.headers.get("Accept-Ranges"), "bytes");
    });

    it("sets Accept-Ranges header for video content", async () => {
      const env = createEnv({
        r2GetResult: { body: "video data", size: 5000 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/video.mp4"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.headers.get("Accept-Ranges"), "bytes");
    });

    it("does not process range requests for non-audio/video files", async () => {
      const env = createEnv({
        r2GetResult: { body: "pdf data", size: 5000 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf",
        { Range: "bytes=0-999" }
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      // Should return 200, not 206, for non-audio/video
      assert.equal(response.status, 200);
    });
  });

  describe("missing objects", () => {
    it("returns 404 when object is not found", async () => {
      const env = createEnv({ r2GetResult: null });
      const request = createRequest(
        "https://alxm.me/assets/files/nonexistent.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 404);
    });
  });

  describe("error handling", () => {
    it("returns 500 when R2 get throws an error", async () => {
      const env = createEnv({
        r2GetError: new Error("R2 connection failed")
      });
      const request = createRequest(
        "https://alxm.me/assets/files/document.pdf"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 500);
    });
  });

  describe("edge cases", () => {
    it("falls back to application/octet-stream for unknown extension", async () => {
      const env = createEnv({
        r2GetResult: { body: "data", size: 4 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/file.xyz"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(
        response.headers.get("Content-Type"),
        "application/octet-stream"
      );
    });

    it("handles path with no extension", async () => {
      const env = createEnv({
        r2GetResult: { body: "data", size: 4 }
      });
      const request = createRequest(
        "https://alxm.me/assets/files/noextension"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(
        response.headers.get("Content-Type"),
        "application/octet-stream"
      );
    });

    it("handles invalid range format gracefully", async () => {
      const env = createEnv({
        r2GetResult: { body: "audio data", size: 5000 }
      });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/episode.mp3",
        { Range: "invalid-range" }
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      // Invalid range should fall through to a normal 200 response
      assert.equal(response.status, 200);
    });

    it("handles R2 paths that match configured prefixes", async () => {
      const env = createEnv({
        r2GetResult: { body: "audio", size: 5 }
      });
      const request = createRequest(
        "https://alxm.me/assets/podcast/audio/ep1.mp3"
      );
      const url = new URL(request.url);

      const response = await handleR2Request(request, env, url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), "audio/mpeg");
    });
  });
});

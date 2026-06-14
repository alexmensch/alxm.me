import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getContentType, MIME_TYPES } from "../worker/index.js";

describe("MIME_TYPES map", () => {
  const expected = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".zip": "application/zip",
    ".json": "application/json",
    ".xml": "application/xml",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript"
  };

  it("contains exactly the expected entries", () => {
    assert.deepEqual(MIME_TYPES, expected);
  });
});

describe("getContentType", () => {
  it("returns correct MIME type for known extensions", () => {
    assert.equal(getContentType("/path/to/file.mp3"), "audio/mpeg");
    assert.equal(getContentType("/path/to/file.pdf"), "application/pdf");
    assert.equal(getContentType("/path/to/file.html"), "text/html");
  });

  it("returns application/octet-stream for unknown extensions", () => {
    assert.equal(
      getContentType("/path/to/file.xyz"),
      "application/octet-stream"
    );
  });

  it("handles mixed case extensions", () => {
    assert.equal(getContentType("/path/to/file.MP3"), "audio/mpeg");
    assert.equal(getContentType("/path/to/file.Html"), "text/html");
    assert.equal(getContentType("/path/to/file.PDF"), "application/pdf");
  });

  it("handles paths with multiple dots", () => {
    assert.equal(getContentType("/path/to/file.backup.mp3"), "audio/mpeg");
    assert.equal(
      getContentType("/path/to/file.2025.01.pdf"),
      "application/pdf"
    );
  });

  it("handles path with no extension", () => {
    const result = getContentType("/path/to/noextension");
    assert.equal(result, "application/octet-stream");
  });
});

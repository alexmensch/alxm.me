import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getContentType, MIME_TYPES } from "../worker/index.js";

describe("MIME_TYPES map", () => {
  it("contains all 19 expected entries", () => {
    assert.equal(Object.keys(MIME_TYPES).length, 19);
  });

  it("maps .mp3 to audio/mpeg", () => {
    assert.equal(MIME_TYPES[".mp3"], "audio/mpeg");
  });

  it("maps .m4a to audio/mp4", () => {
    assert.equal(MIME_TYPES[".m4a"], "audio/mp4");
  });

  it("maps .wav to audio/wav", () => {
    assert.equal(MIME_TYPES[".wav"], "audio/wav");
  });

  it("maps .pdf to application/pdf", () => {
    assert.equal(MIME_TYPES[".pdf"], "application/pdf");
  });

  it("maps .jpg to image/jpeg", () => {
    assert.equal(MIME_TYPES[".jpg"], "image/jpeg");
  });

  it("maps .jpeg to image/jpeg", () => {
    assert.equal(MIME_TYPES[".jpeg"], "image/jpeg");
  });

  it("maps .png to image/png", () => {
    assert.equal(MIME_TYPES[".png"], "image/png");
  });

  it("maps .webp to image/webp", () => {
    assert.equal(MIME_TYPES[".webp"], "image/webp");
  });

  it("maps .gif to image/gif", () => {
    assert.equal(MIME_TYPES[".gif"], "image/gif");
  });

  it("maps .svg to image/svg+xml", () => {
    assert.equal(MIME_TYPES[".svg"], "image/svg+xml");
  });

  it("maps .mp4 to video/mp4", () => {
    assert.equal(MIME_TYPES[".mp4"], "video/mp4");
  });

  it("maps .webm to video/webm", () => {
    assert.equal(MIME_TYPES[".webm"], "video/webm");
  });

  it("maps .zip to application/zip", () => {
    assert.equal(MIME_TYPES[".zip"], "application/zip");
  });

  it("maps .json to application/json", () => {
    assert.equal(MIME_TYPES[".json"], "application/json");
  });

  it("maps .xml to application/xml", () => {
    assert.equal(MIME_TYPES[".xml"], "application/xml");
  });

  it("maps .txt to text/plain", () => {
    assert.equal(MIME_TYPES[".txt"], "text/plain");
  });

  it("maps .html to text/html", () => {
    assert.equal(MIME_TYPES[".html"], "text/html");
  });

  it("maps .css to text/css", () => {
    assert.equal(MIME_TYPES[".css"], "text/css");
  });

  it("maps .js to application/javascript", () => {
    assert.equal(MIME_TYPES[".js"], "application/javascript");
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
    assert.equal(getContentType("/path/to/file.2025.01.pdf"), "application/pdf");
  });

  it("handles path with no extension", () => {
    const result = getContentType("/path/to/noextension");
    assert.equal(result, "application/octet-stream");
  });
});

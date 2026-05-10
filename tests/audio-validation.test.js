import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash as nodeCreateHash } from "node:crypto";
import { validateAudioMetadata } from "../eleventy-plugins/audio-validation.js";

// Helper: compute MD5 hash of a buffer (same as the plugin does)
function md5(buffer) {
  return nodeCreateHash("md5").update(buffer).digest("hex");
}

// Factory: create mock dependencies with sensible defaults
function createMocks({
  metadata = {},
  files = [],
  fileContent,
  readError
} = {}) {
  return {
    readFileSync: (filePath) => {
      if (readError && filePath.includes("audioMetadata.json")) {
        throw readError;
      }
      if (filePath.includes("audioMetadata.json")) {
        return JSON.stringify(metadata);
      }
      return fileContent || Buffer.from("audio");
    },
    readdirSync: () => files,
    createHash: (alg) => nodeCreateHash(alg)
  };
}

describe("validateAudioMetadata", () => {
  describe("passing validation", () => {
    it("passes when all audio files have matching metadata with correct hashes", () => {
      const fileContent = Buffer.from("test audio content");
      const hash = md5(fileContent);
      const mocks = createMocks({
        metadata: { "/assets/podcast/audio/episode1.mp3": { hash } },
        files: ["episode1.mp3"],
        fileContent
      });

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("passes when there are no audio files in the directory", () => {
      const mocks = createMocks({ files: [] });
      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("filters out dotfiles from the directory listing", () => {
      const mocks = createMocks({ files: [".DS_Store", ".hidden.mp3"] });
      // Dotfiles should be filtered out; no error about missing metadata
      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("passes silently when metadata has extra entries not on disk", () => {
      const fileContent = Buffer.from("audio");
      const hash = md5(fileContent);
      const mocks = createMocks({
        metadata: {
          "/assets/podcast/audio/episode1.mp3": { hash },
          "/assets/podcast/audio/deleted-episode.mp3": { hash: "stale" }
        },
        files: ["episode1.mp3"],
        fileContent
      });

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });
  });

  describe("LFS pointer files", () => {
    const LFS_POINTER = Buffer.from(
      "version https://git-lfs.github.com/spec/v1\n" +
        "oid sha256:0000000000000000000000000000000000000000000000000000000000000000\n" +
        "size 12345\n"
    );

    it("skips hash check when audio file is an LFS pointer", () => {
      const mocks = createMocks({
        metadata: {
          "/assets/podcast/audio/episode1.mp3": { hash: "real-file-hash" }
        },
        files: ["episode1.mp3"],
        fileContent: LFS_POINTER
      });

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("still requires LFS-pointer files to have a metadata entry", () => {
      const mocks = createMocks({
        files: ["episode1.mp3"],
        fileContent: LFS_POINTER
      });

      assert.throws(
        () => validateAudioMetadata(mocks),
        (err) => err.message.includes("validation failed")
      );
    });
  });

  describe("failing validation", () => {
    it("throws when an audio file has no metadata entry", () => {
      const mocks = createMocks({ files: ["episode1.mp3"] });

      assert.throws(
        () => validateAudioMetadata(mocks),
        (err) => err.message.includes("validation failed")
      );
    });

    it("throws when MD5 hash does not match (file changed)", () => {
      const mocks = createMocks({
        metadata: {
          "/assets/podcast/audio/episode1.mp3": { hash: "stale-hash-value" }
        },
        files: ["episode1.mp3"],
        fileContent: Buffer.from("changed audio content")
      });

      assert.throws(
        () => validateAudioMetadata(mocks),
        (err) => err.message.includes("validation failed")
      );
    });

    it("throws when metadata file is missing", () => {
      const mocks = createMocks({
        files: ["episode1.mp3"],
        readError: new Error("ENOENT: no such file or directory")
      });

      assert.throws(() => validateAudioMetadata(mocks));
    });
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash as nodeCreateHash } from "node:crypto";
import { validateAudioMetadata } from "../eleventy-plugins/audio-validation.js";

// Helper: compute MD5 hash of a buffer (same as the plugin does)
function md5(buffer) {
  return nodeCreateHash("md5").update(buffer).digest("hex");
}

describe("validateAudioMetadata", () => {
  describe("passing validation", () => {
    it("passes when all audio files have matching metadata with correct hashes", () => {
      const fileContent = Buffer.from("test audio content");
      const hash = md5(fileContent);

      const metadata = {
        "/assets/podcast/audio/episode1.mp3": { hash }
      };

      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return JSON.stringify(metadata);
          }
          return fileContent;
        },
        readdirSync: () => ["episode1.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("passes when there are no audio files in the directory", () => {
      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return "{}";
          }
          return Buffer.from("");
        },
        readdirSync: () => [],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("filters out dotfiles from the directory listing", () => {
      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return "{}";
          }
          return Buffer.from("");
        },
        readdirSync: () => [".DS_Store", ".hidden.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      // Dotfiles should be filtered out; no error about missing metadata
      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });

    it("passes silently when metadata has extra entries not on disk", () => {
      const fileContent = Buffer.from("audio");
      const hash = md5(fileContent);

      const metadata = {
        "/assets/podcast/audio/episode1.mp3": { hash },
        "/assets/podcast/audio/deleted-episode.mp3": { hash: "stale" }
      };

      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return JSON.stringify(metadata);
          }
          return fileContent;
        },
        readdirSync: () => ["episode1.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.doesNotThrow(() => validateAudioMetadata(mocks));
    });
  });

  describe("failing validation", () => {
    it("throws when an audio file has no metadata entry", () => {
      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return "{}";
          }
          return Buffer.from("audio");
        },
        readdirSync: () => ["episode1.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.throws(
        () => validateAudioMetadata(mocks),
        (err) => err.message.includes("validation failed")
      );
    });

    it("throws when MD5 hash does not match (file changed)", () => {
      const metadata = {
        "/assets/podcast/audio/episode1.mp3": { hash: "stale-hash-value" }
      };

      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            return JSON.stringify(metadata);
          }
          return Buffer.from("changed audio content");
        },
        readdirSync: () => ["episode1.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.throws(
        () => validateAudioMetadata(mocks),
        (err) => err.message.includes("validation failed")
      );
    });

    it("throws when metadata file is missing", () => {
      const mocks = {
        readFileSync: (filePath) => {
          if (filePath.includes("audioMetadata.json")) {
            throw new Error("ENOENT: no such file or directory");
          }
          return Buffer.from("audio");
        },
        readdirSync: () => ["episode1.mp3"],
        createHash: (alg) => nodeCreateHash(alg)
      };

      assert.throws(() => validateAudioMetadata(mocks));
    });
  });
});

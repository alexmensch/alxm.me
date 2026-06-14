/**
 * Audio Validation Plugin
 *
 * Validates that all podcast audio files have matching metadata in audioMetadata.json.
 * Runs during the eleventy.before event to fail fast if metadata is out of sync.
 */

import { readFileSync, readdirSync } from "fs";
import { createHash } from "crypto";

const SRC_DIR = "src";
const AUDIO_PATH = "/assets/podcast/audio";
const AUDIO_DIR = `${SRC_DIR}${AUDIO_PATH}`;
const METADATA_FILE = `${SRC_DIR}/_data/audioMetadata.json`;
const LFS_POINTER_PREFIX = "version https://git-lfs.github.com/spec/v1";

function isLfsPointer(buffer) {
  return (
    buffer.length < 1024 &&
    buffer.subarray(0, LFS_POINTER_PREFIX.length).toString("utf8") ===
      LFS_POINTER_PREFIX
  );
}

export function validateAudioMetadata(deps = {}) {
  const _readFileSync = deps.readFileSync || readFileSync;
  const _readdirSync = deps.readdirSync || readdirSync;
  const _createHash = deps.createHash || createHash;

  let metadata;
  try {
    metadata = JSON.parse(_readFileSync(METADATA_FILE, "utf8"));
  } catch {
    throw new Error(
      `Audio metadata file not found: ${METADATA_FILE}\n` +
        `Run 'pnpm run audio:update' to generate it.`
    );
  }

  const files = _readdirSync(AUDIO_DIR).filter(
    (f) => f.endsWith(".mp3") && !f.startsWith(".")
  );

  const errors = [];
  let pointerCount = 0;

  for (const file of files) {
    const key = `${AUDIO_PATH}/${file}`;
    const filePath = `${AUDIO_DIR}/${file}`;

    if (!metadata[key]) {
      errors.push(`${file}: not in audioMetadata.json`);
      continue;
    }

    const fileBuffer = _readFileSync(filePath);

    if (isLfsPointer(fileBuffer)) {
      pointerCount++;
      continue;
    }

    const hash = _createHash("md5").update(fileBuffer).digest("hex");

    if (hash !== metadata[key].hash) {
      errors.push(`${file}: hash mismatch (file changed)`);
    }
  }

  if (errors.length > 0) {
    console.error("\nAudio metadata validation failed:");
    errors.forEach((e) => console.error(`  ${e}`));
    console.error("\nRun 'pnpm run audio:update' to fix\n");
    throw new Error("Audio metadata validation failed");
  }

  if (pointerCount > 0) {
    // LFS objects weren't smudged at checkout — expected on Cloudflare preview
    // builds where GIT_LFS_SKIP_SMUDGE=1 keeps us under the GitHub LFS quota.
    console.log(
      `[audio-validation] Skipped ${pointerCount} LFS pointer file(s) ` +
        `(LFS objects not downloaded)`
    );
    return;
  }

  console.log("[audio-validation] All audio files match metadata");
}

export default function audioValidationPlugin(eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    validateAudioMetadata();
  });
}

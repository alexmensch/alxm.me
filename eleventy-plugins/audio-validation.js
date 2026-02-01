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

export default function audioValidationPlugin(eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    let metadata;
    try {
      metadata = JSON.parse(readFileSync(METADATA_FILE, "utf8"));
    } catch {
      throw new Error(
        `Audio metadata file not found: ${METADATA_FILE}\n` +
          `Run 'pnpm run audio:update' to generate it.`
      );
    }

    const files = readdirSync(AUDIO_DIR).filter(
      (f) => f.endsWith(".mp3") && !f.startsWith(".")
    );

    const errors = [];

    for (const file of files) {
      const key = `${AUDIO_PATH}/${file}`;
      const filePath = `${AUDIO_DIR}/${file}`;

      if (!metadata[key]) {
        errors.push(`${file}: not in audioMetadata.json`);
        continue;
      }

      const fileBuffer = readFileSync(filePath);
      const hash = createHash("md5").update(fileBuffer).digest("hex");

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

    console.log("[audio-validation] All audio files match metadata");
  });
}

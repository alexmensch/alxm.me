/**
 * Photo Validation Plugin
 *
 * Validates that all photograph images have matching metadata in photoMetadata.json.
 * Runs during the eleventy.before event to fail fast if metadata is out of sync.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { createHash } from "crypto";

const SRC_DIR = "src";
const PHOTO_PATH = "/assets/artwork/photographs";
const PHOTO_DIR = `${SRC_DIR}${PHOTO_PATH}`;
const METADATA_FILE = `${SRC_DIR}/_data/photoMetadata.json`;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export default function photoValidationPlugin(eleventyConfig) {
  eleventyConfig.on("eleventy.before", async () => {
    let metadata;
    try {
      metadata = JSON.parse(readFileSync(METADATA_FILE, "utf8"));
    } catch {
      throw new Error(
        `Photo metadata file not found: ${METADATA_FILE}\n` +
          `Run 'pnpm run photo:update' to generate it.`
      );
    }

    // If directory doesn't exist yet, that's OK
    if (!existsSync(PHOTO_DIR)) {
      console.log("[photo-validation] No photographs directory yet");
      return;
    }

    const files = readdirSync(PHOTO_DIR).filter((f) => {
      const ext = f.toLowerCase().slice(f.lastIndexOf("."));
      return IMAGE_EXTENSIONS.includes(ext) && !f.startsWith(".");
    });

    // Empty directory is OK
    if (files.length === 0) {
      console.log("[photo-validation] No photograph files to validate");
      return;
    }

    const errors = [];

    for (const file of files) {
      const key = `${PHOTO_PATH}/${file}`;
      const filePath = `${PHOTO_DIR}/${file}`;

      if (!metadata[key]) {
        errors.push(`${file}: not in photoMetadata.json`);
        continue;
      }

      const fileBuffer = readFileSync(filePath);
      const hash = createHash("md5").update(fileBuffer).digest("hex");

      if (hash !== metadata[key].hash) {
        errors.push(`${file}: hash mismatch (file changed)`);
      }
    }

    if (errors.length > 0) {
      console.error("\nPhoto metadata validation failed:");
      errors.forEach((e) => console.error(`  ${e}`));
      console.error("\nRun 'pnpm run photo:update' to fix\n");
      throw new Error("Photo metadata validation failed");
    }

    console.log("[photo-validation] All photograph files match metadata");
  });
}

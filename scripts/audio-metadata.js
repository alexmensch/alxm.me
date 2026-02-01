/**
 * Audio Metadata Script
 *
 * Updates or validates the audio metadata cache for podcast MP3 files.
 *
 * Usage:
 *   pnpm run audio:update    - Update metadata for new/changed files
 *   pnpm run audio:validate  - Validate all files match cached metadata
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";

const SRC_DIR = "src";
const AUDIO_PATH = "/assets/podcast/audio";
const AUDIO_DIR = `${SRC_DIR}${AUDIO_PATH}`;
const METADATA_FILE = `${SRC_DIR}/_data/audioMetadata.json`;

function computeMD5(filePath) {
  const fileBuffer = readFileSync(filePath);
  return createHash("md5").update(fileBuffer).digest("hex");
}

function getAudioFiles() {
  return readdirSync(AUDIO_DIR).filter(
    (f) => f.endsWith(".mp3") && !f.startsWith(".")
  );
}

async function updateMetadata() {
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(METADATA_FILE, "utf8"));
  } catch {
    console.log("Creating new metadata file");
  }

  const files = getAudioFiles();
  const updated = {};
  let newCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  for (const file of files) {
    const filePath = join(AUDIO_DIR, file);
    const key = `${AUDIO_PATH}/${file}`;
    const currentHash = computeMD5(filePath);

    if (existing[key] && existing[key].hash === currentHash) {
      updated[key] = existing[key];
      unchangedCount++;
      continue;
    }

    const duration = Math.ceil(await getAudioDurationInSeconds(filePath));
    const stats = statSync(filePath);

    updated[key] = {
      hash: currentHash,
      duration,
      size: stats.size
    };

    if (existing[key]) {
      console.log(`Updated: ${file}`);
      changedCount++;
    } else {
      console.log(`Added: ${file}`);
      newCount++;
    }
  }

  writeFileSync(METADATA_FILE, `${JSON.stringify(updated, null, 2)}\n`);

  console.log(
    `\nSummary: ${newCount} added, ${changedCount} updated, ${unchangedCount} unchanged`
  );
}

function validateMetadata() {
  let metadata;
  try {
    metadata = JSON.parse(readFileSync(METADATA_FILE, "utf8"));
  } catch {
    throw new Error("audioMetadata.json not found or invalid");
  }

  const files = getAudioFiles();
  let hasErrors = false;

  for (const file of files) {
    const filePath = join(AUDIO_DIR, file);
    const key = `${AUDIO_PATH}/${file}`;

    if (!metadata[key]) {
      console.error(`Error: ${file} not in audioMetadata.json`);
      hasErrors = true;
      continue;
    }

    const currentHash = computeMD5(filePath);
    if (currentHash !== metadata[key].hash) {
      console.error(`Error: ${file} hash mismatch (file changed)`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\nRun 'pnpm run audio:update' to update metadata");
    throw new Error("Audio metadata validation failed");
  }

  console.log("All audio files match metadata");
}

const command = process.argv[2];
if (command === "--validate") {
  validateMetadata();
} else {
  updateMetadata();
}

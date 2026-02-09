/**
 * Photo Metadata Script
 *
 * Updates or validates the photo metadata cache for photograph images.
 * Extracts dates and location from EXIF data.
 *
 * Usage:
 *   pnpm run photo:update    - Update metadata for new/changed files
 *   pnpm run photo:validate  - Validate all files match cached metadata
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync
} from "fs";
import { createHash } from "crypto";
import { join } from "path";
import ExifReader from "exifreader";
import geocoder from "local-reverse-geocoder";

const SRC_DIR = "src";
const PHOTO_PATH = "/assets/artwork/photographs";
const PHOTO_DIR = `${SRC_DIR}${PHOTO_PATH}`;
const METADATA_FILE = `${SRC_DIR}/_data/photoMetadata.json`;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Initialize geocoder (downloads data on first run)
let geocoderInitialized = false;

async function initGeocoder() {
  if (geocoderInitialized) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    geocoder.init(
      { dumpDirectory: "./node_modules/.geocoder-cache" },
      (err) => {
        if (err) {
          console.warn(
            "Geocoder initialization failed, location lookup disabled"
          );
          reject(err);
        } else {
          geocoderInitialized = true;
          resolve();
        }
      }
    );
  });
}

function computeMD5(filePath) {
  const fileBuffer = readFileSync(filePath);
  return createHash("md5").update(fileBuffer).digest("hex");
}

function getImageFiles() {
  if (!existsSync(PHOTO_DIR)) {
    return [];
  }
  return readdirSync(PHOTO_DIR).filter((f) => {
    const ext = f.toLowerCase().slice(f.lastIndexOf("."));
    return IMAGE_EXTENSIONS.includes(ext) && !f.startsWith(".");
  });
}

function extractDateFromExif(tags) {
  // Try DateTimeOriginal first (when photo was taken)
  if (tags["DateTimeOriginal"]?.description) {
    const exifDate = tags["DateTimeOriginal"].description;
    const [date] = exifDate.split(" ");
    return date.replace(/:/g, "-"); // "YYYY:MM:DD" -> "YYYY-MM-DD"
  }

  // Try DateTime (camera modification date)
  if (tags["DateTime"]?.description) {
    const exifDate = tags["DateTime"].description;
    const [date] = exifDate.split(" ");
    return date.replace(/:/g, "-");
  }

  // Try DateTimeDigitized
  if (tags["DateTimeDigitized"]?.description) {
    const exifDate = tags["DateTimeDigitized"].description;
    const [date] = exifDate.split(" ");
    return date.replace(/:/g, "-");
  }

  return null;
}

function extractGPSCoordinates(tags) {
  try {
    // ExifReader provides latitude/longitude as decimal values
    const lat = tags["GPSLatitude"]?.description;
    const lon = tags["GPSLongitude"]?.description;

    if (lat !== undefined && lon !== undefined) {
      // Parse the decimal values
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        return { latitude, longitude };
      }
    }
  } catch {
    // GPS extraction failed
  }

  return null;
}

async function reverseGeocode(latitude, longitude) {
  if (!geocoderInitialized) {
    return null;
  }

  return new Promise((resolve) => {
    geocoder.lookUp({ latitude, longitude }, 1, (err, result) => {
      if (err || !result || !result[0] || !result[0][0]) {
        resolve(null);
        return;
      }

      const place = result[0][0];
      // Build location string: City, Country
      const parts = [];
      if (place.name) parts.push(place.name);
      if (place.adminName1 && place.adminName1 !== place.name) {
        parts.push(place.adminName1);
      }
      if (place.countryCode) parts.push(place.countryCode);

      resolve(parts.length > 0 ? parts.join(", ") : null);
    });
  });
}

function extractDimensions(tags) {
  let width = tags["Image Width"]?.value || tags["PixelXDimension"]?.value;
  let height = tags["Image Height"]?.value || tags["PixelYDimension"]?.value;

  // Handle orientation for rotated images
  const orientation = tags["Orientation"]?.value;
  if (orientation && [5, 6, 7, 8].includes(orientation)) {
    // Image is rotated 90 or 270 degrees, swap dimensions
    [width, height] = [height, width];
  }

  if (width && height) {
    return { width, height };
  }

  return { width: null, height: null };
}

async function extractAllMetadata(filePath) {
  let tags = {};
  try {
    const buffer = readFileSync(filePath);
    tags = ExifReader.load(buffer);
  } catch {
    // EXIF extraction failed
  }

  // Extract date
  const exifDate = extractDateFromExif(tags);
  let date, dateSource;
  if (exifDate) {
    date = exifDate;
    dateSource = "exif";
  } else {
    const stats = statSync(filePath);
    date = stats.mtime.toISOString().split("T")[0];
    dateSource = "filesystem";
  }

  // Extract dimensions
  const { width, height } = extractDimensions(tags);

  // Extract GPS and reverse geocode
  const coords = extractGPSCoordinates(tags);
  let location = null;
  let latitude = null;
  let longitude = null;
  if (coords) {
    location = await reverseGeocode(coords.latitude, coords.longitude);
    latitude = coords.latitude;
    longitude = coords.longitude;
  }

  return {
    date,
    dateSource,
    width,
    height,
    location,
    latitude,
    longitude
  };
}

async function updateMetadata() {
  let existing = {};
  try {
    existing = JSON.parse(readFileSync(METADATA_FILE, "utf8"));
  } catch {
    console.log("Creating new metadata file");
  }

  const files = getImageFiles();

  if (files.length === 0) {
    console.log(`No image files found in ${PHOTO_DIR}`);
    writeFileSync(METADATA_FILE, "{}\n");
    return;
  }

  // Initialize geocoder for location lookups
  try {
    console.log("Initializing geocoder (may download data on first run)...");
    await initGeocoder();
    console.log("Geocoder ready");
  } catch {
    console.log("Continuing without location lookup");
  }

  const updated = {};
  let newCount = 0;
  let changedCount = 0;
  let unchangedCount = 0;

  for (const file of files) {
    const filePath = join(PHOTO_DIR, file);
    const key = `${PHOTO_PATH}/${file}`;
    const currentHash = computeMD5(filePath);

    if (existing[key] && existing[key].hash === currentHash) {
      updated[key] = existing[key];
      unchangedCount++;
      continue;
    }

    const metadata = await extractAllMetadata(filePath);

    updated[key] = {
      hash: currentHash,
      ...metadata
    };

    const locationInfo = metadata.location ? ` @ ${metadata.location}` : "";
    if (existing[key]) {
      console.log(`Updated: ${file} (${metadata.dateSource}${locationInfo})`);
      changedCount++;
    } else {
      console.log(`Added: ${file} (${metadata.dateSource}${locationInfo})`);
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
    throw new Error("photoMetadata.json not found or invalid");
  }

  const files = getImageFiles();

  // No files is OK - empty directory
  if (files.length === 0 && Object.keys(metadata).length === 0) {
    console.log("No photograph files to validate");
    return;
  }

  let hasErrors = false;

  for (const file of files) {
    const filePath = join(PHOTO_DIR, file);
    const key = `${PHOTO_PATH}/${file}`;

    if (!metadata[key]) {
      console.error(`Error: ${file} not in photoMetadata.json`);
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
    console.error("\nRun 'pnpm run photo:update' to update metadata");
    throw new Error("Photo metadata validation failed");
  }

  console.log("All photograph files match metadata");
}

const command = process.argv[2];
if (command === "--validate") {
  validateMetadata();
} else {
  updateMetadata();
}

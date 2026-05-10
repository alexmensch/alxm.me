import {
  readFileSync,
  readdirSync,
  existsSync,
  openSync,
  readSync,
  closeSync
} from "fs";
import { createHash } from "crypto";
import { join, dirname, extname } from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import dotenv from "dotenv";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const LFS_POINTER_PREFIX = "version https://git-lfs.github.com/spec/v1";

function isLfsPointer(filePath) {
  let fd;
  try {
    fd = openSync(filePath, "r");
    const buf = Buffer.alloc(LFS_POINTER_PREFIX.length);
    const bytesRead = readSync(fd, buf, 0, buf.length, 0);
    return (
      bytesRead === buf.length && buf.toString("utf8") === LFS_POINTER_PREFIX
    );
  } catch {
    return false;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const { BUCKET_NAME, SRC_PREFIX, R2_DIRS } = config;

const MIME_TYPES = {
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

function getContentType(filename) {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function computeMD5(filePath) {
  const fileBuffer = readFileSync(filePath);
  return createHash("md5").update(fileBuffer).digest("hex");
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
  }
});

function uploadFileToR2(filePath, key, contentType) {
  try {
    execFileSync(
      "npx",
      [
        "wrangler",
        "r2",
        "object",
        "put",
        `${BUCKET_NAME}/${key}`,
        "--file",
        filePath,
        "--remote",
        "--content-type",
        contentType
      ],
      { stdio: "inherit", cwd: __dirname }
    );
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}`);
    throw error;
  }
}

async function isFileUnchanged(filePath, key) {
  try {
    const command = new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const response = await s3Client.send(command);

    // R2 ETag is MD5 hash in quotes for non-multipart uploads
    const remoteETag = response.ETag?.replace(/"/g, "");
    const localMD5 = computeMD5(filePath);

    return remoteETag === localMD5;
  } catch (error) {
    if (error["$metadata"]?.httpStatusCode === 404) {
      return false;
    } else {
      throw error;
    }
  }
}

async function syncFiles() {
  try {
    let totalFiles = 0;
    let uploadedFiles = 0;
    const pointerFiles = [];

    for (const dir of R2_DIRS) {
      const srcDir = join(__dirname, "../..", SRC_PREFIX, dir);

      if (!existsSync(srcDir)) {
        console.log(`⚠️ Directory not found, skipping: ${srcDir}`);
        continue;
      }

      const files = readdirSync(srcDir).filter((file) => !file.startsWith("."));

      console.log(`📁 Processing ${dir}: ${files.length} files`);

      for (const file of files) {
        const filePath = join(srcDir, file);
        const key = `${dir}/${file}`;
        const contentType = getContentType(file);

        if (isLfsPointer(filePath)) {
          pointerFiles.push(key);
          continue;
        }

        totalFiles++;
        const unchanged = await isFileUnchanged(filePath, key);
        if (!unchanged) {
          uploadFileToR2(filePath, key, contentType);
          uploadedFiles++;
        }
      }
    }

    if (pointerFiles.length > 0) {
      // Refuse rather than upload pointer files as real content — that would
      // corrupt R2. Reaching this branch means R2 sync ran with LFS objects
      // not downloaded; either skip the sync step (preview builds) or run
      // `git lfs pull` first (production builds).
      console.error(
        `\n❌ R2 sync aborted: ${pointerFiles.length} file(s) are LFS pointers, not real content:`
      );
      pointerFiles.forEach((k) => console.error(`  ${k}`));
      console.error(
        "\nRun 'git lfs pull' before sync, or skip R2 sync on builds " +
          "where LFS objects aren't needed (e.g. previews).\n"
      );
      process.exit(1); // eslint-disable-line no-process-exit
    }

    console.log(
      `🚀 R2 sync complete! ${uploadedFiles}/${totalFiles} files uploaded`
    );
  } catch (error) {
    console.error("❌ Sync failed: ", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

syncFiles();

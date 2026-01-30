import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { join, dirname, extname } from "path";
import { execSync, execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import dotenv from "dotenv";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

const { BUCKET_NAME, SRC_PREFIX, R2_DIRS, WORKER_NAME, DOMAIN } = config;

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

function generateConfigFiles() {
  try {
    console.log("📝 Generating config files from templates...");

    // Generate routes for each R2 directory
    const r2Routes = R2_DIRS.map(
      (dir) =>
        `[[routes]]\npattern = "${DOMAIN}/${dir}/*"\nzone_name = "${DOMAIN}"`
    ).join("\n\n");

    // Generate JSON array of paths for the worker
    const r2PathsJson = JSON.stringify(R2_DIRS.map((dir) => `/${dir}/`));

    // Generate worker.js from template
    const workerTemplate = readFileSync(
      join(__dirname, "worker.template.js"),
      "utf8"
    );
    writeFileSync(join(__dirname, "worker.js"), workerTemplate);

    // Generate wrangler.toml from template
    const wranglerTemplate = readFileSync(
      join(__dirname, "wrangler.template.toml"),
      "utf8"
    );
    const wranglerConfig = wranglerTemplate
      .replace(/{{WORKER_NAME}}/g, WORKER_NAME)
      .replace(/{{BUCKET_NAME}}/g, BUCKET_NAME)
      .replace(/{{R2_ROUTES}}/g, r2Routes)
      .replace(/{{R2_PATHS_JSON}}/g, r2PathsJson);
    writeFileSync(join(__dirname, "wrangler.toml"), wranglerConfig);

    console.log("✅ Config files generated");
  } catch (error) {
    console.error("❌ Config generation failed");
    throw error;
  }
}

function deployWorker() {
  try {
    console.log("🚀 Deploying R2 proxy worker...");
    execSync("npx wrangler deploy", { stdio: "inherit", cwd: __dirname });
    console.log("✅ R2 proxy worker deployed successfully");
  } catch (error) {
    console.error("❌ Worker deployment failed");
    throw error;
  }
}

async function syncFiles() {
  try {
    let totalFiles = 0;
    let uploadedFiles = 0;

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

        totalFiles++;
        const unchanged = await isFileUnchanged(filePath, key);
        if (!unchanged) {
          uploadFileToR2(filePath, key, contentType);
          uploadedFiles++;
        }
      }
    }

    console.log(
      `🚀 R2 sync complete! ${uploadedFiles}/${totalFiles} files uploaded`
    );

    generateConfigFiles();
    deployWorker();
  } catch (error) {
    console.error("❌ Sync failed: ", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

syncFiles();

import {
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
  openSync,
  readSync,
  closeSync
} from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import dotenv from "dotenv";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getContentType } from "@alxm/cf-worker";

const __dirname = dirname(fileURLToPath(import.meta.url));

const LFS_POINTER_PREFIX = "version https://git-lfs.github.com/spec/v1";

// True when the file begins with the git-lfs pointer header, i.e. the real
// content was never smudged (e.g. GIT_LFS_SKIP_SMUDGE=1). Uploading such a
// file would push the pointer text to R2 as if it were the asset.
export function isLfsPointer(filePath) {
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
    if (fd !== undefined) {
      closeSync(fd);
    }
  }
}

function computeMD5(filePath) {
  return createHash("md5").update(readFileSync(filePath)).digest("hex");
}

// Walk r2Dirs under baseDir, splitting each file into an upload candidate or a
// (refused) LFS pointer. R2 keys mirror the directory layout: `<dir>/<file>`.
// When checkLfs is false, pointer detection is skipped and every file becomes
// a candidate (preserves the pre-guard behaviour for sites with no LFS assets).
export function collectCandidates({ r2Dirs, baseDir, checkLfs }) {
  const candidates = [];
  const pointerFiles = [];

  for (const dir of r2Dirs) {
    const srcDir = join(baseDir, dir);

    if (!existsSync(srcDir)) {
      console.log(`⚠️ Directory not found, skipping: ${srcDir}`);
      continue;
    }

    const files = readdirSync(srcDir).filter((file) => !file.startsWith("."));
    console.log(`📁 Processing ${dir}: ${files.length} files`);

    for (const file of files) {
      const filePath = join(srcDir, file);
      const key = `${dir}/${file}`;

      if (checkLfs && isLfsPointer(filePath)) {
        pointerFiles.push(key);
        continue;
      }

      candidates.push({ filePath, key, contentType: getContentType(file) });
    }
  }

  return { candidates, pointerFiles };
}

function makeS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    }
  });
}

async function isFileUnchanged(s3Client, bucketName, filePath, key) {
  try {
    const response = await s3Client.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: key })
    );
    // R2 ETag is the MD5 hash in quotes for non-multipart uploads.
    const remoteETag = response.ETag?.replace(/"/g, "");
    return remoteETag === computeMD5(filePath);
  } catch (error) {
    if (error["$metadata"]?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

function uploadFileToR2(bucketName, filePath, key, contentType) {
  try {
    execFileSync(
      "npx",
      [
        "wrangler",
        "r2",
        "object",
        "put",
        `${bucketName}/${key}`,
        "--file",
        filePath,
        "--remote",
        "--content-type",
        contentType
      ],
      // cwd is this package so `npx` resolves the wrangler pinned in our deps.
      { stdio: "inherit", cwd: __dirname }
    );
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}`);
    throw error;
  }
}

// Regenerate <projectRoot>/.assetsignore from the site's .assetsignore.template
// plus the R2-hosted directories, so Workers static-asset upload skips the large
// files that are served from R2 instead.
export function generateAssetsIgnore({ r2Dirs, projectRoot }) {
  const template = readFileSync(
    join(projectRoot, ".assetsignore.template"),
    "utf8"
  );

  const output = `${template.trim()}

# Large files served from R2 (generated from _cloudflare/r2/config.js)
${r2Dirs.join("\n")}
`;

  writeFileSync(join(projectRoot, ".assetsignore"), output);
  console.log("✅ Generated .assetsignore");
}

// Upload the site's R2-hosted assets, skipping objects whose remote MD5 already
// matches. Config is injected per site: bucketName + r2Dirs are the only real
// per-site differences; srcPrefix/envPath locate the source tree and creds.
// envPath also anchors the site root — the .env lives at the site root, so the
// asset base is <dirname(envPath)>/<srcPrefix>.
export async function syncFiles({
  bucketName,
  srcPrefix,
  r2Dirs,
  checkLfs = true,
  envPath
}) {
  dotenv.config({ path: envPath });

  try {
    const baseDir = join(dirname(envPath), srcPrefix);
    const { candidates, pointerFiles } = collectCandidates({
      r2Dirs,
      baseDir,
      checkLfs
    });

    // Detect pointers across all directories before uploading anything — a
    // partial upload followed by an abort would leave R2 in a mixed state.
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

    const s3Client = makeS3Client();
    const totalFiles = candidates.length;
    let uploadedFiles = 0;

    for (const { filePath, key, contentType } of candidates) {
      const unchanged = await isFileUnchanged(
        s3Client,
        bucketName,
        filePath,
        key
      );
      if (!unchanged) {
        uploadFileToR2(bucketName, filePath, key, contentType);
        uploadedFiles++;
      }
    }

    console.log(
      `🚀 R2 sync complete! ${uploadedFiles}/${totalFiles} files uploaded`
    );
  } catch (error) {
    console.error("❌ Sync failed: ", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

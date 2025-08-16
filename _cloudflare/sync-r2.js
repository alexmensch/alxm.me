import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { BUCKET_NAME, AUDIO_DIR, WORKER_NAME, DOMAIN } = config;

async function uploadFileToR2(filePath, key) {
  try {
    execSync(
      `cd _cloudflare && npx wrangler r2 object put ${BUCKET_NAME}/${key} --file "../${filePath}" --remote --content-type "audio/mpeg"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error);
    throw error;
  }
}

async function generateConfigFiles() {
  try {
    console.log("📝 Generating config files from templates...");

    const audioWebPath = `/${AUDIO_DIR.replace("src/", "")}/`;
    const { RSS_PATH, RSS_LAST_MODIFIED } = config;

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
      .replace(/{{AUDIO_PATH}}/g, audioWebPath)
      .replace(/{{RSS_PATH}}/g, RSS_PATH)
      .replace(/{{RSS_LAST_MODIFIED}}/g, RSS_LAST_MODIFIED)
      .replace(/{{DOMAIN}}/g, DOMAIN);
    writeFileSync(join(__dirname, "wrangler.toml"), wranglerConfig);

    console.log("✅ Config files generated");
  } catch (error) {
    console.error("❌ Config generation failed:", error);
    process.exit(1);
  }
}

async function deployWorker() {
  try {
    console.log("🚀 Deploying worker...");
    execSync("cd _cloudflare && npx wrangler deploy", { stdio: "inherit" });
    console.log("✅ Worker deployed successfully");
  } catch (error) {
    console.error("❌ Worker deployment failed:", error);
    process.exit(1);
  }
}

async function syncAudioFiles() {
  try {
    const files = readdirSync(AUDIO_DIR);

    console.log(`🎵 Found ${files.length} files to sync...`);

    for (const file of files) {
      const filePath = join(AUDIO_DIR, file);
      const key = file;

      await uploadFileToR2(filePath, key);
    }

    console.log("🚀 R2 sync complete!");

    await generateConfigFiles();
    await deployWorker();
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
}

syncAudioFiles();

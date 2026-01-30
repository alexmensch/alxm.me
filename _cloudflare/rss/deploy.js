import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { WORKER_NAME, DOMAIN, RSS_PATH, RSS_LAST_MODIFIED } = config;

function generateConfigFiles() {
  try {
    console.log("📝 Generating RSS worker config...");

    // Generate wrangler.toml from template
    const wranglerTemplate = readFileSync(
      join(__dirname, "wrangler.template.toml"),
      "utf8"
    );
    const wranglerConfig = wranglerTemplate
      .replace(/{{WORKER_NAME}}/g, WORKER_NAME)
      .replace(/{{DOMAIN}}/g, DOMAIN)
      .replace(/{{RSS_PATH}}/g, RSS_PATH)
      .replace(/{{RSS_LAST_MODIFIED}}/g, RSS_LAST_MODIFIED);
    writeFileSync(join(__dirname, "wrangler.toml"), wranglerConfig);

    console.log("✅ Config files generated");
  } catch (error) {
    console.error("❌ Config generation failed");
    throw error;
  }
}

function deployWorker() {
  try {
    console.log("🚀 Deploying RSS worker...");
    execSync("npx wrangler deploy", { stdio: "inherit", cwd: __dirname });
    console.log("✅ RSS worker deployed successfully");
  } catch (error) {
    console.error("❌ Worker deployment failed");
    throw error;
  }
}

generateConfigFiles();
deployWorker();

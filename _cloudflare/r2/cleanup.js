import { rmSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { BUILD_PREFIX, R2_DIRS } = config;

function cleanupR2Files() {
  console.log("🧹 Cleaning up R2 files from build...");

  for (const dir of R2_DIRS) {
    const buildPath = join(__dirname, "../..", BUILD_PREFIX, dir);

    if (existsSync(buildPath)) {
      rmSync(buildPath, { recursive: true, force: true });
      console.log(`✅ Removed: ${buildPath}`);
    }
  }

  console.log("🎯 Cleanup complete!");
}

cleanupR2Files();

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "../..");
const templatePath = join(projectRoot, ".assetsignore.template");
const outputPath = join(projectRoot, ".assetsignore");

const template = readFileSync(templatePath, "utf8");

const r2Dirs = config.R2_DIRS.map((dir) => dir).join("\n");

const output = `${template.trim()}

# Large files served from R2 (generated from _cloudflare/r2/config.js)
${r2Dirs}
`;

writeFileSync(outputPath, output);
console.log("✅ Generated .assetsignore");

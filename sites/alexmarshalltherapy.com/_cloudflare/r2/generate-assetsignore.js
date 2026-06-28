import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { generateAssetsIgnore } from "@alxm/cf-r2-sync";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

generateAssetsIgnore({
  r2Dirs: config.R2_DIRS,
  projectRoot: join(__dirname, "../..")
});

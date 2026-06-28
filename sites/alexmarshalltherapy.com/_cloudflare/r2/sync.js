import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { syncFiles } from "@alxm/cf-r2-sync";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

syncFiles({
  bucketName: config.BUCKET_NAME,
  srcPrefix: config.SRC_PREFIX,
  r2Dirs: config.R2_DIRS,
  checkLfs: true,
  envPath: join(__dirname, "../../.env")
});

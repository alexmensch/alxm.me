import fs from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env file
config({ quiet: true });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_PERMALINK_NS_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const KV_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;
const BASELINE_KV_KEY = "permalink-baseline";

async function fetchKVValue(key) {
  if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
    return null; // Fall back to file-based approach
  }

  try {
    const response = await fetch(`${KV_BASE_URL}/values/${key}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`
      }
    });

    if (response.status === 404) {
      return null; // Key doesn't exist
    }

    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch from KV: ${response.status}`);
      return null;
    }

    return response.text();
  } catch (error) {
    console.warn("⚠️ KV fetch error, falling back to file:", error.message);
    return null;
  }
}

async function storeKVValue(key, value) {
  if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
    return false;
  }

  try {
    const response = await fetch(`${KV_BASE_URL}/values/${key}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "text/plain"
      },
      body: value
    });

    return response.ok;
  } catch (error) {
    console.warn("⚠️ KV store error:", error.message);
    return false;
  }
}

async function getBaselinePermalinks() {
  if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
    throw new Error("❌ Cloudflare KV credentials not configured. Cannot proceed without KV.");
  }

  const kvContent = await fetchKVValue(BASELINE_KV_KEY);
  if (kvContent) {
    console.log("📁 Using baseline from Cloudflare KV");
    return new Set(
      kvContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    );
  }

  return new Set();
}

async function main() {
  const currentFile = path.join(process.cwd(), "permalinks.txt");

  try {
    if (!fs.existsSync(currentFile)) {
      throw new Error("No current permalinks file found. Run 11ty build first.");
    }

    if (process.argv.includes("--update-baseline")) {
      const currentContent = fs.readFileSync(currentFile, "utf8");
      const kvStored = await storeKVValue(BASELINE_KV_KEY, currentContent);

      if (kvStored) {
        console.log("\n✅ Updated baseline in Cloudflare KV");
      } else {
        throw new Error("Failed to update KV baseline");
      }
      return;
    }

    const baselinePermalinks = await getBaselinePermalinks();

    // Check if this is the first run (no baseline exists in KV)
    if (baselinePermalinks.size === 0) {
      const currentContent = fs.readFileSync(currentFile, "utf8");

      const kvStored = await storeKVValue(BASELINE_KV_KEY, currentContent);

      if (kvStored) {
        console.log("✅ Created initial permalink baseline in Cloudflare KV");
      } else {
        throw new Error("Failed to store baseline in KV");
      }
      return;
    }
    const currentPermalinks = new Set(
      fs
        .readFileSync(currentFile, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    );

    // Find missing permalinks (existed in baseline but not in current)
    const missingPermalinks = [...baselinePermalinks].filter(
      (permalink) => !currentPermalinks.has(permalink)
    );

    // Find new permalinks (exist in current but not in baseline)
    const newPermalinks = [...currentPermalinks].filter(
      (permalink) => !baselinePermalinks.has(permalink)
    );

    console.log("📊 Permalink Analysis:");
    console.log(`   Baseline: ${baselinePermalinks.size} permalinks`);
    console.log(`   Current:  ${currentPermalinks.size} permalinks`);

    if (missingPermalinks.length > 0) {
      console.log("\n❌ MISSING PERMALINKS (these URLs will break):");
      missingPermalinks.forEach((permalink) => {
        console.log(`   ${permalink}`);
      });
      console.log("\n💡 If permalink changes are intentional:");
      console.log("   1. Add redirects for the missing URLs");
      console.log(
        "   2. Update KV baseline: node check-permalinks.js --update-baseline"
      );

      throw new Error("Must verify permalink changes by updatig baseline.");
    }

    if (newPermalinks.length > 0) {
      console.log("\n🆕 NEW PERMALINKS:");
      newPermalinks.forEach((permalink) => {
        console.log(`   ${permalink}`);
      });
      console.log("\n📝 To accept these new permalinks, update your baseline:");
      console.log("   node check-permalinks.js --update-baseline");
    }

    if (missingPermalinks.length === 0 && newPermalinks.length === 0) {
      console.log(
        "\n✅ All permalinks match baseline - no broken links detected"
      );
    }
  } catch (error) {
    console.error("❌ Permalink check failed: ", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };

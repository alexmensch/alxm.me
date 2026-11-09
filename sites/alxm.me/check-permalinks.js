import fs from "fs";
import path from "path";
import { config } from "dotenv";

config({ quiet: true });

const BASELINE_KV_KEY = "permalink-baseline";

function kvConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const namespaceId = process.env.CLOUDFLARE_KV_PERMALINK_NS_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !namespaceId || !apiToken) {
    throw new Error(
      "❌ Cloudflare KV credentials not configured. Cannot proceed without KV."
    );
  }
  return {
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`,
    apiToken
  };
}

export async function fetchKVValue(key) {
  const { baseUrl, apiToken } = kvConfig();
  const response = await fetch(`${baseUrl}/values/${key}`, {
    headers: { Authorization: `Bearer ${apiToken}` }
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`KV read of "${key}" failed: HTTP ${response.status}`);
  }
  return response.text();
}

export async function storeKVValue(key, value) {
  const { baseUrl, apiToken } = kvConfig();
  const response = await fetch(`${baseUrl}/values/${key}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "text/plain"
    },
    body: value
  });

  if (!response.ok) {
    throw new Error(`KV write of "${key}" failed: HTTP ${response.status}`);
  }
}

export function parsePermalinkList(content) {
  return new Set(
    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );
}

async function getBaselinePermalinks() {
  const kvContent = await fetchKVValue(BASELINE_KV_KEY);
  if (kvContent === null) {
    return null;
  }
  console.log("📁 Using baseline from Cloudflare KV");
  return parsePermalinkList(kvContent);
}

async function main() {
  const currentFile = path.join(process.cwd(), "permalinks.txt");

  try {
    if (!fs.existsSync(currentFile)) {
      throw new Error(
        "No current permalinks file found. Run 11ty build first."
      );
    }

    if (process.argv.includes("--update-baseline")) {
      const currentContent = fs.readFileSync(currentFile, "utf8");
      await storeKVValue(BASELINE_KV_KEY, currentContent);
      console.log("\n✅ Updated baseline in Cloudflare KV");
      return;
    }

    const baselinePermalinks = await getBaselinePermalinks();

    if (baselinePermalinks === null) {
      const currentContent = fs.readFileSync(currentFile, "utf8");
      await storeKVValue(BASELINE_KV_KEY, currentContent);
      console.log("✅ Created initial permalink baseline in Cloudflare KV");
      return;
    }
    const currentPermalinks = parsePermalinkList(
      fs.readFileSync(currentFile, "utf8")
    );

    const { added: newPermalinks, removed: missingPermalinks } = diffPermalinks(
      baselinePermalinks,
      currentPermalinks
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

      throw new Error("Must verify permalink changes by updating baseline.");
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
    console.error("❌ Permalink check failed:\n", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export function diffPermalinks(baselineSet, currentSet) {
  const added = [...currentSet].filter((p) => !baselineSet.has(p));
  const removed = [...baselineSet].filter((p) => !currentSet.has(p));
  return { added, removed };
}

export { main };

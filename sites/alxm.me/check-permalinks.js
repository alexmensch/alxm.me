import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { config } from "dotenv";

config({ quiet: true });

const DEFAULT_TARGET = "production";

export const BASELINE_TARGETS = {
  production: { key: "permalink-baseline" },
  staging: { key: "permalink-baseline-staging", fallback: "production" }
};

export function resolveTarget(deployEnv = DEFAULT_TARGET) {
  if (!Object.hasOwn(BASELINE_TARGETS, deployEnv)) {
    throw new Error(
      `Unknown DEPLOY_ENV "${deployEnv}"; expected one of: ${Object.keys(BASELINE_TARGETS).join(", ")}`
    );
  }
  return { name: deployEnv, ...BASELINE_TARGETS[deployEnv] };
}

function updateCommand(target) {
  const prefix =
    target.name === DEFAULT_TARGET ? "" : `DEPLOY_ENV=${target.name} `;
  return `${prefix}node check-permalinks.js --update-baseline`;
}

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

async function readBaseline(target) {
  const content = await fetchKVValue(target.key);
  if (content !== null) {
    return { key: target.key, permalinks: parsePermalinkList(content) };
  }
  return target.fallback ? readBaseline(resolveTarget(target.fallback)) : null;
}

export async function checkPermalinks({
  deployEnv,
  updateBaseline,
  currentContent
}) {
  const target = resolveTarget(deployEnv);

  if (updateBaseline) {
    await storeKVValue(target.key, currentContent);
    console.log(`\n✅ Updated baseline "${target.key}" in Cloudflare KV`);
    return;
  }

  const baseline = await readBaseline(target);

  if (baseline === null) {
    if (target.fallback) {
      throw new Error(
        `No baseline at "${target.key}" or its fallback. Accept the current permalinks with: ${updateCommand(target)}`
      );
    }
    await storeKVValue(target.key, currentContent);
    console.log(
      `✅ Created initial permalink baseline "${target.key}" in Cloudflare KV`
    );
    return;
  }

  console.log(
    baseline.key === target.key
      ? `📁 Using baseline "${baseline.key}" from Cloudflare KV`
      : `📁 "${target.key}" absent; comparing against fallback "${baseline.key}"`
  );

  const currentPermalinks = parsePermalinkList(currentContent);
  const { added: newPermalinks, removed: missingPermalinks } = diffPermalinks(
    baseline.permalinks,
    currentPermalinks
  );

  console.log("📊 Permalink Analysis:");
  console.log(`   Baseline: ${baseline.permalinks.size} permalinks`);
  console.log(`   Current:  ${currentPermalinks.size} permalinks`);

  if (missingPermalinks.length > 0) {
    console.log("\n❌ MISSING PERMALINKS (these URLs will break):");
    missingPermalinks.forEach((permalink) => {
      console.log(`   ${permalink}`);
    });
    console.log("\n💡 If permalink changes are intentional:");
    console.log("   1. Add redirects for the missing URLs");
    console.log(`   2. Update KV baseline: ${updateCommand(target)}`);

    throw new Error("Must verify permalink changes by updating baseline.");
  }

  if (newPermalinks.length > 0) {
    console.log("\n🆕 NEW PERMALINKS:");
    newPermalinks.forEach((permalink) => {
      console.log(`   ${permalink}`);
    });
    console.log("\n📝 To accept these new permalinks, update your baseline:");
    console.log(`   ${updateCommand(target)}`);
  }

  if (missingPermalinks.length === 0 && newPermalinks.length === 0) {
    console.log(
      "\n✅ All permalinks match baseline - no broken links detected"
    );
  }
}

async function main() {
  const currentFile = path.join(process.cwd(), "permalinks.txt");

  try {
    if (!fs.existsSync(currentFile)) {
      throw new Error(
        "No current permalinks file found. Run 11ty build first."
      );
    }
    await checkPermalinks({
      deployEnv: process.env.DEPLOY_ENV,
      updateBaseline: process.argv.includes("--update-baseline"),
      currentContent: fs.readFileSync(currentFile, "utf8")
    });
  } catch (error) {
    console.error("❌ Permalink check failed:\n", error);
    process.exit(1); // eslint-disable-line no-process-exit
  }
}

if (import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main();
}

export function diffPermalinks(baselineSet, currentSet) {
  const added = [...currentSet].filter((p) => !baselineSet.has(p));
  const removed = [...baselineSet].filter((p) => !currentSet.has(p));
  return { added, removed };
}

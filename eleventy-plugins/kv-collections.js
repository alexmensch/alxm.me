import matter from "gray-matter";
import helpers from "../src/_data/helpers.js";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_STUBS_NS_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const KV_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;

// KV API Helper Functions
async function fetchFromKV(endpoint) {
  const response = await fetch(`${KV_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `❌ Cloudflare KV API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function fetchKVValue(key) {
  const response = await fetch(`${KV_BASE_URL}/values/${key}`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
    },
  });

  if (response.status === 404) {
    return null; // Key doesn't exist
  }

  if (!response.ok) {
    throw new Error(`❌ Failed to fetch KV value for key: ${key}`);
  }

  return response.text();
}

// Main KV Collections Fetcher
async function fetchKVCollections() {
  if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
    throw new Error(
      "❌ Cloudflare credential environment variables not found.",
    );
  }

  try {
    const keysResponse = await fetchFromKV("/keys");
    const keys = keysResponse.result;

    if (!keys || keys.length === 0) {
      console.log("❌ No keys found in KV namespace");
      return {};
    }

    console.log(`✅ Found ${keys.length} keys in KV namespace`);

    const collections = {};

    await Promise.all(
      keys.map(async (keyObj) => {
        try {
          const kvKey = keyObj.name;
          const content = await fetchKVValue(kvKey);

          const parsed = matter(content);

          // Parse collection name and item key from KV key
          const slashIndex = kvKey.indexOf("/");
          let collectionName, itemKey;

          if (slashIndex !== -1) {
            collectionName = kvKey.substring(0, slashIndex);
            itemKey = kvKey.substring(slashIndex + 1);
          } else {
            collectionName = "none";
            itemKey = kvKey;
          }

          // Initialize collection if it doesn't exist
          if (!collections[collectionName]) {
            collections[collectionName] = {};
          }

          // Store the processed content
          collections[collectionName][itemKey] = {
            content: parsed.content,
            ...parsed.data,
            kvKey: kvKey,
          };
        } catch (error) {
          console.error(`❌ Error processing KV key ${keyObj.name}:`, error);
        }
      }),
    );

    const totalItems = Object.values(collections).reduce(
      (sum, collection) => sum + Object.keys(collection).length,
      0,
    );
    console.log(
      `✅ Successfully processed ${totalItems} items across ${Object.keys(collections).length} collection(s)`,
    );

    return collections;
  } catch (error) {
    console.error("❌ Error fetching items from Cloudflare KV:", error);
    return {};
  }
}

export default function kvCollectionsPlugin(eleventyConfig) {
  let kvCollections = {};
  let kvDataFetched = false;

  eleventyConfig.on("eleventy.before", async () => {
    if (!kvDataFetched) {
      console.log("🔄 Fetching KV collections...");
      kvCollections = await fetchKVCollections();
      kvDataFetched = true;

      Object.keys(kvCollections).forEach((collectionName) => {
        const itemCount = Object.keys(kvCollections[collectionName]).length;
        console.log(`📁 Collection "${collectionName}": ${itemCount} items`);
      });

      Object.keys(kvCollections).forEach((collectionName) => {
        eleventyConfig.addCollection(collectionName, (collectionApi) => {
          const collection = kvCollections[collectionName];

          return Object.entries(collection).map(([itemKey, itemData]) => {
            if (!itemData.permalink) {
              if (!itemData.title || !itemData.date) {
                throw new Error(
                  `Unable to generate permalink for item with key: ${itemKey}`,
                );
              }
              itemData.permalink = `/${collectionName}/${helpers.permalinkToPath(itemData.title, itemData.date)}`;
            }

            return {
              ...itemData,
            };
          });
        });
      });
    }
  });
}

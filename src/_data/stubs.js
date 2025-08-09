import matter from 'gray-matter';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const NAMESPACE_ID = process.env.CLOUDFLARE_KV_STUBS_NS_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const KV_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}`;

async function fetchFromKV(endpoint) {
  const response = await fetch(`${KV_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`❌ Cloudflare KV API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchKVValue(key) {
  const response = await fetch(`${KV_BASE_URL}/values/${key}`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    }
  });

  if (!response.ok) {
    throw new Error(`❌ Failed to fetch KV value for key: ${key}`);
  }

  return response.text();
}

export default async function() {
  // Skip KV fetch in development if no credentials
  if (!ACCOUNT_ID || !API_TOKEN || !NAMESPACE_ID) {
    throw new Error('❌ Cloudflare credential environment variables not found.');
  }

  try {
    const keysResponse = await fetchFromKV('/keys');
    const keys = keysResponse.result;

    if (!keys || keys.length === 0) {
      console.log('❌ No keys found in KV namespace');
      return [];
    }

    console.log(`✅ Found ${keys.length} keys in KV namespace`);

    const stubs = await Promise.all(
      keys.map(async (keyObj) => {
        try {
          const key = keyObj.name;
          const content = await fetchKVValue(key);
          
          const parsed = matter(content);
          
          return {
            content: parsed.content,
            ...parsed.data,
            kvKey: key
          };
        } catch (error) {
          console.error(`❌ Error processing KV key ${keyObj.name}:`, error);
          return null;
        }
      })
    );

    const validStubs = stubs.filter(stub => stub !== null);
    
    console.log(`🚀 Successfully processed ${validStubs.length} stubs from KV namespace`);
    return validStubs;

  } catch (error) {
    console.error('❌ Error fetching stubs from Cloudflare KV:', error);
  }
}
// NHL data proxy for Parlay Value (Cloudflare Worker, free plan).
// Why: browsers can block direct calls to api-web.nhle.com (CORS).
// This forwards ONLY read requests for /v1/... paths to the NHL API and adds CORS headers.
//
// Setup:
// 1. Cloudflare dashboard -> Workers & Pages -> Create -> Create Worker -> Deploy.
// 2. Edit code -> replace everything with this file -> Deploy.
// 3. Copy the worker URL (https://<name>.<your-subdomain>.workers.dev)
//    into Parlay Value -> Settings -> Proxy URL.

const UPSTREAM = 'https://api-web.nhle.com/';

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...extra,
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors() });

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, '');
    // Only allow NHL v1 API paths, so this cannot be used as an open proxy.
    if (!/^v1\/[A-Za-z0-9\-\/]+$/.test(path)) {
      return new Response('Bad path', { status: 400, headers: cors() });
    }

    const upstream = await fetch(UPSTREAM + path + url.search, {
      headers: { 'Accept': 'application/json' },
      cf: { cacheTtl: 120, cacheEverything: true },
    });

    const headers = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors())) headers.set(k, v);
    return new Response(upstream.body, { status: upstream.status, headers });
  },
};

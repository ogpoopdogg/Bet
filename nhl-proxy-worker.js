export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors });
    const url = new URL(request.url);
    const path = url.pathname;
    if (!path.startsWith('/v1/')) return new Response('Proxy is working', { status: 200, headers: cors });
    const up = await fetch('https://api-web.nhle.com' + path + url.search);
    const headers = new Headers(up.headers);
    for (const k in cors) headers.set(k, cors[k]);
    return new Response(up.body, { status: up.status, headers });
  }
};

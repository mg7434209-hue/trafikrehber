const http = require('node:http');
const https = require('node:https');
const path = require('node:path');
const handler = require('serve-handler');
const backend = process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
let site = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');
if (/^https:\/\/(www\.)?trafikrehber\.com$/.test(site)) site = 'https://www.cezarehberi.com';
const publicDir = path.join(__dirname, 'build');
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n`);
  }
  if (pathname.startsWith('/api/') || pathname === '/sitemap.xml') {
    if (!backend) {
      if (pathname === '/sitemap.xml') return handler(req, res, { public: publicDir });
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ detail: 'API adresi yapılandırılmamış' }));
    }
    const target = new URL(backend);
    target.pathname = pathname;
    target.search = new URL(req.url, 'http://localhost').search;
    const headers = { accept: pathname === '/sitemap.xml' ? 'application/xml' : 'application/json' };
    for (const key of ['content-type', 'content-length', 'authorization', 'user-agent']) if (req.headers[key]) headers[key] = req.headers[key];
    const proxy = (target.protocol === 'https:' ? https : http).request(target, { method: req.method, headers }, upstream => {
      res.writeHead(upstream.statusCode, { 'Content-Type': upstream.headers['content-type'] || 'application/json', 'Cache-Control': 'no-store' }); upstream.pipe(res);
    });
    proxy.setTimeout(50000, () => proxy.destroy());
    proxy.on('error', () => { if (res.headersSent) return res.end(); res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ detail: 'Servise ulaşılamıyor. Lütfen yeniden deneyin.' })); });
    req.on('aborted', () => proxy.destroy()); req.pipe(proxy); return;
  }
  handler(req, res, { public: publicDir,
    rewrites: pathname.startsWith('/static/') || path.extname(pathname) ? [] : [{ source: '**', destination: '/index.html' }],
    headers: [{ source: '**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }, { source: 'static/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }],
  }).catch(() => { if (!res.headersSent) res.writeHead(500); res.end('Sayfa yüklenemedi'); });
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');

#!/usr/bin/env node
'use strict';
/**
 * SEO + AI görünürlük denetimi — sitemap'teki HER sayfayı bot gözüyle tarar.
 *
 *   node scripts/seo-kontrol.js                       # http://127.0.0.1:3000
 *   BASE=https://www.cezarehberi.com node scripts/seo-kontrol.js
 *   npm run seo:kontrol
 *
 * HATA (✗) çıkış kodu 1 verir; UYARI (!) vermez. Yeni sayfa ya da şablon
 * değişikliğinden sonra çalıştırın (docs/seo-ai.md).
 *
 * Her sayfada: 200 · JS'siz gövde (≥300 karakter) · tek h1 · title/description
 * uzunluğu · canonical (sitemap adresiyle aynı) · robots meta · JSON-LD geçerli ·
 * md alternatifi + /md kopyası. Site genelinde: robots.txt (AI botları, sitemap),
 * llms.txt, llms-full.txt, sıkıştırma, www/slash yönlendirmesi, noindex sayfaların
 * sitemap dışı kalması.
 */
const BASE = (process.env.BASE || 'http://127.0.0.1:' + (process.env.PORT || 3000)).replace(/\/$/, '');
const UA = 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)';

let hata = 0, uyari = 0, gecen = 0;
const ok = () => { gecen++; };
const kotu = (yer, m) => { hata++; console.log(`  ✗ ${yer}: ${m}`); };
const uyar = (yer, m) => { uyari++; console.log(`  ! ${yer}: ${m}`); };

async function getir(yol, secenek = {}) {
  const url = yol.startsWith('http') ? yol : BASE + yol;
  return fetch(url, { redirect: 'manual', headers: { 'user-agent': UA, ...(secenek.headers || {}) }, method: secenek.method || 'GET' });
}
const metin = (html) => html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function sayfaKontrol(url) {
  const yol = new URL(url).pathname;
  const r = await getir(yol);
  if (r.status !== 200) return kotu(yol, `HTTP ${r.status}`);
  const html = await r.text();
  const root = (html.match(/<div id="root">([\s\S]*)<\/div>\s*<\/body>/) || [])[1] || '';
  const govde = metin(root);
  govde.length >= 300 ? ok() : kotu(yol, `JS'siz gövde yalnız ${govde.length} karakter (botlar sayfayı boş görüyor)`);
  const h1 = (root.match(/<h1[ >]/g) || []).length;
  h1 === 1 ? ok() : kotu(yol, `h1 sayısı ${h1} (1 olmalı)`);

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (!title) kotu(yol, 'title yok'); else { ok(); if (title.length > 70) uyar(yol, `title ${title.length} karakter (≈60-70 üstü kırpılır): ${title}`); }
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!desc) kotu(yol, 'description yok');
  else { ok(); if (desc.length < 70 || desc.length > 165) uyar(yol, `description ${desc.length} karakter (70-160 ideal)`); }
  const kan = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  kan === url ? ok() : kotu(yol, `canonical ${kan} ≠ sitemap ${url}`);
  const adet = (html.match(/<link rel="canonical"/g) || []).length;
  adet === 1 ? ok() : kotu(yol, `canonical sayısı ${adet}`);
  /noindex/.test((html.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || '') ? kotu(yol, 'sitemap\'te ama noindex') : ok();

  const ld = [...html.matchAll(/application\/ld\+json">([^<]*)</g)];
  if (!ld.length) kotu(yol, 'JSON-LD yok');
  else {
    try { ld.forEach((m) => JSON.parse(m[1])); ok(); } catch (e) { kotu(yol, 'JSON-LD geçersiz JSON'); }
  }
  const md = (html.match(/<link rel="alternate" type="text\/markdown" href="([^"]*)"/) || [])[1];
  if (!md) kotu(yol, 'markdown alternatifi (link rel=alternate) yok');
  else {
    const m = await getir(new URL(md).pathname);
    const mt = await m.text();
    m.status === 200 && mt.startsWith('---') && /\n# /.test(mt) ? ok() : kotu(yol, `md kopyası bozuk (HTTP ${m.status})`);
    /noindex/.test(m.headers.get('x-robots-tag') || '') ? ok() : uyar(yol, 'md yanıtında X-Robots-Tag: noindex yok');
  }
  // İç bağlantı kırık mı (yalnız aynı site, ilk 40)
  const bag = [...new Set([...root.matchAll(/<a href="(\/[^"#?]*)/g)].map((m) => m[1]))].slice(0, 40);
  for (const b of bag) {
    const x = await getir(b, { method: 'HEAD' });
    if (x.status >= 400) kotu(yol, `kırık iç bağlantı ${b} → ${x.status}`);
  }
  return { yol, govde: govde.length };
}

(async () => {
  console.log(`SEO + AI denetimi — ${BASE}\n`);

  console.log('● Site geneli');
  const rb = await getir('/robots.txt'); const robots = await rb.text();
  rb.status === 200 ? ok() : kotu('robots.txt', `HTTP ${rb.status}`);
  /Sitemap: https?:\/\//.test(robots) ? ok() : kotu('robots.txt', 'Sitemap satırı yok');
  ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot', 'Claude-SearchBot', 'ChatGPT-User'].forEach((b) =>
    robots.includes('User-agent: ' + b) ? ok() : kotu('robots.txt', `${b} için kural yok`));
  /Disallow: \/api\/\s*$/m.test(robots) ? kotu('robots.txt', '/api/ kapalı: Googlebot sayfayı çizerken içeriği alamaz') : ok();
  /Disallow: \/md\//.test(robots) ? ok() : uyar('robots.txt', "/md/ genel kullanıcı için kapalı değil (yinelenen içerik)");

  const ll = await getir('/llms.txt'); const llm = await ll.text();
  ll.status === 200 && llm.startsWith('# ') && llm.includes('/md/') ? ok() : kotu('llms.txt', `eksik/bozuk (HTTP ${ll.status})`);
  const lf = await getir('/llms-full.txt'); const lfm = await lf.text();
  lf.status === 200 && lfm.length > 20000 ? ok() : kotu('llms-full.txt', `eksik/kısa (HTTP ${lf.status}, ${lfm.length} bayt)`);

  const gz = await getir('/', { headers: { 'accept-encoding': 'br, gzip' } });
  ['br', 'gzip'].includes(gz.headers.get('content-encoding')) ? ok() : kotu('sıkıştırma', 'HTML br/gzip ile gelmiyor');
  const sl = await getir('/itiraz/'); sl.status === 301 ? ok() : kotu('slash', `/itiraz/ → ${sl.status} (301 olmalı)`);
  const ac = await getir('/itiraz', { headers: { accept: 'text/markdown' } });
  (ac.headers.get('content-type') || '').includes('markdown') ? ok() : kotu('içerik müzakeresi', 'Accept: text/markdown markdown dönmüyor');
  const nf = await getir('/bu-sayfa-yok-xyz'); nf.status === 404 ? ok() : kotu('404', `bilinmeyen yol → ${nf.status}`);

  console.log('\n● Sayfalar (sitemap.xml)');
  const sm = await (await getir('/sitemap.xml')).text();
  const adresler = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!adresler.length) kotu('sitemap.xml', 'adres yok');
  const kok = adresler.length ? new URL(adresler[0]).origin : '';
  const sonuc = [];
  for (const a of adresler) {
    // sitemap canlı adresi yazar; sayfaKontrol yolu alıp BASE'e sorar, canonical'ı sitemap adresiyle karşılaştırır
    const s = await sayfaKontrol(a);
    if (s) sonuc.push(s);
  }
  ['/itiraz', '/araclar/hiz-cezasi-hesapla', '/trafik-cezalari-2026'].forEach((y) =>
    adresler.some((a) => new URL(a).pathname === y) ? ok() : kotu('sitemap.xml', `${y} sitemap'te yok`));

  console.log(`\n${sonuc.length}/${adresler.length} sayfa tarandı (${kok}) · ✓ ${gecen} geçti · ! ${uyari} uyarı · ✗ ${hata} hata`);
  process.exit(hata ? 1 : 0);
})().catch((e) => { console.error('Denetim çalışmadı:', e.message); process.exit(2); });

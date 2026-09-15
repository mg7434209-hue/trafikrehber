#!/usr/bin/env node
/**
 * Derleme öncesi (npm "prebuild") public/sitemap.xml üretir.
 *
 * NEDEN: Alan adının kökünü frontend servisi yayınlar, bu yüzden
 * www.cezarehberi.com/sitemap.xml STATİK dosyadır — backend'in dinamik
 * sitemap'i o adresten görünmez. Bu betik derleme anında backend'den
 * (REACT_APP_BACKEND_URL/sitemap.xml) tam listeyi çeker ve dosyaya yazar.
 * Backend'e ulaşılamazsa statik rota listesiyle yazar; derlemeyi ASLA
 * düşürmez (çıkış kodu her zaman 0).
 */
const fs = require('fs');
const path = require('path');

const SITE = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');
const API = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

// App.js'teki statik rotalar (yeni sayfa eklerken buraya da ekle)
const ROTALAR = [
  ['/', '1.0', 'daily'],
  ['/trafik-cezalari-2026', '0.9', 'weekly'],
  ['/araclar/ceza-hesapla', '0.9', 'monthly'],
  ['/dilekce-ornekleri', '0.9', 'weekly'],
  ['/blog', '0.8', 'daily'],
  ['/trafik-cezalari', '0.8', 'weekly'],
  ['/sigorta', '0.8', 'weekly'],
  ['/ehliyet', '0.8', 'weekly'],
  ['/arac-islemleri', '0.8', 'weekly'],
  ['/hakkimizda', '0.4', 'yearly'],
  ['/iletisim', '0.4', 'yearly'],
  ['/gizlilik-politikasi', '0.3', 'yearly'],
];

const bugun = new Date().toISOString().slice(0, 10);

function statikXml() {
  const urls = ROTALAR.map(([yol, oncelik, siklik]) =>
    `  <url>\n    <loc>${SITE}${yol}</loc>\n    <lastmod>${bugun}</lastmod>\n` +
    `    <changefreq>${siklik}</changefreq>\n    <priority>${oncelik}</priority>\n  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function yaz(xml, kaynak) {
  fs.writeFileSync(OUT, xml, 'utf8');
  const adet = (xml.match(/<loc>/g) || []).length;
  console.log(`[sitemap] ${adet} URL yazıldı (kaynak: ${kaynak}) → public/sitemap.xml`);
}

async function main() {
  if (!API) {
    yaz(statikXml(), 'statik rota listesi — REACT_APP_BACKEND_URL tanımsız');
    return;
  }
  try {
    const ac = new AbortController();
    const zamanAsimi = setTimeout(() => ac.abort(), 15000);
    const res = await fetch(`${API}/sitemap.xml`, { signal: ac.signal });
    clearTimeout(zamanAsimi);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const xml = await res.text();
    if (!xml.includes('<urlset') || !xml.includes('<loc>')) throw new Error('geçersiz XML');
    // Backend SITE_URL'i yanlışsa bile yayın alan adına çevir
    const duzeltilmis = xml.replace(/<loc>https?:\/\/[^/<]+/g, `<loc>${SITE}`);
    yaz(duzeltilmis, 'backend /sitemap.xml');
  } catch (e) {
    console.warn('[sitemap] backend okunamadı (' + e.message + ') — statik listeye düşülüyor');
    yaz(statikXml(), 'statik rota listesi');
  }
}

main().catch(e => { console.warn('[sitemap] beklenmeyen hata:', e.message); process.exit(0); });

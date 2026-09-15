#!/usr/bin/env node
/**
 * TrafikRehber — yayın sunucusu (bağımlılıksız Node).
 *
 * NEDEN VAR: Site bir React SPA. `serve -s build` HER URL için AYNI index.html'i
 * döndürür; yani Google dışındaki botlar (Facebook, WhatsApp, X, LinkedIn, Bing'in
 * bir kısmı) ve JS çalıştırmayan tüm istemciler her sayfada aynı başlığı ve
 * açıklamayı görür. react-helmet etiketleri yalnız TARAYICIDA oluşur.
 *
 * Bu sunucu index.html'in <head>'ini İSTEK ANINDA doldurur:
 *   • rotaya özel <title>, description, canonical, Open Graph / Twitter
 *   • makale ve dilekçe sayfalarında veriyi API'den çekip başlık/tarih/JSON-LD
 *   • JSON-LD: WebSite + Organization + BreadcrumbList + FAQPage + Article
 *   • bilinmeyen rotalarda noindex (SPA 404'ü dizine girmesin)
 * İstemci tarafı Helmet aynı değerleri yeniden yazar; çakışma olmaz.
 *
 * AYRICA KENDİNİ GÜNCEL TUTAR: /sitemap.xml ve /robots.txt backend'in DİNAMİK
 * çıktısından servis edilir (kısa süreli önbellekle). Yeni makale yayımlandığında
 * site yeniden derlenmeden sitemap tazelenir.
 *
 * Ortam değişkenleri:
 *   PORT                  — Railway verir
 *   REACT_APP_BACKEND_URL — API adresi (BACKEND_URL de kabul edilir)
 *   REACT_APP_SITE_URL    — yayın adresi (varsayılan https://www.cezarehberi.com)
 *   INDEXNOW_KEY          — varsa /<key>.txt doğrulama dosyası servis edilir
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BUILD = path.join(__dirname, 'build');
const API = (process.env.REACT_APP_BACKEND_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
const SITE = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || '').trim();
const OG_IMAGE = SITE + '/og-default.png';
const MARKA = 'TrafikRehber';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- küçük TTL önbellek (API ve sitemap için) ----
const cache = new Map();
function cacheAl(anahtar) {
  const k = cache.get(anahtar);
  if (k && Date.now() < k.sonGecerlilik) return k.deger;
  return undefined;
}
function cacheYaz(anahtar, deger, ttlMs) {
  cache.set(anahtar, { deger, sonGecerlilik: Date.now() + ttlMs });
  return deger;
}

async function apiGet(yol, ttlMs = 600000) {
  if (!API) return null;
  const anahtar = 'api:' + yol;
  const onbellekli = cacheAl(anahtar);
  if (onbellekli !== undefined) return onbellekli;
  try {
    const ac = new AbortController();
    const zamanAsimi = setTimeout(() => ac.abort(), 6000);
    const res = await fetch(API + yol, { signal: ac.signal, headers: { 'User-Agent': 'TrafikRehber-SSR' } });
    clearTimeout(zamanAsimi);
    if (!res.ok) return cacheYaz(anahtar, null, 60000);
    const tip = res.headers.get('content-type') || '';
    const veri = tip.includes('json') ? await res.json() : await res.text();
    return cacheYaz(anahtar, veri, ttlMs);
  } catch (e) {
    return cacheYaz(anahtar, null, 30000); // hata kısa süre önbelleklenir, sürekli denenmesin
  }
}

// ---- Statik rota meta tablosu (App.js ile aynı rotalar) ----
const ROTALAR = {
  '/': {
    baslik: 'TrafikRehber — 2026 Güncel Trafik Cezaları, İtiraz ve Sigorta Rehberi',
    aciklama: '2026 güncel trafik cezaları listesi, erken ödeme indirimi hesaplayıcı, itiraz dilekçesi ve sigorta rehberi. 7574 sayılı Kanun ile güncellendi.',
    ad: 'Ana Sayfa',
  },
  '/trafik-cezalari-2026': {
    baslik: '2026 Trafik Cezaları Güncel Liste | Tüm Tutarlar — TrafikRehber',
    aciklama: '2026 trafik cezası tutarlarının tam listesi: kırmızı ışık, hız, alkol, cep telefonu. Kademeli cezalar ve %25 erken ödeme indirimi.',
    ad: '2026 Ceza Listesi',
  },
  '/araclar/ceza-hesapla': {
    baslik: 'Trafik Cezası Hesaplama Aracı 2026 — TrafikRehber',
    aciklama: 'Ceza türünü seçin; 1 ay içinde ödemede %25 indirimli tutarı ve taksit seçeneklerini anında görün.',
    ad: 'Ceza Hesapla',
  },
  '/dilekce-ornekleri': {
    baslik: 'Trafik Cezası İtiraz Dilekçe Örnekleri (2026) — TrafikRehber',
    aciklama: 'Trafik cezasına itiraz, sigorta hasar ihbarı ve ehliyet iptali için hazır dilekçe şablonları. Doldurun, indirin. İtiraz süresi 15 gündür.',
    ad: 'Dilekçe Örnekleri',
  },
  '/blog': {
    baslik: 'Trafik, Sigorta ve Ehliyet Rehberleri — TrafikRehber Blog',
    aciklama: 'Trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel rehber yazıları.',
    ad: 'Blog',
  },
  '/trafik-cezalari': {
    baslik: 'Trafik Cezaları — Tutarlar, İtiraz ve Sorgulama | TrafikRehber',
    aciklama: 'Trafik cezası tutarları, e-Devlet sorgulama, itiraz yolları ve erken ödeme indirimi hakkında güncel rehberler.',
    ad: 'Trafik Cezaları',
  },
  '/sigorta': {
    baslik: 'Trafik Sigortası ve Kasko Rehberi 2026 — TrafikRehber',
    aciklama: 'Zorunlu trafik sigortası (ZMSS), kasko, hasar ihbarı ve tazminat süreçleri hakkında güncel bilgiler.',
    ad: 'Sigorta',
  },
  '/ehliyet': {
    baslik: 'Ehliyet İşlemleri: Puan Sorgulama, Sınav ve Yenileme — TrafikRehber',
    aciklama: 'Ehliyet puan sistemi, sınav başvurusu, yenileme ve iptal kararına itiraz hakkında rehberler.',
    ad: 'Ehliyet',
  },
  '/arac-islemleri': {
    baslik: 'Araç İşlemleri: Muayene, Tescil ve Devir — TrafikRehber',
    aciklama: 'TÜVTÜRK muayene randevusu, araç tescili, noter devri ve plaka işlemleri hakkında güncel rehberler.',
    ad: 'Araç İşlemleri',
  },
  '/hakkimizda': { baslik: 'Hakkımızda — TrafikRehber', aciklama: 'TrafikRehber; trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel ve güvenilir Türkçe rehber sunar.', ad: 'Hakkımızda' },
  '/iletisim': { baslik: 'İletişim — TrafikRehber', aciklama: 'Görüş, öneri ve sorularınız için TrafikRehber iletişim sayfası.', ad: 'İletişim' },
  '/gizlilik-politikasi': { baslik: 'Gizlilik Politikası — TrafikRehber', aciklama: 'KVKK kapsamında kişisel verilerin işlenmesi, çerezler ve ziyaretçi sayacı hakkında bilgilendirme.', ad: 'Gizlilik Politikası' },
};

const KATEGORI_KOKU = ['/trafik-cezalari', '/sigorta', '/ehliyet', '/arac-islemleri'];

function sssYukle() {
  const onbellekli = cacheAl('sss');
  if (onbellekli !== undefined) return onbellekli;
  try {
    const ham = fs.readFileSync(path.join(__dirname, 'src', 'data', 'sss.json'), 'utf8');
    return cacheYaz('sss', JSON.parse(ham), 3600000);
  } catch (e) {
    return cacheYaz('sss', [], 3600000);
  }
}

function organizationLd() {
  return {
    '@type': 'Organization', '@id': SITE + '/#kurulus', name: MARKA, url: SITE + '/',
    logo: { '@type': 'ImageObject', url: OG_IMAGE },
  };
}

function breadcrumbLd(parcalar) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: parcalar.map((p, i) => ({
      '@type': 'ListItem', position: i + 1, name: p.ad, item: SITE + p.yol,
    })),
  };
}

/** Rota → { baslik, aciklama, tip, ld[], noindex } */
async function metaCoz(yol) {
  // Makale detayı
  let m = yol.match(/^\/blog\/([^/]+)$/);
  if (m) {
    const veri = await apiGet('/api/articles/' + encodeURIComponent(m[1]), 600000);
    const a = veri && veri.article;
    if (!a) return { baslik: 'Makale bulunamadı — ' + MARKA, aciklama: '', noindex: true, bulunamadi: true, ld: [] };
    const ld = {
      '@type': a.schema_type === 'HowTo' ? 'HowTo' : 'Article',
      headline: a.title,
      description: a.meta_description || '',
      mainEntityOfPage: { '@type': 'WebPage', '@id': SITE + yol },
      image: OG_IMAGE,
      author: { '@type': 'Organization', name: a.author || MARKA },
      publisher: organizationLd(),
      inLanguage: 'tr-TR',
    };
    if (a.created_at) ld.datePublished = a.created_at;
    ld.dateModified = a.updated_at || a.created_at || undefined;
    return {
      baslik: a.title + ' — ' + MARKA,
      aciklama: a.meta_description || '',
      tip: 'article',
      ld: [ld, breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: 'Blog', yol: '/blog' }, { ad: a.title, yol }])],
    };
  }

  // Dilekçe detayı
  m = yol.match(/^\/dilekce-ornekleri\/([^/]+)$/);
  if (m) {
    const veri = await apiGet('/api/dilekce/' + encodeURIComponent(m[1]), 600000);
    const s = veri && veri.sablon;
    if (!s) return { baslik: 'Dilekçe bulunamadı — ' + MARKA, aciklama: '', noindex: true, bulunamadi: true, ld: [] };
    const baslik = s.baslik + ' (2026 Örneği) — ' + MARKA;
    const aciklama = (s.aciklama || '') + (s.ilgili_kanun ? ' İlgili mevzuat: ' + s.ilgili_kanun + '.' : '') +
      ' Ücretsiz şablonu doldurup indirin.';
    return {
      baslik, aciklama: aciklama.trim(),
      ld: [
        { '@type': 'WebPage', name: s.baslik, description: s.aciklama || '', inLanguage: 'tr-TR', publisher: organizationLd() },
        breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: 'Dilekçe Örnekleri', yol: '/dilekce-ornekleri' }, { ad: s.baslik, yol }]),
      ],
    };
  }

  // Bilinen statik rota
  const r = ROTALAR[yol];
  if (r) {
    const ld = [];
    if (yol === '/') {
      ld.push({
        '@type': 'WebSite', '@id': SITE + '/#site', name: MARKA, url: SITE + '/',
        inLanguage: 'tr-TR', publisher: organizationLd(),
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: SITE + '/blog?q={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      });
      const sss = sssYukle();
      if (sss.length) {
        ld.push({
          '@type': 'FAQPage',
          mainEntity: sss.map((x) => ({
            '@type': 'Question', name: x.s,
            acceptedAnswer: { '@type': 'Answer', text: x.c },
          })),
        });
      }
    } else {
      ld.push(breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: r.ad, yol }]));
    }
    return { baslik: r.baslik, aciklama: r.aciklama, ld };
  }

  // Kategori alt sayfası (/sigorta/kasko gibi)
  const kok = KATEGORI_KOKU.find((k) => yol.startsWith(k + '/'));
  if (kok) {
    const ust = ROTALAR[kok];
    const altAd = decodeURIComponent(yol.slice(kok.length + 1)).replace(/-/g, ' ');
    const baslik = altAd.charAt(0).toLocaleUpperCase('tr') + altAd.slice(1);
    return {
      baslik: baslik + ' — ' + ust.ad + ' | ' + MARKA,
      aciklama: ust.aciklama,
      ld: [breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: ust.ad, yol: kok }, { ad: baslik, yol }])],
    };
  }

  // Bilinmeyen rota → SPA 404; dizine girmesin
  return {
    baslik: 'Sayfa Bulunamadı — ' + MARKA,
    aciklama: 'Aradığınız sayfa bulunamadı.',
    noindex: true, bulunamadi: true, ld: [],
  };
}

function headEnjekte(html, yol, meta) {
  const kanonik = SITE + (yol === '/' ? '/' : yol);
  const etiketler = [
    `<link rel="canonical" href="${esc(kanonik)}" />`,
    `<meta property="og:title" content="${esc(meta.baslik)}" />`,
    `<meta property="og:description" content="${esc(meta.aciklama)}" />`,
    `<meta property="og:url" content="${esc(kanonik)}" />`,
    `<meta property="og:type" content="${esc(meta.tip || 'website')}" />`,
    `<meta property="og:site_name" content="${MARKA}" />`,
    `<meta property="og:locale" content="tr_TR" />`,
    `<meta property="og:image" content="${esc(OG_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.baslik)}" />`,
    `<meta name="twitter:description" content="${esc(meta.aciklama)}" />`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE)}" />`,
  ];
  if (meta.noindex) etiketler.push('<meta name="robots" content="noindex, follow" />');
  else etiketler.push('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />');

  if (meta.ld && meta.ld.length) {
    const graf = { '@context': 'https://schema.org', '@graph': meta.ld };
    etiketler.push('<script type="application/ld+json">' +
      JSON.stringify(graf).replace(/</g, '\\u003c') + '</script>');
  }

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(meta.baslik) + '</title>')
    .replace(/<meta\s+name="description"[^>]*>/i, '<meta name="description" content="' + esc(meta.aciklama) + '" />')
    .replace('</head>', etiketler.join('\n    ') + '\n  </head>');
}

// ---- sitemap / robots: backend'in dinamik çıktısı (yoksa derleme kopyası) ----
async function metinVarlik(yol, ttlMs) {
  const uzak = await apiGet(yol, ttlMs);
  if (typeof uzak === 'string' && uzak.trim()) {
    // Backend'in SITE_URL'i yanlış ayarlanmışsa bile yayın adresine çevir
    return uzak.replace(/<loc>https?:\/\/[^/<]+/g, '<loc>' + SITE);
  }
  try { return fs.readFileSync(path.join(BUILD, yol.replace(/^\//, '')), 'utf8'); } catch (e) { return null; }
}

function guvenliYol(kok, istenen) {
  const tam = path.normalize(path.join(kok, istenen));
  return tam.startsWith(kok) ? tam : null;
}

const indexHtml = () => fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');

const sunucu = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let yol = decodeURIComponent(url.pathname);

    // IndexNow doğrulama dosyası (arama motorları anahtarı bu adresten okur)
    if (INDEXNOW_KEY && yol === '/' + INDEXNOW_KEY + '.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
      return res.end(INDEXNOW_KEY);
    }

    if (yol === '/sitemap.xml' || yol === '/robots.txt') {
      const govde = await metinVarlik(yol, yol === '/sitemap.xml' ? 900000 : 3600000);
      if (govde) {
        res.writeHead(200, {
          'Content-Type': yol.endsWith('.xml') ? MIME['.xml'] : MIME['.txt'],
          'Cache-Control': 'public, max-age=900',
        });
        return res.end(govde);
      }
    }

    // Statik dosya
    if (yol !== '/' && !yol.endsWith('/')) {
      const dosya = guvenliYol(BUILD, yol);
      if (dosya && fs.existsSync(dosya) && fs.statSync(dosya).isFile()) {
        const uzanti = path.extname(dosya).toLowerCase();
        const hashli = /\.[0-9a-f]{8,}\.(js|css|woff2?|png|jpg|jpeg|webp|svg)$/i.test(dosya);
        res.writeHead(200, {
          'Content-Type': MIME[uzanti] || 'application/octet-stream',
          'Cache-Control': hashli ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        });
        return fs.createReadStream(dosya).pipe(res);
      }
    }

    // SPA — head'i rotaya göre doldurulmuş index.html
    if (yol.length > 1 && yol.endsWith('/')) yol = yol.slice(0, -1);
    const meta = await metaCoz(yol);

    // Site içi arama sonuçları dizine girmemeli (ince/yinelenen içerik).
    // canonical zaten sorgu dizesi olmadan basılır → /blog'a işaret eder.
    if (url.searchParams.get('q')) {
      meta.noindex = true;
      meta.baslik = `"${url.searchParams.get('q')}" için arama sonuçları — ${MARKA}`;
    }
    const html = headEnjekte(indexHtml(), yol, meta);
    const bilinmeyen = meta.bulunamadi === true;
    res.writeHead(bilinmeyen ? 404 : 200, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });
    return res.end(html);
  } catch (e) {
    console.error('[sunucu]', e && e.message);
    res.writeHead(500, { 'Content-Type': MIME['.html'] });
    return res.end('<h1>Sunucu hatası</h1>');
  }
});

sunucu.listen(PORT, () => {
  console.log(`TrafikRehber ${PORT} portunda · API: ${API || '(tanımsız)'} · site: ${SITE}`);
});

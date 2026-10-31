#!/usr/bin/env node
/**
 * CezaRehberi — yayın sunucusu (bağımlılıksız Node).
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
const zlib = require('zlib');
const prerender = require('./prerender');

const PORT = process.env.PORT || 3000;
const BUILD = path.join(__dirname, 'build');
const API = (process.env.BACKEND_URL || process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const SITE = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || '').trim();
const OG_IMAGE = SITE + '/og-default.png';
const SITE_HOST = (() => { try { return new URL(SITE).host; } catch (e) { return ''; } })();
const MARKA = 'CezaRehberi';

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
  // Tarayıcıların rastgele adresleri (/blog/xyz…) önbelleği şişirmesin
  if (cache.size >= 3000) {
    const simdi = Date.now();
    for (const [k, v] of cache) if (v.sonGecerlilik < simdi) cache.delete(k);
    if (cache.size >= 3000) cache.clear();
  }
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

// ---- Veri yılı: başlıklardaki "2026" TEK KAYNAKTAN gelir ----
// Backend /api/ceza-turleri/guncellik → veri_yili (ceza listesinin DOĞRULANDIĞI
// yıl; takvim yılı değil). Ceza listesi yeni yıl için güncellenince bütün
// başlıklar kendiliğinden yeni yıla geçer. Metinlerde yıl {YIL} diye yazılır.
// API'ye ulaşılamazsa son bilinen değer (ilk açılışta VARSAYILAN_YIL) kullanılır.
const VARSAYILAN_YIL = 2026;
let veriYili = VARSAYILAN_YIL;
async function yilYenile() {
  const v = await apiGet('/api/ceza-turleri/guncellik', 3600000);
  if (v && Number(v.veri_yili) > 2000) veriYili = Number(v.veri_yili);
  return veriYili;
}
const Y = (s) => String(s == null ? '' : s).replace(/\{YIL\}/g, veriYili);

// Taşınan yazılar → yeni adres (backend routers/articles.py ESKI_SLUG ile aynı)
const ESKI_BLOG = {
  'trafik-cezasi-tutarlari-2025': 'trafik-cezasi-tutarlari',
  'trafik-cezasi-sorgulama-e-devlet': 'trafik-cezasi-e-devlet-sorgulama',
};

// ---- Statik rota meta tablosu (App.js ile aynı rotalar) ----
const ROTALAR = {
  '/': {
    baslik: 'Trafik Cezası Ne Kadar? {YIL} Güncel Tutarlar ve İtiraz | CezaRehberi',
    aciklama: '{YIL} güncel trafik cezası tutarları: kırmızı ışık, hız, telefon, alkol, park. %25 indirim hesaplama, ücretsiz itiraz dilekçesi ve e-Devlet sorgulama rehberi.',
    ad: 'Ana Sayfa',
  },
  '/trafik-cezalari-2026': {
    baslik: '{YIL} Trafik Cezaları Güncel Liste | Tüm Tutarlar — CezaRehberi',
    aciklama: '{YIL} trafik cezası tutarlarının tam listesi: kırmızı ışık, hız, alkol, cep telefonu. Kademeli cezalar ve %25 erken ödeme indirimi.',
    ad: '{YIL} Ceza Listesi',
  },
  '/araclar/ceza-hesapla': {
    baslik: 'Trafik Cezası Hesaplama Aracı {YIL} — CezaRehberi',
    aciklama: 'Ceza türünü seçin; 1 ay içinde ödemede %25 indirimli tutarı ve taksit seçeneklerini anında görün.',
    ad: 'Ceza Hesapla',
  },
  '/dilekce-ornekleri': {
    baslik: 'Trafik Cezası İtiraz Dilekçe Örnekleri ({YIL}) — CezaRehberi',
    aciklama: 'Trafik cezasına itiraz, sigorta hasar ihbarı ve ehliyet iptali için hazır dilekçe şablonları. Doldurun, indirin; süre ve usulü güncel mevzuattan doğrulayın.',
    ad: 'Dilekçe Örnekleri',
  },
  '/itiraz': {
    baslik: 'Haksız Ceza İtirazı {YIL}: Yol Haritası ve Dilekçe | CezaRehberi',
    aciklama: 'Haksız trafik cezasına nasıl itiraz edilir? 15 günlük süreyi hesaplayın, gerekçenizi seçin, dilekçenizi ücretsiz oluşturun. Sulh Ceza Hâkimliği ve UYAP adımları.',
    ad: 'İtiraz Yol Haritası',
    sss: 'itiraz.json',
  },
  '/araclar/hiz-cezasi-hesapla': {
    baslik: 'Hız Cezası Hesaplama {YIL}: Kaç km Aşarsam Ne Kadar Ceza? | CezaRehberi',
    aciklama: 'Hız sınırını ve hızınızı girin; aşım kademesini, ceza tutarını, %25 indirimli tutarı ve ehliyete el koyma süresini görün. Şehir içi ve şehirlerarası tablo.',
    ad: 'Hız Cezası Hesaplama',
    sss: 'hiz.json',
  },
  '/blog': {
    baslik: 'Trafik, Sigorta ve Ehliyet Rehberleri — CezaRehberi Blog',
    aciklama: 'Trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel rehber yazıları.',
    ad: 'Blog',
  },
  '/ceza': {
    baslik: '{YIL} Trafik Cezaları — Tutar, Puan ve İtiraz | CezaRehberi',
    aciklama: 'Her trafik cezasının güncel tutarı, erken ödeme indirimi, ceza puanı ve itiraz yolu.',
    ad: 'Cezalar',
  },
  '/trafik-cezalari': {
    baslik: 'Trafik Cezaları — Tutarlar, İtiraz ve Sorgulama | CezaRehberi',
    aciklama: 'Trafik cezası tutarları, e-Devlet sorgulama, itiraz yolları ve erken ödeme indirimi hakkında güncel rehberler.',
    ad: 'Trafik Cezaları',
  },
  '/sigorta': {
    baslik: 'Trafik Sigortası ve Kasko Rehberi {YIL} — CezaRehberi',
    aciklama: 'Zorunlu trafik sigortası (ZMSS), kasko, hasar ihbarı ve tazminat süreçleri hakkında güncel bilgiler.',
    ad: 'Sigorta',
  },
  '/ehliyet': {
    baslik: 'Ehliyet İşlemleri: Puan Sorgulama, Sınav ve Yenileme — CezaRehberi',
    aciklama: 'Ehliyet puan sistemi, sınav başvurusu, yenileme ve iptal kararına itiraz hakkında rehberler.',
    ad: 'Ehliyet',
  },
  '/arac-islemleri': {
    baslik: 'Araç İşlemleri: Muayene, Tescil ve Devir — CezaRehberi',
    aciklama: 'TÜVTÜRK muayene randevusu, araç tescili, noter devri ve plaka işlemleri hakkında güncel rehberler.',
    ad: 'Araç İşlemleri',
  },
  '/hakkimizda': { baslik: 'Hakkımızda — CezaRehberi', aciklama: 'CezaRehberi; trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel ve güvenilir Türkçe rehber sunar.', ad: 'Hakkımızda' },
  '/iletisim': { baslik: 'İletişim — CezaRehberi', aciklama: 'CezaRehberi iletişim sayfası: görüş, öneri, düzeltme ve sorularınızı iletin; içerikleri resmî kaynaklarla birlikte güncelliyoruz.', ad: 'İletişim' },
  '/gizlilik-politikasi': { baslik: 'Gizlilik Politikası — CezaRehberi', aciklama: 'KVKK kapsamında kişisel verilerin işlenmesi, çerezler ve ziyaretçi sayacı hakkında bilgilendirme.', ad: 'Gizlilik Politikası' },
};

const KATEGORI_KOKU = ['/trafik-cezalari', '/sigorta', '/ehliyet', '/arac-islemleri'];

// Sayfaya özel SSS (ROTALAR[yol].sss = src/data/<dosya>.json → { sss: [{s, c}] })
function sayfaSssYukle(dosya) {
  const anahtar = 'sss:' + dosya;
  const onbellekli = cacheAl(anahtar);
  if (onbellekli !== undefined) return onbellekli;
  try {
    const ham = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', dosya), 'utf8'));
    return cacheYaz(anahtar, Array.isArray(ham.sss) ? ham.sss : [], 3600000);
  } catch (e) {
    return cacheYaz(anahtar, [], 3600000);
  }
}

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

function howToItirazLd() {
  const adimlar = [
    ['Tebliğ tarihini ve süreyi belirleyin', 'Süre, cezanın tebliğ edildiği günden başlar. İtiraz süresi tebliğden itibaren 15 gündür; %25 indirimli ödeme süresi 1 aydır.', '#sure'],
    ['İtiraz gerekçenizi seçin', 'Tutanakta hata, aracın başka yerde olması, trafik işaretinin yokluğu, zorunluluk hâli, ölçüm itirazı veya usulsüz tebligat gibi somut ve kanıtlanabilir bir gerekçe belirleyin.', '#gerekce'],
    ['Ödeme kararınızı verin', 'Peşin ödeme itiraz hakkını ortadan kaldırmaz; indirimi kaçırmamak için cezayı 1 ay içinde ödeyip itirazı ayrıca yapabilirsiniz.', '#odeme'],
    ['İtiraz dilekçesini hazırlayın', 'Dilekçeyi cezanın yazıldığı yerdeki Sulh Ceza Hâkimliği\'ne hitaben yazın; ad, T.C. kimlik no, tutanak bilgileri, tebliğ tarihi, gerekçe, ekler ve talebi ekleyin.', '#dilekce'],
    ['Dilekçeyi Sulh Ceza Hâkimliği\'ne verin', 'Adliyenin ön bürosuna elden verin ya da e-imza veya mobil imza ile UYAP Vatandaş Portalı üzerinden gönderin. Başvuru harca tabi değildir.', '#basvuru'],
    ['Kararı bekleyin ve gerekirse karara itiraz edin', 'Hâkimlik genellikle dosya üzerinden karar verir. Ret hâlinde kararın tebliğinden itibaren 7 gün içinde karara itiraz edilebilir.', '#sonra'],
  ];
  return {
    '@type': 'HowTo', '@id': SITE + '/itiraz#nasil',
    name: 'Haksız trafik cezasına nasıl itiraz edilir?',
    description: 'Trafik idari para cezasına itirazın adımları: süre, gerekçe, dilekçe, başvuru yeri ve sonrası.',
    inLanguage: 'tr-TR',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'TRY', value: '0' },
    step: adimlar.map(([ad, metin, bag], i) => ({
      '@type': 'HowToStep', position: i + 1, name: ad, text: metin, url: SITE + '/itiraz' + bag,
    })),
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
  await yilYenile();
  // Makale detayı
  let m = yol.match(/^\/blog\/([^/]+)$/);
  if (m) {
    const veri = await apiGet('/api/articles/' + encodeURIComponent(m[1]) + '?say=0', 600000);
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
      tip: 'article', yayin: a.created_at, guncelleme: a.updated_at || a.created_at,
      ld: [ld, breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: 'Blog', yol: '/blog' }, { ad: a.title, yol }])],
    };
  }

  // Ceza sayfası — her ceza ayrı arama sorgusu
  m = yol.match(/^\/ceza\/([^/]+)$/);
  if (m) {
    const veri = await apiGet('/api/ceza-turleri/sayfa/' + encodeURIComponent(m[1]), 600000);
    const c = veri && veri.ceza, sf = veri && veri.sayfa;
    if (!c || !sf) return { baslik: 'Ceza bulunamadı — ' + MARKA, aciklama: '', noindex: true, bulunamadi: true, ld: [] };
    const tl = (v) => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
    const aciklama = `${c.aciklama} cezası ${tl(c.taban_ceza_tl)}. ${veri.odeme_suresi_gun} gün içinde ödemede ` +
      `${tl(c.indirimli_tl)}. Ceza puanı, itiraz süresi ve hazır dilekçe örneği.`;
    const ld = [
      breadcrumbLd([
        { ad: 'Ana Sayfa', yol: '/' },
        { ad: Y('{YIL} Ceza Listesi'), yol: '/trafik-cezalari-2026' },
        { ad: c.aciklama, yol },
      ]),
    ];
    if (sf.sss && sf.sss.length) {
      ld.push({
        '@type': 'FAQPage',
        mainEntity: sf.sss.map((q) => ({
          '@type': 'Question', name: q.soru,
          acceptedAnswer: { '@type': 'Answer', text: q.cevap },
        })),
      });
    }
    ld.push({
      '@type': 'Article', '@id': SITE + yol + '#makale', headline: sf.baslik, description: aciklama,
      inLanguage: 'tr-TR', mainEntityOfPage: { '@type': 'WebPage', '@id': SITE + yol }, image: OG_IMAGE,
      author: organizationLd(), publisher: organizationLd(),
      dateModified: veri.son_dogrulama || undefined, datePublished: veri.son_dogrulama || undefined,
    });
    return { baslik: sf.baslik + ' | ' + MARKA, aciklama, ld, tip: 'article', guncelleme: veri.son_dogrulama };
  }

  // Dilekçe detayı
  m = yol.match(/^\/dilekce-ornekleri\/([^/]+)$/);
  if (m) {
    const veri = await apiGet('/api/dilekce/' + encodeURIComponent(m[1]), 600000);
    const s = veri && veri.sablon;
    if (!s) return { baslik: 'Dilekçe bulunamadı — ' + MARKA, aciklama: '', noindex: true, bulunamadi: true, ld: [] };
    const baslik = s.baslik + Y(/örne/i.test(s.baslik) ? ' ({YIL}) — ' : ' ({YIL} Örneği) — ') + MARKA;
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
      ld.push(breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: Y(r.ad), yol }]));
      const sss = r.sss ? sayfaSssYukle(r.sss) : [];
      if (sss.length) {
        ld.push({
          '@type': 'FAQPage',
          mainEntity: sss.map((x) => ({
            '@type': 'Question', name: x.s,
            acceptedAnswer: { '@type': 'Answer', text: x.c },
          })),
        });
      }
    }
    if (yol === '/itiraz') ld.push(howToItirazLd());
    if (yol === '/araclar/hiz-cezasi-hesapla' || yol === '/araclar/ceza-hesapla') {
      ld.push({
        '@type': 'WebApplication', '@id': SITE + yol + '#arac', name: Y(r.ad), url: SITE + yol,
        applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', inLanguage: 'tr-TR',
        browserRequirements: 'JavaScript gerekir', isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' }, publisher: organizationLd(),
      });
    }
    if (yol === '/trafik-cezalari-2026') {
      const liste = await apiGet('/api/ceza-turleri/sayfalar', 600000);
      const sayfalar = (liste && liste.sayfalar) || [];
      if (sayfalar.length) {
        ld.push({
          '@type': 'ItemList', '@id': SITE + yol + '#liste', name: Y('{YIL} trafik cezaları'),
          numberOfItems: sayfalar.length,
          itemListElement: sayfalar.map((x, i) => ({
            '@type': 'ListItem', position: i + 1, name: x.aciklama, url: SITE + '/ceza/' + x.slug,
          })),
        });
      }
    }
    return { baslik: Y(r.baslik), aciklama: Y(r.aciklama), ld };
  }

  // Kategori alt sayfası (/sigorta/kasko gibi)
  const kok = KATEGORI_KOKU.find((k) => yol.startsWith(k + '/'));
  if (kok) {
    const ust = ROTALAR[kok];
    const altAd = decodeURIComponent(yol.slice(kok.length + 1)).replace(/-/g, ' ');
    const baslik = altAd.charAt(0).toLocaleUpperCase('tr') + altAd.slice(1);
    return {
      baslik: baslik + ' — ' + Y(ust.ad) + ' | ' + MARKA,
      aciklama: Y(ust.aciklama),
      ld: [breadcrumbLd([{ ad: 'Ana Sayfa', yol: '/' }, { ad: Y(ust.ad), yol: kok }, { ad: baslik, yol }])],
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
  if (meta.tip === 'article') {
    if (meta.yayin) etiketler.push(`<meta property="article:published_time" content="${esc(meta.yayin)}" />`);
    if (meta.guncelleme) etiketler.push(`<meta property="article:modified_time" content="${esc(meta.guncelleme)}" />`);
  }
  if (!meta.noindex && !meta.bulunamadi) {
    etiketler.push(`<link rel="alternate" type="text/markdown" href="${esc(SITE + mdYolu(yol))}" />`);
  }
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
    .replace('</head>', etiketler.join('\n    ') +
      // İstemci (src/yil.js) aynı yılı kullansın: Helmet başlıkları sunucununkiyle eşleşir
      `\n    <script>window.__VERI_YILI__=${Number(veriYili)}</script>` + '\n  </head>');
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


// ---- Sıkıştırma (br/gzip): eskiden HİÇ yoktu; JS+CSS+HTML 3-4 kat küçülür ----
const SIKISTIRILIR = new Set(['.js', '.css', '.json', '.svg', '.txt', '.xml', '.html', '.webmanifest', '.map']);
const sikCache = new Map(); // "dosya:mtime:kod" → Buffer (statik varlıklar bir kez sıkıştırılır)
function kodlama(req) {
  const ae = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(ae)) return 'br';
  if (/\bgzip\b/.test(ae)) return 'gzip';
  return null;
}
function sikistir(buf, kod, dinamik) {
  if (kod === 'br') {
    return zlib.brotliCompressSync(buf, { params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: dinamik ? 4 : 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
    } });
  }
  return zlib.gzipSync(buf, { level: dinamik ? 6 : 9 });
}
/** Metin gövdeli yanıt: uygunsa sıkıştırır, Vary/Content-Length yazar. */
function yanit(req, res, durum, basliklar, govde, onbellekAnahtari) {
  let buf = Buffer.isBuffer(govde) ? govde : Buffer.from(String(govde), 'utf8');
  const h = { ...basliklar };
  const vary = new Set(String(h.Vary || '').split(',').map((x) => x.trim()).filter(Boolean));
  vary.add('Accept-Encoding');
  h.Vary = [...vary].join(', ');
  const kod = kodlama(req);
  if (kod && buf.length > 1024) {
    if (onbellekAnahtari) {
      const ak = onbellekAnahtari + ':' + kod;
      if (!sikCache.has(ak)) sikCache.set(ak, sikistir(buf, kod, false));
      buf = sikCache.get(ak);
    } else {
      buf = sikistir(buf, kod, true);
    }
    h['Content-Encoding'] = kod;
  }
  h['Content-Length'] = buf.length;
  res.writeHead(durum, h);
  return res.end(req.method === 'HEAD' ? undefined : buf);
}

// ---- Sayfa gövdesi + Markdown (prerender.js) ----
const bCtx = () => ({ apiGet, Y, site: SITE });
/** { meta, b } — b null olabilir (gövde üretilmeyen rota). Bulunamayan rota → null. */
async function belgeAl(yol) {
  const anahtar = 'belge:' + yol;
  const onb = cacheAl(anahtar);
  if (onb !== undefined) return onb;
  await yilYenile();
  const meta = await metaCoz(yol);
  if (meta.bulunamadi) return cacheYaz(anahtar, null, 120000);
  const b = await prerender.belge(yol, bCtx()).catch((e) => { console.error('[prerender]', yol, e && e.message); return null; });
  return cacheYaz(anahtar, { meta, b }, 300000);
}
const mdYolu = (yol) => '/md' + (yol === '/' ? '/index' : yol) + '.md';
const baslikTemiz = (t) => String(t || '').replace(/\s*[—|]\s*(CezaRehberi|TrafikRehber)\s*$/i, '').trim();
function mdMetin(yol, d) {
  const kanonik = SITE + (yol === '/' ? '/' : yol);
  const fm = ['---', `title: ${JSON.stringify(baslikTemiz(d.meta.baslik))}`,
    `description: ${JSON.stringify(d.meta.aciklama || '')}`, `canonical: ${kanonik}`, 'lang: tr',
    d.b.guncelleme ? `dateModified: ${d.b.guncelleme}` : null, `publisher: ${MARKA}`, '---'].filter(Boolean).join('\n');
  return fm + '\n\n' + prerender.bloklariMd(d.b.bloklar, SITE) + '\n';
}

// ---- llms.txt / llms-full.txt (yapay zekâ asistanları için site haritası ve tam metin) ----
async function tumBelgeler() {
  const anahtar = 'tum-belgeler';
  const onb = cacheAl(anahtar);
  if (onb !== undefined) return onb;
  const t = await prerender.tumYollar(apiGet);
  const grup = (yollar, ad) => Promise.all(yollar.map(async (yol) => ({ yol, d: await belgeAl(yol) })))
    .then((l) => ({ ad, l: l.filter((x) => x.d && x.d.b) }));
  const sonuc = await Promise.all([
    grup(t.sabit.filter((y) => !['/blog', '/trafik-cezalari', '/sigorta', '/ehliyet', '/arac-islemleri'].includes(y)), 'Araçlar ve yol haritaları'),
    grup(t.ceza, `Trafik cezaları (${veriYili} tutarları)`),
    grup(t.blog, 'Rehber yazıları'),
    grup(t.dilekce, 'Dilekçe örnekleri'),
    grup(['/blog', '/trafik-cezalari', '/sigorta', '/ehliyet', '/arac-islemleri'], 'Kategoriler'),
  ]);
  return cacheYaz(anahtar, sonuc, 600000);
}
async function llmsMetni() {
  const gruplar = await tumBelgeler();
  const g = await apiGet('/api/ceza-turleri/guncellik', 3600000);
  const s = [
    `# ${MARKA}`, '',
    `> Türkiye'de trafik cezası tutarları (${veriYili}), haksız cezaya itiraz yol haritası, hazır dilekçe oluşturucu, hız cezası hesaplama ve sigorta / ehliyet / araç işlemleri rehberi. Bağımsız bilgilendirme platformudur; resmî kurum veya hukuk bürosu değildir.`, '',
    `- Site: ${SITE}`, '- Dil: Türkçe · Bölge: Türkiye',
    `- Veri yılı: ${veriYili}${g && g.son_dogrulama ? ` · ceza tutarları son doğrulama: ${prerender.tarihTR(g.son_dogrulama)}` : ''}`,
    '- Dayanak: 2918 sayılı Karayolları Trafik Kanunu, 7574 sayılı Kanun (RG 27.02.2026), 5326 sayılı Kabahatler Kanunu',
    `- Tam metin: ${SITE}/llms-full.txt`,
    '- Süreler: indirimli ödeme tebliğden itibaren 1 ay (%25), itiraz tebliğden itibaren 15 gün (Sulh Ceza Hâkimliği)', '',
  ];
  gruplar.forEach((gr) => {
    if (!gr.l.length) return;
    s.push(`## ${gr.ad}`);
    gr.l.forEach(({ yol, d }) => s.push(`- [${baslikTemiz(d.meta.baslik)}](${SITE}${mdYolu(yol)})${d.meta.aciklama ? `: ${d.meta.aciklama}` : ''}`));
    s.push('');
  });
  s.push('## Not', '- Tutarlar bilgilendirme amaçlıdır; kesin tutar için e-Devlet kaydı ve tutanak esastır.',
    '- Hukuki danışmanlık verilmez; kişisel durumlar için avukata danışılmalıdır.');
  return s.join('\n') + '\n';
}
async function llmsTamMetin() {
  const gruplar = await tumBelgeler();
  const s = [`# ${MARKA} — Tam Metin`, '',
    `> ${SITE} sitesindeki tüm rehber, ceza ve araç sayfalarının Markdown metni. Özet için ${SITE}/llms.txt.`, ''];
  gruplar.forEach((gr) => gr.l.forEach(({ yol, d }) => {
    s.push('---', '', `Kaynak: ${SITE}${yol === '/' ? '/' : yol}`, d.b.guncelleme ? `Güncelleme: ${d.b.guncelleme}` : '', '',
      prerender.bloklariMd(d.b.bloklar, SITE), '');
  }));
  return s.filter((x) => x !== undefined).join('\n') + '\n';
}


// ---- AI / arama tarayıcı sayacı ----
// User-Agent'tan tanınır (taklit edilebilir; "bot kimliğiyle gelen istek"). Bellekte toplanır,
// dakikada bir backend'e (/api/stats/bot-toplu) toplu gönderilir. BOT_SAYAC_KEY iki serviste
// AYNI gizli değer olmalı; yoksa sayaç kapalıdır (hiçbir şey gönderilmez).
const BOT_KEY = (process.env.BOT_SAYAC_KEY || '').trim();
const BOTLAR = [
  ['GPTBot', 'ai'], ['OAI-SearchBot', 'ai'], ['ChatGPT-User', 'ai'], ['ClaudeBot', 'ai'], ['Claude-SearchBot', 'ai'],
  ['Claude-User', 'ai'], ['Claude-Web', 'ai'], ['anthropic-ai', 'ai'], ['PerplexityBot', 'ai'], ['Perplexity-User', 'ai'],
  ['DuckAssistBot', 'ai'], ['MistralAI-User', 'ai'], ['Meta-ExternalAgent', 'ai'], ['Meta-ExternalFetcher', 'ai'],
  ['Amazonbot', 'ai'], ['Bytespider', 'ai'], ['CCBot', 'ai'], ['cohere-ai', 'ai'], ['Diffbot', 'ai'],
  ['Google-CloudVertexBot', 'ai'], ['Googlebot', 'arama'], ['bingbot', 'arama'], ['YandexBot', 'arama'],
  ['DuckDuckBot', 'arama'], ['Applebot', 'arama'], ['Baiduspider', 'arama'], ['SeznamBot', 'arama'],
];
const BOT_RE = new RegExp(BOTLAR.map((b) => b[0].replace(/[-.]/g, '\\$&')).join('|'), 'i');
const botSay = new Map(); // "bot|tur|yol" → adet
function botKaydet(req, yol) {
  if (!BOT_KEY) return;
  const m = String(req.headers['user-agent'] || '').match(BOT_RE);
  if (!m) return;
  const b = BOTLAR.find((x) => x[0].toLowerCase() === m[0].toLowerCase());
  const anahtar = `${b[0]}|${b[1]}|${String(yol).slice(0, 160)}`;
  if (botSay.size < 2000 || botSay.has(anahtar)) botSay.set(anahtar, (botSay.get(anahtar) || 0) + 1);
}
async function botGonder() {
  if (!BOT_KEY || !API || !botSay.size) return;
  const satirlar = [...botSay].map(([k, n]) => { const [bot, tur, yol] = k.split('|'); return { bot, tur, yol, n }; });
  botSay.clear();
  try {
    await fetch(API + '/api/stats/bot-toplu', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-bot-key': BOT_KEY },
      body: JSON.stringify({ satirlar }),
    });
  } catch (e) { /* sayaç kaybı kabul edilir; siteyi etkilemez */ }
}
setInterval(botGonder, 60000).unref();

const indexHtml = () => fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');

const sunucu = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let yol = decodeURIComponent(url.pathname);

    // cezarehberi.com → www.cezarehberi.com (aynı içerik iki host'tan servis edilmesin;
    // canonical/sitemap/JSON-LD zaten www). Yalnız GET/HEAD; API POST'ları etkilenmez.
    const istekHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
    if ((req.method === 'GET' || req.method === 'HEAD') && SITE_HOST.startsWith('www.') && istekHost === SITE_HOST.slice(4)) {
      res.writeHead(301, { Location: SITE + req.url, 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }

    // Aynı-origin API geçidi: React build sırasında backend URL tanımlı olmasa
    // bile /api çağrıları backend'e ulaşır. CORS bağımlılığını azaltır.
    if (yol === '/api' || yol.startsWith('/api/')) {
      if (!API) {
        res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ detail: 'Backend API adresi tanımlı değil.' }));
      }
      try {
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 15000);
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            clearTimeout(timeout);
            res.writeHead(413);
            return res.end('Request too large');
          }
          chunks.push(chunk);
        }
        const upstream = await fetch(API + url.pathname + url.search, {
          method: req.method,
          headers: {
            'content-type': req.headers['content-type'] || 'application/json',
            'authorization': req.headers.authorization || '',
            'user-agent': req.headers['user-agent'] || '',
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
          },
          body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          signal: ac.signal,
          redirect: 'manual',
        });
        clearTimeout(timeout);
        const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8';
        res.writeHead(upstream.status, {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          // /api/ robots.txt'te açık (Googlebot sayfayı çizerken içeriği buradan çeker);
          // JSON adresleri arama sonuçlarına girmesin
          'X-Robots-Tag': 'noindex',
        });
        return res.end(Buffer.from(await upstream.arrayBuffer()));
      } catch (err) {
        console.error('[api-proxy]', err && err.message);
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ detail: 'Backend servisine erişilemiyor.' }));
      }
    }

    // IndexNow doğrulama dosyası (arama motorları anahtarı bu adresten okur)
    if (INDEXNOW_KEY && yol === '/' + INDEXNOW_KEY + '.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' });
      return res.end(INDEXNOW_KEY);
    }

    // Taşınan yazılar (ör. slug'ında yıl olan) → yeni kalıcı adres
    const eskiBlog = yol.match(/^\/blog\/([^/]+)$/);
    if (eskiBlog && ESKI_BLOG[eskiBlog[1]]) {
      res.writeHead(301, { Location: '/blog/' + ESKI_BLOG[eskiBlog[1]], 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }

    // Kopya içerik üreten alt kategoriler → üst kategoriye kalıcı yönlendirme.
    // Bu URL'ler üst sayfayla birebir aynı içeriği basıyordu ve sitemap'teydi.
    const altKategori = yol.match(/^(\/(?:trafik-cezalari|sigorta|ehliyet|arac-islemleri))\/[^/]+$/);
    if (altKategori) {
      res.writeHead(301, { Location: altKategori[1], 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }

    if (yol === '/sitemap.xml' || yol === '/robots.txt') {
      botKaydet(req, yol);
      const govde = await metinVarlik(yol, yol === '/sitemap.xml' ? 900000 : 3600000);
      if (govde) {
        return yanit(req, res, 200, {
          'Content-Type': yol.endsWith('.xml') ? MIME['.xml'] : MIME['.txt'],
          'Cache-Control': 'public, max-age=900',
        }, govde);
      }
    }

    // Sondaki "/" → kalıcı yönlendirme (aynı sayfa iki URL'den indekslenmesin)
    if (yol.length > 1 && yol.endsWith('/') && !yol.startsWith('/api/')) {
      res.writeHead(301, { Location: yol.replace(/\/+$/, '') + url.search, 'Cache-Control': 'public, max-age=86400' });
      return res.end();
    }

    // Yapay zekâ asistanları için: llms.txt (özet + bağlantılar), llms-full.txt (tam metin)
    if (yol === '/llms.txt' || yol === '/llms-full.txt') {
      botKaydet(req, yol);
      await yilYenile();
      const metin = yol === '/llms.txt' ? await llmsMetni() : await llmsTamMetin();
      return yanit(req, res, 200, {
        'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      }, metin);
    }

    // Markdown kopyaları: /md/<yol>.md  (ve Accept: text/markdown ile HTML adresi)
    const mdIstek = yol.match(/^\/md(\/.*)\.md$/);
    const mdIste = /(^|,)\s*text\/markdown\b/i.test(String(req.headers.accept || '')) && !yol.startsWith('/md/') && !path.extname(yol);
    if (mdIstek || mdIste) {
      const hedef = mdIstek ? (mdIstek[1] === '/index' ? '/' : mdIstek[1]) : yol;
      const d = await belgeAl(hedef);
      if (d && d.b) botKaydet(req, mdYolu(hedef));
      if (!d || !d.b) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' });
        return res.end('Bulunamadı');
      }
      const basl = {
        'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=900',
        // Markdown kopyası arama sonuçlarında yinelenen içerik sayılmasın; esas sayfa HTML'dir
        'X-Robots-Tag': 'noindex', 'Link': `<${SITE}${hedef === '/' ? '/' : hedef}>; rel="canonical"`,
        'X-Content-Type-Options': 'nosniff', 'Vary': 'Accept',
      };
      if (mdIste) basl['Content-Location'] = mdYolu(hedef);
      return yanit(req, res, 200, basl, mdMetin(hedef, d));
    }

    // Statik dosya
    if (yol !== '/' && !yol.endsWith('/')) {
      const dosya = guvenliYol(BUILD, yol);
      if (dosya && fs.existsSync(dosya) && fs.statSync(dosya).isFile()) {
        const uzanti = path.extname(dosya).toLowerCase();
        const hashli = /\.[0-9a-f]{8,}\.(js|css|woff2?|png|jpg|jpeg|webp|svg)$/i.test(dosya);
        const basl = {
          'Content-Type': MIME[uzanti] || 'application/octet-stream',
          'Cache-Control': hashli ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        };
        if (SIKISTIRILIR.has(uzanti)) {
          const st = fs.statSync(dosya);
          return yanit(req, res, 200, basl, fs.readFileSync(dosya), `${dosya}:${st.mtimeMs}`);
        }
        res.writeHead(200, { ...basl, 'Content-Length': fs.statSync(dosya).size });
        return fs.createReadStream(dosya).pipe(res);
      }
    }

    // SPA — head'i rotaya göre doldurulmuş index.html
    const belge = await belgeAl(yol);
    // Kopya: aşağıdaki ?q= dalı meta'yı değiştirir; önbellekteki nesne bozulmasın
    const meta = { ...(belge ? belge.meta : await metaCoz(yol)) };

    // Site içi arama sonuçları dizine girmemeli (ince/yinelenen içerik).
    // canonical zaten sorgu dizesi olmadan basılır → /blog'a işaret eder.
    if (url.searchParams.get('q')) {
      meta.noindex = true;
      meta.baslik = `"${url.searchParams.get('q')}" için arama sonuçları — ${MARKA}`;
    }
    let html = headEnjekte(indexHtml(), yol, meta);
    // Sayfa gövdesi: JS çalıştırmayan okuyucular (AI botları, paylaşım kazıyıcıları)
    // içeriği görsün. React mount olunca bu içeriği kendi çıktısıyla değiştirir.
    if (belge && belge.b) {
      const govde = prerender.htmlSayfa(belge.b.bloklar, bCtx());
      html = html.replace('<div id="root"></div>', () => '<div id="root">' + govde + '</div>');
    }
    const bilinmeyen = meta.bulunamadi === true;
    if (!bilinmeyen) botKaydet(req, yol);
    return yanit(req, res, bilinmeyen ? 404 : 200, {
      'Content-Type': MIME['.html'],
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Vary': 'Accept',
    }, html);
  } catch (e) {
    console.error('[sunucu]', e && e.message);
    res.writeHead(500, { 'Content-Type': MIME['.html'] });
    return res.end('<h1>Sunucu hatası</h1>');
  }
});

sunucu.listen(PORT, () => {
  console.log(`TrafikRehber ${PORT} portunda · API: ${API || '(tanımsız)'} · site: ${SITE}`);
});

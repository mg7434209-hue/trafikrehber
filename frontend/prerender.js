'use strict';
/**
 * SUNUCUDA SAYFA GÖVDESİ — JavaScript çalıştırmayan okuyucular için.
 *
 * NEDEN: site bir React SPA'dır; HTML'in <body>'si boştu ("JavaScript
 * etkinleştirilmelidir"). ChatGPT/Perplexity/Claude tarayıcıları ve sosyal
 * paylaşım kazıyıcıları JS çalıştırmaz, yani siteyi HİÇ görmüyordu. Burada her
 * rota için aynı içerik (API verisi + src/data/*.json) semantik HTML ve
 * Markdown olarak üretilir:
 *   · HTML  → server.js index.html'in #root'una basar; React mount olunca
 *             yerini alır (hydrate DEĞİL; createRoot içeriği temizler).
 *   · MD    → /md/<yol>.md, Accept: text/markdown, /llms.txt, /llms-full.txt.
 *
 * KURALLAR
 *  - Sayfa metni burada React sayfasıyla AYNI olmalı (farklı içerik cloaking
 *    sayılır). Rakamlar (tutar, süre, oran) API'den gelir, buraya yazılmaz.
 *  - Bir React sayfasının metnini değiştirirsen buradaki karşılığını da güncelle
 *    (docs/seo-ai.md tablosu).
 *  - Blok biçimi: {t:'h1'|'h2'|'h3'|'p'|'ul'|'ol'|'tablo'|'sss'|'html'|'pre', ...}
 *    Satır içi: **kalın**, [metin](/yol). Başka işaretleme yok (HTML kaçışlanır).
 */
const fs = require('fs');
const path = require('path');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const tl = (v) => Number(v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
const tarihTR = (iso) => {
  if (!iso) return '';
  const [y, a, g] = String(iso).slice(0, 10).split('-');
  return `${g}.${a}.${y}`;
};

function veriDosyasi(ad) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'data', ad), 'utf8')); }
  catch (e) { return null; }
}

// ── Blok kurucular ──────────────────────────────────────────────────────────
const B = {
  h1: (x) => ({ t: 'h1', x }),
  h2: (x) => ({ t: 'h2', x }),
  h3: (x) => ({ t: 'h3', x }),
  p: (x) => ({ t: 'p', x }),
  ul: (items) => ({ t: 'ul', items }),
  ol: (items) => ({ t: 'ol', items }),
  tablo: (head, rows) => ({ t: 'tablo', head, rows }),
  sss: (items) => ({ t: 'sss', items }),   // [{s, c}]
  html: (html) => ({ t: 'html', html }),   // GÜVENİLİR HTML (makale gövdesi)
  pre: (x) => ({ t: 'pre', x }),
};
const lnk = (text, href) => `[${text}](${href})`;

// ── Güvenlik: makale HTML'i (DB'den) — React da dangerouslySetInnerHTML kullanır;
// burada ek olarak script/stil/olay işleyicileri atılır.
function temizHtml(h) {
  return String(h || '')
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}

// ── Satır içi işaretleme ────────────────────────────────────────────────────
function satirIci(x, site) {
  let s = esc(x);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(((?:\/|https?:)[^)\s]*)\)/g, (m, t, h) => {
    const dis = /^https?:/.test(h);
    return `<a href="${h}"${dis ? ' rel="noopener nofollow" target="_blank"' : ''}>${t}</a>`;
  });
  return s;
}
function satirIciMd(x, site) {
  return String(x == null ? '' : x).replace(/\]\((\/[^)\s]*)\)/g, (m, h) => `](${site}${h})`);
}

// ── HTML üretimi ────────────────────────────────────────────────────────────
function hucre(c, site) {
  if (c && typeof c === 'object') {
    return c.href ? `<a href="${c.href}">${esc(c.text)}</a>` : esc(c.text);
  }
  return satirIci(c, site);
}

function bloklariHtml(bloklar, site) {
  return bloklar.map((b) => {
    switch (b.t) {
      case 'h1': return `<h1>${esc(b.x)}</h1>`;
      case 'h2': return `<h2>${esc(b.x)}</h2>`;
      case 'h3': return `<h3>${esc(b.x)}</h3>`;
      case 'p': return `<p>${satirIci(b.x, site)}</p>`;
      case 'ul':
      case 'ol': return `<${b.t}>${b.items.map((i) => `<li>${satirIci(i, site)}</li>`).join('')}</${b.t}>`;
      case 'tablo':
        return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
          b.rows.map((r) => `<tr>${r.map((c) => `<td>${hucre(c, site)}</td>`).join('')}</tr>`).join('') + '</tbody></table>';
      case 'sss':
        return b.items.map((q) => `<div class="sss-oge"><h3>${esc(q.s)}</h3><p>${satirIci(q.c, site)}</p></div>`).join('');
      case 'html': return temizHtml(b.html);
      case 'pre': return `<pre>${esc(b.x)}</pre>`;
      default: return '';
    }
  }).join('\n');
}

const GEZINME = [
  ['/', 'Ana Sayfa'], ['/trafik-cezalari-2026', 'Ceza Listesi'], ['/itiraz', 'İtiraz Et (yol haritası)'],
  ['/araclar/hiz-cezasi-hesapla', 'Hız Cezası Hesaplama'], ['/araclar/ceza-hesapla', 'Ceza Hesapla'],
  ['/dilekce-ornekleri', 'Dilekçe Örnekleri'], ['/blog', 'Rehberler'], ['/sigorta', 'Sigorta'],
  ['/ehliyet', 'Ehliyet'], ['/arac-islemleri', 'Araç İşlemleri'], ['/trafik-cezalari', 'Trafik Cezaları'],
];

/** #root içine basılacak HTML (React mount olunca yerini alır). */
function htmlSayfa(bloklar, ctx) {
  const nav = GEZINME.map(([h, a]) => `<a href="${h}">${esc(ctx.Y(a))}</a>`).join(' · ');
  return '<div id="seo-static">' +
    `<header><a href="/" class="seo-marka">CezaRehberi</a><nav aria-label="Ana gezinme">${nav}</nav></header>` +
    `<main>${bloklariHtml(bloklar, ctx.site)}</main>` +
    '<footer><p>CezaRehberi bağımsız bir bilgilendirme platformudur; resmî kurum veya hukuk bürosu değildir. ' +
    'Süreleri ve tutarları resmî kaynaklardan doğrulayın. ⚖️ Genel bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez.</p></footer>' +
    '</div>';
}

// ── Markdown üretimi ────────────────────────────────────────────────────────
function cozEntity(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

/** Güvenilir makale HTML'i → Markdown (bu sitenin işaretlemesine göre). */
function htmlMd(h, site) {
  let s = temizHtml(h).replace(/\r/g, '');
  const ic = (t) => cozEntity(
    t.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, tx) => {
      const mutlak = href.startsWith('/') ? site + href : href;
      return `[${tx.replace(/<[^>]+>/g, '').trim()}](${mutlak})`;
    })
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
  ).replace(/\s+/g, ' ').trim();
  // Tablo: önce çevrilir; çıktıda etiket kalmaz (sonraki adımlar dokunmaz)
  s = s.replace(/<table[\s\S]*?<\/table>/gi, (t) => {
    const satirlar = [...t.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map((m) => [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => ic(c[1]).replace(/\|/g, '\\|')));
    if (!satirlar.length) return '';
    const [bas, ...govde] = satirlar;
    return '\n\n| ' + bas.join(' | ') + ' |\n| ' + bas.map(() => '---').join(' | ') + ' |\n' +
      govde.map((r) => '| ' + r.join(' | ') + ' |').join('\n') + '\n\n';
  });
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (m, n, t) => `\n\n${'#'.repeat(Number(n))} ${ic(t)}\n\n`);
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (m, inner) => {
    let i = 0;
    return '\n\n' + inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (mm, t) => `${++i}. ${ic(t)}\n`) + '\n';
  });
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (m, inner) =>
    '\n\n' + inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (mm, t) => `- ${ic(t)}\n`) + '\n');
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (m, t) => `\n\n${ic(t)}\n\n`);
  s = s.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, (m, t) => `\n\n${ic(t)}\n\n`);
  s = cozEntity(s.replace(/<[^>]+>/g, ''));
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function bloklariMd(bloklar, site) {
  const m = (x) => satirIciMd(x, site);
  const hucreMd = (c) => (c && typeof c === 'object'
    ? (c.href ? `[${c.text}](${site}${c.href})` : String(c.text))
    : m(c)).replace(/\|/g, '\\|');
  return bloklar.map((b) => {
    switch (b.t) {
      case 'h1': return `# ${b.x}`;
      case 'h2': return `## ${b.x}`;
      case 'h3': return `### ${b.x}`;
      case 'p': return m(b.x);
      case 'ul': return b.items.map((i) => `- ${m(i)}`).join('\n');
      case 'ol': return b.items.map((i, n) => `${n + 1}. ${m(i)}`).join('\n');
      case 'tablo':
        return `| ${b.head.join(' | ')} |\n| ${b.head.map(() => '---').join(' | ')} |\n` +
          b.rows.map((r) => `| ${r.map(hucreMd).join(' | ')} |`).join('\n');
      case 'sss': return b.items.map((q) => `### ${q.s}\n\n${m(q.c)}`).join('\n\n');
      case 'html': return htmlMd(b.html, site);
      case 'pre': return '```\n' + b.x + '\n```';
      default: return '';
    }
  }).filter(Boolean).join('\n\n');
}

// ── İçerik üreticiler ───────────────────────────────────────────────────────
const POPULER = [
  'kirmizi-isik-cezasi', 'hiz-cezasi-sehir-ici', 'cep-telefonu-cezasi', 'alkollu-arac-kullanma-cezasi',
  'hatali-park-cezasi', 'emniyet-kemeri-cezasi', 'muayenesiz-arac-cezasi', 'zorunlu-trafik-sigortasi-cezasi',
];
const KAYNAKLAR = [
  ['e-Devlet Kapısı', 'https://www.turkiye.gov.tr/', 'Ceza sorgulama ve kişisel kayıtlar'],
  ['Gelir İdaresi Başkanlığı', 'https://www.gib.gov.tr/', 'Trafik cezası ödeme işlemleri'],
  ['Mevzuat Bilgi Sistemi', 'https://www.mevzuat.gov.tr/', '2918 sayılı Kanun ve değişiklikleri'],
];
const KATEGORI = {
  '/trafik-cezalari': { id: 'ceza', ad: 'Trafik Cezaları', ack: 'Ceza sorgulama, itiraz yolları ve güncel tutarlar.' },
  '/sigorta': { id: 'sigorta', ad: 'Sigorta Rehberi', ack: 'Zorunlu trafik sigortası ve kasko hakkında her şey.' },
  '/ehliyet': { id: 'ehliyet', ad: 'Ehliyet İşlemleri', ack: 'Sınav rehberi, puan sistemi ve yenileme bilgileri.' },
  '/arac-islemleri': { id: 'arac-islemleri', ad: 'Araç İşlemleri', ack: 'Muayene, tescil, noter ve plaka işlemleri.' },
};

async function sabitler(c) {
  const d = await c.apiGet('/api/ceza-turleri');
  return {
    cezalar: (d && d.cezalar) || [],
    odeme: (d && d.odeme_suresi_gun) || 30,
    itiraz: (d && d.itiraz_suresi_gun) || 15,
    indirim: d && d.indirim_orani ? Math.round(d.indirim_orani * 100) : 25,
    oran: d && d.indirim_orani ? d.indirim_orani : 0.25,
    sonDogrulama: d && d.son_dogrulama,
    dayanak: d && d.dayanak,
  };
}
const cezaSatiri = (z, s) => [
  { text: z.aciklama, href: z.slug ? `/ceza/${z.slug}` : null },
  tl(z.taban_ceza_tl), tl(z.taban_ceza_tl * (1 - s.oran)), z.puan > 0 ? String(z.puan) : '—',
];

async function anaSayfa(c) {
  const [s, art, dil] = await Promise.all([
    sabitler(c), c.apiGet('/api/articles/featured'), c.apiGet('/api/dilekce'),
  ]);
  const sss = veriDosyasi('sss.json') || [];
  const populer = POPULER.map((sl) => s.cezalar.find((z) => z.slug === sl)).filter(Boolean);
  const b = [
    B.h1('Trafik cezanız ne kadar? Ödemeli mi, itiraz mı etmeli? Hemen öğrenin.'),
    B.p(`${c.Y('{YIL}')} güncel trafik cezası tutarları, erken ödeme indirimi, itiraz süresi ve hazır dilekçe: aradığınızı tek sayfada bulun. 7574 sayılı Kanun değişiklikleri işlendi.`),
    B.h2('Ne yapmak istiyorsunuz?'),
    B.ul([
      lnk(`Cezam ne kadar? ${c.Y('{YIL}')} güncel tutarlar ve ceza puanları`, '/trafik-cezalari-2026'),
      lnk('Haksız ceza aldım, itiraz edeceğim: adım adım yol haritası ve dilekçe oluşturucu', '/itiraz'),
      lnk('Hız cezam ne kadar? Kaç km aştım, ne ödeyeceğim, ehliyet?', '/araclar/hiz-cezasi-hesapla'),
      lnk('İndirimli ne kadar öderim? Erken ödeme indirimi ve taksit hesabı', '/araclar/ceza-hesapla'),
      lnk('Cezamı nasıl sorgularım? e-Devlet ile adım adım sorgulama', '/blog/trafik-cezasi-e-devlet-sorgulama'),
      lnk('Kaza yaptım, ne yapmalıyım? Tutanak, sigorta ve hasar süreci', '/blog/trafik-kazasi-sonrasi-ne-yapilir'),
    ]),
    B.h2('Ceza geldi mi? Süreler tebliğ tarihinden başlar — iki yolunuz var'),
    B.p(`**Ödemek istiyorsanız (${s.odeme} gün):** tebliğden itibaren ${s.odeme} gün (1 ay) içinde öderseniz cezanın %${s.indirim}'i indirilir. ${lnk('İndirimli tutarı hesaplayın', '/araclar/ceza-hesapla')}.`),
    B.p(`**İtiraz etmek istiyorsanız (${s.itiraz} gün):** tebliğden itibaren ${s.itiraz} gün içinde Sulh Ceza Hâkimliği'ne yazılı başvurursunuz; süre kaçarsa ceza kesinleşir. ${lnk('İtiraz yol haritası ve dilekçe örnekleri', '/itiraz')}. Peşin ödeme itiraz hakkınızı ortadan kaldırmaz (Kabahatler Kanunu m.17/6).`),
  ];
  if (populer.length) {
    b.push(B.h2(`En çok aranan trafik cezaları (${c.Y('{YIL}')} tutarları)`));
    b.push(B.tablo(['Ceza', 'Tutar', `${s.odeme} gün içinde ödenirse`, 'Puan'], populer.map((z) => cezaSatiri(z, s))));
    b.push(B.p(`${lnk(`Tüm cezalar (${s.cezalar.length})`, '/trafik-cezalari-2026')}.${s.sonDogrulama ? ` Tutarlar son olarak ${tarihTR(s.sonDogrulama)} tarihinde resmî kaynaklarla karşılaştırıldı.` : ''}`));
  }
  const sablonlar = (dil && dil.sablonlar) || [];
  if (sablonlar.length) {
    b.push(B.h2('Hazır dilekçe örnekleri'));
    b.push(B.ul(sablonlar.slice(0, 4).map((d) => `${lnk(d.baslik, `/dilekce-ornekleri/${d.slug}`)}${d.aciklama ? ` — ${d.aciklama}` : ''}`)));
  }
  const yazilar = (art && art.articles) || [];
  if (yazilar.length) {
    b.push(B.h2('Adım adım güncel rehberler'));
    b.push(B.ul(yazilar.slice(0, 6).map((a) => `${lnk(a.title, `/blog/${a.slug}`)}${a.meta_description ? ` — ${a.meta_description}` : ''}`)));
  }
  b.push(B.h2('Sık sorulan sorular'));
  b.push(B.sss(sss.map((x) => ({ s: x.s, c: x.c }))));
  b.push(B.h2('Resmî kaynaklardan doğrulayın'));
  b.push(B.ul(KAYNAKLAR.map(([ad, url, ack]) => `${lnk(ad, url)} — ${ack}`)));
  return { bloklar: b };
}

async function cezaListesi(c) {
  const s = await sabitler(c);
  const b = [
    B.h1(c.Y('{YIL} Trafik Cezaları Güncel Liste')),
    B.p(`${s.dayanak ? `Tutarlar ${s.dayanak} esas alınarak güncellenmiştir. ` : ''}Tebliğden itibaren 1 ay (${s.odeme} gün) içinde ödeme yapıldığında **%${s.indirim} indirim** uygulanır; **itiraz süresi** ise tebliğden itibaren **${s.itiraz} gündür**.`),
    B.tablo(['İhlal', 'Ceza (ilk ihlal)', `${s.odeme} gün içinde ödenirse`, 'Puan'], s.cezalar.map((z) => cezaSatiri(z, s))),
  ];
  const kademeli = s.cezalar.filter((z) => z.kademe_notu);
  if (kademeli.length) {
    b.push(B.h2('Kademeli ve ek yaptırımlı cezalar'));
    b.push(B.ul(kademeli.map((z) => `**${z.aciklama}:** ${z.kademe_notu}`)));
  }
  b.push(B.p(`Kaynak: 2918 sayılı KTK, 7574 sayılı Kanun (RG: 27.02.2026).${s.sonDogrulama ? ` Son doğrulama: ${tarihTR(s.sonDogrulama)}.` : ''} Kesin tutar için e-Devlet'teki ceza kaydınızı esas alın.`));
  return { bloklar: b, guncelleme: s.sonDogrulama };
}

async function cezaDetay(c, slug) {
  const v = await c.apiGet('/api/ceza-turleri/sayfa/' + encodeURIComponent(slug));
  if (!v || !v.ceza || !v.sayfa) return null;
  const z = v.ceza;
  const tasarruf = Number(z.taban_ceza_tl) - Number(z.indirimli_tl);
  const b = [B.h1(v.sayfa.baslik)];
  b.push(B.ul([
    `**Ceza tutarı:** ${tl(z.taban_ceza_tl)}`,
    `**${v.odeme_suresi_gun} gün içinde ödenirse:** ${tl(z.indirimli_tl)} (${tl(tasarruf)} tasarruf)`,
    `**Ceza puanı:** ${z.puan > 0 ? z.puan : 'yok'}`,
    ...(z.kanun_maddesi ? [`**Dayanak:** ${z.kanun_maddesi}`] : []),
    `**İtiraz süresi:** tebliğden itibaren ${v.itiraz_suresi_gun} gün`,
  ]));
  if (z.kademe_notu) b.push(B.p(`**Bu ceza kademelidir:** ${z.kademe_notu}`));
  b.push(B.html(`<p>${v.sayfa.ozet}</p>`));
  b.push(B.h2('Ceza geldi, şimdi ne yapmalıyım?'));
  b.push(B.p(`**Ödeyecekseniz: ${v.odeme_suresi_gun} gün.** Tebliğden itibaren ${v.odeme_suresi_gun} gün içinde öderseniz %25 indirim uygulanır: ${tl(z.indirimli_tl)}. Süre dolduktan sonra indirim hakkı düşer. ${lnk('Kaçıncı günde ne öderim?', '/araclar/ceza-hesapla')}`));
  b.push(B.p(`**İtiraz edecekseniz: ${v.itiraz_suresi_gun} gün.** İtiraz süresi ödeme süresinden ayrıdır ve daha kısadır; Sulh Ceza Hâkimliği'ne ${v.itiraz_suresi_gun} gün içinde başvurmanız gerekir. ${lnk('Haksızsa: adım adım itiraz ve dilekçe oluştur', `/itiraz?ceza=${z.slug || slug}`)}`));
  if (v.sayfa.sss && v.sayfa.sss.length) {
    b.push(B.h2('Sık sorulan sorular'));
    b.push(B.sss(v.sayfa.sss.map((q) => ({ s: q.soru, c: q.cevap }))));
  }
  if (v.ilgili && v.ilgili.length) {
    b.push(B.h2('Diğer trafik cezaları'));
    b.push(B.ul(v.ilgili.map((r) => `${lnk(r.aciklama, `/ceza/${r.slug}`)} — ${tl(r.taban_ceza_tl)} (${v.odeme_suresi_gun} günde ${tl(r.indirimli_tl)})`)));
  }
  b.push(B.p(`Kaynak: 2918 sayılı KTK, 7574 sayılı Kanun (RG: 27.02.2026).${v.son_dogrulama ? ` Son doğrulama: ${tarihTR(v.son_dogrulama)}.` : ''} Bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez; kesin tutar için e-Devlet'teki ceza kaydınızı esas alın.`));
  return { bloklar: b, guncelleme: v.son_dogrulama };
}

async function makale(c, slug) {
  const v = await c.apiGet('/api/articles/' + encodeURIComponent(slug) + '?say=0');
  const a = v && v.article;
  if (!a) return null;
  // React ArticlePage meta_description'ı GÖRÜNÜR metin olarak göstermez; burada da yok.
  const b = [B.h1(a.title), B.html(a.content || '')];
  if (v.related && v.related.length) {
    b.push(B.h2('İlgili rehberler'));
    b.push(B.ul(v.related.map((r) => lnk(r.title, `/blog/${r.slug}`))));
  }
  return { bloklar: b, guncelleme: (a.updated_at || a.created_at || '').slice(0, 10) };
}

async function blogListesi(c) {
  const v = await c.apiGet('/api/articles?page=1&limit=50');
  const l = (v && v.articles) || [];
  return {
    bloklar: [
      B.h1('Trafik, Sigorta ve Ehliyet Rehberleri'),
      B.p('Trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel rehber yazıları.'),
      B.ul(l.map((a) => `${lnk(a.title, `/blog/${a.slug}`)}${a.meta_description ? ` — ${a.meta_description}` : ''}`)),
    ],
  };
}

async function kategori(c, yol) {
  const k = KATEGORI[yol];
  const v = await c.apiGet('/api/articles/category/' + k.id);
  const l = (v && v.articles) || [];
  return {
    bloklar: [
      B.h1(k.ad), B.p(k.ack),
      B.ul(l.map((a) => `${lnk(a.title, `/blog/${a.slug}`)}${a.meta_description ? ` — ${a.meta_description}` : ''}`)),
    ],
  };
}

async function dilekceListesi(c) {
  const d = await c.apiGet('/api/dilekce');
  const l = (d && d.sablonlar) || [];
  return {
    bloklar: [
      B.h1(c.Y('Trafik Cezası İtiraz Dilekçe Örnekleri {YIL}')),
      B.p(`Trafik cezasına itiraz, sigorta hasar ihbarı ve ehliyet iptali için hazır dilekçe şablonları. Doldurun, yazdırın. İtiraz için adım adım ${lnk('yol haritası ve dilekçe oluşturucu', '/itiraz')} da var.`),
      B.ul(l.map((x) => `${lnk(x.baslik, `/dilekce-ornekleri/${x.slug}`)}${x.aciklama ? ` — ${x.aciklama}` : ''}`)),
    ],
  };
}

async function dilekceDetay(c, slug) {
  const v = await c.apiGet('/api/dilekce/' + encodeURIComponent(slug));
  const d = v && v.sablon;
  if (!d) return null;
  const b = [B.h1(d.baslik)];
  if (d.aciklama) b.push(B.p(d.aciklama));
  if (d.ilgili_kanun) b.push(B.p(`**İlgili mevzuat:** ${d.ilgili_kanun}`));
  b.push(B.h2('Dilekçe şablonu'));
  b.push(B.pre(d.sablon_icerik || ''));
  b.push(B.p('Köşeli parantezli alanları kendi bilgilerinizle doldurun. Örnek amaçlıdır; kişisel durumunuz için bir avukata danışabilirsiniz.'));
  return { bloklar: b };
}

async function itiraz(c) {
  const s = await sabitler(c);
  const V = veriDosyasi('itiraz.json') || { gerekceler: [], zayif: [], sss: [] };
  const guc = { guclu: 'Güçlü gerekçe', orta: 'Kanıtla güçlenir', zayif: 'Tek başına zayıf' };
  const b = [
    B.h1('Haksız trafik cezasına itiraz: adım adım yol haritası'),
    B.p(`Cezanın haksız olduğunu düşünüyorsanız 6 adımda ilerleyin: sürenizi hesaplayın, gerekçenizi seçin, dilekçenizi ücretsiz oluşturun ve nereye vereceğinizi öğrenin. İtiraz süresi tebliğden itibaren **${s.itiraz} gündür**; itiraz için başvuru harcı alınmaz; avukat zorunlu değildir.`),
    B.h2('1. Cezanızı ve tebliğ tarihini belirleyin'),
    B.p(`Süre, cezanın size **tebliğ edildiği** günden başlar: tutanak elinize verildiyse o gün, posta ile geldiyse zarfı teslim aldığınız gün, e-Tebligat ile geldiyse tebliğ sayılan gün. İtiraz süresi ${s.itiraz} gündür (5326 sayılı Kabahatler Kanunu m.27); son gün hafta sonu ya da resmî tatile denk gelirse süre izleyen ilk iş gününe kayar. %${s.indirim} indirimli ödeme süresi ise tebliğden itibaren 1 aydır (${s.odeme} gün). Sitedeki ${lnk('itiraz sayfasında', '/itiraz')} tebliğ tarihini girerek iki son günü de hesaplayabilirsiniz.`),
    B.h2('2. Neden haksız? Gerekçenizi belirleyin'),
    B.p('İtirazın sonucu, gerekçenin somutluğuna ve kanıta bağlıdır.'),
    B.ul(V.gerekceler.map((g) => `**${g.baslik}** (${guc[g.guc] || ''}) — ${g.aciklama} Kanıt: ${g.kanit}.`)),
    B.p('**Tek başına işe yaramayanlar:**'),
    B.ul(V.zayif),
    B.h2('3. Ödeyeyim mi, itirazı mı bekleyeyim?'),
    B.p(`İkisini birlikte yapabilirsiniz. Peşin ödeme itiraz hakkınızı ortadan kaldırmaz (Kabahatler Kanunu m.17/6). İtirazın sonucu çoğu zaman indirim süresinden sonra çıktığı için pek çok kişi cezayı 1 ay içinde %${s.indirim} indirimle öder ve itirazını ayrıca yapar; itiraz kabul edilirse ödenen tutarın iadesi istenir.`),
    B.h2('4. İtiraz dilekçesini hazırlayın'),
    B.p('Dilekçe, cezanın yazıldığı yerdeki Sulh Ceza Hâkimliği\'ne hitaben yazılır. İçermesi gerekenler:'),
    B.ul([
      'Hitap: "… Sulh Ceza Hâkimliği\'ne"',
      'Ad, soyad, T.C. kimlik no, adres, telefon',
      'Tutanağın tarihi, seri-sıra numarası ve araç plakası',
      'Tebliğ tarihi (süresinde olduğunuzu gösterir)',
      'Olayın kısa anlatımı ve itiraz gerekçeleri',
      'Ekler: tutanak sureti, fotoğraf, kayıt ve belgeler',
      'Talep: idari para cezasının kaldırılmasına karar verilmesi; tarih ve imza',
    ]),
    B.p('CezaRehberi\'ndeki dilekçe oluşturucu, seçtiğiniz gerekçeleri hukuki dile çevirir; yazdırabilir, Word olarak indirebilirsiniz. Girdiğiniz kişisel bilgiler yalnızca tarayıcınızda işlenir, sunucuya gönderilmez.'),
    B.h2('5. Dilekçeyi nereye ve nasıl verirsiniz?'),
    B.ul([
      '**Adliyeye elden:** dilekçeyi imzalayıp tutanak sureti, kimlik fotokopisi ve kanıtlarla birlikte adliyenin ön bürosuna (tevzi bürosu) verin; size verilen dosya numarasını saklayın.',
      '**İnternetten (UYAP):** vatandas.uyap.gov.tr adresine e-Devlet ile girin, trafik idari para cezasına itirazı seçin, dilekçe ve ekleri yükleyip e-imza veya mobil imza ile gönderin. Yalnız e-Devlet şifresi evrak göndermeye yetmeyebilir.',
    ]),
    B.h2('6. Sonra ne olur?'),
    B.ul([
      '**Karar:** Hâkimlik genellikle duruşma yapmadan dosya üzerinden karar verir; karar size tebliğ edilir.',
      '**Kabul:** Ceza kaldırılır; ödediyseniz iade için ilgili vergi dairesine başvurursunuz.',
      '**Ret:** Kararın tebliğinden itibaren 7 gün içinde karara itiraz edebilirsiniz (Kabahatler Kanunu m.29, CMK m.268).',
    ]),
    B.h2('Avukat desteği ister misiniz?'),
    B.p('İtirazı kendiniz yapabilirsiniz; avukat zorunlu değildir. Ceza yüksek tutarlı ya da kademeliyse, sürücü belgeniz geri alındıysa, olayda kaza veya ceza davası ihtimali varsa ya da itirazınız reddedildiyse bir avukattan destek almanız önerilir. Bulunduğunuz ilin barosundan ya da Türkiye Barolar Birliği\'nden avukat bilgisine ulaşabilirsiniz; maddi durumunuz yetmiyorsa barosunun adli yardım bürosuna başvurabilirsiniz.'),
    B.h2('Trafik cezasına itiraz: sık sorulan sorular'),
    B.sss(V.sss.map((x) => ({ s: x.s, c: x.c }))),
    B.p(`İlgili: ${lnk(`${c.Y('{YIL}')} ceza tutarları`, '/trafik-cezalari-2026')} · ${lnk('Hız cezası hesaplama', '/araclar/hiz-cezasi-hesapla')} · ${lnk('e-Devlet\'ten ceza sorgulama', '/blog/trafik-cezasi-e-devlet-sorgulama')} · ${lnk('Diğer dilekçe örnekleri', '/dilekce-ornekleri')}`),
  ];
  return { bloklar: b };
}

async function hizAraci(c) {
  const v = await c.apiGet('/api/ceza-turleri/hiz-kademeleri');
  const V = veriDosyasi('hiz.json') || { sss: [] };
  const oran = v && v.indirim_orani ? v.indirim_orani : 0.25;
  const b = [
    B.h1('Hız cezası hesaplama: kaç km aşarsam ne kadar ceza?'),
    B.p('7574 sayılı Kanun\'la hız cezaları aşılan kilometreye göre 9 kademeye ayrıldı. Hız sınırını ve tespit edilen hızınızı girerek aşım kademesini, ceza tutarını, 1 ay içinde indirimli tutarı ve sürücü belgesinin geri alınma süresini hesaplayabilirsiniz.'),
  ];
  if (v && v.yollar) {
    Object.values(v.yollar).forEach((y) => {
      b.push(B.h2(`${c.Y('{YIL}')} hız cezası kademeleri — ${y.ad}`));
      b.push(B.tablo(['Aşım', 'Ceza', '1 ayda ödenirse', 'Ehliyet'], y.kademeler.map((k) => [
        k.ust ? `${k.alt}–${k.ust} km/s` : `${k.alt} km/s ve üzeri`, tl(k.ceza_tl), tl(k.ceza_tl * (1 - oran)),
        k.belge_gun ? `${k.belge_gun} gün geri alınır` : '—',
      ])));
    });
    b.push(B.p(`Kaynak: 2918 sayılı KTK m.51 (7574 sayılı Kanun ile değişik, RG 27.02.2026).${v.son_dogrulama ? ` Son doğrulama: ${tarihTR(v.son_dogrulama)}.` : ''}`));
  }
  b.push(B.h2('Hız cezası hakkında sık sorulanlar'));
  b.push(B.sss(V.sss.map((x) => ({ s: x.s, c: x.c }))));
  b.push(B.p(`Radar cezası haksız mı? ${lnk('İtiraz yol haritası', '/itiraz?ceza=hiz-cezasi-sehir-ici')}`));
  return { bloklar: b };
}

async function cezaHesapla(c) {
  const s = await sabitler(c);
  return {
    bloklar: [
      B.h1(`Trafik cezası hesaplama aracı ${c.Y('{YIL}')}`),
      B.p(`Ceza türünü seçin; ${s.odeme} gün (1 ay) içinde ödemede %${s.indirim} indirimli tutarı ve taksit seçeneklerini anında görün. Kabahatler Kanunu m.17/3'e göre ceza, ilk taksit ödeme süresi içinde olmak üzere 4 eşit taksitte ödenebilir; taksitte peşin ödeme indirimi uygulanmaz.`),
      B.tablo(['İhlal', 'Ceza', `${s.odeme} günde ödenirse`, '4 taksitte (aylık)'], s.cezalar.map((z) => [
        { text: z.aciklama, href: z.slug ? `/ceza/${z.slug}` : null }, tl(z.taban_ceza_tl),
        tl(z.taban_ceza_tl * (1 - s.oran)), tl(z.taban_ceza_tl / 4),
      ])),
      B.p(`${s.dayanak ? `Tutarlar ${s.dayanak} esas alınarak hesaplanır; ` : ''}bilgilendirme amaçlıdır. İtiraz süresi ayrıdır ve ${s.itiraz} gündür: ${lnk('itiraz yol haritası', '/itiraz')}.`),
    ],
  };
}

function sayfaStatik(ad, metin) {
  return async () => ({ bloklar: [B.h1(ad), B.p(metin)] });
}

/**
 * Rota → { bloklar, guncelleme? } | null. null = bu rota için gövde üretilmez.
 * ctx: { apiGet, Y(metin), site }
 */
async function belge(yol, ctx) {
  let m;
  if (yol === '/') return anaSayfa(ctx);
  if (yol === '/trafik-cezalari-2026') return cezaListesi(ctx);
  if (yol === '/itiraz') return itiraz(ctx);
  if (yol === '/araclar/hiz-cezasi-hesapla') return hizAraci(ctx);
  if (yol === '/araclar/ceza-hesapla') return cezaHesapla(ctx);
  if (yol === '/blog') return blogListesi(ctx);
  if (yol === '/dilekce-ornekleri') return dilekceListesi(ctx);
  if (KATEGORI[yol]) return kategori(ctx, yol);
  if ((m = yol.match(/^\/ceza\/([^/]+)$/))) return cezaDetay(ctx, m[1]);
  if ((m = yol.match(/^\/blog\/([^/]+)$/))) return makale(ctx, m[1]);
  if ((m = yol.match(/^\/dilekce-ornekleri\/([^/]+)$/))) return dilekceDetay(ctx, m[1]);
  if (yol === '/hakkimizda') return sayfaStatik('Hakkımızda', 'CezaRehberi; trafik cezaları, sigorta, ehliyet ve araç işlemleri üzerine güncel ve güvenilir Türkçe rehber sunar. Hukuki danışmanlık hizmeti vermez; içerikler genel bilgilendirme amaçlıdır.')();
  if (yol === '/iletisim') return sayfaStatik('İletişim', 'Görüş, öneri ve sorularınız için CezaRehberi iletişim sayfası.')();
  if (yol === '/gizlilik-politikasi') return sayfaStatik('Gizlilik Politikası', 'KVKK kapsamında kişisel verilerin işlenmesi, çerezler ve ziyaretçi sayacı hakkında bilgilendirme.')();
  return null;
}

/** Tüm indekslenebilir yollar (llms.txt / llms-full.txt için). */
async function tumYollar(apiGet) {
  const yollar = [
    '/', '/itiraz', '/araclar/hiz-cezasi-hesapla', '/araclar/ceza-hesapla', '/trafik-cezalari-2026',
    '/dilekce-ornekleri', '/blog', '/trafik-cezalari', '/sigorta', '/ehliyet', '/arac-islemleri',
  ];
  const [cz, ar, di] = await Promise.all([
    apiGet('/api/ceza-turleri/sayfalar'), apiGet('/api/articles?page=1&limit=50'), apiGet('/api/dilekce'),
  ]);
  const cezaYol = ((cz && cz.sayfalar) || []).map((x) => `/ceza/${x.slug}`);
  const blogYol = ((ar && ar.articles) || []).map((x) => `/blog/${x.slug}`);
  const dilYol = ((di && di.sablonlar) || []).map((x) => `/dilekce-ornekleri/${x.slug}`);
  return { sabit: yollar, ceza: cezaYol, blog: blogYol, dilekce: dilYol };
}

module.exports = { belge, htmlSayfa, bloklariMd, bloklariHtml, htmlMd, tumYollar, esc, tarihTR };

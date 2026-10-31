# SEO ve yapay zekâ (AI) görünürlüğü

> CLAUDE.md'den `@docs/seo-ai.md` ile içe aktarılır. Sürekli denetim: `cd frontend && npm run seo:kontrol`.

## Neden sayfa gövdesini sunucu üretiyor?
Site bir React SPA'dır; HTML'in `<body>`'si boştu. ChatGPT / Perplexity / Claude tarayıcıları
ve paylaşım kazıyıcıları JS ÇALIŞTIRMAZ — siteyi hiç görmüyorlardı (yalnız başlık/etiketler
enjekte ediliyordu). `frontend/prerender.js` her rota için aynı içeriği (API + `src/data/*.json`)
semantik HTML ve Markdown üretir:
- HTML → server.js `#root` içine basar (`<div id="seo-static">`); React `createRoot` mount olunca
  içeriği değiştirir (hydrate DEĞİL). Ön stil `public/index.html` içindeki `<style>`'dadır.
- Markdown → `/md/<yol>.md` (`/` → `/md/index.md`), `Accept: text/markdown`, `/llms.txt`, `/llms-full.txt`.
- KURAL (cloaking olmasın): bir React sayfasının METNİNİ değiştirirsen `prerender.js`'teki
  karşılığını da değiştir. Rakamlar (tutar, süre, oran) API'den gelir, oraya yazılmaz.

| Rota | React | prerender.js |
|---|---|---|
| `/` | HomePage | `anaSayfa` |
| `/trafik-cezalari-2026` | CezaListesiPage | `cezaListesi` |
| `/ceza/:slug` | CezaDetayPage | `cezaDetay` |
| `/blog/:slug` | ArticlePage | `makale` (gövde HTML'i DB'den, `temizHtml` süzer) |
| `/itiraz` | ItirazPage + `data/itiraz.json` | `itiraz` |
| `/araclar/hiz-cezasi-hesapla` | HizCezasiPage + `data/hiz.json` | `hizAraci` |
| `/araclar/ceza-hesapla` | CezaHesaplaPage | `cezaHesapla` |
| `/dilekce-ornekleri[/:slug]`, `/blog`, 4 kategori | ilgili sayfalar | `dilekceListesi/Detay`, `blogListesi`, `kategori` |
| `/hakkimizda` `/iletisim` `/gizlilik-politikasi` | StaticPages | kısa özet (`sayfaStatik`) |
YENİ SAYFA: `App.js` + `server.js ROTALAR` + `prerender.js belge()` + `tumYollar()` (llms) +
backend `sitemap.py STATIC_URLS` + `scripts/build-sitemap.js`; sonra `npm run seo:kontrol`.

## AI dosyaları ve robots.txt
- `/llms.txt`: özet + bağlantılar (md kopyalarına); `/llms-full.txt`: tüm sayfaların Markdown'ı (≈110 KB).
- `robots.txt` (backend `routers/sitemap.py`, yedek `frontend/public/robots.txt`): AI arama/yanıt
  botları + eğitim botları AÇIKÇA izinli, `/md/` yalnız onlara açık, `Content-Signal: search=yes,
  ai-input=yes, ai-train=yes`. EĞİTİME İZİN BİR İŞ KARARIDIR: kapatmak için `AI_EGITIM_BOTLARI`
  listesini `Disallow: /` grubuna taşı ve `ai-train=no` yaz.
- `/api/` robots'ta KAPALI DEĞİL: Googlebot sayfayı çizerken içeriği /api'den çeker; engellenirse
  çizilen sayfa boş kalırdı. JSON yanıtları `X-Robots-Tag: noindex` taşır (server.js).
- `/md/*` yanıtları `X-Robots-Tag: noindex` + `Link: <HTML adresi>; rel="canonical"` taşır.

## Teknik SEO (server.js)
br/gzip sıkıştırma (statik varlıklar bir kez sıkıştırılıp önbelleğe alınır; JS 348→85 KB) ·
`cezarehberi.com` → `www` 301 (GET/HEAD) · sondaki `/` → 301 · Google Fonts `media=print` ile
render-blocking değil · önbellek 3000 girişte sınırlı · makale gövdesi/başlığı `?say=0` ile
çekilir (bot ve önbellek yenilemesi "görüntülenme" saymasın).

## Yapısal veri (`metaCoz`)
Her sayfa: BreadcrumbList. Ana sayfa: WebSite(SearchAction) + FAQPage. Makale: Article/HowTo
(+`article:published/modified_time`). Ceza sayfası: Article(dateModified = son doğrulama) + FAQPage.
`/itiraz`: HowTo(6 adım, maliyet 0 TRY) + FAQPage. Hız/hesaplama araçları: WebApplication(ücretsiz).
Ceza listesi: ItemList(14). FAQPage ELLE yazılmaz; `ROTALAR[yol].sss` → `src/data/<dosya>.json`.
aggregateRating/Review EKLENMEZ (doğrulanmış yorum yok).

## AI / arama tarayıcı sayacı (ölçüm)
server.js User-Agent'tan tanır (27 bot: AI ve arama motorları), bellekte toplar, dakikada bir
`POST /api/stats/bot-toplu` ile gönderir → `ai_bot_hits` (gün·bot·yol, 90 gün). Admin → Genel →
"AI ve arama tarayıcı ziyaretleri". GİZLİ ORTAM DEĞİŞKENİ `BOT_SAYAC_KEY` iki serviste AYNI olmalı
(yoksa sayaç kapalı; INDEXNOW_KEY kullanılamaz, o herkese açıktır). UA taklit edilebilir:
sayı "bot kimliğiyle gelen istek"tir. İnsan UA'sı ve 404 sayılmaz.

## Denetim (`npm run seo:kontrol`, BASE=<adres> ile canlıya da)
Sitemap'teki her sayfa için: 200 · JS'siz gövde ≥300 karakter · tek h1 · title ≤70 · description
70-160 · canonical = sitemap adresi · noindex yok · JSON-LD geçerli · md alternatifi + kopyası ·
iç bağlantılar. Genel: robots (AI botları, /api/ açık), llms.txt/-full, br/gzip, slash 301,
Accept: text/markdown, 404. HATA çıkış kodu 1; yeni sayfa/şablondan sonra çalıştır.

## Elle yapılacaklar (kod değil)
Search Console + Bing Webmaster: sitemap gönder, yeni adreslerde "dizine eklenmesini iste" ·
Railway: `INDEXNOW_KEY` (iki servis, aynı) ve `BOT_SAYAC_KEY` (iki servis, aynı, gizli) ·
Google'ın kare logosu için ≥112×112 (öneri 512×512) PNG `organizationLd`'ye · yazar/avukat gözden
geçirme (E-E-A-T): gerçek bir yazar ya da avukat adı + hakkında sayfası.

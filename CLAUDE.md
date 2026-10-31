# CLAUDE.md — TrafikRehber (cezarehberi.com)

> Repo kök dizinindedir; Claude Code her oturum başında otomatik okur.
> 200 satırı geçirme; uzayan içerikleri `@dosya/yolu.md` ile import et.
## Proje
**www.cezarehberi.com** — trafik cezaları, sigorta, ehliyet ve araç işlemleri
üzerine **organik trafik (SEO) odaklı içerik platformu**. Gelir modeli Google
AdSense (`ca-pub-9741235138417122`; `ads.txt` hem backend hem `public/`ta).
İki Railway servisi + PostgreSQL:

```
trafikrehber/
├── backend/   → FastAPI + SQLAlchemy + PostgreSQL   (API, sitemap, robots)
└── frontend/  → React 18 SPA (CRA + react-router)   (server.js ile yayında)
```

Frontend API'ye `REACT_APP_BACKEND_URL` ile bağlanır (`src/services/api.js`);
boşsa aynı origin varsayılır. CORS backend'de `*` (çerez kullanılmaz).

## Rotalar (`frontend/src/App.js`)
`/` · `/blog` `/blog/:slug` · `/dilekce-ornekleri` `/dilekce-ornekleri/:slug` ·
`/araclar/ceza-hesapla` · `/araclar/hiz-cezasi-hesapla` · `/itiraz` ·
`/trafik-cezalari-2026` (2026 ceza listesi) ·
kategori grupları `/trafik-cezalari` `/sigorta` `/ehliyet` `/arac-islemleri`
(+ `/:sub` alt rotaları) · `/hakkimizda` `/iletisim` `/gizlilik-politikasi` ·
`/admin` (Navbar/Footer YOK, JWT ile korunur, robots'ta engelli) · SPA 404.
Yeni rota eklerken: `App.js` + `Navbar.js`/`Footer.js` bağlantıları +
`backend/routers/sitemap.py` → `STATIC_URLS`.

## Backend (`backend/`)
- `main.py` — router kaydı, `Base.metadata.create_all` + `_eksik_kolonlari_ekle()`
  (var olan tabloya kolon eklemek için `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`;
  yeni kolon eklerken oradaki listeye bir satır ekle), `ads.txt` + Google doğrulama HTML'leri,
  `POST /api/seed` ve `POST /api/seed-rich` (içerik tohumlama; **veri gövdede
  gömülüdür**, düzenlerken `seed.py` ile karıştırma).
- `models.py` — `Article`, `DilecceSablon`, `CezaTuru`, `PageStat`,
  `ChatMessage`, `UserSession` + sayaç tabloları `SiteVisit`, `VisitorKey`.
- `routers/` — `articles` (liste/öne çıkan/arama/slug; slug okunduğunda
  `view_count`+1), `dilekce` (şablon + `.txt` indirme, `indirme_sayisi`+1),
  `ceza` (tutar + %25 erken ödeme/taksit hesabı), `chat` (Gemini),
  `admin` (JWT; makale CRUD, 2025→2026 toplu güncelleme, YDO ile ceza zammı,
  istatistikler), `sitemap` (dinamik `sitemap.xml` + `robots.txt`), `stats`.
- `utils/auth.py` — JWT (`JWT_SECRET`), `require_admin`.

## Ziyaretçi Sayacı (`routers/stats.py` · `components/VisitCounter.js`)
gespaenerji.com footer sayacıyla **aynı mantık**, Postgres'e uyarlanmış hâli:
- Tekil ziyaretçi **günde 1 kez** sayılır. Kimlik yerine
  `sha256(IP + User-Agent + gün + VISITOR_SALT)` karması `visitor_keys`
  tablosuna yazılır — **ham IP ASLA saklanmaz** (KVKK; gizlilik sayfasında
  yazılıdır). Kayıtlar 7 gün sonra otomatik temizlenir.
- Bot süzgeci `BOT_RE` (gespaenerji `server.js` ile aynı liste); UA yoksa veya
  bot ise hiç sayılmaz (headless tarayıcılar da elenir).
- "Şu an sitede" = son 5 dk ping atan tekil anahtar sayısı — **yalnız bellekte**
  (tek uvicorn işçisi varsayılır; çoklu işçide sayı bölünür).
- Günlük toplamlar `site_visits` (gun · tekil · goruntulenme) tablosunda,
  `ON CONFLICT` ile yarış koşulsuz artırılır. Toplamlar 30 sn önbelleklidir.
- **Gösterilen toplam = `VISITORS_BASE` + veritabanı toplamı.** Taban varsayılanı
  **1000**'dir (sayaç 1.000 ziyaretçiden başlar). Veritabanı
  sıfırlanırsa sayaç geriye düşmesin diye taban ortam değişkeniyle taşınır
  (Railway → Variables → `VISITORS_BASE`). KURAL: tabanı büyütmek geçmişi
  taşımak içindir, sayıyı şişirmek için değil.
- Uçlar: `POST /api/stats/visit` (`{"sayfa":"/blog"}` → görüntülenme de sayar;
  `{}` → yalnız "şu an sitede" tazeleme), `GET /api/stats/visitors`,
  `GET /api/stats/public`. Sayaç YALNIZ sayfa altındadır (hero'da yok).
- İstemci: `VisitCounter` footer alt barına rozeti basar (`.visit-counter`
  stilleri `App.css`'te), rota değişiminde ping atar, 60 sn'de bir (sekme
  görünürken) online sayısını tazeler. **API yanıt vermezse rozet gizlenir —
  tahmini/uydurma sayı basılmaz.** Admin panelinde toplam/bugün/online kartları
  ve son 7 gün grafiği vardır. "Bugün" TÜRKİYE günüdür (`tr_bugun()`).

## Alt belgeler (ayrıntı burada)
- Ana sayfa: arama + niyet kartları + dilekçe sayacı — @docs/ana-sayfa.md
- Yıl/tutar ELLE YAZILMAZ — `{{yil}}`, `{{ceza:H1}}`, `YIL` — @docs/guncellik.md
- İtiraz yolculuğu, dilekçe oluşturucu (KVKK), avukat (Av. K. m.55), hız aracı — @docs/itiraz.md
- SEO + AI görünürlüğü: sunucuda sayfa gövdesi, llms.txt, /md, robots, bot sayacı — @docs/seo-ai.md
- Ajan düzeni (maliyet): Fable yalnız planlama/denetimde — @docs/ajanlar.md

## Ceza Sayfaları (`/ceza/:slug`) — trafiğin ana kaynağı
Her ceza AYRI bir arama sorgusudur ("kırmızı ışık cezası ne kadar", "hız cezası
2026"); hepsi tek listede dururken bu sorguların hiçbirinde sıralanmıyordu.
- Sayfa metni `backend/ceza_icerik.py` → `ICERIK[kod]` = `slug` + `baslik`
  (SEO H1/title) + `ozet` (özgün giriş) + `sss` (soru-cevap).
- TUTAR/PUAN BURAYA YAZILMAZ — veritabanından (CEZALAR_2026) gelir. İki yere
  yazılırsa biri mutlaka güncellenmeden kalır.
- Uçlar: `GET /api/ceza-turleri/sayfa/<slug>` (tek sayfa + ilgili), `/sayfalar` (liste).
- `server.js` bu rotaya başlık/açıklama + BreadcrumbList + FAQPage şeması basar
  (zengin sonuç). Sitemap'e ceza başına bir URL girer.
- YENİ CEZA: CEZALAR_2026'ya satır + `ceza_icerik.py`'ye aynı `kod` ile kayıt.
  Kodu `ICERIK`'te olmayan ceza listede kalır, sayfası üretilmez (zararsız).
- KOPYA İÇERİK: `/<kategori>/:sub` üst kategoriyle aynıydı → server.js 301, sitemap'te
  yok. Bu rotalara içerik verilecekse önce `CategoryPage` `:sub`'ı okumalı.

## AdSense (gelir)
`frontend/src/adsense.js` → `AD_SLOTS` TEK DOĞRU KAYNAKTIR; birim kimlikleri
oraya yazılır, sayfalara gömülmez. `<AdSlot slot={AD_SLOTS.x} />` bileşeni
kimlik BOŞKEN hiçbir şey basmaz (boş kutu, yer kayması ve politika riski yok).
- Yerleşim: `icerikIci` (ceza sayfası yazı ortası), `icerikAlti` (makale ve
  ceza sayfası yazı sonu), `listeUstu` (2026 ceza listesi üstü).
- Sayfa başına üçten fazla birim koyma; reklamı tıklanacak kadar içeriğe yakın
  yerleştirme ("Reklam" etiketi bileşende zaten var).
- index.html'deki yükleyici betik TEK BAŞINA gelir üretmez — birim şarttır.
  Site aylarca yükleyiciyle ama birimsiz yayındaydı.

## Ceza Verisi — DOĞRULUK KURALLARI (`routers/admin.py` · `routers/ceza.py`)
Site hukuki bilgi verdiği için tutarlar **tek kaynaktan** ve **tarihli** gider:
- Liste `admin.py` → `CEZALAR_2026`; `POST /api/admin/ceza-2026-yukle` ile
  veritabanına basılır ve **listede olmayan eski kodlar SİLİNİR** (7574 ile
  kaldırılan yüzde bazlı hız kademeleri gibi kayıtlar yayında kalmasın).
- Her satırda `kademe_notu` olabilir: 27.02.2026 tarihli **7574 sayılı Kanun**
  kırmızı ışık, cep telefonu, alkol ve hız cezalarını **kademeli** yaptı
  (ilk ihlal / tekrar / belge men süresi) — tek tutar yetmez, notu doldur.
  Bu cezalar SABİT tutarlıdır, yeniden değerleme oranına tabi DEĞİLDİR;
  `ceza-ydo-guncelle` ile toplu zam YAPMA (diğerleri için kullanılır).
- `CEZA_SON_DOGRULAMA` tarihi API'den döner ve liste sayfasının altında
  gösterilir. Tutar değiştirdiğinde bu tarihi de değiştir.
- **İKİ SÜREYİ KARIŞTIRMA** (`routers/ceza.py` sabitleri):
  `ODEME_SURESI_GUN = 30` → peşin ödeme %25 indirimi **1 ay** içindedir
  (31.01.2024 yönetmelik değişikliği; öncesinde 15 gündü).
  `ITIRAZ_SURESI_GUN = 15` → Sulh Ceza Hâkimliği'ne itiraz süresi 15 gündür.
  `TAKSIT_ADEDI = 4` → Kabahatler Kanunu m.17/3: ilk taksit ödeme süresinde,
  kalan 3 taksit 1 yıl içinde; taksitte indirim uygulanmaz.
- Nihai kaynak: Resmî Gazete / mevzuat.gov.tr (7574 s.K.) ve EGM listesi.
  Rehber tutarları `{{ceza:KOD}}` ile listeden gelir (docs/guncellik.md).

## SEO altyapısı
### 1) Bot görünürlüğü — `frontend/server.js` (üretimde açılış komutu)
SPA olduğu için `serve -s build` HER URL'de AYNI head'i döndürüyordu; JS
çalıştırmayan botlar (Facebook, WhatsApp, X, LinkedIn) ve paylaşım kazıyıcıları
her sayfada aynı başlığı görüyordu. `server.js` index.html'in `<head>`'ini
**istek anında** doldurur:
- rotaya özel `<title>`, description, canonical, Open Graph/Twitter, `og:image`
  (`public/og-default.png`, 1200×630)
- `/blog/:slug` ve `/dilekce-ornekleri/:slug` için veriyi API'den çeker
  (10 dk önbellek) → gerçek başlık/açıklama + `datePublished`/`dateModified`
- JSON-LD `@graph`: WebSite + Organization + BreadcrumbList + FAQPage (ana
  sayfa, `src/data/sss.json`'dan) + Article/HowTo
- bilinmeyen rota → **404 + noindex**; `?q=` arama sonuçları → **noindex**
- `/sitemap.xml` ve `/robots.txt` backend'in DİNAMİK çıktısından servis edilir
  (15 dk / 1 sa önbellek) → yeni makale yayımlanınca yeniden derleme gerekmeden
  sitemap tazelenir
- `INDEXNOW_KEY` tanımlıysa `/<anahtar>.txt` doğrulama dosyasını yayımlar
- hash'li varlıklar `immutable`, HTML `max-age=300`
KURAL: yeni rota eklerken `server.js` → `ROTALAR` tablosuna başlık/açıklama ekle,
yoksa sayfa 404+noindex alır.

### 2) İstemci tarafı — `frontend/src/seo.js`
`SITE_URL` (env `REACT_APP_SITE_URL`) + `abs('/yol')`. `<SeoDefaults>` App.js'te
render edilir; head'i **Helmet ile çakışmadan** korur: SPA gezinmesinde
canonical/og:url'i günceller, Helmet bir etiketi yazdıysa sunucunun aynı
etiketten bastığı kopyayı siler (`data-rh` işaretine bakar), og:title/description'ı
başlıkla eşitler. Veriyi geç çeken sayfalar için head'i 6 sn MutationObserver ile
izler. KURAL: sayfalara elle alan adı yazma.

### 3) Kendini güncel tutma
- **Sitemap**: `routers/sitemap.py` her istekte veritabanından üretir; `lastmod`
  değerleri gerçek `updated_at`/`created_at` tarihleridir.
- **IndexNow** (`utils/indexnow.py`): makale yayımlandığında/güncellendiğinde
  Bing-Yandex ailesine ANINDA bildirim gider (arka planda, hata uygulamayı
  etkilemez). Toplu tazeleme: `POST /api/admin/indexnow-ping`.
  `INDEXNOW_KEY` **iki servise de** aynı değerle verilmeli (frontend anahtar
  dosyasını yayımlar, backend bildirimi gönderir). Anahtar yoksa sessizce pasif.
  Google IndexNow'a katılmaz; onun için sitemap `lastmod` tazeliği çalışır.
- `frontend/scripts/build-sitemap.js` prebuild'de yedek statik sitemap yazar
  (server.js backend'e ulaşamazsa bu dosya servis edilir).

## Konvansiyonlar
- Rotalar UZANTISIZ; `.html` yok. Tüm arayüz metinleri Türkçe.
- Renk paleti: lacivert `#1a3a6b` (+`#0f2347` footer), turuncu `#e65c00`,
  arka plan `#f4f7fc`. Stiller çoğunlukla satır içi (inline style);
  paylaşılan sınıflar `App.css`'te (`.container`, `.card`, `.badge`,
  `.warning-box`, `.data-table`, `.visit-counter`).
- Her sayfada `<Helmet>` ile title/description; ana sayfada WebSite JSON-LD,
  makalede Article/HowTo JSON-LD. Yeni sayfa = SEO etiketi + sitemap satırı.
- Hukuki içeriklerin sonunda `⚖️ genel bilgilendirme amaçlıdır` uyarısı
  bulunur — yeni içerikte de koru.
- Ceza tutarları veritabanındadır (`ceza_turleri`), arayüze gömme — bkz.
  “Ceza Verisi” bölümü.
- Migration aracı yok: yeni KOLON `main.py` → `_eksik_kolonlari_ekle()` listesine
  yazılır (ALTER ... IF NOT EXISTS); tip değişimi gibi dönüşümleri elle SQL ile yap.

## Ortam değişkenleri (Railway)
Backend: `DATABASE_URL` · `JWT_SECRET` (+`JWT_ALGORITHM`, `JWT_EXPIRE_HOURS`) ·
`GEMINI_API_KEY` · `SITE_URL` (varsayılan https://www.cezarehberi.com) · `ADMIN_EMAIL` / `ADMIN_PASSWORD` ·
`VISITORS_BASE` (sayaç tabanı, varsayılan 1000) · `VISITOR_SALT` (karma tuzu;
boşsa `JWT_SECRET` kullanılır — **değiştirilirse o günün tekilliği sıfırlanır**) ·
`INDEXNOW_KEY` (isteğe bağlı) · `BOT_SAYAC_KEY` (gizli; frontend ile AYNI; AI tarayıcı sayacı) ·
`DILEKCE_SAYAC_ESIK` (varsayılan 50).
Frontend: `REACT_APP_BACKEND_URL` · `REACT_APP_SITE_URL` · `INDEXNOW_KEY`
(backend'dekiyle AYNI değer) · `BOT_SAYAC_KEY`.

## Test (commit öncesi)
- Backend söz dizimi: `python3 -m py_compile backend/main.py backend/models.py backend/routers/*.py`
- Frontend derleme: `cd frontend && CI=true npm run build` (uyarı = hata).
- SEO + AI denetimi: sunucu açıkken `cd frontend && PORT=<port> npm run seo:kontrol` (0 hata olmalı).
- Bot görünümü: `curl -A GPTBot localhost:3000/blog/<slug>` → rotaya özel `<title>`, tek canonical
  ve `#seo-static` içinde sayfa metni gelmeli (seo:kontrol bunu her sayfada denetler).
- Sayaç: API'yi Postgres'e bağlayıp `POST /api/stats/visit`'i farklı
  `X-Forwarded-For` + UA ile çağır; aynı IP+UA ikinci kez tekil ARTIRMAMALI,
  `Googlebot` UA'sı hiç saymamalı.

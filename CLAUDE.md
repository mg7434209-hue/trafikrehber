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
└── frontend/  → React 18 SPA (CRA + react-router)   (npx serve ile yayında)
```

Frontend API'ye `REACT_APP_BACKEND_URL` ile bağlanır (`src/services/api.js`);
boşsa aynı origin varsayılır. CORS backend'de `*` (çerez kullanılmaz).

## Rotalar (`frontend/src/App.js`)
`/` · `/blog` `/blog/:slug` · `/dilekce-ornekleri` `/dilekce-ornekleri/:slug` ·
`/araclar/ceza-hesapla` · `/trafik-cezalari-2026` (2026 ceza listesi) ·
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
  `GET /api/stats/public` (ana sayfa şeridi de bunu okur).
- İstemci: `VisitCounter` footer alt barına rozeti basar (`.visit-counter`
  stilleri `App.css`'te), rota değişiminde ping atar, 60 sn'de bir (sekme
  görünürken) online sayısını tazeler. **API yanıt vermezse rozet gizlenir —
  tahmini/uydurma sayı basılmaz.** Admin panelinde toplam/bugün/online kartları
  ve son 7 gün grafiği vardır.

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
  `articles-2026-guncelle` yalnız YIL ETİKETİNİ değiştirir, TUTARLARI değil —
  çalıştırdıktan sonra makale içindeki rakamları elle gözden geçir.

## SEO altyapısı
- `frontend/src/seo.js` — `SITE_URL` (env `REACT_APP_SITE_URL`, varsayılan
  `https://www.cezarehberi.com`) ve `<SeoDefaults>`: App.js'te bir kez render
  edilir, her rotaya **canonical + og:url/og:type/og:site_name/twitter:card**
  basar. KURAL: sayfalara elle alan adı yazma, `abs('/yol')` kullan.
- `frontend/scripts/build-sitemap.js` — `npm run build` öncesi (prebuild)
  çalışır: alan adının kökünü frontend servisi yayınladığı için
  `/sitemap.xml` STATİK dosyadır; betik derleme anında backend'in dinamik
  sitemap'ini çeker, ulaşamazsa statik rota listesine düşer (derlemeyi
  düşürmez). Yeni sayfa eklerken `ROTALAR` listesine de ekle.
- `frontend/public/robots.txt` `/admin` ve `/api/` engellidir.

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
boşsa `JWT_SECRET` kullanılır — **değiştirilirse o günün tekilliği sıfırlanır**).
Frontend: `REACT_APP_BACKEND_URL` · `REACT_APP_SITE_URL`.

## Test (commit öncesi)
- Backend söz dizimi: `python3 -m py_compile backend/main.py backend/models.py backend/routers/*.py`
- Frontend derleme: `cd frontend && CI=true npm run build` (uyarı = hata).
- Sayaç: API'yi Postgres'e bağlayıp `POST /api/stats/visit`'i farklı
  `X-Forwarded-For` + UA ile çağır; aynı IP+UA ikinci kez tekil ARTIRMAMALI,
  `Googlebot` UA'sı hiç saymamalı.

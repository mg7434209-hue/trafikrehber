# TrafikRehber

Trafik cezaları, sigorta, ehliyet ve araç işlemleri SEO platformu.

## Proje Yapısı

```
trafikrehber/
├── backend/          → FastAPI + PostgreSQL
└── frontend/         → React.js
```

## Railway Deploy

### 1. Backend Servisi
- Root Directory: `/backend`
- Environment Variables:
  ```
  DATABASE_URL=<Railway PostgreSQL URL>
  JWT_SECRET=<güçlü random string>
  JWT_ALGORITHM=HS256
  JWT_EXPIRE_HOURS=24
  GEMINI_API_KEY=<Google AI Studio key>
  CORS_ORIGINS=https://trafikrehber.com,https://www.trafikrehber.com,https://<frontend>.up.railway.app
  SITE_URL=https://trafikrehber.com
  ADMIN_EMAIL=admin@trafikrehber.com
  ADMIN_PASSWORD=<güçlü şifre>

  # Ziyaretçi sayacı
  VISITORS_BASE=1000       # gösterilen toplamın tabanı (varsayılan 1000; veritabanı sıfırlanırsa buradan taşınır)
  VISITOR_SALT=<random>    # tekillik karması için tuz; boşsa JWT_SECRET kullanılır
  ```

### 2. Frontend Servisi
- Root Directory: `/frontend`
- Environment Variables:
  ```
  REACT_APP_BACKEND_URL=https://<backend>.up.railway.app
  REACT_APP_SITE_URL=https://www.cezarehberi.com
  INDEXNOW_KEY=<backend ile AYNI anahtar>   # isteğe bağlı
  ```
- Start Command: `node server.js` (railway.toml'da tanımlı).
  `serve -s build` KULLANMA — bot görünürlüğü için head enjeksiyonu gerekir.

### 3. Seed Data Yükle
Backend deploy olduktan sonra:
```bash
# Railway CLI veya backend terminal üzerinden
python seed.py
```

## Domain
trafikrehber.com → Frontend Railway servisine CNAME

## Ziyaretçi Sayacı

Footer'daki rozet (`👥 1.234 ziyaretçi · 3 kişi şu an sitede`) backend'den
beslenir:

| Uç | Açıklama |
|----|----------|
| `POST /api/stats/visit` | Ziyaret bildirir. `{"sayfa":"/blog"}` → sayfa görüntülenmesi de sayılır; `{}` → yalnız "şu an sitede" tazeleme pingi. |
| `GET /api/stats/visitors` | Yalnız okuma (sayım yapmaz). |
| `GET /api/stats/public` | Site istatistikleri + ziyaretçi sayıları. |

- Tekil ziyaretçi **günde 1 kez** sayılır; kimlik yerine
  `sha256(IP + UA + gün + VISITOR_SALT)` karması saklanır — **ham IP
  kaydedilmez**, kayıtlar 7 gün sonra otomatik silinir (KVKK).
- Botlar User-Agent süzgeciyle elenir; çerez kullanılmaz.
- Gösterilen toplam = `VISITORS_BASE` + veritabanı sayacı; taban varsayılanı
  **1000**'dir, yani sayaç 1.000 ziyaretçiden başlar. Veritabanı sıfırlanırsa
  `VISITORS_BASE`'i güncel toplama çekerek sayacı taşıyın.
- Yönetim: `/admin` → toplam / bugün / şu an sitede kartları + son 7 gün grafiği.

## SEO / Görünürlük

Site bir SPA; JS çalıştırmayan botlar için `frontend/server.js` her istekte
`<head>`'i rotaya göre doldurur:

- rotaya özel başlık, açıklama, canonical, Open Graph/Twitter + `og-default.png`
- makale ve dilekçe sayfalarında veriler API'den çekilir (yayın/güncelleme tarihi
  dâhil), JSON-LD `@graph` basılır (WebSite, Organization, BreadcrumbList,
  FAQPage, Article/HowTo)
- bilinmeyen sayfa 404+noindex, `?q=` arama sonuçları noindex
- `/sitemap.xml` ve `/robots.txt` backend'in dinamik çıktısından gelir

### Kendini güncel tutma

| Mekanizma | Ne yapar |
|---|---|
| Dinamik sitemap | Her istekte veritabanından üretilir; `lastmod` gerçek güncelleme tarihi |
| IndexNow | Makale yayımlanınca Bing/Yandex'e anında bildirim (`utils/indexnow.py`) |
| `POST /api/admin/indexnow-ping` | Tüm sayfalar için toplu bildirim |
| Makalede "Güncellenme" tarihi | Okuyucuya ve `dateModified`'a tazelik sinyali |

**IndexNow kurulumu:** rastgele bir anahtar üretin
(`python3 -c "import uuid;print(uuid.uuid4().hex)"`) ve **hem backend hem
frontend** servisine `INDEXNOW_KEY` olarak girin. Frontend anahtarı
`https://www.cezarehberi.com/<anahtar>.txt` adresinde yayımlar, backend
bildirimi gönderir. Anahtar tanımlı değilse özellik sessizce kapalıdır.

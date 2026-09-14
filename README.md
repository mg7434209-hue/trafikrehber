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
  VISITORS_BASE=0          # gösterilen toplamın tabanı (veritabanı sıfırlanırsa buradan taşınır)
  VISITOR_SALT=<random>    # tekillik karması için tuz; boşsa JWT_SECRET kullanılır
  ```

### 2. Frontend Servisi
- Root Directory: `/frontend`
- Environment Variables:
  ```
  REACT_APP_BACKEND_URL=https://<backend>.up.railway.app
  REACT_APP_SITE_URL=https://trafikrehber.com
  ```

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
- Gösterilen toplam = `VISITORS_BASE` + veritabanı sayacı. Veritabanı
  sıfırlanırsa `VISITORS_BASE`'i güncel toplama çekerek sayacı taşıyın.
- Yönetim: `/admin` → toplam / bugün / şu an sitede kartları + son 7 gün grafiği.

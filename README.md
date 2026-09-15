# TrafikRehber

Türkiye'de trafik cezaları, sigorta, ehliyet ve araç işlemleri hakkında rehberler; ceza hesaplama ve kişiselleştirilebilir dilekçe araçları.

Canlı site: https://www.cezarehberi.com

## Uygulama

- `frontend/`: React 18, React Router, sayfa bazında yükleme, mobil menü ve erişilebilir formlar.
- `backend/`: FastAPI, SQLAlchemy ve PostgreSQL. Yeni `site_visitors` tablosu başlangıçta otomatik oluşturulur; mevcut tablolar ve içerikler korunur.
- Alt bölümdeki ziyaretçi sayacı sunucudaki kalıcı veritabanını kullanır.

## Ziyaretçi sayacı

Toplam = **1.000 başlangıç değeri + kaydedilen yeni tarayıcılar**. İlk kayıt 1.001 olur. Başlangıç değeri arayüzde ayrıca belirtilir; geçmişte ölçülmüş 1.000 kişi olduğu iddia edilmez.

Tarayıcı `localStorage` içinde rastgele UUID tutar. Sunucu yalnızca UUID'nin SHA-256 özetini kaydeder. Birincil anahtar kısıtı aynı kimliğin yenileme, sekme ve eşzamanlı isteklerde yeniden eklenmesini önler. IP veya cihaz parmak izi sayaçta tutulmaz. Depolama engelliyse sadece mevcut toplam gösterilir. Bağlantı hatasında sayı uydurulmaz; bağlantı gelince tekrar denenir.

Bu ölçüm doğrulanmış tekil kişi sayısı değildir: yeni cihaz, gizli pencere veya silinen tarayıcı verileri yeni kayıt oluşturabilir. Bot trafiği ve istemci tarafından yeni kimlik üretimi ayrıca filtrelenmez.

- `GET /api/stats/visitors`: toplamı okur.
- `POST /api/stats/visit`: `{ "visitor_id": "UUID-v4" }` kaydeder; istemciden toplam kabul etmez.
- `GET /api/stats/public`: içerik istatistikleri ve ziyaretçi toplamı.

## Yerel geliştirme

Python 3.12 ve Node 22 kullanın.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
cd backend
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB uvicorn main:app --reload
```

Başka terminalde:

```bash
cd frontend
npm ci
REACT_APP_BACKEND_URL=http://localhost:8000 npm start
```

Yerelde ayrı origin kullanılıyorsa backend `CORS_ORIGINS=http://localhost:3000` ayarlanmalıdır.

## Railway

Mevcut iki servis ve PostgreSQL kullanılmaya devam eder.

Backend değişkenleri:

| Değişken | Amaç |
| --- | --- |
| `DATABASE_URL` | Kalıcı PostgreSQL bağlantısı |
| `JWT_SECRET` | Güçlü, özel imzalama anahtarı |
| `ADMIN_PASSWORD` | Güçlü, özel yönetici şifresi |
| `ADMIN_EMAIL` | Yönetici adresi; varsayılan `admin@trafikrehber.com` |
| `REACT_APP_SITE_URL` | `https://www.cezarehberi.com` |
| `CORS_ORIGINS` | Gerekiyorsa virgülle ayrılmış ek origin listesi |
| `GEMINI_API_KEY` | Mevcut AI sohbet hizmetinin anahtarı |

`JWT_SECRET` veya `ADMIN_PASSWORD` yoksa ya da eski repodaki açık varsayılan değer kullanılıyorsa yönetici girişi kapalıdır (503). Public sayfalar çalışmaya devam eder. `/api/seed` ve `/api/seed-rich` artık yönetici kimlik doğrulaması gerektirir. Üretimde test/seed komutlarını çalıştırmayın.

Frontend kök dizini `frontend`, build komutu `npm ci && npm run build`, start komutu **`npm run serve`** olmalıdır (`railway.toml` içinde tanımlıdır). Railway panelinde özel Start Command varsa aynı komuta ayarlayın.

- `REACT_APP_SITE_URL=https://www.cezarehberi.com`
- `BACKEND_URL=https://trafikrehber-production.up.railway.app` sunucu proxy'si için; mevcut `REACT_APP_BACKEND_URL` de yedek olarak kullanılır.
- `REACT_APP_BACKEND_URL` tanımlıysa tarayıcı doğrudan bu API'ye gider. Tanımlı değilse aynı origin `/api/` proxy'sini kullanır.
- `PORT` Railway tarafından sağlanır.

Node sunucusu SPA rotalarını, gerçek 404 statik dosya yanıtlarını, içerik özetiyle adlandırılan derleme varlıkları için cache başlıklarını, robots.txt ve API'den gelen dinamik sitemap.xml dosyasını sunar. Google doğrulama dosyaları ve AdSense yayıncı kimliği korunmuştur. Reklam betiği yalnızca çerez kabulünden sonra yüklenir.

## Doğrulama

```bash
python -m pytest backend/tests -q
cd frontend
CI=true npm run build
```

Backend testleri normal `DATABASE_URL` değerini kullanmaz; geçici SQLite oluşturur. PostgreSQL testi için yalnızca `trafikrehber_test` adlı ayrı veritabanını gösteren `TEST_DATABASE_URL` kabul edilir. Bu test veritabanı her testte sıfırlanır.

GitHub Actions, PostgreSQL üzerinde sunucu testlerini ve izole SQLite verileriyle Chromium testlerini çalıştırır. Tarayıcı testleri sayaç tekrarlarını, depolama/bağlantı hatalarını, arama ve sayfalamayı, kategori rotalarını, HTML temizlemeyi, hesaplama yuvarlamasını, dilekçe indirmeyi, mobil taşmaları, çerez tercihlerini ve SEO çıktısını kapsar. Ekran görüntüleri workflow çıktılarında tutulur.

Mevcut veritabanındaki makaleler ve ceza tutarları bu yazılım güncellemesinde değiştirilmez veya hukuken doğrulanmış kabul edilmez. Hesaplayıcıdaki %25 sütunu koşullu bir aritmetik örnektir; ödeme tarihi ve hak sahipliği için resmi sorgulama ekranına bağlantı verilir.

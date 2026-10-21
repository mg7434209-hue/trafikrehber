# Ziyaretçi sayacı ve SEO yayın kontrolü

## Sayaç neden artmayabilir?

- Sayaç **günlük tekil ziyaretçi** sayar: aynı IP + User-Agent + gün kombinasyonu tekrar sayılmaz. Her sayfa açılışı `goruntulenme` alanında ayrı tutulur.
- Frontend'de `REACT_APP_BACKEND_URL` doğru API adresini göstermelidir. React derleme zamanı değişkenidir; Railway'de değiştirildikten sonra **frontend yeniden build/deploy** edilmelidir.
- Backend `DATABASE_URL` ile kalıcı PostgreSQL veritabanına bağlanmalıdır. `visitor_keys` ve `site_visits` tabloları mevcut olmalı; DB yazma hataları artık 503 döndürür ve backend loguna kaydedilir.
- `VISITORS_BASE=1000` yalnız başlangıç değeridir; gerçek ziyaretçi üretmez. `VISITOR_SALT` tüm backend instance'larında aynı olmalıdır.
- `GET /api/stats/visitors` yalnız okur, `POST /api/stats/visit` JSON `{"sayfa":"/"}` ziyaret kaydeder. İki uçtan dönen `toplam`, `bugun`, `goruntulenme` değerlerini karşılaştırın.
- `online` alanı uygulama belleğindedir; birden fazla backend instance'ında tutarlı küresel online sayı değildir.

## Yayın sonrası test

1. Backend `/health` 200 dönmeli.
2. `POST /api/stats/visit` yanıtı `success:true` olmalı; 503 ise Railway backend logunu ve PostgreSQL bağlantısını inceleyin.
3. Aynı ziyaretçinin ikinci isteğinde `toplam` sabit kalmalı, `goruntulenme` artmalı.
4. Yeni bir gerçek ziyaretçi/gün geldiğinde `toplam` artmalı. Botlar filtrelenir.
5. Frontend tarayıcı Network sekmesinde isteklerin doğru backend'e gittiğini doğrulayın.

## SEO ve AI görünürlüğü

- Doğrulanmış kanonik üretim alan adı: **https://www.cezarehberi.com**. `REACT_APP_SITE_URL`, backend `SITE_URL`, robots.txt, sitemap.xml, IndexNow ve Search Console aynı alan adını kullanmalı. Kök alan adından `www` sürümüne 301/308 yönlendirme yapın; Railway `REACT_APP_SITE_URL` ve backend `SITE_URL` değerlerini `https://www.cezarehberi.com` olarak ayarlayın.
- Search Console'da sitemap gönderimi, sayfa indeksleme, canonical ve Core Web Vitals raporlarını kontrol edin.
- Hukuki/para cezası içeriklerinde resmi mevzuat bağlantıları, doğrulama tarihi, yazar/editör bilgisi, kaynak ve değişiklik geçmişi sağlayın. Yanlış veya eski ceza tutarlarını otomatik yayına almayın.
- AI arama görünürlüğü için botlara erişilebilir gerçek HTML, net başlıklar, özgün soru-cevaplar, güvenilir kaynaklar ve tutarlı Organization/Article yapılandırılmış verileri önceliklendirin. Yapılandırılmış veri tek başına sıralama garantisi değildir.
- Yapay trafik/bot ziyaretleri yerine organik arama trafiği, özgün rehberler ve faydalı araçları hedefleyin.

## Bilinen sınırlama

Bu değişiklik hataların gizlenmesini düzeltir; Railway ortamı, canlı veritabanı ve canlı domain erişimi ayrıca doğrulanmadan sayacın üretimde kesin düzeldiği iddia edilemez.

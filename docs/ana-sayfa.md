# Ana sayfa (`frontend/src/pages/HomePage.js`)

> CLAUDE.md'den `@docs/ana-sayfa.md` ile içe aktarılır.

Amaç: giren kişi aradığını İLK EKRANDA bulsun. Bölüm sırası:
hero (akıllı arama + sık aranan çipler + ziyaretçi şeridi) → "Ne yapmak
istiyorsunuz?" 6 niyet kartı (hero'nun altına taşar) → "Ceza geldi mi?"
öde (1 ay, %25) / itiraz (15 gün) → en çok aranan 8 ceza → dilekçeler →
rehberler → kategoriler → hizmet durumu → resmî kaynaklar → SSS → CTA.

- AKILLI ARAMA (`components/AkilliArama.js`): yazarken 4 kaynağı birlikte
  tarar — ceza sayfaları (`/api/ceza-turleri/sayfalar`, tutarıyla),
  dilekçeler, sabit sayfalar (`SAYFALAR`), rehber yazıları
  (`/api/articles/search`, 250 ms gecikmeli). Türkçe karakter duyarsız
  (`norm()`); halk ağzı eş anlamlılar `ES` tablosunda ("radar" → hız,
  "promil" → alkol). Yeni eş anlamlı oraya yazılır. Enter seçim yoksa
  `/blog?q=` açar.
- TUTAR VE SÜRE GÖMÜLMEZ: kartlardaki tutar, erken ödeme tutarı, puan ve
  "30 gün / 15 gün / %25" `/api/ceza-turleri` yanıtından gelir
  (`odeme_suresi_gun`, `itiraz_suresi_gun`, `indirim_orani`). API yoksa
  ceza bölümü hiç çizilmez; süre kartı yasal metni (1 ay / 15 gün) yazar.
- `POPULER` / `CIPLER` yalnız SLUG listesidir; slug `ceza_icerik.py`'de
  değişirse burayı da güncelle (eşleşmeyen slug sessizce düşer).
- Niyet kartı `yazi` adayları öne çıkan rehberlerde varsa o yazıya, yoksa
  `href`'e ya da `/blog?q=` aramasına gider — kırık bağlantı oluşmaz.
- ZİYARETÇİ ŞERİDİ (`components/ZiyaretciSeridi.js`): "Bugün X kişi ·
  Toplam Y ziyaretçi · N kişi şu an sitede". Veriyi footer `VisitCounter`
  yayınlar (`src/ziyaretci.js`, `ziyaretci:veri` olayı) — sayım TEK yerde
  yapılır, şerit ikinci POST atmaz. API yoksa şerit görünmez.
- "Bugün" Türkiye günüdür (`stats.py` `tr_bugun()`, UTC+3). `date.today()`
  sunucu (UTC) gününü verir; gece 00:00–03:00 arası ziyaretler önceki güne
  yazılıyordu.
- Stiller `App.css` sonunda `hm-*` (sayfa), `ak-*` (arama), `hz-*` (şerit).
  Genel mobil kuralı `section{padding … !important}` hero'nun taşma payını
  yemesin diye `.hm-hero`/`.hm-niyet` kendi `!important`'larını taşır.
- Başlık/açıklama `<Helmet>` ile server.js `ROTALAR['/']` AYNI olmalı
  (botlar sunucununkini, tarayıcı Helmet'inkini görür).
- Ölçüm: 1280 px ve 390 px'te yatay taşma 0, 390 px'te ilk ekranda arama +
  ziyaretçi şeridi + ilk 3 niyet kartı görünür.

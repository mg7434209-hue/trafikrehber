# Kendiliğinden güncel kalma (yıl etiketi · tutarlar · rehberler)

> CLAUDE.md'den `@docs/guncellik.md` ile içe aktarılır.

Sitede yıl ve tutar ELLE YAZILMAZ; tek kaynaktan türetilir. Yıl değişince ya
da ceza listesi güncellenince sayfalar, başlıklar ve rehberler birlikte değişir.

## Tek kaynak: ceza listesi + doğrulama tarihi
- `backend/routers/admin.py` → `CEZALAR_2026` (tutarlar), `CEZA_SON_DOGRULAMA`
  (tarih), `CEZA_DAYANAK` ("tutarlar şuna göredir" cümlesi).
- VERİ YILI = `CEZA_SON_DOGRULAMA`'nın yılı (`utils/icerik.py veri_yili()`).
  TAKVİM YILI DEĞİLDİR: 1 Ocak'ta yeniden değerleme ile tutarlar değişir;
  liste doğrulanmadan başlığa yeni yılı yazmak "2027 güncel" deyip eski tutarı
  göstermek olur. Yeni yıl listesi işlenip tarih ilerletilince bütün etiketler
  kendiliğinden geçer.
- `GET /api/ceza-turleri/guncellik` → `veri_yili`, `son_dogrulama`, `gun_once`,
  `dayanak`, `uyari`. Takvim yılı veri yılını geçtiyse ya da doğrulama 120
  günden eskiyse `uyari` dolar → admin paneli "Genel" sekmesinde kırmızı kart.

## Yıl etiketinin yolculuğu
- Backend metinleri: `{{yil}}` (ceza_icerik.py başlıkları, makale_icerik.py).
- frontend `server.js`: `{YIL}` (ROTALAR); değeri `/guncellik`'ten saatte bir
  okur, bot başlıklarına basar ve HTML'e `window.__VERI_YILI__` yazar.
- React: `src/yil.js` → `YIL`. Koda "2026" yazma.
- SABİT KALANLAR: rota adresi `/trafik-cezalari-2026` (yayınlanmış URL) ve
  yasal tarihler ("27.02.2026 tarihli 7574 sayılı Kanun"), `sss.json`'daki
  tarihli olgular.

## Rehber metinleri (`backend/makale_icerik.py`)
- Yer tutucular (`utils/icerik.py`): `{{yil}}` `{{ceza:H10}}`
  `{{indirimli:H1}}` `{{puan:H1}}` `{{not:H7}}` `{{odeme_gun}}` `{{itiraz_gun}}`
  `{{indirim}}` `{{taksit}}` `{{son_dogrulama}}` `{{tablo}}` (tüm cezalar).
  API yanıtında doldurulur (60 sn önbellek); tanınmayan yer tutucu silinir.
  Admin paneli HAM metni gösterir; admin'den yazılan yazıda da kullanılabilir.
- `{{puan:…}}` yalnız puanı veritabanında dolu cezalarda (H1, H4) kullanılır.
- AÇILIŞ EŞİTLEMESİ (`esitle()`): yazı yoksa eklenir; `icerik_surumu` koddaki
  `SURUM`'dan farklıysa metin buradan yazılır, `updated_at` ilerler (sitemap
  lastmod) ve IndexNow bildirilir. Sürüm aynıysa DOKUNULMAZ (admin düzeltmesi
  korunur). Metni değiştirince `SURUM`'u ilerlet.
- `meta_description` kolonu 160 karakterdir; aşan yazı eşitlenmez (log).
- `/api/seed` ve `/api/seed-rich` bu slug'lara dokunmaz.
- TAŞINAN ADRES: `eski: [...]` → eski kayıt yeniden adlandırılır ya da
  yayından kalkar; `routers/articles.py ESKI_SLUG` + `server.js ESKI_BLOG`
  (301) AYNI tabloyu taşır. Slug'da yıl kullanma.

## Sitemap lastmod dürüstlüğü
`Article.updated_at` `onupdate=now()` taşır; eskiden her okunmada görüntülenme
sayacı artarken tarih de "bugün" oluyordu. Sayaç artık `updated_at`'i açıkça
koruyan tek UPDATE ile artar; lastmod yalnız içerik değişince ilerler.

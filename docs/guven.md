# Güven sinyalleri (E-E-A-T), iletişim formu, ortak sayfa metni

> CLAUDE.md'den `@docs/guven.md` ile içe aktarılır.

## Tek marka, tek yazar
- Marka "CezaRehberi". Yazılar "CezaRehberi Editörlüğü" adıyla çıkar (`Article.author`
  varsayılanı; `main.py _yazar_duzelt()` eski "hukuk ekibi" kayıtlarını açılışta düzeltir).
  Sahte uzman/avukat adı YAZILMAZ. Gerçek avukat gözden geçirmesi olursa ad + baro bilgisiyle eklenir.
- Her makale "Kaynaklar" bölümüyle biter (`makale_icerik.py _kaynaklar()`); sayfada
  "yazar · okuma süresi · Güncellenme" satırı görünür. İçerik değişince `SURUM` ilerletilir.

## Hakkımızda / İletişim / Gizlilik
- Metin `frontend/src/data/sayfalar.json`: React (`SayfaBloklari`) ve `prerender.js` AYNI
  dosyayı okur. Blok türleri h2/p/ul/uyari; `{YIL}`, `**kalın**`, `[metin](/yol)`.
- "Ne yapmıyoruz" bölümü (hukuki danışmanlık/resmî kurum değiliz) ve düzeltme politikası
  KALIR. Veri sorumlusu satırı gizlilik ve iletişimde aynıdır.
- `server.js` Organization şeması: logo, publishingPrinciples (/hakkimizda#editoryal),
  AboutPage/ContactPage; e-posta varsa contactPoint.

## İletişim formu
- `POST /api/iletisim` (`routers/iletisim.py`): konu listesi, 10–2000 karakter, honeypot
  (`web`) ve `gecen_ms<2000` sessizce atılır, günde 5 gönderim sınırı (IP karması; ham IP
  YOK). Kayıtlar 12 ay sonra silinir. Sohbet geçmişi 90 gün.
- Yönetici: Admin → Mesajlar sekmesi (okundu işaretle / sil, okunmamış sayısı rozet).
  KVKK başvuruları 30 gün içinde yanıtlanmalıdır — formu düzenli kontrol et.
- `src/data/iletisim.json` `eposta`: boşken e-posta gösterilmez; gerçek adres yazılırsa
  sayfaya, prerender'a ve contactPoint şemasına kendiliğinden girer.

## Ceza ekleme kuralı (doğrulama)
Yeni ceza yalnız en az iki bağımsız kaynakta aynı tutarla bulunur ve 2025 tabanı ×1,2549
hesabıyla (ya da 7574 s.K. metniyle) tutarsa eklenir. 02.11.2026 taramasında emniyet şeridi
(11.630 ₺ mı 20.000 ₺ mı), yaya geçidi (5.662 ₺ mı 11.629 ₺ mı), takip mesafesi, ters yön
ve şerit ihlali için kaynaklar ÇELİŞTİ — eklenmedi. Resmî Gazete 7574 s.K. metni ya da EGM
tablosu elde edilince yeniden dene.

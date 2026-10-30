# İtiraz yolculuğu, dilekçe oluşturucu, avukat ve hız hesaplama

> CLAUDE.md'den `@docs/itiraz.md` ile içe aktarılır.

## `/itiraz` — "Haksız ceza aldım" (`pages/ItirazPage.js`)
Sıra: süre → gerekçe → öde mi? → dilekçe → nereye başvurulur → sonrası →
avukat → SSS. `?ceza=<slug>` cezayı seçili açar; ceza sayfalarının itiraz
kutusu ve hız aracı bu adresle gelir. Menüde turuncu "İtiraz Et" düğmesidir.
- SÜRE (`src/sure.js`): itiraz = tebliğ + 15 GÜN (Kabahatler K. m.27); son gün
  hafta sonu ya da SABİT resmî tatilse ilk iş gününe kayar (CMK m.39). Dinî
  bayramlar hesaplanmaz, sayfa uyarır. İndirimli ödeme = tebliğ + 1 AY,
  kaydırılmaz. 15/30/%25 API'den gelir (`/api/ceza-turleri`).
- VERİ `src/data/itiraz.json`: `gerekceler` (dilekçeye giren hukuki metin +
  kanıt önerisi + güç rozeti), `zayif`, `sss`. server.js aynı dosyanın `sss`
  alanından FAQPage basar (`ROTALAR['/itiraz'].sss`). Gerekçe metninde kesin
  sonuç vaat etme ("ceza iptal edilir" değil, "hukuka aykırıdır").
- Ret sonrası: karara 7 gün içinde itiraz (KK m.29, CMK m.268); merci kararda
  yazar. Harç alınmaz; posta gideri istenebilir. UYAP Vatandaş: e-imza veya
  mobil imza gerekir (yalnız e-Devlet şifresi yetmeyebilir).

## Dilekçe oluşturucu (`components/DilekceOlusturucu.js`)
- KVKK: ad, T.C. no, adres, telefon YALNIZ tarayıcıda işlenir — form verisi
  ağa, localStorage'a ve analitiğe GİTMEZ (Playwright testi ağ trafiğinde T.C.
  no arar). Tek istek dilekçe sayacıdır ve yalnız eylem türünü taşır.
- Çıktı: önizleme, yazdır/PDF (yeni pencere), Word (.doc = HTML blob),
  kopyala. Başlık "<İL> NÖBETÇİ SULH CEZA HÂKİMLİĞİ'NE". Madde metni
  `kanun_maddesi`'nden ("KTK " öneki atılır). Ödedim seçiliyse KK m.17/6 +
  iade talebi ve "Ödeme dekontu" eki girer.

## Dilekçe sayacı (`components/DilekceSayaci.js` · `routers/stats.py`)
- "X kişi itiraz dilekçesini CezaRehberi'nde hazırladı": ana sayfa ve /itiraz
  hero'su. GERÇEK sayı: oluşturucu ve şablon sayfasındaki yazdır/indir/kopyala
  (`dilekceSay(tur)`), kişi başı günde 1 (`dilekce_keys` karma, 7 gün), bot ve
  headless sayılmaz. TABAN YOK — şişirilemez.
- `DILEKCE_SAYAC_ESIK` (env, varsayılan 50) altında `goster:false` → bileşen
  hiçbir şey çizmez. Admin "Genel" kartı sayıyı her zaman gösterir.
- POST gövdesi YALNIZ `{"tur": …}`; form verisi bu çağrıya eklenmez (test eder).

## Avukat yönlendirme (`src/avukat.js` · `components/AvukatDestegi.js`)
- `AVUKATLAR` BOŞKEN avukat adı basılmaz; kutu "ne zaman avukat gerekir +
  baro + adli yardım bürosu" anlatır. Ad + baro + sicil no olmayan satır
  gösterilmez. Uydurma avukat/iletişim YAZILMAZ.
- HUKUKİ SINIR: Avukatlık K. m.55 (iş simsarlığı) — müvekkil başına ücret ya
  da komisyon alınamaz; kartta reklam dili ("en iyi", "garanti") olmaz.
  Ziyaretçi verisi formla toplanıp avukata aktarılmaz; iletişim doğrudan
  avukatın kanalındandır (WhatsApp/telefon/e-posta).

## Hız cezası hesaplama (`/araclar/hiz-cezasi-hesapla` · `pages/HizCezasiPage.js`)
- Kademeler TEK KAYNAK: `backend/routers/admin.py HIZ_KADEMELERI` (KTK m.51,
  7574 s.K.) → `GET /api/ceza-turleri/hiz-kademeleri`. Sayfaya tutar yazılmaz.
  Şehir içi 6 km/s, şehir dışı 11 km/s aşımdan itibaren ceza; 46/51+ km/s'de
  belge 30/60/90 gün geri alınır. Kademe değişirse H2/H3 `kademe_notu` ve
  `src/data/hiz.json` SSS'ini de güncelle.
- Ceza listesi DB'ye `ceza-2026-yukle` ile basılır: `kademe_notu` değişikliği
  canlıya admin "2026 Değerlerini Yükle" düğmesiyle geçer.

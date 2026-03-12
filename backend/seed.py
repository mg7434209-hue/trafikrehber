"""
Seed data - başlangıç makaleleri, dilekçe şablonları ve ceza türleri
Çalıştırma: python seed.py
"""
import sys
sys.path.append('.')

from database import SessionLocal, engine, Base
from models import Article, DilecceSablon, CezaTuru
import uuid

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# CEZA TÜRLERİ
ceza_turleri = [
    {"kod": "H1", "aciklama": "Kırmızı ışık ihlali", "taban_ceza_tl": 3956, "puan": 10, "kanun_maddesi": "KTK Madde 47/1-a"},
    {"kod": "H2", "aciklama": "Hız sınırı ihlali (%10-30 arası)", "taban_ceza_tl": 2637, "puan": 5, "kanun_maddesi": "KTK Madde 51/1-a"},
    {"kod": "H3", "aciklama": "Hız sınırı ihlali (%30-50 arası)", "taban_ceza_tl": 3956, "puan": 10, "kanun_maddesi": "KTK Madde 51/1-b"},
    {"kod": "H4", "aciklama": "Emniyet kemeri takmama (sürücü)", "taban_ceza_tl": 1318, "puan": 5, "kanun_maddesi": "KTK Madde 70/1"},
    {"kod": "H5", "aciklama": "Cep telefonu kullanımı (el ile)", "taban_ceza_tl": 2637, "puan": 10, "kanun_maddesi": "KTK Madde 65/a"},
    {"kod": "H6", "aciklama": "Park ihlali", "taban_ceza_tl": 659, "puan": 0, "kanun_maddesi": "KTK Madde 61"},
    {"kod": "H7", "aciklama": "Alkollü araç kullanımı (0.51-1.00 promil)", "taban_ceza_tl": 7913, "puan": 20, "kanun_maddesi": "KTK Madde 48/5"},
    {"kod": "H8", "aciklama": "Sollama ihlali", "taban_ceza_tl": 2637, "puan": 10, "kanun_maddesi": "KTK Madde 52"},
    {"kod": "H9", "aciklama": "Zorunlu sigorta yaptırmama", "taban_ceza_tl": 3956, "puan": 0, "kanun_maddesi": "KTK Madde 91"},
    {"kod": "H10", "aciklama": "Araç muayenesi yaptırmama", "taban_ceza_tl": 1318, "puan": 0, "kanun_maddesi": "KTK Madde 35"},
]

for c in ceza_turleri:
    existing = db.query(CezaTuru).filter(CezaTuru.kod == c["kod"]).first()
    if not existing:
        db.add(CezaTuru(**c))

# MAKALELER
articles = [
    {
        "slug": "trafik-cezasi-itiraz-nasil-yapilir",
        "title": "Trafik Cezasına İtiraz Nasıl Yapılır? (2025 Güncel Rehber)",
        "meta_description": "Trafik cezasına itiraz nasıl yapılır? Adım adım itiraz süreci, dilekçe örneği, hangi mahkemeye başvurulur — 2025 güncel bilgi.",
        "content": """<h2>Trafik Cezasına İtiraz Hakkınız</h2>
<p>Türk Karayolları Trafik Kanunu'na göre, bir trafik cezasına tebliğden itibaren <strong>15 gün içinde</strong> itiraz etme hakkınız bulunmaktadır. Bu süre içinde itiraz etmezseniz ceza kesinleşir.</p>

<h2>İtiraz Süreci Adım Adım</h2>
<h3>1. Adım: Ceza Tutanağını İnceleyin</h3>
<p>Ceza tutanağında; cezanın türü, tarihi, yeri, araç plakası ve uygulayan memur bilgilerini kontrol edin. Hatalı bilgi varsa itiraz gerekçenizin temelini oluşturabilir.</p>

<h3>2. Adım: İtiraz Dilekçesi Hazırlayın</h3>
<p>İtiraz dilekçesinde şunlar bulunmalıdır: itiraz gerekçeniz, tutanak bilgileri, ek belgeler (varsa). Sayfamızdaki <strong>ücretsiz dilekçe şablonunu</strong> kullanabilirsiniz.</p>

<h3>3. Adım: Sulh Ceza Hâkimliğine Başvurun</h3>
<p>İtiraz dilekçenizi, cezanın kesildiği yerdeki Sulh Ceza Hâkimliği'ne vermeniz gerekmektedir. E-Devlet üzerinden de başvuru yapılabilmektedir.</p>

<h2>İtiraz Süresi</h2>
<p>Ceza tutanağının tebliğ tarihinden itibaren <strong>15 gün</strong> içinde itiraz edilmelidir. Bu süre kaçırılırsa ceza kesinleşir ve itiraz hakkı kaybolur.</p>

<h2>Dikkat Edilmesi Gerekenler</h2>
<ul>
<li>İtiraz süreci boyunca ceza askıya alınır</li>
<li>İtirazınız reddedilirse cezayı ödemeniz gerekir</li>
<li>Hukuki destek için trafik avukatına başvurabilirsiniz</li>
</ul>

<p><em>⚖️ Bu içerik genel bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez.</em></p>""",
        "category": "ceza",
        "tags": ["itiraz", "trafik cezası", "dilekçe", "sulh ceza"],
        "is_published": True,
        "is_featured": True,
        "reading_time_min": 5,
        "schema_type": "HowTo",
    },
    {
        "slug": "trafik-cezasi-sorgulama-e-devlet",
        "title": "Trafik Cezası Sorgulama — E-Devlet ve SMS ile Sorgulama",
        "meta_description": "Trafik cezanızı e-devlet üzerinden, SMS ile veya GİB portalı üzerinden nasıl sorgulayacağınızı öğrenin.",
        "content": """<h2>Trafik Cezası Nasıl Sorgulanır?</h2>
<p>Trafik cezanızı öğrenmek için birden fazla yöntem mevcuttur.</p>

<h2>E-Devlet ile Sorgulama</h2>
<p>En kolay ve hızlı yöntem e-devlet üzerinden sorgulamadır:</p>
<ol>
<li>e-devlet.gov.tr adresine giriş yapın</li>
<li>Arama kutusuna "trafik cezası" yazın</li>
<li>"Trafik İdari Para Cezası Sorgulama" hizmetini seçin</li>
<li>TC Kimlik numaranız ile sorgulayın</li>
</ol>

<h2>SMS ile Sorgulama</h2>
<p>TC Kimlik numaranızı 5340 numaralı hatta SMS olarak gönderererek ceza sorgulama yapabilirsiniz.</p>

<h2>GİB (Gelir İdaresi Başkanlığı) ile Ödeme</h2>
<p>Cezanızı gib.gov.tr veya e-devlet üzerinden kredi kartı ile ödeyebilirsiniz.</p>

<p><em>⚖️ Bu içerik genel bilgilendirme amaçlıdır.</em></p>""",
        "category": "ceza",
        "tags": ["sorgulama", "e-devlet", "trafik cezası", "ödeme"],
        "is_published": True,
        "is_featured": True,
        "reading_time_min": 3,
        "schema_type": "HowTo",
    },
    {
        "slug": "zorunlu-trafik-sigortasi-rehberi",
        "title": "Zorunlu Trafik Sigortası (Trafik Sigortası) — 2025 Kapsamlı Rehber",
        "meta_description": "Zorunlu trafik sigortası nedir, ne zaman yaptırılır, teminatlar nelerdir? 2025 yılı güncel bilgiler.",
        "content": """<h2>Zorunlu Trafik Sigortası Nedir?</h2>
<p>Zorunlu Mali Sorumluluk Sigortası (trafik sigortası), motorlu araç işletmekten doğacak zararları karşılamak amacıyla yasal olarak zorunlu tutulan bir sigorta türüdür.</p>

<h2>Kapsam</h2>
<ul>
<li>Üçüncü şahıslara verilen bedensel zararlar (ölüm, yaralanma)</li>
<li>Üçüncü şahısların araçlarına ve eşyalarına verilen maddi zararlar</li>
</ul>

<h2>Sigorta Olmadan Araç Kullanmak</h2>
<p>Geçerli trafik sigortası olmadan araç kullanmak hem idari para cezasına hem de trafik cezasına neden olur.</p>

<h2>Poliçe Yenileme</h2>
<p>Trafik sigortanız yıllık olarak yenilenir. Poliçe bitiş tarihinizden önce yenilemeniz gerekmektedir.</p>

<p><em>⚖️ Bu içerik genel bilgilendirme amaçlıdır.</em></p>""",
        "category": "sigorta",
        "tags": ["trafik sigortası", "zorunlu sigorta", "poliçe"],
        "is_published": True,
        "is_featured": True,
        "reading_time_min": 6,
        "schema_type": "Article",
    },
    {
        "slug": "ehliyet-puan-sistemi-sorgulama",
        "title": "Ehliyet Puan Sistemi — Puanınızı Nasıl Sorgularsınız?",
        "meta_description": "Ehliyet puan sistemi nasıl çalışır? Kaç puan düşürülüyor, puanınızı nasıl sorgularsınız? Eksi puana düşünce ne olur?",
        "content": """<h2>Ehliyet Puan Sistemi Nedir?</h2>
<p>Türkiye'de 100 puan üzerinden çalışan ehliyet puan sistemi, trafik ihlallerinde sürücülerin puanlarını düşürmektedir. Puan 0'a düşünce ehliyet iptal edilir.</p>

<h2>Hangi İhlalde Kaç Puan Düşülür?</h2>
<table>
<tr><th>İhlal</th><th>Puan</th></tr>
<tr><td>Kırmızı ışık ihlali</td><td>-10</td></tr>
<tr><td>Alkollü araç kullanımı</td><td>-20</td></tr>
<tr><td>Hız ihlali (%10-30)</td><td>-5</td></tr>
<tr><td>Emniyet kemeri takmama</td><td>-5</td></tr>
</table>

<h2>Puan Nasıl Sorgulanır?</h2>
<p>E-devlet'te "Sürücü Puan Durumu Sorgulama" hizmetini kullanabilirsiniz.</p>

<h2>Puan 0'a Düşünce Ne Olur?</h2>
<p>Puanınız 0'a düşerse ehliyetiniz geçici olarak iptal edilir ve trafik eğitimine gitmeniz gerekir.</p>

<p><em>⚖️ Bu içerik genel bilgilendirme amaçlıdır.</em></p>""",
        "category": "ehliyet",
        "tags": ["ehliyet puan", "sorgulama", "puan sistemi"],
        "is_published": True,
        "is_featured": True,
        "reading_time_min": 4,
        "schema_type": "Article",
    },
    {
        "slug": "arac-muayene-randevu-nasil-alinir",
        "title": "Araç Muayene Randevusu Nasıl Alınır? (2025)",
        "meta_description": "Araç muayene randevusu nasıl alınır? TÜVTÜRK, e-devlet veya telefon ile randevu alma rehberi.",
        "content": """<h2>Araç Muayenesi Zorunlu mu?</h2>
<p>Evet. Tüm motorlu taşıtların belirli aralıklarla araç muayenesini yaptırması yasal zorunluluktur.</p>

<h2>Muayene Süreleri</h2>
<ul>
<li>Otomobiller: İlk 3 yıl muaf, sonra 2 yılda bir</li>
<li>6 yaş üstü araçlar: Her yıl</li>
<li>Ticari araçlar: Her yıl</li>
</ul>

<h2>TÜVTÜRK ile Randevu</h2>
<ol>
<li>tuv-turk.com.tr adresine gidin</li>
<li>"Randevu Al" butonuna tıklayın</li>
<li>Plaka ve TC kimlik numaranızı girin</li>
<li>Uygun tarih ve istasyonu seçin</li>
</ol>

<h2>Muayenesiz Araç Kullanmanın Cezası</h2>
<p>Geçerli muayenesi olmayan araçla yakalanırsanız idari para cezası uygulanır ve aracınız trafikten men edilebilir.</p>

<p><em>⚖️ Bu içerik genel bilgilendirme amaçlıdır.</em></p>""",
        "category": "arac-islemleri",
        "tags": ["araç muayene", "TÜVTÜRK", "randevu"],
        "is_published": True,
        "is_featured": True,
        "reading_time_min": 4,
        "schema_type": "HowTo",
    },
]

for a in articles:
    existing = db.query(Article).filter(Article.slug == a["slug"]).first()
    if not existing:
        db.add(Article(**a))

# DİLEKÇE ŞABLONLARI
sablonlar = [
    {
        "slug": "trafik-cezasi-itiraz-dilekce-ornegi",
        "baslik": "Trafik Cezasına İtiraz Dilekçesi Örneği",
        "aciklama": "Trafik cezasına Sulh Ceza Hâkimliği'ne itiraz için kullanılacak dilekçe şablonu.",
        "kategori": "itiraz",
        "ilgili_kanun": "KTK Madde 116 / CMK Madde 261",
        "sablon_icerik": """SULH CEZA HÂKİMLİĞİ'NE
[ŞEHİR ADI]

İTİRAZ EDEN       : [AD SOYAD]
TC KİMLİK NO      : [TC KİMLİK NUMARASI]
ADRES             : [AÇIK ADRES]
TELEFON           : [TELEFON NUMARASI]

KONU              : [TARİH] tarihli, [TUTANAK NO] numaralı trafik cezasına itirazım hakkında.

AÇIKLAMALAR       :

[TARİH] tarihinde [KONUM/YER] da/de aracıma [CEZA TÜRÜ] gerekçesiyle idari para cezası uygulanmıştır.

Söz konusu cezaya aşağıdaki gerekçelerle itiraz etmekteyim:

1. [İTİRAZ GEREKÇENİZ - Örnek: "Söz konusu tarihte belirtilen konumda bulunmadığımı araç kamerası kaydı ile ispatlayabilirim."]

2. [İKİNCİ GEREKÇENİZ VARSA BURAYA YAZIN]

EK BELGELER       :
- Ehliyet fotokopisi
- [VARSA DİĞER BELGELER]

SONUÇ VE İSTEM    : Yukarıda açıklanan nedenlerle, haksız ve hukuka aykırı olduğunu değerlendirdiğim trafik cezasının iptaline karar verilmesini saygılarımla arz ederim. [TARİH]

İtiraz Eden
[AD SOYAD]
[İMZA]

---
⚖️ UYARI: Bu şablon örnek amaçlıdır. Kendi durumunuza göre düzenleyin.
Hukuki danışmanlık için avukata başvurunuz.""",
    },
    {
        "slug": "trafik-sigortasi-hasar-ihbar-dilekce",
        "baslik": "Trafik Sigortası Hasar İhbar Dilekçesi",
        "aciklama": "Trafik kazası sonrasında sigorta şirketine hasar bildirimi için kullanılacak dilekçe.",
        "kategori": "sigorta",
        "ilgili_kanun": "Sigortacılık Kanunu / KTK Madde 97",
        "sablon_icerik": """[SİGORTA ŞİRKETİ ADI] GENEL MÜDÜRLÜĞÜ'NE

BAŞVURAN          : [AD SOYAD]
TC KİMLİK NO      : [TC KİMLİK NUMARASI]
POLİÇE NO         : [POLİÇE NUMARASI]
ADRES             : [AÇIK ADRES]
TELEFON           : [TELEFON NUMARASI]

KONU              : Hasar ihbarı ve tazminat talebi hakkında.

AÇIKLAMALAR       :

[TARİH] tarihinde saat [SAAT]'te [KAZA YERİ] konumunda meydana gelen trafik kazası nedeniyle araçımda/şahsımda hasar oluşmuştur.

Kaza Bilgileri:
- Kaza Tarihi ve Saati: [TARİH] / [SAAT]
- Kaza Yeri: [ADRES]
- Karşı Taraf Plakası: [PLAKA]
- Kaza Tutanak No: [TUTANAK NO]

Hasarın kapsamlı olarak değerlendirilmesini ve tarafıma tazminat ödenmesini talep etmekteyim.

EK BELGELER:
- Kaza tespit tutanağı
- Fotoğraflar
- Ehliyet ve ruhsat fotokopisi

[TARİH]
[AD SOYAD]
[İMZA]

---
⚖️ Bu şablon örnek amaçlıdır. Durumunuza göre düzenleyiniz.""",
    },
    {
        "slug": "ehliyet-iptal-itiraz-dilekce",
        "baslik": "Ehliyet İptaline İtiraz Dilekçesi",
        "aciklama": "Ehliyetin iptal edilmesi kararına idare mahkemesinde itiraz için şablon.",
        "kategori": "ehliyet",
        "ilgili_kanun": "KTK Madde 6 / İYUK Madde 2",
        "sablon_icerik": """[İL] İDARE MAHKEMESİ'NE

DAVACI            : [AD SOYAD]
TC KİMLİK NO      : [TC KİMLİK NUMARASI]
ADRES             : [AÇIK ADRES]
VEKİL             : [VARSA AVUKAT ADI ve BARO NO]

DAVALI            : [İl] Emniyet Müdürlüğü / Trafik Denetleme Şubesi

KONU              : [TARİH] tarihli ehliyet iptal işleminin iptali talebi.

AÇIKLAMALAR       :

[TARİH] tarihinde tarafıma tebliğ edilen [KARAR NO] sayılı karar ile sürücü belgem iptal edilmiştir.

Bu kararın iptali talep edilmektedir. Zira:
1. [İPTAL GEREKÇESİNİN HUKUKA AYKIRILIK NEDENİ]
2. [VARSA DİĞER GEREKÇE]

HUKUKİ DAYANAK    : KTK Md. 6, İYUK Md. 2

SONUÇ VE İSTEM    : Söz konusu işlemin iptaline ve yargılama giderlerinin davalıya yüklenmesine karar verilmesini saygılarımla arz ederim. [TARİH]

Davacı
[AD SOYAD]
[İMZA]

---
⚖️ Bu şablon örnek amaçlıdır. Avukata danışmanız önerilir.""",
    },
]

for s in sablonlar:
    existing = db.query(DilecceSablon).filter(DilecceSablon.slug == s["slug"]).first()
    if not existing:
        db.add(DilecceSablon(**s))

db.commit()
db.close()
print("✅ Seed data başarıyla yüklendi!")
print(f"  - {len(ceza_turleri)} ceza türü")
print(f"  - {len(articles)} makale")
print(f"  - {len(sablonlar)} dilekçe şablonu")

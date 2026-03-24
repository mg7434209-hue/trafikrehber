

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
import os

from database import engine, Base
from routers import articles, dilekce, ceza, admin, chat, sitemap, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrafikRehber API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(articles.router, prefix="/api/articles", tags=["Makaleler"])
app.include_router(dilekce.router, prefix="/api/dilekce", tags=["Dilekçeler"])
app.include_router(ceza.router, prefix="/api/ceza-turleri", tags=["Ceza Türleri"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["AI Chat"])
app.include_router(sitemap.router, tags=["SEO"])
app.include_router(stats.router, prefix="/api/stats", tags=["İstatistikler"])

@app.get("/")
def root():
    return {"status": "ok", "service": "TrafikRehber API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

# ── Google Search Console Doğrulama ──────────────────────
@app.get("/google26e8a302ff887c04.html", response_class=PlainTextResponse)
async def google_verify():
    return "google-site-verification: google26e8a302ff887c04.html"

@app.get("/google32637b0bab066255.html", response_class=PlainTextResponse)
async def google_verify():
    return "google-site-verification: google32637b0bab066255.html"
# ─────────────────────────────────────────────────────────

@app.post("/api/seed")
def run_seed():
    from database import SessionLocal
    from models import Article, DilecceSablon, CezaTuru
    db = SessionLocal()
    results = {"ceza": 0, "articles": 0, "dilekce": 0}
    for c in [
        {"kod":"H1","aciklama":"Kırmızı ışık ihlali","taban_ceza_tl":3956,"puan":10,"kanun_maddesi":"KTK Madde 47/1-a"},
        {"kod":"H2","aciklama":"Hız sınırı ihlali (%10-30)","taban_ceza_tl":2637,"puan":5,"kanun_maddesi":"KTK Madde 51/1-a"},
        {"kod":"H3","aciklama":"Hız sınırı ihlali (%30-50)","taban_ceza_tl":3956,"puan":10,"kanun_maddesi":"KTK Madde 51/1-b"},
        {"kod":"H4","aciklama":"Emniyet kemeri takmama","taban_ceza_tl":1318,"puan":5,"kanun_maddesi":"KTK Madde 70/1"},
        {"kod":"H5","aciklama":"Cep telefonu kullanımı","taban_ceza_tl":2637,"puan":10,"kanun_maddesi":"KTK Madde 65/a"},
        {"kod":"H6","aciklama":"Park ihlali","taban_ceza_tl":659,"puan":0,"kanun_maddesi":"KTK Madde 61"},
        {"kod":"H7","aciklama":"Alkollü araç kullanımı","taban_ceza_tl":7913,"puan":20,"kanun_maddesi":"KTK Madde 48/5"},
        {"kod":"H8","aciklama":"Sollama ihlali","taban_ceza_tl":2637,"puan":10,"kanun_maddesi":"KTK Madde 52"},
        {"kod":"H9","aciklama":"Zorunlu sigorta yaptırmama","taban_ceza_tl":3956,"puan":0,"kanun_maddesi":"KTK Madde 91"},
        {"kod":"H10","aciklama":"Araç muayenesi yaptırmama","taban_ceza_tl":1318,"puan":0,"kanun_maddesi":"KTK Madde 35"},
    ]:
        if not db.query(CezaTuru).filter(CezaTuru.kod == c["kod"]).first():
            db.add(CezaTuru(**c)); results["ceza"] += 1
    for a in [
        {"slug":"trafik-cezasi-itiraz-nasil-yapilir","title":"Trafik Cezasına İtiraz Nasıl Yapılır? (2025)","meta_description":"Trafik cezasına itiraz adım adım rehber.","content":"<h2>İtiraz Hakkınız</h2><p>Tebliğden itibaren <strong>15 gün içinde</strong> Sulh Ceza Hâkimliği'ne itiraz edebilirsiniz.</p>","category":"ceza","tags":["itiraz","trafik cezası"],"is_published":True,"is_featured":True,"reading_time_min":5,"schema_type":"HowTo"},
        {"slug":"trafik-cezasi-sorgulama-e-devlet","title":"Trafik Cezası Sorgulama — E-Devlet Rehberi","meta_description":"E-devlet ile trafik cezası sorgulama nasıl yapılır?","content":"<h2>E-Devlet ile Sorgulama</h2><ol><li>e-devlet.gov.tr'ye girin</li><li>TC ile sorgulayın</li></ol>","category":"ceza","tags":["sorgulama","e-devlet"],"is_published":True,"is_featured":True,"reading_time_min":3,"schema_type":"HowTo"},
        {"slug":"zorunlu-trafik-sigortasi-rehberi","title":"Zorunlu Trafik Sigortası — 2025 Rehber","meta_description":"Zorunlu trafik sigortası hakkında kapsamlı bilgi.","content":"<h2>Zorunlu Trafik Sigortası</h2><p>Tüm araçlar için yasal zorunluluktur.</p>","category":"sigorta","tags":["sigorta"],"is_published":True,"is_featured":True,"reading_time_min":6,"schema_type":"Article"},
        {"slug":"ehliyet-puan-sistemi-sorgulama","title":"Ehliyet Puan Sistemi Sorgulama Rehberi","meta_description":"Ehliyet puan sistemi ve sorgulama rehberi.","content":"<h2>Ehliyet Puan Sistemi</h2><p>100 puan üzerinden işler.</p>","category":"ehliyet","tags":["ehliyet puan"],"is_published":True,"is_featured":True,"reading_time_min":4,"schema_type":"Article"},
        {"slug":"arac-muayene-randevu-nasil-alinir","title":"Araç Muayene Randevusu Nasıl Alınır?","meta_description":"TÜVTÜRK üzerinden araç muayene randevusu alma rehberi.","content":"<h2>Muayene Zorunluluğu</h2><p>Tüm araçlar için yasal zorunluluktur.</p>","category":"arac-islemleri","tags":["muayene"],"is_published":True,"is_featured":True,"reading_time_min":4,"schema_type":"HowTo"},
    ]:
        if not db.query(Article).filter(Article.slug == a["slug"]).first():
            db.add(Article(**a)); results["articles"] += 1
    for s in [
        {"slug":"trafik-cezasi-itiraz-dilekce-ornegi","baslik":"Trafik Cezasına İtiraz Dilekçesi","aciklama":"Sulh Ceza Hâkimliği'ne itiraz dilekçesi şablonu.","kategori":"itiraz","ilgili_kanun":"KTK Madde 116","sablon_icerik":"SULH CEZA HÂKİMLİĞİ'NE\n[ŞEHİR]\n\nİTİRAZ EDEN: [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"trafik-sigortasi-hasar-ihbar-dilekce","baslik":"Sigorta Hasar İhbar Dilekçesi","aciklama":"Sigorta şirketine hasar bildirimi dilekçesi.","kategori":"sigorta","ilgili_kanun":"Sigortacılık Kanunu","sablon_icerik":"[SİGORTA ŞİRKETİ]'NE\n\nBAŞVURAN: [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"ehliyet-iptal-itiraz-dilekce","baslik":"Ehliyet İptaline İtiraz Dilekçesi","aciklama":"Ehliyet iptali kararına itiraz dilekçesi.","kategori":"ehliyet","ilgili_kanun":"KTK Madde 6","sablon_icerik":"[İL] İDARE MAHKEMESİ'NE\n\nDAVACI: [AD SOYAD]\n\n⚖️ Avukata danışmanız önerilir."},
    ]:
        if not db.query(DilecceSablon).filter(DilecceSablon.slug == s["slug"]).first():
            db.add(DilecceSablon(**s)); results["dilekce"] += 1
    db.commit(); db.close()
    return {"success": True, "seeded": results}


@app.post("/api/seed-rich")
def run_rich_seed():
    from database import SessionLocal
    from models import Article, DilecceSablon
    db = SessionLocal()
    results = {"articles_added": 0, "articles_updated": 0, "dilekce_added": 0, "dilekce_updated": 0}
    AF = {'slug','title','meta_description','content','category','tags','is_published','is_featured','reading_time_min','schema_type','author'}
    DF = {'slug','baslik','aciklama','sablon_icerik','kategori','ilgili_kanun','premium'}
    articles = [
        {"slug":"trafik-cezasi-itiraz-nasil-yapilir","title":"Trafik Cezasına İtiraz Nasıl Yapılır? (2025 Güncel Rehber)","meta_description":"Trafik cezasına itiraz nasıl yapılır? 15 günlük süre, Sulh Ceza Hâkimliği başvurusu ve dilekçe örneği.","category":"ceza","tags":["itiraz","trafik cezası","sulh ceza"],"reading_time_min":8,"schema_type":"HowTo","is_published":True,"is_featured":True,"content":"<h2>Trafik Cezasına İtiraz Hakkınız</h2><p>Tebliğden itibaren <strong>15 gün içinde</strong> Sulh Ceza Hâkimliği'ne itiraz edebilirsiniz.</p><h2>İtiraz Adımları</h2><ol><li>Tutanağı inceleyin</li><li>Gerekçenizi belirleyin</li><li>Dilekçe hazırlayın</li><li>Sulh Ceza Hâkimliği'ne başvurun</li></ol><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Genel bilgilendirme amaçlıdır.</div>"},
        {"slug":"trafik-cezasi-tutarlari-2025","title":"2025 Trafik Cezası Tutarları — Güncel Tam Liste","meta_description":"2025 yılı güncel trafik cezası tutarları. Hız ihlali, kırmızı ışık, emniyet kemeri — tablolu liste.","category":"ceza","tags":["ceza tutarları","2025","hız ihlali"],"reading_time_min":6,"schema_type":"Article","is_published":True,"is_featured":True,"content":"<h2>2025 Trafik Cezası Tutarları</h2><p><strong>15 gün içinde ödemede %25 indirim</strong> uygulanır.</p><table border='1' style='border-collapse:collapse;width:100%'><tr style='background:#1e3a5f;color:white'><th style='padding:8px'>İhlal</th><th>Taban Ceza</th><th>%25 İndirimli</th></tr><tr><td style='padding:8px'>Kırmızı ışık</td><td>3.956 TL</td><td>2.967 TL</td></tr><tr style='background:#f9f9f9'><td style='padding:8px'>Hız (%10-30)</td><td>2.637 TL</td><td>1.978 TL</td></tr></table><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ 2025 yeniden değerleme oranına göre güncellenmiştir.</div>"},
        {"slug":"trafik-cezasi-e-devlet-sorgulama","title":"Trafik Cezası E-Devlet Sorgulama ve Ödeme Rehberi 2025","meta_description":"E-devlet üzerinden trafik cezası sorgulama ve ödeme rehberi.","category":"ceza","tags":["sorgulama","e-devlet","ödeme"],"reading_time_min":5,"schema_type":"HowTo","is_published":True,"is_featured":True,"content":"<h2>E-Devlet ile Sorgulama</h2><ol><li>e-devlet.gov.tr adresine gidin</li><li>TC Kimlik ile giriş yapın</li><li>'Trafik İdari Para Cezası Sorgulama' aratın</li></ol><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Genel bilgilendirme amaçlıdır.</div>"},
        {"slug":"ehliyet-puan-sistemi-sorgulama","title":"Ehliyet Puan Sistemi — Sorgulama ve Puan Yenileme 2025","meta_description":"Ehliyet puan sistemi nasıl çalışır?","category":"ehliyet","tags":["ehliyet puan","sorgulama"],"reading_time_min":7,"schema_type":"Article","is_published":True,"is_featured":True,"content":"<h2>Ehliyet Puan Sistemi</h2><p><strong>100 puan</strong> üzerinden işler. Puan 0'a düşünce ehliyet geçici iptal edilir.</p><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ EGM resmi sitesini inceleyiniz.</div>"},
        {"slug":"zorunlu-trafik-sigortasi-rehberi","title":"Zorunlu Trafik Sigortası (ZMSS) — 2025 Rehber","meta_description":"Zorunlu trafik sigortası nedir, neleri karşılar?","category":"sigorta","tags":["trafik sigortası","ZMSS"],"reading_time_min":8,"schema_type":"Article","is_published":True,"is_featured":True,"content":"<h2>Zorunlu Trafik Sigortası Nedir?</h2><p>Tüm araçlar için yasal zorunluluktur.</p><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Poliçe detayları için sigorta şirketinizle görüşün.</div>"},
        {"slug":"trafik-kazasi-sonrasi-ne-yapilir","title":"Trafik Kazası Sonrası Ne Yapılır? Adım Adım Rehber","meta_description":"Trafik kazasında ilk adımlar, tutanak doldurma ve sigorta bildirimi rehberi.","category":"ceza","tags":["trafik kazası","kaza tutanağı"],"reading_time_min":8,"schema_type":"HowTo","is_published":True,"is_featured":True,"content":"<h2>İlk 5 Dakika</h2><ol><li>Dörtlü flaşörü yakın</li><li>Yaralı varsa 112 arayın</li><li>155 arayın</li></ol><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Ağır kazalarda avukat desteği alınız.</div>"},
        {"slug":"arac-muayene-randevu-nasil-alinir","title":"Araç Muayenesi — TÜVTÜRK Randevu ve Ceza 2025","meta_description":"TÜVTÜRK randevu alma, muayene periyotları ve 2025 ceza tutarları.","category":"arac-islemleri","tags":["araç muayene","TÜVTÜRK"],"reading_time_min":7,"schema_type":"HowTo","is_published":True,"is_featured":True,"content":"<h2>Muayene Zorunlu mu?</h2><p>Evet. Muayenesiz araç: <strong>1.318 TL ceza + araç men.</strong></p><h2>Randevu</h2><p>tuv-turk.com.tr veya <strong>444 0 886</strong></p><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Güncel bilgi için TÜVTÜRK sitesini inceleyiniz.</div>"},
        {"slug":"kasko-sigortasi-nedir-kapsamlari","title":"Kasko Sigortası Nedir? 2025","meta_description":"Kasko nedir, neleri karşılar?","category":"sigorta","tags":["kasko","tam kasko"],"reading_time_min":7,"schema_type":"Article","is_published":True,"is_featured":False,"content":"<h2>Kasko Nedir?</h2><p>Kendi aracınıza gelen hasarları karşılar. <strong>İsteğe bağlıdır.</strong></p><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Poliçeniz için sigorta şirketinizle görüşün.</div>"},
        {"slug":"ehliyet-sinavi-nasil-girilir","title":"Ehliyet Sınavına Nasıl Girilir? 2025","meta_description":"Ehliyet başvurusu, sürücü kursu ve sınav aşamaları 2025.","category":"ehliyet","tags":["ehliyet sınavı","sürücü kursu"],"reading_time_min":7,"schema_type":"HowTo","is_published":True,"is_featured":False,"content":"<h2>Gerekenler</h2><ul><li>Min. 18 yaş</li><li>Sağlık raporu</li><li>MEB onaylı sürücü kursu</li></ul><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Güncel bilgi için MEB ile iletişime geçin.</div>"},
        {"slug":"arac-plaka-tescil-islemleri","title":"Araç Tescil ve İkinci El Devir İşlemleri 2025","meta_description":"Araç tescili ve ikinci el devir işlemleri rehberi 2025.","category":"arac-islemleri","tags":["araç tescil","araç devri"],"reading_time_min":6,"schema_type":"HowTo","is_published":True,"is_featured":False,"content":"<h2>İkinci El Araç Devri</h2><ol><li>Noterden devir</li><li>Yeni trafik sigortası</li><li>Tescil şubesinde ruhsat güncelleme</li></ol><div style='background:#fff8e6;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0'>⚖️ Harç tutarları için tescil şubenize başvurun.</div>"},
    ]
    dilekce_sablonlari = [
        {"slug":"trafik-cezasi-itiraz-dilekce-ornegi","baslik":"Trafik Cezasına İtiraz Dilekçesi Örneği","aciklama":"Sulh Ceza Hâkimliği'ne itiraz için resmi dilekçe şablonu.","kategori":"itiraz","ilgili_kanun":"KTK Madde 116","sablon_icerik":"SULH CEZA HÂKİMLİĞİ'NE\n[ŞEHİR ADI]\n\nİTİRAZ EDEN: [AD SOYAD]\nTC KİMLİK NO: [TC]\n\nKONU: [TARİH] tarihli cezaya itiraz.\n\nSONUÇ: Cezanın iptalini arz ederim.\n[TARİH] - [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"trafik-sigortasi-hasar-ihbar-dilekce","baslik":"Trafik Sigortası Hasar Bildirim Dilekçesi","aciklama":"Sigorta şirketine resmi hasar ihbarı için dilekçe şablonu.","kategori":"sigorta","ilgili_kanun":"Sigortacılık Kanunu Md. 30","sablon_icerik":"[SİGORTA ŞİRKETİ] GENEL MÜDÜRLÜĞÜ'NE\n\nBAŞVURAN: [AD SOYAD]\nPOLİÇE NO: [NO]\n\nHasarımın tazmin edilmesini talep ederim.\n[TARİH] - [AD SOYAD]\n\n⚖️ Poliçe kapsamı için sigorta şirketinizle görüşün."},
        {"slug":"ehliyet-iptal-itiraz-dilekce","baslik":"Ehliyet İptali Kararına İtiraz Dilekçesi","aciklama":"Sürücü belgesi iptali kararına idare mahkemesinde itiraz dilekçesi.","kategori":"ehliyet","ilgili_kanun":"KTK Madde 6 / İYUK Madde 2","sablon_icerik":"[İL] İDARE MAHKEMESİ BAŞKANLIĞI'NA\n\nDAVACI: [AD SOYAD]\nDAVALI: [İL] İl Emniyet Müdürlüğü\n\nEhliyet iptal işleminin iptali talep edilmektedir.\n[TARİH] - [AD SOYAD]\n\n⚖️ Mutlaka avukattan destek alın."},
        {"slug":"arac-cekme-itiraz-dilekce","baslik":"Araç Çekme Kararına İtiraz Dilekçesi","aciklama":"Aracın çekilmesi veya trafikten men kararına itiraz dilekçesi.","kategori":"itiraz","ilgili_kanun":"KTK Madde 78","sablon_icerik":"[İL] TRAFİK ŞUBE MÜDÜRLÜĞÜ'NE\n\nBAŞVURAN: [AD SOYAD]\nARAÇ PLAKASI: [PLAKA]\n\nAracımın iadesini talep ederim.\n[TARİH] - [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"kaza-tazminat-talep-dilekce","baslik":"Trafik Kazası Tazminat Talep Dilekçesi","aciklama":"Sigorta şirketinden tazminat talep etmek için resmi dilekçe.","kategori":"sigorta","ilgili_kanun":"KTK Madde 97 / BK Madde 49","sablon_icerik":"[SİGORTA ŞİRKETİ] GENEL MÜDÜRLÜĞÜ'NE\n\nTALEP EDEN: [AD SOYAD]\nIBAN: [IBAN]\n\n30 gün içinde ödeme yapılmasını talep ederim.\n[TARİH] - [AD SOYAD]\n\n⚖️ Yüksek tutarlarda avukat desteği önerilir."},
    ]
    for a in articles:
        clean = {k: v for k, v in a.items() if k in AF}
        existing = db.query(Article).filter(Article.slug == clean["slug"]).first()
        if existing:
            for k, v in clean.items(): setattr(existing, k, v)
            results["articles_updated"] += 1
        else:
            db.add(Article(**clean)); results["articles_added"] += 1
    for s in dilekce_sablonlari:
        clean = {k: v for k, v in s.items() if k in DF}
        existing = db.query(DilecceSablon).filter(DilecceSablon.slug == clean["slug"]).first()
        if existing:
            for k, v in clean.items(): setattr(existing, k, v)
            results["dilekce_updated"] += 1
        else:
            db.add(DilecceSablon(**clean)); results["dilekce_added"] += 1
    db.commit(); db.close()
    return {"success": True, "results": results}

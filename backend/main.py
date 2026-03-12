from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
        {"slug":"trafik-cezasi-itiraz-nasil-yapilir","title":"Trafik Cezasına İtiraz Nasıl Yapılır? (2025)","meta_description":"Trafik cezasına itiraz adım adım rehber.","content":"<h2>İtiraz Hakkınız</h2><p>Tebliğden itibaren <strong>15 gün içinde</strong> Sulh Ceza Hâkimliği'ne itiraz edebilirsiniz.</p><h2>İtiraz Adımları</h2><ol><li>Tutanağı inceleyin</li><li>Dilekçe hazırlayın</li><li>Sulh Ceza Hâkimliği'ne başvurun</li></ol><p><em>⚖️ Genel bilgilendirme amaçlıdır.</em></p>","category":"ceza","tags":["itiraz","trafik cezası"],"is_published":True,"is_featured":True,"reading_time_min":5,"schema_type":"HowTo"},
        {"slug":"trafik-cezasi-sorgulama-e-devlet","title":"Trafik Cezası Sorgulama — E-Devlet Rehberi","meta_description":"E-devlet ile trafik cezası sorgulama nasıl yapılır?","content":"<h2>E-Devlet ile Sorgulama</h2><ol><li>e-devlet.gov.tr'ye girin</li><li>'Trafik Cezası Sorgulama' aratın</li><li>TC ile sorgulayın</li></ol><p><em>⚖️ Genel bilgilendirme amaçlıdır.</em></p>","category":"ceza","tags":["sorgulama","e-devlet"],"is_published":True,"is_featured":True,"reading_time_min":3,"schema_type":"HowTo"},
        {"slug":"zorunlu-trafik-sigortasi-rehberi","title":"Zorunlu Trafik Sigortası — 2025 Rehber","meta_description":"Zorunlu trafik sigortası hakkında kapsamlı bilgi.","content":"<h2>Zorunlu Trafik Sigortası</h2><p>Tüm araçlar için yasal zorunluluktur. Üçüncü şahıslara verilen zararları karşılar.</p><p><em>⚖️ Genel bilgilendirme amaçlıdır.</em></p>","category":"sigorta","tags":["sigorta"],"is_published":True,"is_featured":True,"reading_time_min":6,"schema_type":"Article"},
        {"slug":"ehliyet-puan-sistemi-sorgulama","title":"Ehliyet Puan Sistemi Sorgulama Rehberi","meta_description":"Ehliyet puan sistemi ve sorgulama rehberi.","content":"<h2>Ehliyet Puan Sistemi</h2><p>100 puan üzerinden işler. Puan 0'a düşünce ehliyet iptal edilir. E-devlet'ten sorgulanabilir.</p><p><em>⚖️ Genel bilgilendirme amaçlıdır.</em></p>","category":"ehliyet","tags":["ehliyet puan"],"is_published":True,"is_featured":True,"reading_time_min":4,"schema_type":"Article"},
        {"slug":"arac-muayene-randevu-nasil-alinir","title":"Araç Muayene Randevusu Nasıl Alınır?","meta_description":"TÜVTÜRK üzerinden araç muayene randevusu alma rehberi.","content":"<h2>Muayene Zorunluluğu</h2><p>Tüm araçlar için yasal zorunluluktur. tuv-turk.com.tr üzerinden randevu alınabilir.</p><p><em>⚖️ Genel bilgilendirme amaçlıdır.</em></p>","category":"arac-islemleri","tags":["muayene"],"is_published":True,"is_featured":True,"reading_time_min":4,"schema_type":"HowTo"},
    ]:
        if not db.query(Article).filter(Article.slug == a["slug"]).first():
            db.add(Article(**a)); results["articles"] += 1

    for s in [
        {"slug":"trafik-cezasi-itiraz-dilekce-ornegi","baslik":"Trafik Cezasına İtiraz Dilekçesi","aciklama":"Sulh Ceza Hâkimliği'ne itiraz dilekçesi şablonu.","kategori":"itiraz","ilgili_kanun":"KTK Madde 116","sablon_icerik":"SULH CEZA HÂKİMLİĞİ'NE\n[ŞEHİR]\n\nİTİRAZ EDEN: [AD SOYAD]\nTC: [TC KİMLİK]\n\nKONU: Trafik cezasına itiraz.\n\n[GEREKÇE]\n\nCezanın iptalini arz ederim.\n[TARİH] - [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"trafik-sigortasi-hasar-ihbar-dilekce","baslik":"Sigorta Hasar İhbar Dilekçesi","aciklama":"Sigorta şirketine hasar bildirimi dilekçesi.","kategori":"sigorta","ilgili_kanun":"Sigortacılık Kanunu","sablon_icerik":"[SİGORTA ŞİRKETİ]'NE\n\nBAŞVURAN: [AD SOYAD]\nPOLİÇE: [POLİÇE NO]\n\n[TARİH] tarihli kazada hasar oluşmuştur. Tazminat talep ederim.\n\n[TARİH] - [AD SOYAD]\n\n⚖️ Örnek amaçlıdır."},
        {"slug":"ehliyet-iptal-itiraz-dilekce","baslik":"Ehliyet İptaline İtiraz Dilekçesi","aciklama":"Ehliyet iptali kararına itiraz dilekçesi.","kategori":"ehliyet","ilgili_kanun":"KTK Madde 6","sablon_icerik":"[İL] İDARE MAHKEMESİ'NE\n\nDAVACI: [AD SOYAD]\n\nEhliyet iptal işleminin iptali talep edilmektedir.\n\n[TARİH] - [AD SOYAD]\n\n⚖️ Avukata danışmanız önerilir."},
    ]:
        if not db.query(DilecceSablon).filter(DilecceSablon.slug == s["slug"]).first():
            db.add(DilecceSablon(**s)); results["dilekce"] += 1

    db.commit()
    db.close()
    return {"success": True, "seeded": results}

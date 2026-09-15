from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Article, DilecceSablon, CezaTuru, PageStat, SiteVisit
from utils.auth import create_token, require_admin
from utils import indexnow
import os
import re

router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@trafikrehber.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "trafikrehber2026!")


# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def admin_login(req: LoginRequest):
    if req.email != ADMIN_EMAIL or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Hatalı giriş bilgileri")
    token = create_token({"email": req.email, "is_admin": True})
    return {"success": True, "token": token}


# --- Makaleler ---
class ArticleCreate(BaseModel):
    slug: str
    title: str
    meta_description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = "genel"
    tags: Optional[List[str]] = []
    is_published: Optional[bool] = False
    is_featured: Optional[bool] = False
    reading_time_min: Optional[int] = 5
    author: Optional[str] = "TrafikRehber Hukuk Ekibi"
    featured_image_url: Optional[str] = None
    schema_type: Optional[str] = "Article"

@router.post("/articles")
def create_article(data: ArticleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(Article).filter(Article.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu slug zaten kullanılıyor")
    article = Article(**data.dict())
    db.add(article)
    db.commit()
    # Yeni yayımlanan içeriği arama motorlarına bildir (anahtar yoksa sessizce atlanır)
    if article.is_published:
        indexnow.bildir([f"/blog/{article.slug}", "/blog", "/"])
    return {"success": True, "id": str(article.id), "indexnow": indexnow.etkin()}

@router.put("/articles/{article_id}")
def update_article(article_id: str, data: ArticleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(article, key, value)
    db.commit()
    if article.is_published:
        indexnow.bildir([f"/blog/{article.slug}"])
    return {"success": True, "indexnow": indexnow.etkin()}

@router.delete("/articles/{article_id}")
def delete_article(article_id: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    db.delete(article)
    db.commit()
    return {"success": True}


# --- TOPLU 2025 → 2026 GÜNCELLEME ---
@router.post("/articles-2026-guncelle")
def articles_2026_guncelle(db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    Tüm makalelerde title, meta_description ve content içinde
    geçen '2025' ifadelerini '2026' ile değiştirir.
    Slug'lara dokunmaz (SEO linkleri korunur).

    DİKKAT: Bu uç yalnız YIL ETİKETİNİ değiştirir, ceza TUTARLARINI değiştirmez.
    Çalıştırdıktan sonra makale içindeki tutarları elle gözden geçir; aksi hâlde
    "2026" başlıklı ama eski tutarlı içerik yayında kalır.
    """
    articles = db.query(Article).all()
    guncellenen = 0
    detay = []

    for a in articles:
        degisti = False

        # title
        if a.title and "2025" in a.title:
            a.title = a.title.replace("2025", "2026")
            degisti = True

        # meta_description
        if a.meta_description and "2025" in a.meta_description:
            a.meta_description = a.meta_description.replace("2025", "2026")
            degisti = True

        # content (HTML içinde)
        if a.content and "2025" in a.content:
            a.content = a.content.replace("2025", "2026")
            degisti = True

        if degisti:
            guncellenen += 1
            detay.append({"slug": a.slug, "yeni_baslik": a.title})

    db.commit()
    return {
        "success": True,
        "guncellenen_makale": guncellenen,
        "detay": detay
    }


# --- Dilekçeler ---
class DilekceCreate(BaseModel):
    slug: str
    baslik: str
    aciklama: Optional[str] = None
    sablon_icerik: Optional[str] = None
    kategori: Optional[str] = "genel"
    premium: Optional[bool] = False
    ilgili_kanun: Optional[str] = None

@router.post("/dilekce")
def create_dilekce(data: DilekceCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    sablon = DilecceSablon(**data.dict())
    db.add(sablon)
    db.commit()
    return {"success": True, "id": str(sablon.id)}

@router.put("/dilekce/{sablon_id}")
def update_dilekce(sablon_id: str, data: DilekceCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    sablon = db.query(DilecceSablon).filter(DilecceSablon.id == sablon_id).first()
    if not sablon:
        raise HTTPException(status_code=404, detail="Şablon bulunamadı")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(sablon, key, value)
    db.commit()
    return {"success": True}


# --- Ceza Türleri ---
class CezaCreate(BaseModel):
    kod: str
    aciklama: str
    taban_ceza_tl: float
    puan: Optional[int] = 0
    kanun_maddesi: Optional[str] = None

class CezaUpdate(BaseModel):
    aciklama: Optional[str] = None
    taban_ceza_tl: Optional[float] = None
    puan: Optional[int] = None
    kanun_maddesi: Optional[str] = None
    kademe_notu: Optional[str] = None

@router.post("/ceza-turleri")
def create_ceza(data: CezaCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ceza = CezaTuru(**data.dict())
    db.add(ceza)
    db.commit()
    return {"success": True, "id": str(ceza.id)}

@router.put("/ceza-turleri/{ceza_id}")
def update_ceza(ceza_id: str, data: CezaUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ceza = db.query(CezaTuru).filter(CezaTuru.id == ceza_id).first()
    if not ceza:
        raise HTTPException(status_code=404, detail="Ceza türü bulunamadı")
    ALLOWED = {"aciklama", "taban_ceza_tl", "puan", "kanun_maddesi", "kademe_notu"}
    for key, value in data.dict(exclude_unset=True).items():
        if key in ALLOWED:
            setattr(ceza, key, value)
    db.commit()
    return {"success": True}

@router.get("/ceza-listesi")
def get_ceza_listesi(db: Session = Depends(get_db), _=Depends(require_admin)):
    cezalar = db.query(CezaTuru).order_by(CezaTuru.taban_ceza_tl.desc()).all()
    return {
        "success": True,
        "cezalar": [{
            "id": str(c.id),
            "kod": c.kod,
            "aciklama": c.aciklama,
            "taban_ceza_tl": float(c.taban_ceza_tl),
            "puan": c.puan,
            "kanun_maddesi": c.kanun_maddesi,
            "kademe_notu": c.kademe_notu,
        } for c in cezalar]
    }


# --- YDO ile toplu ceza güncelleme ---
class YdoRequest(BaseModel):
    oran: float  # örn: 25.49

@router.post("/ceza-ydo-guncelle")
def ceza_ydo_guncelle(req: YdoRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    if req.oran <= 0 or req.oran > 200:
        raise HTTPException(status_code=400, detail="Geçersiz oran")
    cezalar = db.query(CezaTuru).all()
    carpan = 1 + (req.oran / 100)
    for c in cezalar:
        c.taban_ceza_tl = round(float(c.taban_ceza_tl) * carpan, 2)
    db.commit()
    return {"success": True, "guncellenen": len(cezalar), "carpan": carpan}


# --- 2026 ceza değerleri yükle ---
#
# KAYNAK / DURUM (son doğrulama: 14.09.2026)
#   27.02.2026 tarihli 7574 sayılı Kanun, KTK'nın ceza maddelerini köklü
#   değiştirdi: kırmızı ışık, cep telefonu, alkol ve hız cezaları artık
#   KADEMELİ ve SABİT tutarlıdır (yeniden değerleme oranına tabi değildir).
#   Yüzde bazlı (%10-30 / %30-50 / %50+) hız kademeleri KALDIRILDI; yerine
#   km/s bazlı 9 kademe geldi. Diğer ihlaller 2026 yeniden değerleme oranıyla
#   (%25,49) güncellenen KTK tutarlarıdır.
#   Tutarlar ikincil kaynaklardan (hukuk büroları, sigorta şirketleri, basın)
#   çapraz doğrulandı; NİHAİ KAYNAK Resmî Gazete/mevzuat.gov.tr'deki 7574
#   sayılı Kanun metni ve EGM listesidir. Değişiklikte bu listeyi güncelle,
#   CEZA_SON_DOGRULAMA tarihini de birlikte değiştir.
CEZA_SON_DOGRULAMA = "2026-09-14"

CEZALAR_2026 = [
    {"kod": "H1", "aciklama": "Kırmızı ışık ihlali", "taban_ceza_tl": 5000.0, "puan": 20,
     "kanun_maddesi": "KTK m.47 (7574 s.K. ile değişik)",
     "kademe_notu": "Kademeli ceza: ilk ihlal 5.000 ₺; aynı yıl içinde tekrarında 10.000 ₺ · 15.000 ₺ · 20.000 ₺ · 30.000 ₺. 6. ihlalde 80.000 ₺ ve sürücü belgesi iptali. 3. ihlalden itibaren belge 30/60/90 gün geri alınır."},

    {"kod": "H2", "aciklama": "Hız sınırı aşımı — yerleşim yeri içi", "taban_ceza_tl": 2000.0, "puan": 0,
     "kanun_maddesi": "KTK m.51 (7574 s.K. ile değişik)",
     "kademe_notu": "7574 ile yüzde bazlı kademeler (%10-30 / %30-50 / %50+) KALDIRILDI. Ceza aşılan km/s'ye göre 9 kademede 2.000 ₺'den 30.000 ₺'ye kadar uygulanır; yerleşim yeri içinde tolerans 5 km/s'dir (6 km/s aşımdan itibaren ceza)."},

    {"kod": "H3", "aciklama": "Hız sınırı aşımı — yerleşim yeri dışı / otoyol", "taban_ceza_tl": 2000.0, "puan": 0,
     "kanun_maddesi": "KTK m.51 (7574 s.K. ile değişik)",
     "kademe_notu": "Tolerans 10 km/s. Kademeler: 11-15 km/s 2.000 ₺ · 16-20 km/s 4.000 ₺ · 21-25 km/s 6.000 ₺ · 26-30 km/s 8.000 ₺ · 31-40 km/s 12.000 ₺ · 41-50 km/s 15.000 ₺; üst kademelerde 30.000 ₺'ye kadar ve sürücü belgesine el koyma."},

    {"kod": "H5", "aciklama": "Seyir hâlinde cep telefonu kullanma", "taban_ceza_tl": 5000.0, "puan": 0,
     "kanun_maddesi": "KTK m.73 (7574 s.K. ile değişik)",
     "kademe_notu": "Kademeli ceza: ilk ihlal 5.000 ₺, tekrarında 10.000 ₺, 3. ve sonraki ihlallerde 20.000 ₺. Her ihlalde sürücü belgesine 30 gün el konulur."},

    {"kod": "H7", "aciklama": "Alkollü araç kullanma (0,50 promil üstü)", "taban_ceza_tl": 25000.0, "puan": 0,
     "kanun_maddesi": "KTK m.48 (7574 s.K. ile değişik)",
     "kademe_notu": "Kademeli ceza: 1. ihlal 25.000 ₺ + 6 ay belge geri alma, 2. ihlal 50.000 ₺ + 2 yıl, 3. ve sonraki ihlaller 150.000 ₺ + sürücü belgesi iptali."},

    {"kod": "H12", "aciklama": "Trafikte saldırgan davranış", "taban_ceza_tl": 180000.0, "puan": 0,
     "kanun_maddesi": "7574 s.K.",
     "kademe_notu": "Araçtan inerek diğer sürücünün üzerine yürüme, taciz amaçlı ısrarlı takip gibi davranışlar. Sürücü belgesine el koyma da uygulanır."},

    {"kod": "H13", "aciklama": "Drift / makas / trafikte yarış", "taban_ceza_tl": 58218.0, "puan": 0,
     "kanun_maddesi": "KTK m.67 (7574 s.K. ile değişik)",
     "kademe_notu": "Para cezasına ek olarak sürücü belgesi geri alınır ve araç trafikten men edilebilir."},

    {"kod": "H11", "aciklama": "Ehliyetsiz araç kullanma", "taban_ceza_tl": 23437.0, "puan": 0,
     "kanun_maddesi": "KTK m.36",
     "kademe_notu": "Araç trafikten men edilir; tekrarı hâlinde tutar katlanır ve adli süreç gündeme gelebilir."},

    {"kod": "H8", "aciklama": "Yasak yerde sollama", "taban_ceza_tl": 2721.0, "puan": 0,
     "kanun_maddesi": "KTK m.54", "kademe_notu": None},

    {"kod": "H10", "aciklama": "Muayenesiz araç kullanma", "taban_ceza_tl": 2721.0, "puan": 0,
     "kanun_maddesi": "KTK m.34",
     "kademe_notu": "Muayene süresi geçen araç trafikten men edilebilir; gecikme için ayrıca aylık gecikme zammı alınır."},

    {"kod": "H4", "aciklama": "Emniyet kemeri takmama", "taban_ceza_tl": 1246.0, "puan": 10,
     "kanun_maddesi": "KTK m.78", "kademe_notu": None},

    {"kod": "H14", "aciklama": "Kask takmama (motosiklet)", "taban_ceza_tl": 1246.0, "puan": 0,
     "kanun_maddesi": "KTK m.78", "kademe_notu": None},

    {"kod": "H6", "aciklama": "Hatalı / yasak park", "taban_ceza_tl": 1246.0, "puan": 0,
     "kanun_maddesi": "KTK m.61",
     "kademe_notu": "Yaya geçidi, engelli rampası gibi yerlerde araç çekilebilir; çekme ve otopark ücreti ayrıca ödenir."},

    {"kod": "H9", "aciklama": "Zorunlu trafik sigortası yaptırmama", "taban_ceza_tl": 1246.0, "puan": 0,
     "kanun_maddesi": "KTK m.91",
     "kademe_notu": "Sigortasız araç trafikten men edilir; poliçe yapılana kadar trafiğe çıkarılamaz."},
]

@router.post("/ceza-2026-yukle")
def ceza_2026_yukle(db: Session = Depends(get_db), _=Depends(require_admin)):
    """2026 (7574 sayılı Kanun sonrası) ceza listesini yükler.

    Listede olmayan ESKİ kodlar silinir — 7574 ile kaldırılan yüzde bazlı hız
    kademeleri gibi kayıtlar veritabanında kalıp yanlış bilgi göstermesin.
    """
    eklenen = 0
    guncellenen = 0
    ALLOWED = {"aciklama", "taban_ceza_tl", "puan", "kanun_maddesi", "kademe_notu"}
    for item in CEZALAR_2026:
        existing = db.query(CezaTuru).filter(CezaTuru.kod == item["kod"]).first()
        if existing:
            clean = {k: v for k, v in item.items() if k in ALLOWED}
            for k, v in clean.items():
                setattr(existing, k, v)
            guncellenen += 1
        else:
            db.add(CezaTuru(**{k: v for k, v in item.items() if k in ALLOWED | {"kod"}}))
            eklenen += 1
    gecerli_kodlar = {c["kod"] for c in CEZALAR_2026}
    silinen = db.query(CezaTuru).filter(~CezaTuru.kod.in_(gecerli_kodlar)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "eklenen": eklenen, "guncellenen": guncellenen,
            "silinen_eski_kayit": silinen, "son_dogrulama": CEZA_SON_DOGRULAMA}


# --- IndexNow: içeriği arama motorlarına elle bildir ---
@router.post("/indexnow-ping")
def indexnow_ping(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Yayındaki tüm sayfaları IndexNow ile bildirir.

    Normalde makale yayımlandığında otomatik bildirim gider; bu uç toplu
    tazeleme (ör. çok sayıda içerik güncellendikten sonra) içindir.
    """
    if not indexnow.etkin():
        return {"success": False, "hata": "INDEXNOW_KEY tanımlı değil"}
    yollar = ["/", "/trafik-cezalari-2026", "/dilekce-ornekleri", "/araclar/ceza-hesapla", "/blog"]
    yollar += [f"/blog/{a.slug}" for a in db.query(Article).filter(Article.is_published == True).all()]
    yollar += [f"/dilekce-ornekleri/{s.slug}" for s in db.query(DilecceSablon).all()]
    adet = indexnow.bildir(yollar)
    return {"success": True, "bildirilen_url": adet}


# --- İstatistikler ---
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    from sqlalchemy import func
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_dilekce = db.query(DilecceSablon).count()
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0
    total_ceza = db.query(CezaTuru).count()
    top_pages = db.query(Article.slug, Article.title, Article.view_count).order_by(
        Article.view_count.desc()
    ).limit(10).all()

    # --- Ziyaretçi sayacı (routers/stats.py ile aynı kaynak) ---
    from datetime import date, timedelta
    from routers.stats import VISITORS_BASE, _online_count

    ziyaret_toplam = db.query(func.coalesce(func.sum(SiteVisit.tekil), 0)).scalar() or 0
    bugun_row = db.query(SiteVisit).filter(SiteVisit.gun == date.today()).first()
    son7 = db.query(SiteVisit).filter(
        SiteVisit.gun >= date.today() - timedelta(days=6)
    ).order_by(SiteVisit.gun).all()

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_views": total_views,
            "total_ceza": total_ceza,
            "top_pages": [{"slug": s, "title": t, "views": v} for s, t, v in top_pages],
            "ziyaretci_toplam": VISITORS_BASE + int(ziyaret_toplam),
            "ziyaretci_base": VISITORS_BASE,
            "ziyaretci_bugun": int(bugun_row.tekil) if bugun_row else 0,
            "ziyaretci_online": _online_count(),
            "ziyaretci_son7": [
                {"gun": v.gun.isoformat(), "tekil": v.tekil, "goruntulenme": v.goruntulenme}
                for v in son7
            ],
        }
    }

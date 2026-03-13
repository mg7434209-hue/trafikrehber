from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Article, DilecceSablon, CezaTuru, PageStat
from utils.auth import create_token, require_admin
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
    return {"success": True, "id": str(article.id)}

@router.put("/articles/{article_id}")
def update_article(article_id: str, data: ArticleCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(article, key, value)
    db.commit()
    return {"success": True}

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
    ALLOWED = {"aciklama", "taban_ceza_tl", "puan", "kanun_maddesi"}
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
CEZALAR_2026 = [
    {"kod": "H1",  "aciklama": "Kırmızı ışık ihlali",                   "taban_ceza_tl": 5000.0,   "puan": -10, "kanun_maddesi": "KTK 7574/Madde 1"},
    {"kod": "H2",  "aciklama": "Hız sınırı ihlali (%10-30)",             "taban_ceza_tl": 2719.0,   "puan": -5,  "kanun_maddesi": "KTK Madde 51/1-a"},
    {"kod": "H3",  "aciklama": "Hız sınırı ihlali (%30-50)",             "taban_ceza_tl": 5661.0,   "puan": -10, "kanun_maddesi": "KTK Madde 51/1-b"},
    {"kod": "H3B", "aciklama": "Hız sınırı ihlali (%50+)",               "taban_ceza_tl": 11631.0,  "puan": -20, "kanun_maddesi": "KTK Madde 51/1-c"},
    {"kod": "H4",  "aciklama": "Emniyet kemeri takmama",                 "taban_ceza_tl": 1246.0,   "puan": -5,  "kanun_maddesi": "KTK Madde 77"},
    {"kod": "H5",  "aciklama": "Cep telefonu kullanımı",                  "taban_ceza_tl": 5000.0,   "puan": -10, "kanun_maddesi": "KTK 7574/Madde 1"},
    {"kod": "H6",  "aciklama": "Park ihlali",                             "taban_ceza_tl": 828.0,    "puan": 0,   "kanun_maddesi": "KTK Madde 61"},
    {"kod": "H7",  "aciklama": "Alkollü araç kullanımı (0.51-1.00 promil)","taban_ceza_tl": 11631.0, "puan": -20, "kanun_maddesi": "KTK Madde 48/5"},
    {"kod": "H7B", "aciklama": "Alkollü araç kullanımı (1.00+ promil)",   "taban_ceza_tl": 23263.0,  "puan": -25, "kanun_maddesi": "KTK Madde 48/5"},
    {"kod": "H8",  "aciklama": "Yasak sollama",                           "taban_ceza_tl": 3310.0,   "puan": -10, "kanun_maddesi": "KTK Madde 47"},
    {"kod": "H9",  "aciklama": "Zorunlu sigorta yaptırmama",              "taban_ceza_tl": 4963.0,   "puan": 0,   "kanun_maddesi": "KTK Madde 91"},
    {"kod": "H10", "aciklama": "Muayenesiz araç kullanma",               "taban_ceza_tl": 1654.0,   "puan": 0,   "kanun_maddesi": "KTK Madde 35"},
    {"kod": "H11", "aciklama": "Ehliyetsiz araç kullanma",               "taban_ceza_tl": 23410.0,  "puan": 0,   "kanun_maddesi": "KTK Madde 36"},
    {"kod": "H12", "aciklama": "Trafikte saldırgan davranış",            "taban_ceza_tl": 180000.0, "puan": 0,   "kanun_maddesi": "KTK 7574/Madde 1"},
    {"kod": "H13", "aciklama": "Trafikte yarış / drift",                 "taban_ceza_tl": 46000.0,  "puan": 0,   "kanun_maddesi": "KTK 7574/Madde 2"},
    {"kod": "H14", "aciklama": "Kask takmama (motosiklet)",              "taban_ceza_tl": 1246.0,   "puan": -5,  "kanun_maddesi": "KTK Madde 77"},
    {"kod": "H15", "aciklama": "Yaya geçidine uymama",                   "taban_ceza_tl": 1246.0,   "puan": -5,  "kanun_maddesi": "KTK Madde 74"},
]

@router.post("/ceza-2026-yukle")
def ceza_2026_yukle(db: Session = Depends(get_db), _=Depends(require_admin)):
    eklenen = 0
    guncellenen = 0
    ALLOWED = {"aciklama", "taban_ceza_tl", "puan", "kanun_maddesi"}
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
    db.commit()
    return {"success": True, "eklenen": eklenen, "guncellenen": guncellenen}


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

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_views": total_views,
            "total_ceza": total_ceza,
            "top_pages": [{"slug": s, "title": t, "views": v} for s, t, v in top_pages]
        }
    }

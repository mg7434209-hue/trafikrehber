from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Article, DilecceSablon, CezaTuru, PageStat
from utils.auth import create_token, require_admin
import os
import uuid

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

@router.post("/ceza-turleri")
def create_ceza(data: CezaCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    ceza = CezaTuru(**data.dict())
    db.add(ceza)
    db.commit()
    return {"success": True, "id": str(ceza.id)}


# --- YDO ile Ceza Güncelleme ---
class YdoGuncelleRequest(BaseModel):
    oran: float  # Örnek: 25.49 → %25.49 artış
    yil: Optional[int] = None

@router.post("/ceza-ydo-guncelle")
def ceza_ydo_guncelle(req: YdoGuncelleRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    if req.oran <= 0 or req.oran > 200:
        raise HTTPException(status_code=400, detail="Geçersiz oran. 0-200 arasında olmalı.")
    cezalar = db.query(CezaTuru).all()
    if not cezalar:
        raise HTTPException(status_code=404, detail="Güncellenecek ceza kaydı bulunamadı.")
    carpan = 1 + (req.oran / 100)
    guncellenen = []
    for c in cezalar:
        eski = c.taban_ceza_tl
        c.taban_ceza_tl = round(eski * carpan, 2)
        guncellenen.append({"kod": c.kod, "aciklama": c.aciklama, "eski": eski, "yeni": c.taban_ceza_tl})
    db.commit()
    return {
        "success": True,
        "oran": req.oran,
        "guncellenen_sayisi": len(guncellenen),
        "detay": guncellenen
    }


# --- 2026 Güncel Ceza Değerlerini Yükle ---
@router.post("/ceza-2026-yukle")
def ceza_2026_yukle(db: Session = Depends(get_db), _=Depends(require_admin)):
    """
    27 Şubat 2026 tarihli 7574 sayılı Kanun ve YDO %25.49 ile güncel 2026 ceza tutarları.
    Mevcut kayıtları günceller, yoksa ekler.
    """
    CEZALAR_2026 = [
        {"kod": "H1",  "aciklama": "Kırmızı ışık ihlali",             "taban_ceza_tl": 5000.00, "puan": 20, "kanun_maddesi": "KTK Madde 47/1-a"},
        {"kod": "H2",  "aciklama": "Hız sınırı ihlali (%10-30)",       "taban_ceza_tl": 2719.00, "puan": 5,  "kanun_maddesi": "KTK Madde 51/1-a"},
        {"kod": "H3",  "aciklama": "Hız sınırı ihlali (%30-50)",       "taban_ceza_tl": 5661.00, "puan": 10, "kanun_maddesi": "KTK Madde 51/1-b"},
        {"kod": "H3B", "aciklama": "Hız sınırı ihlali (%50+)",         "taban_ceza_tl": 11631.00,"puan": 20, "kanun_maddesi": "KTK Madde 51/1-c"},
        {"kod": "H4",  "aciklama": "Emniyet kemeri takmama",           "taban_ceza_tl": 1246.00, "puan": 5,  "kanun_maddesi": "KTK Madde 70/1"},
        {"kod": "H5",  "aciklama": "Cep telefonu kullanımı",           "taban_ceza_tl": 5000.00, "puan": 10, "kanun_maddesi": "KTK Madde 65/a"},
        {"kod": "H6",  "aciklama": "Park ihlali",                      "taban_ceza_tl": 828.00,  "puan": 0,  "kanun_maddesi": "KTK Madde 61"},
        {"kod": "H7",  "aciklama": "Alkollü araç kullanımı (0.51-1.00 promil)", "taban_ceza_tl": 11631.00, "puan": 20, "kanun_maddesi": "KTK Madde 48/5"},
        {"kod": "H7B", "aciklama": "Alkollü araç kullanımı (1.00+ promil)",      "taban_ceza_tl": 23263.00, "puan": 25, "kanun_maddesi": "KTK Madde 48/5"},
        {"kod": "H8",  "aciklama": "Sollama ihlali",                   "taban_ceza_tl": 3310.00, "puan": 10, "kanun_maddesi": "KTK Madde 52"},
        {"kod": "H9",  "aciklama": "Zorunlu sigorta yaptırmama",       "taban_ceza_tl": 4963.00, "puan": 0,  "kanun_maddesi": "KTK Madde 91"},
        {"kod": "H10", "aciklama": "Araç muayenesi yaptırmama",        "taban_ceza_tl": 1654.00, "puan": 0,  "kanun_maddesi": "KTK Madde 35"},
        {"kod": "H11", "aciklama": "Ehliyetsiz araç kullanma",         "taban_ceza_tl": 23410.00,"puan": 0,  "kanun_maddesi": "KTK Madde 36"},
        {"kod": "H12", "aciklama": "Trafikte saldırgan davranış",      "taban_ceza_tl": 180000.00,"puan": 0, "kanun_maddesi": "KTK 7574/Madde 1"},
        {"kod": "H13", "aciklama": "Trafikte yarış / drift",           "taban_ceza_tl": 46000.00, "puan": 0, "kanun_maddesi": "KTK 7574/Madde 2"},
        {"kod": "H14", "aciklama": "Kask takmama (motosiklet)",        "taban_ceza_tl": 1246.00, "puan": 5,  "kanun_maddesi": "KTK Madde 70/2"},
        {"kod": "H15", "aciklama": "Yaya geçidinde yol vermeme",       "taban_ceza_tl": 1246.00, "puan": 10, "kanun_maddesi": "KTK Madde 74"},
    ]

    guncellenen, eklenen = 0, 0
    for c in CEZALAR_2026:
        existing = db.query(CezaTuru).filter(CezaTuru.kod == c["kod"]).first()
        if existing:
            for k, v in c.items():
                setattr(existing, k, v)
            guncellenen += 1
        else:
            db.add(CezaTuru(**c))
            eklenen += 1
    db.commit()
    return {
        "success": True,
        "mesaj": f"2026 ceza tutarları yüklendi. {eklenen} eklendi, {guncellenen} güncellendi.",
        "toplam": len(CEZALAR_2026)
    }


# --- Ceza Listesi (admin görünümü) ---
@router.get("/ceza-listesi")
def get_ceza_listesi(db: Session = Depends(get_db), _=Depends(require_admin)):
    cezalar = db.query(CezaTuru).order_by(CezaTuru.kod).all()
    return {
        "success": True,
        "cezalar": [
            {
                "id": str(c.id),
                "kod": c.kod,
                "aciklama": c.aciklama,
                "taban_ceza_tl": float(c.taban_ceza_tl),
                "indirimli_tl": round(float(c.taban_ceza_tl) * 0.75, 2),
                "puan": c.puan or 0,
                "kanun_maddesi": c.kanun_maddesi or ""
            }
            for c in cezalar
        ]
    }


# --- Ceza Güncelle (tekil) ---
class CezaGuncelleRequest(BaseModel):
    taban_ceza_tl: float
    puan: Optional[int] = None
    aciklama: Optional[str] = None

@router.put("/ceza-turleri/{ceza_id}")
def update_ceza(ceza_id: str, data: CezaGuncelleRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    ceza = db.query(CezaTuru).filter(CezaTuru.id == ceza_id).first()
    if not ceza:
        raise HTTPException(status_code=404, detail="Ceza bulunamadı")
    if data.taban_ceza_tl:
        ceza.taban_ceza_tl = data.taban_ceza_tl
    if data.puan is not None:
        ceza.puan = data.puan
    if data.aciklama:
        ceza.aciklama = data.aciklama
    db.commit()
    return {"success": True}


# --- İstatistikler ---
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    from sqlalchemy import func
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_dilekce = db.query(DilecceSablon).count()
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0
    top_pages = db.query(Article.slug, Article.title, Article.view_count).order_by(
        Article.view_count.desc()
    ).limit(10).all()

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_views": total_views,
            "top_pages": [{"slug": s, "title": t, "views": v} for s, t, v in top_pages]
        }
    }

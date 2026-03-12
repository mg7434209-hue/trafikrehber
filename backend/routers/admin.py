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

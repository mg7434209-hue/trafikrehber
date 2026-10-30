from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Article, PageStat
from utils.icerik import isle, veri_yili
import uuid

router = APIRouter()

class ArticleOut(BaseModel):
    id: str
    slug: str
    title: str
    meta_description: Optional[str]
    content: Optional[str]
    category: Optional[str]
    tags: Optional[List[str]]
    is_featured: Optional[bool]
    view_count: int
    reading_time_min: int
    author: str
    featured_image_url: Optional[str]
    schema_type: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True


# Kaldırılan / birleştirilen eski adresler → güncel yazı. server.js aynı
# tabloyla 301 verir; burada SPA içi gezinmede (eski bağlantı) 404 olmasın diye
# çözülür. Yayınlanmış slug SİLİNMEZ, buraya taşınır.
ESKI_SLUG = {
    "trafik-cezasi-tutarlari-2025": "trafik-cezasi-tutarlari",
    "trafik-cezasi-sorgulama-e-devlet": "trafik-cezasi-e-devlet-sorgulama",
}


def article_to_dict(a: Article, include_content=True, db: Session = None):
    # db verilirse {{yil}} / {{ceza:H1}} … yer tutucuları güncel değerle
    # doldurulur (utils/icerik.py). Admin uçları HAM metni kullanır.
    f = (lambda m: isle(m, db)) if db is not None else (lambda m: m)
    return {
        "id": str(a.id),
        "slug": a.slug,
        "title": f(a.title),
        "meta_description": f(a.meta_description),
        "content": f(a.content) if include_content else None,
        "category": a.category,
        "tags": a.tags or [],
        "is_featured": a.is_featured,
        "view_count": a.view_count,
        "reading_time_min": a.reading_time_min,
        "author": a.author,
        "featured_image_url": a.featured_image_url,
        "schema_type": a.schema_type,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }


@router.get("")
def get_articles(
    page: int = Query(1, ge=1),
    limit: int = Query(12, le=50),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Article).filter(Article.is_published == True)
    if category:
        q = q.filter(Article.category == category)
    total = q.count()
    articles = q.order_by(Article.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "success": True,
        "total": total,
        "page": page,
        "articles": [article_to_dict(a, include_content=False, db=db) for a in articles]
    }


@router.get("/featured")
def get_featured(db: Session = Depends(get_db)):
    articles = db.query(Article).filter(
        Article.is_published == True,
        Article.is_featured == True
    ).order_by(Article.created_at.desc()).limit(6).all()
    return {"success": True, "articles": [article_to_dict(a, include_content=False, db=db) for a in articles]}


@router.get("/search")
def search_articles(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    # Başlıklarda yıl "{{yil}}" olarak saklanır; "hız cezası 2026" araması
    # yıl yüzünden boş dönmesin diye veri yılı sorgudan çıkarılır.
    yalin = " ".join(q.replace(str(veri_yili()), " ").split())
    if len(yalin) >= 2:
        q = yalin
    results = db.query(Article).filter(
        Article.is_published == True,
        or_(
            Article.title.ilike(f"%{q}%"),
            Article.meta_description.ilike(f"%{q}%"),
            Article.content.ilike(f"%{q}%")
        )
    ).limit(10).all()
    return {"success": True, "results": [article_to_dict(a, include_content=False, db=db) for a in results]}


@router.get("/category/{category}")
def get_by_category(category: str, db: Session = Depends(get_db)):
    articles = db.query(Article).filter(
        Article.is_published == True,
        Article.category == category
    ).order_by(Article.created_at.desc()).all()
    return {"success": True, "articles": [article_to_dict(a, include_content=False, db=db) for a in articles]}


@router.get("/{slug}")
def get_article(slug: str, say: int = Query(1), db: Session = Depends(get_db)):
    # say=0: okunma sayılmaz. frontend server.js başlık/gövde üretmek için
    # makaleyi bot ve önbellek yenilemesiyle de çeker; bunlar "görüntülenme"
    # olarak sayılmasın (admin panelindeki sayılar gerçek ziyaretçi olsun).
    slug = ESKI_SLUG.get(slug, slug)
    article = db.query(Article).filter(Article.slug == slug, Article.is_published == True).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")
    if not say:
        return {
            "success": True,
            "article": article_to_dict(article, db=db),
            "related": [article_to_dict(a, include_content=False, db=db) for a in db.query(Article).filter(
                Article.is_published == True, Article.category == article.category, Article.id != article.id).limit(3).all()],
        }

    # Görüntülenme sayısını artır. updated_at AÇIKÇA korunur: kolonun
    # onupdate=now() kuralı her okumada "güncellendi" damgası basıyor, sitemap
    # lastmod'u anlamsızlaştırıyordu (Google güvenilmez lastmod'u yok sayar).
    db.query(Article).filter(Article.id == article.id).update(
        {Article.view_count: Article.view_count + 1, Article.updated_at: Article.updated_at},
        synchronize_session=False,
    )
    db.add(PageStat(page_slug=slug))
    db.commit()
    db.refresh(article)

    # İlgili makaleler
    related = db.query(Article).filter(
        Article.is_published == True,
        Article.category == article.category,
        Article.id != article.id
    ).limit(3).all()

    return {
        "success": True,
        "article": article_to_dict(article, db=db),
        "related": [article_to_dict(a, include_content=False, db=db) for a in related]
    }

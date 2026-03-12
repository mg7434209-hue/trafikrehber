from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import Article, PageStat
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


def article_to_dict(a: Article, include_content=True):
    return {
        "id": str(a.id),
        "slug": a.slug,
        "title": a.title,
        "meta_description": a.meta_description,
        "content": a.content if include_content else None,
        "category": a.category,
        "tags": a.tags or [],
        "is_featured": a.is_featured,
        "view_count": a.view_count,
        "reading_time_min": a.reading_time_min,
        "author": a.author,
        "featured_image_url": a.featured_image_url,
        "schema_type": a.schema_type,
        "created_at": a.created_at.isoformat() if a.created_at else None,
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
        "articles": [article_to_dict(a, include_content=False) for a in articles]
    }


@router.get("/featured")
def get_featured(db: Session = Depends(get_db)):
    articles = db.query(Article).filter(
        Article.is_published == True,
        Article.is_featured == True
    ).order_by(Article.created_at.desc()).limit(6).all()
    return {"success": True, "articles": [article_to_dict(a, include_content=False) for a in articles]}


@router.get("/search")
def search_articles(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    results = db.query(Article).filter(
        Article.is_published == True,
        or_(
            Article.title.ilike(f"%{q}%"),
            Article.meta_description.ilike(f"%{q}%"),
            Article.content.ilike(f"%{q}%")
        )
    ).limit(10).all()
    return {"success": True, "results": [article_to_dict(a, include_content=False) for a in results]}


@router.get("/category/{category}")
def get_by_category(category: str, db: Session = Depends(get_db)):
    articles = db.query(Article).filter(
        Article.is_published == True,
        Article.category == category
    ).order_by(Article.created_at.desc()).all()
    return {"success": True, "articles": [article_to_dict(a, include_content=False) for a in articles]}


@router.get("/{slug}")
def get_article(slug: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.slug == slug, Article.is_published == True).first()
    if not article:
        raise HTTPException(status_code=404, detail="Makale bulunamadı")

    # Görüntülenme sayısını artır
    article.view_count = (article.view_count or 0) + 1
    stat = PageStat(page_slug=slug)
    db.add(stat)
    db.commit()

    # İlgili makaleler
    related = db.query(Article).filter(
        Article.is_published == True,
        Article.category == article.category,
        Article.id != article.id
    ).limit(3).all()

    return {
        "success": True,
        "article": article_to_dict(article),
        "related": [article_to_dict(a, include_content=False) for a in related]
    }

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Article, DilecceSablon

router = APIRouter()

@router.get("/public")
def get_public_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_dilekce = db.query(DilecceSablon).count()
    total_downloads = db.query(func.sum(DilecceSablon.indirme_sayisi)).scalar() or 0
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_downloads": int(total_downloads),
            "total_views": int(total_views),
        }
    }

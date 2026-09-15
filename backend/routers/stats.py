from hashlib import sha256
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, UUID4, ConfigDict
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import get_db
from models import Article, DilecceSablon, CezaTuru, SiteVisitor

router = APIRouter()
VISITOR_BASE = 1000

class VisitRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    visitor_id: UUID4

def visitor_stats(db):
    count = db.query(func.count(SiteVisitor.visitor_hash)).scalar()
    return {"total_visitors": VISITOR_BASE + count, "initial_count": VISITOR_BASE}

@router.get("/visitors")
def get_visitors(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    return {"success": True, **visitor_stats(db)}

@router.post("/visit")
def record_visit(data: VisitRequest, response: Response, db: Session = Depends(get_db)):
    hashed = sha256(str(data.visitor_id).encode("ascii")).hexdigest()
    # Unique primary key prevents races, duplicate tabs and refresh inflation.
    try:
        with db.begin_nested():
            db.add(SiteVisitor(visitor_hash=hashed))
            db.flush()
    except IntegrityError:
        if db.get(SiteVisitor, hashed) is None:
            raise
    db.commit()
    response.headers["Cache-Control"] = "no-store"
    return {"success": True, **visitor_stats(db)}

@router.get("/public")
def get_public_stats(db: Session = Depends(get_db)):
    return {"success": True, "stats": {
        "total_articles": db.query(Article).filter(Article.is_published.is_(True)).count(),
        "total_dilekce": db.query(DilecceSablon).count(),
        "total_downloads": int(db.query(func.sum(DilecceSablon.indirme_sayisi)).scalar() or 0),
        "total_views": int(db.query(func.sum(Article.view_count)).scalar() or 0),
        "total_ceza": db.query(CezaTuru).count(),
        **visitor_stats(db),
    }}

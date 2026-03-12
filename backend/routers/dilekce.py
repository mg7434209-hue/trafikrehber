from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import DilecceSablon
import uuid

router = APIRouter()


def sablon_to_dict(s: DilecceSablon, include_content=True):
    return {
        "id": str(s.id),
        "slug": s.slug,
        "baslik": s.baslik,
        "aciklama": s.aciklama,
        "sablon_icerik": s.sablon_icerik if include_content else None,
        "kategori": s.kategori,
        "indirme_sayisi": s.indirme_sayisi,
        "premium": s.premium,
        "ilgili_kanun": s.ilgili_kanun,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


@router.get("")
def get_dilekce_list(
    kategori: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(DilecceSablon)
    if kategori:
        q = q.filter(DilecceSablon.kategori == kategori)
    sablonlar = q.order_by(DilecceSablon.indirme_sayisi.desc()).all()
    return {"success": True, "sablonlar": [sablon_to_dict(s, include_content=False) for s in sablonlar]}


@router.get("/{slug}")
def get_dilekce(slug: str, db: Session = Depends(get_db)):
    sablon = db.query(DilecceSablon).filter(DilecceSablon.slug == slug).first()
    if not sablon:
        raise HTTPException(status_code=404, detail="Şablon bulunamadı")

    # İlgili şablonlar
    related = db.query(DilecceSablon).filter(
        DilecceSablon.kategori == sablon.kategori,
        DilecceSablon.id != sablon.id
    ).limit(3).all()

    return {
        "success": True,
        "sablon": sablon_to_dict(sablon),
        "related": [sablon_to_dict(s, include_content=False) for s in related]
    }


@router.get("/{slug}/download")
def download_dilekce(slug: str, db: Session = Depends(get_db)):
    sablon = db.query(DilecceSablon).filter(DilecceSablon.slug == slug).first()
    if not sablon:
        raise HTTPException(status_code=404, detail="Şablon bulunamadı")
    if sablon.premium:
        raise HTTPException(status_code=402, detail="Bu şablon premium içeriktir")

    # İndirme sayacını artır
    sablon.indirme_sayisi = (sablon.indirme_sayisi or 0) + 1
    db.commit()

    # Düz metin olarak indir
    content = sablon.sablon_icerik or ""
    filename = f"{sablon.slug}.txt"
    
    return PlainTextResponse(
        content=content,
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/plain; charset=utf-8"
        }
    )

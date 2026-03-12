from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import CezaTuru

router = APIRouter()


def ceza_to_dict(c: CezaTuru):
    return {
        "id": str(c.id),
        "kod": c.kod,
        "aciklama": c.aciklama,
        "taban_ceza_tl": float(c.taban_ceza_tl) if c.taban_ceza_tl else 0,
        "puan": c.puan,
        "kanun_maddesi": c.kanun_maddesi,
    }


@router.get("")
def get_ceza_turleri(db: Session = Depends(get_db)):
    cezalar = db.query(CezaTuru).order_by(CezaTuru.aciklama).all()
    return {"success": True, "cezalar": [ceza_to_dict(c) for c in cezalar]}


@router.get("/{ceza_id}/hesapla")
def hesapla_ceza(ceza_id: str, db: Session = Depends(get_db)):
    ceza = db.query(CezaTuru).filter(CezaTuru.id == ceza_id).first()
    if not ceza:
        raise HTTPException(status_code=404, detail="Ceza türü bulunamadı")

    taban = float(ceza.taban_ceza_tl) if ceza.taban_ceza_tl else 0
    erken_odeme = round(taban * 0.75, 2)   # %25 indirim (15 gün içinde)
    taksit_2 = round(taban / 2, 2)
    taksit_3 = round(taban / 3, 2)

    return {
        "success": True,
        "ceza": ceza_to_dict(ceza),
        "hesaplama": {
            "taban_tutar": taban,
            "erken_odeme_indirimi": erken_odeme,
            "erken_odeme_aciklama": "15 gün içinde ödenirse %25 indirim uygulanır",
            "taksit_2": taksit_2,
            "taksit_3": taksit_3,
        }
    }

"""İletişim formu — e-posta adresi olmadan çalışan gerçek iletişim kanalı.

Mesaj `iletisim_mesajlari` tablosuna yazılır; yönetici panelindeki "Mesajlar"
sekmesinde okunur (routers/admin.py). KVKK: ham IP saklanmaz; günlük gönderim
sınırı karma anahtarla uygulanır; mesajlar 12 ay sonra silinir.
Spam: gizli alan (honeypot) ve çok hızlı gönderim sessizce düşürülür (bot
başarılı sanır); kişi başı günde en fazla 5 mesaj.
"""
import re
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from database import get_db
from models import IletisimGunluk, IletisimMesaji
from routers.stats import VISITOR_SALT, _client_ip, tr_bugun
import hashlib

router = APIRouter()

KONULAR = {"duzeltme", "oneri", "kvkk", "isbirligi", "diger"}
GUNLUK_SINIR = 5
SAKLAMA_GUN = 365
EPOSTA_RE = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,200}\.[^@\s]{2,}$")


class MesajGirdi(BaseModel):
    konu: str
    mesaj: str
    ad: str = ""
    eposta: str = ""
    web: str = ""          # honeypot: gerçek kullanıcı görmez, boş kalır
    gecen_ms: int = 0      # form açıldığından beri geçen süre


@router.post("")
def mesaj_gonder(g: MesajGirdi, request: Request, db: Session = Depends(get_db)):
    mesaj, ad, eposta = g.mesaj.strip(), g.ad.strip(), g.eposta.strip()
    if g.konu not in KONULAR:
        raise HTTPException(status_code=422, detail="Geçersiz konu.")
    if not (10 <= len(mesaj) <= 2000):
        raise HTTPException(status_code=422, detail="Mesaj 10 ile 2000 karakter arasında olmalı.")
    if len(ad) > 80 or len(eposta) > 120 or (eposta and not EPOSTA_RE.match(eposta)):
        raise HTTPException(status_code=422, detail="Ad ya da e-posta geçersiz.")
    # Bot: honeypot dolu ya da 2 sn'den hızlı → başarılı görünüp kaydedilmez
    if g.web or g.gecen_ms < 2000:
        return {"success": True}

    gun = tr_bugun()
    ham = f"iletisim|{_client_ip(request)}|{request.headers.get('user-agent', '')}|{gun.isoformat()}|{VISITOR_SALT}"
    anahtar = hashlib.sha256(ham.encode("utf-8")).hexdigest()
    try:
        tablo = IletisimGunluk.__table__
        db.execute(
            pg_insert(tablo).values(id=uuid.uuid4(), gun=gun, anahtar=anahtar, sayi=1)
            .on_conflict_do_update(index_elements=["gun", "anahtar"], set_={"sayi": tablo.c.sayi + 1})
        )
        sayi = db.query(IletisimGunluk.sayi).filter(IletisimGunluk.gun == gun, IletisimGunluk.anahtar == anahtar).scalar() or 0
        if sayi > GUNLUK_SINIR:
            db.commit()
            raise HTTPException(status_code=429, detail="Bugün çok fazla mesaj gönderdiniz. Yarın tekrar deneyin.")
        db.add(IletisimMesaji(konu=g.konu, ad=ad or None, eposta=eposta or None, mesaj=mesaj))
        db.query(IletisimGunluk).filter(IletisimGunluk.gun < gun - timedelta(days=2)).delete(synchronize_session=False)
        db.query(IletisimMesaji).filter(IletisimMesaji.created_at < _simdi_eksi(SAKLAMA_GUN)).delete(synchronize_session=False)
        db.commit()
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        print(f"[iletisim] yazılamadı: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=503, detail="Mesaj şu anda kaydedilemiyor. Lütfen sonra tekrar deneyin.") from exc
    return {"success": True}


def _simdi_eksi(gun: int):
    from datetime import datetime, timezone
    return datetime.now(timezone.utc) - timedelta(days=gun)

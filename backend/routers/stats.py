"""
Ziyaretçi sayacı + genel istatistikler.

SAYAÇ MANTIĞI (gespaenerji.com'daki footer sayacıyla AYNI mantık):
  • Tekil ziyaretçi GÜNDE 1 KEZ sayılır. Kimlik yerine
    sha256(IP + User-Agent + gün + tuz) karması saklanır — ham IP
    veritabanına HİÇ yazılmaz (KVKK).
  • Bot/tarayıcı olmayan istekler User-Agent süzgeciyle elenir.
  • "Şu an sitede" = son 5 dakikada ping atan tekil anahtar sayısı
    (yalnız bellekte tutulur, veritabanına yazılmaz).
  • Gösterilen toplam = VISITORS_BASE (taban) + veritabanı sayacı.
    Veritabanı sıfırlansa bile sayaç geriye düşmesin diye taban
    ortam değişkeniyle taşınır (Railway → Variables → VISITORS_BASE).
  • Toplamlar 30 sn bellekte önbelleklenir; ping trafiği veritabanını
    yormaz (yeni tekil ziyaretçi yoksa hiç yazma yapılmaz).

Uçlar:
  POST /api/stats/visit     → ziyaret bildirir, güncel sayaçları döner
  GET  /api/stats/visitors  → yalnız okuma (sayım yapmaz)
  GET  /api/stats/public    → site geneli istatistikler + ziyaretçi
"""

import hashlib
import os
import re
import time
import uuid
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from database import get_db
from models import Article, DilecceSablon, SiteVisit, VisitorKey

router = APIRouter()

# Bot süzgeci — gespaenerji server.js'teki BOT_RE ile aynı liste
BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|preview|scan|monitor|probe|fetch|curl|wget|python|"
    r"node-fetch|axios|headless|lighthouse|pingdom|facebookexternal|whatsapp|telegram",
    re.I,
)

ONLINE_WINDOW_SEC = 5 * 60          # son 5 dk istek atan = "şu an sitede"
CACHE_TTL_SEC = 30                  # toplamlar bu süre boyunca bellekten okunur
KEY_RETENTION_DAYS = 7              # tekillik anahtarlarının saklama süresi
PRUNE_EVERY_SEC = 3600              # temizlik en fazla saatte bir çalışır

VISITORS_BASE = int(os.getenv("VISITORS_BASE", "0") or 0)
VISITOR_SALT = os.getenv("VISITOR_SALT") or os.getenv("JWT_SECRET", "trafikrehber-salt")

_online: dict = {}                  # anahtar → son istek zamanı (bellek)
_cache = {"t": 0.0, "toplam": 0, "bugun": 0, "goruntulenme": 0}
_last_prune = 0.0


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    real = request.headers.get("x-real-ip", "")
    if real:
        return real.strip()
    return request.client.host if request.client else "?"


def _visitor_key(request: Request, gun: date) -> str:
    ham = f"{_client_ip(request)}|{request.headers.get('user-agent', '')}|{gun.isoformat()}|{VISITOR_SALT}"
    return hashlib.sha256(ham.encode("utf-8")).hexdigest()


def _online_count() -> int:
    simdi = time.time()
    for k, t in list(_online.items()):
        if simdi - t > ONLINE_WINDOW_SEC:
            _online.pop(k, None)
    return len(_online)


def _totals(db: Session, force: bool = False) -> dict:
    """Toplamları döner; 30 sn önbellekli."""
    simdi = time.time()
    if not force and simdi - _cache["t"] < CACHE_TTL_SEC:
        return _cache
    toplam = db.query(func.coalesce(func.sum(SiteVisit.tekil), 0)).scalar() or 0
    goruntulenme = db.query(func.coalesce(func.sum(SiteVisit.goruntulenme), 0)).scalar() or 0
    bugun_row = db.query(SiteVisit).filter(SiteVisit.gun == date.today()).first()
    _cache.update({
        "t": simdi,
        "toplam": int(toplam),
        "bugun": int(bugun_row.tekil) if bugun_row else 0,
        "goruntulenme": int(goruntulenme),
    })
    return _cache


def _prune(db: Session) -> None:
    """Eski tekillik anahtarlarını temizler (tablo şişmesin)."""
    global _last_prune
    simdi = time.time()
    if simdi - _last_prune < PRUNE_EVERY_SEC:
        return
    _last_prune = simdi
    try:
        db.query(VisitorKey).filter(
            VisitorKey.gun < date.today() - timedelta(days=KEY_RETENTION_DAYS)
        ).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()


def _cevap(db: Session, force: bool = False) -> dict:
    t = _totals(db, force=force)
    return {
        "success": True,
        "toplam": VISITORS_BASE + t["toplam"],
        "bugun": t["bugun"],
        "online": _online_count(),
        "goruntulenme": t["goruntulenme"],
        "base": VISITORS_BASE,
    }


class VisitRequest(BaseModel):
    sayfa: Optional[str] = None     # dolu ise sayfa görüntülenmesi de sayılır
                                    # (boş = yalnız "şu an sitede" tazeleme pingi)


@router.post("/visit")
def kaydet_ziyaret(req: VisitRequest, request: Request, db: Session = Depends(get_db)):
    ua = request.headers.get("user-agent", "")
    if not ua or BOT_RE.search(ua):
        # Bot: sayma, yalnız güncel değerleri dön
        return _cevap(db)

    gun = date.today()
    anahtar = _visitor_key(request, gun)
    _online[anahtar] = time.time()

    yeni_tekil = 0
    try:
        sonuc = db.execute(
            pg_insert(VisitorKey.__table__)
            .values(id=uuid.uuid4(), gun=gun, anahtar=anahtar)
            .on_conflict_do_nothing(index_elements=["gun", "anahtar"])
        )
        yeni_tekil = 1 if sonuc.rowcount else 0

        sayfa_artis = 1 if req.sayfa else 0
        if yeni_tekil or sayfa_artis:
            tablo = SiteVisit.__table__
            db.execute(
                pg_insert(tablo)
                .values(id=uuid.uuid4(), gun=gun, tekil=yeni_tekil, goruntulenme=sayfa_artis)
                .on_conflict_do_update(
                    index_elements=["gun"],
                    set_={
                        "tekil": tablo.c.tekil + yeni_tekil,
                        "goruntulenme": tablo.c.goruntulenme + sayfa_artis,
                    },
                )
            )
        db.commit()
    except Exception:
        db.rollback()
        return _cevap(db)

    _prune(db)
    # Yeni ziyaretçi sayıldıysa önbelleği tazele (rozet anında artsın)
    return _cevap(db, force=bool(yeni_tekil))


@router.get("/visitors")
def get_visitors(db: Session = Depends(get_db)):
    return _cevap(db)


@router.get("/public")
def get_public_stats(db: Session = Depends(get_db)):
    total_articles = db.query(Article).filter(Article.is_published == True).count()
    total_dilekce = db.query(DilecceSablon).count()
    total_downloads = db.query(func.sum(DilecceSablon.indirme_sayisi)).scalar() or 0
    total_views = db.query(func.sum(Article.view_count)).scalar() or 0
    ziyaret = _totals(db)

    return {
        "success": True,
        "stats": {
            "total_articles": total_articles,
            "total_dilekce": total_dilekce,
            "total_downloads": int(total_downloads),
            "total_views": int(total_views),
            "ziyaretci_toplam": VISITORS_BASE + ziyaret["toplam"],
            "ziyaretci_bugun": ziyaret["bugun"],
            "ziyaretci_online": _online_count(),
        },
    }
